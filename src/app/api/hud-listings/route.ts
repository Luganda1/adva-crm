import { NextResponse } from 'next/server'
import { fetchHudReoListings } from '@/lib/hud-reo'

// Read-only — powers the /hud-leads browse table. Never writes to the
// database; adding a property to the CRM is a separate, explicit per-row
// action (POST /api/properties, same as Property Search's Add to CRM).
export async function GET() {
  try {
    const listings = await fetchHudReoListings()
    return NextResponse.json({ listings, count: listings.length })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to fetch HUD listings' }, { status: 502 })
  }
}
