import { NextRequest, NextResponse } from 'next/server'
import { checkApiKey } from '@/lib/api-auth'
import { syncHudReo } from '@/lib/hud-reo'

// Manual trigger — the "↻ Sync Now" button in Settings. Also hit automatically
// by GET /api/cron/hud-sync on a schedule; see vercel.json.
export async function POST(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  try {
    const result = await syncHudReo()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'HUD sync failed' }, { status: 502 })
  }
}
