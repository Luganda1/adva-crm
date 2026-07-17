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

  // Normalize keys to lowercase so field names from Realeflow work regardless of casing
  const b: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    b[k.toLowerCase().replace(/\s+/g, '_')] = v
  }

  // Build address — Realeflow may send a full address or split street/city/state/zip
  const address = (
    (b.address as string) ||
    (b.street_address as string) ||
    (b.property_address as string) ||
    (b.street as string) ||
    [b.address1, b.city, b.state, b.zip].filter(Boolean).join(', ')
  )?.trim()

  if (!address) {
    return NextResponse.json(
      { error: 'address is required', received_keys: Object.keys(b) },
      { status: 422 }
    )
  }

  // Only insert columns that exist in the properties table — ignore any unknown fields
  const row = {
    address,
    owner_name: (b.owner_name ?? b.owner ?? b.full_name ?? b.name ?? null) as string | null,
    phone: (b.phone ?? b.phone_number ?? b.mobile ?? null) as string | null,
    email: (b.email ?? b.email_address ?? null) as string | null,
    notes: (b.notes ?? b.description ?? b.comments ?? null) as string | null,
    status: (b.status as string) ?? 'lead',
    probate_date: (b.probate_date ?? null) as string | null,
    foreclosure_date: (b.foreclosure_date ?? null) as string | null,
    auction_date: (b.auction_date ?? null) as string | null,
    next_followup: (b.next_followup ?? null) as string | null,
    partner_id: (b.partner_id ?? null) as string | null,
    mailing_address: (b.mailing_address ?? null) as string | null,
    skip_relatives: (b.skip_relatives ?? null) as string | null,
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
