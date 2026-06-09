'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import { todayStr } from '@/lib/utils'
import PropertyCard from './PropertyCard'
import PropertyPanel from './PropertyPanel'
import AddPropertyModal from './AddPropertyModal'
import SkipTraceModal from './SkipTraceModal'
import EmptyState from '@/components/ui/EmptyState'
import type { Property } from '@/types'

export default function FollowupView() {
  const { properties, partners } = useCRM()
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editProp, setEditProp] = useState<Property | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [skipProp, setSkipProp] = useState<Property | null>(null)

  const due = useMemo(() => {
    const in7 = new Date(); in7.setDate(in7.getDate() + 7)
    const in7s = in7.toISOString().slice(0, 10)
    return properties.filter(p => p.next_followup && p.next_followup <= in7s)
      .sort((a, b) => (a.next_followup || '').localeCompare(b.next_followup || ''))
  }, [properties])

  const activeProp = activeId ? properties.find(x => x.id === activeId) : null

  return (
    <>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Leads with follow-up due in the next 7 days or overdue</p>
      {due.length === 0 ? <EmptyState icon="✅" title="All clear!" sub="No follow-ups due in the next 7 days" /> : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))' }}>
          {due.map(p => <PropertyCard key={p.id} property={p} partners={partners} isActive={activeId === p.id} onClick={() => setActiveId(p.id)} />)}
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
      <AddPropertyModal open={modalOpen} editProperty={editProp} onClose={() => setModalOpen(false)} />
      {skipProp && <SkipTraceModal property={skipProp} onClose={() => setSkipProp(null)} />}
    </>
  )
}
