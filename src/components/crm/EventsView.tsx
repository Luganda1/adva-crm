'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import { todayStr, fmtD } from '@/lib/utils'
import PropertyPanel from './PropertyPanel'
import AddPropertyModal from './AddPropertyModal'
import SkipTraceModal from './SkipTraceModal'
import EmptyState from '@/components/ui/EmptyState'
import type { Property } from '@/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function EventsView() {
  const { properties, partners } = useCRM()
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editProp, setEditProp] = useState<Property | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [skipProp, setSkipProp] = useState<Property | null>(null)

  const events = useMemo(() => {
    const today = todayStr()
    const evts: { date: string; type: string; addr: string; id: string }[] = []
    properties.forEach(p => {
      if (p.probate_date && p.probate_date >= today) evts.push({ date: p.probate_date, type: 'probate', addr: p.address, id: p.id })
      if (p.foreclosure_date && p.foreclosure_date >= today) evts.push({ date: p.foreclosure_date, type: 'foreclosure', addr: p.address, id: p.id })
      if (p.auction_date && p.auction_date >= today) evts.push({ date: p.auction_date, type: 'auction', addr: p.address, id: p.id })
    })
    return evts.sort((a, b) => a.date.localeCompare(b.date))
  }, [properties])

  const activeProp = activeId ? properties.find(x => x.id === activeId) : null

  return (
    <>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Upcoming probate filings, foreclosure sales, and auctions</p>
      {events.length === 0 ? <EmptyState icon="📅" title="No upcoming events" sub="Add probate, foreclosure, or auction dates to properties" /> :
        events.map(e => {
          const d = new Date(e.date + 'T12:00:00')
          const diff = Math.round((d.getTime() - Date.now()) / 86400000)
          return (
            <div key={e.id + e.type} className="event-row" onClick={() => setActiveId(e.id)}>
              <div className="rounded-lg px-3 py-2 text-center min-w-[54px] flex-shrink-0" style={{ background: 'var(--orange)', color: '#fff' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide">{MONTHS[d.getMonth()]}</div>
                <div className="font-heading font-bold text-xl leading-none">{d.getDate()}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-semibold text-sm truncate">{e.addr}</div>
                <div className="mt-0.5"><span className={`badge badge-${e.type}`}>{e.type}</span></div>
              </div>
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${diff <= 7 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-700'}`}>
                {diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff} days`}
              </div>
            </div>
          )
        })}
      <div className={`panel-overlay ${activeProp ? 'open' : ''}`} onClick={() => setActiveId(null)} />
      <div className={`detail-panel ${activeProp ? 'open' : ''}`}>
        {activeProp && <PropertyPanel property={activeProp} partners={partners} onClose={() => setActiveId(null)}
          onEdit={() => { setEditProp(activeProp); setModalOpen(true) }}
          onSkipTrace={() => setSkipProp(activeProp)}
          onLetter={() => { setActiveId(null); router.push(`/letters?prop=${activeProp.id}`) }}
          onMatch={() => { setActiveId(null); router.push(`/buyers?match=${activeProp.id}`) }} />}
      </div>
      <AddPropertyModal open={modalOpen} editProperty={editProp} onClose={() => setModalOpen(false)} />
      {skipProp && <SkipTraceModal property={skipProp} onClose={() => setSkipProp(null)} />}
    </>
  )
}
