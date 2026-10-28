import Link from 'next/link'

// Shared by all public marketing pages (/, /about, /services). loginHref
// lets the landing page forward a redirectTo param so "Sign in" from a
// bounced protected-page visit still lands back where the user was headed.
export default function MarketingNav({ loginHref = '/login' }: { loginHref?: string }) {
  return (
    <nav className="relative sticky top-0 z-30 backdrop-blur-md" style={{ background: 'rgba(245,245,245,.75)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg text-base"
            style={{ background: 'linear-gradient(135deg, var(--orange), var(--orange-dark))' }}>🏠</span>
          <span className="font-heading font-bold text-base" style={{ color: 'var(--charcoal)' }}>ADVA Leads</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/about" className="text-sm font-medium no-underline transition-colors hover:text-brand" style={{ color: 'var(--gray)' }}>About Us</Link>
          <Link href="/services" className="text-sm font-medium no-underline transition-colors hover:text-brand" style={{ color: 'var(--gray)' }}>Services</Link>
          <Link href={loginHref} className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    </nav>
  )
}
