'use client'
import { useState, useEffect } from 'react'
import { useCRM } from '@/contexts/CRMContext'
import type { Buyer } from '@/types'

const TYPES = ['cash','flipper','landlord','realtor','wholesaler','lender'] as const
const TYPE_LABELS: Record<string, string> = { cash:'Cash Buyer', flipper:'Fix & Flip', landlord:'Buy & Hold / Landlord', realtor:'Realtor / Agent', wholesaler:'Wholesaler', lender:'Hard Money Lender' }
const PROP_TYPES = ['SFR','Multi','Commercial','Land']

export default function AddBuyerModal({ open, editBuyer: eb, onClose }: { open: boolean; editBuyer: Buyer | null; onClose: () => void }) {
  const { saveBuyer } = useCRM()
  const [name, setName] = useState(''); const [type, setType] = useState<Buyer['buyer_type']>('cash')
  const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [company, setCompany] = useState('')
  const [maxPrice, setMaxPrice] = useState(''); const [minPrice, setMinPrice] = useState('')
  const [propTypes, setPropTypes] = useState<string[]>([]); const [areas, setAreas] = useState(''); const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (eb) {
      setName(eb.name || ''); setType(eb.buyer_type || 'cash'); setPhone(eb.phone || ''); setEmail(eb.email || '')
      setCompany(eb.company || ''); setMaxPrice(String(eb.max_price || '')); setMinPrice(String(eb.min_price || ''))
      setPropTypes(eb.prop_types || []); setAreas(eb.areas || ''); setNotes(eb.notes || '')
    } else {
      setName(''); setType('cash'); setPhone(''); setEmail(''); setCompany('')
      setMaxPrice(''); setMinPrice(''); setPropTypes([]); setAreas(''); setNotes('')
    }
  }, [eb, open])

  async function save() {
    if (!name.trim()) { alert('Name is required'); return }
    setSaving(true)
    await saveBuyer({
      name: name.trim(), buyer_type: type, phone: phone.trim() || null, email: email.trim() || null,
      company: company.trim() || null, max_price: maxPrice ? Number(maxPrice) : null,
      min_price: minPrice ? Number(minPrice) : null, prop_types: propTypes,
      areas: areas.trim() || null, notes: notes.trim() || null,
    }, eb?.id)
    setSaving(false); onClose()
  }

  const togglePT = (t: string) => setPropTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  if (!open) return null
  return (
    <div className="modal-wrap open">
      <div className="modal">
        <div className="modal-head"><h2 className="font-heading font-bold text-base">{eb ? 'Edit Buyer' : 'Add Buyer'}</h2><button className="btn btn-outline btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name *</label><input value={name} onChange={e => setName(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Buyer Type</label>
              <select value={type} onChange={e => setType(e.target.value as Buyer['buyer_type'])} className="form-input">
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" /></div>
          </div>
          <div className="form-group"><label className="form-label">Company / LLC</label><input value={company} onChange={e => setCompany(e.target.value)} className="form-input" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Max Purchase Price ($)</label><input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Min Purchase Price ($)</label><input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="form-input" /></div>
          </div>
          <div className="form-group"><label className="form-label">Preferred Property Types</label>
            <div className="flex gap-3 flex-wrap mt-1">
              {PROP_TYPES.map(t => (
                <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={propTypes.includes(t)} onChange={() => togglePT(t)} /> {t === 'Multi' ? 'Multi-family' : t}
                </label>
              ))}
            </div></div>
          <div className="form-group"><label className="form-label">Target Cities / Zips</label><input value={areas} onChange={e => setAreas(e.target.value)} placeholder="e.g. Pasadena, Monrovia, 91103" className="form-input" /></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="form-input resize-y" /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Buyer'}</button>
        </div>
      </div>
    </div>
  )
}
