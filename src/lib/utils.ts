import type { Property } from '@/types'

export const todayStr = () => new Date().toISOString().slice(0, 10)

export function fmtD(d: string | null | undefined): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${m}/${day}/${y}`
}

export function fmtLetterDate(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function fmt$(n: number | null | undefined): string {
  if (!n) return '—'
  return '$' + Number(n).toLocaleString()
}

export function fmtBig(n: number): string {
  return n >= 1_000_000 ? '$' + (n / 1_000_000).toFixed(1) + 'M' : '$' + (n / 1_000).toFixed(0) + 'K'
}

export function addDays(s: string, n: number): string {
  const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10)
}

export function dateInRange(d: string | null | undefined, range: string, from?: string, to?: string): boolean {
  if (!d) return false
  const ds = d.slice(0, 10), today = todayStr()
  if (range === 'today') return ds === today
  if (range === '7') return ds >= today && ds <= addDays(today, 7)
  if (range === '30') return ds >= today && ds <= addDays(today, 30)
  if (range === 'past7') return ds >= addDays(today, -7) && ds < today
  if (range === 'past30') return ds >= addDays(today, -30) && ds < today
  if (range === 'expired') return ds < today
  if (range === 'custom') return (!from || ds >= from) && (!to || ds <= to)
  return true
}

export function getDateForField(p: Property, field: string): string | null {
  if (field === 'added') return p.created_at?.slice(0, 10) ?? null
  if (field === 'probate') return p.probate_date
  if (field === 'foreclosure') return p.foreclosure_date
  if (field === 'auction') return p.auction_date
  if (field === 'followup') return p.next_followup
  return null
}

export function parseLocation(address: string | null): { street: string; city: string; state: string } {
  if (!address) return { street: '', city: '', state: '' }
  const parts = address.split(',').map(s => s.trim())
  const state = (parts[2] || '').replace(/\d+/g, '').trim().toUpperCase().slice(0, 2)
  return { street: parts[0] || '', city: parts[1] || '', state: state || 'Unknown' }
}

export function detectContactType(name: string | null): 'owner' | 'lawfirm' {
  if (!name) return 'owner'
  const kws = ['law','llc','llp','pc','pllc','attorney','attorneys','legal','counsel','esquire','esq','firm','associates','group','trust','estate of','executor','trustee','bank','financial','mortgage','lending','services','inc','corp']
  const lower = name.toLowerCase()
  return kws.some(k => lower.includes(k)) ? 'lawfirm' : 'owner'
}

export function detectDelimiter(text: string): string {
  const sample = text.slice(0, 2000)
  const counts = { ',': 0, '\t': 0, ';': 0, '|': 0 }
  for (const ch of sample) if (ch in counts) counts[ch as keyof typeof counts]++
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

export function parseCSV(text: string, delimiter?: string): string[][] {
  const sep = delimiter || detectDelimiter(text)
  return text.split(/\r?\n/).filter(l => l.trim()).map(line => {
    const row: string[] = []; let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === sep && !inQ) { row.push(cur.trim()); cur = '' }
      else cur += ch
    }
    row.push(cur.trim()); return row
  })
}

export function detectColMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  const patterns: Record<string, string[]> = {
    address:          ['address','property address','street','prop address','addr','location','situs','street address'],
    owner_name:       ['owner','owner name','contact','name','seller','full name','grantor','taxpayer','title holder'],
    phone:            ['phone','phone number','cell','mobile','telephone','ph '],
    email:            ['email','e-mail','email address'],
    status:           ['status','lead status','stage'],
    notes:            ['notes','note','comments','description','remarks'],
    city:             ['city','town','municipality'],
    state:            ['state','st'],
    zip:              ['zip','zip code','postal','zipcode'],
    probate_date:     ['probate date','probate','filing date','date filed','case filed'],
    foreclosure_date: ['foreclosure date','foreclosure','fc date','sale date','lis pendens'],
    auction_date:     ['auction date','auction','sheriff sale','trustee sale'],
    mailing_address:  ['mailing address','mail address','mailing'],
  }
  headers.forEach((h, i) => {
    const hl = h.toLowerCase().trim()
    for (const [field, variants] of Object.entries(patterns)) {
      if (map[field] === undefined && variants.some(v => hl.includes(v))) map[field] = i
    }
  })
  return map
}

export function assembleAddress(row: string[], colMap: Record<string, number>): string {
  const get = (f: string) => colMap[f] !== undefined ? (row[colMap[f]] || '').trim() : ''
  const street = get('address')
  const city   = get('city')
  const state  = get('state')
  const zip    = get('zip')
  if (street && (city || state)) {
    const cityStateZip = [city, state && zip ? `${state} ${zip}` : state || zip].filter(Boolean).join(', ')
    return [street, cityStateZip].filter(Boolean).join(', ')
  }
  return street
}

export function parseImportDate(str: string): string | null {
  if (!str) return null
  try { const d = new Date(str); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10) } catch { return null }
}
