'use client'

import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, ArrowLeft,
  FileText, Sparkles, AlertTriangle, Loader2, Wand2, Download
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
  // Combined columns (e.g., "Likelihood_Impact" containing "3,4")
  inherentCombined: string
  residualCombined: string
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

const CATEGORIES = [
  'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
  'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
]

const RESPONSES = ['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT']
const STATUSES = ['OPEN', 'IN_PROGRESS', 'MONITORING', 'CLOSED', 'ARCHIVED']

// Human-friendly status label → canonical enum mapping (case-insensitive key lookup)
// Values carry { status? (RiskStatus) } and/or { workflowStatus? (WorkflowStatus) }
// so a single "Status" import column can hydrate both fields appropriately.
const STATUS_ALIASES: Record<string, { status?: string; workflowStatus?: string }> = {
  // Direct RiskStatus pass-through
  'open':        { status: 'OPEN' },
  'in_progress': { status: 'IN_PROGRESS' },
  'monitoring':  { status: 'MONITORING' },
  'closed':      { status: 'CLOSED' },
  'archived':    { status: 'ARCHIVED' },
  // Direct WorkflowStatus pass-through
  'inbox':    { workflowStatus: 'INBOX' },
  'triage':   { workflowStatus: 'TRIAGE' },
  'assigned': { workflowStatus: 'ASSIGNED' },
  'approved': { workflowStatus: 'APPROVED' },
  // Human-friendly aliases (per spec)
  'active':         { workflowStatus: 'APPROVED' },
  'in progression': { status: 'IN_PROGRESS' },
  'in progress':    { status: 'IN_PROGRESS' },
  'archive':        { status: 'ARCHIVED' },
  'under review':   { workflowStatus: 'TRIAGE' },   // no REVIEW enum; TRIAGE is the review stage
  'review':         { workflowStatus: 'TRIAGE' },
  'draft':          { workflowStatus: 'INBOX' },
  // Additional common aliases
  'new':       { status: 'OPEN' },
  'pending':   { workflowStatus: 'INBOX' },
  'complete':  { status: 'CLOSED' },
  'completed': { status: 'CLOSED' },
  'done':      { status: 'CLOSED' },
  'monitor':   { status: 'MONITORING' },
  'watch':     { status: 'MONITORING' },
}

// Human-friendly category label → canonical RiskCategory enum (case-insensitive key lookup)
const CATEGORY_ALIASES: Record<string, string> = {
  // TECHNOLOGY
  'cyb':                    'TECHNOLOGY',
  'cyber':                  'TECHNOLOGY',
  'cyber security':         'TECHNOLOGY',
  'cybersecurity':          'TECHNOLOGY',
  'it':                     'TECHNOLOGY',
  'information technology': 'TECHNOLOGY',
  'tech':                   'TECHNOLOGY',
  // COMPLIANCE
  'com':        'COMPLIANCE',
  'compliance': 'COMPLIANCE',
  'regulatory': 'COMPLIANCE',
  'legal':      'COMPLIANCE',
  // PEOPLE
  'hrm':             'PEOPLE',
  'human resources': 'PEOPLE',
  'hr':              'PEOPLE',
  'people':          'PEOPLE',
  'human capital':   'PEOPLE',
  'workforce':       'PEOPLE',
  // STRATEGIC
  'str':      'STRATEGIC',
  'strategic': 'STRATEGIC',
  'strategy':  'STRATEGIC',
  // OPERATIONAL
  'ops':         'OPERATIONAL',
  'operational': 'OPERATIONAL',
  'operations':  'OPERATIONAL',
  'process':     'OPERATIONAL',
  // FINANCIAL
  'fin':       'FINANCIAL',
  'financial': 'FINANCIAL',
  'finance':   'FINANCIAL',
  // REPUTATIONAL
  'rep':           'REPUTATIONAL',
  'reputational':  'REPUTATIONAL',
  'reputation':    'REPUTATIONAL',
  'brand':         'REPUTATIONAL',
  // ENVIRONMENTAL
  'env':           'ENVIRONMENTAL',
  'environmental': 'ENVIRONMENTAL',
  'environment':   'ENVIRONMENTAL',
  'esg':           'ENVIRONMENTAL',
}

// Patterns for combined Likelihood/Impact columns (e.g., "3,4" or "3x4")
const COMBINED_PATTERNS: { pattern: RegExp; confidence: number; type: 'inherent' | 'residual' }[] = [
  { pattern: /^inherent\s*(?:risk\s*)?(?:l[_x/]i|likelihood[_x/\s]*impact|l\s*[x\/]\s*i)$/i, confidence: 1.0, type: 'inherent' },
  { pattern: /^gross\s*(?:l[_x/]i|likelihood[_x/\s]*impact)$/i, confidence: 1.0, type: 'inherent' },
  { pattern: /^(?:l[_x/]i|likelihood[_x/\s]*impact)$/i, confidence: 0.9, type: 'inherent' },
  { pattern: /^inherent\s*(?:risk\s*)?score$/i, confidence: 0.85, type: 'inherent' },
  { pattern: /^inherent\s*risk$/i, confidence: 0.8, type: 'inherent' },
  { pattern: /^residual\s*(?:risk\s*)?(?:l[_x/]i|likelihood[_x/\s]*impact|l\s*[x\/]\s*i)$/i, confidence: 1.0, type: 'residual' },
  { pattern: /^net\s*(?:l[_x/]i|likelihood[_x/\s]*impact)$/i, confidence: 1.0, type: 'residual' },
  { pattern: /^residual\s*(?:risk\s*)?score$/i, confidence: 0.85, type: 'residual' },
  { pattern: /^residual\s*risk$/i, confidence: 0.8, type: 'residual' },
]

// Smart field mapping patterns - ordered by priority (first match wins)
// More specific patterns should come before generic ones
const FIELD_PATTERNS: Record<keyof Omit<ColumnMapping, 'inherentCombined' | 'residualCombined'>, { pattern: RegExp; confidence: number }[]> = {
  title: [
    { pattern: /^risk\s*title$/i, confidence: 1.0 },
    { pattern: /^risk\s*name$/i, confidence: 1.0 },
    { pattern: /^risk\s*id$/i, confidence: 0.6 }, // Sometimes ID is the title in simple registers
    { pattern: /^title$/i, confidence: 0.95 },
    { pattern: /^name$/i, confidence: 0.85 },
    { pattern: /^risk$/i, confidence: 0.75 },
    { pattern: /risk.*title/i, confidence: 0.7 },
    { pattern: /risk.*name/i, confidence: 0.7 },
    { pattern: /^issue$/i, confidence: 0.5 },
    { pattern: /^event$/i, confidence: 0.5 },
  ],
  description: [
    { pattern: /^risk\s*description$/i, confidence: 1.0 },
    { pattern: /^description$/i, confidence: 0.95 },
    { pattern: /^desc\.?$/i, confidence: 0.9 },
    { pattern: /^risk\s*details?$/i, confidence: 0.9 },
    { pattern: /^details?$/i, confidence: 0.8 },
    { pattern: /^summary$/i, confidence: 0.75 },
    { pattern: /^narrative$/i, confidence: 0.7 },
    { pattern: /^notes?$/i, confidence: 0.6 },
    { pattern: /description/i, confidence: 0.6 },
    { pattern: /detail/i, confidence: 0.5 },
  ],
  category: [
    { pattern: /^risk\s*category$/i, confidence: 1.0 },
    { pattern: /^category$/i, confidence: 0.95 },
    { pattern: /^risk\s*type$/i, confidence: 0.95 },
    { pattern: /^risk\s*class$/i, confidence: 0.95 },
    { pattern: /^risk\s*area$/i, confidence: 0.95 },
    { pattern: /^risk\s*domain$/i, confidence: 0.95 },
    { pattern: /^principal\s*risk(s)?$/i, confidence: 0.9 },
    { pattern: /^operational\s*risk\s*class(es)?$/i, confidence: 0.9 },
    { pattern: /^strategic\s*objectives?$/i, confidence: 0.85 },
    { pattern: /^type$/i, confidence: 0.8 },
    { pattern: /^class$/i, confidence: 0.8 },
    { pattern: /^division$/i, confidence: 0.75 },
    { pattern: /^business\s*unit$/i, confidence: 0.75 },
    { pattern: /^department$/i, confidence: 0.75 },
    { pattern: /^function$/i, confidence: 0.7 },
    { pattern: /^area$/i, confidence: 0.7 },
    { pattern: /^domain$/i, confidence: 0.7 },
    { pattern: /^pillar$/i, confidence: 0.7 },
    { pattern: /^theme$/i, confidence: 0.6 },
    { pattern: /category/i, confidence: 0.5 },
    { pattern: /class/i, confidence: 0.4 },
  ],
  inherentLikelihood: [
    { pattern: /^inherent\s*likelihood$/i, confidence: 1.0 },
    { pattern: /^gross\s*likelihood$/i, confidence: 1.0 },
    { pattern: /^raw\s*likelihood$/i, confidence: 1.0 },
    { pattern: /^initial\s*likelihood$/i, confidence: 1.0 },
    { pattern: /inherent.*likelihood/i, confidence: 0.95 },
    { pattern: /gross.*likelihood/i, confidence: 0.95 },
    { pattern: /^likelihood\s*\(?rating\)?$/i, confidence: 0.9 },
    { pattern: /^likelihood\s*\(?score\)?$/i, confidence: 0.9 },
    { pattern: /^likelihood\s*\(?\d+-\d+\)?$/i, confidence: 0.9 }, // "Likelihood (1-5)"
    { pattern: /^likelihood$/i, confidence: 0.85 },
    { pattern: /^probability$/i, confidence: 0.8 },
    { pattern: /^l\s*rating$/i, confidence: 0.8 },
    { pattern: /^prob\.?$/i, confidence: 0.7 },
    { pattern: /likelihood/i, confidence: 0.6 },
    { pattern: /^l$/i, confidence: 0.4 },
  ],
  inherentImpact: [
    { pattern: /^inherent\s*impact$/i, confidence: 1.0 },
    { pattern: /^gross\s*impact$/i, confidence: 1.0 },
    { pattern: /^raw\s*impact$/i, confidence: 1.0 },
    { pattern: /^initial\s*impact$/i, confidence: 1.0 },
    { pattern: /inherent.*impact/i, confidence: 0.95 },
    { pattern: /gross.*impact/i, confidence: 0.95 },
    { pattern: /^impact\s*\(?rating\)?$/i, confidence: 0.9 },
    { pattern: /^impact\s*\(?score\)?$/i, confidence: 0.9 },
    { pattern: /^impact\s*\(?\d+-\d+\)?$/i, confidence: 0.9 }, // "Impact (1-5)"
    { pattern: /^impact$/i, confidence: 0.85 },
    { pattern: /^consequence$/i, confidence: 0.8 },
    { pattern: /^severity$/i, confidence: 0.8 },
    { pattern: /^i\s*rating$/i, confidence: 0.8 },
    { pattern: /^sev\.?$/i, confidence: 0.7 },
    { pattern: /impact/i, confidence: 0.6 },
    { pattern: /^i$/i, confidence: 0.4 },
  ],
  residualLikelihood: [
    { pattern: /^residual\s*likelihood$/i, confidence: 1.0 },
    { pattern: /^net\s*likelihood$/i, confidence: 1.0 },
    { pattern: /^current\s*likelihood$/i, confidence: 1.0 },
    { pattern: /^controlled\s*likelihood$/i, confidence: 1.0 },
    { pattern: /residual.*likelihood/i, confidence: 0.95 },
    { pattern: /net.*likelihood/i, confidence: 0.95 },
    { pattern: /^res\.?\s*likelihood$/i, confidence: 0.9 },
    { pattern: /^res\.?\s*l$/i, confidence: 0.8 },
    { pattern: /^rl$/i, confidence: 0.7 },
  ],
  residualImpact: [
    { pattern: /^residual\s*impact$/i, confidence: 1.0 },
    { pattern: /^net\s*impact$/i, confidence: 1.0 },
    { pattern: /^current\s*impact$/i, confidence: 1.0 },
    { pattern: /^controlled\s*impact$/i, confidence: 1.0 },
    { pattern: /residual.*impact/i, confidence: 0.95 },
    { pattern: /net.*impact/i, confidence: 0.95 },
    { pattern: /^res\.?\s*impact$/i, confidence: 0.9 },
    { pattern: /^res\.?\s*i$/i, confidence: 0.8 },
    { pattern: /^ri$/i, confidence: 0.7 },
  ],
  response: [
    { pattern: /^risk\s*response$/i, confidence: 1.0 },
    { pattern: /^response\s*strategy$/i, confidence: 1.0 },
    { pattern: /^response$/i, confidence: 0.9 },
    { pattern: /^treatment$/i, confidence: 0.9 },
    { pattern: /^risk\s*treatment$/i, confidence: 1.0 },
    { pattern: /^strategy$/i, confidence: 0.7 },
    { pattern: /^action$/i, confidence: 0.6 },
    { pattern: /response/i, confidence: 0.5 },
    { pattern: /treatment/i, confidence: 0.5 },
  ],
  controls: [
    { pattern: /^controls?$/i, confidence: 1.0 },
    { pattern: /^existing\s*controls?$/i, confidence: 1.0 },
    { pattern: /^current\s*controls?$/i, confidence: 1.0 },
    { pattern: /^mitigating\s*controls?$/i, confidence: 1.0 },
    { pattern: /^mitigation$/i, confidence: 0.95 },
    { pattern: /^mitigations?$/i, confidence: 0.95 },
    { pattern: /^countermeasures?$/i, confidence: 0.9 },
    { pattern: /control/i, confidence: 0.6 },
    { pattern: /mitigation/i, confidence: 0.6 },
    { pattern: /measure/i, confidence: 0.5 },
    { pattern: /safeguard/i, confidence: 0.5 },
  ],
  status: [
    { pattern: /^risk\s*status$/i, confidence: 1.0 },
    { pattern: /^status$/i, confidence: 0.95 },
    { pattern: /^state$/i, confidence: 0.8 },
    { pattern: /^progress$/i, confidence: 0.7 },
    { pattern: /^phase$/i, confidence: 0.6 },
    { pattern: /status/i, confidence: 0.5 },
  ],
}

function smartAutoMap(headers: string[]): { mapping: ColumnMapping; confidence: Record<string, number>; debug: string[] } {
  const mapping: ColumnMapping = {
    title: '', description: '', category: '',
    inherentLikelihood: '', inherentImpact: '',
    residualLikelihood: '', residualImpact: '',
    response: '', controls: '', status: '',
    inherentCombined: '', residualCombined: '',
  }
  const confidence: Record<string, number> = {}
  const usedHeaders = new Set<string>()
  const debug: string[] = []

  // Log all headers for debugging
  debug.push(`Found ${headers.length} columns: ${headers.join(', ')}`)

  // First, check for combined Likelihood/Impact columns
  for (const header of headers) {
    const normalizedHeader = header.trim()
    for (const { pattern, confidence: patternConf, type } of COMBINED_PATTERNS) {
      if (pattern.test(normalizedHeader)) {
        const field = type === 'inherent' ? 'inherentCombined' : 'residualCombined'
        if (!mapping[field] || patternConf > (confidence[field] || 0)) {
          mapping[field] = header
          confidence[field] = patternConf
          debug.push(`🔗 Combined column: "${header}" → ${field} (${Math.round(patternConf * 100)}%)`)
          if (patternConf >= 0.9) usedHeaders.add(header)
        }
        break
      }
    }
  }

  // Match each field using patterns with confidence
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue
      const normalizedHeader = header.trim()

      for (const { pattern, confidence: patternConf } of patterns) {
        if (pattern.test(normalizedHeader)) {
          // Only update if this match has higher confidence
          if (!mapping[field as keyof ColumnMapping] || patternConf > (confidence[field] || 0)) {
            mapping[field as keyof ColumnMapping] = header
            confidence[field] = patternConf
            debug.push(`Mapped "${header}" → ${field} (${Math.round(patternConf * 100)}%)`)
            // Mark as used if high confidence to avoid reuse
            if (patternConf >= 0.9) usedHeaders.add(header)
          }
          break
        }
      }
    }
  }

  // If we have combined columns but no separate likelihood/impact, note it
  if (mapping.inherentCombined && !mapping.inherentLikelihood && !mapping.inherentImpact) {
    debug.push(`ℹ️ Using combined column "${mapping.inherentCombined}" for inherent L×I`)
  }
  if (mapping.residualCombined && !mapping.residualLikelihood && !mapping.residualImpact) {
    debug.push(`ℹ️ Using combined column "${mapping.residualCombined}" for residual L×I`)
  }

  // Auto-copy inherent to residual if residual not found
  if (!mapping.residualLikelihood && !mapping.residualCombined && mapping.inherentLikelihood) {
    mapping.residualLikelihood = mapping.inherentLikelihood
    confidence.residualLikelihood = 0.4
    debug.push(`Auto-copied inherent likelihood → residual likelihood`)
  }
  if (!mapping.residualImpact && !mapping.residualCombined && mapping.inherentImpact) {
    mapping.residualImpact = mapping.inherentImpact
    confidence.residualImpact = 0.4
    debug.push(`Auto-copied inherent impact → residual impact`)
  }
  if (!mapping.residualCombined && mapping.inherentCombined && !mapping.residualLikelihood) {
    mapping.residualCombined = mapping.inherentCombined
    confidence.residualCombined = 0.4
    debug.push(`Auto-copied inherent combined → residual combined`)
  }

  // Log unmapped required fields (considering combined columns satisfy L+I requirements)
  const hasInherent = mapping.inherentLikelihood || mapping.inherentCombined
  const hasResidual = mapping.residualLikelihood || mapping.residualCombined
  const unmapped = ['title', 'description', 'category']
    .filter(f => !mapping[f as keyof ColumnMapping])
  if (!hasInherent) unmapped.push('inherentLikelihood/Impact')
  if (!hasResidual) unmapped.push('residualLikelihood/Impact')

  if (unmapped.length > 0) {
    debug.push(`⚠️ Unmapped required fields: ${unmapped.join(', ')}`)
  }

  return { mapping, confidence, debug }
}

function parseCategory(value: string): { value: string; warning?: string } {
  if (!value?.toString().trim()) return { value: 'OPERATIONAL' }
  const normalized = value.toString().toLowerCase().trim()
  const upper = normalized.toUpperCase()
  // Direct enum match (case-insensitive)
  if (CATEGORIES.includes(upper)) return { value: upper }
  // Alias table lookup
  if (CATEGORY_ALIASES[normalized]) return { value: CATEGORY_ALIASES[normalized] }
  // Legacy 3-char prefix fallback
  const partial = CATEGORIES.find(c => c.startsWith(upper.substring(0, 3)))
  if (partial) return { value: partial }
  return {
    value: 'OPERATIONAL',
    warning: `Unknown category "${value}" — defaulted to OPERATIONAL`,
  }
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

function parseStatus(value: string | undefined): {
  status?: string
  workflowStatus?: string
  warning?: string
} {
  if (!value?.toString().trim()) return {}
  const normalized = value.toString().toLowerCase().trim()
  // Direct alias table lookup
  const match = STATUS_ALIASES[normalized]
  if (match) return match
  // Normalise spaces to underscores and try again ("in progress" → "in_progress")
  const withUnderscore = normalized.replace(/\s+/g, '_')
  const matchUs = STATUS_ALIASES[withUnderscore]
  if (matchUs) return matchUs
  // Partial substring fallback
  if (normalized.includes('progress'))                        return { status: 'IN_PROGRESS' }
  if (normalized.includes('monitor') || normalized.includes('watch')) return { status: 'MONITORING' }
  if (normalized.includes('close')   || normalized.includes('done'))  return { status: 'CLOSED' }
  if (normalized.includes('archive'))                         return { status: 'ARCHIVED' }
  if (normalized.includes('open')    || normalized.includes('new'))   return { status: 'OPEN' }
  return { warning: `Unknown status "${value}" — will use defaults` }
}

function parseNumber(value: unknown, min: number, max: number, defaultVal: number): number {
  const num = parseInt(String(value))
  if (isNaN(num)) return defaultVal
  return Math.min(max, Math.max(min, num))
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
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [extractionProgress, setExtractionProgress] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const utils = trpc.useUtils()
  const { data: registers } = trpc.risk.registers.useQuery()
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

      const sheetName = workbook.SheetNames[0]
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

      // Try to detect header row (might not be row 0)
      let headerRowIndex = 0
      let headerRow: string[] = []

      // Score each row to find the header:
      // - Prefer rows with text content (not just numbers)
      // - Prefer rows with more non-empty columns
      // - Headers typically have short, text-like values
      let maxScore = 0
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i] || []
        const nonEmptyCols = row.filter(c => c !== undefined && c !== '' && c !== null).length
        if (nonEmptyCols === 0) continue

        // Count cells that look like headers (text, not just numbers)
        const textCells = row.filter(c => {
          const val = String(c || '').trim()
          if (!val) return false
          // Headers are usually short text, not long paragraphs or pure numbers
          return val.length > 0 && val.length < 50 && !/^\d+([.,]\d+)?$/.test(val)
        }).length

        // Score: weight text cells heavily, also consider total columns
        const score = (textCells * 3) + nonEmptyCols
        debug.push(`Row ${i} score: ${score} (${textCells} text cells, ${nonEmptyCols} non-empty)`)

        if (score > maxScore) {
          maxScore = score
          headerRowIndex = i
        }
      }

      headerRow = (jsonData[headerRowIndex] || []).map(h => String(h || '').trim())
      const nonEmptyHeaders = headerRow.filter(h => h).length
      debug.push(`🎯 Detected header row: ${headerRowIndex} (${headerRow.length} columns, ${nonEmptyHeaders} non-empty)`)
      debug.push(`📋 Headers: ${headerRow.filter(h => h).join(', ')}`)

      // Data starts after header row
      const dataRows = jsonData.slice(headerRowIndex + 1).filter(row =>
        row.some(cell => cell !== undefined && cell !== '' && cell !== null)
      )
      debug.push(`📊 Data rows (after filtering empty): ${dataRows.length}`)

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
      const categoryResult = parseCategory(String(getValue(mapping.category) || ''))
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
        inherentLikelihood = parseNumber(getValue(mapping.inherentLikelihood), 1, 5, 3)
        inherentImpact = parseNumber(getValue(mapping.inherentImpact), 1, 5, 3)
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
        residualLikelihood = parseNumber(getValue(mapping.residualLikelihood), 1, 5, inherentLikelihood)
        residualImpact = parseNumber(getValue(mapping.residualImpact), 1, 5, inherentImpact)
      }

      if (residualLikelihood > inherentLikelihood) warnings.push('Residual L > Inherent L')
      if (residualImpact > inherentImpact) warnings.push('Residual I > Inherent I')

      const statusResult = parseStatus(getValue(mapping.status) as string | undefined)
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
