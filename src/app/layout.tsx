import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'ADVA Leads CRM', description: 'Real estate lead management' }

// Minimal root layout — html/body/metadata only. The old version of this
// file unconditionally fetched all CRM data and wrapped everything in
// AppShell, which is wrong for a public landing page and /login. That logic
// now lives in (app)/layout.tsx, gated behind an auth check.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>{children}</body>
    </html>
  )
}
