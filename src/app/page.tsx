import Link from 'next/link'

const FEATURES = [
  { icon: '📋', title: 'Lead pipeline', body: 'Track every property from first contact through close — notes, follow-ups, and status in one board.' },
  { icon: '🗺️', title: 'Map & property lookup', body: 'Search any address on a live map and pull real listing data — beds, baths, sqft, price — straight into a lead.' },
  { icon: '🏛️', title: 'Free HUD REO leads', body: "Browse HUD's official foreclosure list nationwide and add the ones you want — nothing gets imported automatically." },
  { icon: '🤝', title: 'Money partners', body: 'A separate pipeline for tracking capital partners and matching deals to funding.' },
  { icon: '🤖', title: 'AI lead triage', body: 'An AI assistant scores and summarizes incoming leads so your team works the hot ones first.' },
  { icon: '💬', title: 'AI assistant', body: 'Ask questions about your pipeline in plain English, right from any screen.' },
]

const STEPS = [
  { n: '01', title: 'Leads land in one place', body: 'From Realeflow via Zapier, a map search, or HUD’s free foreclosure list — every lead ends up in the same pipeline.' },
  { n: '02', title: 'AI triages, your team works it', body: 'New leads get scored and summarized automatically, so the team calls the hottest ones first instead of digging through a spreadsheet.' },
  { n: '03', title: 'Match funding, close it out', body: 'Pair active leads with money partners, log the deal, and move on to the next one.' },
]

const PREVIEW_ROWS = [
  { addr: '142 Magnolia St, Tampa FL', status: 'Active', color: 'var(--green)', bg: 'var(--green-light)' },
  { addr: '88 Larkspur Ave, Orlando FL', status: 'Probate', color: 'var(--amber)', bg: 'var(--amber-light)' },
  { addr: '560 Cedar Ridge Rd, Tampa FL', status: 'Foreclosure', color: 'var(--red)', bg: 'var(--red-light)' },
]

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--gray-light)' }}>
      {/* Soft brand-colored glow behind the hero — pure CSS, no imagery */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-[0.16]"
        style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }} />

      <nav className="relative sticky top-0 z-30 backdrop-blur-md" style={{ background: 'rgba(245,245,245,.75)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg text-base"
              style={{ background: 'linear-gradient(135deg, var(--orange), var(--orange-dark))' }}>🏠</span>
            <span className="font-heading font-bold text-base" style={{ color: 'var(--charcoal)' }}>ADVA Leads</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hidden sm:inline text-sm font-medium no-underline transition-colors hover:text-brand" style={{ color: 'var(--gray)' }}>Features</a>
            <a href="#how-it-works" className="hidden sm:inline text-sm font-medium no-underline transition-colors hover:text-brand" style={{ color: 'var(--gray)' }}>How it works</a>
            <Link href="/login" className="btn btn-primary">Sign in</Link>
          </div>
        </div>
      </nav>

      <section className="relative max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <span className="badge inline-block mb-5" style={{ background: 'var(--orange-light)', color: 'var(--orange-dark)' }}>
          Built for wholesaling teams
        </span>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl leading-tight mb-5" style={{ color: 'var(--charcoal)' }}>
          Run your real estate wholesaling{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--orange), var(--orange-dark))',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>pipeline</span> in one place
        </h1>
        <p className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--gray)' }}>
          Leads, properties, money partners, and an AI assistant that helps your team triage and work deals faster —
          built for small wholesaling teams, not enterprise sales orgs.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="btn btn-primary text-base px-6 py-3">Sign in to your CRM →</Link>
          <a href="#features" className="btn btn-outline text-base px-6 py-3">See what's inside</a>
        </div>
      </section>

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

      <section id="features" className="relative max-w-6xl mx-auto px-6 pb-20 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-2.5" style={{ color: 'var(--charcoal)' }}>Everything the pipeline needs</h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--gray)' }}>No bloat, no per-seat upsells — just the tools a small team actually uses every day.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title}
              className="bg-white border border-gray-200 rounded-xl p-5 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: 'var(--shadow)' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg text-lg mb-3.5" style={{ background: 'var(--orange-light)' }}>{f.icon}</div>
              <h3 className="font-heading font-bold text-base mb-1.5" style={{ color: 'var(--charcoal)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--gray)' }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative px-6 pb-20 scroll-mt-20" style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
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
        <Link href="/login" className="btn btn-primary text-base px-7 py-3">Sign in to your CRM →</Link>
      </section>

      <footer className="relative text-center text-xs pb-10" style={{ color: 'var(--gray)' }}>
        🏠 ADVA Leads CRM — built for internal team use.
      </footer>
    </div>
  )
}
