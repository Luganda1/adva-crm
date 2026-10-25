import { fmtD, fmt$, todayStr } from '@/lib/utils'
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

  // Only show the listing-photo treatment when there's actual MLS-style data —
  // most leads are phone/notes only, and a placeholder photo on every one of
  // those would just be visual noise. Properties pulled in via Property Search
  // (or enriched/edited to add it) get the fuller card.
  const stats = [p.beds != null && `${p.beds} bd`, p.baths != null && `${p.baths} ba`, p.sqft != null && `${p.sqft.toLocaleString()} sqft`].filter(Boolean)
  const hasListingData = !!(p.image_url || p.list_price != null || stats.length > 0)

  return (
    <div className={`prop-card ${isActive ? 'active-card' : ''}`} onClick={onClick}>
      {hasListingData && (
        p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt={p.address} className="w-full h-36 object-cover rounded-lg mb-2.5 -mt-1" />
        ) : (
          <div className="w-full h-36 rounded-lg mb-2.5 -mt-1 flex items-center justify-center text-3xl" style={{ background: 'var(--gray-light)', color: '#ccc' }}>
            🏠
          </div>
        )
      )}

      {p.list_price != null && (
        <div className="font-heading font-bold text-lg leading-none mb-1">{fmt$(p.list_price)}</div>
      )}
      {stats.length > 0 && (
        <div className="text-sm font-medium mb-1.5">{stats.join(' · ')}</div>
      )}

      <div className="flex justify-between items-start mb-1.5">
        <div className={hasListingData ? 'text-sm truncate' : 'font-heading font-semibold text-sm'} style={hasListingData ? { color: 'var(--gray)' } : undefined}>
          {p.address || '(No address)'}
        </div>
        {p.created_at && <span className="text-[11px] ml-2 flex-shrink-0" style={{ color: 'var(--gray)' }}>Added {fmtD(p.created_at.slice(0, 10))}</span>}
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
        {p.phone && <span style={{ color: 'var(--orange)', fontWeight: 500 }}>📞 {p.phone}</span>}
        {partner && <span>👤 {partner.name}</span>}
        {fus.length > 0 && <span>💬 {fus.length} log{fus.length > 1 ? 's' : ''}</span>}
        {docs.length > 0 && <span>📄 {docs.length} doc{docs.length > 1 ? 's' : ''}</span>}
      </div>
    </div>
  )
}
