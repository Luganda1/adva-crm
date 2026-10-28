import Link from 'next/link'
import MarketingNav from './MarketingNav'

// ── Editable content ────────────────────────────────────────────────────
// Everything a future edit is likely to touch lives here, at the top.
const EYEBROW = 'Built for wholesaling teams'
const HEADLINE = 'Pipeline' // rendered uppercase via CSS — keep this short (1–2 words); anything longer won't read well at this size
const FEATURES_ROW_1 = [
  { icon: '📋', label: 'Lead pipeline' },
  { icon: '🗺️', label: 'Map & property lookup' },
  { icon: '🏛️', label: 'Free HUD REO leads' },
  { icon: '🤝', label: 'Money partners' },
]
const FEATURES_ROW_2 = [
  { icon: '🤖', label: 'AI lead triage' },
  { icon: '💬', label: 'AI assistant' },
]
const REASSURANCE = 'No per-seat pricing, no sales calls — just your team account.'
// No live promotional offer to show right now, so the small rotated sticky-note
// annotation from the reference is intentionally omitted rather than inventing
// one. To add a real one later: a small <div> anchored to the CTA group
// (position: absolute, rotate(8deg), bright yellow bg, dark text, thin white
// border) plus an inline SVG curved arrow pointing at the primary button.

export default function Hero({ loginHref }: { loginHref: string }) {
  return (
    <section className="hero-dark relative overflow-hidden" style={{ background: 'var(--hero-bg)' }}>
      {/* Decorative layers only — never intercepts clicks, never clips nav
          dropdowns or focus rings (those live in the sibling content layer). */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(1100px 700px at 27% 15%, rgba(47,170,179,.32) 0%, rgba(47,170,179,.12) 35%, transparent 70%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(900px 600px at 80% 92%, rgba(198,62,67,.22) 0%, rgba(198,62,67,.08) 40%, transparent 70%)',
        }} />
        <div className="absolute inset-0 hero-grid-bg" />
      </div>

      <div className="relative z-10">
        <MarketingNav variant="dark" loginHref={loginHref} />

        <div className="max-w-[1160px] mx-auto px-6 pt-20 sm:pt-28 md:pt-36 pb-16 text-center">
          <span className="hero-badge inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.12em] font-heading"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: 'rgba(255,255,255,.85)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--hero-cta-primary)' }} aria-hidden="true" />
            {EYEBROW}
          </span>

          <h1
            className="hero-headline font-heading uppercase tracking-tight leading-[0.95] mb-8"
            style={{ fontWeight: 900, fontSize: 'clamp(3.25rem, 13vw, 12.2rem)' }}
          >
            {HEADLINE}
          </h1>

          <div className="mx-auto mb-8 h-px w-40 sm:w-56" style={{
            background: 'linear-gradient(90deg, transparent, var(--hero-g4), transparent)',
          }} />

          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mb-3 list-none">
            {FEATURES_ROW_1.map(f => (
              <li key={f.label} className="flex items-center gap-2 text-[13px] sm:text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>
                <span className="text-lg sm:text-xl" aria-hidden="true">{f.icon}</span>{f.label}
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mb-10 list-none">
            {FEATURES_ROW_2.map(f => (
              <li key={f.label} className="flex items-center gap-2 text-[13px] sm:text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>
                <span className="text-lg sm:text-xl" aria-hidden="true">{f.icon}</span>{f.label}
              </li>
            ))}
          </ul>

          <div className="relative inline-block">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/services" className="hero-btn-secondary flex items-center justify-center h-14 px-7 rounded-full text-sm font-semibold font-heading no-underline w-full sm:w-auto">
                See what's inside
              </Link>
              <Link href={loginHref} className="hero-btn-primary flex items-center justify-center h-14 px-7 rounded-full text-sm font-semibold font-heading no-underline w-full sm:w-auto">
                Sign in to your CRM →
              </Link>
            </div>
          </div>

          <p className="mt-6 text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,.4)' }}>{REASSURANCE}</p>
        </div>
      </div>
    </section>
  )
}
