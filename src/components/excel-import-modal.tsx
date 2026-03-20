'use client'

import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, ArrowLeft,
  FileText, Sparkles, AlertTriangle, Loader2, Wand2, Download, Info
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import {
  type ColumnMapping,
  detectHeaderRow,
  smartAutoMap,
} from '@/lib/excel-import/header-detection'
import {
  normalizeCategory,
  normalizeStatus,
} from '@/lib/excel-import/enum-mapping'
import { validateScore, validateResidualNotExceedsInherent } from '@/lib/excel-import/score-validation'
import { checkDuplicates, type DuplicateCheckResult, type ExistingRisk } from '@/lib/excel-import/duplicate-detection'

type ImportStep = 'upload' | 'extracting' | 'mapping' | 'preview' | 'importing' | 'complete'
type FileType = 'excel' | 'pdf' | 'docx'

interface ExcelImportModalProps {
  onClose: () => void
  onSuccess: (count: number) => void
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
  workflowStatus?: string
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

// Combined L×I columns (alternative to separate likelihood/impact)
const COMBINED_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: 'inherentCombined', label: 'Inherent L×I (combined)' },
  { key: 'residualCombined', label: 'Residual L×I (combined)' },
]

const RESPONSES = ['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT']

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

// Parse combined likelihood/impact values like "3,4", "3x4", "3/4", "3 x 4"
function parseCombinedScore(value: unknown): { likelihood: number; impact: number } | null {
  if (!value) return null
  const str = String(value).trim()

  // Try various separators: comma, x, X, /, pipe, hyphen with optional spaces
  const patterns = [
    /^(\d+)\s*[,]\s*(\d+)$/,      // "3,4" or "3, 4"
    /^(\d+)\s*[xX×]\s*(\d+)$/,    // "3x4", "3X4", "3 x 4"
    /^(\d+)\s*[\/]\s*(\d+)$/,     // "3/4"
    /^(\d+)\s*[\|]\s*(\d+)$/,     // "3|4"
    /^(\d+)\s*[-]\s*(\d+)$/,      // "3-4"
    /^\((\d+)\s*[,]\s*(\d+)\)$/,  // "(3,4)"
  ]

  for (const pattern of patterns) {
    const match = str.match(pattern)
    if (match) {
      const likelihood = parseInt(match[1])
      const impact = parseInt(match[2])
      if (likelihood >= 1 && likelihood <= 5 && impact >= 1 && impact <= 5) {
        return { likelihood, impact }
      }
    }
  }

  return null
}

export function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileType, setFileType] = useState<FileType>('excel')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [sheetData, setSheetData] = useState<string[][]>([])
  const [detectedHeaderRowIndex, setDetectedHeaderRowIndex] = useState<number | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({
    title: '', description: '', category: '',
    inherentLikelihood: '', inherentImpact: '',
    residualLikelihood: '', residualImpact: '',
    response: '', controls: '', status: '',
    inherentCombined: '', residualCombined: '',
  })
  const [mappingConfidence, setMappingConfidence] = useState<Record<string, number>>({})
  const [mappingDebug, setMappingDebug] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<RiskPreview[]>([])
  const [duplicateResults, setDuplicateResults] = useState<DuplicateCheckResult[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [extractionProgress, setExtractionProgress] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const utils = trpc.useUtils()
  const { data: registers } = trpc.risk.registers.useQuery()
  const { data: existingRisksData } = trpc.risk.listForWorkspace.useQuery(undefined, { staleTime: 30_000 })
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('')

  // Auto-select first register when data loads
  useEffect(() => {
    if (registers?.length && !selectedRegisterId) {
      setSelectedRegisterId(registers[0].id)
    }
  }, [registers, selectedRegisterId])

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

  const processFile = async (selectedFile: File) => {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    await processFile(selectedFile)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      await processFile(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
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
      // Extract meaningful error message
      let errorMsg = 'Failed to extract risks.'
      if (err instanceof Error) {
        if (err.message.includes('credit') || err.message.includes('purchase')) {
          errorMsg = 'Anthropic API credits exhausted. Please add credits at console.anthropic.com'
        } else if (err.message.includes('ANTHROPIC_API_KEY')) {
          errorMsg = 'ANTHROPIC_API_KEY not configured. Please add it to your .env.local file.'
        } else if (err.message.includes('401') || err.message.includes('authentication')) {
          errorMsg = 'Invalid API key. Check your ANTHROPIC_API_KEY in .env.local.'
        } else if (err.message.includes('429')) {
          errorMsg = 'API rate limit exceeded. Please wait a moment and try again.'
        } else {
          errorMsg = err.message
        }
      }
      setError(errorMsg + ' You can also try Excel import instead.')
      setStep('upload')
    }
  }

  const handleExcelParse = async (selectedFile: File) => {
    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })

      // Debug: Log all sheet names
      const debug: string[] = []
      debug.push(`📊 Workbook has ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`)

      // Smart sheet selection:
      // 1. Prefer a sheet explicitly named "Risk Register" (or just "Risks")
      // 2. Fall back to the sheet with the most non-empty columns in its first 5 rows
      // 3. Last resort: first sheet
      let sheetName = workbook.SheetNames[0]
      const riskSheetName = workbook.SheetNames.find(n =>
        /risk\s*register/i.test(n) || /^risks?$/i.test(n)
      )
      if (riskSheetName) {
        sheetName = riskSheetName
        debug.push(`📋 Selected sheet "${sheetName}" (matched risk register pattern)`)
      } else if (workbook.SheetNames.length > 1) {
        let bestSheet = workbook.SheetNames[0]
        let bestCols = 0
        for (const name of workbook.SheetNames) {
          const s = workbook.Sheets[name]
          const rows = XLSX.utils.sheet_to_json<string[]>(s, { header: 1, defval: '' })
          const maxCols = Math.max(
            ...rows.slice(0, 5).map(r => r.filter((c: string) => c !== '' && c !== undefined && c !== null).length),
            0
          )
          debug.push(`  Sheet "${name}": max ${maxCols} cols in first 5 rows`)
          if (maxCols > bestCols) { bestCols = maxCols; bestSheet = name }
        }
        if (bestSheet !== sheetName) {
          sheetName = bestSheet
          debug.push(`📋 Auto-selected sheet "${sheetName}" (most data: ${bestCols} cols)`)
        }
      }

      const sheet = workbook.Sheets[sheetName]
      debug.push(`📄 Reading sheet: "${sheetName}"`)

      // Get the range of the sheet
      const range = sheet['!ref']
      debug.push(`📐 Sheet range: ${range || 'undefined'}`)

      // Parse as array of arrays
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
      debug.push(`📝 Total rows parsed: ${jsonData.length}`)

      // Debug: Show first 8 rows raw
      debug.push(`\n--- RAW DATA (first 8 rows) ---`)
      for (let i = 0; i < Math.min(8, jsonData.length); i++) {
        const row = jsonData[i] || []
        const nonEmpty = row.filter(c => c !== undefined && c !== '').length
        const preview = row.slice(0, 10).map(c => String(c || '').substring(0, 25)).join(' | ')
        debug.push(`Row ${i}: [${nonEmpty} cols] ${preview}${row.length > 10 ? '...' : ''}`)
      }
      debug.push(`--- END RAW DATA ---\n`)

      if (jsonData.length < 2) {
        setMappingDebug(debug)
        setError('File must contain at least a header row and one data row')
        setStep('mapping') // Show mapping step to see debug
        return
      }

      // Detect header row using field-pattern scoring (handles title rows above headers)
      const stringRows = jsonData.map(row =>
        (row || []).map(c => String(c ?? '').trim())
      )
      const headerDetection = detectHeaderRow(stringRows)

      const headerRowIndex = headerDetection?.rowIndex ?? 0
      const headerRow = headerDetection?.headers ??
        (jsonData[0] || []).map(h => String(h ?? '').trim())

      debug.push(
        headerDetection
          ? `🎯 Detected header row: ${headerRowIndex} (${headerDetection.matchedFields} field matches, score ${Math.round(headerDetection.score)})`
          : `⚠️ No header row detected by field patterns — defaulting to row 0`
      )
      debug.push(`📋 Headers: ${headerRow.filter(h => h).join(', ')}`)

      // Data starts after header row
      const dataRows = jsonData.slice(headerRowIndex + 1).filter(row =>
        row.some(cell => cell !== undefined && cell !== '' && cell !== null)
      )
      debug.push(`📊 Data rows (after filtering empty): ${dataRows.length}`)

      setDetectedHeaderRowIndex(headerRowIndex)
      setHeaders(headerRow)
      setSheetData(dataRows)

      // Smart auto-mapping
      const autoMapResult = smartAutoMap(headerRow)
      setMapping(autoMapResult.mapping)
      setMappingConfidence(autoMapResult.confidence)

      // Combine debug info
      setMappingDebug([...debug, '', '--- AUTO-MAPPING ---', ...autoMapResult.debug])

      setStep('mapping')
    } catch (err) {
      console.error('Excel parse error:', err)
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const validateMapping = (): boolean => {
    const missing: string[] = []

    // Check basic required fields
    if (!mapping.title) missing.push('Title')
    if (!mapping.description) missing.push('Description')
    if (!mapping.category) missing.push('Category')

    // Check likelihood/impact - can be separate columns OR combined column
    const hasInherentL = !!mapping.inherentLikelihood
    const hasInherentI = !!mapping.inherentImpact
    const hasInherentCombined = !!mapping.inherentCombined
    const hasResidualL = !!mapping.residualLikelihood
    const hasResidualI = !!mapping.residualImpact
    const hasResidualCombined = !!mapping.residualCombined

    if (!hasInherentCombined && (!hasInherentL || !hasInherentI)) {
      if (!hasInherentL && !hasInherentCombined) missing.push('Inherent Likelihood')
      if (!hasInherentI && !hasInherentCombined) missing.push('Inherent Impact')
    }
    if (!hasResidualCombined && (!hasResidualL || !hasResidualI)) {
      if (!hasResidualL && !hasResidualCombined) missing.push('Residual Likelihood')
      if (!hasResidualI && !hasResidualCombined) missing.push('Residual Impact')
    }

    if (missing.length > 0) {
      setError(`Please map required fields: ${missing.join(', ')}`)
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
      const categoryResult = normalizeCategory(String(getValue(mapping.category) || ''))
      if (categoryResult.warning) warnings.push(categoryResult.warning)
      const category = categoryResult.value

      if (!title) errors.push('Missing title')
      if (!description) errors.push('Missing description')
      if (title.length > 200) warnings.push('Title very long')
      if (description.length < 10) warnings.push('Description too short')

      // Parse inherent scores (from combined or separate columns)
      let inherentLikelihood: number
      let inherentImpact: number
      if (mapping.inherentCombined) {
        const combined = parseCombinedScore(getValue(mapping.inherentCombined))
        if (combined) {
          inherentLikelihood = combined.likelihood
          inherentImpact = combined.impact
        } else {
          inherentLikelihood = 3
          inherentImpact = 3
          warnings.push('Could not parse inherent L×I')
        }
      } else {
        const ilResult = validateScore(getValue(mapping.inherentLikelihood), 'Inherent Likelihood')
        const iiResult = validateScore(getValue(mapping.inherentImpact), 'Inherent Impact')
        inherentLikelihood = ilResult.value
        inherentImpact = iiResult.value
        if (ilResult.warning) warnings.push(ilResult.warning)
        if (iiResult.warning) warnings.push(iiResult.warning)
      }

      // Parse residual scores (from combined or separate columns)
      let residualLikelihood: number
      let residualImpact: number
      if (mapping.residualCombined) {
        const combined = parseCombinedScore(getValue(mapping.residualCombined))
        if (combined) {
          residualLikelihood = combined.likelihood
          residualImpact = combined.impact
        } else {
          residualLikelihood = inherentLikelihood
          residualImpact = inherentImpact
          warnings.push('Could not parse residual L×I')
        }
      } else {
        const rlResult = validateScore(getValue(mapping.residualLikelihood), 'Residual Likelihood', inherentLikelihood)
        const riResult = validateScore(getValue(mapping.residualImpact), 'Residual Impact', inherentImpact)
        residualLikelihood = rlResult.value
        residualImpact = riResult.value
        if (rlResult.warning) warnings.push(rlResult.warning)
        if (riResult.warning) warnings.push(riResult.warning)
      }

      const residualCheck = validateResidualNotExceedsInherent(residualLikelihood, inherentLikelihood, residualImpact, inherentImpact)
      residualCheck.warnings.forEach(w => warnings.push(w))

      const statusResult = normalizeStatus(getValue(mapping.status) as string | undefined)
      if (statusResult.warning) warnings.push(statusResult.warning)

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
        status: statusResult.status,
        workflowStatus: statusResult.workflowStatus,
        errors,
        warnings,
      }
    })

    setPreviewData(risks)
    const existing: ExistingRisk[] = (existingRisksData ?? []).map(r => ({
      id: r.id,
      refCode: r.refCode,
      title: r.title,
      category: r.category,
    }))
    setDuplicateResults(checkDuplicates(risks.map(r => ({ title: r.title, category: r.category })), existing))
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
        category: r.category as 'STRATEGIC' | 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE' | 'TECHNOLOGY' | 'REPUTATIONAL' | 'ENVIRONMENTAL' | 'PEOPLE' | 'HEALTH_SAFETY',
        inherentLikelihood: r.inherentLikelihood,
        inherentImpact: r.inherentImpact,
        residualLikelihood: r.residualLikelihood,
        residualImpact: r.residualImpact,
        response: r.response as 'AVOID' | 'MITIGATE' | 'TRANSFER' | 'ACCEPT' | undefined,
        controls: r.controls,
        status: r.status as 'OPEN' | 'IN_PROGRESS' | 'MONITORING' | 'CLOSED' | 'ARCHIVED' | undefined,
        workflowStatus: r.workflowStatus as 'INBOX' | 'TRIAGE' | 'ASSIGNED' | 'APPROVED' | undefined,
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
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-teal-400 bg-teal-500/10'
                    : 'border-slate-600 hover:border-teal-500'
                }`}
              >
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-white mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-400">Excel, CSV, PDF, or Word documents</p>
              </div>

              {/* Download Template Button */}
              <div className="mt-4">
                <a
                  href="/templates/risk-import-template.xlsx"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-teal-400 hover:text-teal-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Excel Template
                </a>
                <p className="text-xs text-slate-500 mt-1">
                  Includes 10 sample risks and column instructions
                </p>
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

              {/* Header row detection result */}
              {detectedHeaderRowIndex !== null && (
                <div className="flex items-start gap-2 px-3 py-2 bg-teal-950/60 border border-teal-700/40 rounded-lg text-xs">
                  <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span className="text-teal-300">
                    Header row detected at <strong className="text-teal-200">row {detectedHeaderRowIndex + 1}</strong>
                    {detectedHeaderRowIndex > 0 && (
                      <span className="text-teal-400"> — skipped {detectedHeaderRowIndex} title row{detectedHeaderRowIndex > 1 ? 's' : ''} above</span>
                    )}
                    {' · '}{headers.filter(h => h).length} columns mapped
                  </span>
                </div>
              )}

              {/* Debug info showing detected columns */}
              {mappingDebug.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <details open className="text-sm">
                    <summary className="cursor-pointer text-slate-400 hover:text-slate-300 font-medium">
                      🔍 Debug: Excel parsing details ({headers.filter(h => h).length} columns detected)
                    </summary>
                    <div className="mt-2 space-y-0.5 font-mono text-xs max-h-64 overflow-y-auto">
                      {mappingDebug.map((msg, i) => (
                        <div
                          key={i}
                          className={`${
                            msg.includes('⚠️') ? 'text-yellow-400' :
                            msg.includes('🎯') ? 'text-teal-400' :
                            msg.includes('📋') ? 'text-blue-400' :
                            msg.includes('→') ? 'text-green-400' :
                            msg.startsWith('Row ') ? 'text-slate-400' :
                            msg.startsWith('---') ? 'text-slate-600' :
                            'text-slate-500'
                          }`}
                        >
                          {msg || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

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

              {/* Combined L×I columns (alternative to separate columns) */}
              {(mapping.inherentCombined || mapping.residualCombined || headers.some(h => /l[_x\/]i|likelihood.*impact/i.test(h))) && (
                <div>
                  <h4 className="font-medium text-white mb-3">
                    Combined Score Columns
                    <span className="text-xs text-slate-500 ml-2 font-normal">
                      (Use if L×I is in one column like &quot;3,4&quot; or &quot;3x4&quot;)
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {COMBINED_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1">
                          {field.label}
                          {getMappingIndicator(field.key)}
                        </label>
                        <select
                          value={mapping[field.key]}
                          onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                          className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white ${
                            mapping[field.key] ? 'border-purple-500/50' : 'border-slate-600'
                          }`}
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
              )}
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
                {duplicateResults.filter(d => d.matchType !== 'none').length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm">
                    {duplicateResults.filter(d => d.matchType !== 'none').length} possible duplicate{duplicateResults.filter(d => d.matchType !== 'none').length > 1 ? 's' : ''}
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
