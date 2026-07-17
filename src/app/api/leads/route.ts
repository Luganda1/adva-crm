import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'
import { checkApiKey } from '@/lib/api-auth'
import { notifyZapier } from '@/lib/notify-zap'

// GET /api/leads — list all leads ordered by newest first
export async function GET(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '100')

  const db = serverSupabase()
  let query = db.from('properties').select('*').order('created_at', { ascending: false }).limit(limit)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data, total: data?.length ?? 0 })
}

// POST /api/leads — create a new lead (accepts Realeflow/Zapier or manual payloads)
export async function POST(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  // Build full address from Realeflow components (address=street, city, state, zipCode)
  const street = (body.address || body.street || body.street_address || '') as string
  const city   = (body.city || '') as string
  const state  = (body.state || '') as string
  const zip    = (body.zipCode || body.zip || body.zip_code || '') as string

  const cityStateZip = [city, state && zip ? `${state} ${zip}` : state || zip].filter(Boolean).join(', ')
  const address = [street, cityStateZip].filter(Boolean).join(', ').trim()

  if (!address) {
    return NextResponse.json(
      { error: 'address is required', received_keys: Object.keys(body) },
      { status: 422 }
    )
  }

  // Attach source info to notes so you know where the lead came from
  const sourceNote = body.source ? `[Source: ${body.source}]` : null
  const incomingNotes = (body.notes || body.description || body.comments || null) as string | null
  const notes = [sourceNote, incomingNotes].filter(Boolean).join(' | ') || null

  const row = {
    address,
    owner_name: (body.owner_name || body.owner || body.full_name || body.name || null) as string | null,
    phone:      (body.phone || body.phone_number || body.mobile || null) as string | null,
    email:      (body.email || body.email_address || null) as string | null,
    notes,
    status:     (body.status as string) || 'lead',
    probate_date:      (body.probate_date || null) as string | null,
    foreclosure_date:  (body.foreclosure_date || null) as string | null,
    auction_date:      (body.auction_date || null) as string | null,
    next_followup:     (body.next_followup || null) as string | null,
    mailing_address:   (body.mailing_address || null) as string | null,
    followups: [],
    docs: [],
  }

  const db = serverSupabase()
  const { data, error } = await db.from('properties').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify Zapier of new lead unless this request already came from Zapier
  if (req.headers.get('x-source') !== 'zapier') {
    await notifyZapier(data as Record<string, unknown>)
  }

  return NextResponse.json({ lead: data }, { status: 201 })
}
