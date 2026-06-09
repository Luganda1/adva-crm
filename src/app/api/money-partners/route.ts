import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'

export async function GET() {
  const { data, error } = await serverSupabase().from('money_partners').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 422 })
  const { data, error } = await serverSupabase().from('money_partners').insert({ ...body, deals: body.deals || [], comm_log: body.comm_log || [] }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
