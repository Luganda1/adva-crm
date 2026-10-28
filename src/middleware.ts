import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Public, unauthenticated pages — everything else under (app) requires a
// session. Deliberately NOT extending this check to /api/* routes in this
// pass — those still rely solely on the optional x-api-key (checkApiKey()),
// same as before. That's a real, known gap: someone who finds the API URLs
// directly can still read/write CRM data without logging in. Flagged in
// TECHNICAL.md rather than silently left alone or silently "fixed" by
// expanding scope into re-auditing every route's auth model in this same
// change — Zapier's own calls to /api/leads and /api/properties have no user
// session at all and must keep working.
const PUBLIC_PATHS = ['/', '/login', '/about', '/services']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, { status: 204, headers: corsHeaders() })
  }

  let res = NextResponse.next({ request: req })

  // Session refresh — Supabase's session cookie is short-lived; this is what
  // keeps it alive across requests without the user noticing. The setAll
  // callback has to re-create `res` with the new cookies attached, since
  // NextResponse cookies are set at response-construction time, not mutated
  // after the fact.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname.startsWith('/api/')) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  const isPublicPage = PUBLIC_PATHS.includes(pathname)

  if (!user && !isPublicPage) {
    // Land on the public marketing page first, not straight into the login
    // form — the landing page's own "Sign in" links forward redirectTo to
    // /login so the user still ends up where they meant to go.
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/leads'
    return NextResponse.redirect(url)
  }

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
  // Everything except static assets — this now covers page routes (for the
  // auth redirect) as well as /api/* (for CORS), where it used to only match
  // /api/*.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
