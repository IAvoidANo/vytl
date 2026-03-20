/**
 * tests/excel-import/duplicate-detection.test.ts — INC-007
 * Pure-function tests — no DB, no DOM.
 */
import { describe, it, expect } from 'vitest'
import {
  checkDuplicate,
  checkDuplicates,
  type ExistingRisk,
  type DuplicateCheckInput,
} from '../../src/lib/excel-import/duplicate-detection'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const existingRisks: ExistingRisk[] = [
  { id: '1', refCode: 'RSK-001', title: 'Load shedding impact on operations', category: 'OPERATIONAL' },
  { id: '2', refCode: 'RSK-002', title: 'POPIA compliance breach', category: 'COMPLIANCE' },
  { id: '3', refCode: 'RSK-003', title: 'Cybersecurity incident', category: 'TECHNOLOGY' },
  { id: '4', refCode: 'RSK-004', title: 'Key person dependency', category: 'PEOPLE' },
]

// ─── checkDuplicate — exact matches ──────────────────────────────────────────

describe('checkDuplicate — exact matches', () => {
  it('detects exact title + category match', () => {
    const result = checkDuplicate(
      { title: 'Load shedding impact on operations', category: 'OPERATIONAL' },
      existingRisks,
    )
    expect(result.matchType).toBe('exact')
    expect(result.confidence).toBe(1.0)
    expect(result.matchedRisk?.refCode).toBe('RSK-001')
    expect(result.warning).toMatch(/RSK-001/)
  })

  it('exact match is case-insensitive', () => {
    const result = checkDuplicate(
      { title: 'LOAD SHEDDING IMPACT ON OPERATIONS', category: 'OPERATIONAL' },
      existingRisks,
    )
    expect(result.matchType).toBe('exact')
  })

  it('exact match trims whitespace', () => {
    const result = checkDuplicate(
      { title: '  POPIA compliance breach  ', category: 'COMPLIANCE' },
      existingRisks,
    )
    expect(result.matchType).toBe('exact')
    expect(result.matchedRisk?.refCode).toBe('RSK-002')
  })

  it('no match when category differs despite exact title', () => {
    const result = checkDuplicate(
      { title: 'POPIA compliance breach', category: 'TECHNOLOGY' },
      existingRisks,
    )
    expect(result.matchType).toBe('none')
  })
})

// ─── checkDuplicate — fuzzy matches ──────────────────────────────────────────

describe('checkDuplicate — fuzzy matches', () => {
  it('fuzzy-matches title with minor typo (1 char edit)', () => {
    const result = checkDuplicate(
      { title: 'Cybersecurity incidnt', category: 'TECHNOLOGY' },  // missing 'e'
      existingRisks,
    )
    expect(result.matchType).toBe('fuzzy-title')
    expect(result.confidence).toBeGreaterThan(0.9)
    expect(result.matchedRisk?.refCode).toBe('RSK-003')
  })

  it('fuzzy-matches with 3 char edits', () => {
    const result = checkDuplicate(
      { title: 'Key persn dependncy', category: 'PEOPLE' },  // 3 edits: missing 'o', missing 'e'
      existingRisks,
    )
    expect(result.matchType).toBe('fuzzy-title')
    expect(result.matchedRisk?.refCode).toBe('RSK-004')
  })

  it('no fuzzy match when category differs', () => {
    const result = checkDuplicate(
      { title: 'Cybersecurity incidnt', category: 'COMPLIANCE' },
      existingRisks,
    )
    expect(result.matchType).toBe('none')
  })

  it('no match when edit distance exceeds threshold', () => {
    const result = checkDuplicate(
      { title: 'Something completely different here', category: 'OPERATIONAL' },
      existingRisks,
    )
    expect(result.matchType).toBe('none')
  })
})

// ─── checkDuplicate — edge cases ─────────────────────────────────────────────

describe('checkDuplicate — edge cases', () => {
  it('returns none when existing risks list is empty', () => {
    const result = checkDuplicate(
      { title: 'Load shedding impact on operations', category: 'OPERATIONAL' },
      [],
    )
    expect(result.matchType).toBe('none')
    expect(result.confidence).toBe(0)
  })

  it('returns none for new unique risk', () => {
    const result = checkDuplicate(
      { title: 'Brand new risk not in register', category: 'FINANCIAL' },
      existingRisks,
    )
    expect(result.matchType).toBe('none')
  })
})

// ─── checkDuplicates — batch ──────────────────────────────────────────────────

describe('checkDuplicates — batch', () => {
  it('returns results in same order as input', () => {
    const incoming: DuplicateCheckInput[] = [
      { title: 'Load shedding impact on operations', category: 'OPERATIONAL' },
      { title: 'Brand new risk', category: 'FINANCIAL' },
      { title: 'POPIA compliance breach', category: 'COMPLIANCE' },
    ]
    const results = checkDuplicates(incoming, existingRisks)
    expect(results).toHaveLength(3)
    expect(results[0].matchType).toBe('exact')
    expect(results[1].matchType).toBe('none')
    expect(results[2].matchType).toBe('exact')
  })

  it('returns empty array for empty input', () => {
    expect(checkDuplicates([], existingRisks)).toHaveLength(0)
  })

  it('returns none-matches when existing is empty', () => {
    const results = checkDuplicates(
      [{ title: 'Any risk', category: 'OPERATIONAL' }],
      [],
    )
    expect(results[0].matchType).toBe('none')
  })

  it('handles large batch efficiently', () => {
    const batch: DuplicateCheckInput[] = Array.from({ length: 100 }, (_, i) => ({
      title: `Risk number ${i}`,
      category: 'OPERATIONAL',
    }))
    const results = checkDuplicates(batch, existingRisks)
    expect(results).toHaveLength(100)
    // None should be exact matches (all titles are unique)
    expect(results.every(r => r.matchType === 'none')).toBe(true)
  })
})
