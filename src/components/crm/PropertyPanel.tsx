'use client'
import { useState } from 'react'
import { fmtD, fmt$, todayStr } from '@/lib/utils'
import { useCRM } from '@/contexts/CRMContext'
import type { Property, Partner } from '@/types'
import type { EnrichResult } from '@/app/api/enrich/route'

export default function PropertyPanel({ property: p, partners, onClose, onEdit, onSkipTrace, onLetter, onMatch }: {
  property: Property; partners: Partner[]
  onClose: () => void; onEdit: () => void; onSkipTrace: () => void; onLetter: () => void; onMatch: () => void
}) {
  const { deleteProperty, deleteFU, uploadDocs, deleteDoc, saveProperty } = useCRM()
  const partner = partners.find(x => x.id === p.partner_id)
  const today = todayStr()
  const fus = Array.isArray(p.followups) ? p.followups : []
  const docs = Array.isArray(p.docs) ? p.docs : []
  const dateItems = ([['Probate', p.probate_date], ['Foreclosure', p.foreclosure_date], ['Auction', p.auction_date], ['Next Follow-up', p.next_followup]] as [string, string | null][]).filter(([, d]) => d)

  const [enrichData, setEnrichData]     = useState<EnrichResult | null>(null)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [enrichError, setEnrichError]   = useState<string | null>(null)
  const [enrichApplied, setEnrichApplied] = useState(false)

  async function handleEnrich() {
    setEnrichLoading(true); setEnrichError(null); setEnrichData(null); setEnrichApplied(false)
    try {
      const res = await fetch(`/api/enrich?address=${encodeURIComponent(p.address)}`)
      const json = await res.json()
      if (!res.ok) { setEnrichError(json.error || 'Enrichment failed'); return }
      setEnrichData(json)
    } catch { setEnrichError('Network error — please try again') }
    finally { setEnrichLoading(false) }
  }

  async function applyEnrichment() {
    if (!enrichData) return
    const updates: Partial<Property> = {}
    if (enrichData.owner && !p.owner_name) updates.owner_name = enrichData.owner
    const lines = ['[Property Data]']
    if (enrichData.beds)           lines.push(`Beds: ${enrichData.beds}  Baths: ${enrichData.baths}  Sqft: ${enrichData.sqft?.toLocaleString()}`)
    if (enrichData.yearBuilt)      lines.push(`Year Built: ${enrichData.yearBuilt}  Type: ${enrichData.propertyType ?? '—'}`)
    if (enrichData.estimatedValue) lines.push(`Est. Value: ${fmt$(enrichData.estimatedValue)}`)
    if (enrichData.equity)         lines.push(`Est. Equity: ${fmt$(enrichData.equity)}`)
    if (enrichData.assessedValue)  lines.push(`Assessed: ${fmt$(enrichData.assessedValue)}`)
    if (enrichData.lastSalePrice)  lines.push(`Last Sale: ${fmt$(enrichData.lastSalePrice)} (${enrichData.lastSaleDate ?? '?'})`)
    if (enrichData.estimatedRent)  lines.push(`Est. Rent: ${fmt$(enrichData.estimatedRent)}/mo`)
    updates.notes = p.notes ? p.notes + '\n\n' + lines.join('\n') : lines.join('\n')
    await saveProperty(updates, p.id)
    setEnrichApplied(true)
  }

  async function handleDelete() {
    if (!confirm('Delete this property? This cannot be undone.')) return
    onClose(); await deleteProperty(p.id)
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-heading font-bold text-sm truncate mr-2">{p.address || '(No address)'}</h2>
        <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
          <button className="btn btn-outline btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-outline btn-sm" onClick={onSkipTrace}>Skip Trace</button>
          <button className="btn btn-outline btn-sm" onClick={handleEnrich} disabled={enrichLoading}>
            {enrichLoading ? '...' : '✦ Enrich'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onLetter}>Letter</button>
          <button className="btn btn-outline btn-sm" onClick={onMatch}>Match</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>

      <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="panel-sec-title mb-3">Owner Contact</div>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-heading font-bold text-base flex-shrink-0" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>
            {(p.owner_name || '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-heading font-semibold text-sm">{p.owner_name || 'Unknown owner'}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>
              {p.phone && <a href={`tel:${p.phone}`} style={{ color: 'var(--orange)' }}>{p.phone}</a>}
              {p.phone && p.email && ' · '}
              {p.email && <a href={`mailto:${p.email}`} style={{ color: 'var(--orange)' }}>{p.email}</a>}
              {!p.phone && !p.email && 'No contact info — run skip trace'}
            </div>
            {p.mailing_address && <div className="text-xs mt-1" style={{ color: 'var(--gray)' }}>Mail: {p.mailing_address}</div>}
            {p.skip_relatives && <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>Relatives: {p.skip_relatives}</div>}
          </div>
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          <span className={`badge badge-${p.status}`}>{p.status}</span>
          {partner && <span className="badge badge-lead">👤 {partner.name}</span>}
        </div>
      </section>

      {/* Enrichment results */}
      {enrichError && (
        <section className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: '#fff5f5' }}>
          <div className="text-sm text-red-500">{enrichError}</div>
        </section>
      )}

      {enrichData && !enrichApplied && (
        <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: '#f0f9ff' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-blue-700">✦ Property Data from RentCast</div>
            <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setEnrichData(null)}>✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {enrichData.owner && (
              <div className="col-span-2 bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div className="text-[10px] font-semibold uppercase text-blue-400 mb-0.5">Owner</div>
                <div className="text-sm font-semibold">{enrichData.owner}</div>
                {!p.owner_name && <div className="text-[10px] text-blue-500 mt-0.5">Will fill empty owner name field</div>}
              </div>
            )}
            {enrichData.estimatedValue && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div className="text-[10px] font-semibold uppercase text-blue-400 mb-0.5">Est. Value</div>
                <div className="text-sm font-bold text-green-600">{fmt$(enrichData.estimatedValue)}</div>
              </div>
            )}
            {enrichData.equity !== null && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div className="text-[10px] font-semibold uppercase text-blue-400 mb-0.5">Est. Equity</div>
                <div className={`text-sm font-bold ${(enrichData.equity ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt$(enrichData.equity)}</div>
              </div>
            )}
            {enrichData.beds && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div className="text-[10px] font-semibold uppercase text-blue-400 mb-0.5">Property</div>
                <div className="text-sm">{enrichData.beds}bd / {enrichData.baths}ba · {enrichData.sqft?.toLocaleString()} sqft</div>
              </div>
            )}
            {enrichData.yearBuilt && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div className="text-[10px] font-semibold uppercase text-blue-400 mb-0.5">Built / Type</div>
                <div className="text-sm">{enrichData.yearBuilt} · {enrichData.propertyType ?? '—'}</div>
              </div>
            )}
            {enrichData.lastSalePrice && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div className="text-[10px] font-semibold uppercase text-blue-400 mb-0.5">Last Sale</div>
                <div className="text-sm">{fmt$(enrichData.lastSalePrice)} <span className="text-gray-400 text-xs">({enrichData.lastSaleDate ?? '?'})</span></div>
              </div>
            )}
            {enrichData.estimatedRent && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                <div className="text-[10px] font-semibold uppercase text-blue-400 mb-0.5">Est. Rent</div>
                <div className="text-sm">{fmt$(enrichData.estimatedRent)}/mo</div>
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={applyEnrichment}>
            Save to property
          </button>
        </section>
      )}

      {enrichApplied && (
        <section className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: '#f0fdf4' }}>
          <div className="text-sm text-green-600 font-medium">✓ Property data saved to notes</div>
        </section>
      )}

      {dateItems.length > 0 && (
        <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="panel-sec-title mb-3">Key Dates</div>
          <div className="grid grid-cols-2 gap-2.5">
            {dateItems.map(([label, date]) => (
              <div key={label} className={`rounded-lg p-2.5 ${date! < today ? 'bg-red-50' : 'bg-gray-100'}`}>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gray)' }}>{label}</div>
                <div className={`font-heading font-semibold text-sm mt-0.5 ${date! < today ? 'text-red-500' : ''}`}>{fmtD(date!)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <FollowUpSection propertyId={p.id} fus={fus} />

      {p.notes && (
        <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="panel-sec-title mb-3">Notes</div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{p.notes}</div>
        </section>
      )}

      <section className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="panel-sec-title">Court Documents</div>
          <label className="btn btn-outline btn-sm cursor-pointer">
            Upload <input type="file" multiple className="hidden" onChange={e => e.target.files && uploadDocs(p.id, e.target.files)} />
          </label>
        </div>
        {docs.length === 0 ? (
          <label className="upload-zone block cursor-pointer">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-sm" style={{ color: 'var(--gray)' }}>Upload court docs, liens, title reports...</div>
            <input type="file" multiple className="hidden" onChange={e => e.target.files && uploadDocs(p.id, e.target.files)} />
          </label>
        ) : docs.map((doc, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{doc.name}</div>
              <div className="text-[11px]" style={{ color: 'var(--gray)' }}>{doc.size} · {fmtD(doc.date)}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => deleteDoc(p.id, i)}>✕</button>
          </div>
        ))}
      </section>
    </>
  )
}

function FollowUpSection({ propertyId, fus }: { propertyId: string; fus: { date: string; note: string }[] }) {
  const { logFollowup, deleteFU } = useCRM()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [next, setNext] = useState('')

  async function save() {
    if (!note.trim()) return
    await logFollowup(propertyId, date, note.trim(), next || undefined)
    setNote(''); setNext(''); setOpen(false)
  }

  return (
    <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="panel-sec-title">Follow-up Log</div>
        <button className="btn btn-outline btn-sm" onClick={() => setOpen(!open)}>+ Log</button>
      </div>
      {open && (
        <div className="bg-gray-50 rounded-lg p-3.5 mb-3 border border-gray-200">
          <div className="form-group"><label className="form-label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">What happened?</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Left voicemail, spoke with owner..." className="form-input resize-y" /></div>
          <div className="form-group mb-0"><label className="form-label">Set next follow-up</label>
            <input type="date" value={next} onChange={e => setNext(e.target.value)} className="form-input" /></div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
      {fus.length === 0
        ? <div className="text-sm" style={{ color: 'var(--gray)' }}>No follow-ups logged yet</div>
        : [...fus].reverse().map((fu, ri) => (
          <div key={ri} className="flex gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--orange)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: 'var(--gray)' }}>{fmtD(fu.date)}</div>
              <div className="text-sm mt-0.5 leading-relaxed">{fu.note}</div>
            </div>
            <button className="text-gray-300 hover:text-red-500 text-xs px-1 flex-shrink-0" onClick={() => deleteFU(propertyId, fus.length - 1 - ri)}>✕</button>
          </div>
        ))}
    </section>
  )
}
