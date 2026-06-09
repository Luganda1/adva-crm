'use client'
import { usePathname } from 'next/navigation'
import { CRMProvider } from '@/contexts/CRMContext'
import { MPProvider } from '@/contexts/MPContext'
import CRMChrome from './crm/CRMChrome'
import MPChrome from './money-partners/MPChrome'
import type { Property, Partner, Buyer, MoneyPartner } from '@/types'

interface Props {
  children: React.ReactNode
  initialProperties: Property[]; initialPartners: Partner[]
  initialBuyers: Buyer[]; initialMPPartners: MoneyPartner[]
}

export default function AppShell({ children, initialProperties, initialPartners, initialBuyers, initialMPPartners }: Props) {
  const isMP = usePathname().startsWith('/money-partners')
  return (
    <CRMProvider initialProperties={initialProperties} initialPartners={initialPartners} initialBuyers={initialBuyers}>
      <MPProvider initialPartners={initialMPPartners}>
        {isMP ? <MPChrome>{children}</MPChrome> : <CRMChrome>{children}</CRMChrome>}
      </MPProvider>
    </CRMProvider>
  )
}
