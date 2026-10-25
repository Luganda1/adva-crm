'use client'
import { useState, useEffect } from 'react'
import { useCRM } from '@/contexts/CRMContext'
import type { Property } from '@/types'

const STATUSES = ['lead', 'active', 'probate', 'foreclosure', 'auction'] as const

export default function AddPropertyModal({ open, editProperty: ep, onClose, onSaved }: {
  open: boolean; editProperty: Property | null; onClose: () => void; onSaved?: (id: string) => void
}) {
  const { saveProperty, partners } = useCRM()
  const [addr, setAddr] = useState(''); const [owner, setOwner] = useState(''); const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(''); const [notes, setNotes] = useState(''); const [status, setStatus] = useState('lead')
  const [probate, setProbate] = useState(''); const [fc, setFc] = useState(''); const [auction, setAuction] = useState('')
  const [nextFu, setNextFu] = useState(''); const [mailing, setMailing] = useState(''); const [partnerId, setPartnerId] = useState('')
  const [imageUrl, setImageUrl] = useState(''); const [price, setPrice] = useState(''); const [beds, setBeds] = useState('')
  const [baths, setBaths] = useState(''); const [sqft, setSqft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ep) {
      setAddr(ep.address || ''); setOwner(ep.owner_name || ''); setPhone(ep.phone || ''); setEmail(ep.email || '')
      setNotes(ep.notes || ''); setStatus(ep.status || 'lead'); setProbate(ep.probate_date || ''); setFc(ep.foreclosure_date || '')
      setAuction(ep.auction_date || ''); setNextFu(ep.next_followup || ''); setMailing(ep.mailing_address || ''); setPartnerId(ep.partner_id || '')
      setImageUrl(ep.image_url || ''); setPrice(ep.list_price?.toString() || ''); setBeds(ep.beds?.toString() || '')
      setBaths(ep.baths?.toString() || ''); setSqft(ep.sqft?.toString() || '')
    } else {
      setAddr(''); setOwner(''); setPhone(''); setEmail(''); setNotes(''); setStatus('lead')
      setProbate(''); setFc(''); setAuction(''); setNextFu(''); setMailing(''); setPartnerId('')
      setImageUrl(''); setPrice(''); setBeds(''); setBaths(''); setSqft('')
    }
  }, [ep, open])

  async function save() {
    if (!addr.trim()) { alert('Address is required'); return }
    setSaving(true)
    const id = await saveProperty({
      address: addr.trim(), owner_name: owner.trim() || null, phone: phone.trim() || null,
      email: email.trim() || null, notes: notes.trim() || null, status: status as Property['status'],
      probate_date: probate || null, foreclosure_date: fc || null, auction_date: auction || null,
      next_followup: nextFu || null, mailing_address: mailing.trim() || null, partner_id: partnerId || null,
      image_url: imageUrl.trim() || null, list_price: price ? Number(price) : null,
      beds: beds ? Number(beds) : null, baths: baths ? Number(baths) : null, sqft: sqft ? Number(sqft) : null,
    }, ep?.id)
    setSaving(false); onSaved?.(id); onClose()
  }

  if (!open) return null
  return (
    <div className="modal-wrap open">
      <div className="modal">
        <div className="modal-head">
          <h2 className="font-heading font-bold text-base">{ep ? 'Edit Property' : 'Add Property'}</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Property Address *</label>
            <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="123 Main St, City, CA 90001" className="form-input" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="form-input">
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Assigned Partner</label>
              <select value={partnerId} onChange={e => setPartnerId(e.target.value)} className="form-input">
                <option value="">None</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Owner Name</label>
              <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Full name" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" className="form-input" /></div>
          </div>
          <div className="form-group"><label className="form-label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Probate Date</label>
              <input type="date" value={probate} onChange={e => setProbate(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Foreclosure Date</label>
              <input type="date" value={fc} onChange={e => setFc(e.target.value)} className="form-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Auction Date</label>
              <input type="date" value={auction} onChange={e => setAuction(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Next Follow-up</label>
              <input type="date" value={nextFu} onChange={e => setNextFu(e.target.value)} className="form-input" /></div>
          </div>
          <div className="form-group"><label className="form-label">Mailing Address (if different)</label>
            <input value={mailing} onChange={e => setMailing(e.target.value)} className="form-input" /></div>

          <div className="form-group"><label className="form-label">Listing Photo URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="form-input" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">List Price</label>
              <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="397900" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Sqft</label>
              <input type="number" min="0" value={sqft} onChange={e => setSqft(e.target.value)} placeholder="2000" className="form-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Beds</label>
              <input type="number" min="0" value={beds} onChange={e => setBeds(e.target.value)} placeholder="4" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Baths</label>
              <input type="number" min="0" step="0.5" value={baths} onChange={e => setBaths(e.target.value)} placeholder="3" className="form-input" /></div>
          </div>

          <div className="form-group"><label className="form-label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="form-input resize-y" /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Property'}</button>
        </div>
      </div>
    </div>
  )
}
