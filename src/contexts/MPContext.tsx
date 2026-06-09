'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { todayStr } from '@/lib/utils'
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

export function MPProvider({ children, initialPartners = [] }: { children: React.ReactNode; initialPartners?: MoneyPartner[] }) {
  const [partners, setPartners] = useState<MoneyPartner[]>(initialPartners)
  const [syncStatus, setSyncStatus] = useState<'on' | 'syncing' | 'error'>(initialPartners.length ? 'on' : 'syncing')
  const [syncLabel, setSyncLabel] = useState(initialPartners.length ? 'Live sync on' : 'Connecting...')

  const loadAll = useCallback(async () => {
    setSyncStatus('syncing'); setSyncLabel('Loading...')
    const { data } = await supabase.from('money_partners').select('*').order('created_at', { ascending: false })
    setPartners((data as MoneyPartner[]) || [])
    setSyncStatus('on'); setSyncLabel('Live sync on')
  }, [])

  useEffect(() => {
    if (!initialPartners.length) loadAll()
    const ch = supabase.channel('mp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'money_partners' }, loadAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadAll, initialPartners.length])

  const savePartner = useCallback(async (data: Partial<MoneyPartner>, id?: string | null) => {
    if (id) await supabase.from('money_partners').update(data).eq('id', id)
    else await supabase.from('money_partners').insert({ ...data, deals: [], comm_log: [] })
    await loadAll()
  }, [loadAll])

  const deletePartner = useCallback(async (id: string) => {
    await supabase.from('money_partners').delete().eq('id', id); await loadAll()
  }, [loadAll])

  const logDeal = useCallback(async (id: string, deal: Deal) => {
    const p = partners.find(x => x.id === id); if (!p) return
    await supabase.from('money_partners').update({ deals: [...(p.deals || []), deal] }).eq('id', id)
    await loadAll()
  }, [partners, loadAll])

  const deleteDeal = useCallback(async (id: string, idx: number) => {
    const p = partners.find(x => x.id === id); if (!p) return
    const deals = [...(p.deals || [])]; deals.splice(idx, 1)
    await supabase.from('money_partners').update({ deals }).eq('id', id); await loadAll()
  }, [partners, loadAll])

  const logComm = useCallback(async (id: string, date: string, note: string, next: string) => {
    const p = partners.find(x => x.id === id); if (!p) return
    const comm_log: CommEntry[] = [...(p.comm_log || []), { date, note, next_followup: next || null }]
    await supabase.from('money_partners').update({ comm_log }).eq('id', id); await loadAll()
  }, [partners, loadAll])

  const deleteComm = useCallback(async (id: string, idx: number) => {
    const p = partners.find(x => x.id === id); if (!p) return
    const comm_log = [...(p.comm_log || [])]; comm_log.splice(idx, 1)
    await supabase.from('money_partners').update({ comm_log }).eq('id', id); await loadAll()
  }, [partners, loadAll])

  const value = useMemo<Ctx>(() => ({
    partners, syncStatus, syncLabel, loadAll, savePartner, deletePartner,
    logDeal, deleteDeal, logComm, deleteComm,
  }), [partners, syncStatus, syncLabel, loadAll, savePartner, deletePartner, logDeal, deleteDeal, logComm, deleteComm])

  return <MPContext.Provider value={value}>{children}</MPContext.Provider>
}
