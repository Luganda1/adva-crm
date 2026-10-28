import Link from 'next/link'

const FEATURES = [
  { icon: '📋', title: 'Lead pipeline', body: 'Track every property from first contact through close — notes, follow-ups, and status in one board.' },
  { icon: '🗺️', title: 'Map & property lookup', body: 'Search any address on a live map and pull real listing data — beds, baths, sqft, price — straight into a lead.' },
  { icon: '🏛️', title: 'Free HUD REO leads', body: "Browse HUD's official foreclosure list nationwide and add the ones you want — nothing gets imported automatically." },
  { icon: '🤝', title: 'Money partners', body: 'A separate pipeline for tracking capital partners and matching deals to funding.' },
  { icon: '🤖', title: 'AI lead triage', body: 'An AI assistant scores and summarizes incoming leads so your team works the hot ones first.' },
  { icon: '💬', title: 'AI assistant', body: 'Ask questions about your pipeline in plain English, right from any screen.' },
]

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--gray-light)' }}>
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="font-heading font-bold text-lg" style={{ color: 'var(--charcoal)' }}>ADVA Leads</span>
        </div>
        <Link href="/login" className="btn btn-outline">Sign in</Link>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <h1 className="font-heading font-bold text-4xl sm:text-5xl mb-5" style={{ color: 'var(--charcoal)' }}>
          Run your real estate wholesaling pipeline in one place
        </h1>
        <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--gray)' }}>
          Leads, properties, money partners, and an AI assistant that helps your team triage and work deals faster —
          built for small wholesaling teams, not enterprise sales orgs.
        </p>
        <Link href="/login" className="btn btn-primary text-base px-6 py-3">Sign in to your CRM →</Link>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-heading font-bold text-base mb-1.5" style={{ color: 'var(--charcoal)' }}>{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--gray)' }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs pb-10" style={{ color: 'var(--gray)' }}>
        ADVA Leads CRM — built for internal team use.
      </footer>
    </div>
  )
}
