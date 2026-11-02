import Link from 'next/link'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

const VALUES = [
  { icon: '🎯', title: 'Built for the team that uses it', body: 'Every feature exists because someone on the team asked for it on a real deal — not because a product roadmap called for it.' },
  { icon: '🧰', title: 'Small team, real tools', body: 'No enterprise bloat and no per-seat pricing games. Just the pipeline, the map, and the AI help the team actually reaches for.' },
  { icon: '🔄', title: 'Built to keep changing', body: 'This CRM evolves with how deals actually get worked, not on a quarterly release calendar — if something is slow or missing, it gets fixed.' },
]

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--gray-light)' }}>
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-[0.16]"
        style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }} />

      <MarketingNav />

      <section className="relative max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
        <span className="badge inline-block mb-5" style={{ background: 'var(--orange-light)', color: 'var(--orange-dark)' }}>About Us</span>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl leading-tight mb-5" style={{ color: 'var(--charcoal)' }}>
          A CRM built in-house, for our own pipeline
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--gray)' }}>
          ADVA Leads started as an internal tool to replace scattered spreadsheets and sticky notes with one shared
          place to track leads, properties, and money partners. It's built by and for the team that works the deals —
          not sold as a product, not run by a sales team.
        </p>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {VALUES.map(v => (
            <div key={v.title} className="bg-white border border-gray-200 rounded-xl p-5" style={{ boxShadow: 'var(--shadow)' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg text-lg mb-3.5" style={{ background: 'var(--orange-light)' }}>{v.icon}</div>
              <h3 className="font-heading font-bold text-base mb-1.5" style={{ color: 'var(--charcoal)' }}>{v.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--gray)' }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative px-6 pb-20" style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto pt-16 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>What's inside</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--gray)' }}>
            A full lead pipeline, a live map with property lookup, a free HUD foreclosure feed, a money-partners
            tracker, and AI tools that help triage new leads and answer questions about the pipeline — all in one
            place, nothing bolted on from a third-party vendor.
          </p>
          <Link href="/services" className="btn btn-outline text-base px-6 py-3">See the full list of services →</Link>
        </div>
      </section>

      <section className="relative max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>Ready to get to work?</h2>
        <p className="text-sm mb-7" style={{ color: 'var(--gray)' }}>Sign in with your team account to pick up where you left off.</p>
        <Link href="/login" className="btn btn-primary text-base px-7 py-3">Sign in to your CRM →</Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
