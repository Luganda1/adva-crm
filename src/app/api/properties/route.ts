import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'
import { checkApiKey } from '@/lib/api-auth'
import { notifyZapier } from '@/lib/notify-zap'

export async function GET(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny
  const db = serverSupabase()
  const { data, error } = await db.from('properties').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  // Realeflow sends: address (street only), city, state, zipCode, source, propertyId
  const street  = (body.address || body.street || body.street_address || '') as string
  const city    = (body.city || '') as string
  const state   = (body.state || '') as string
  const zip     = (body.zipCode || body.zip || body.zip_code || '') as string

  // Assemble full address from components
  const cityStateZip = [city, state && zip ? `${state} ${zip}` : state || zip].filter(Boolean).join(', ')
  const address = [street, cityStateZip].filter(Boolean).join(', ').trim()

  if (!address) {
    return NextResponse.json(
      { error: 'address is required', received_keys: Object.keys(body) },
      { status: 422 }
    )
  }

  // Build notes — include Realeflow source so we know where the lead came from
  const sourceNote = body.source ? `[Source: ${body.source}]` : null
  const incomingNotes = (body.notes || body.description || body.comments || null) as string | null
  const notes = [sourceNote, incomingNotes].filter(Boolean).join(' | ') || null

  // Only insert columns that exist in the properties table — ignore any unknown fields
  const row = {
    address,
    owner_name: (body.owner_name || body.owner || body.full_name || body.name || null) as string | null,
    phone: (body.phone || body.phone_number || body.mobile || null) as string | null,
    email: (body.email || body.email_address || null) as string | null,
    notes,
    status: (body.status as string) || 'lead',
    probate_date: (body.probate_date || null) as string | null,
    foreclosure_date: (body.foreclosure_date || null) as string | null,
    auction_date: (body.auction_date || null) as string | null,
    next_followup: (body.next_followup || null) as string | null,
    partner_id: (body.partner_id || null) as string | null,
    mailing_address: (body.mailing_address || null) as string | null,
    skip_relatives: (body.skip_relatives || null) as string | null,
    followups: [],
    docs: [],
  }

  const db = serverSupabase()
  const { data, error } = await db.from('properties').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify Zapier unless this request already came from Zapier (prevents infinite loop)
  if (req.headers.get('x-source') !== 'zapier') {
    await notifyZapier(data as Record<string, unknown>)
  }
  return NextResponse.json(data, { status: 201 })
}
