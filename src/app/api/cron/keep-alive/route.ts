import { NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = serverSupabase()
  const { error } = await supabase.from('properties').select('id').limit(1)

  if (error) {
    console.error('[keep-alive] Supabase ping failed:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('[keep-alive] Supabase pinged at', new Date().toISOString())
  return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() })
}
