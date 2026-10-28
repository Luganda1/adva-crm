import Link from 'next/link'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import { FEATURES } from '@/lib/marketing-content'

export default function ServicesPage() {
  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--gray-light)' }}>
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-[0.16]"
        style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }} />

      <MarketingNav />

      <section className="relative max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
        <span className="badge inline-block mb-5" style={{ background: 'var(--orange-light)', color: 'var(--orange-dark)' }}>Services</span>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl leading-tight mb-5" style={{ color: 'var(--charcoal)' }}>
          Everything the pipeline needs
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--gray)' }}>
          No bloat, no per-seat upsells — just the tools a small wholesaling team actually uses every day, from first
          contact to a closed deal.
        </p>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-20">
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

      <section className="relative max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>Ready to get to work?</h2>
        <p className="text-sm mb-7" style={{ color: 'var(--gray)' }}>Sign in with your team account to pick up where you left off.</p>
        <Link href="/login" className="btn btn-primary text-base px-7 py-3">Sign in to your CRM →</Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
