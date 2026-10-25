import { NextResponse } from 'next/server'
import { syncHudReo } from '@/lib/hud-reo'

export const dynamic = 'force-dynamic'

// Weekly automatic pull of HUD's FHA Single Family REO dataset — see vercel.json
// for the schedule and src/lib/hud-reo.ts for the source/dedupe logic.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncHudReo()
    console.log('[hud-sync] synced at', new Date().toISOString(), result)
    return NextResponse.json({ ok: true, synced_at: new Date().toISOString(), ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[hud-sync] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
