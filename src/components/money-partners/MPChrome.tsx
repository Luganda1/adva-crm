'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useMP } from '@/contexts/MPContext'

const TABS = [
  { href: '/money-partners', label: 'All Partners' },
  { href: '/money-partners/pipeline', label: 'Availability Pipeline' },
  { href: '/money-partners/deals', label: 'Deal History' },
]
const fmtBig = (n: number) => n >= 1_000_000 ? '$' + (n / 1_000_000).toFixed(1) + 'M' : '$' + (n / 1_000).toFixed(0) + 'K'

export default function MPChrome({ children }: { children: React.ReactNode }) {
  const { partners, syncStatus, syncLabel } = useMP()
  const pathname = usePathname()
  const stats = useMemo(() => ({
    total: partners.length,
    active: partners.filter(p => p.availability === 'active').length,
    capital: fmtBig(partners.reduce((s, p) => s + (Number(p.capital_available) || 0), 0)),
    deployed: fmtBig(partners.reduce((s, p) => s + (p.deals || []).reduce((ds, d) => ds + (Number(d.amount) || 0), 0), 0)),
    deals: partners.reduce((s, p) => s + (p.deals || []).length, 0),
  }), [partners])

  return (
    <div className="min-h-screen" style={{ background: '#F2F4F7' }}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-7 h-[60px]"
        style={{ background: 'linear-gradient(135deg,#E8711A 0%,#C75E10 100%)', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
        <div className="font-heading font-bold text-lg">
          <span className="text-white">ADVA</span> <span style={{ color: '#F5C842' }}>Money Partners</span>
        </div>
        <div className="flex items-center gap-3.5">
          <Link href="/leads" className="text-sm no-underline" style={{ color: 'rgba(255,255,255,.85)' }}>← Back to CRM</Link>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'on' ? 'bg-green-400' : 'bg-yellow-300 animate-pulse'}`} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,.6)' }}>{syncLabel}</span>
          </div>
        </div>
      </header>

      <div className="flex gap-7 px-7 py-3.5 overflow-x-auto" style={{ background: '#C75E10', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {[
          { label: 'Total Partners', val: stats.total, cls: 'text-yellow-300' },
          { label: 'Active / Available', val: stats.active, cls: 'text-green-400' },
          { label: 'Total Capital Available', val: stats.capital, cls: 'text-yellow-300' },
          { label: 'Total Deployed', val: stats.deployed, cls: 'text-white' },
          { label: 'Deals Funded', val: stats.deals, cls: 'text-white' },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-7">
            {i > 0 && <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,.12)' }} />}
            <div className="flex flex-col items-center min-w-[80px]">
              <span className={`font-heading font-bold text-xl leading-none ${s.cls}`}>{s.val}</span>
              <span className="text-[11px] mt-1 whitespace-nowrap" style={{ color: 'rgba(255,255,255,.5)' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <nav className="bg-white flex overflow-x-auto px-7" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <Link key={tab.href} href={tab.href}
            className="px-4 py-3 text-sm font-semibold font-heading whitespace-nowrap border-b-[3px] transition-colors no-underline"
            style={{ color: pathname === tab.href ? 'var(--orange)' : 'var(--gray)', borderBottomColor: pathname === tab.href ? 'var(--orange)' : 'transparent' }}>
            {tab.label}
          </Link>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-7 py-5">{children}</main>
    </div>
  )
}
