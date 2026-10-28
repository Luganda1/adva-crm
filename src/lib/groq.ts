// Groq hosts open-weight models for free (no credit card) — chosen specifically
// because this project has no budget for a paid AI API. See TECHNICAL.md §11
// for the provider comparison that led here, and §15 TODO 9 for the full spec.
//
// This is a thin fetch() wrapper, not an SDK — Groq's API is OpenAI-compatible,
// and the request is simple enough that a dependency isn't worth it. Same
// lightweight-integration pattern as lib/hud-reo.ts.
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Verified against GET /v1/models on 2026-10-27 — Groq's catalog changes
// (the model this was originally speced against, llama-3.3-70b-versatile,
// was already gone by the time we built this). If this starts 404ing with
// "model_not_found", re-check https://console.groq.com for what's current.
const MODEL = 'openai/gpt-oss-120b'

export interface TriageListing {
  caseNum: string
  address: string
  city: string | null
  state: string | null
  zip: string | null
}

export interface BuyerCriteria {
  name: string
  buyer_type: string
  areas: string | null
  min_price: number | null
  max_price: number | null
  prop_types: string[]
}

export interface TriageResult {
  caseNum: string
  score: number
  reason: string
}

function buildSystemPrompt(buyers: BuyerCriteria[]): string {
  const buyerLines = buyers.map(b => {
    const price = `$${b.min_price ?? '?'}-$${b.max_price ?? '?'}`
    const types = b.prop_types.length ? b.prop_types.join(', ') : 'any'
    return `- ${b.name} (${b.buyer_type}): areas=${b.areas || 'any'}, price=${price}, types=${types}`
  }).join('\n')

  return [
    'You score HUD-owned foreclosure listings against real estate buyers\' stated criteria, to help a wholesaler prioritize which listings to look into first.',
    'You are given ONLY address/city/state/zip/case number for each listing — no price, beds, baths, or condition (HUD\'s own data doesn\'t include those).',
    'Score primarily on location fit against the buyers\' stated areas. When a buyer has a price or property-type requirement, say plainly in the reason that it can\'t be evaluated from what you were given — never invent a price, condition, or property detail you weren\'t told.',
    '',
    'Buyers:',
    buyerLines || '(none configured)',
    '',
    'Respond ONLY as a JSON object: {"scores": [{"caseNum": "...", "score": 0-100, "reason": "one short sentence"}, ...]} — exactly one entry per listing given, in the same order.',
  ].join('\n')
}

// Measured empirically, not assumed: a 221-listing / 9-batch run hit this
// exact error mid-run —
//   "Rate limit reached ... on tokens per minute (TPM): Limit 8000, Used
//   6566, Requested 1646. Please try again in 1.589999999s."
// — proving the 8,000 tokens/minute ceiling is real and the naive sequential
// loop below needs to handle it, not just budget around it ahead of time.
// Groq's 429 body states exactly how long to wait; parse that when present
// instead of guessing a fixed delay.
function parseRetryAfterSeconds(errorBody: string): number {
  const m = errorBody.match(/try again in ([\d.]+)s/)
  return m ? Math.ceil(parseFloat(m[1])) + 1 : 5 // +1s safety margin; 5s fallback if the message shape ever changes
}

// Scores one batch in a single request, retrying once on a 429 (rate limit)
// after waiting however long Groq says to. Callers should batch via
// rankAllHudListings() below rather than call this directly.
export async function rankHudListingsBatch(listings: TriageListing[], buyers: BuyerCriteria[], _retried = false): Promise<TriageResult[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')
  if (listings.length === 0) return []

  const userContent = listings
    .map(l => `${l.caseNum}: ${l.address}, ${l.city ?? ''}, ${l.state ?? ''} ${l.zip ?? ''}`.trim())
    .join('\n')

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      reasoning_effort: 'low', // cuts token overhead ~4x on this task with no measured quality loss — see TECHNICAL.md
      messages: [
        { role: 'system', content: buildSystemPrompt(buyers) },
        { role: 'user', content: userContent },
      ],
    }),
  })

  if (res.status === 429 && !_retried) {
    const body = await res.text().catch(() => '')
    const waitSeconds = parseRetryAfterSeconds(body)
    await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000))
    return rankHudListingsBatch(listings, buyers, true) // one retry only — a second 429 in a row means something else is wrong, surface it
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Groq API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Groq response missing message content')

  let parsed: { scores?: unknown }
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Groq returned invalid JSON in message content')
  }
  if (!Array.isArray(parsed.scores)) throw new Error('Groq response missing a "scores" array')

  return parsed.scores as TriageResult[]
}

// Batches ~25 listings per request to stay well inside the 8,000 tokens/minute
// free-tier limit (measured: a 3-listing batch used 419 tokens; a 25-listing
// batch projects to ~1,400 — comfortable headroom, several batches/minute).
// Sequential, not parallel — simplest thing that stays under the rate limit
// without needing explicit backoff logic; revisit if real usage shows it's
// too slow for ~600 listings.
export async function rankAllHudListings(listings: TriageListing[], buyers: BuyerCriteria[], batchSize = 25): Promise<TriageResult[]> {
  const results: TriageResult[] = []
  for (let i = 0; i < listings.length; i += batchSize) {
    const batch = listings.slice(i, i + batchSize)
    const batchResults = await rankHudListingsBatch(batch, buyers)
    results.push(...batchResults)
  }
  return results
}
