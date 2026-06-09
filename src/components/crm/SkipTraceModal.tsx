'use client'
import { useState } from 'react'
import { useCRM } from '@/contexts/CRMContext'
import type { Property } from '@/types'

export default function SkipTraceModal({ property: p, onClose }: { property: Property; onClose: () => void }) {
  const { saveSkipTrace } = useCRM()
  const [phone, setPhone] = useState(p.phone || '')
  const [email, setEmail] = useState(p.email || '')
  const [mailing, setMailing] = useState('')
  const [relatives, setRelatives] = useState(p.skip_relatives || '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const addr = encodeURIComponent(p.address || ''), name = encodeURIComponent(p.owner_name || '')
  const city = (p.address || '').split(',')[1]?.trim() || ''
  const state = (p.address || '').split(',')[2]?.replace(/\d+/g, '').trim() || ''

  async function save() {
    setSaving(true)
    await saveSkipTrace(p.id, phone, email, mailing, relatives, notes)
    setSaving(false); onClose()
  }

  return (
    <div className="modal-wrap open">
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <h2 className="font-heading font-bold text-base">Skip Trace</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="rounded-lg p-3 mb-4 text-sm bg-gray-50">
            <strong>{p.owner_name || 'Unknown'}</strong> · {p.address}
            {p.phone && <div className="text-xs mt-1" style={{ color: 'var(--gray)' }}>Current phone: {p.phone}</div>}
          </div>

          <div className="panel-sec-title mb-2">One-click lookup</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              ['BatchSkipTracing', 'https://www.batchskiptracing.com'],
              ['PropStream', 'https://propstream.com'],
              ['BeenVerified', `https://www.beenverified.com/f/search/person?full_name=${name}`],
              ['Whitepages', `https://www.whitepages.com/name/${(p.owner_name || '').replace(/ /g, '-')}`],
              ['Spokeo', `https://www.spokeo.com/${(p.owner_name || '').replace(/ /g, '-')}`],
              ['FastPeopleSearch', `https://www.fastpeoplesearch.com/name/${(p.owner_name || '').replace(/ /g, '-')}`],
              ['County Assessor', `https://www.google.com/search?q=${encodeURIComponent(city + ' ' + state + ' county assessor ' + (p.address || ''))}`],
              ['Google Search', `https://www.google.com/search?q=${encodeURIComponent((p.owner_name || '') + ' ' + (p.address || '') + ' owner contact')}`],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline text-center no-underline text-xs py-2">{label}</a>
            ))}
          </div>

          <div className="panel-sec-title mb-2">Save skip trace results</div>
          <div className="form-group"><label className="form-label">Phone found</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Email found</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Mailing address</label>
            <input value={mailing} onChange={e => setMailing(e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Relatives / associates</label>
            <input value={relatives} onChange={e => setRelatives(e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="form-input resize-y" /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Results'}</button>
        </div>
      </div>
    </div>
  )
}
