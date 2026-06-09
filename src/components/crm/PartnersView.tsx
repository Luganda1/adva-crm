'use client'
import { useState } from 'react'
import { useCRM } from '@/contexts/CRMContext'
import EmptyState from '@/components/ui/EmptyState'

export default function PartnersView() {
  const { partners, properties, savePartner, deletePartner } = useCRM()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) { alert('Name required'); return }
    setSaving(true); await savePartner(name.trim(), phone.trim(), email.trim(), role.trim())
    setName(''); setPhone(''); setEmail(''); setRole(''); setSaving(false); setOpen(false)
  }

  return (
    <>
      <div className="mb-4"><button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Partner</button></div>
      {partners.length === 0 ? <EmptyState icon="👥" title="No partners yet" sub="Add partners to assign properties and track who's working what" /> :
        partners.map(p => {
          const count = properties.filter(x => x.partner_id === p.id).length
          return (
            <div key={p.id} className="partner-row">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm flex-shrink-0" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>
                {(p.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-semibold text-sm">{p.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>{[p.role, p.phone, p.email].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="text-xs flex-shrink-0" style={{ color: 'var(--gray)' }}>{count} {count === 1 ? 'property' : 'properties'}</div>
              <button className="btn btn-danger btn-sm flex-shrink-0" onClick={() => confirm('Remove this partner?') && deletePartner(p.id)}>Remove</button>
            </div>
          )
        })}
      {open && (
        <div className="modal-wrap open">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-head"><h2 className="font-heading font-bold text-base">Add Partner</h2><button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Full Name *</label><input value={name} onChange={e => setName(e.target.value)} className="form-input" /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="form-input" /></div>
              </div>
              <div className="form-group"><label className="form-label">Role</label><input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Acquisitions, Disposition" className="form-input" /></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Add Partner'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
