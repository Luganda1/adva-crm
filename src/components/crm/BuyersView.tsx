'use client'
import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import AddBuyerModal from './AddBuyerModal'
import EmptyState from '@/components/ui/EmptyState'
import type { Buyer, Property } from '@/types'

const TYPE_LABELS: Record<string, string> = { cash:'Cash Buyer', flipper:'Fix & Flip', landlord:'Buy & Hold', realtor:'Realtor', wholesaler:'Wholesaler', lender:'Hard Money' }
const CHIP_COLORS: Record<string, string> = { cash:'bg-green-50 text-green-700', flipper:'bg-orange-50 text-orange-700', landlord:'bg-blue-50 text-blue-700', realtor:'bg-amber-50 text-amber-700', wholesaler:'bg-purple-50 text-purple-700', lender:'bg-red-50 text-red-500' }

export default function BuyersView() {
  const { buyers, properties, deleteBuyer } = useCRM()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(''); const [typeFilter, setTypeFilter] = useState(''); const [propFilter, setPropFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false); const [editBuyer, setEditBuyer] = useState<Buyer | null>(null)
  const [activeBuyer, setActiveBuyer] = useState<Buyer | null>(null)
  const [matchPropId, setMatchPropId] = useState(searchParams.get('match') || '')
  const [matchPrice, setMatchPrice] = useState('')
  const [matchResults, setMatchResults] = useState<{ buyer: Buyer; score: number }[]>([])

  const filtered = useMemo(() => buyers.filter(b => {
    const txt = [b.name, b.phone, b.email, b.company, b.areas, b.notes].join(' ').toLowerCase()
    return (!search || txt.includes(search.toLowerCase())) && (!typeFilter || b.buyer_type === typeFilter) && (!propFilter || (b.prop_types || []).includes(propFilter))
  }), [buyers, search, typeFilter, propFilter])

  function matchDeal() {
    const p = properties.find(x => x.id === matchPropId); if (!p) { alert('Select a property'); return }
    const addrParts = (p.address || '').toLowerCase().split(',').map(s => s.trim())
    const price = matchPrice ? Number(matchPrice) : null
    const scored = buyers.map(b => {
      let score = 0, total = 0
      const areas = (b.areas || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
      if (areas.length) { total += 40; if (areas.some(a => addrParts.some(pp => pp.includes(a) || a.includes(pp)))) score += 40 }
      if (price && (b.max_price || b.min_price)) {
        total += 40; const max = b.max_price ? Number(b.max_price) : Infinity; const min = b.min_price ? Number(b.min_price) : 0
        if (price >= min && price <= max) score += 40; else if (price <= max * 1.1) score += 20
      }
      return { buyer: b, score: total === 0 ? 30 : Math.round((score / total) * 100) }
    }).filter(r => r.score >= 30).sort((a, b) => b.score - a.score)
    setMatchResults(scored)
  }

  const matchedAreas = activeBuyer ? (activeBuyer.areas || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean) : []
  const matchingProps = activeBuyer ? properties.filter(p => matchedAreas.length && matchedAreas.some(a => (p.address || '').toLowerCase().includes(a))).slice(0, 5) : []

  return (
    <>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search buyer name, city, zip, notes..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select">
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={propFilter} onChange={e => setPropFilter(e.target.value)} className="filter-select">
          <option value="">All property types</option>
          {['SFR','Multi','Commercial','Land'].map(t => <option key={t} value={t}>{t === 'Multi' ? 'Multi-family' : t}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => { setEditBuyer(null); setModalOpen(true) }}>+ Add Buyer</button>
      </div>

      <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--orange-light)', border: '1px solid #e6a060' }}>
        <div className="font-heading font-bold text-sm mb-2.5" style={{ color: 'var(--orange-dark)' }}>🎯 Match a Deal to Buyers</div>
        <div className="flex gap-2.5 flex-wrap items-end">
          <div className="flex-1 min-w-[180px]">
            <div className="form-label">Select Property</div>
            <select value={matchPropId} onChange={e => setMatchPropId(e.target.value)} className="form-input">
              <option value="">-- Choose a property --</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address || '(No address)'}</option>)}
            </select>
          </div>
          <div className="min-w-[130px]">
            <div className="form-label">Asking Price</div>
            <input type="number" value={matchPrice} onChange={e => setMatchPrice(e.target.value)} placeholder="e.g. 350000" className="form-input" />
          </div>
          <button className="btn btn-primary" onClick={matchDeal}>Find Matching Buyers</button>
        </div>
        {matchResults.length > 0 && (
          <div className="mt-3.5">
            <div className="text-xs font-bold mb-2 font-heading" style={{ color: 'var(--orange-dark)' }}>{matchResults.length} MATCHING BUYER{matchResults.length > 1 ? 'S' : ''} FOUND</div>
            {matchResults.slice(0, 8).map(r => (
              <div key={r.buyer.id} className="flex items-center gap-3 p-2.5 bg-white border border-green-300 rounded-lg mb-2 cursor-pointer" onClick={() => setActiveBuyer(r.buyer)}>
                <div className={`font-heading font-bold text-sm min-w-[36px] ${r.score < 70 ? 'text-amber-600' : 'text-green-700'}`}>{r.score}%</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{r.buyer.name}</div>
                  <div className="text-xs text-gray-400">{r.buyer.buyer_type}{r.buyer.areas ? ' · ' + r.buyer.areas : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? <EmptyState icon="🏦" title="No buyers yet" sub="Add cash buyers, investors, and agents to your list" /> : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))' }}>
          {filtered.map(b => (
            <div key={b.id} className="buyer-card" onClick={() => setActiveBuyer(b)}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="font-heading font-semibold text-sm">{b.name}</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-heading uppercase tracking-wide ${CHIP_COLORS[b.buyer_type] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[b.buyer_type] || b.buyer_type}</span>
              </div>
              {b.company && <div className="text-xs mb-1" style={{ color: 'var(--gray)' }}>{b.company}</div>}
              <div className="text-sm mb-2" style={{ color: 'var(--gray)' }}>{[b.phone, b.email].filter(Boolean).join(' · ')}</div>
              {(b.max_price || b.min_price) && <div className="text-xs font-semibold mb-1.5">💰 {b.min_price ? '$' + Number(b.min_price).toLocaleString() : ''}{b.min_price && b.max_price ? ' – ' : ''}{b.max_price ? '$' + Number(b.max_price).toLocaleString() : ''}</div>}
              {(b.prop_types || []).length > 0 && <div className="mb-1.5">{(b.prop_types || []).map(pt => <span key={pt} className="inline-block text-xs px-1.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-semibold m-0.5">{pt}</span>)}</div>}
              {b.areas && <div className="text-xs" style={{ color: 'var(--gray)' }}>📍 {b.areas}</div>}
            </div>
          ))}
        </div>
      )}

      <div className={`panel-overlay ${activeBuyer ? 'open' : ''}`} onClick={() => setActiveBuyer(null)} />
      <div className={`detail-panel ${activeBuyer ? 'open' : ''}`}>
        {activeBuyer && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-heading font-bold text-sm truncate mr-2">{activeBuyer.name}</h2>
              <div className="flex gap-1.5">
                <button className="btn btn-outline btn-sm" onClick={() => { setEditBuyer(activeBuyer); setModalOpen(true) }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={async () => { if (!confirm('Remove this buyer?')) return; setActiveBuyer(null); await deleteBuyer(activeBuyer.id) }}>Delete</button>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveBuyer(null)}>✕</button>
              </div>
            </div>
            <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="panel-sec-title mb-3">Contact Info</div>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-heading font-bold text-base flex-shrink-0" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>{(activeBuyer.name || '?').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="font-heading font-semibold text-sm">{activeBuyer.name}</div>
                  {activeBuyer.company && <div className="text-xs" style={{ color: 'var(--gray)' }}>{activeBuyer.company}</div>}
                  <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>
                    {activeBuyer.phone && <a href={`tel:${activeBuyer.phone}`} style={{ color: 'var(--orange)' }}>{activeBuyer.phone}</a>}
                    {activeBuyer.phone && activeBuyer.email && ' · '}
                    {activeBuyer.email && <a href={`mailto:${activeBuyer.email}`} style={{ color: 'var(--orange)' }}>{activeBuyer.email}</a>}
                  </div>
                </div>
              </div>
              <div className="mt-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full font-heading uppercase tracking-wide ${CHIP_COLORS[activeBuyer.buyer_type] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[activeBuyer.buyer_type] || activeBuyer.buyer_type}</span></div>
            </section>
            <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="panel-sec-title mb-3">Buying Criteria</div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-gray-100 rounded-lg p-2.5"><div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gray)' }}>Min Price</div><div className="font-heading font-semibold text-sm mt-0.5">{activeBuyer.min_price ? '$' + Number(activeBuyer.min_price).toLocaleString() : '—'}</div></div>
                <div className="bg-gray-100 rounded-lg p-2.5"><div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gray)' }}>Max Price</div><div className="font-heading font-semibold text-sm mt-0.5">{activeBuyer.max_price ? '$' + Number(activeBuyer.max_price).toLocaleString() : '—'}</div></div>
              </div>
              {(activeBuyer.prop_types || []).length > 0 && <div className="mt-2.5">{(activeBuyer.prop_types || []).map(pt => <span key={pt} className="inline-block text-xs px-1.5 py-0.5 rounded-lg bg-gray-100 font-semibold m-0.5">{pt}</span>)}</div>}
              {activeBuyer.areas && <div className="mt-2.5 text-sm"><strong>Target areas:</strong> {activeBuyer.areas}</div>}
            </section>
            {matchingProps.length > 0 && (
              <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="panel-sec-title mb-3">🎯 Matching Properties ({matchingProps.length})</div>
                {matchingProps.map(mp => (
                  <div key={mp.id} className="flex items-center gap-3 p-2.5 bg-white border border-green-300 rounded-lg mb-2">
                    <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{mp.address}</div><div className="text-xs" style={{ color: 'var(--gray)' }}>{mp.status} · {mp.owner_name || 'Unknown'}</div></div>
                    <span className={`badge badge-${mp.status}`}>{mp.status}</span>
                  </div>
                ))}
              </section>
            )}
            {activeBuyer.notes && <section className="px-5 py-4"><div className="panel-sec-title mb-3">Notes</div><div className="text-sm leading-relaxed whitespace-pre-wrap">{activeBuyer.notes}</div></section>}
          </>
        )}
      </div>
      <AddBuyerModal open={modalOpen} editBuyer={editBuyer} onClose={() => setModalOpen(false)} />
    </>
  )
}
