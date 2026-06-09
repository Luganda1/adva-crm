'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useCRM } from '@/contexts/CRMContext'

const TABS = [
  { href: '/leads', label: 'All Leads' }, { href: '/followup', label: 'Follow-up' },
  { href: '/events', label: 'Events' }, { href: '/map', label: '🗺 Map' },
  { href: '/geo', label: '📍 Geo' }, { href: '/partners', label: 'Partners' },
  { href: '/letters', label: '✉️ Letters' }, { href: '/buyers', label: '🏦 Buyers' },
  { href: '/settings', label: '⚙️ Settings' },
]

export default function CRMChrome({ children }: { children: React.ReactNode }) {
  const { properties, syncStatus, syncLabel } = useCRM()
  const pathname = usePathname()
  const today = new Date().toISOString().slice(0, 10)
  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter(p => p.status === 'active').length,
    probate: properties.filter(p => p.status === 'probate').length,
    fc: properties.filter(p => p.status === 'foreclosure').length,
    auction: properties.filter(p => p.status === 'auction').length,
    overdue: properties.filter(p => p.next_followup && p.next_followup < today).length,
  }), [properties, today])

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F7' }}>
      <header className="bg-white sticky top-0 z-30 flex items-center justify-between px-7 h-[60px]"
        style={{ borderBottom: '2px solid var(--orange)', boxShadow: 'var(--shadow)' }}>
        <Link href="/leads" className="flex items-center gap-2 font-heading font-bold text-lg no-underline" style={{ color: 'var(--charcoal)' }}>
          🏠 <span style={{ color: 'var(--orange)' }}>ADVA</span> Leads CRM
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/money-partners" className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg no-underline transition-colors hover:border-brand hover:text-brand" style={{ color: 'var(--gray)' }}>
            💰 Money Partners
          </Link>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--gray)' }}>
            <span className={`sync-dot ${syncStatus}`} /><span>{syncLabel}</span>
          </div>
        </div>
      </header>

      <div className="bg-white flex gap-6 px-7 py-3.5 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Total Leads', val: stats.total, cls: '' },
          { label: 'Active', val: stats.active, cls: 'text-brand' },
          { label: 'Probate', val: stats.probate, cls: '' },
          { label: 'Foreclosure', val: stats.fc, cls: '' },
          { label: 'Auction', val: stats.auction, cls: '' },
          { label: 'Overdue F/U', val: stats.overdue, cls: 'text-red-500' },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">
            {i > 0 && <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />}
            <div className="flex flex-col items-center min-w-[60px]">
              <span className={`font-heading font-bold text-2xl leading-none ${s.cls}`}>{s.val}</span>
              <span className="text-[11px] mt-0.5 whitespace-nowrap" style={{ color: 'var(--gray)' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <nav className="bg-white flex overflow-x-auto px-7" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <Link key={tab.href} href={tab.href}
            className="px-4 py-3 text-sm font-medium font-heading whitespace-nowrap border-b-[3px] transition-colors no-underline"
            style={{ color: pathname === tab.href ? 'var(--orange)' : 'var(--gray)', borderBottomColor: pathname === tab.href ? 'var(--orange)' : 'transparent' }}>
            {tab.label}
          </Link>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-7 py-5">{children}</main>
    </div>
  )
}
