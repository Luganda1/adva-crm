import Link from 'next/link'

export default function MarketingFooter() {
  return (
    <footer className="relative px-6 pb-10 pt-4" style={{ color: 'var(--gray)' }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span>🏠 ADVA Leads CRM — built for internal team use.</span>
        <div className="flex items-center gap-4">
          <Link href="/about" className="no-underline hover:text-brand" style={{ color: 'var(--gray)' }}>About Us</Link>
          <Link href="/services" className="no-underline hover:text-brand" style={{ color: 'var(--gray)' }}>Services</Link>
          <Link href="/login" className="no-underline hover:text-brand" style={{ color: 'var(--gray)' }}>Sign in</Link>
        </div>
      </div>
    </footer>
  )
}
