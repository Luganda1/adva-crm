'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    // A full navigation (not router.push) so middleware re-runs with the
    // fresh session cookie and the (app) layout's server-side fetch sees it
    // immediately — a client-side route change here previously raced ahead
    // of the cookie write.
    window.location.href = params.get('redirectTo') || '/leads'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--gray-light)' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6 no-underline">
          <span className="text-2xl">🏠</span>
          <span className="font-heading font-bold text-lg" style={{ color: 'var(--charcoal)' }}>ADVA Leads</span>
        </Link>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h1 className="font-heading font-bold text-lg mb-1" style={{ color: 'var(--charcoal)' }}>Sign in</h1>
          <p className="text-sm mb-5" style={{ color: 'var(--gray)' }}>Access your team's CRM.</p>

          {error && (
            <div className="text-sm rounded-lg px-3.5 py-2.5 mb-4" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>⚠️ {error}</div>
          )}

          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email" type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 mb-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand"
            placeholder="you@company.com"
          />

          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 mb-5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand"
            placeholder="••••••••"
          />

          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--gray)' }}>
          Need access? Ask a teammate to invite you from Supabase, or reach out to your admin.
        </p>
      </div>
    </div>
  )
}
