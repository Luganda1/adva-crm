import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }
  const res = NextResponse.next()
  Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  }
}

export const config = {
  matcher: '/api/:path*',
}
