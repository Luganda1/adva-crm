'use client'
import { useState, useMemo } from 'react'
import { useMP } from '@/contexts/MPContext'
import { fmt$ } from '@/lib/utils'
import AddMPModal from './AddMPModal'
import MPPanel from './MPPanel'
import EmptyState from '@/components/ui/EmptyState'
import type { MoneyPartner } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  private:'Private Lender', hard:'Hard Money', jv:'JV Partner', equity:'Equity Partner',
  loc:'Line of Credit', roth:'Roth IRA', ira:'Traditional IRA', lifeins:'Life Insurance',
  cash:'Cash Investor', '401k':'401k', other:'Other'
}
const CHIP_COLORS: Record<string, string> = {
  private:'bg-stone-100 text-stone-700', hard:'bg-red-50 text-red-500', jv:'bg-purple-50 text-purple-700',
  equity:'bg-amber-50 text-amber-700', loc:'bg-teal-50 text-teal-700', roth:'bg-green-50 text-green-700',
  ira:'bg-green-50 text-green-700', lifeins:'bg-green-50 text-green-700', cash:'bg-stone-100 text-stone-700',
  '401k':'bg-green-50 text-green-700', other:'bg-teal-50 text-teal-700',
}
const PARTNER_TYPES = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))

function TypeChips({ p }: { p: MoneyPartner }) {
  const types = p.partner_types?.length ? p.partner_types : [p.partner_type || 'private']
  return (
    <div className="flex flex-wrap gap-1">
      {types.map(t => <span key={t} className={`text-xs font-bold px-2 py-0.5 rounded-full font-heading uppercase tracking-wide ${CHIP_COLORS[t] || 'bg-teal-50 text-teal-700'}`}>{TYPE_LABELS[t] || t}</span>)}
    </div>
  )
}

export function MPAllView() {
  const { partners } = useMP()
  const [search, setSearch] = useState(''); const [filterType, setFilterType] = useState(''); const [filterStatus, setFilterStatus] = useState('')
  const [addOpen, setAddOpen] = useState(false); const [editPartner, setEditPartner] = useState<MoneyPartner | null>(null)
  const [activePartner, setActivePartner] = useState<MoneyPartner | null>(null)

  const filtered = useMemo(() => partners.filter(p => {
    const txt = [p.name, p.company, p.city, p.locations, p.notes].join(' ').toLowerCase()
    const ptypes = p.partner_types?.length ? p.partner_types : [p.partner_type || 'private']
    return (!search || txt.includes(search.toLowerCase())) && (!filterType || ptypes.includes(filterType)) && (!filterStatus || p.availability === filterStatus)
  }), [partners, search, filterType, filterStatus])

  return (
    <>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, company, city, notes..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="filter-select">
          <option value="">All types</option>
          {PARTNER_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
          <option value="">All statuses</option>
          <option value="active">Active</option><option value="paused">Paused</option><option value="deployed">Fully Deployed</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditPartner(null); setAddOpen(true) }}>+ Add Partner</button>
      </div>

      {filtered.length === 0 ? <EmptyState icon="💰" title="No money partners yet" sub="Add private lenders, JV partners, and investors to track your capital network" /> : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all shadow-sm relative overflow-hidden hover:border-gray-500 hover:shadow-md" onClick={() => setActivePartner(p)}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: p.availability === 'deployed' ? 'var(--amber)' : p.availability === 'paused' ? '#aaa' : 'var(--orange)' }} />
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <div className="font-heading font-bold text-sm">{p.name}</div>
                  {p.company && <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>{p.company}</div>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-heading ${p.availability === 'active' ? 'bg-green-50 text-green-700' : p.availability === 'paused' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>
                  {p.availability === 'active' ? 'Active' : p.availability === 'paused' ? 'Paused' : 'Fully Deployed'}
                </span>
              </div>
              <div className="mb-2"><TypeChips p={p} /></div>
              <div className="font-heading font-bold text-lg mb-0.5">{fmt$(p.capital_available)}</div>
              <div className="text-xs mb-1.5" style={{ color: 'var(--gray)' }}>available{p.total_capital ? ' of ' + fmt$(p.total_capital) : ''}</div>
              {(p.interest_rate || p.points) && <div className="text-xs font-semibold mb-1">{p.interest_rate ? p.interest_rate + '% ' : ''}{p.points ? '· ' + p.points + ' pts' : ''}{p.term_length ? ' · ' + p.term_length : ''}</div>}
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#aaa' }}>
                {p.city && <span>📍 {p.city}{p.state ? ', ' + p.state : ''}</span>}
                {(p.asset_types || []).length > 0 && <span>🏠 {(p.asset_types || []).join(', ')}</span>}
                {(p.deals || []).length > 0 && <span>📊 {(p.deals || []).length} deal{(p.deals || []).length > 1 ? 's' : ''}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`panel-overlay ${activePartner ? 'open' : ''}`} onClick={() => setActivePartner(null)} />
      <div className={`detail-panel ${activePartner ? 'open' : ''}`} style={{ width: 'min(560px,100vw)' }}>
        {activePartner && <MPPanel partner={activePartner} onEdit={() => { setEditPartner(activePartner); setAddOpen(true) }} onClose={() => setActivePartner(null)} />}
      </div>
      <AddMPModal open={addOpen} editPartner={editPartner} onClose={() => setAddOpen(false)} onSaved={() => setActivePartner(null)} />
    </>
  )
}

export function MPPipelineView() {
  const { partners } = useMP()
  const [activePartner, setActivePartner] = useState<MoneyPartner | null>(null)
  const [addOpen, setAddOpen] = useState(false); const [editPartner, setEditPartner] = useState<MoneyPartner | null>(null)

  return (
    <>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Partner availability at a glance</p>
      <div className="grid grid-cols-3 gap-4">
        {(['active', 'deployed', 'paused'] as const).map(status => {
          const list = partners.filter(p => (p.availability || 'active') === status)
          const colCls = { active: 'text-green-700', deployed: 'text-amber-700', paused: 'text-gray-500' }
          const cntCls = { active: 'bg-orange-50 text-brand', deployed: 'bg-amber-50 text-amber-700', paused: 'bg-gray-100 text-gray-500' }
          const labels = { active: 'Active', deployed: 'Deployed', paused: 'Paused' }
          return (
            <div key={status} className="bg-gray-100 rounded-xl p-3.5">
              <div className={`flex items-center justify-between font-heading font-bold text-xs uppercase tracking-wider mb-3 ${colCls[status]}`}>
                {labels[status]}<span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cntCls[status]}`}>{list.length}</span>
              </div>
              {list.length === 0 ? <div className="text-xs text-gray-400 py-2">None</div> :
                list.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-2 cursor-pointer hover:border-gray-400 transition-colors shadow-sm" onClick={() => setActivePartner(p)}>
                    <div className="font-heading font-semibold text-sm">{p.name}</div>
                    {p.company && <div className="text-xs text-gray-400 mt-0.5">{p.company}</div>}
                    <div className="text-xs font-semibold mt-1" style={{ color: 'var(--orange)' }}>{fmt$(p.capital_available)}</div>
                    {p.interest_rate && <div className="text-xs text-gray-400 mt-0.5">{p.interest_rate}% {p.points ? '· ' + p.points + ' pts' : ''}</div>}
                  </div>
                ))}
            </div>
          )
        })}
      </div>
      <div className={`panel-overlay ${activePartner ? 'open' : ''}`} onClick={() => setActivePartner(null)} />
      <div className={`detail-panel ${activePartner ? 'open' : ''}`} style={{ width: 'min(560px,100vw)' }}>
        {activePartner && <MPPanel partner={activePartner} onEdit={() => { setEditPartner(activePartner); setAddOpen(true) }} onClose={() => setActivePartner(null)} />}
      </div>
      <AddMPModal open={addOpen} editPartner={editPartner} onClose={() => setAddOpen(false)} />
    </>
  )
}

export function MPDealsView() {
  const { partners } = useMP()
  const [activePartner, setActivePartner] = useState<MoneyPartner | null>(null)
  const allDeals = useMemo(() => {
    const all: { partnerName: string; partnerId: string; date: string; amount: number; property: string; return_to_partner: string; notes: string }[] = []
    partners.forEach(p => (p.deals || []).forEach(d => all.push({ ...d, partnerName: p.name, partnerId: p.id })))
    return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [partners])

  return (
    <>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>All logged deals across every money partner</p>
      {allDeals.length === 0 ? <EmptyState icon="📊" title="No deals logged yet" sub="Log deals from a partner's detail panel" /> :
        allDeals.map((d, i) => (
          <div key={i} className="flex items-center gap-3.5 p-3.5 bg-white border border-gray-200 rounded-lg mb-2 cursor-pointer shadow-sm hover:border-brand transition-colors"
            onClick={() => setActivePartner(partners.find(x => x.id === d.partnerId) || null)}>
            <div className="rounded-lg px-3 py-2 text-center min-w-[56px] flex-shrink-0" style={{ background: 'var(--orange-light)' }}>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--orange-dark)' }}>{d.date?.slice(0, 7)}</div>
              <div className="font-heading font-bold text-base" style={{ color: '#2C2C2C' }}>{d.date?.slice(8, 10)}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{d.property || 'Deal'}</div>
              <div className="text-xs text-gray-400">via {d.partnerName}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-heading font-bold text-sm">{fmt$(d.amount)}</div>
              {d.return_to_partner && <div className="text-xs text-green-600">{d.return_to_partner}</div>}
            </div>
          </div>
        ))}
      <div className={`panel-overlay ${activePartner ? 'open' : ''}`} onClick={() => setActivePartner(null)} />
      <div className={`detail-panel ${activePartner ? 'open' : ''}`} style={{ width: 'min(560px,100vw)' }}>
        {activePartner && <MPPanel partner={activePartner} onEdit={() => {}} onClose={() => setActivePartner(null)} />}
      </div>
    </>
  )
}
