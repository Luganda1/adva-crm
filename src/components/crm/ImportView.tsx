'use client'
import { useState, useRef, useCallback } from 'react'
import { useCRM } from '@/contexts/CRMContext'
import { parseCSV, detectColMap, assembleAddress } from '@/lib/utils'

const CRM_FIELDS = [
  { value: '',                 label: '— skip —' },
  { value: 'address',          label: 'Street Address' },
  { value: 'city',             label: 'City' },
  { value: 'state',            label: 'State' },
  { value: 'zip',              label: 'Zip Code' },
  { value: 'owner_name',       label: 'Owner Name' },
  { value: 'phone',            label: 'Phone' },
  { value: 'email',            label: 'Email' },
  { value: 'status',           label: 'Status' },
  { value: 'notes',            label: 'Notes' },
  { value: 'mailing_address',  label: 'Mailing Address' },
  { value: 'probate_date',     label: 'Probate Date' },
  { value: 'foreclosure_date', label: 'Foreclosure Date' },
  { value: 'auction_date',     label: 'Auction Date' },
]

type Stage = 'idle' | 'preview' | 'done'

export default function ImportView() {
  const { importRows } = useCRM()
  const fileRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [colMap, setColMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ added: number; updated: number; skipped: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const processFile = useCallback(async (file: File) => {
    const text = await file.text()
    const parsed = parseCSV(text)
    if (parsed.length < 2) { alert('CSV appears empty or has only one row.'); return }
    const hdrs = parsed[0].map(h => h.trim())
    const dataRows = parsed.slice(1).filter(r => r.some(c => c.trim()))
    const detected = detectColMap(hdrs.map(h => h.toLowerCase()))
    // Convert field→colIndex map to colIndex→field map for the UI
    const indexMap: Record<string, number> = detected
    setHeaders(hdrs)
    setRows(dataRows)
    setColMap(indexMap)
    setStage('preview')
    setResult(null)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) processFile(f)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  // colMap is field→colIndex; build reverse for selects
  function fieldForCol(colIdx: number): string {
    return Object.entries(colMap).find(([, v]) => v === colIdx)?.[0] ?? ''
  }

  function setFieldForCol(colIdx: number, field: string) {
    setColMap(prev => {
      const next = { ...prev }
      // Remove previous assignment for this field
      for (const [f, v] of Object.entries(next)) { if (v === colIdx) delete next[f] }
      // Remove this field from wherever it was assigned
      if (field) { for (const [f, v] of Object.entries(next)) { if (f === field) delete next[f] } }
      if (field) next[field] = colIdx
      return next
    })
  }

  async function handleImport() {
    setLoading(true)
    const result = await importRows(headers.map(h => h.toLowerCase()), rows)
    setResult(result)
    setStage('done')
    setLoading(false)
  }

  function reset() { setStage('idle'); setHeaders([]); setRows([]); setColMap({}); setResult(null) }

  const preview = rows.slice(0, 5)

  // Count how many rows will produce a valid address
  const validCount = rows.filter(row => assembleAddress(row, colMap).trim()).length

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="font-heading font-bold text-lg mb-1">CSV Import</h2>
        <p className="text-sm" style={{ color: 'var(--gray)' }}>
          Import leads from any county record export — probate lists, tax delinquency, foreclosure notices. Supports comma, tab, and semicolon delimited files.
        </p>
      </div>

      {stage === 'idle' && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="text-5xl mb-4">📂</div>
          <div className="font-semibold text-base mb-1">Drop your CSV file here or click to upload</div>
          <div className="text-sm" style={{ color: 'var(--gray)' }}>Supports .csv files from any county, MLS export, or spreadsheet</div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {stage === 'preview' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-semibold">{rows.length} rows detected</span>
              <span className="text-sm ml-3" style={{ color: 'var(--gray)' }}>
                {validCount} have a valid address and will be imported
              </span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={reset}>✕ Start over</button>
          </div>

          {/* Column mapping */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Column Mapping — fix any wrong detections</h3>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {headers.map((h, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 truncate" title={h}>{h}</label>
                  <select
                    value={fieldForCol(i)}
                    onChange={e => setFieldForCol(i, e.target.value)}
                    className="form-input text-sm py-1"
                  >
                    {CRM_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Data preview */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-5 overflow-auto">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-sm">Preview — first {preview.length} rows</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                        {h}
                        {fieldForCol(i) && (
                          <span className="ml-1 text-blue-500">→ {CRM_FIELDS.find(f => f.value === fieldForCol(i))?.label}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, ri) => (
                    <tr key={ri} className="border-b border-gray-50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-gray-700 max-w-xs truncate" title={cell}>{cell || <span className="text-gray-300">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Address preview */}
          {(colMap.address !== undefined || colMap.city !== undefined) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <div className="text-xs font-semibold text-blue-700 mb-2">Assembled address preview (first 3 rows)</div>
              {rows.slice(0, 3).map((row, i) => {
                const addr = assembleAddress(row, colMap)
                return (
                  <div key={i} className="text-sm text-blue-800">
                    {addr || <span className="text-red-400 italic">No address — row will be skipped</span>}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={loading || validCount === 0}
            >
              {loading ? 'Importing...' : `Import ${validCount} leads`}
            </button>
            {validCount === 0 && (
              <span className="text-sm text-red-500">No rows have a valid address — check your column mapping above.</span>
            )}
          </div>
        </div>
      )}

      {stage === 'done' && result && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="font-bold text-lg mb-5">Import complete</h3>
          <div className="flex justify-center gap-8 mb-6">
            <div>
              <div className="text-3xl font-bold" style={{ color: 'var(--green)' }}>{result.added}</div>
              <div className="text-sm text-gray-500">New leads added</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-500">{result.updated}</div>
              <div className="text-sm text-gray-500">Existing leads updated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-400">{result.skipped}</div>
              <div className="text-sm text-gray-500">Skipped (no address)</div>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <button className="btn btn-primary" onClick={reset}>Import another file</button>
            <a href="/leads" className="btn btn-outline">View leads →</a>
          </div>
        </div>
      )}
    </div>
  )
}
