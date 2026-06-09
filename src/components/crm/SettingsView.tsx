'use client'
import { useState, useRef } from 'react'
import { useCRM } from '@/contexts/CRMContext'
import { parseCSV } from '@/lib/utils'
import type { SenderInfo, LetterType } from '@/types'

const LETTER_TYPES: { value: LetterType; label: string }[] = [
  { value: 'probate_owner', label: 'Probate — Owner' }, { value: 'probate_lawfirm', label: 'Probate — Law Firm' },
  { value: 'foreclosure_owner', label: 'Foreclosure — Owner' }, { value: 'foreclosure_lawfirm', label: 'Foreclosure — Law Firm' },
  { value: 'cashoffer', label: 'General Cash Offer' }, { value: 'followup', label: 'Follow-up / Second Touch' },
]

export default function SettingsView() {
  const { sender, updateSender, gsUrl, setGsUrl, syncSheet, importRows, tplBody, saveTpl, resetTpl, matchNotes, saveNoteToProperty, saveNoteAsNew } = useCRM()
  const [senderSaved, setSenderSaved] = useState(false)
  const sTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [gsStatus, setGsStatus] = useState('')
  const [tplKey, setTplKey] = useState<LetterType>('probate_owner')
  const [tplText, setTplText] = useState(() => tplBody('probate_owner'))
  const [tplSaved, setTplSaved] = useState(false)
  const tTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [pasteNotes, setPasteNotes] = useState(''); const [pasteStatus, setPasteStatus] = useState('')
  const [pasteResult, setPasteResult] = useState<{ matched: { id: string; address: string; owner_name: string | null } | null; score: number } | null>(null)

  function onSenderChange(f: keyof SenderInfo, v: string) {
    updateSender(f, v); clearTimeout(sTimer.current)
    sTimer.current = setTimeout(() => { setSenderSaved(true); setTimeout(() => setSenderSaved(false), 2000) }, 700)
  }

  function onTplKeyChange(k: LetterType) { setTplKey(k); setTplText(tplBody(k)) }
  function onTplChange(v: string) {
    setTplText(v); clearTimeout(tTimer.current)
    tTimer.current = setTimeout(() => { saveTpl(tplKey, v); setTplSaved(true); setTimeout(() => setTplSaved(false), 2000) }, 800)
  }
  function onResetTpl() { if (!confirm('Reset to default? Your edits will be lost.')) return; resetTpl(tplKey); setTplText(tplBody(tplKey)) }

  async function handleSync() { setGsStatus('Syncing...'); setGsStatus(await syncSheet()) }
  async function handleCSV(file: File) {
    const rows = parseCSV(await file.text())
    if (rows.length < 2) { alert('CSV appears empty'); return }
    const result = await importRows(rows[0].map(h => h.trim().toLowerCase()), rows.slice(1).filter(r => r.some(c => c.trim())))
    alert(`✓ ${result.added} added, ${result.updated} updated, ${result.skipped} skipped`)
  }
  function handleParseNotes() { setPasteResult(matchNotes(pasteNotes)); setPasteStatus('') }

  return (
    <div className="max-w-xl">
      <h2 className="font-heading font-bold text-base mb-1">Sender Information</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--gray)' }}>Auto-fills into every letter you generate.</p>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-7 shadow-sm">
        <div className="form-row">
          <div className="form-group"><label className="form-label">First Name</label><input value={sender.firstName} onChange={e => onSenderChange('firstName', e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Last Initial</label><input value={sender.lastInitial} onChange={e => onSenderChange('lastInitial', e.target.value)} maxLength={2} className="form-input" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone</label><input value={sender.phone} onChange={e => onSenderChange('phone', e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Email (optional)</label><input type="email" value={sender.email} onChange={e => onSenderChange('email', e.target.value)} className="form-input" /></div>
        </div>
        <div className="form-group"><label className="form-label">Company Name</label><input value={sender.company} onChange={e => onSenderChange('company', e.target.value)} className="form-input" /></div>
        <div className="form-group"><label className="form-label">Return Mailing Address</label><textarea value={sender.address} onChange={e => onSenderChange('address', e.target.value)} rows={2} className="form-input resize-y" /></div>
        {senderSaved && <div className="text-xs" style={{ color: 'var(--green)' }}>✓ Saved</div>}
      </div>

      <h2 className="font-heading font-bold text-base mb-1">Google Sheets Auto-Sync</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Paste your published Google Sheet CSV link.</p>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-7 shadow-sm">
        <div className="form-group"><label className="form-label">Published Google Sheet URL (CSV)</label>
          <input value={gsUrl} onChange={e => setGsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." className="form-input" /></div>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--gray)' }}>Google Sheet → <strong>File → Share → Publish to web</strong> → select <strong>CSV</strong> → Publish → copy link.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn btn-primary" onClick={handleSync}>↻ Sync Now</button>
          {gsStatus && <span className="text-xs" style={{ color: gsStatus.startsWith('✓') ? 'var(--green)' : gsStatus.includes('failed') ? 'var(--red)' : 'var(--gray)' }}>{gsStatus}</span>}
        </div>
      </div>

      <h2 className="font-heading font-bold text-base mb-1">CSV Import</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Upload a CSV export. Columns are auto-detected.</p>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-7 shadow-sm">
        <label className="upload-zone block cursor-pointer">
          <div className="text-3xl mb-2">📂</div>
          <div className="text-sm" style={{ color: 'var(--gray)' }}>Click to upload CSV file</div>
          <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleCSV(e.target.files[0])} />
        </label>
      </div>

      <h2 className="font-heading font-bold text-base mb-1">Note Import Tool</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Paste raw notes. The CRM will detect the address and match to an existing property.</p>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-7 shadow-sm">
        <div className="form-group"><label className="form-label">Paste notes here</label>
          <textarea value={pasteNotes} onChange={e => setPasteNotes(e.target.value)} rows={6} className="form-input resize-y" /></div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={handleParseNotes}>Match & Import Notes</button>
          {pasteStatus && <span className="text-xs" style={{ color: 'var(--green)' }}>{pasteStatus}</span>}
        </div>
        {pasteResult && (
          <div className="mt-3.5">
            {pasteResult.matched ? (
              <div>
                <div className="rounded-lg p-3.5 mb-2.5" style={{ background: 'var(--green-light)', border: '1px solid var(--green)' }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--green)' }}>✓ Matched ({pasteResult.score}% confidence)</div>
                  <div className="font-semibold text-sm">{pasteResult.matched.address}</div>
                </div>
                <div className="flex gap-2.5">
                  <button className="btn btn-primary" onClick={async () => { await saveNoteToProperty(pasteResult.matched!.id, pasteNotes); setPasteNotes(''); setPasteResult(null); setPasteStatus('✓ Note saved!') }}>Save to This Property</button>
                  <button className="btn btn-outline" onClick={async () => { await saveNoteAsNew(pasteNotes); setPasteNotes(''); setPasteResult(null); setPasteStatus('✓ New property created!') }}>Create New Property</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="rounded-lg p-3.5 mb-2.5" style={{ background: 'var(--amber-light)', border: '1px solid #e6c060' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>No matching property found</div>
                </div>
                <button className="btn btn-primary" onClick={async () => { await saveNoteAsNew(pasteNotes); setPasteNotes(''); setPasteResult(null); setPasteStatus('✓ New property created!') }}>Create New Property from These Notes</button>
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="font-heading font-bold text-base mb-1">Letter Templates</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--gray)' }}>Customize the base text for each letter type.</p>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="form-group"><label className="form-label">Select template to edit</label>
          <select value={tplKey} onChange={e => onTplKeyChange(e.target.value as LetterType)} className="form-input">
            {LETTER_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
          </select></div>
        <div className="text-xs mb-2.5" style={{ color: 'var(--gray)' }}>
          <strong>Placeholders:</strong>{' '}
          {['{{firstName}}','{{ownerName}}','{{address}}','{{streetOnly}}','{{city}}','{{probateDate}}','{{fcDate}}','{{auctionDate}}','{{senderPhone}}','{{today}}'].map(p => <code key={p} className="bg-gray-100 px-1 rounded text-xs mr-1">{p}</code>)}
        </div>
        <div className="form-group"><label className="form-label">Letter body</label>
          <textarea value={tplText} onChange={e => onTplChange(e.target.value)} rows={16} className="form-input resize-y text-sm" style={{ fontFamily: 'Georgia, serif' }} /></div>
        <div className="flex items-center gap-2.5">
          <button className="btn btn-outline btn-sm" onClick={onResetTpl}>↺ Reset to default</button>
          {tplSaved && <span className="text-xs" style={{ color: 'var(--green)' }}>✓ Saved</span>}
        </div>
      </div>
    </div>
  )
}
