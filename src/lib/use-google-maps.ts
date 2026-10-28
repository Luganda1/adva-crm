'use client'
import { useEffect, useState } from 'react'

// Single shared "is the Google Maps JS API loaded" signal. The <Script> tag
// itself lives in AppShell (loaded once, app-wide, with the `places` library
// so any form — not just /map — can use Autocomplete). Components that need
// to know when it's ready (MapView, address autocomplete inputs) use this
// hook instead of each loading/tracking their own script tag, which would
// trigger Google's "included the Maps JavaScript API multiple times" error.
const READY_EVENT = 'google-maps-ready'

declare global {
  interface Window { [key: string]: unknown; google: typeof google }
}

export function markGoogleMapsReady() {
  window.__googleMapsReady__ = true
  window.dispatchEvent(new Event(READY_EVENT))
}

export function useGoogleMapsLoaded(): boolean {
  const [loaded, setLoaded] = useState(() => typeof window !== 'undefined' && !!window.__googleMapsReady__)
  useEffect(() => {
    if (loaded) return
    const onReady = () => setLoaded(true)
    window.addEventListener(READY_EVENT, onReady)
    return () => window.removeEventListener(READY_EVENT, onReady)
  }, [loaded])
  return loaded
}
