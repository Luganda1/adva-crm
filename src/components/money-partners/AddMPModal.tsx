'use client'
import { useState, useEffect } from 'react'
import { useMP } from '@/contexts/MPContext'
import type { MoneyPartner } from '@/types'

const PARTNER_TYPES = [
  { value: 'private', label: 'Private Lender' }, { value: 'hard', label: 'Hard Money' }, { value: 'jv', label: 'JV Partner' },
  { value: 'equity', label: 'Equity Partner' }, { value: 'loc', label: 'Line of Credit' }, { value: 'roth', label: 'Roth IRA' },
  { value: 'ira', label: 'Traditional IRA' }, { value: 'lifeins', label: 'Life Insurance' }, { value: 'cash', label: 'Cash Investor' },
  { value: '401k', label: '401k' }, { value: 'other', label: 'Other' },
]
const ASSET_TYPES = [
  { value: 'SFR', label: 'SFR' }, { value: 'Multi', label: 'Multi-family' }, { value: 'Commercial', label: 'Commercial' },
  { value: 'Land', label: 'Land' }, { value: 'Flip', label: 'Fix & Flip' }, { value: 'LeaseOption', label: 'Lease Option' },
  { value: 'BuyHold', label: 'Buy & Hold' }, { value: 'MobileHome', label: 'Mobile Home' }, { value: 'Any', label: 'Any' },
]

export default function AddMPModal({ open, editPartner: ep, onClose, onSaved }: {
  open: boolean; editPartner: MoneyPartner | null; onClose: () => void; onSaved?: () => void
}) {
  const { savePartner } = useMP()
  const [name, setName] = useState(''); const [company, setCompany] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState('')
  const [phone2, setPhone2] = useState(''); const [phone2Label, setPhone2Label] = useState(''); const [email2, setEmail2] = useState(''); const [website, setWebsite] = useState('')
  const [address, setAddress] = useState(''); const [city, setCity] = useState(''); const [state, setState] = useState(''); const [zip, setZip] = useState(''); const [mailingAddr, setMailingAddr] = useState('')
  const [pTypes, setPTypes] = useState<string[]>([]); const [avail, setAvail] = useState('active')
  const [capital, setCapital] = useState(''); const [totalCap, setTotalCap] = useState(''); const [minSize, setMinSize] = useState(''); const [maxSize, setMaxSize] = useState('')
  const [rate, setRate] = useState(''); const [points, setPoints] = useState(''); const [term, setTerm] = useState(''); const [investType, setInvestType] = useState('')
  const [assetTypes, setAssetTypes] = useState<string[]>([]); const [assetCustom, setAssetCustom] = useState('')
  const [locations, setLocations] = useState(''); const [notes, setNotes] = useState('')
  const [showExtra, setShowExtra] = useState(false); const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ep) {
      setName(ep.name || ''); setCompany(ep.company || ''); setPhone(ep.phone || ''); setEmail(ep.email || '')
      setPhone2(ep.phone2 || ''); setPhone2Label(ep.phone2_label || ''); setEmail2(ep.email2 || ''); setWebsite(ep.website || '')
      setAddress(ep.address || ''); setCity(ep.city || ''); setState(ep.state || ''); setZip(ep.zip || ''); setMailingAddr(ep.mailing_address || '')
      setPTypes(ep.partner_types?.length ? ep.partner_types : [ep.partner_type || 'private']); setAvail(ep.availability || 'active')
      setCapital(String(ep.capital_available || '')); setTotalCap(String(ep.total_capital || ''))
      setMinSize(String(ep.min_deal_size || '')); setMaxSize(String(ep.max_deal_size || ''))
      setRate(String(ep.interest_rate || '')); setPoints(String(ep.points || '')); setTerm(ep.term_length || ''); setInvestType(ep.invest_type || '')
      setAssetTypes(ep.asset_types || []); setAssetCustom(ep.asset_type_custom || ''); setLocations(ep.locations || ''); setNotes(ep.notes || '')
      setShowExtra(!!(ep.phone2 || ep.email2 || ep.website))
    } else {
      setName(''); setCompany(''); setPhone(''); setEmail(''); setPhone2(''); setPhone2Label(''); setEmail2(''); setWebsite('')
      setAddress(''); setCity(''); setState(''); setZip(''); setMailingAddr(''); setPTypes([]); setAvail('active')
      setCapital(''); setTotalCap(''); setMinSize(''); setMaxSize(''); setRate(''); setPoints(''); setTerm(''); setInvestType('')
      setAssetTypes([]); setAssetCustom(''); setLocations(''); setNotes(''); setShowExtra(false)
    }
  }, [ep, open])

  async function save() {
    if (!name.trim()) { alert('Name is required'); return }
    setSaving(true)
    await savePartner({
      name: name.trim(), company: company.trim() || null, phone: phone.trim() || null, email: email.trim() || null,
      phone2: phone2.trim() || null, phone2_label: phone2Label.trim() || null, email2: email2.trim() || null, website: website.trim() || null,
      address: address.trim() || null, city: city.trim() || null, state: state.trim() || null, zip: zip.trim() || null, mailing_address: mailingAddr.trim() || null,
      partner_types: pTypes, partner_type: pTypes[0] || 'private', availability: avail as MoneyPartner['availability'],
      capital_available: capital ? Number(capital) : null, total_capital: totalCap ? Number(totalCap) : null,
      min_deal_size: minSize ? Number(minSize) : null, max_deal_size: maxSize ? Number(maxSize) : null,
      interest_rate: rate ? Number(rate) : null, points: points ? Number(points) : null,
      term_length: term.trim() || null, invest_type: investType.trim() || null,
      asset_types: assetTypes, asset_type_custom: assetCustom.trim() || null,
      locations: locations.trim() || null, notes: notes.trim() || null,
    }, ep?.id)
    setSaving(false); onSaved?.(); onClose()
  }

  if (!open) return null
  const hd = { background: 'linear-gradient(135deg,#E8711A 0%,#C75E10 100%)', borderRadius: '0.75rem 0.75rem 0 0' }
  const sec = "text-xs font-bold uppercase tracking-wider font-heading mb-2.5 pb-1.5 border-b border-gray-200 mt-4"

  return (
    <div className="modal-wrap open">
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-head" style={hd}>
          <h2 className="font-heading font-bold text-base text-white">{ep ? 'Edit Partner' : 'Add Money Partner'}</h2>
          <button className="btn btn-sm text-white border border-white/30 bg-transparent" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="text-xs font-bold uppercase tracking-wider font-heading mb-2.5 pb-1.5 border-b border-gray-200" style={{ color: '#3D332A' }}>Contact Information</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name *</label><input value={name} onChange={e => setName(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Business / LLC Name</label><input value={company} onChange={e => setCompany(e.target.value)} className="form-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" /></div>
          </div>
          {showExtra && (
            <>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone 2</label><input value={phone2} onChange={e => setPhone2(e.target.value)} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Phone 2 Label</label><input value={phone2Label} onChange={e => setPhone2Label(e.target.value)} className="form-input" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Email 2</label><input type="email" value={email2} onChange={e => setEmail2(e.target.value)} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Website / LinkedIn</label><input value={website} onChange={e => setWebsite(e.target.value)} className="form-input" /></div>
              </div>
            </>
          )}
          <button type="button" className="btn btn-outline btn-sm mb-3.5" onClick={() => setShowExtra(!showExtra)}>{showExtra ? '- Hide extra contacts' : '+ Add extra contacts'}</button>
          <div className="form-group"><label className="form-label">Address</label><input value={address} onChange={e => setAddress(e.target.value)} className="form-input" /></div>
          <div className="grid grid-cols-3 gap-3.5">
            <div className="form-group"><label className="form-label">City</label><input value={city} onChange={e => setCity(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">State</label><input value={state} onChange={e => setState(e.target.value)} maxLength={2} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Zip</label><input value={zip} onChange={e => setZip(e.target.value)} maxLength={10} className="form-input" /></div>
          </div>
          <div className="form-group"><label className="form-label">Mailing Address (if different)</label><input value={mailingAddr} onChange={e => setMailingAddr(e.target.value)} className="form-input" /></div>

          <div className={sec} style={{ color: '#3D332A' }}>Partner Type & Status</div>
          <div className="form-group"><label className="form-label">Partner Type (select all that apply)</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PARTNER_TYPES.map(pt => (
                <label key={pt.value} className="check-chip">
                  <input type="checkbox" checked={pTypes.includes(pt.value)} onChange={e => setPTypes(e.target.checked ? [...pTypes, pt.value] : pTypes.filter(x => x !== pt.value))} className="w-3.5 h-3.5" />
                  {pt.label}
                </label>
              ))}
            </div></div>
          <div className="form-group"><label className="form-label">Availability Status</label>
            <select value={avail} onChange={e => setAvail(e.target.value)} className="form-input">
              <option value="active">Active - Available</option><option value="deployed">Fully Deployed</option><option value="paused">Paused</option>
            </select></div>

          <div className={sec} style={{ color: '#3D332A' }}>Capital & Terms</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Available Capital ($)</label><input type="number" value={capital} onChange={e => setCapital(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Total Capital / Capacity ($)</label><input type="number" value={totalCap} onChange={e => setTotalCap(e.target.value)} className="form-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Min Deal Size ($)</label><input type="number" value={minSize} onChange={e => setMinSize(e.target.value)} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Max Deal Size ($)</label><input type="number" value={maxSize} onChange={e => setMaxSize(e.target.value)} className="form-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Interest Rate (%)</label><input type="number" value={rate} onChange={e => setRate(e.target.value)} step="0.1" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Points</label><input type="number" value={points} onChange={e => setPoints(e.target.value)} step="0.5" className="form-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Term Length</label><input value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. 6 months" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Type of Investment</label><input value={investType} onChange={e => setInvestType(e.target.value)} placeholder="e.g. 1st lien, equity split" className="form-input" /></div>
          </div>

          <div className={sec} style={{ color: '#3D332A' }}>Preferences</div>
          <div className="form-group"><label className="form-label">Asset Types They Fund</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {ASSET_TYPES.map(at => (
                <label key={at.value} className="check-chip">
                  <input type="checkbox" checked={assetTypes.includes(at.value)} onChange={e => setAssetTypes(e.target.checked ? [...assetTypes, at.value] : assetTypes.filter(x => x !== at.value))} className="w-3.5 h-3.5" />
                  {at.label}
                </label>
              ))}
            </div>
            <input value={assetCustom} onChange={e => setAssetCustom(e.target.value)} placeholder="Other asset type (e.g. Mixed Use, Industrial)" className="form-input mt-2" />
          </div>
          <div className="form-group"><label className="form-label">Target Locations / Markets</label><input value={locations} onChange={e => setLocations(e.target.value)} placeholder="e.g. LA County, Inland Empire, 91016" className="form-input" /></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="form-input resize-y" /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Partner'}</button>
        </div>
      </div>
    </div>
  )
}
