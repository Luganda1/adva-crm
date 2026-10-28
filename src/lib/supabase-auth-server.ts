import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cookie-aware, auth-only server client for Server Components and Route
// Handlers (reads the logged-in user's session). This is NOT the same thing
// as lib/supabase-server.ts's serverSupabase() — that one uses the service
// role key and bypasses RLS for actual data access from /api/* routes; this
// one uses the anon key and exists only to answer "who is logged in."
// Verified against the installed @supabase/ssr version's actual cookie
// interface (getAll/setAll) rather than assumed from memory — this shape
// has changed across package versions before.
export async function createAuthServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component, which can't set cookies — safe
            // to ignore as long as middleware is refreshing the session on
            // every request (see middleware.ts).
          }
        },
      },
    }
  )
}
