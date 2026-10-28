'use client'
import { useState, useRef, useEffect } from 'react'

interface DisplayMessage { role: 'user' | 'assistant'; content: string }

// Mounted once in AppShell — available on every page, not tied to a route.
// Since AppShell doesn't unmount across client-side navigation (same layout
// boundary the whole app shares), conversation state naturally survives
// switching pages, no extra work needed for that.
export default function FloatingAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next); setInput(''); setSending(true); setError('')

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      setMessages([...next, { role: 'assistant', content: data.message?.content || '(no response)' }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed z-50 bg-white rounded-xl flex flex-col"
          style={{ bottom: 88, left: 24, width: 360, height: 480, maxWidth: 'calc(100vw - 48px)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-heading font-bold text-sm">💬 Assistant</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm" aria-label="Close">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5">
            {messages.length === 0 && (
              <div className="text-xs text-center py-8 px-2" style={{ color: 'var(--gray)' }}>
                Ask about your leads — e.g. &ldquo;How many foreclosure leads do I have?&rdquo;
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap"
                  style={m.role === 'user'
                    ? { background: 'var(--orange)', color: 'white' }
                    : { background: 'var(--gray-light)', color: 'var(--charcoal)' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--gray-light)', color: 'var(--gray)' }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="text-xs px-3.5 py-2 flex-shrink-0" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>⚠️ {error}</div>
          )}

          <div className="flex gap-1.5 p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask about your leads..." disabled={sending}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand" />
            <button className="btn btn-primary btn-sm flex-shrink-0" disabled={sending || !input.trim()} onClick={send}>Send</button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="fixed z-50 flex items-center gap-1.5 font-heading font-bold text-sm transition-transform hover:scale-105"
        style={{
          bottom: 24, left: 24, background: 'var(--orange)', color: 'white',
          borderRadius: 999, padding: '12px 20px', border: 'none', cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
        }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? '✕ Close' : '💬 Ask AI'}
      </button>
    </>
  )
}
