import { serverSupabase } from '@/lib/supabase-server'

// HUD publishes its FHA Single Family REO (foreclosed, HUD-owned) inventory
// as a free, public, no-auth ArcGIS FeatureServer — a real official dataset,
// not a scraper. No price/beds/baths (just address + case metadata); run
// through /api/enrich or Property Search afterward for the rest.
// https://catalog.data.gov/dataset/fha-single-family-reo-properties-for-sale
const HUD_REO_FEATURE_SERVER =
  'https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/SF_REO/FeatureServer/0/query'

const FIELDS = [
  'CASE_NUM', 'STREET_NUM', 'DIRECTION_PREFIX', 'STREET_NAME',
  'CITY', 'STATE_CODE', 'DISPLAY_ZIP_CODE', 'DATE_ACQUIRED',
].join(',')

interface HudAttributes {
  CASE_NUM: string | null
  STREET_NUM: string | null
  DIRECTION_PREFIX: string | null
  STREET_NAME: string | null
  CITY: string | null
  STATE_CODE: string | null
  DISPLAY_ZIP_CODE: number | string | null
  DATE_ACQUIRED: number | null // epoch millis
}

export interface HudListing {
  address: string
  notes: string
}

function assembleHudAddress(a: HudAttributes): string {
  const street = [a.STREET_NUM, a.DIRECTION_PREFIX, a.STREET_NAME].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  const cityStateZip = [a.CITY, [a.STATE_CODE, a.DISPLAY_ZIP_CODE].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [street, cityStateZip].filter(Boolean).join(', ')
}

// Paginates through the FeatureServer (2000/page as of writing; current
// nationwide total is ~600, but don't assume that holds — loop on
// exceededTransferLimit rather than hardcoding a single-page read.
export async function fetchHudReoListings(): Promise<HudListing[]> {
  const listings: HudListing[] = []
  let offset = 0
  const pageSize = 2000

  for (;;) {
    const url = `${HUD_REO_FEATURE_SERVER}?where=1=1&outFields=${encodeURIComponent(FIELDS)}` +
      `&resultOffset=${offset}&resultRecordCount=${pageSize}&f=json`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HUD FeatureServer returned ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(`HUD FeatureServer error: ${data.error.message || JSON.stringify(data.error)}`)

    const features: { attributes: HudAttributes }[] = data.features || []
    for (const f of features) {
      const address = assembleHudAddress(f.attributes)
      if (!address) continue
      const acquired = f.attributes.DATE_ACQUIRED ? new Date(f.attributes.DATE_ACQUIRED).toISOString().slice(0, 10) : null
      const notes = [`[HUD REO] Case #${f.attributes.CASE_NUM || 'unknown'}`, acquired ? `Acquired ${acquired}` : null]
        .filter(Boolean).join(' | ')
      listings.push({ address, notes })
    }

    if (!data.exceededTransferLimit || features.length === 0) break
    offset += features.length
  }

  return listings
}

export interface HudSyncResult { added: number; skipped: number; total: number }

// Dedupes against existing properties by normalized address (same rule
// importRows() in CRMContext uses) and bulk-inserts the rest as new leads.
// Server-side only — needs the service-role client.
export async function syncHudReo(): Promise<HudSyncResult> {
  const listings = await fetchHudReoListings()
  const db = serverSupabase()

  const { data: existing, error: fetchErr } = await db.from('properties').select('address')
  if (fetchErr) throw new Error(fetchErr.message)

  const existingAddresses = new Set((existing || []).map(p => (p.address || '').toLowerCase().trim()))
  const toInsert = listings
    .filter(l => !existingAddresses.has(l.address.toLowerCase().trim()))
    // A HUD case can appear more than once in a single pull (step changes) — drop dupes within this batch too.
    .filter((l, i, arr) => arr.findIndex(x => x.address.toLowerCase().trim() === l.address.toLowerCase().trim()) === i)
    .map(l => ({ address: l.address, notes: l.notes, status: 'lead' as const, followups: [], docs: [] }))

  const CHUNK = 200
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const { error } = await db.from('properties').insert(toInsert.slice(i, i + CHUNK))
    if (error) throw new Error(error.message)
  }

  return { added: toInsert.length, skipped: listings.length - toInsert.length, total: listings.length }
}
