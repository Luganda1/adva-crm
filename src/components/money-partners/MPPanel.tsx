'use client'
import { useState } from 'react'
import { useMP } from '@/contexts/MPContext'
import { fmtD, todayStr, fmt$ } from '@/lib/utils'
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

export default function MPPanel({ partner: p, onEdit, onClose }: { partner: MoneyPartner; onEdit: () => void; onClose: () => void }) {
  const { deletePartner, logDeal, deleteDeal, logComm, deleteComm } = useMP()
  const deals = p.deals || [], comms = p.comm_log || []
  const totalFunded = deals.reduce((s, d) => s + (Number(d.amount) || 0), 0)
  const types = p.partner_types?.length ? p.partner_types : [p.partner_type || 'private']
  const [dealOpen, setDealOpen] = useState(false); const [commOpen, setCommOpen] = useState(false)
  const [dDate, setDDate] = useState(todayStr()); const [dAmount, setDAmount] = useState(''); const [dProp, setDProp] = useState(''); const [dReturn, setDReturn] = useState(''); const [dNotes, setDNotes] = useState('')
  const [cDate, setCDate] = useState(todayStr()); const [cNote, setCNote] = useState(''); const [cNext, setCNext] = useState('')

  async function saveDeal() {
    if (!dAmount) { alert('Amount is required'); return }
    await logDeal(p.id, { date: dDate, amount: Number(dAmount), property: dProp.trim(), return_to_partner: dReturn.trim(), notes: dNotes.trim() })
    setDealOpen(false); setDAmount(''); setDProp(''); setDReturn(''); setDNotes('')
  }
  async function saveComm() {
    if (!cNote.trim()) { alert('Please enter a note'); return }
    await logComm(p.id, cDate, cNote.trim(), cNext)
    setCommOpen(false); setCNote(''); setCNext('')
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 z-10"
        style={{ background: 'linear-gradient(135deg,#E8711A 0%,#C75E10 100%)', borderBottom: '1px solid rgba(255,255,255,.15)' }}>
        <h2 className="font-heading font-bold text-sm text-white truncate mr-2">{p.name}</h2>
        <div className="flex gap-1.5">
          <button className="btn btn-sm text-white border border-white/30 bg-transparent" onClick={onEdit}>Edit</button>
          <button className="btn btn-sm text-white border border-red-300 bg-transparent" onClick={async () => { if (!confirm('Delete this partner?')) return; onClose(); await deletePartner(p.id) }}>Delete</button>
          <button className="btn btn-sm text-white border border-white/30 bg-transparent" onClick={onClose}>✕</button>
        </div>
      </div>

      <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="panel-sec-title mb-3">Contact</div>
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-lg flex-shrink-0" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>
            {(p.name || '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-heading font-bold text-sm">{p.name}</div>
            {p.company && <div className="text-xs" style={{ color: 'var(--gray)' }}>{p.company}</div>}
            <div className="text-xs mt-0.5">
              {p.phone && <a href={`tel:${p.phone}`} style={{ color: 'var(--orange)' }}>{p.phone}</a>}
              {p.phone && p.email && ' · '}
              {p.email && <a href={`mailto:${p.email}`} style={{ color: 'var(--orange)' }}>{p.email}</a>}
            </div>
            {(p.address || p.city) && <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>{p.address}{p.city ? ', ' + p.city : ''} {p.state || ''}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {types.map(t => <span key={t} className={`text-xs font-bold px-2 py-0.5 rounded-full font-heading uppercase tracking-wide ${CHIP_COLORS[t] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[t] || t}</span>)}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-heading ${p.availability === 'active' ? 'bg-green-50 text-green-700' : p.availability === 'paused' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>
            {p.availability === 'active' ? 'Active' : p.availability === 'paused' ? 'Paused' : 'Fully Deployed'}
          </span>
        </div>
      </section>

      <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="panel-sec-title mb-3">Capital & Terms</div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ['Available', fmt$(p.capital_available), true], ['Total Capacity', fmt$(p.total_capital), true],
            ['Min Deal', fmt$(p.min_deal_size), false], ['Max Deal', fmt$(p.max_deal_size), false],
            ['Interest Rate', p.interest_rate ? p.interest_rate + '%' : '—', false], ['Points', p.points ? p.points + ' pts' : '—', false],
            ['Term Length', p.term_length || '—', false], ['Invest Type', p.invest_type || '—', false],
          ].map(([label, val, big]) => (
            <div key={label as string} className="bg-gray-100 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gray)' }}>{label}</div>
              <div className={`font-heading font-semibold mt-0.5 ${big ? 'text-lg' : 'text-sm'}`} style={big ? { color: 'var(--orange)' } : {}}>{val}</div>
            </div>
          ))}
          {(p.asset_types || []).length > 0 && (
            <div className="col-span-2 bg-gray-100 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gray)' }}>Asset Types</div>
              <div className="text-sm font-semibold mt-0.5">{(p.asset_types || []).join(', ')}</div>
            </div>
          )}
          {p.locations && (
            <div className="col-span-2 bg-gray-100 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gray)' }}>Target Markets</div>
              <div className="text-sm font-semibold mt-0.5">{p.locations}</div>
            </div>
          )}
        </div>
      </section>

      <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="panel-sec-title">Deal History</div>
          <button className="btn btn-outline btn-sm" onClick={() => setDealOpen(!dealOpen)}>+ Log Deal</button>
        </div>
        {dealOpen && (
          <div className="bg-gray-50 rounded-lg p-3.5 mb-3 border border-gray-200">
            <div className="form-group"><label className="form-label">Date</label><input type="date" value={dDate} onChange={e => setDDate(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Amount Funded ($)</label><input type="number" value={dAmount} onChange={e => setDAmount(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Property / Deal</label><input value={dProp} onChange={e => setDProp(e.target.value)} placeholder="123 Main St — Fix & Flip" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Return to Partner</label><input value={dReturn} onChange={e => setDReturn(e.target.value)} placeholder="e.g. $8,500 at 10% for 6 months" className="form-input" /></div>
            <div className="form-group mb-0"><label className="form-label">Notes</label><textarea value={dNotes} onChange={e => setDNotes(e.target.value)} rows={2} className="form-input resize-y" /></div>
            <div className="flex gap-2 mt-3">
              <button className="btn btn-primary btn-sm" onClick={saveDeal}>Log Deal</button>
              <button className="btn btn-outline btn-sm" onClick={() => setDealOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
        {deals.length > 0 && <div className="text-xs font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Total funded: {fmt$(totalFunded)} across {deals.length} deal{deals.length > 1 ? 's' : ''}</div>}
        {deals.length === 0 ? <div className="text-sm" style={{ color: 'var(--gray)' }}>No deals logged yet</div> :
          [...deals].reverse().map((d, ri) => (
            <div key={ri} className="flex gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--orange)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-heading font-bold text-sm">{fmt$(d.amount)}</div>
                    {d.property && <div className="text-sm">{d.property}</div>}
                    {d.return_to_partner && <div className="text-xs mt-0.5" style={{ color: 'var(--green)' }}>Return: {d.return_to_partner}</div>}
                    {d.notes && <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>{d.notes}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs" style={{ color: 'var(--gray)' }}>{fmtD(d.date)}</div>
                    <button className="text-gray-300 hover:text-red-500 text-xs" onClick={() => deleteDeal(p.id, deals.length - 1 - ri)}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </section>

      <section className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="panel-sec-title">Communication Log</div>
          <button className="btn btn-outline btn-sm" onClick={() => setCommOpen(!commOpen)}>+ Log</button>
        </div>
        {commOpen && (
          <div className="bg-gray-50 rounded-lg p-3.5 mb-3 border border-gray-200">
            <div className="form-group"><label className="form-label">Date</label><input type="date" value={cDate} onChange={e => setCDate(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Note</label><textarea value={cNote} onChange={e => setCNote(e.target.value)} rows={3} placeholder="What was discussed?" className="form-input resize-y" /></div>
            <div className="form-group mb-0"><label className="form-label">Next follow-up date</label><input type="date" value={cNext} onChange={e => setCNext(e.target.value)} className="form-input" /></div>
            <div className="flex gap-2 mt-3">
              <button className="btn btn-primary btn-sm" onClick={saveComm}>Save Log</button>
              <button className="btn btn-outline btn-sm" onClick={() => setCommOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
        {comms.length === 0 ? <div className="text-sm" style={{ color: 'var(--gray)' }}>No communications logged yet</div> :
          [...comms].reverse().map((c, ri) => (
            <div key={ri} className="flex gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--orange)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold" style={{ color: 'var(--gray)' }}>{fmtD(c.date)}</div>
                <div className="text-sm mt-0.5">{c.note}</div>
                {c.next_followup && <div className="text-xs mt-0.5" style={{ color: 'var(--orange)' }}>Next follow-up: {fmtD(c.next_followup)}</div>}
              </div>
              <button className="text-gray-300 hover:text-red-500 text-xs flex-shrink-0" onClick={() => deleteComm(p.id, comms.length - 1 - ri)}>✕</button>
            </div>
          ))}
      </section>

      {p.notes && (
        <section className="px-5 py-4">
          <div className="panel-sec-title mb-3">Notes</div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{p.notes}</div>
        </section>
      )}
    </>
  )
}
