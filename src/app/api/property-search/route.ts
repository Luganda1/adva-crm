import { NextRequest, NextResponse } from 'next/server'

// Fields we actually need from Repliers — keeps the response small.
// (Repliers ignores unknown query params rather than erroring, so this is safe to extend.)
const FIELDS = [
  'mlsNumber', 'listPrice', 'status', 'address', 'images',
  'details.numBedrooms', 'details.numBathrooms', 'details.sqft',
  'details.yearBuilt', 'details.propertyType', 'estimate',
].join(',')

export interface PropertySearchResult {
  mlsNumber: string
  address: string
  city: string | null
  state: string | null
  zip: string | null
  listPrice: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  yearBuilt: number | null
  propertyType: string | null
  status: string | null
  image: string | null
  estimatedValue: number | null
}

// Repliers is inconsistent about types across fields — numBedrooms/numBathrooms
// come back as numbers, but sqft/yearBuilt come back as numeric strings. Coerce
// either shape rather than silently dropping valid values with a typeof check.
function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function assembleStreet(a: Record<string, unknown>): string {
  const parts = [a.streetNumber, a.streetDirectionPrefix, a.streetName, a.streetSuffix, a.streetDirection]
    .filter(Boolean) as string[]
  const street = parts.join(' ')
  return a.unitNumber ? `${street}, Unit ${a.unitNumber}` : street
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.REPLIERS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'REPLIERS_API_KEY not configured' }, { status: 503 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'q (address to search) is required' }, { status: 422 })
  }

  const url = `https://api.repliers.io/listings?search=${encodeURIComponent(q)}&fields=${encodeURIComponent(FIELDS)}`

  let res: Response
  try {
    res = await fetch(url, { headers: { 'REPLIERS-API-KEY': apiKey, Accept: 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reach Repliers: ' + String(e) }, { status: 502 })
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({ error: `Repliers error ${res.status}: ${text}` }, { status: 502 })
  }

  const data = await res.json()
  const rawListings = Array.isArray(data?.listings) ? data.listings : []

  // Cap to 8 — this is a search-bar autocomplete, not a full listings browser.
  const results: PropertySearchResult[] = rawListings.slice(0, 8).map((l: Record<string, any>) => {
    const a = l.address || {}
    const d = l.details || {}
    const images = Array.isArray(l.images) ? l.images : []
    return {
      mlsNumber: l.mlsNumber ?? '',
      address: assembleStreet(a),
      city: a.city ?? null,
      state: a.state ?? null,
      zip: a.zip ?? null,
      listPrice: toNum(l.listPrice),
      beds: toNum(d.numBedrooms),
      baths: toNum(d.numBathrooms),
      sqft: toNum(d.sqft),
      yearBuilt: toNum(d.yearBuilt),
      propertyType: d.propertyType ?? null,
      status: l.status ?? null,
      image: images[0] ? `https://cdn.repliers.io/${images[0]}` : null,
      estimatedValue: toNum(l.estimate?.value) !== null ? Math.round(toNum(l.estimate?.value) as number) : null,
    }
  })

  return NextResponse.json({ results, count: typeof data?.count === 'number' ? data.count : results.length })
}
