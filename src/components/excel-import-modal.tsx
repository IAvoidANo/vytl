'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, ArrowLeft,
  FileText, Sparkles, AlertTriangle, Loader2, Wand2
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

type ImportStep = 'upload' | 'extracting' | 'mapping' | 'preview' | 'importing' | 'complete'
type FileType = 'excel' | 'pdf' | 'docx'

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
  warnings: string[]
  confidence?: number
}

const REQUIRED_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'inherentLikelihood', label: 'Inherent Likelihood (1-5)' },
  { key: 'inherentImpact', label: 'Inherent Impact (1-5)' },
  { key: 'residualLikelihood', label: 'Residual Likelihood (1-5)' },
  { key: 'residualImpact', label: 'Residual Impact (1-5)' },
]

const OPTIONAL_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: 'response', label: 'Risk Response' },
  { key: 'controls', label: 'Controls' },
  { key: 'status', label: 'Status' },
]

const CATEGORIES = [
  'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
  'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
]

const RESPONSES = ['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT']
const STATUSES = ['OPEN', 'IN_PROGRESS', 'MONITORING', 'CLOSED']

// Smart field mapping patterns
const FIELD_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  title: [/^title$/i, /^risk\s*name$/i, /^name$/i, /^risk$/i, /^risk\s*title$/i, /risk\s*description/i],
  description: [/^description$/i, /^desc$/i, /^risk\s*description$/i, /^details$/i, /^summary$/i, /^risk\s*detail/i],
  category: [/^category$/i, /^type$/i, /^risk\s*type$/i, /^risk\s*category$/i, /^class$/i, /^area$/i],
  inherentLikelihood: [/^inherent\s*likelihood$/i, /likelihood/i, /probability/i, /^prob$/i, /^l$/i, /^inh?\s*l$/i, /^gross\s*l/i],
  inherentImpact: [/^inherent\s*impact$/i, /impact/i, /consequence/i, /severity/i, /^i$/i, /^inh?\s*i$/i, /^gross\s*i/i],
  residualLikelihood: [/^residual\s*likelihood$/i, /^res\s*likelihood$/i, /^res\s*l$/i, /^rl$/i, /^net\s*l/i],
  residualImpact: [/^residual\s*impact$/i, /^res\s*impact$/i, /^res\s*i$/i, /^ri$/i, /^net\s*i/i],
  response: [/^response$/i, /^treatment$/i, /^risk\s*response$/i, /^strategy$/i, /^action$/i],
  controls: [/control/i, /mitigation/i, /measure/i, /safeguard/i],
  status: [/^status$/i, /^state$/i, /^risk\s*status$/i, /^progress$/i],
}

function smartAutoMap(headers: string[]): { mapping: ColumnMapping; confidence: Record<string, number> } {
  const mapping: ColumnMapping = {
    title: '', description: '', category: '',
    inherentLikelihood: '', inherentImpact: '',
    residualLikelihood: '', residualImpact: '',
    response: '', controls: '', status: '',
  }
  const confidence: Record<string, number> = {}
  const usedHeaders = new Set<string>()

  // First pass: exact matches (highest confidence)
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue
      const normalizedHeader = header.trim()
      for (const pattern of patterns) {
        if (pattern.test(normalizedHeader)) {
          const isExact = pattern.source.startsWith('^') && pattern.source.endsWith('$')
          const conf = isExact ? 1.0 : 0.7
          if (!mapping[field as keyof ColumnMapping] || conf > (confidence[field] || 0)) {
            mapping[field as keyof ColumnMapping] = header
            confidence[field] = conf
            if (isExact) usedHeaders.add(header)
          }
          break
        }
      }
    }
  }

  // Auto-copy inherent to residual if residual not found
  if (!mapping.residualLikelihood && mapping.inherentLikelihood) {
    mapping.residualLikelihood = mapping.inherentLikelihood
    confidence.residualLikelihood = 0.5
  }
  if (!mapping.residualImpact && mapping.inherentImpact) {
    mapping.residualImpact = mapping.inherentImpact
    confidence.residualImpact = 0.5
  }

  return { mapping, confidence }
}

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
  if (upper.includes('AVOID')) return 'AVOID'
  if (upper.includes('MITIG')) return 'MITIGATE'
  if (upper.includes('TRANS')) return 'TRANSFER'
  if (upper.includes('ACCEPT')) return 'ACCEPT'
  return undefined
}

function parseStatus(value: string | undefined): string | undefined {
  if (!value) return undefined
  const upper = value.toString().toUpperCase().trim().replace(/\s+/g, '_')
  if (STATUSES.includes(upper)) return upper
  if (upper.includes('OPEN') || upper.includes('NEW')) return 'OPEN'
  if (upper.includes('PROGRESS') || upper.includes('ACTIVE')) return 'IN_PROGRESS'
  if (upper.includes('MONITOR') || upper.includes('WATCH')) return 'MONITORING'
  if (upper.includes('CLOSE') || upper.includes('DONE')) return 'CLOSED'
  return undefined
}

function parseNumber(value: unknown, min: number, max: number, defaultVal: number): number {
  const num = parseInt(String(value))
  if (isNaN(num)) return defaultVal
  return Math.min(max, Math.max(min, num))
}

export function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileType, setFileType] = useState<FileType>('excel')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [sheetData, setSheetData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    title: '', description: '', category: '',
    inherentLikelihood: '', inherentImpact: '',
    residualLikelihood: '', residualImpact: '',
    response: '', controls: '', status: '',
  })
  const [mappingConfidence, setMappingConfidence] = useState<Record<string, number>>({})
  const [previewData, setPreviewData] = useState<RiskPreview[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [extractionProgress, setExtractionProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const utils = trpc.useUtils()
  const { data: registers } = trpc.risk.registers.useQuery()
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('')

  const extractMutation = trpc.import.extractFromDocument.useMutation()

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

    const fileName = selectedFile.name.toLowerCase()
    const isPdf = fileName.endsWith('.pdf')
    const isDocx = fileName.endsWith('.docx')
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')

    if (!isPdf && !isDocx && !isExcel) {
      setError('Unsupported file type. Please upload Excel, CSV, PDF, or Word documents.')
      return
    }

    // Set default register
    if (registers?.length && !selectedRegisterId) {
      setSelectedRegisterId(registers[0].id)
    }

    if (isPdf || isDocx) {
      setFileType(isPdf ? 'pdf' : 'docx')
      await handleDocumentExtraction(selectedFile)
    } else {
      setFileType('excel')
      await handleExcelParse(selectedFile)
    }
  }

  const handleDocumentExtraction = async (selectedFile: File) => {
    setStep('extracting')
    setExtractionProgress('Parsing document...')

    try {
      // First, parse the document
      const formData = new FormData()
      formData.append('file', selectedFile)

      const parseResponse = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      })

      if (!parseResponse.ok) {
        throw new Error('Failed to parse document')
      }

      const parseResult = await parseResponse.json()
      setExtractionProgress('Extracting risks with AI...')

      // Then extract risks using AI
      const result = await extractMutation.mutateAsync({
        content: parseResult.content,
        fileType: parseResult.fileType,
        fileName: parseResult.fileName,
      })

      if (result.risks.length === 0) {
        setError('No risks could be extracted from the document. Try a different file or use Excel import.')
        setStep('upload')
        return
      }

      // Convert extracted risks to preview format
      const previews: RiskPreview[] = result.risks.map((risk, idx) => ({
        rowNum: idx + 1,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        inherentLikelihood: risk.inherentLikelihood,
        inherentImpact: risk.inherentImpact,
        residualLikelihood: risk.residualLikelihood,
        residualImpact: risk.residualImpact,
        response: risk.response,
        controls: risk.controls,
        confidence: risk.confidence,
        errors: [],
        warnings: risk.confidence < 0.7 ? ['Low AI confidence'] : [],
      }))

      setPreviewData(previews)
      setStep('preview')
    } catch (err) {
      console.error('Extraction error:', err)
      setError('Failed to extract risks. Please try again or use Excel import.')
      setStep('upload')
    }
  }

  const handleExcelParse = async (selectedFile: File) => {
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

      // Smart auto-mapping
      const { mapping: autoMapping, confidence } = smartAutoMap(headerRow)
      setMapping(autoMapping)
      setMappingConfidence(confidence)

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
      const warnings: string[] = []
      const getValue = (col: string) => {
        const i = headerIndex(col)
        return i >= 0 ? row[i] : undefined
      }

      const title = String(getValue(mapping.title) || '').trim()
      const description = String(getValue(mapping.description) || '').trim()
      const category = parseCategory(String(getValue(mapping.category) || ''))

      if (!title) errors.push('Missing title')
      if (!description) errors.push('Missing description')
      if (title.length > 200) warnings.push('Title very long')
      if (description.length < 10) warnings.push('Description too short')

      const inherentLikelihood = parseNumber(getValue(mapping.inherentLikelihood), 1, 5, 3)
      const inherentImpact = parseNumber(getValue(mapping.inherentImpact), 1, 5, 3)
      const residualLikelihood = parseNumber(getValue(mapping.residualLikelihood), 1, 5, inherentLikelihood)
      const residualImpact = parseNumber(getValue(mapping.residualImpact), 1, 5, inherentImpact)

      if (residualLikelihood > inherentLikelihood) warnings.push('Residual L > Inherent L')
      if (residualImpact > inherentImpact) warnings.push('Residual I > Inherent I')

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
        warnings,
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
  const warningCount = previewData.filter(r => r.errors.length === 0 && r.warnings.length > 0).length
  const errorCount = previewData.filter(r => r.errors.length > 0).length

  const getMappingIndicator = (field: keyof ColumnMapping) => {
    if (!mapping[field]) return null
    const conf = mappingConfidence[field] || 0
    if (conf >= 0.9) return <CheckCircle className="w-4 h-4 text-green-400" />
    if (conf >= 0.6) return <Wand2 className="w-4 h-4 text-teal-400" />
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {fileType === 'excel' ? (
              <FileSpreadsheet className="w-6 h-6 text-teal-400" />
            ) : (
              <FileText className="w-6 h-6 text-teal-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">Import Risks</h2>
              <p className="text-sm text-slate-400">
                {step === 'upload' && 'Upload Excel, CSV, PDF, or Word document'}
                {step === 'extracting' && extractionProgress}
                {step === 'mapping' && 'Review auto-detected column mappings'}
                {step === 'preview' && 'Review risks before importing'}
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
            <div className="text-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-lg p-12 cursor-pointer hover:border-teal-500 transition-colors"
              >
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-white mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-400">Excel, CSV, PDF, or Word documents</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-left">
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-400" />
                    <h4 className="font-medium text-white">Excel / CSV</h4>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">Structured data with columns:</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Title, Description, Category</li>
                    <li>• Likelihood, Impact (1-5)</li>
                    <li>• Auto-detects column headers</li>
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h4 className="font-medium text-white">PDF / Word</h4>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">AI extracts risks from text:</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Risk registers, audit reports</li>
                    <li>• Meeting minutes, policies</li>
                    <li>• Uses Claude AI for extraction</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Extracting Step */}
          {step === 'extracting' && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-spin" />
              <p className="text-white mb-2">{extractionProgress}</p>
              <p className="text-sm text-slate-400">This may take a moment...</p>
            </div>
          )}

          {/* Mapping Step */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400">
                    File: <span className="text-white">{file?.name}</span> • {sheetData.length} rows
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-400" /> Exact match
                    <Wand2 className="w-3 h-3 text-teal-400" /> Auto-detected
                    <AlertTriangle className="w-3 h-3 text-yellow-400" /> Low confidence
                  </div>
                </div>
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
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1">
                        {field.label} <span className="text-red-400">*</span>
                        {getMappingIndicator(field.key)}
                      </label>
                      <select
                        value={mapping[field.key]}
                        onChange={(e) => {
                          setMapping({ ...mapping, [field.key]: e.target.value })
                          setMappingConfidence({ ...mappingConfidence, [field.key]: 1.0 })
                        }}
                        className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white ${
                          mapping[field.key]
                            ? 'border-green-500/50'
                            : 'border-slate-600'
                        }`}
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
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1">
                        {field.label}
                        {getMappingIndicator(field.key)}
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
              <div className="flex items-center gap-4 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                  {validCount} ready to import
                </span>
                {warningCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                    {warningCount} with warnings
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                    {errorCount} will be skipped
                  </span>
                )}
                {fileType !== 'excel' && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Extracted
                  </span>
                )}
              </div>

              <div className="bg-slate-900 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-3 py-2 text-left text-slate-400 w-16">Status</th>
                      <th className="px-3 py-2 text-left text-slate-400">Title</th>
                      <th className="px-3 py-2 text-left text-slate-400 w-28">Category</th>
                      <th className="px-3 py-2 text-left text-slate-400 w-32">Scores</th>
                      <th className="px-3 py-2 text-left text-slate-400 w-40">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 15).map((risk) => {
                      const hasError = risk.errors.length > 0
                      const hasWarning = !hasError && risk.warnings.length > 0
                      const isValid = !hasError && !hasWarning

                      return (
                        <tr
                          key={risk.rowNum}
                          className={`border-b border-slate-700/50 ${
                            hasError ? 'bg-red-500/5' : hasWarning ? 'bg-yellow-500/5' : ''
                          }`}
                        >
                          <td className="px-3 py-2">
                            {hasError && <AlertCircle className="w-4 h-4 text-red-400" />}
                            {hasWarning && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                            {isValid && <CheckCircle className="w-4 h-4 text-green-400" />}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`truncate block max-w-[250px] ${hasError ? 'text-red-300' : 'text-white'}`}>
                              {risk.title || '—'}
                            </span>
                            {risk.confidence && (
                              <span className="text-xs text-purple-400">
                                {Math.round(risk.confidence * 100)}% confidence
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-400 text-xs">{risk.category}</td>
                          <td className="px-3 py-2 text-slate-400 text-xs">
                            I: {risk.inherentLikelihood}×{risk.inherentImpact}<br />
                            R: {risk.residualLikelihood}×{risk.residualImpact}
                          </td>
                          <td className="px-3 py-2">
                            {risk.errors.map((e, i) => (
                              <span key={i} className="text-red-400 text-xs block">{e}</span>
                            ))}
                            {risk.warnings.map((w, i) => (
                              <span key={i} className="text-yellow-400 text-xs block">{w}</span>
                            ))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {previewData.length > 15 && (
                  <div className="px-3 py-2 text-sm text-slate-500 text-center border-t border-slate-700">
                    And {previewData.length - 15} more rows...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-spin" />
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
            {step === 'preview' && fileType === 'excel' && (
              <button
                onClick={() => setStep('mapping')}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Adjust Mapping
              </button>
            )}
            {step === 'preview' && fileType !== 'excel' && (
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Upload Different File
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step !== 'complete' && step !== 'importing' && step !== 'extracting' && (
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
