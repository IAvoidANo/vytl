/**
 * Excel Header Detection — pure, testable module
 *
 * Responsibilities:
 *  1. Scan the first N rows of a spreadsheet to find the header row.
 *  2. Map detected headers to known field names (smartAutoMap).
 *  3. Normalise raw category / status values.
 *
 * All functions are pure (no DOM, no XLSX dependency) so they can be
 * unit-tested without a browser environment.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnMapping {
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
  /** Combined column containing both inherent L and I (e.g. "3,4") */
  inherentCombined: string
  /** Combined column containing both residual L and I */
  residualCombined: string
}

export interface HeaderDetectionResult {
  /** 0-based row index of the detected header row */
  rowIndex: number
  /** Number of cells that matched a known field pattern */
  matchedFields: number
  /** Total confidence score used to select this row */
  score: number
  /** The raw header strings from the detected row (trimmed, non-empty) */
  headers: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Field patterns (regex-based, ordered by confidence)
// Each entry lists every regex variation the field header might appear as.
// ─────────────────────────────────────────────────────────────────────────────

export const FIELD_PATTERNS: Record<
  keyof Omit<ColumnMapping, 'inherentCombined' | 'residualCombined'>,
  { pattern: RegExp; confidence: number }[]
> = {
  title: [
    { pattern: /^risk\s*title$/i, confidence: 1.0 },
    { pattern: /^risk\s*name$/i, confidence: 1.0 },
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
    { pattern: /^cat$/i, confidence: 0.6 },
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
    { pattern: /^likelihood\s*\(?\d+-\d+\)?$/i, confidence: 0.9 },
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
    { pattern: /^impact\s*\(?\d+-\d+\)?$/i, confidence: 0.9 },
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

/** Patterns for combined Likelihood × Impact columns (e.g. "L×I", "L x I", "LxI") */
export const COMBINED_PATTERNS: {
  pattern: RegExp
  confidence: number
  type: 'inherent' | 'residual'
}[] = [
  // Inherent — explicit prefix
  { pattern: /^inherent\s*(?:risk\s*)?(?:l[_x\u00d7/]i|likelihood[_x\u00d7/\s]*impact|l\s*[x\u00d7\/]\s*i)$/i, confidence: 1.0, type: 'inherent' },
  { pattern: /^gross\s*(?:l[_x\u00d7/]i|likelihood[_x\u00d7/\s]*impact)$/i, confidence: 1.0, type: 'inherent' },
  // Generic L×I (no qualifier — assume inherent)
  { pattern: /^l\s*[x\u00d7\/_]\s*i$/i, confidence: 0.9, type: 'inherent' },
  { pattern: /^(?:likelihood[_x\u00d7/\s]*impact)$/i, confidence: 0.9, type: 'inherent' },
  { pattern: /^inherent\s*(?:risk\s*)?score$/i, confidence: 0.85, type: 'inherent' },
  { pattern: /^inherent\s*risk$/i, confidence: 0.8, type: 'inherent' },
  // Residual — explicit prefix
  { pattern: /^res(?:idual)?\s*(?:risk\s*)?(?:l[_x\u00d7/]i|likelihood[_x\u00d7/\s]*impact|l\s*[x\u00d7\/]\s*i)$/i, confidence: 1.0, type: 'residual' },
  { pattern: /^net\s*(?:l[_x\u00d7/]i|likelihood[_x\u00d7/\s]*impact)$/i, confidence: 1.0, type: 'residual' },
  { pattern: /^residual\s*(?:risk\s*)?score$/i, confidence: 0.85, type: 'residual' },
  { pattern: /^residual\s*risk$/i, confidence: 0.8, type: 'residual' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Text helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the cell value looks like a header cell rather than data:
 * - Short (< 60 chars)
 * - Not a pure number or date number
 */
export function looksLikeHeaderCell(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length === 0) return false
  if (trimmed.length >= 60) return false
  // Pure numbers are data, not headers
  if (/^\d+([.,]\d+)?$/.test(trimmed)) return false
  return true
}

/**
 * Score a single cell value against all known field patterns.
 * Returns the best confidence score found (0 = no match).
 */
export function scoreHeaderCell(cellValue: string): number {
  if (!cellValue?.trim()) return 0
  const v = cellValue.trim()

  // Check combined patterns first
  for (const { pattern, confidence } of COMBINED_PATTERNS) {
    if (pattern.test(v)) return confidence
  }

  // Check field patterns
  let best = 0
  for (const patterns of Object.values(FIELD_PATTERNS)) {
    for (const { pattern, confidence } of patterns) {
      if (pattern.test(v) && confidence > best) {
        best = confidence
        break // patterns are ordered; first match is the best for this field
      }
    }
  }
  return best
}

// ─────────────────────────────────────────────────────────────────────────────
// Header row detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score a row to determine how likely it is to be the header row.
 *
 * Score components:
 *  - Field-pattern matches (dominant signal — each match worth up to 100 pts)
 *  - Text-cell heuristic (secondary — looks-like-header cells)
 *  - Column count bonus (small bonus for wider rows)
 */
export function scoreRow(row: string[]): { score: number; matchedFields: number } {
  if (!row || row.length === 0) return { score: 0, matchedFields: 0 }

  let fieldScore = 0
  let matchedFields = 0
  let textCells = 0

  for (const cell of row) {
    const cellStr = String(cell ?? '').trim()
    if (!cellStr) continue

    const conf = scoreHeaderCell(cellStr)
    if (conf > 0) {
      fieldScore += conf * 100
      matchedFields++
    }

    if (looksLikeHeaderCell(cellStr)) {
      textCells++
    }
  }

  // Primary: field pattern score
  // Secondary: text-cell heuristic (capped so it can't override a strong field match)
  const textBonus = Math.min(textCells * 5, 50)
  const colBonus = Math.min(row.filter(c => String(c ?? '').trim()).length, 10)

  return {
    score: fieldScore + textBonus + colBonus,
    matchedFields,
  }
}

/**
 * Scan the first `maxRows` rows and return the most likely header row.
 *
 * Returns `null` if no row has at least 2 field-pattern matches
 * (prevents false-positive detection on data-only sheets).
 */
export function detectHeaderRow(
  rows: string[][],
  maxRows = 10
): HeaderDetectionResult | null {
  const limit = Math.min(maxRows, rows.length)

  let best: HeaderDetectionResult | null = null

  for (let i = 0; i < limit; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const { score, matchedFields } = scoreRow(row)

    // Require at least 2 recognised field cells to avoid false positives
    if (matchedFields < 2) continue

    if (!best || score > best.score) {
      best = {
        rowIndex: i,
        matchedFields,
        score,
        headers: row.map(c => String(c ?? '').trim()).filter(Boolean),
      }
    }
  }

  return best
}

// ─────────────────────────────────────────────────────────────────────────────
// Column auto-mapping
// ─────────────────────────────────────────────────────────────────────────────

export interface AutoMapResult {
  mapping: ColumnMapping
  confidence: Record<string, number>
  debug: string[]
}

/**
 * Map a list of raw header strings to `ColumnMapping` field names.
 * Uses `FIELD_PATTERNS` and `COMBINED_PATTERNS` with confidence scoring.
 * Higher-confidence matches win when multiple headers could map to the same field.
 */
export function smartAutoMap(headers: string[]): AutoMapResult {
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

  debug.push(`Found ${headers.length} columns: ${headers.join(', ')}`)

  // Pass 1: combined L×I columns (highest priority)
  for (const header of headers) {
    const v = header.trim()
    for (const { pattern, confidence: conf, type } of COMBINED_PATTERNS) {
      if (pattern.test(v)) {
        const field = type === 'inherent' ? 'inherentCombined' : 'residualCombined'
        if (!mapping[field] || conf > (confidence[field] ?? 0)) {
          mapping[field] = header
          confidence[field] = conf
          debug.push(`🔗 Combined: "${header}" → ${field} (${Math.round(conf * 100)}%)`)
          if (conf >= 0.9) usedHeaders.add(header)
        }
        break
      }
    }
  }

  // Pass 2: individual fields
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue
      const v = header.trim()
      for (const { pattern, confidence: conf } of patterns) {
        if (pattern.test(v)) {
          if (!mapping[field as keyof ColumnMapping] || conf > (confidence[field] ?? 0)) {
            mapping[field as keyof ColumnMapping] = header
            confidence[field] = conf
            debug.push(`Mapped "${header}" → ${field} (${Math.round(conf * 100)}%)`)
            if (conf >= 0.9) usedHeaders.add(header)
          }
          break
        }
      }
    }
  }

  // Auto-copy inherent → residual when residual not found
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

  // Log unmapped required fields
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

// ─────────────────────────────────────────────────────────────────────────────
// Data row extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all rows after `headerRowIndex`, filtering out completely empty rows.
 */
export function extractDataRows(rows: string[][], headerRowIndex: number): string[][] {
  return rows
    .slice(headerRowIndex + 1)
    .filter(row => row?.some(cell => String(cell ?? '').trim() !== ''))
}
