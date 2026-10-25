'use client'
import { useEffect, useRef } from 'react'
import { useGoogleMapsLoaded } from '@/lib/use-google-maps'

// Drop-in replacement for a plain <input> address field — attaches Google
// Places Autocomplete once the Maps script is loaded (progressive
// enhancement: works as a normal text input before that, or if there's no
// API key at all). Free typing still works; picking a suggestion fills in
// the full formatted address.
export default function AddressInput({ value, onChange, placeholder, className, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const loaded = useGoogleMapsLoaded()

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['formatted_address'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (place.formatted_address) onChange(place.formatted_address)
    })
    autocompleteRef.current = ac
    // Google's dropdown is appended to document.body on first open and
    // never removed — nothing to clean up on unmount beyond the listener,
    // which Maps itself garbage-collects with the Autocomplete instance.
  }, [loaded, onChange])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
      autoFocus={autoFocus}
    />
  )
}
