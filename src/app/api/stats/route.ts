import { NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'
import { todayStr } from '@/lib/utils'

export async function GET() {
  const { data: props } = await serverSupabase().from('properties').select('status, next_followup')
  const today = todayStr()
  const rows = (props || []) as { status: string; next_followup: string | null }[]
  return NextResponse.json({
    total: rows.length,
    active: rows.filter(p => p.status === 'active').length,
    probate: rows.filter(p => p.status === 'probate').length,
    foreclosure: rows.filter(p => p.status === 'foreclosure').length,
    auction: rows.filter(p => p.status === 'auction').length,
    overdue: rows.filter(p => p.next_followup && p.next_followup < today).length,
  })
}
