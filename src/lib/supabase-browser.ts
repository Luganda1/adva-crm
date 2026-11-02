import { createBrowserClient } from '@supabase/ssr'

// The auth-aware client for Client Components — reads/writes the session via
// cookies (not localStorage), so the server can see the same session on the
// next request. This is intentionally separate from the old anon-key
// lib/supabase.ts pattern (removed earlier — see TECHNICAL.md §7): that one
// was used for direct data access and got fully replaced by /api/* routes
// after the RLS incident. This client exists ONLY for auth (sign in/out,
// reading the current user) — never use it to query properties/buyers/etc.
// directly from the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
