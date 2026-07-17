import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || 'unknown'
  const rawBody = await req.text()

  let parsed: unknown = null
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    parsed = null
  }

  const result = {
    content_type: contentType,
    raw_body: rawBody,
    parsed_json: parsed,
  }

  console.log('[debug-webhook]', JSON.stringify(result, null, 2))
  return NextResponse.json(result)
}

export async function GET() {
  return NextResponse.json({ status: 'debug-webhook is live' })
}
