import { NextRequest, NextResponse } from 'next/server'
import { checkApiKey } from '@/lib/api-auth'
import { serverSupabase } from '@/lib/supabase-server'
import { rankAllHudListings, type TriageListing, type BuyerCriteria } from '@/lib/groq'

// Server-side only — GROQ_API_KEY never reaches the browser. The client
// already has the HUD listings loaded (from GET /api/hud-listings) and sends
// the ones it wants scored in the request body, rather than this route
// re-fetching the whole HUD dataset itself.
export async function POST(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  let body: { listings?: TriageListing[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const listings = body.listings
  if (!Array.isArray(listings) || listings.length === 0) {
    return NextResponse.json({ error: 'listings array is required and must be non-empty' }, { status: 422 })
  }

  const db = serverSupabase()
  const { data: buyers, error } = await db.from('buyers').select('name, buyer_type, areas, min_price, max_price, prop_types')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!buyers || buyers.length === 0) {
    return NextResponse.json({ error: 'No buyers in the CRM yet — add at least one buyer with criteria before triaging HUD listings against them.' }, { status: 422 })
  }

  try {
    const scores = await rankAllHudListings(listings, buyers as BuyerCriteria[])
    return NextResponse.json({ scores })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Triage failed' }, { status: 502 })
  }
}
