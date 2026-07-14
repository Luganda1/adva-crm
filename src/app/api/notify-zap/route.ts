import { NextRequest, NextResponse } from 'next/server'
import { notifyZapier } from '@/lib/notify-zap'

export async function POST(req: NextRequest) {
  const body = await req.json()
  await notifyZapier(body)
  return NextResponse.json({ ok: true })
}
