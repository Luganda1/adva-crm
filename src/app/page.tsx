import Link from 'next/link'
import Hero from '@/components/marketing/Hero'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import { FEATURES, STEPS } from '@/lib/marketing-content'

const PREVIEW_ROWS = [
  { addr: '142 Magnolia St, Tampa FL', status: 'Active', color: 'var(--green)', bg: 'var(--green-light)' },
  { addr: '88 Larkspur Ave, Orlando FL', status: 'Probate', color: 'var(--amber)', bg: 'var(--amber-light)' },
  { addr: '560 Cedar Ridge Rd, Tampa FL', status: 'Foreclosure', color: 'var(--red)', bg: 'var(--red-light)' },
]

// This is where every unauthenticated visitor lands — middleware sends
// anyone without a session here (not straight to /login) for any protected
// page, carrying ?redirectTo so "Sign in" still ends up where they meant to
// go. Signing out also comes back here (see SignOutButton.tsx).
export default async function LandingPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const { redirectTo } = await searchParams
  const loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'

  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--gray-light)' }}>
      <Hero loginHref={loginHref} />

      {/* Product preview — an illustrative mockup of the real lead list and
          its actual status colors, not a stock photo or a fabricated metric */}
      <section className="relative max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#E0E0E0' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#E0E0E0' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#E0E0E0' }} />
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--gray)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
              <span>Synced</span>
            </div>
          </div>
          <div>
            {PREVIEW_ROWS.map((r, i) => (
              <div key={r.addr} className="flex items-center justify-between px-5 py-3.5 text-sm"
                style={{ borderBottom: i < PREVIEW_ROWS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className="font-medium text-left" style={{ color: 'var(--charcoal)' }}>{r.addr}</span>
                <span className="badge" style={{ background: r.bg, color: r.color }}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-2.5" style={{ color: 'var(--charcoal)' }}>Everything the pipeline needs</h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--gray)' }}>No bloat, no per-seat upsells — just the tools a small team actually uses every day.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.slice(0, 6).map(f => (
            <div key={f.title}
              className="bg-white border border-gray-200 rounded-xl p-5 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: 'var(--shadow)' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg text-lg mb-3.5" style={{ background: 'var(--orange-light)' }}>{f.icon}</div>
              <h3 className="font-heading font-bold text-base mb-1.5" style={{ color: 'var(--charcoal)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--gray)' }}>{f.body}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/services" className="text-sm font-semibold no-underline" style={{ color: 'var(--orange)' }}>See all services →</Link>
        </div>
      </section>

      <section className="relative px-6 pb-20" style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto pt-16">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-2.5" style={{ color: 'var(--charcoal)' }}>How it works</h2>
            <p className="text-sm" style={{ color: 'var(--gray)' }}>From first contact to a closed deal, three steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.n} className="text-center md:text-left">
                <span className="font-heading font-bold text-3xl" style={{ color: 'var(--orange-light)', WebkitTextStroke: '1.5px var(--orange)' }}>{s.n}</span>
                <h3 className="font-heading font-bold text-base mt-2.5 mb-1.5" style={{ color: 'var(--charcoal)' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray)' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>Ready to get to work?</h2>
        <p className="text-sm mb-7" style={{ color: 'var(--gray)' }}>Sign in with your team account to pick up where you left off.</p>
        <Link href={loginHref} className="btn btn-primary text-base px-7 py-3">Sign in to your CRM →</Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
