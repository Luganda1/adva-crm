import Link from 'next/link'

// Shared by all public marketing pages (/, /about, /services). loginHref
// lets the landing page forward a redirectTo param so "Sign in" from a
// bounced protected-page visit still lands back where the user was headed.
//
// `variant="dark"` is used only by the landing page's hero (src/app/page.tsx
// passes it), which sits on the near-black hero background — see
// src/components/marketing/Hero.tsx. /about and /services keep the default
// light variant. Kept as one component (not a separate dark copy) so nav
// links/structure can't drift between the two.
interface Props {
  loginHref?: string
  variant?: 'light' | 'dark'
}

export default function MarketingNav({ loginHref = '/login', variant = 'light' }: Props) {
  const dark = variant === 'dark'
  const linkClass = dark
    ? 'hero-nav-link hidden sm:inline rounded-sm text-sm font-medium no-underline transition-colors'
    : 'hidden sm:inline rounded-sm text-sm font-medium no-underline transition-colors hover:text-brand'

  return (
    <nav
      className="relative sticky top-0 z-30 backdrop-blur-md"
      style={{
        background: dark ? 'rgba(9,13,16,.72)' : 'rgba(245,245,245,.75)',
        borderBottom: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg text-base"
            style={{ background: 'linear-gradient(135deg, var(--orange), var(--orange-dark))' }}>🏠</span>
          <span className="font-heading font-bold text-base" style={{ color: dark ? '#fff' : 'var(--charcoal)' }}>ADVA Leads</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/about" className={linkClass} style={{ color: dark ? 'rgba(255,255,255,.7)' : 'var(--gray)' }}>About Us</Link>
          <Link href="/services" className={linkClass} style={{ color: dark ? 'rgba(255,255,255,.7)' : 'var(--gray)' }}>Services</Link>
          <Link href={loginHref} className={dark ? 'hero-btn-primary rounded-full text-sm font-semibold font-heading px-4 py-2 no-underline' : 'btn btn-primary'}>
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  )
}
