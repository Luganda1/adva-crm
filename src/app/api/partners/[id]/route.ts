import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = serverSupabase()
  await db.from('partners').delete().eq('id', id)
  await db.from('properties').update({ partner_id: null }).eq('partner_id', id)
  return new NextResponse(null, { status: 204 })
}
