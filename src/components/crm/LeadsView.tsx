'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import { dateInRange, getDateForField } from '@/lib/utils'
import PropertyCard from './PropertyCard'
import PropertyPanel from './PropertyPanel'
import AddPropertyModal from './AddPropertyModal'
import SkipTraceModal from './SkipTraceModal'
import EmptyState from '@/components/ui/EmptyState'
import type { Property } from '@/types'

export default function LeadsView() {
  const { properties, partners } = useCRM()
  const router = useRouter()
  const [search, setSearch] = useState(''); const [fStatus, setFStatus] = useState(''); const [fPartner, setFPartner] = useState('')
  const [fDateType, setFDateType] = useState(''); const [fDateRange, setFDateRange] = useState('')
  const [fDateFrom, setFDateFrom] = useState(''); const [fDateTo, setFDateTo] = useState(''); const [fSort, setFSort] = useState('newest')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editProp, setEditProp] = useState<Property | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [skipProp, setSkipProp] = useState<Property | null>(null)

  const filtered = useMemo(() => {
    let list = properties.filter(p => {
      const txt = [p.address, p.owner_name, p.phone, p.email, p.notes].join(' ').toLowerCase()
      if (search && !txt.includes(search.toLowerCase())) return false
      if (fStatus && p.status !== fStatus) return false
      if (fPartner && p.partner_id !== fPartner) return false
      if (fDateType && fDateRange) { const d = getDateForField(p, fDateType); if (!dateInRange(d, fDateRange, fDateFrom, fDateTo)) return false }
      return true
    })
    return list.sort((a, b) => {
      if (fSort === 'newest') return b.created_at.localeCompare(a.created_at)
      if (fSort === 'oldest') return a.created_at.localeCompare(b.created_at)
      if (fSort === 'address') return (a.address || '').localeCompare(b.address || '')
      if (fSort === 'owner') return (a.owner_name || '').localeCompare(b.owner_name || '')
      if (fSort === 'followup') return (a.next_followup || '9999').localeCompare(b.next_followup || '9999')
      if (fSort === 'probate') return (a.probate_date || '9999').localeCompare(b.probate_date || '9999')
      if (fSort === 'foreclosure') return (a.foreclosure_date || '9999').localeCompare(b.foreclosure_date || '9999')
      if (fSort === 'auction') return (a.auction_date || '9999').localeCompare(b.auction_date || '9999')
      return 0
    })
  }, [properties, search, fStatus, fPartner, fDateType, fDateRange, fDateFrom, fDateTo, fSort])

  function clear() { setSearch(''); setFStatus(''); setFPartner(''); setFDateType(''); setFDateRange(''); setFDateFrom(''); setFDateTo(''); setFSort('newest') }
  const activeProp = activeId ? properties.find(x => x.id === activeId) : null

  return (
    <>
      <div className="flex gap-2 mb-2.5 flex-wrap items-center">
        <div className="relative flex-[2] min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address, owner, phone, notes..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
        </div>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} className={`filter-select ${fStatus ? 'filter-active' : ''}`}>
          <option value="">All statuses</option>
          {['lead','active','probate','foreclosure','auction'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <select value={fPartner} onChange={e => setFPartner(e.target.value)} className={`filter-select ${fPartner ? 'filter-active' : ''}`}>
          <option value="">All partners</option>
          {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={fDateType} onChange={e => setFDateType(e.target.value)} className={`filter-select ${fDateType ? 'filter-active' : ''}`}>
          <option value="">Any date</option>
          <option value="added">Date added</option><option value="probate">Probate</option>
          <option value="foreclosure">Foreclosure</option><option value="auction">Auction</option><option value="followup">Follow-up</option>
        </select>
        <select value={fDateRange} onChange={e => setFDateRange(e.target.value)} className={`filter-select ${fDateRange ? 'filter-active' : ''}`}>
          <option value="">Any time</option><option value="today">Today</option><option value="7">Next 7 days</option>
          <option value="30">Next 30 days</option><option value="past7">Past 7 days</option><option value="past30">Past 30 days</option>
          <option value="expired">Expired</option><option value="custom">Custom</option>
        </select>
        {fDateRange === 'custom' && (
          <div className="flex gap-1.5 items-center">
            <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)} className="filter-select" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)} className="filter-select" />
          </div>
        )}
        <button className="btn btn-outline btn-sm" onClick={clear}>✕ Clear</button>
        <button className="btn btn-primary btn-sm ml-auto" onClick={() => { setEditProp(null); setModalOpen(true) }}>+ Add Property</button>
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-sm" style={{ color: filtered.length < properties.length ? 'var(--orange)' : 'var(--gray)' }}>
          {filtered.length === properties.length ? `${properties.length} properties` : `${filtered.length} of ${properties.length} properties`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--gray)' }}>Sort:</span>
          <select value={fSort} onChange={e => setFSort(e.target.value)} className="filter-select text-xs">
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
            <option value="address">Address A–Z</option><option value="owner">Owner A–Z</option>
            <option value="followup">Next follow-up</option><option value="probate">Probate date</option>
            <option value="foreclosure">Foreclosure date</option><option value="auction">Auction date</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No properties match your filters" action={<button className="btn btn-outline btn-sm" onClick={clear}>Clear filters</button>} />
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))' }}>
          {filtered.map(p => <PropertyCard key={p.id} property={p} partners={partners} isActive={activeId === p.id} onClick={() => setActiveId(p.id)} />)}
        </div>
      )}

      <div className={`panel-overlay ${activeProp ? 'open' : ''}`} onClick={() => setActiveId(null)} />
      <div className={`detail-panel ${activeProp ? 'open' : ''}`}>
        {activeProp && <PropertyPanel property={activeProp} partners={partners} onClose={() => setActiveId(null)}
          onEdit={() => { setEditProp(activeProp); setModalOpen(true) }}
          onSkipTrace={() => setSkipProp(activeProp)}
          onLetter={() => { setActiveId(null); router.push(`/letters?prop=${activeProp.id}`) }}
          onMatch={() => { setActiveId(null); router.push(`/buyers?match=${activeProp.id}`) }} />}
      </div>
      <AddPropertyModal open={modalOpen} editProperty={editProp} onClose={() => setModalOpen(false)} onSaved={id => { if (!editProp) setActiveId(id) }} />
      {skipProp && <SkipTraceModal property={skipProp} onClose={() => setSkipProp(null)} />}
    </>
  )
}
