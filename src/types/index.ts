export interface FollowUp { date: string; note: string }
export interface Doc { name: string; size: string; date: string }

export interface Property {
  id: string; created_at: string; address: string
  owner_name: string | null; phone: string | null; email: string | null
  notes: string | null; status: 'lead' | 'active' | 'probate' | 'foreclosure' | 'auction'
  probate_date: string | null; foreclosure_date: string | null; auction_date: string | null
  next_followup: string | null; partner_id: string | null
  followups: FollowUp[]; docs: Doc[]
  mailing_address: string | null; skip_relatives: string | null
}

export interface Partner {
  id: string; created_at: string; name: string
  phone: string | null; email: string | null; role: string | null
}

export interface Buyer {
  id: string; created_at: string; name: string
  phone: string | null; email: string | null; company: string | null
  areas: string | null; notes: string | null
  max_price: number | null; min_price: number | null
  buyer_type: 'cash' | 'flipper' | 'landlord' | 'realtor' | 'wholesaler' | 'lender'
  prop_types: string[]
}

export interface Deal { date: string; amount: number; property: string; return_to_partner: string; notes: string }
export interface CommEntry { date: string; note: string; next_followup: string | null }

export interface MoneyPartner {
  id: string; created_at: string; name: string; company: string | null
  phone: string | null; email: string | null; address: string | null
  city: string | null; state: string | null; zip: string | null
  mailing_address: string | null; phone2: string | null; phone2_label: string | null
  email2: string | null; website: string | null
  partner_type: string; partner_types: string[]
  availability: 'active' | 'paused' | 'deployed'
  capital_available: number | null; total_capital: number | null
  min_deal_size: number | null; max_deal_size: number | null
  interest_rate: number | null; points: number | null
  term_length: string | null; invest_type: string | null
  asset_types: string[]; asset_type_custom: string | null
  locations: string | null; notes: string | null
  deals: Deal[]; comm_log: CommEntry[]
}

export interface SenderInfo {
  firstName: string; lastInitial: string; phone: string
  email: string; company: string; address: string
}

export type LetterType =
  | 'probate_owner' | 'probate_lawfirm'
  | 'foreclosure_owner' | 'foreclosure_lawfirm'
  | 'cashoffer' | 'followup'
