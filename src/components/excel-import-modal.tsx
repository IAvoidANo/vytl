'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

interface ExcelImportModalProps {
  onClose: () => void
  onSuccess: (count: number) => void
}

interface ColumnMapping {
  title: string
  description: string
  category: string
  inherentLikelihood: string
  inherentImpact: string
  residualLikelihood: string
  residualImpact: string
  response: string
  controls: string
  status: string
}

interface RiskPreview {
  rowNum: number
  title: string
  description: string
  category: string
  inherentLikelihood: number
  inherentImpact: number
  residualLikelihood: number
  residualImpact: number
  response?: string
  controls?: string
  status?: string
  errors: string[]
}

const REQUIRED_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'category', label: 'Category', required: true },
  { key: 'inherentLikelihood', label: 'Inherent Likelihood (1-5)', required: true },
  { key: 'inherentImpact', label: 'Inherent Impact (1-5)', required: true },
  { key: 'residualLikelihood', label: 'Residual Likelihood (1-5)', required: true },
  { key: 'residualImpact', label: 'Residual Impact (1-5)', required: true },
]

const OPTIONAL_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'response', label: 'Risk Response', required: false },
  { key: 'controls', label: 'Controls', required: false },
  { key: 'status', label: 'Status', required: false },
]

const CATEGORIES = [
  'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
  'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
]

const RESPONSES = ['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT']
const STATUSES = ['OPEN', 'IN_PROGRESS', 'MONITORING', 'CLOSED']

function parseCategory(value: string): string {
  const upper = value?.toString().toUpperCase().trim()
  if (CATEGORIES.includes(upper)) return upper
  const partial = CATEGORIES.find(c => c.startsWith(upper?.substring(0, 3) || ''))
  return partial || 'OPERATIONAL'
}

function parseResponse(value: string | undefined): string | undefined {
  if (!value) return undefined
  const upper = value.toString().toUpperCase().trim()
  if (RESPONSES.includes(upper)) return upper
  return undefined
}

function parseStatus(value: string | undefined): string | undefined {
  if (!value) return undefined
  const upper = value.toString().toUpperCase().trim().replace(/\s+/g, '_')
  if (STATUSES.includes(upper)) return upper
  return undefined
}

function parseNumber(value: unknown, min: number, max: number, defaultVal: number): number {
  const num = parseInt(String(value))
  if (isNaN(num)) return defaultVal
  return Math.min(max, Math.max(min, num))
}

export function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [sheetData, setSheetData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    title: '',
    description: '',
    category: '',
    inherentLikelihood: '',
    inherentImpact: '',
    residualLikelihood: '',
    residualImpact: '',
    response: '',
    controls: '',
    status: '',
  })
  const [previewData, setPreviewData] = useState<RiskPreview[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const utils = trpc.useUtils()
  const { data: registers } = trpc.risk.registers.useQuery()
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('')

  const bulkCreateMutation = trpc.risk.bulkCreate.useMutation({
    onSuccess: (data) => {
      setImportedCount(data.count)
      setStep('complete')
      utils.risk.list.invalidate()
    },
    onError: (err) => {
      setError(err.message)
      setStep('preview')
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError('')

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

      if (jsonData.length < 2) {
        setError('File must contain at least a header row and one data row')
        return
      }

      const headerRow = (jsonData[0] || []).map(h => String(h || '').trim())
      setHeaders(headerRow)
      setSheetData(jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== '')))

      // Auto-map columns based on header names
      const autoMapping: ColumnMapping = { ...mapping }
      headerRow.forEach((header) => {
        const lower = header.toLowerCase()
        if (lower.includes('title') || lower === 'name' || lower === 'risk') {
          autoMapping.title = header
        } else if (lower.includes('description') || lower.includes('desc')) {
          autoMapping.description = header
        } else if (lower.includes('category') || lower.includes('type')) {
          autoMapping.category = header
        } else if (lower.includes('inherent') && lower.includes('likelihood')) {
          autoMapping.inherentLikelihood = header
        } else if (lower.includes('inherent') && lower.includes('impact')) {
          autoMapping.inherentImpact = header
        } else if (lower.includes('residual') && lower.includes('likelihood')) {
          autoMapping.residualLikelihood = header
        } else if (lower.includes('residual') && lower.includes('impact')) {
          autoMapping.residualImpact = header
        } else if (lower.includes('likelihood') && !autoMapping.inherentLikelihood) {
          autoMapping.inherentLikelihood = header
        } else if (lower.includes('impact') && !autoMapping.inherentImpact) {
          autoMapping.inherentImpact = header
        } else if (lower.includes('response') || lower.includes('treatment')) {
          autoMapping.response = header
        } else if (lower.includes('control') || lower.includes('mitigation')) {
          autoMapping.controls = header
        } else if (lower.includes('status')) {
          autoMapping.status = header
        }
      })
      setMapping(autoMapping)

      // Set default register
      if (registers?.length && !selectedRegisterId) {
        setSelectedRegisterId(registers[0].id)
      }

      setStep('mapping')
    } catch (err) {
      setError('Failed to parse file. Please ensure it is a valid Excel or CSV file.')
    }
  }

  const validateMapping = (): boolean => {
    const missing = REQUIRED_FIELDS.filter(f => !mapping[f.key])
    if (missing.length > 0) {
      setError(`Please map required fields: ${missing.map(f => f.label).join(', ')}`)
      return false
    }
    if (!selectedRegisterId) {
      setError('Please select a risk register')
      return false
    }
    setError('')
    return true
  }

  const generatePreview = () => {
    if (!validateMapping()) return

    const headerIndex = (col: string) => headers.indexOf(col)

    const risks: RiskPreview[] = sheetData.map((row, idx) => {
      const errors: string[] = []
      const getValue = (col: string) => {
        const i = headerIndex(col)
        return i >= 0 ? row[i] : undefined
      }

      const title = String(getValue(mapping.title) || '').trim()
      const description = String(getValue(mapping.description) || '').trim()
      const category = parseCategory(String(getValue(mapping.category) || ''))

      if (!title) errors.push('Missing title')
      if (!description) errors.push('Missing description')

      const inherentLikelihood = parseNumber(getValue(mapping.inherentLikelihood), 1, 5, 3)
      const inherentImpact = parseNumber(getValue(mapping.inherentImpact), 1, 5, 3)
      const residualLikelihood = parseNumber(getValue(mapping.residualLikelihood), 1, 5, inherentLikelihood)
      const residualImpact = parseNumber(getValue(mapping.residualImpact), 1, 5, inherentImpact)

      return {
        rowNum: idx + 2,
        title,
        description,
        category,
        inherentLikelihood,
        inherentImpact,
        residualLikelihood,
        residualImpact,
        response: parseResponse(getValue(mapping.response) as string),
        controls: getValue(mapping.controls) as string,
        status: parseStatus(getValue(mapping.status) as string),
        errors,
      }
    })

    setPreviewData(risks)
    setStep('preview')
  }

  const handleImport = () => {
    const validRisks = previewData.filter(r => r.errors.length === 0 && r.title && r.description)

    if (validRisks.length === 0) {
      setError('No valid risks to import')
      return
    }

    setStep('importing')

    bulkCreateMutation.mutate({
      registerId: selectedRegisterId,
      risks: validRisks.map(r => ({
        title: r.title,
        description: r.description,
        category: r.category as 'STRATEGIC' | 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE' | 'TECHNOLOGY' | 'REPUTATIONAL' | 'ENVIRONMENTAL' | 'PEOPLE',
        inherentLikelihood: r.inherentLikelihood,
        inherentImpact: r.inherentImpact,
        residualLikelihood: r.residualLikelihood,
        residualImpact: r.residualImpact,
        response: r.response as 'AVOID' | 'MITIGATE' | 'TRANSFER' | 'ACCEPT' | undefined,
        controls: r.controls,
        status: r.status as 'OPEN' | 'IN_PROGRESS' | 'MONITORING' | 'CLOSED' | undefined,
      })),
    })
  }

  const validCount = previewData.filter(r => r.errors.length === 0 && r.title && r.description).length
  const errorCount = previewData.length - validCount

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-teal-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Import Risks from Excel</h2>
              <p className="text-sm text-slate-400">
                {step === 'upload' && 'Upload an Excel or CSV file'}
                {step === 'mapping' && 'Map columns to risk fields'}
                {step === 'preview' && 'Review and import'}
                {step === 'importing' && 'Importing...'}
                {step === 'complete' && 'Import complete'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="text-center py-12">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-lg p-12 cursor-pointer hover:border-teal-500 transition-colors"
              >
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-white mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-400">Excel (.xlsx, .xls) or CSV files</p>
              </div>
              <div className="mt-6 text-left bg-slate-900 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Expected columns:</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• <span className="text-teal-400">Title</span> (required) - Risk name</li>
                  <li>• <span className="text-teal-400">Description</span> (required) - Risk details</li>
                  <li>• <span className="text-teal-400">Category</span> (required) - Strategic, Operational, Financial, etc.</li>
                  <li>• <span className="text-teal-400">Inherent Likelihood</span> (required) - 1-5 scale</li>
                  <li>• <span className="text-teal-400">Inherent Impact</span> (required) - 1-5 scale</li>
                  <li>• <span className="text-teal-400">Residual Likelihood</span> (required) - 1-5 scale</li>
                  <li>• <span className="text-teal-400">Residual Impact</span> (required) - 1-5 scale</li>
                  <li>• Response, Controls, Status (optional)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">
                  File: <span className="text-white">{file?.name}</span> • {sheetData.length} rows found
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Import to Register *
                  </label>
                  <select
                    value={selectedRegisterId}
                    onChange={(e) => setSelectedRegisterId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="">Select register...</option>
                    {registers?.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-3">Required Fields</h4>
                <div className="grid grid-cols-2 gap-4">
                  {REQUIRED_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-400 mb-1">
                        {field.label} <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={mapping[field.key]}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      >
                        <option value="">Select column...</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-3">Optional Fields</h4>
                <div className="grid grid-cols-2 gap-4">
                  {OPTIONAL_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-400 mb-1">
                        {field.label}
                      </label>
                      <select
                        value={mapping[field.key]}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      >
                        <option value="">Not mapped</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    <span className="text-green-400 font-medium">{validCount}</span> valid rows
                  </span>
                  {errorCount > 0 && (
                    <span className="text-sm text-slate-400">
                      <span className="text-red-400 font-medium">{errorCount}</span> with errors (will be skipped)
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-3 py-2 text-left text-slate-400 w-12">Row</th>
                      <th className="px-3 py-2 text-left text-slate-400">Title</th>
                      <th className="px-3 py-2 text-left text-slate-400">Category</th>
                      <th className="px-3 py-2 text-left text-slate-400">Scores</th>
                      <th className="px-3 py-2 text-left text-slate-400 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((risk) => (
                      <tr key={risk.rowNum} className="border-b border-slate-700/50">
                        <td className="px-3 py-2 text-slate-500">{risk.rowNum}</td>
                        <td className="px-3 py-2 text-white truncate max-w-[200px]">{risk.title || '—'}</td>
                        <td className="px-3 py-2 text-slate-400">{risk.category}</td>
                        <td className="px-3 py-2 text-slate-400">
                          I: {risk.inherentLikelihood}×{risk.inherentImpact} / R: {risk.residualLikelihood}×{risk.residualImpact}
                        </td>
                        <td className="px-3 py-2">
                          {risk.errors.length > 0 ? (
                            <span className="text-red-400 text-xs">{risk.errors[0]}</span>
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="px-3 py-2 text-sm text-slate-500 text-center border-t border-slate-700">
                    And {previewData.length - 10} more rows...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-white">Importing {validCount} risks...</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Import Complete</h3>
              <p className="text-slate-400">Successfully imported {importedCount} risks</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <div>
            {step === 'mapping' && (
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('mapping')}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step !== 'complete' && step !== 'importing' && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            {step === 'mapping' && (
              <button
                onClick={generatePreview}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
              >
                Preview
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {validCount} Risks
              </button>
            )}
            {step === 'complete' && (
              <button
                onClick={() => onSuccess(importedCount)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
