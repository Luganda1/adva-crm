'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import { fmt$ } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { PropertySearchResult } from '@/app/api/property-search/route'

export default function PropertySearchView() {
  const { saveProperty } = useCRM()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [results, setResults] = useState<PropertySearchResult[]>([])
  const [addedKeys, setAddedKeys] = useState<Record<string, string>>({}) // mlsNumber -> property id
  const [addError, setAddError] = useState<string>('')

  async function runSearch() {
    const q = query.trim()
    if (!q) return
    setStatus('loading'); setError('')
    try {
      const res = await fetch(`/api/property-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Search failed (${res.status})`)
      setResults(data.results || [])
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setStatus('error')
    }
  }

  async function addToCRM(r: PropertySearchResult) {
    const fullAddress = [r.address, [r.city, r.state && r.zip ? `${r.state} ${r.zip}` : r.state || r.zip].filter(Boolean).join(', ')]
      .filter(Boolean).join(', ')
    const details = [
      r.propertyType, r.beds != null ? `${r.beds} bed` : null, r.baths != null ? `${r.baths} bath` : null,
      r.sqft != null ? `${r.sqft.toLocaleString()} sqft` : null, r.yearBuilt ? `built ${r.yearBuilt}` : null,
      r.listPrice != null ? `list ${fmt$(r.listPrice)}` : null, r.estimatedValue != null ? `est. value ${fmt$(r.estimatedValue)}` : null,
    ].filter(Boolean).join(', ')
    const notes = [`MLS# ${r.mlsNumber}`, details].filter(Boolean).join(' | ')

    setAddError('')
    try {
      const id = await saveProperty({
        address: fullAddress, notes, status: 'lead',
        image_url: r.image, list_price: r.listPrice, beds: r.beds, baths: r.baths, sqft: r.sqft,
      })
      // saveProperty doesn't surface Supabase errors (e.g. an RLS rejection) — it just
      // returns '' — so treat a falsy id as a failed write, not a success.
      if (!id) throw new Error('Save returned no id — check Supabase write permissions (RLS).')
      setAddedKeys(prev => ({ ...prev, [r.mlsNumber]: id }))
    } catch (e) {
      setAddError(`Couldn't add "${r.address}" to the CRM: ${e instanceof Error ? e.message : 'unknown error'}`)
    }
  }

  return (
    <>
      <div className="mb-1">
        <h1 className="font-heading font-bold text-lg mb-0.5">🔍 Property Search</h1>
        <p className="text-sm" style={{ color: 'var(--gray)' }}>Look up a property by address and add it as a lead with one click.</p>
      </div>

      <div className="flex gap-2 my-3.5 flex-wrap items-center">
        <div className="relative flex-[2] min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
            placeholder="123 Main St, Springfield, IL..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <button className="btn btn-primary btn-sm" disabled={!query.trim() || status === 'loading'} onClick={runSearch}>
          {status === 'loading' ? 'Searching...' : 'Search'}
        </button>
      </div>

      {addError && (
        <div className="text-sm rounded-lg px-3.5 py-2.5 mb-3.5" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
          ⚠️ {addError}
        </div>
      )}

      {status === 'error' && (
        <EmptyState icon="⚠️" title="Search failed" sub={error}
          action={<button className="btn btn-outline btn-sm" onClick={runSearch}>Try again</button>} />
      )}

      {status === 'done' && results.length === 0 && (
        <EmptyState icon="🏚️" title="No properties matched that address" sub="Try a broader search — just the street name and city often works better than a full address." />
      )}

      {status === 'idle' && (
        <EmptyState icon="🏠" title="Search any address to get started" sub="Pulls live listing details — beds, baths, sqft, year built, price, and estimated value." />
      )}

      {results.length > 0 && (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))' }}>
          {results.map(r => {
            const addedId = addedKeys[r.mlsNumber]
            const cityStateZip = [r.city, r.state && r.zip ? `${r.state} ${r.zip}` : r.state || r.zip].filter(Boolean).join(', ')
            return (
              <div key={r.mlsNumber} className="prop-card" style={{ cursor: 'default' }}>
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt={r.address} className="w-full h-32 object-cover rounded-lg mb-2.5" />
                )}
                <div className="font-heading font-semibold text-sm mb-0.5">{r.address || '(No street address)'}</div>
                {cityStateZip && <div className="text-xs mb-2" style={{ color: 'var(--gray)' }}>{cityStateZip}</div>}
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {r.propertyType && <span className="badge badge-lead">{r.propertyType}</span>}
                  {r.status && <span className="badge badge-active">{r.status}</span>}
                </div>
                <div className="text-sm mb-2" style={{ color: 'var(--gray)' }}>
                  {[r.beds != null && `${r.beds} bd`, r.baths != null && `${r.baths} ba`, r.sqft != null && `${r.sqft.toLocaleString()} sqft`, r.yearBuilt && `built ${r.yearBuilt}`]
                    .filter(Boolean).join(' · ') || 'No details available'}
                </div>
                <div className="flex gap-3 text-xs flex-wrap mb-3" style={{ color: '#aaa' }}>
                  {r.listPrice != null && <span>💲 List {fmt$(r.listPrice)}</span>}
                  {r.estimatedValue != null && <span>📈 Est. {fmt$(r.estimatedValue)}</span>}
                </div>
                {addedId ? (
                  <button className="btn btn-outline btn-sm w-full" onClick={() => router.push('/leads')}>✓ Added — view in Leads</button>
                ) : (
                  <button className="btn btn-primary btn-sm w-full" onClick={() => addToCRM(r)}>+ Add to CRM</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
