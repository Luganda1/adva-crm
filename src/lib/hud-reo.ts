// HUD publishes its FHA Single Family REO (foreclosed, HUD-owned) inventory
// as a free, public, no-auth ArcGIS FeatureServer — a real official dataset,
// not a scraper. No price/beds/baths (just address + case metadata); run
// through /api/enrich or Property Search afterward for the rest.
// https://catalog.data.gov/dataset/fha-single-family-reo-properties-for-sale
//
// This is read-only and does NOT write to the properties table — it's a
// browse source for /hud-leads, which adds individual properties to the CRM
// one at a time on request (same pattern as Property Search). An earlier
// version of this file bulk-inserted every listing automatically on a cron,
// which dumped 621 properties straight into the leads list unasked. Don't
// bring that back — any future "sync all" feature needs to be opt-in and
// reviewable, not automatic.
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
  caseNum: string
  address: string
  city: string | null
  state: string | null
  zip: string | null
  acquired: string | null // YYYY-MM-DD
  notes: string // pre-built '[HUD REO] Case #... | Acquired ...' tag for saveProperty()
}

function assembleStreet(a: HudAttributes): string {
  return [a.STREET_NUM, a.DIRECTION_PREFIX, a.STREET_NAME].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
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
      const a = f.attributes
      const street = assembleStreet(a)
      const address = [street, [a.CITY, [a.STATE_CODE, a.DISPLAY_ZIP_CODE].filter(Boolean).join(' ')].filter(Boolean).join(', ')]
        .filter(Boolean).join(', ')
      if (!address) continue
      const acquired = a.DATE_ACQUIRED ? new Date(a.DATE_ACQUIRED).toISOString().slice(0, 10) : null
      const caseNum = a.CASE_NUM || 'unknown'
      listings.push({
        caseNum,
        address,
        city: a.CITY,
        state: a.STATE_CODE,
        zip: a.DISPLAY_ZIP_CODE != null ? String(a.DISPLAY_ZIP_CODE) : null,
        acquired,
        notes: [`[HUD REO] Case #${caseNum}`, acquired ? `Acquired ${acquired}` : null].filter(Boolean).join(' | '),
      })
    }

    if (!data.exceededTransferLimit || features.length === 0) break
    offset += features.length
  }

  return listings
}
