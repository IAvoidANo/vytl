/**
 * Header Detection — unit tests
 *
 * Tests the pure functions in src/lib/excel-import/header-detection.ts.
 * No DOM, no XLSX dependency — all inputs are plain string arrays.
 */

import { describe, it, expect } from 'vitest'
import {
  looksLikeHeaderCell,
  scoreHeaderCell,
  scoreRow,
  detectHeaderRow,
  smartAutoMap,
  extractDataRows,
} from '@/lib/excel-import/header-detection'

// ─────────────────────────────────────────────────────────────────────────────
// looksLikeHeaderCell
// ─────────────────────────────────────────────────────────────────────────────

describe('looksLikeHeaderCell', () => {
  it('returns true for typical header text', () => {
    expect(looksLikeHeaderCell('Title')).toBe(true)
    expect(looksLikeHeaderCell('Risk ID')).toBe(true)
    expect(looksLikeHeaderCell('Likelihood')).toBe(true)
    expect(looksLikeHeaderCell('Category')).toBe(true)
  })

  it('returns false for pure numbers (data, not headers)', () => {
    expect(looksLikeHeaderCell('42')).toBe(false)
    expect(looksLikeHeaderCell('3.5')).toBe(false)
    expect(looksLikeHeaderCell('1,234')).toBe(false)
  })

  it('returns false for empty or blank strings', () => {
    expect(looksLikeHeaderCell('')).toBe(false)
    expect(looksLikeHeaderCell('   ')).toBe(false)
  })

  it('returns false for very long strings (paragraph text, not headers)', () => {
    const longText = 'a'.repeat(60)
    expect(looksLikeHeaderCell(longText)).toBe(false)
  })

  it('returns true for short text even with numbers', () => {
    expect(looksLikeHeaderCell('L (1-5)')).toBe(true)
    expect(looksLikeHeaderCell('Score')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// scoreHeaderCell
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreHeaderCell', () => {
  it('returns 0 for empty string', () => {
    expect(scoreHeaderCell('')).toBe(0)
    expect(scoreHeaderCell('   ')).toBe(0)
  })

  it('returns high confidence for exact field names', () => {
    expect(scoreHeaderCell('Title')).toBeGreaterThanOrEqual(0.9)
    expect(scoreHeaderCell('Category')).toBeGreaterThanOrEqual(0.9)
    expect(scoreHeaderCell('Likelihood')).toBeGreaterThanOrEqual(0.8)
    expect(scoreHeaderCell('Description')).toBeGreaterThanOrEqual(0.9)
  })

  it('returns high confidence for known variants', () => {
    expect(scoreHeaderCell('Risk Title')).toBeGreaterThanOrEqual(0.95)
    expect(scoreHeaderCell('Risk Category')).toBeGreaterThanOrEqual(0.95)
    expect(scoreHeaderCell('Inherent Likelihood')).toBeGreaterThanOrEqual(0.95)
    expect(scoreHeaderCell('Residual Impact')).toBeGreaterThanOrEqual(0.95)
  })

  it('returns positive confidence for abbreviations', () => {
    expect(scoreHeaderCell('L')).toBeGreaterThan(0)   // Likelihood
    expect(scoreHeaderCell('I')).toBeGreaterThan(0)   // Impact
    expect(scoreHeaderCell('Desc')).toBeGreaterThan(0)
  })

  it('returns 0 for unrelated text', () => {
    expect(scoreHeaderCell('Company Name')).toBe(0)
    expect(scoreHeaderCell('John Smith')).toBe(0)
    expect(scoreHeaderCell('Acme Manufacturing Risk Register')).toBe(0)
  })

  it('returns positive confidence for combined L×I patterns', () => {
    expect(scoreHeaderCell('L x I')).toBeGreaterThan(0)
    expect(scoreHeaderCell('Inherent L/I')).toBeGreaterThan(0)
    expect(scoreHeaderCell('Residual Score')).toBeGreaterThan(0)
    expect(scoreHeaderCell('Residual L x I')).toBeGreaterThanOrEqual(1.0)
  })

  it('is case-insensitive', () => {
    const titleUpper = scoreHeaderCell('TITLE')
    const titleLower = scoreHeaderCell('title')
    const titleMixed = scoreHeaderCell('Title')
    expect(titleUpper).toBe(titleLower)
    expect(titleLower).toBe(titleMixed)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// scoreRow
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreRow', () => {
  it('returns score 0 and matchedFields 0 for empty row', () => {
    const result = scoreRow([])
    expect(result.score).toBe(0)
    expect(result.matchedFields).toBe(0)
  })

  it('scores a standard header row highly', () => {
    const row = ['Risk ID', 'Title', 'Category', 'Likelihood', 'Impact']
    const result = scoreRow(row)
    expect(result.matchedFields).toBeGreaterThanOrEqual(3)
    expect(result.score).toBeGreaterThan(100)
  })

  it('scores a title-only row near zero', () => {
    const row = ['Acme Manufacturing Risk Register 2026']
    const result = scoreRow(row)
    expect(result.matchedFields).toBe(0)
  })

  it('scores a data row near zero', () => {
    const row = ['RISK-001', 'Equipment failure', 'Operational', '4', '4']
    const result = scoreRow(row)
    // Data rows may match some cells (e.g. "Operational" → category), but the
    // score should be much lower than a real header row
    expect(result.score).toBeLessThan(200)
  })

  it('scores abbreviated header row positively', () => {
    const row = ['ID', 'Title', 'Cat', 'L', 'I', 'L×I']
    const result = scoreRow(row)
    expect(result.matchedFields).toBeGreaterThanOrEqual(3)
    expect(result.score).toBeGreaterThan(50)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// detectHeaderRow
// ─────────────────────────────────────────────────────────────────────────────

describe('detectHeaderRow', () => {
  it('detects headers in row 0 (standard format)', () => {
    const rows = [
      ['Risk ID', 'Title', 'Category', 'Likelihood', 'Impact'],
      ['RISK-001', 'Equipment failure', 'Operational', '4', '4'],
      ['RISK-002', 'Load shedding', 'Financial', '5', '5'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(0)
    expect(result!.matchedFields).toBeGreaterThanOrEqual(3)
  })

  it('detects headers in row 1 (single title row above)', () => {
    const rows = [
      ['Acme Manufacturing Risk Register'],
      ['Risk ID', 'Title', 'Category', 'Likelihood', 'Impact'],
      ['RISK-001', 'Equipment failure', 'Operational', '4', '4'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(1)
  })

  it('detects headers in row 3 (metadata rows and blank row above)', () => {
    const rows = [
      ['Risk Register'],
      ['Prepared by: John Smith | Date: Jan 2026'],
      [''],
      ['Risk ID', 'Title', 'Category', 'Inherent Likelihood', 'Inherent Impact'],
      ['RISK-001', 'Equipment failure', 'Operational', '4', '4'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(3)
  })

  it('detects headers in row 4 (multiple title rows and blank)', () => {
    const rows = [
      ['Risk Register'],
      ['Q1 2026'],
      ['Prepared by: John Smith'],
      [''],
      ['ID', 'Title', 'Category', 'L', 'I'],
      ['RISK-001', 'Test', 'OPERATIONAL', '3', '3'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(4)
  })

  it('handles UPPERCASE header variations', () => {
    const rows = [
      ['RISK ID', 'TITLE', 'CATEGORY', 'LIKELIHOOD', 'IMPACT'],
      ['RISK-001', 'Test', 'OPERATIONAL', '3', '3'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(0)
    expect(result!.matchedFields).toBeGreaterThanOrEqual(3)
  })

  it('handles lowercase header variations', () => {
    const rows = [
      ['risk id', 'title', 'category', 'likelihood', 'impact'],
      ['RISK-001', 'Test', 'OPERATIONAL', '3', '3'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(0)
  })

  it('handles separator variations (Risk_ID, Risk-Title, Risk/Category)', () => {
    const rows = [
      ['Risk_ID', 'Risk_Title', 'Risk_Category', 'Likelihood', 'Impact'],
      ['RISK-001', 'Test', 'OPERATIONAL', '3', '3'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(0)
  })

  it('detects combined L×I column headers', () => {
    const rows = [
      ['ID', 'Title', 'Category', 'Inherent L x I', 'Residual Score'],
      ['R-001', 'Test Risk', 'Operational', '12', '6'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.matchedFields).toBeGreaterThanOrEqual(3)
  })

  it('detects full field names with parenthetical qualifiers', () => {
    const rows = [
      ['Risk ID', 'Title', 'Category', 'Likelihood (1-5)', 'Impact (1-5)'],
      ['R-001', 'Test', 'Ops', '3', '4'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(0)
    expect(result!.matchedFields).toBeGreaterThanOrEqual(3)
  })

  it('returns null when no row has ≥2 field-pattern matches', () => {
    const rows = [
      ['Company', 'XYZ Corp', '2026'],
      ['123', '456', '789'],
      ['abc', 'def', 'ghi'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).toBeNull()
  })

  it('respects maxRows limit', () => {
    const rows = [
      ['Not a header', 'gibberish', 'random'],
      ['Another', 'non-header', 'row'],
      ['Title', 'Category', 'Likelihood', 'Impact'], // actual header at row 2
    ]
    // Scanning only first 2 rows — should not find the header
    const limitedResult = detectHeaderRow(rows, 2)
    expect(limitedResult).toBeNull()

    // Scanning all rows — should find it
    const fullResult = detectHeaderRow(rows, 10)
    expect(fullResult).not.toBeNull()
    expect(fullResult!.rowIndex).toBe(2)
  })

  it('prefers the row with the highest field-match score when multiple candidates exist', () => {
    // Row 0 has 2 field matches; row 1 has 4 field matches
    const rows = [
      ['Title', 'Category', 'Other', 'Stuff'],
      ['Title', 'Category', 'Likelihood', 'Impact'],
      ['R-001', 'Test', 'OPS', '3', '4'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(1)
  })

  it('returns the raw header strings (trimmed, non-empty)', () => {
    const rows = [
      ['Title', '', 'Category', '  Likelihood  ', 'Impact'],
      ['Test', '', 'Ops', '3', '4'],
    ]
    const result = detectHeaderRow(rows)
    expect(result).not.toBeNull()
    // Headers should be trimmed and empty cells excluded
    expect(result!.headers).not.toContain('')
    expect(result!.headers).toContain('Likelihood')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// smartAutoMap
// ─────────────────────────────────────────────────────────────────────────────

describe('smartAutoMap', () => {
  it('maps standard headers to correct fields', () => {
    const { mapping } = smartAutoMap(['Title', 'Category', 'Likelihood', 'Impact'])
    expect(mapping.title).toBe('Title')
    expect(mapping.category).toBe('Category')
    expect(mapping.inherentLikelihood).toBe('Likelihood')
    expect(mapping.inherentImpact).toBe('Impact')
  })

  it('maps "Risk Title" to title field', () => {
    const { mapping } = smartAutoMap(['Risk Title', 'Risk Category', 'Description'])
    expect(mapping.title).toBe('Risk Title')
    expect(mapping.category).toBe('Risk Category')
    expect(mapping.description).toBe('Description')
  })

  it('maps inherent and residual fields correctly', () => {
    const headers = [
      'Title', 'Category',
      'Inherent Likelihood', 'Inherent Impact',
      'Residual Likelihood', 'Residual Impact',
    ]
    const { mapping } = smartAutoMap(headers)
    expect(mapping.inherentLikelihood).toBe('Inherent Likelihood')
    expect(mapping.inherentImpact).toBe('Inherent Impact')
    expect(mapping.residualLikelihood).toBe('Residual Likelihood')
    expect(mapping.residualImpact).toBe('Residual Impact')
  })

  it('maps combined L×I column', () => {
    const headers = ['Title', 'Category', 'Inherent L x I']
    const { mapping } = smartAutoMap(headers)
    expect(mapping.inherentCombined).toBe('Inherent L x I')
  })

  it('auto-copies inherent to residual when residual columns not found', () => {
    const headers = ['Title', 'Category', 'Likelihood', 'Impact']
    const { mapping, confidence } = smartAutoMap(headers)
    // Should auto-copy likelihood/impact to residual fields
    expect(mapping.residualLikelihood).toBe('Likelihood')
    expect(mapping.residualImpact).toBe('Impact')
    expect(confidence.residualLikelihood).toBe(0.4)
    expect(confidence.residualImpact).toBe(0.4)
  })

  it('maps optional fields when present', () => {
    const headers = ['Title', 'Category', 'Controls', 'Status', 'Response']
    const { mapping } = smartAutoMap(headers)
    expect(mapping.controls).toBe('Controls')
    expect(mapping.status).toBe('Status')
    expect(mapping.response).toBe('Response')
  })

  it('returns debug messages', () => {
    const { debug } = smartAutoMap(['Title', 'Category'])
    expect(debug.length).toBeGreaterThan(0)
    expect(debug[0]).toContain('Found')
  })

  it('returns confidence scores for each mapped field', () => {
    const { confidence } = smartAutoMap(['Title', 'Risk Category'])
    expect(confidence.title).toBeGreaterThan(0)
    expect(confidence.category).toBeGreaterThan(0)
  })

  it('reports unmapped required fields in debug output', () => {
    const { debug } = smartAutoMap(['Owner', 'Controls']) // missing title/category/L/I
    const warning = debug.find(d => d.includes('Unmapped required fields'))
    expect(warning).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// extractDataRows
// ─────────────────────────────────────────────────────────────────────────────

describe('extractDataRows', () => {
  it('returns rows after header row', () => {
    const rows = [
      ['Title', 'Category'],
      ['Risk 1', 'OPERATIONAL'],
      ['Risk 2', 'FINANCIAL'],
    ]
    const result = extractDataRows(rows, 0)
    expect(result).toHaveLength(2)
    expect(result[0][0]).toBe('Risk 1')
  })

  it('skips title rows when headerRowIndex > 0', () => {
    const rows = [
      ['Company Risk Register'],
      ['Title', 'Category'],
      ['Risk 1', 'OPERATIONAL'],
      ['Risk 2', 'FINANCIAL'],
    ]
    const result = extractDataRows(rows, 1)
    expect(result).toHaveLength(2)
    expect(result[0][0]).toBe('Risk 1')
  })

  it('filters out completely empty rows', () => {
    const rows = [
      ['Title', 'Category'],
      ['Risk 1', 'OPERATIONAL'],
      ['', ''],
      ['Risk 2', 'FINANCIAL'],
    ]
    const result = extractDataRows(rows, 0)
    expect(result).toHaveLength(2)
  })

  it('keeps rows that have at least one non-empty cell', () => {
    const rows = [
      ['Title', 'Category'],
      ['Risk 1', ''],           // partial row — keep
      ['', ''],                 // totally empty — discard
      ['', 'FINANCIAL'],        // partial row — keep
    ]
    const result = extractDataRows(rows, 0)
    expect(result).toHaveLength(2)
  })

  it('returns empty array when no data rows exist after header', () => {
    const rows = [['Title', 'Category']]
    const result = extractDataRows(rows, 0)
    expect(result).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('End-to-end scenarios', () => {
  it('scenario: standard format (row 0 = headers)', () => {
    const rows = [
      ['Risk ID', 'Title', 'Category', 'Inherent L', 'Inherent I', 'Residual L', 'Residual I', 'Controls'],
      ['R-001', 'Equipment failure', 'Operational', '4', '4', '2', '3', 'Preventive maintenance'],
      ['R-002', 'Load shedding', 'Financial', '5', '5', '4', '4', 'Backup generators'],
    ]

    const header = detectHeaderRow(rows)
    expect(header).not.toBeNull()
    expect(header!.rowIndex).toBe(0)

    const { mapping } = smartAutoMap(header!.headers)
    expect(mapping.title).toBe('Title')
    expect(mapping.category).toBe('Category')
    expect(mapping.controls).toBe('Controls')

    const data = extractDataRows(rows, header!.rowIndex)
    expect(data).toHaveLength(2)
  })

  it('scenario: title row above headers (most common real-world variation)', () => {
    const rows = [
      ['Acme Manufacturing — Risk Register Q1 2026'],
      ['Prepared by: Risk Committee | Approved: Board'],
      [''],
      ['ID', 'Risk Title', 'Risk Category', 'Likelihood', 'Impact', 'Residual Likelihood', 'Residual Impact'],
      ['RM-001', 'OHS Act non-compliance', 'Compliance', '3', '4', '2', '2'],
      ['RM-002', 'Load shedding impact', 'Operational', '5', '4', '3', '3'],
    ]

    const header = detectHeaderRow(rows)
    expect(header).not.toBeNull()
    expect(header!.rowIndex).toBe(3)

    const { mapping } = smartAutoMap(header!.headers)
    expect(mapping.title).toBe('Risk Title')
    expect(mapping.category).toBe('Risk Category')
    expect(mapping.inherentLikelihood).toBe('Likelihood')

    const data = extractDataRows(rows, header!.rowIndex)
    expect(data).toHaveLength(2)
    expect(data[0][1]).toBe('OHS Act non-compliance')
  })

  it('scenario: abbreviated headers with combined L×I', () => {
    const rows = [
      ['ID', 'Title', 'Cat', 'L×I', 'Res L×I', 'Owner'],
      ['001', 'POPIA breach', 'COMPLIANCE', '20', '12', 'CEO'],
    ]

    const header = detectHeaderRow(rows)
    expect(header).not.toBeNull()
    expect(header!.rowIndex).toBe(0)

    const { mapping } = smartAutoMap(header!.headers)
    expect(mapping.title).toBe('Title')
    // L×I should map to inherentCombined
    expect(mapping.inherentCombined || mapping.residualCombined).toBeTruthy()

    const data = extractDataRows(rows, 0)
    expect(data).toHaveLength(1)
  })
})
