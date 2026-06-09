'use client'
import Script from 'next/script'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCRM } from '@/contexts/CRMContext'
import { dateInRange, getDateForField, fmtD } from '@/lib/utils'
import PropertyPanel from './PropertyPanel'
import AddPropertyModal from './AddPropertyModal'
import SkipTraceModal from './SkipTraceModal'
import type { Property } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  lead: '#888780', active: '#2E7D4F', probate: '#B07400', foreclosure: '#D63C3C', auction: '#1A6BB8',
}
const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead', active: 'Active', probate: 'Probate', foreclosure: 'Foreclosure', auction: 'Auction',
}
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''

// Global callback name for Google Maps
const CALLBACK = '__gmapReady__'

declare global {
  interface Window { [key: string]: unknown; google: typeof google }
}

export default function MapView() {
  const { properties, partners } = useCRM()
  const router = useRouter()

  // Map state
  const mapDivRef = useRef<HTMLDivElement>(null)
  const gmapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const geocodeCacheRef = useRef<Record<string, google.maps.LatLngLiteral>>({})
  const dirSvcRef = useRef<google.maps.DirectionsService | null>(null)
  const dirRendRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const myLocMarkerRef = useRef<google.maps.Marker | null>(null)
  const openInfoRef = useRef<google.maps.InfoWindow | null>(null)

  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [pinCount, setPinCount] = useState(0)
  const [geocodeMsg, setGeocodeMsg] = useState('')

  // Filters
  const [checkedStatuses, setCheckedStatuses] = useState<Set<string>>(
    new Set(['lead', 'active', 'probate', 'foreclosure', 'auction'])
  )
  const [showMyLoc, setShowMyLoc] = useState(false)
  const [mapDateType, setMapDateType] = useState('')
  const [mapDateRange, setMapDateRange] = useState('')

  // Route
  const [routeStops, setRouteStops] = useState<{ id: string; addr: string }[]>([])
  const [routeInfo, setRouteInfo] = useState('')

  // Detail panel
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editProperty, setEditProperty] = useState<Property | null>(null)
  const [propModalOpen, setPropModalOpen] = useState(false)
  const [skipProperty, setSkipProperty] = useState<Property | null>(null)

  const activeProp = activeId ? properties.find(x => x.id === activeId) : null

  // Filtered properties for map
  const filteredProps = useMemo(() => properties.filter(p => {
    if (!checkedStatuses.has(p.status)) return false
    if (mapDateType && mapDateRange) {
      const d = getDateForField(p, mapDateType)
      if (!dateInRange(d, mapDateRange)) return false
    }
    return true
  }), [properties, checkedStatuses, mapDateType, mapDateRange])

  // Initialize map after script loads
  const initMap = useCallback(() => {
    if (!mapDivRef.current || gmapRef.current) return
    const gmap = new window.google.maps.Map(mapDivRef.current, {
      center: { lat: 34.0522, lng: -118.2437 },
      zoom: 9,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    })
    gmapRef.current = gmap
    dirSvcRef.current = new window.google.maps.DirectionsService()
    dirRendRef.current = new window.google.maps.DirectionsRenderer({
      map: gmap, suppressMarkers: false,
      polylineOptions: { strokeColor: '#E8711A', strokeWeight: 4 },
    })
    setMapInitialized(true)
  }, [])

  // Set up global callback for Maps script
  useEffect(() => {
    window[CALLBACK] = () => {
      setMapsLoaded(true)
    }
    return () => { delete window[CALLBACK] }
  }, [])

  // Init map once script loaded
  useEffect(() => {
    if (mapsLoaded && !mapInitialized) initMap()
  }, [mapsLoaded, mapInitialized, initMap])

  // Geocode and render pins whenever filteredProps or map changes
  useEffect(() => {
    if (!mapInitialized || !gmapRef.current) return

    async function geocodeAddress(address: string): Promise<google.maps.LatLngLiteral | null> {
      if (geocodeCacheRef.current[address]) return geocodeCacheRef.current[address]
      if (!address) return null
      return new Promise(resolve => {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location
            const coords = { lat: loc.lat(), lng: loc.lng() }
            geocodeCacheRef.current[address] = coords
            resolve(coords)
          } else resolve(null)
        })
      })
    }

    async function renderPins() {
      const gmap = gmapRef.current!
      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []

      if (!filteredProps.length) { setPinCount(0); setGeocodeMsg(''); return }

      setGeocoding(true)
      setGeocodeMsg('Geocoding addresses...')
      const bounds = new window.google.maps.LatLngBounds()
      let geocoded = 0

      for (const p of filteredProps) {
        if (!p.address) continue
        const coords = await geocodeAddress(p.address)
        if (!coords) continue
        geocoded++
        bounds.extend(coords)

        const color = STATUS_COLORS[p.status] || '#888780'
        const inRoute = routeStops.some(s => s.id === p.id)

        const marker = new window.google.maps.Marker({
          position: coords, map: gmap, title: p.address,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: inRoute ? 12 : 9,
            fillColor: color, fillOpacity: 1,
            strokeColor: inRoute ? '#E8711A' : '#fff',
            strokeWeight: inRoute ? 3 : 1.5,
          },
          animation: window.google.maps.Animation.DROP,
        })

        const partner = partners.find(x => x.id === p.partner_id)
        const infoContent = `
          <div style="font-family:'Open Sans',sans-serif;min-width:200px;max-width:260px;padding:4px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${p.address}</div>
            <div style="font-size:12px;color:#666;margin-bottom:6px">${p.owner_name || 'Unknown owner'}${p.phone ? ' · ' + p.phone : ''}</div>
            <div style="margin-bottom:8px">
              <span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${color};color:white;text-transform:uppercase">${p.status}</span>
              ${partner ? `<span style="font-size:11px;color:#888;margin-left:6px">👤 ${partner.name}</span>` : ''}
            </div>
            ${p.probate_date ? `<div style="font-size:11px;color:#B07400">Probate: ${fmtD(p.probate_date)}</div>` : ''}
            ${p.foreclosure_date ? `<div style="font-size:11px;color:#D63C3C">FC: ${fmtD(p.foreclosure_date)}</div>` : ''}
            ${p.auction_date ? `<div style="font-size:11px;color:#1A6BB8">Auction: ${fmtD(p.auction_date)}</div>` : ''}
            <div style="margin-top:8px;display:flex;gap:6px">
              <button id="detail-${p.id}" style="font-size:11px;padding:4px 10px;background:#E8711A;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600">View Detail</button>
              <button id="route-${p.id}" style="font-size:11px;padding:4px 10px;background:white;color:#2C2C2C;border:1px solid #ddd;border-radius:6px;cursor:pointer">+ Route</button>
            </div>
          </div>`

        const infoWindow = new window.google.maps.InfoWindow({ content: infoContent })

        marker.addListener('click', () => {
          if (openInfoRef.current) openInfoRef.current.close()
          infoWindow.open(gmap, marker)
          openInfoRef.current = infoWindow
          // Attach button listeners after InfoWindow renders
          window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            document.getElementById(`detail-${p.id}`)?.addEventListener('click', () => {
              infoWindow.close(); setActiveId(p.id)
            })
            document.getElementById(`route-${p.id}`)?.addEventListener('click', () => {
              setRouteStops(prev => {
                if (prev.some(s => s.id === p.id)) return prev
                return [...prev, { id: p.id, addr: p.address }]
              })
            })
          })
        })

        markersRef.current.push(marker)
      }

      setPinCount(geocoded)
      setGeocodeMsg(`${geocoded} of ${filteredProps.length} geocoded`)
      setGeocoding(false)

      if (geocoded > 0 && !bounds.isEmpty()) gmap.fitBounds(bounds)
    }

    renderPins()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInitialized, filteredProps, partners])

  // Toggle my location
  useEffect(() => {
    if (!mapInitialized || !gmapRef.current) return
    if (showMyLoc) {
      navigator.geolocation?.getCurrentPosition(pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        if (myLocMarkerRef.current) myLocMarkerRef.current.setMap(null)
        myLocMarkerRef.current = new window.google.maps.Marker({
          position: coords, map: gmapRef.current!,
          title: 'My Location',
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#E8711A', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        })
        gmapRef.current!.panTo(coords)
      })
    } else {
      myLocMarkerRef.current?.setMap(null)
      myLocMarkerRef.current = null
    }
  }, [showMyLoc, mapInitialized])

  async function planRoute() {
    if (!dirSvcRef.current || !dirRendRef.current || routeStops.length < 2) return
    const origin = routeStops[0].addr
    const destination = routeStops[routeStops.length - 1].addr
    const waypoints = routeStops.slice(1, -1).map(s => ({ location: s.addr, stopover: true }))
    dirSvcRef.current.route({
      origin, destination, waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    }, (result, status) => {
      if (status === 'OK' && result) {
        dirRendRef.current!.setDirections(result)
        const legs = result.routes[0].legs
        const totalDist = legs.reduce((s, l) => s + (l.distance?.value || 0), 0)
        const totalTime = legs.reduce((s, l) => s + (l.duration?.value || 0), 0)
        setRouteInfo(`${(totalDist / 1609).toFixed(1)} mi · ~${Math.round(totalTime / 60)} min`)
      } else {
        setRouteInfo('Route not found')
      }
    })
  }

  function clearRoute() {
    setRouteStops([])
    setRouteInfo('')
    dirRendRef.current?.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult)
  }

  const toggleStatus = (s: string) => setCheckedStatuses(prev => {
    const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n
  })

  const noKey = !MAPS_KEY

  return (
    <>
      {MAPS_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=geometry&callback=${CALLBACK}`}
          strategy="afterInteractive"
        />
      )}

      <div className="flex gap-2.5 flex-wrap items-start mb-0">
        {/* Left sidebar */}
        <div className="flex flex-col gap-2.5" style={{ width: 256, flexShrink: 0 }}>

          {/* Status filter */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5">
            <div className="panel-sec-title mb-2.5">Show on map</div>
            <div className="flex flex-col gap-1.5">
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={checkedStatuses.has(val)}
                    onChange={() => toggleStatus(val)}
                    className="w-3.5 h-3.5" style={{ accentColor: STATUS_COLORS[val] }} />
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[val] }} />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-gray-100">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={showMyLoc} onChange={e => setShowMyLoc(e.target.checked)} className="w-3.5 h-3.5" style={{ accentColor: 'var(--orange)' }} />
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'var(--orange)' }} />
                Show my location
              </label>
            </div>
          </div>

          {/* Date filter */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5">
            <div className="panel-sec-title mb-2.5">Date filter</div>
            <select value={mapDateType} onChange={e => setMapDateType(e.target.value)} className="w-full filter-select mb-1.5 text-xs">
              <option value="">Any date</option>
              <option value="probate">Probate date</option>
              <option value="foreclosure">Foreclosure date</option>
              <option value="auction">Auction date</option>
              <option value="followup">Follow-up date</option>
            </select>
            <select value={mapDateRange} onChange={e => setMapDateRange(e.target.value)} className="w-full filter-select text-xs">
              <option value="">Any time</option>
              <option value="today">Today</option>
              <option value="7">Next 7 days</option>
              <option value="30">Next 30 days</option>
              <option value="expired">Expired / Past</option>
            </select>
          </div>

          {/* Route planner */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5">
            <div className="panel-sec-title mb-2">Route planner</div>
            <div className="text-xs mb-2" style={{ color: 'var(--gray)' }}>Click pins on the map to add to route</div>
            <div className="max-h-44 overflow-y-auto mb-2">
              {routeStops.length === 0
                ? <div className="text-xs text-gray-400">No stops yet</div>
                : routeStops.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-lg mb-1 text-xs">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-[10px]"
                      style={{ background: 'var(--orange)' }}>{i + 1}</div>
                    <span className="flex-1 truncate">{s.addr}</span>
                    <button className="text-gray-300 hover:text-red-500" onClick={() => setRouteStops(prev => prev.filter(x => x.id !== s.id))}>✕</button>
                  </div>
                ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button className="btn btn-primary btn-sm flex-1" onClick={planRoute} disabled={routeStops.length < 2}>Get Directions</button>
              <button className="btn btn-outline btn-sm" onClick={clearRoute}>Clear</button>
            </div>
            {routeInfo && <div className="text-xs mt-1.5" style={{ color: 'var(--gray)' }}>{routeInfo}</div>}
          </div>

          {/* Map stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5">
            <div className="panel-sec-title mb-1.5">Visible pins</div>
            <div className="font-heading font-bold text-2xl">{pinCount}</div>
            {geocoding && <div className="text-xs mt-1" style={{ color: 'var(--orange)' }}>Geocoding...</div>}
            {!geocoding && geocodeMsg && <div className="text-xs mt-1" style={{ color: 'var(--gray)' }}>{geocodeMsg}</div>}
          </div>
        </div>

        {/* Map container */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div className="relative rounded-xl overflow-hidden border border-gray-200"
            style={{ height: 620, background: 'var(--gray-light)' }}>

            {/* Loading / no-key state */}
            {(!mapInitialized || noKey) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
                style={{ background: 'var(--gray-light)' }}>
                <div className="text-3xl">🗺</div>
                {noKey ? (
                  <>
                    <div className="font-heading font-semibold text-sm">Google Maps API key required</div>
                    <div className="text-xs text-center max-w-xs" style={{ color: 'var(--gray)' }}>
                      Add <code>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> to your <code>.env.local</code> file
                    </div>
                  </>
                ) : (
                  <div className="font-heading font-semibold text-sm">Loading map...</div>
                )}
              </div>
            )}

            <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div className={`panel-overlay ${activeProp ? 'open' : ''}`} onClick={() => setActiveId(null)} />
      <div className={`detail-panel ${activeProp ? 'open' : ''}`}>
        {activeProp && (
          <PropertyPanel property={activeProp} partners={partners} onClose={() => setActiveId(null)}
            onEdit={() => { setEditProperty(activeProp); setPropModalOpen(true) }}
            onSkipTrace={() => setSkipProperty(activeProp)}
            onLetter={() => { setActiveId(null); router.push(`/letters?prop=${activeProp.id}`) }}
            onMatch={() => { setActiveId(null); router.push(`/buyers?match=${activeProp.id}`) }} />
        )}
      </div>
      <AddPropertyModal open={propModalOpen} editProperty={editProperty} onClose={() => setPropModalOpen(false)} onSaved={id => { if (!editProperty) setActiveId(id) }} />
      {skipProperty && <SkipTraceModal property={skipProperty} onClose={() => setSkipProperty(null)} />}
    </>
  )
}
