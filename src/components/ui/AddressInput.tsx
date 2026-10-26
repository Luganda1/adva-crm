'use client'
import { useEffect, useRef } from 'react'
import { useGoogleMapsLoaded } from '@/lib/use-google-maps'

// Google's classic google.maps.places.Autocomplete widget (bound to a plain
// <input>) isn't available to new Cloud projects as of March 2025 — this uses
// its replacement, PlaceAutocompleteElement, a Web Component that renders its
// own input rather than attaching to an existing one. Falls back to a plain
// text input before Maps has loaded (or if there's no API key) — never blocks
// typing.
//
// Behavioral note: unlike the legacy widget, this doesn't naturally forward
// every keystroke the way a real controlled <input> does — 'gmp-select' only
// fires when a suggestion is picked. Someone who types a full address and
// never clicks a suggestion still needs that text to reach React state, so
// this also listens for the element's own 'input'/'change' events and syncs
// on blur as a fallback, reading the element's own .value rather than
// assuming selection is the only path to a usable address.
export default function AddressInput({ value, onChange, placeholder, className, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const loaded = useGoogleMapsLoaded()

  useEffect(() => {
    if (!loaded || !containerRef.current || elementRef.current) return
    const el = new window.google.maps.places.PlaceAutocompleteElement({})
    el.placeholder = placeholder || ''
    if (value) el.value = value
    if (autoFocus) requestAnimationFrame(() => el.focus?.())

    el.addEventListener('gmp-select', async (e: google.maps.places.PlacePredictionSelectEvent) => {
      const place = e.placePrediction.toPlace()
      await place.fetchFields({ fields: ['formattedAddress'] })
      if (place.formattedAddress) onChangeRef.current(place.formattedAddress)
    })
    // Fallback for free-typed text that was never picked from the dropdown.
    const syncFreeText = () => onChangeRef.current(el.value || '')
    el.addEventListener('input', syncFreeText)
    el.addEventListener('change', syncFreeText)
    el.addEventListener('blur', syncFreeText)

    containerRef.current.appendChild(el)
    elementRef.current = el
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, placeholder])

  // Keep the element's displayed text in sync when the parent resets it
  // externally (e.g. opening the modal for a different property, or clearing
  // the form) — but don't fight the user's own typing on every render.
  useEffect(() => {
    if (elementRef.current && elementRef.current.value !== value) {
      elementRef.current.value = value
    }
  }, [value])

  if (!loaded) {
    return (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={className} autoComplete="off" autoFocus={autoFocus} />
    )
  }

  return <div ref={containerRef} className={className} />
}
