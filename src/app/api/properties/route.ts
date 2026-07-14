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
  if (!body.address?.trim()) return NextResponse.json({ error: 'address is required' }, { status: 422 })
  const db = serverSupabase()
  const { data, error } = await db.from('properties').insert({ ...body, followups: body.followups || [], docs: body.docs || [] }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Notify Zapier unless this request already came from Zapier (prevents infinite loop)
  if (req.headers.get('x-source') !== 'zapier') {
    await notifyZapier(data as Record<string, unknown>)
  }
  return NextResponse.json(data, { status: 201 })
}
