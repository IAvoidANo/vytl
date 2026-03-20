/**
 * tests/excel-import/score-validation.test.ts — INC-006
 * Pure-function tests — no DB, no DOM.
 */
import { describe, it, expect } from 'vitest'
import {
  validateScore,
  validateResidualNotExceedsInherent,
  validateCombinedScore,
} from '../../src/lib/excel-import/score-validation'

// ─── validateScore ────────────────────────────────────────────────────────────

describe('validateScore — in range', () => {
  it('accepts minimum value 1', () => {
    const r = validateScore(1, 'Likelihood')
    expect(r.value).toBe(1)
    expect(r.wasAdjusted).toBe(false)
    expect(r.wasMissing).toBe(false)
  })

  it('accepts maximum value 5', () => {
    const r = validateScore(5, 'Likelihood')
    expect(r.value).toBe(5)
    expect(r.wasAdjusted).toBe(false)
  })

  it('accepts mid-range value 3', () => {
    expect(validateScore(3, 'L').value).toBe(3)
  })

  it('accepts string "4" as numeric', () => {
    const r = validateScore('4', 'Impact')
    expect(r.value).toBe(4)
    expect(r.wasAdjusted).toBe(false)
  })
})

describe('validateScore — missing / blank', () => {
  it('returns default 3 for null', () => {
    const r = validateScore(null, 'Likelihood')
    expect(r.value).toBe(3)
    expect(r.wasMissing).toBe(true)
    expect(r.wasAdjusted).toBe(false)
    expect(r.warning).toBeUndefined()
  })

  it('returns default 3 for undefined', () => {
    expect(validateScore(undefined, 'L').wasMissing).toBe(true)
  })

  it('returns default 3 for empty string', () => {
    expect(validateScore('', 'L').wasMissing).toBe(true)
  })

  it('returns custom default value', () => {
    const r = validateScore(null, 'Residual Likelihood', 2)
    expect(r.value).toBe(2)
    expect(r.wasMissing).toBe(true)
  })
})

describe('validateScore — out of range', () => {
  it('clamps value 0 to 1', () => {
    const r = validateScore(0, 'Likelihood')
    expect(r.value).toBe(1)
    expect(r.wasAdjusted).toBe(true)
    expect(r.warning).toMatch(/out of range/)
  })

  it('clamps value 6 to 5', () => {
    const r = validateScore(6, 'Impact')
    expect(r.value).toBe(5)
    expect(r.wasAdjusted).toBe(true)
  })

  it('clamps value 99 to 5', () => {
    expect(validateScore(99, 'L').value).toBe(5)
  })

  it('clamps negative value to 1', () => {
    expect(validateScore(-3, 'L').value).toBe(1)
  })
})

describe('validateScore — float rounding', () => {
  it('rounds 3.7 to 4', () => {
    const r = validateScore(3.7, 'L')
    expect(r.value).toBe(4)
    expect(r.wasAdjusted).toBe(true)
    expect(r.warning).toMatch(/rounded/)
  })

  it('rounds 1.2 to 1 without adjustment warning if already in range', () => {
    const r = validateScore(1.2, 'L')
    expect(r.value).toBe(1)
  })

  it('rounds 5.4 to 5 — in range after rounding', () => {
    expect(validateScore(5.4, 'L').value).toBe(5)
  })
})

describe('validateScore — non-numeric', () => {
  it('returns default for alphabetic string', () => {
    const r = validateScore('high', 'Likelihood')
    expect(r.value).toBe(3)
    expect(r.wasAdjusted).toBe(true)
    expect(r.warning).toMatch(/not a number/)
  })

  it('returns default for mixed string', () => {
    expect(validateScore('4a', 'L').wasAdjusted).toBe(true)
  })
})

// ─── validateResidualNotExceedsInherent ───────────────────────────────────────

describe('validateResidualNotExceedsInherent', () => {
  it('valid: residual equals inherent', () => {
    const r = validateResidualNotExceedsInherent(3, 3, 3, 3)
    expect(r.valid).toBe(true)
    expect(r.warnings).toHaveLength(0)
  })

  it('valid: residual less than inherent', () => {
    const r = validateResidualNotExceedsInherent(2, 4, 2, 3)
    expect(r.valid).toBe(true)
  })

  it('invalid: residual likelihood exceeds inherent', () => {
    const r = validateResidualNotExceedsInherent(4, 3, 2, 3)
    expect(r.valid).toBe(false)
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0]).toMatch(/Likelihood/)
  })

  it('invalid: residual impact exceeds inherent', () => {
    const r = validateResidualNotExceedsInherent(2, 3, 4, 3)
    expect(r.valid).toBe(false)
    expect(r.warnings[0]).toMatch(/Impact/)
  })

  it('invalid: both exceed inherent', () => {
    const r = validateResidualNotExceedsInherent(5, 3, 5, 3)
    expect(r.valid).toBe(false)
    expect(r.warnings).toHaveLength(2)
  })
})

// ─── validateCombinedScore ────────────────────────────────────────────────────

describe('validateCombinedScore', () => {
  it('returns null for empty input', () => {
    expect(validateCombinedScore(null, 'Inherent')).toBeNull()
    expect(validateCombinedScore('', 'Inherent')).toBeNull()
  })

  it('returns null for non-combined string', () => {
    expect(validateCombinedScore('3', 'Inherent')).toBeNull()
  })

  it('parses valid "3x4"', () => {
    const r = validateCombinedScore('3x4', 'Inherent')
    expect(r).not.toBeNull()
    expect(r!.likelihood.value).toBe(3)
    expect(r!.impact.value).toBe(4)
    expect(r!.likelihood.wasAdjusted).toBe(false)
    expect(r!.impact.wasAdjusted).toBe(false)
  })

  it('clamps out-of-range component "7x2"', () => {
    const r = validateCombinedScore('7x2', 'Inherent')
    expect(r).not.toBeNull()
    expect(r!.likelihood.value).toBe(5)
    expect(r!.likelihood.wasAdjusted).toBe(true)
    expect(r!.impact.value).toBe(2)
  })

  it('parses comma-separated "3,4"', () => {
    const r = validateCombinedScore('3,4', 'Inherent')
    expect(r!.likelihood.value).toBe(3)
    expect(r!.impact.value).toBe(4)
  })
})
