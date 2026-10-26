'use client'
import { CRMProvider } from '@/contexts/CRMContext'
import { MPProvider } from '@/contexts/MPContext'
import { markGoogleMapsReady } from '@/lib/use-google-maps'
import type { Buyer, MoneyPartner, Partner, Property } from '@/types'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect } from 'react'
import CRMChrome from './crm/CRMChrome'
import MPChrome from './money-partners/MPChrome'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''
const GMAP_CALLBACK = '__gmapReady__'

interface Props {
  children: React.ReactNode
  initialProperties: Property[]; initialPartners: Partner[]
  initialBuyers: Buyer[]; initialMPPartners: MoneyPartner[]
}

export default function AppShell({ children, initialProperties, initialPartners, initialBuyers, initialMPPartners }: Props) {
  const isMP = usePathname().startsWith('/money-partners')

  // Must be registered before the Maps script finishes loading, not after —
  // Google's loader invokes window[GMAP_CALLBACK] itself once ready, so this
  // has to exist first. An effect on mount (not <Script>'s onReady, which
  // only fires after load — too late) reliably wins that race since it runs
  // long before the network fetch for the script even completes.
  useEffect(() => {
    (window as unknown as Record<string, () => void>)[GMAP_CALLBACK] = markGoogleMapsReady
    return () => { delete (window as unknown as Record<string, unknown>)[GMAP_CALLBACK] }
  }, [])

  return (
    <>
      {/* Loaded once, app-wide — MapView and any address-autocomplete field
          (AddPropertyModal, etc.) share this via useGoogleMapsLoaded() rather
          than each loading their own <Script>, which Google's API errors on. */}
      {MAPS_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places,geometry&callback=${GMAP_CALLBACK}`}
          strategy="afterInteractive"
        />
      )}
      <CRMProvider initialProperties={initialProperties} initialPartners={initialPartners} initialBuyers={initialBuyers}>
        <MPProvider initialPartners={initialMPPartners}>
          {isMP ? <MPChrome>{children}</MPChrome> : <CRMChrome>{children}</CRMChrome>}
        </MPProvider>
      </CRMProvider>
    </>
  )
}
