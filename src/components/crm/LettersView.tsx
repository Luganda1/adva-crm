'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import { detectContactType } from '@/lib/utils'
import type { LetterType } from '@/types'

const TYPES: { value: LetterType; label: string }[] = [
  { value: 'probate_owner', label: 'Probate — Owner' },
  { value: 'probate_lawfirm', label: 'Probate — Law Firm / Attorney' },
  { value: 'foreclosure_owner', label: 'Foreclosure — Owner' },
  { value: 'foreclosure_lawfirm', label: 'Foreclosure — Law Firm / Lender' },
  { value: 'cashoffer', label: 'General Cash Offer' },
  { value: 'followup', label: 'Follow-up / Second Touch' },
]

export default function LettersView() {
  const { properties, generateLetter, printLetterFn } = useCRM()
  const searchParams = useSearchParams()
  const [propId, setPropId] = useState(searchParams.get('prop') || '')
  const [letterType, setLetterType] = useState<LetterType>('probate_owner')
  const [contact, setContact] = useState('owner')
  const [detectedType, setDetectedType] = useState('owner')
  const [body, setBody] = useState(''); const [original, setOriginal] = useState('')

  const onChange = useCallback((id: string, type: LetterType, ov: string) => {
    if (!id) { setBody(''); return }
    const p = properties.find(x => x.id === id); if (!p) return
    const det = detectContactType(p.owner_name)
    setDetectedType(det)
    const auto: Record<string, LetterType> = { probate: det === 'lawfirm' ? 'probate_lawfirm' : 'probate_owner', foreclosure: 'foreclosure_owner', auction: 'cashoffer', active: 'cashoffer', lead: 'cashoffer' }
    const t = p.status ? auto[p.status] || 'cashoffer' : type
    setLetterType(t)
    const text = generateLetter(t, id, ov)
    setBody(text); setOriginal(text)
  }, [properties, generateLetter])

  useEffect(() => {
    const id = searchParams.get('prop')
    if (id) { setPropId(id); onChange(id, letterType, contact) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, onChange])

  function update(type: LetterType, ov: string) {
    if (!propId) return
    const text = generateLetter(type, propId, ov)
    setBody(text); setOriginal(text)
  }

  return (
    <>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Select a property and letter type to generate a print-ready letter auto-filled with contact details.</p>
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <div><label className="form-label">Select Property</label>
          <select value={propId} onChange={e => { setPropId(e.target.value); onChange(e.target.value, letterType, contact) }} className="form-input">
            <option value="">-- Choose a property --</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.address || '(No address)'}{p.owner_name ? ' — ' + p.owner_name : ''}</option>)}
          </select></div>
        <div><label className="form-label">Letter Type</label>
          <select value={letterType} onChange={e => { const t = e.target.value as LetterType; setLetterType(t); update(t, contact) }} className="form-input">
            {TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
          </select></div>
      </div>
      {propId && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg mb-4 text-sm" style={{ background: 'var(--amber-light)', border: '1px solid #e6c060' }}>
          <span>⚠️ Contact type: <strong>{detectedType === 'lawfirm' ? 'Law Firm / Attorney' : 'Owner (Individual)'}</strong></span>
          <select value={contact} onChange={e => { setContact(e.target.value); update(letterType, e.target.value) }} className="filter-select ml-auto">
            <option value="owner">Owner (individual)</option>
            <option value="lawfirm">Law Firm / Attorney</option>
            <option value="estate">Estate / Executor</option>
            <option value="bank">Bank / Lender</option>
          </select>
        </div>
      )}
      {body ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm flex-1" style={{ color: 'var(--gray)' }}>Edit the letter below before printing</span>
            <button className="btn btn-outline btn-sm" onClick={() => setBody(original)}>↺ Reset</button>
            <button className="btn btn-outline" onClick={() => printLetterFn(body)}>🖨️ Print</button>
            <button className="btn btn-primary" onClick={() => printLetterFn(body)}>⬇ Save PDF</button>
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-12 focus:outline-none focus:border-brand min-h-[700px] text-[15px] leading-[1.85]"
            style={{ fontFamily: 'Georgia, serif', color: '#1a1a1a', boxShadow: 'var(--shadow-md)' }} />
        </div>
      ) : (
        <div className="text-center py-14 px-5" style={{ color: 'var(--gray)' }}>
          <div className="text-4xl mb-3">✉️</div>
          <div className="font-heading font-semibold text-sm mb-1.5" style={{ color: 'var(--charcoal)' }}>Select a property to generate a letter</div>
          <div className="text-sm">Letters auto-fill with owner name, address, and key dates</div>
        </div>
      )}
    </>
  )
}
