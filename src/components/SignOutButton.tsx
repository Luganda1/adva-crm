'use client'
import { createClient } from '@/lib/supabase-browser'

export default function SignOutButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }
  return (
    <button onClick={handleSignOut} className={className} style={style}>
      Sign out
    </button>
  )
}
