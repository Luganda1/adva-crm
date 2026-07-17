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
  const body = await req.json()

  // Build address from separate street/city/state/zip fields (e.g. Realeflow sends these individually)
  const address = body.address?.trim() ||
    [body.street, body.city, body.state, body.zip].filter(Boolean).join(', ').trim()

  if (!address) return NextResponse.json({ error: 'address is required' }, { status: 422 })

  // Only insert columns that exist in the properties table — reject any unknown fields
  const row = {
    address,
    owner_name: body.owner_name ?? body.owner ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    notes: body.notes ?? null,
    status: body.status ?? 'lead',
    probate_date: body.probate_date ?? null,
    foreclosure_date: body.foreclosure_date ?? null,
    auction_date: body.auction_date ?? null,
    next_followup: body.next_followup ?? null,
    partner_id: body.partner_id ?? null,
    mailing_address: body.mailing_address ?? null,
    skip_relatives: body.skip_relatives ?? null,
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
