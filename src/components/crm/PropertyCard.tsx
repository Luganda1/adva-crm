import { fmtD, todayStr } from '@/lib/utils'
import type { Property, Partner } from '@/types'

function chip(label: string, dateStr: string | null) {
  if (!dateStr) return null
  const today = todayStr(), d = dateStr.slice(0, 10)
  const diff = Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000)
  if (diff < 0) return { cls: 'expired', txt: `${label}: ${fmtD(d)} (${Math.abs(diff)}d ago)` }
  if (diff === 0) return { cls: 'soon', txt: `${label}: Today` }
  if (diff <= 7) return { cls: 'soon', txt: `${label}: ${fmtD(d)} (${diff}d)` }
  return { cls: 'future', txt: `${label}: ${fmtD(d)}` }
}

export default function PropertyCard({ property: p, partners, isActive, onClick }: {
  property: Property; partners: Partner[]; isActive: boolean; onClick: () => void
}) {
  const today = todayStr()
  const partner = partners.find(x => x.id === p.partner_id)
  const fus = Array.isArray(p.followups) ? p.followups : []
  const docs = Array.isArray(p.docs) ? p.docs : []
  const chips = [chip('Probate', p.probate_date), chip('FC', p.foreclosure_date), chip('Auction', p.auction_date), chip('F/U', p.next_followup)].filter(Boolean)

  return (
    <div className={`prop-card ${isActive ? 'active-card' : ''}`} onClick={onClick}>
      <div className="flex justify-between items-start mb-1.5">
        <div className="font-heading font-semibold text-sm">{p.address || '(No address)'}</div>
        {p.created_at && <span className="text-[11px] ml-2 flex-shrink-0" style={{ color: 'var(--gray)' }}>Added {fmtD(p.created_at.slice(0, 10))}</span>}
      </div>
      <div className="text-sm mb-2" style={{ color: 'var(--gray)' }}>
        {p.owner_name || 'Owner unknown'}
        {p.phone && <> · <span style={{ color: 'var(--orange)', fontWeight: 500 }}>{p.phone}</span></>}
      </div>
      <div className="flex gap-1.5 flex-wrap mb-2">
        <span className={`badge badge-${p.status}`}>{p.status}</span>
        {p.next_followup && p.next_followup < today && <span className="badge badge-overdue">Overdue F/U</span>}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {chips.map((c, i) => c && <span key={i} className={`date-chip ${c.cls}`}>{c.txt}</span>)}
        </div>
      )}
      <div className="flex gap-3 text-xs flex-wrap" style={{ color: '#aaa' }}>
        {partner && <span>👤 {partner.name}</span>}
        {fus.length > 0 && <span>💬 {fus.length} log{fus.length > 1 ? 's' : ''}</span>}
        {docs.length > 0 && <span>📄 {docs.length} doc{docs.length > 1 ? 's' : ''}</span>}
      </div>
    </div>
  )
}
