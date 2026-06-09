'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import { parseLocation } from '@/lib/utils'
import PropertyPanel from './PropertyPanel'
import AddPropertyModal from './AddPropertyModal'
import SkipTraceModal from './SkipTraceModal'
import EmptyState from '@/components/ui/EmptyState'
import type { Property } from '@/types'

export default function GeoView() {
  const { properties, partners } = useCRM()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [collapsedStates, setCollapsedStates] = useState<Set<string>>(new Set())
  const [collapsedCities, setCollapsedCities] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editProperty, setEditProperty] = useState<Property | null>(null)
  const [propModalOpen, setPropModalOpen] = useState(false)
  const [skipProperty, setSkipProperty] = useState<Property | null>(null)

  // Build state → city → properties tree
  const tree = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = properties.filter(p => {
      if (q && !([p.address, p.owner_name, p.phone].join(' ').toLowerCase().includes(q))) return false
      if (stateFilter) {
        const { state } = parseLocation(p.address)
        if (state.toUpperCase() !== stateFilter.toUpperCase()) return false
      }
      return true
    })

    const map: Record<string, Record<string, Property[]>> = {}
    filtered.forEach(p => {
      const { state, city } = parseLocation(p.address)
      const st = state || 'Unknown'
      const ct = city || 'Unknown'
      if (!map[st]) map[st] = {}
      if (!map[st][ct]) map[st][ct] = []
      map[st][ct].push(p)
    })
    // Sort states, then cities
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, cities]) => ({
        state,
        count: Object.values(cities).flat().length,
        cities: Object.entries(cities)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([city, props]) => ({ city, props })),
      }))
  }, [properties, search, stateFilter])

  const allStates = useMemo(() => {
    const set = new Set<string>()
    properties.forEach(p => { const { state } = parseLocation(p.address); if (state) set.add(state) })
    return [...set].sort()
  }, [properties])

  const toggleState = (s: string) => setCollapsedStates(prev => {
    const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n
  })
  const toggleCity = (key: string) => setCollapsedCities(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n
  })

  const activeProp = activeId ? properties.find(x => x.id === activeId) : null

  return (
    <>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm" style={{ color: 'var(--gray)' }}>Properties organized by state and city</div>
        <button className="btn btn-outline btn-sm" onClick={() => router.push('/map')}>🗺 View on Map</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search state, city, address..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
        </div>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="filter-select">
          <option value="">All states</option>
          {allStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {tree.length === 0 ? (
        <EmptyState icon="🗺" title="No properties to display" sub="Add properties with addresses to see them organized by location" />
      ) : tree.map(({ state, count, cities }) => {
        const isStateOpen = !collapsedStates.has(state)
        return (
          <div key={state} className="mb-5">
            {/* State header */}
            <div className="geo-state-header" onClick={() => toggleState(state)}>
              <span className="text-lg">{isStateOpen ? '▼' : '▶'}</span>
              <span className="font-heading font-bold text-base flex-1">{state}</span>
              <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: 'rgba(255,255,255,.15)' }}>{count} propert{count === 1 ? 'y' : 'ies'}</span>
            </div>

            {isStateOpen && cities.map(({ city, props }) => {
              const cityKey = `${state}::${city}`
              const isCityOpen = !collapsedCities.has(cityKey)
              return (
                <div key={city} className="mb-2.5 ml-4">
                  {/* City/county header */}
                  <div className="geo-county-header" onClick={() => toggleCity(cityKey)}>
                    <span className="text-sm" style={{ color: 'var(--orange)' }}>{isCityOpen ? '▼' : '▶'}</span>
                    <span className="font-heading font-semibold text-sm flex-1" style={{ color: 'var(--orange-dark)' }}>{city}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--orange)' }}>{props.length}</span>
                  </div>

                  {isCityOpen && (
                    <div className="ml-4 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
                      {props.map(p => {
                        const partner = partners.find(x => x.id === p.partner_id)
                        const fus = Array.isArray(p.followups) ? p.followups : []
                        return (
                          <div key={p.id}
                            className={`prop-card ${activeId === p.id ? 'active-card' : ''}`}
                            onClick={() => setActiveId(p.id)}>
                            <div className="font-heading font-semibold text-sm mb-1">{p.address || '(No address)'}</div>
                            <div className="text-sm mb-2" style={{ color: 'var(--gray)' }}>
                              {p.owner_name || 'Owner unknown'}
                              {p.phone && <> · <span style={{ color: 'var(--orange)' }}>{p.phone}</span></>}
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className={`badge badge-${p.status}`}>{p.status}</span>
                            </div>
                            <div className="flex gap-3 text-xs flex-wrap mt-1.5" style={{ color: '#aaa' }}>
                              {partner && <span>👤 {partner.name}</span>}
                              {fus.length > 0 && <span>💬 {fus.length}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Detail panel */}
      <div className={`panel-overlay ${activeProp ? 'open' : ''}`} onClick={() => setActiveId(null)} />
      <div className={`detail-panel ${activeProp ? 'open' : ''}`}>
        {activeProp && (
          <PropertyPanel property={activeProp} partners={partners} onClose={() => setActiveId(null)}
            onEdit={() => { setEditProperty(activeProp); setPropModalOpen(true) }}
            onSkipTrace={() => setSkipProperty(activeProp)}
            onLetter={() => { setActiveId(null); router.push(`/letters?prop=${activeProp.id}`) }}
            onMatch={() => { setActiveId(null); router.push(`/buyers?match=${activeProp.id}`) }} />
        )}
      </div>
      <AddPropertyModal open={propModalOpen} editProperty={editProperty} onClose={() => setPropModalOpen(false)} />
      {skipProperty && <SkipTraceModal property={skipProperty} onClose={() => setSkipProperty(null)} />}
    </>
  )
}
