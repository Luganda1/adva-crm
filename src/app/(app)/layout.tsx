import { redirect } from 'next/navigation'
import { serverSupabase } from '@/lib/supabase-server'
import { createAuthServerClient } from '@/lib/supabase-auth-server'
import AppShell from '@/components/AppShell'
import type { Property, Partner, Buyer, MoneyPartner } from '@/types'

export const dynamic = 'force-dynamic'

// Everything under (app) is the authenticated CRM — this is the layout that
// used to live at the root. Moved here (unchanged, aside from the auth
// check) so the public landing page and /login can have their own minimal
// root layout instead of unconditionally fetching all CRM data. Middleware
// already redirects unauthenticated requests before they get this far, but
// that's a routing concern; this check is the actual data-access gate — a
// direct hit on a cached/static response or a middleware bypass shouldn't be
// able to render real property/buyer data without a session.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const authDb = await createAuthServerClient()
  const { data: { user } } = await authDb.auth.getUser()
  if (!user) redirect('/login')

  const db = serverSupabase()
  const [{ data: properties }, { data: partners }, { data: buyers }, { data: mpPartners }] = await Promise.all([
    db.from('properties').select('*').order('created_at', { ascending: false }),
    db.from('partners').select('*').order('name'),
    db.from('buyers').select('*').order('created_at', { ascending: false }),
    db.from('money_partners').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <AppShell
      initialProperties={(properties as Property[]) || []}
      initialPartners={(partners as Partner[]) || []}
      initialBuyers={(buyers as Buyer[]) || []}
      initialMPPartners={(mpPartners as MoneyPartner[]) || []}
    >{children}</AppShell>
  )
}
