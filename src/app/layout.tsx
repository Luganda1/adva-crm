import type { Metadata } from 'next'
import { serverSupabase } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'
import './globals.css'
import type { Property, Partner, Buyer, MoneyPartner } from '@/types'

export const metadata: Metadata = { title: 'ADVA Leads CRM', description: 'Real estate lead management' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const db = serverSupabase()
  const [{ data: properties }, { data: partners }, { data: buyers }, { data: mpPartners }] = await Promise.all([
    db.from('properties').select('*').order('created_at', { ascending: false }),
    db.from('partners').select('*').order('name'),
    db.from('buyers').select('*').order('created_at', { ascending: false }),
    db.from('money_partners').select('*').order('created_at', { ascending: false }),
  ])
  return (
    <html lang="en">
      <body>
        <AppShell
          initialProperties={(properties as Property[]) || []}
          initialPartners={(partners as Partner[]) || []}
          initialBuyers={(buyers as Buyer[]) || []}
          initialMPPartners={(mpPartners as MoneyPartner[]) || []}
        >{children}</AppShell>
      </body>
    </html>
  )
}
