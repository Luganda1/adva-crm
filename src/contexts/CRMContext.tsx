'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { loadSender, saveSender, buildDefaultTemplates, getCustomTemplates, saveCustomTemplate, deleteCustomTemplate, generateLetterBody, printLetter } from '@/lib/letters'
import { todayStr, parseCSV, detectColMap, parseImportDate } from '@/lib/utils'
import type { Property, Partner, Buyer, SenderInfo, FollowUp, Doc, LetterType } from '@/types'

interface Ctx {
  properties: Property[]; partners: Partner[]; buyers: Buyer[]
  syncStatus: 'connected' | 'syncing' | 'error'; syncLabel: string
  loadAll: () => Promise<void>
  saveProperty: (d: Partial<Property>, id?: string | null) => Promise<string>
  deleteProperty: (id: string) => Promise<void>
  logFollowup: (id: string, date: string, note: string, next?: string) => Promise<void>
  deleteFU: (id: string, idx: number) => Promise<void>
  uploadDocs: (id: string, files: FileList) => Promise<void>
  deleteDoc: (id: string, idx: number) => Promise<void>
  saveSkipTrace: (id: string, phone: string, email: string, mailing: string, relatives: string, notes: string) => Promise<void>
  savePartner: (name: string, phone: string, email: string, role: string) => Promise<void>
  deletePartner: (id: string) => Promise<void>
  saveBuyer: (d: Partial<Buyer>, id?: string | null) => Promise<void>
  deleteBuyer: (id: string) => Promise<void>
  importRows: (headers: string[], rows: string[][]) => Promise<{ added: number; updated: number; skipped: number }>
  sender: SenderInfo; updateSender: (f: keyof SenderInfo, v: string) => void
  tplBody: (k: LetterType) => string
  saveTpl: (k: LetterType, body: string) => void
  resetTpl: (k: LetterType) => void
  generateLetter: (type: LetterType, propId: string, contact: string) => string
  printLetterFn: (content: string) => void
  gsUrl: string; setGsUrl: (url: string) => void
  syncSheet: () => Promise<string>
  matchNotes: (text: string) => { matched: Property | null; score: number } | null
  saveNoteToProperty: (id: string, text: string) => Promise<void>
  saveNoteAsNew: (text: string) => Promise<void>
}

const CRMContext = createContext<Ctx | null>(null)
export const useCRM = () => { const c = useContext(CRMContext); if (!c) throw new Error('useCRM outside provider'); return c }

const PRESET_SHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQb4VU8fJvvdGzbq5B8KJpkqqHHP9_EIV356IH1v-aVt35ztYrcDLScj3f0fa6_j-l9eG4aXXsF7OSs/pub?output=csv'

export function CRMProvider({ children, initialProperties = [], initialPartners = [], initialBuyers = [] }: {
  children: React.ReactNode; initialProperties?: Property[]; initialPartners?: Partner[]; initialBuyers?: Buyer[]
}) {
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [partners, setPartners] = useState<Partner[]>(initialPartners)
  const [buyers, setBuyers] = useState<Buyer[]>(initialBuyers)
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'error'>(initialProperties.length ? 'connected' : 'syncing')
  const [syncLabel, setSyncLabel] = useState(initialProperties.length ? 'Live sync on' : 'Connecting...')
  const [sender, setSender] = useState<SenderInfo>(loadSender)
  const [gsUrl, setGsUrlState] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('crm_gs_url') || PRESET_SHEET : PRESET_SHEET)
  const senderTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const loadAll = useCallback(async () => {
    setSyncStatus('syncing'); setSyncLabel('Loading...')
    const [{ data: p }, { data: pa }, { data: bu }] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('partners').select('*').order('name'),
      supabase.from('buyers').select('*').order('created_at', { ascending: false }),
    ])
    setProperties((p as Property[]) || [])
    setPartners((pa as Partner[]) || [])
    setBuyers((bu as Buyer[]) || [])
    setSyncStatus('connected'); setSyncLabel('Live sync on')
  }, [])

  useEffect(() => {
    if (!initialProperties.length) loadAll()
    const ch = supabase.channel('crm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buyers' }, loadAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadAll, initialProperties.length])

  const saveProperty = useCallback(async (data: Partial<Property>, id?: string | null): Promise<string> => {
    setSyncStatus('syncing')
    if (id) {
      await supabase.from('properties').update(data).eq('id', id)
      await loadAll(); return id
    } else {
      const { data: row } = await supabase.from('properties').insert({ ...data, followups: [], docs: [] }).select('*').single()
      await loadAll()
      if (row) {
        fetch('/api/notify-zap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) }).catch(() => {})
      }
      return row?.id ?? ''
    }
  }, [loadAll])

  const deleteProperty = useCallback(async (id: string) => {
    await supabase.from('properties').delete().eq('id', id); await loadAll()
  }, [loadAll])

  const logFollowup = useCallback(async (id: string, date: string, note: string, next?: string) => {
    const p = properties.find(x => x.id === id); if (!p) return
    const fus: FollowUp[] = [...(p.followups || []), { date, note }]
    const u: Partial<Property> = { followups: fus }; if (next) u.next_followup = next
    await supabase.from('properties').update(u).eq('id', id); await loadAll()
  }, [properties, loadAll])

  const deleteFU = useCallback(async (id: string, idx: number) => {
    const p = properties.find(x => x.id === id); if (!p) return
    const fus = [...(p.followups || [])]; fus.splice(idx, 1)
    await supabase.from('properties').update({ followups: fus }).eq('id', id); await loadAll()
  }, [properties, loadAll])

  const uploadDocs = useCallback(async (id: string, files: FileList) => {
    const p = properties.find(x => x.id === id); if (!p) return
    const docs: Doc[] = [...(p.docs || [])]
    Array.from(files).forEach(f => docs.push({ name: f.name, size: (f.size / 1024).toFixed(1) + 'KB', date: todayStr() }))
    await supabase.from('properties').update({ docs }).eq('id', id); await loadAll()
  }, [properties, loadAll])

  const deleteDoc = useCallback(async (id: string, idx: number) => {
    const p = properties.find(x => x.id === id); if (!p) return
    const docs = [...(p.docs || [])]; docs.splice(idx, 1)
    await supabase.from('properties').update({ docs }).eq('id', id); await loadAll()
  }, [properties, loadAll])

  const saveSkipTrace = useCallback(async (id: string, phone: string, email: string, mailing: string, relatives: string, notes: string) => {
    const p = properties.find(x => x.id === id); if (!p) return
    const u: Partial<Property> = {}
    if (phone) u.phone = phone; if (email) u.email = email
    if (mailing) u.mailing_address = mailing; if (relatives) u.skip_relatives = relatives
    const parts = ['[Skip Trace]']; if (phone) parts.push('Phone: ' + phone); if (email) parts.push('Email: ' + email)
    if (mailing) parts.push('Mailing: ' + mailing); if (relatives) parts.push('Relatives: ' + relatives); if (notes) parts.push(notes)
    u.followups = [...(p.followups || []), { date: todayStr(), note: parts.join(' | ') }]
    await supabase.from('properties').update(u).eq('id', id); await loadAll()
  }, [properties, loadAll])

  const savePartner = useCallback(async (name: string, phone: string, email: string, role: string) => {
    await supabase.from('partners').insert({ name, phone: phone || null, email: email || null, role: role || null })
    await loadAll()
  }, [loadAll])

  const deletePartner = useCallback(async (id: string) => {
    await supabase.from('partners').delete().eq('id', id)
    await supabase.from('properties').update({ partner_id: null }).eq('partner_id', id)
    await loadAll()
  }, [loadAll])

  const saveBuyer = useCallback(async (data: Partial<Buyer>, id?: string | null) => {
    if (id) await supabase.from('buyers').update(data).eq('id', id)
    else await supabase.from('buyers').insert(data)
    await loadAll()
  }, [loadAll])

  const deleteBuyer = useCallback(async (id: string) => {
    await supabase.from('buyers').delete().eq('id', id); await loadAll()
  }, [loadAll])

  const importRows = useCallback(async (headers: string[], rows: string[][]): Promise<{ added: number; updated: number; skipped: number }> => {
    const colMap = detectColMap(headers)
    let added = 0, updated = 0, skipped = 0
    for (const row of rows) {
      const get = (f: string) => colMap[f] !== undefined ? (row[colMap[f]] || '').trim() : ''
      let address = get('address')
      if (!address && get('city')) address = [get('city'), get('state'), get('zip')].filter(Boolean).join(', ')
      if (!address) { skipped++; continue }
      const data: Partial<Property> = {
        address, owner_name: get('owner_name') || null, phone: get('phone') || null,
        email: get('email') || null, notes: get('notes') || null,
        status: (get('status') as Property['status']) || 'lead',
        probate_date: parseImportDate(get('probate_date')),
        foreclosure_date: parseImportDate(get('foreclosure_date')),
        auction_date: parseImportDate(get('auction_date')),
      }
      const existing = properties.find(p => p.address?.toLowerCase().trim() === address.toLowerCase().trim())
      if (existing) {
        const u: Partial<Property> = {}
        if (data.owner_name && !existing.owner_name) u.owner_name = data.owner_name
        if (data.phone && !existing.phone) u.phone = data.phone
        if (data.email && !existing.email) u.email = data.email
        if (data.notes) u.notes = existing.notes ? existing.notes + '\n\n[Import] ' + data.notes : data.notes
        if (data.probate_date && !existing.probate_date) u.probate_date = data.probate_date
        if (data.foreclosure_date && !existing.foreclosure_date) u.foreclosure_date = data.foreclosure_date
        if (data.auction_date && !existing.auction_date) u.auction_date = data.auction_date
        if (Object.keys(u).length) { await supabase.from('properties').update(u).eq('id', existing.id); updated++ }
        else skipped++
      } else {
        await supabase.from('properties').insert({ ...data, followups: [], docs: [] }); added++
      }
    }
    await loadAll(); return { added, updated, skipped }
  }, [properties, loadAll])

  const updateSender = useCallback((field: keyof SenderInfo, value: string) => {
    const next = { ...sender, [field]: value }; setSender(next)
    clearTimeout(senderTimer.current)
    senderTimer.current = setTimeout(() => saveSender(next), 600)
  }, [sender])

  const tplBody = useCallback((key: LetterType): string => {
    const custom = getCustomTemplates()
    return custom[key] || buildDefaultTemplates(sender)[key] || ''
  }, [sender])

  const saveTpl = useCallback((key: LetterType, body: string) => saveCustomTemplate(key, body), [])
  const resetTpl = useCallback((key: LetterType) => deleteCustomTemplate(key), [])

  const generateLetter = useCallback((type: LetterType, propId: string, contact: string): string => {
    const p = properties.find(x => x.id === propId); if (!p) return ''
    let eff = type
    if (contact === 'lawfirm' && type === 'probate_owner') eff = 'probate_lawfirm'
    if (contact === 'lawfirm' && type === 'foreclosure_owner') eff = 'foreclosure_lawfirm'
    if (contact === 'owner' && type === 'probate_lawfirm') eff = 'probate_owner'
    if (contact === 'owner' && type === 'foreclosure_lawfirm') eff = 'foreclosure_owner'
    return generateLetterBody(eff, p, sender)
  }, [properties, sender])

  const printLetterFn = useCallback((content: string) => printLetter(content), [])

  const setGsUrl = useCallback((url: string) => {
    setGsUrlState(url)
    if (typeof window !== 'undefined') localStorage.setItem('crm_gs_url', url)
  }, [])

  const syncSheet = useCallback(async (): Promise<string> => {
    if (!gsUrl) return 'No sheet URL saved'
    let url = gsUrl
    if (url.includes('pubhtml')) url = url.replace('pubhtml', 'pub?output=csv')
    if (!url.includes('output=csv') && url.includes('/pub')) url += (url.includes('?') ? '&' : '?') + 'output=csv'
    try {
      const res = await fetch(url); if (!res.ok) throw new Error('HTTP ' + res.status)
      const csv = await res.text()
      const rows = parseCSV(csv); if (rows.length < 2) return 'Sheet appears empty'
      const headers = rows[0].map(h => h.trim().toLowerCase())
      const result = await importRows(headers, rows.slice(1).filter(r => r.some(c => c.trim())))
      return `✓ ${result.added} added, ${result.updated} updated, ${result.skipped} skipped`
    } catch { return 'Sync failed — check URL and permissions' }
  }, [gsUrl, importRows])

  const matchNotes = useCallback((text: string) => {
    if (!text.trim()) return null
    let best: Property | null = null, bestScore = 0
    properties.forEach(p => {
      if (!p.address) return
      const parts = p.address.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 3)
      const hits = parts.filter(pt => text.toLowerCase().includes(pt)).length
      const score = hits / Math.max(parts.length, 1)
      if (score > bestScore) { bestScore = score; best = p }
    })
    return { matched: bestScore >= 0.5 ? best : null, score: Math.round(bestScore * 100) }
  }, [properties])

  const saveNoteToProperty = useCallback(async (id: string, text: string) => {
    const p = properties.find(x => x.id === id); if (!p) return
    const fus: FollowUp[] = [...(p.followups || []), { date: todayStr(), note: '[Imported] ' + text.trim() }]
    await supabase.from('properties').update({ followups: fus }).eq('id', id); await loadAll()
  }, [properties, loadAll])

  const saveNoteAsNew = useCallback(async (text: string) => {
    await supabase.from('properties').insert({
      address: '(From import — update address)', notes: text.trim(), status: 'lead',
      followups: [{ date: todayStr(), note: '[Imported] ' + text.trim() }], docs: [],
    }); await loadAll()
  }, [loadAll])

  const value = useMemo<Ctx>(() => ({
    properties, partners, buyers, syncStatus, syncLabel, loadAll,
    saveProperty, deleteProperty, logFollowup, deleteFU, uploadDocs, deleteDoc, saveSkipTrace,
    savePartner, deletePartner, saveBuyer, deleteBuyer, importRows,
    sender, updateSender, tplBody, saveTpl, resetTpl, generateLetter, printLetterFn,
    gsUrl, setGsUrl, syncSheet, matchNotes, saveNoteToProperty, saveNoteAsNew,
  }), [properties, partners, buyers, syncStatus, syncLabel, loadAll, saveProperty, deleteProperty,
    logFollowup, deleteFU, uploadDocs, deleteDoc, saveSkipTrace, savePartner, deletePartner,
    saveBuyer, deleteBuyer, importRows, sender, updateSender, tplBody, saveTpl, resetTpl,
    generateLetter, printLetterFn, gsUrl, setGsUrl, syncSheet, matchNotes, saveNoteToProperty, saveNoteAsNew])

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>
}
