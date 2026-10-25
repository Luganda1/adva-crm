'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { MoneyPartner, Deal, CommEntry } from '@/types'

interface Ctx {
  partners: MoneyPartner[]; syncStatus: 'on' | 'syncing' | 'error'; syncLabel: string
  loadAll: () => Promise<void>
  savePartner: (d: Partial<MoneyPartner>, id?: string | null) => Promise<void>
  deletePartner: (id: string) => Promise<void>
  logDeal: (id: string, deal: Deal) => Promise<void>
  deleteDeal: (id: string, idx: number) => Promise<void>
  logComm: (id: string, date: string, note: string, next: string) => Promise<void>
  deleteComm: (id: string, idx: number) => Promise<void>
}

const MPContext = createContext<Ctx | null>(null)
export const useMP = () => { const c = useContext(MPContext); if (!c) throw new Error('useMP outside provider'); return c }

// Same reasoning as CRMContext: anon-key RLS blocks reads/writes/Realtime on
// money_partners, so all access goes through /api/money-partners (service role).
const POLL_MS = 20_000

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

export function MPProvider({ children, initialPartners = [] }: { children: React.ReactNode; initialPartners?: MoneyPartner[] }) {
  const [partners, setPartners] = useState<MoneyPartner[]>(initialPartners)
  const [syncStatus, setSyncStatus] = useState<'on' | 'syncing' | 'error'>(initialPartners.length ? 'on' : 'syncing')
  const [syncLabel, setSyncLabel] = useState(initialPartners.length ? 'Synced' : 'Connecting...')
  const partnersRef = useRef(partners)
  partnersRef.current = partners

  const loadAll = useCallback(async () => {
    setSyncStatus('syncing'); setSyncLabel('Syncing...')
    try {
      const data = await jsonOrThrow(await fetch('/api/money-partners'))
      setPartners(Array.isArray(data) ? data : [])
      setSyncStatus('on'); setSyncLabel('Synced')
    } catch {
      setSyncStatus('error'); setSyncLabel('Sync error')
    }
  }, [])

  useEffect(() => {
    if (!initialPartners.length) loadAll()
    const interval = setInterval(loadAll, POLL_MS)
    return () => clearInterval(interval)
  }, [loadAll, initialPartners.length])

  const savePartner = useCallback(async (data: Partial<MoneyPartner>, id?: string | null) => {
    if (id) {
      await jsonOrThrow(await fetch(`/api/money-partners/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }))
    } else {
      await jsonOrThrow(await fetch('/api/money-partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }))
    }
    await loadAll()
  }, [loadAll])

  const deletePartner = useCallback(async (id: string) => {
    await jsonOrThrow(await fetch(`/api/money-partners/${id}`, { method: 'DELETE' }))
    await loadAll()
  }, [loadAll])

  const patchPartner = useCallback(async (id: string, patch: Partial<MoneyPartner>) => {
    await jsonOrThrow(await fetch(`/api/money-partners/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }))
    await loadAll()
  }, [loadAll])

  const logDeal = useCallback(async (id: string, deal: Deal) => {
    const p = partnersRef.current.find(x => x.id === id); if (!p) return
    await patchPartner(id, { deals: [...(p.deals || []), deal] })
  }, [patchPartner])

  const deleteDeal = useCallback(async (id: string, idx: number) => {
    const p = partnersRef.current.find(x => x.id === id); if (!p) return
    const deals = [...(p.deals || [])]; deals.splice(idx, 1)
    await patchPartner(id, { deals })
  }, [patchPartner])

  const logComm = useCallback(async (id: string, date: string, note: string, next: string) => {
    const p = partnersRef.current.find(x => x.id === id); if (!p) return
    const comm_log: CommEntry[] = [...(p.comm_log || []), { date, note, next_followup: next || null }]
    await patchPartner(id, { comm_log })
  }, [patchPartner])

  const deleteComm = useCallback(async (id: string, idx: number) => {
    const p = partnersRef.current.find(x => x.id === id); if (!p) return
    const comm_log = [...(p.comm_log || [])]; comm_log.splice(idx, 1)
    await patchPartner(id, { comm_log })
  }, [patchPartner])

  const value = useMemo<Ctx>(() => ({
    partners, syncStatus, syncLabel, loadAll, savePartner, deletePartner,
    logDeal, deleteDeal, logComm, deleteComm,
  }), [partners, syncStatus, syncLabel, loadAll, savePartner, deletePartner, logDeal, deleteDeal, logComm, deleteComm])

  return <MPContext.Provider value={value}>{children}</MPContext.Provider>
}
