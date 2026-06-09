import type { Property, SenderInfo, LetterType } from '@/types'
import { fmtLetterDate } from './utils'

const DEFAULT_SENDER: SenderInfo = {
  firstName: 'Nancy', lastInitial: 'A', phone: '(626) 861-8748',
  email: '', company: 'ADVA Foreclosure Solutions', address: '',
}

export function loadSender(): SenderInfo {
  if (typeof window === 'undefined') return DEFAULT_SENDER
  try { const s = localStorage.getItem('crm_sender'); if (s) return { ...DEFAULT_SENDER, ...JSON.parse(s) } } catch {}
  return DEFAULT_SENDER
}
export const saveSender = (s: SenderInfo) => localStorage.setItem('crm_sender', JSON.stringify(s))

export function getCustomTemplates(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('crm_templates') || '{}') } catch { return {} }
}
export function saveCustomTemplate(type: string, body: string) {
  const t = getCustomTemplates(); t[type] = body; localStorage.setItem('crm_templates', JSON.stringify(t))
}
export function deleteCustomTemplate(type: string) {
  const t = getCustomTemplates(); delete t[type]; localStorage.setItem('crm_templates', JSON.stringify(t))
}

export function buildDefaultTemplates(s: SenderInfo): Record<LetterType, string> {
  const sig = `Warmly,\n\n${s.firstName} ${s.lastInitial}.\n${s.phone}${s.email ? '\n' + s.email : ''}`
  return {
    probate_owner: `{{today}}\n\n\n{{ownerName}}\n{{address}}\n\n\nHi {{firstName}},\n\nMy name is ${s.firstName}. I recently came across the property at {{streetOnly}} in {{city}} and wanted to reach out personally and respectfully. I hope this note finds you well.\n\nI understand that managing a property during this time can sometimes feel overwhelming, especially while balancing other responsibilities. If the home is something you might consider selling as is, I can work with you to make the process simple and as stress-free as possible.\n\nPlease know there is no pressure at all. I work with people in similar situations and try to provide a clear and straightforward option when the timing feels right.\n\nIf you would like to talk through any questions or explore your options, I am happy to connect at your convenience. You can reach me at ${s.phone}.\n\nWishing you and your family peace and comfort.\n\n${sig}`,
    probate_lawfirm: `{{today}}\n\n\n{{ownerName}}\n{{address}}\n\n\nHi {{firstName}},\n\nMy name is ${s.firstName}. I recently came across the property at {{streetOnly}} and wanted to reach out personally and respectfully. I hope this note finds you well.\n\nI understand that managing a probate property can sometimes be challenging, especially while balancing other responsibilities. If the home is something the estate or family might consider selling as is, I would be interested in discussing a potential purchase.\n\nThere is absolutely no pressure. I work with families in similar situations and aim to make the process straightforward whenever the timing feels right.\n\nIf it would be helpful to connect, you can reach me at ${s.phone}.\n\nWishing you, your team, and the family peace and comfort.\n\n${sig}`,
    foreclosure_owner: `{{today}}\n\n\n{{ownerName}}\n{{address}}\n\n\nHi {{firstName}},\n\nMy name is ${s.firstName}. I came across your property at {{streetOnly}} in {{city}} and wanted to reach out with care and without pressure.\n\nI know situations like these can feel incredibly stressful, and I want you to know there may be options available to you that could help. I work with homeowners who are facing difficult circumstances and I am here to provide a simple, straightforward path if selling the home makes sense for your situation.\n\nThere are no fees, no commissions, and no obligations. I can close quickly and work around your timeline.\n\nIf you would like to talk — even just to understand your options — please feel free to reach me at ${s.phone}. I am happy to listen.\n\nWishing you peace during this time.\n\n${sig}`,
    foreclosure_lawfirm: `{{today}}\n\n\n{{ownerName}}\n{{address}}\n\n\nHi {{firstName}},\n\nMy name is ${s.firstName}. I recently became aware of the property at {{streetOnly}} and wanted to reach out regarding a potential purchase opportunity.\n\nI work with property owners and representatives navigating time-sensitive real estate situations. If the property is something the estate, owner, or your client might consider selling, I would be glad to present a straightforward, all-cash offer with a flexible closing timeline.\n\nThere is no obligation whatsoever. I simply want to make sure all options are on the table for the family or parties involved.\n\nPlease feel free to contact me at ${s.phone} at your convenience.\n\nThank you for your time and consideration.\n\n${sig}`,
    cashoffer: `{{today}}\n\n\n{{ownerName}}\n{{address}}\n\n\nHi {{firstName}},\n\nMy name is ${s.firstName}. I recently came across the property at {{streetOnly}} in {{city}} and am reaching out because I may be interested in making a cash offer.\n\nI buy homes in any condition — no repairs needed, no agent fees, and no lengthy closing processes. If you have been considering selling or are simply open to hearing an offer, I would love to connect.\n\nThe process is simple and completely pressure-free. I can work around your timeline and make it as easy as possible for you.\n\nIf you are interested or have any questions, please reach out to me at ${s.phone}. I would love to hear from you.\n\nWishing you and your family all the best.\n\n${sig}`,
    followup: `{{today}}\n\n\n{{ownerName}}\n{{address}}\n\n\nHi {{firstName}},\n\nMy name is ${s.firstName} — I reached out a little while ago about the property at {{streetOnly}} in {{city}}. I hope you are doing well.\n\nI just wanted to follow up briefly and let you know that I am still very interested and that there is absolutely no rush or pressure on my end. I understand that decisions like these take time, and I want to be a resource for you whenever the timing is right — not a source of stress.\n\nIf anything has changed or if you simply want to talk through your options, I am always happy to connect. You can reach me at ${s.phone}.\n\nWishing you and your family all the best.\n\n${sig}`,
  }
}

export function generateLetterBody(type: LetterType, p: Property, s: SenderInfo): string {
  const custom = getCustomTemplates()
  const tpl = custom[type] || buildDefaultTemplates(s)[type] || ''
  const addr = p.address || '[Property Address]'
  const city = addr.includes(',') ? addr.split(',').slice(1).join(',').trim() : '[City]'
  const fmtDate = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US') : ''
  return tpl
    .replace(/{{firstName}}/g, (p.owner_name || '[Owner Name]').split(' ')[0])
    .replace(/{{ownerName}}/g, p.owner_name || '[Owner Name]')
    .replace(/{{address}}/g, addr)
    .replace(/{{streetOnly}}/g, addr.split(',')[0])
    .replace(/{{city}}/g, city)
    .replace(/{{probateDate}}/g, fmtDate(p.probate_date))
    .replace(/{{fcDate}}/g, fmtDate(p.foreclosure_date))
    .replace(/{{auctionDate}}/g, fmtDate(p.auction_date))
    .replace(/{{senderFirst}}/g, s.firstName)
    .replace(/{{senderPhone}}/g, s.phone)
    .replace(/{{senderEmail}}/g, s.email)
    .replace(/{{today}}/g, fmtLetterDate())
}

export function printLetter(content: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>Letter</title><style>body{font-family:Georgia,serif;font-size:15px;line-height:1.85;color:#1a1a1a;padding:72px 80px;max-width:720px;margin:0 auto;white-space:pre-wrap}@media print{body{padding:48px 60px}}</style></head><body>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')}</body></html>`)
  win.document.close(); win.focus()
  setTimeout(() => win.print(), 400)
}
