'use client'
import { useState, useEffect, useMemo } from 'react'
import { useCRM } from '@/contexts/CRMContext'
import { zillowUrl } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { HudListing } from '@/lib/hud-reo'

const PAGE_SIZE = 50

export default function HudLeadsView() {
  const { properties, saveProperty } = useCRM()
  const [listings, setListings] = useState<HudListing[]>([])
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [addingCase, setAddingCase] = useState<string | null>(null)
  const [addError, setAddError] = useState('')
  const [scores, setScores] = useState<Record<string, { score: number; reason: string }>>({})
  const [triaging, setTriaging] = useState(false)
  const [triageError, setTriageError] = useState('')

  useEffect(() => {
    fetch('/api/hud-listings')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setListings(data.listings || [])
        setStatus('done')
      })
      .catch(e => { setError(e instanceof Error ? e.message : 'Failed to load'); setStatus('error') })
  }, [])

  // Already-in-CRM detection — matches this HUD case number against every
  // property's notes (where Add to CRM stamps '[HUD REO] Case #<num>'), so a
  // listing someone already added last week (or in an earlier session) shows
  // as added here too, not just ones added in this page view.
  const casesInCrm = useMemo(() => {
    const set = new Set<string>()
    for (const p of properties) {
      const m = p.notes?.match(/\[HUD REO\] Case #(\S+)/)
      if (m) set.add(m[1])
    }
    return set
  }, [properties])

  const states = useMemo(() => Array.from(new Set(listings.map(l => l.state).filter(Boolean))).sort(), [listings])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return listings.filter(l => {
      if (stateFilter && l.state !== stateFilter) return false
      if (q && !l.address.toLowerCase().includes(q) && !(l.city || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [listings, search, stateFilter])

  // Once a triage has run, sort by score (unscored listings sink to the
  // bottom) — the whole point of the feature is not having to scan all 600
  // rows manually.
  const sorted = useMemo(() => {
    if (Object.keys(scores).length === 0) return filtered
    return [...filtered].sort((a, b) => (scores[b.caseNum]?.score ?? -1) - (scores[a.caseNum]?.score ?? -1))
  }, [filtered, scores])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function resetPage() { setPage(1) }

  async function runTriage() {
    setTriaging(true); setTriageError('')
    try {
      const res = await fetch('/api/hud-triage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listings: filtered }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Triage failed (${res.status})`)
      const next: Record<string, { score: number; reason: string }> = {}
      for (const s of data.scores || []) next[s.caseNum] = { score: s.score, reason: s.reason }
      setScores(next)
      setPage(1)
    } catch (e) {
      setTriageError(e instanceof Error ? e.message : 'Triage failed')
    } finally {
      setTriaging(false)
    }
  }

  async function addToCrm(l: HudListing) {
    setAddError(''); setAddingCase(l.caseNum)
    try {
      const id = await saveProperty({ address: l.address, notes: l.notes, status: 'lead' })
      if (!id) throw new Error('Save returned no id — check Supabase write permissions.')
    } catch (e) {
      setAddError(`Couldn't add "${l.address}": ${e instanceof Error ? e.message : 'unknown error'}`)
    } finally {
      setAddingCase(null)
    }
  }

  return (
    <>
      <div className="mb-1">
        <h1 className="font-heading font-bold text-lg mb-0.5">🏛️ HUD REO Leads</h1>
        <p className="text-sm" style={{ color: 'var(--gray)' }}>
          HUD's free, official list of FHA foreclosed (REO) properties nationwide. Browse and pick which ones to add — nothing here is added to your leads automatically. No price/beds/baths in HUD's data; check 🔎 Zillow or run Enrich after adding.
        </p>
      </div>

      {status === 'loading' && <EmptyState icon="🏛️" title="Loading HUD listings..." />}
      {status === 'error' && <EmptyState icon="⚠️" title="Couldn't load HUD listings" sub={error} />}

      {status === 'done' && (
        <>
          <div className="flex gap-2 my-3.5 flex-wrap items-center">
            <div className="relative flex-[2] min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
              <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder="Filter by address or city..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
            </div>
            <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); resetPage() }} className={`filter-select ${stateFilter ? 'filter-active' : ''}`}>
              <option value="">All states</option>
              {states.map(s => <option key={s} value={s!}>{s}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" disabled={triaging || filtered.length === 0} onClick={runTriage}>
              {triaging ? 'Scoring...' : '🤖 Rank by Buyer Fit'}
            </button>
            <span className="text-sm ml-auto" style={{ color: 'var(--gray)' }}>
              {filtered.length === listings.length ? `${listings.length} properties` : `${filtered.length} of ${listings.length} properties`}
            </span>
          </div>

          {triageError && (
            <div className="text-sm rounded-lg px-3.5 py-2.5 mb-3.5" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>⚠️ {triageError}</div>
          )}

          {addError && (
            <div className="text-sm rounded-lg px-3.5 py-2.5 mb-3.5" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>⚠️ {addError}</div>
          )}

          {filtered.length === 0 ? (
            <EmptyState icon="🏚️" title="No listings match your filters" />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Match', 'Address', 'City', 'State', 'Zip', 'Case #', 'Acquired', '', ''].map(h => (
                      <th key={h} className="text-left px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--gray)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(l => {
                    const added = casesInCrm.has(l.caseNum)
                    return (
                      <tr key={l.caseNum} className="hover:bg-gray-50" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {scores[l.caseNum] ? (
                            <span title={scores[l.caseNum].reason} className="badge" style={{
                              background: scores[l.caseNum].score >= 60 ? 'var(--green-light)' : scores[l.caseNum].score >= 30 ? 'var(--amber-light)' : 'var(--gray-light)',
                              color: scores[l.caseNum].score >= 60 ? 'var(--green)' : scores[l.caseNum].score >= 30 ? 'var(--amber)' : 'var(--gray)',
                              cursor: 'help',
                            }}>{scores[l.caseNum].score}</span>
                          ) : <span style={{ color: '#ccc' }}>—</span>}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium whitespace-nowrap">{l.address.split(',')[0]}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">{l.city}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">{l.state}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">{l.zip}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap" style={{ color: 'var(--gray)' }}>{l.caseNum}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap" style={{ color: 'var(--gray)' }}>{l.acquired || '—'}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <a href={zillowUrl(l.address)} target="_blank" rel="noopener noreferrer" className="zillow-badge">Zillow</a>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {added ? (
                            <span className="btn btn-outline btn-sm" style={{ cursor: 'default' }}>✓ In CRM</span>
                          ) : (
                            <button className="btn btn-primary btn-sm" disabled={addingCase === l.caseNum} onClick={() => addToCrm(l)}>
                              {addingCase === l.caseNum ? '...' : '+ Add to CRM'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="text-xs" style={{ color: 'var(--gray)' }}>Page {page} of {pageCount}</span>
              <button className="btn btn-outline btn-sm" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </>
  )
}
