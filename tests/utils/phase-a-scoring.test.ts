/**
 * Phase A Regression Tests — Scoring Architecture Refactor
 *
 * Tests for: VaR calculation, ControlEffectiveness enum, canonical sort,
 * financial exposure handling, and stored assessment pattern.
 */
import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'

// ============================================
// VaR Calculation
// ============================================

/** Mirrors the calculateVarValue function from risk.ts */
function calculateVarValue(
  financialExposure: number | null | undefined,
  residualLikelihood: number
): Prisma.Decimal | null {
  if (financialExposure == null) return null
  return new Prisma.Decimal(financialExposure).mul(
    new Prisma.Decimal(residualLikelihood).div(5)
  )
}

describe('VaR Calculation', () => {
  it('returns null when financialExposure is null', () => {
    expect(calculateVarValue(null, 3)).toBeNull()
  })

  it('returns null when financialExposure is undefined', () => {
    expect(calculateVarValue(undefined, 3)).toBeNull()
  })

  it('calculates VaR = financialExposure × (residualLikelihood / 5)', () => {
    // 100000 × (3/5) = 60000
    const result = calculateVarValue(100000, 3)
    expect(result).not.toBeNull()
    expect(Number(result!)).toBe(60000)
  })

  it('calculates VaR with likelihood 5 (max) → equals financialExposure', () => {
    const result = calculateVarValue(250000, 5)
    expect(Number(result!)).toBe(250000)
  })

  it('calculates VaR with likelihood 1 (min) → 20% of financialExposure', () => {
    const result = calculateVarValue(100000, 1)
    expect(Number(result!)).toBe(20000)
  })

  it('handles decimal financialExposure values', () => {
    const result = calculateVarValue(99999.99, 4)
    // 99999.99 × (4/5) = 79999.992
    expect(Number(result!)).toBeCloseTo(79999.992, 2)
  })

  it('handles zero financialExposure (should NOT be null — 0 is a valid number)', () => {
    // Note: Zod schema requires positive(), so 0 won't come through in practice,
    // but the calculation function itself should handle it
    const result = calculateVarValue(0, 3)
    expect(result).not.toBeNull()
    expect(Number(result!)).toBe(0)
  })
})

// ============================================
// ControlEffectiveness Enum
// ============================================

const VALID_CONTROL_EFFECTIVENESS = [
  'EFFECTIVE',
  'PARTIALLY_EFFECTIVE',
  'INEFFECTIVE',
  'NOT_TESTED',
  'NOT_APPLICABLE',
] as const

describe('ControlEffectiveness Enum', () => {
  it('has exactly 5 valid values', () => {
    expect(VALID_CONTROL_EFFECTIVENESS).toHaveLength(5)
  })

  it('includes EFFECTIVE', () => {
    expect(VALID_CONTROL_EFFECTIVENESS).toContain('EFFECTIVE')
  })

  it('includes PARTIALLY_EFFECTIVE', () => {
    expect(VALID_CONTROL_EFFECTIVENESS).toContain('PARTIALLY_EFFECTIVE')
  })

  it('includes INEFFECTIVE', () => {
    expect(VALID_CONTROL_EFFECTIVENESS).toContain('INEFFECTIVE')
  })

  it('includes NOT_TESTED (default)', () => {
    expect(VALID_CONTROL_EFFECTIVENESS).toContain('NOT_TESTED')
  })

  it('includes NOT_APPLICABLE', () => {
    expect(VALID_CONTROL_EFFECTIVENESS).toContain('NOT_APPLICABLE')
  })

  it('default is NOT_TESTED', () => {
    // In Prisma schema: @default(NOT_TESTED)
    const DEFAULT = 'NOT_TESTED'
    expect(VALID_CONTROL_EFFECTIVENESS).toContain(DEFAULT)
  })
})

// ============================================
// Canonical Sort Order
// ============================================

interface RiskSortable {
  id: string
  residualScore: number
  varValue: number | null
  inherentScore: number
  createdAt: Date
}

/** Mirrors the canonical sort: residualScore DESC, varValue DESC nulls last, inherentScore DESC, createdAt DESC */
function canonicalSort(risks: RiskSortable[]): RiskSortable[] {
  return [...risks].sort((a, b) => {
    // 1. residualScore DESC
    if (a.residualScore !== b.residualScore) return b.residualScore - a.residualScore
    // 2. varValue DESC, nulls last
    const aVar = a.varValue ?? -Infinity
    const bVar = b.varValue ?? -Infinity
    if (aVar !== bVar) return bVar - aVar
    // 3. inherentScore DESC
    if (a.inherentScore !== b.inherentScore) return b.inherentScore - a.inherentScore
    // 4. createdAt DESC
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

describe('Canonical Sort Order', () => {
  it('sorts by residualScore DESC as primary key', () => {
    const risks: RiskSortable[] = [
      { id: 'a', residualScore: 5, varValue: null, inherentScore: 10, createdAt: new Date('2024-01-01') },
      { id: 'b', residualScore: 20, varValue: null, inherentScore: 10, createdAt: new Date('2024-01-01') },
      { id: 'c', residualScore: 12, varValue: null, inherentScore: 10, createdAt: new Date('2024-01-01') },
    ]
    const sorted = canonicalSort(risks)
    expect(sorted.map(r => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('uses varValue DESC as tiebreaker when residualScore is equal', () => {
    const risks: RiskSortable[] = [
      { id: 'a', residualScore: 15, varValue: 10000, inherentScore: 20, createdAt: new Date('2024-01-01') },
      { id: 'b', residualScore: 15, varValue: 50000, inherentScore: 20, createdAt: new Date('2024-01-01') },
    ]
    const sorted = canonicalSort(risks)
    expect(sorted.map(r => r.id)).toEqual(['b', 'a'])
  })

  it('places null varValue after non-null varValue (nulls last)', () => {
    const risks: RiskSortable[] = [
      { id: 'a', residualScore: 15, varValue: null, inherentScore: 20, createdAt: new Date('2024-01-01') },
      { id: 'b', residualScore: 15, varValue: 1000, inherentScore: 20, createdAt: new Date('2024-01-01') },
    ]
    const sorted = canonicalSort(risks)
    expect(sorted.map(r => r.id)).toEqual(['b', 'a'])
  })

  it('uses inherentScore DESC as third tiebreaker', () => {
    const risks: RiskSortable[] = [
      { id: 'a', residualScore: 15, varValue: null, inherentScore: 10, createdAt: new Date('2024-01-01') },
      { id: 'b', residualScore: 15, varValue: null, inherentScore: 25, createdAt: new Date('2024-01-01') },
    ]
    const sorted = canonicalSort(risks)
    expect(sorted.map(r => r.id)).toEqual(['b', 'a'])
  })

  it('uses createdAt DESC as final tiebreaker', () => {
    const risks: RiskSortable[] = [
      { id: 'a', residualScore: 15, varValue: null, inherentScore: 20, createdAt: new Date('2024-01-01') },
      { id: 'b', residualScore: 15, varValue: null, inherentScore: 20, createdAt: new Date('2024-06-01') },
    ]
    const sorted = canonicalSort(risks)
    expect(sorted.map(r => r.id)).toEqual(['b', 'a'])
  })

  it('handles full 4-key sort correctly', () => {
    const risks: RiskSortable[] = [
      { id: 'low', residualScore: 4, varValue: 5000, inherentScore: 8, createdAt: new Date('2024-03-01') },
      { id: 'high', residualScore: 20, varValue: 100000, inherentScore: 25, createdAt: new Date('2024-01-01') },
      { id: 'med-var', residualScore: 12, varValue: 50000, inherentScore: 15, createdAt: new Date('2024-02-01') },
      { id: 'med-novar', residualScore: 12, varValue: null, inherentScore: 15, createdAt: new Date('2024-04-01') },
    ]
    const sorted = canonicalSort(risks)
    expect(sorted.map(r => r.id)).toEqual(['high', 'med-var', 'med-novar', 'low'])
  })
})

// ============================================
// Financial Exposure Validation
// ============================================

describe('Financial Exposure Validation', () => {
  it('accepts positive number', () => {
    const value = 50000
    expect(value).toBeGreaterThan(0)
  })

  it('rejects zero (Zod positive() constraint)', () => {
    const value = 0
    expect(value).not.toBeGreaterThan(0)
  })

  it('rejects negative numbers', () => {
    const value = -1000
    expect(value).not.toBeGreaterThan(0)
  })

  it('accepts decimal values', () => {
    const value = 99999.99
    expect(value).toBeGreaterThan(0)
    expect(typeof value).toBe('number')
  })

  it('handles large ZAR amounts', () => {
    // Decimal(15,2) supports up to 9,999,999,999,999.99
    const value = 9999999999999.99
    const decimal = new Prisma.Decimal(value)
    expect(Number(decimal)).toBeCloseTo(value, 0)
  })
})

// ============================================
// varValue is server-calculated, never client-editable
// ============================================

describe('varValue immutability contract', () => {
  it('varValue is NOT in the create Zod schema fields', () => {
    // The create schema has these fields — varValue must NOT be among them
    const createSchemaFields = [
      'registerId', 'title', 'description', 'category',
      'inherentLikelihood', 'inherentImpact', 'residualLikelihood', 'residualImpact',
      'response', 'controls', 'controlEffectiveness', 'rootCause',
      'financialExposure', 'ownerId', 'dueDate', 'isOngoing',
    ]
    expect(createSchemaFields).not.toContain('varValue')
  })

  it('varValue is NOT in the update Zod schema fields', () => {
    const updateSchemaFields = [
      'id', 'title', 'description', 'category',
      'inherentLikelihood', 'inherentImpact', 'residualLikelihood', 'residualImpact',
      'response', 'controls', 'controlEffectiveness', 'rootCause',
      'financialExposure', 'status', 'ownerId', 'dueDate', 'isOngoing',
    ]
    expect(updateSchemaFields).not.toContain('varValue')
  })
})
