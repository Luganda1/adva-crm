import { NextRequest, NextResponse } from 'next/server'

export interface EnrichResult {
  owner:          string | null
  beds:           number | null
  baths:          number | null
  sqft:           number | null
  yearBuilt:      number | null
  propertyType:   string | null
  assessedValue:  number | null
  lastSalePrice:  number | null
  lastSaleDate:   string | null
  estimatedValue: number | null
  estimatedRent:  number | null
  equity:         number | null
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.RENTCAST_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RENTCAST_API_KEY not configured' }, { status: 503 })
  }

  const address = req.nextUrl.searchParams.get('address')
  if (!address?.trim()) {
    return NextResponse.json({ error: 'address is required' }, { status: 422 })
  }

  const headers = { 'X-Api-Key': apiKey, 'Accept': 'application/json' }

  // Fetch property details and AVM in parallel
  const [propRes, avmRes] = await Promise.allSettled([
    fetch(`https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&limit=1`, { headers }),
    fetch(`https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`, { headers }),
  ])

  let prop: Record<string, unknown> = {}
  let avm:  Record<string, unknown> = {}

  if (propRes.status === 'fulfilled' && propRes.value.ok) {
    const data = await propRes.value.json()
    prop = Array.isArray(data) ? (data[0] ?? {}) : data
  }

  if (avmRes.status === 'fulfilled' && avmRes.value.ok) {
    avm = await avmRes.value.json()
  }

  const estimatedValue = (avm.price as number) ?? null
  const lastSalePrice  = (prop.lastSalePrice as number) ?? null

  // Equity = estimated value minus last known sale price (rough indicator)
  const equity = estimatedValue && lastSalePrice ? Math.round(estimatedValue - lastSalePrice) : null

  const result: EnrichResult = {
    owner:          (prop.owner as string) ?? null,
    beds:           (prop.bedrooms as number) ?? null,
    baths:          (prop.bathrooms as number) ?? null,
    sqft:           (prop.squareFootage as number) ?? null,
    yearBuilt:      (prop.yearBuilt as number) ?? null,
    propertyType:   (prop.propertyType as string) ?? null,
    assessedValue:  (prop.assessedValue as number) ?? null,
    lastSalePrice,
    lastSaleDate:   (prop.lastSaleDate as string) ?? null,
    estimatedValue,
    estimatedRent:  (avm.rent as number) ?? null,
    equity,
  }

  return NextResponse.json(result)
}
