'use client'
import { useState, useRef, useEffect } from 'react'

interface DisplayMessage { role: 'user' | 'assistant'; content: string }

// The API route only ever returns the FINAL assistant message after its
// internal tool-calling loop finishes — never the raw tool_calls/tool-result
// turns in between. So this client only ever sends/stores clean user/
// assistant text turns; every new question re-triggers fresh tool calls
// server-side rather than the assistant "remembering" stale search results.
export default function AssistantView() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', maxWidth: 720 }}>
      <div className="mb-3">
        <h1 className="font-heading font-bold text-lg mb-0.5">💬 Assistant</h1>
        <p className="text-sm" style={{ color: 'var(--gray)' }}>
          Ask about your leads — it can search and look up real properties. Only answers from what it actually finds in your CRM; it won't guess.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl p-4 mb-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-sm text-center py-8" style={{ color: 'var(--gray)' }}>
            Try: &ldquo;How many foreclosure leads do I have?&rdquo; or &ldquo;Tell me about 213 Hazel Lane&rdquo;
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: 'var(--orange)', color: 'white' }
                : { background: 'var(--gray-light)', color: 'var(--charcoal)' }}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--gray-light)', color: 'var(--gray)' }}>Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="text-sm rounded-lg px-3.5 py-2.5 mb-2" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>⚠️ {error}</div>
      )}

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask about your leads..." disabled={sending}
          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
        <button className="btn btn-primary" disabled={sending || !input.trim()} onClick={send}>Send</button>
      </div>
    </div>
  )
}
