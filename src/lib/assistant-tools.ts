import { serverSupabase } from '@/lib/supabase-server'
import type { GroqToolDef } from '@/lib/groq'

// Tool definitions (OpenAI-compatible "function" shape — same as Groq's
// chat-completions tools param) + the real functions that execute them.
// Keep this file as the single source of truth for both: the schema the
// model sees and the code that actually runs must never drift apart, or
// the model will request arguments your code doesn't handle.

export const ASSISTANT_TOOLS: GroqToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'search_properties',
      description: 'Search the CRM\'s property leads. All filters are optional and combine with AND — omit any you don\'t need. Returns up to 20 matches plus a total count.',
      // Every property allows null, not just omission — Groq's own server-side
      // schema validation rejects a tool call outright if the model sends
      // {"state": null} against a plain {"type": "string"} field (confirmed:
      // this model does send explicit nulls for filters it isn't using,
      // rather than omitting the key). None of these are `required`, so a
      // well-behaved model should omit them — but the schema has to tolerate
      // it sending null anyway, since nothing stops it from doing so.
      parameters: {
        type: 'object',
        properties: {
          status: { type: ['string', 'null'], enum: ['lead', 'active', 'probate', 'foreclosure', 'auction', null], description: 'Lead status' },
          state: { type: ['string', 'null'], description: 'Two-letter US state abbreviation, e.g. TX' },
          query: { type: ['string', 'null'], description: 'Free-text search across address, owner name, and phone' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_property',
      description: 'Get full details for one specific property by address (partial match is fine) — includes notes, follow-up history, and key dates. Use this after search_properties has narrowed down to one address, or when the user names a specific address directly.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'The property address, or a distinctive fragment of it' },
        },
        required: ['address'],
      },
    },
  },
]

export async function executeSearchProperties(args: { status?: string | null; state?: string | null; query?: string | null }) {
  const db = serverSupabase()
  let q = db.from('properties').select('address, status, owner_name, phone, next_followup, created_at')
  if (args.status) q = q.eq('status', args.status)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200)
  if (error) return { error: error.message }

  let rows = data || []
  // state/query filters applied in-memory — address is a single free-text
  // column (no separate state column on properties), so there's no clean
  // SQL filter for "state" the way there is for `status`.
  if (args.state) {
    const s = args.state.toUpperCase()
    rows = rows.filter(p => p.address?.toUpperCase().includes(` ${s} `) || p.address?.toUpperCase().includes(`, ${s} `) || p.address?.toUpperCase().endsWith(` ${s}`))
  }
  if (args.query) {
    const q2 = args.query.toLowerCase()
    rows = rows.filter(p => [p.address, p.owner_name, p.phone].join(' ').toLowerCase().includes(q2))
  }

  return { count: rows.length, properties: rows.slice(0, 20) }
}

export async function executeGetProperty(args: { address: string }) {
  if (!args.address) return { error: 'address is required' }
  const db = serverSupabase()
  const { data, error } = await db.from('properties').select('*').ilike('address', `%${args.address}%`).limit(5)
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { found: false, message: `No property found matching "${args.address}"` }
  if (data.length > 1) return { found: 'multiple', message: `${data.length} properties match "${args.address}" — be more specific`, addresses: data.map(p => p.address) }
  return { found: true, property: data[0] }
}

export async function executeTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'search_properties': return executeSearchProperties(args)
    case 'get_property': return executeGetProperty(args as { address: string })
    default: return { error: `Unknown tool: ${name}` }
  }
}
