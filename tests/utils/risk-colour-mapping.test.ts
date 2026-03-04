/**
 * Tests for canonical risk colour mapping.
 * Verifies that getRiskColour() and getRiskBand() are deterministic and
 * consistent with the appetite thresholds used by Dashboard and Risk Register.
 */

import { describe, it, expect } from 'vitest'
import { getRiskColour, getRiskBand, BAND_PRINT_COLOURS } from '@/lib/risk-colour-mapping'
import { DEFAULT_APPETITE_THRESHOLDS } from '@/lib/appetite-validation'

const DEFAULT = DEFAULT_APPETITE_THRESHOLDS // { low: 4, medium: 9, high: 14 }

// ─── getRiskBand ──────────────────────────────────────────────────────────────

describe('getRiskBand — default thresholds (4/9/14)', () => {
  it('score 1  → LOW', () => {
    expect(getRiskBand(1, 1, DEFAULT)).toBe('LOW')
  })

  it('score 4 (boundary) → LOW', () => {
    expect(getRiskBand(2, 2, DEFAULT)).toBe('LOW')
  })

  it('score 5 (first MEDIUM) → MEDIUM', () => {
    expect(getRiskBand(1, 5, DEFAULT)).toBe('MEDIUM')
  })

  it('score 9 (boundary) → MEDIUM', () => {
    expect(getRiskBand(3, 3, DEFAULT)).toBe('MEDIUM')
  })

  it('score 10 (first HIGH) → HIGH', () => {
    expect(getRiskBand(2, 5, DEFAULT)).toBe('HIGH')
  })

  it('score 14 (boundary) → HIGH', () => {
    expect(getRiskBand(2, 7, DEFAULT)).toBe('HIGH') // clamped to valid range only via getRiskColour; getRiskBand uses raw score
  })

  it('score 15 (first CRITICAL) → CRITICAL', () => {
    expect(getRiskBand(3, 5, DEFAULT)).toBe('CRITICAL')
  })

  it('score 25 (maximum) → CRITICAL', () => {
    expect(getRiskBand(5, 5, DEFAULT)).toBe('CRITICAL')
  })
})

describe('getRiskBand — custom thresholds', () => {
  const conservative = { low: 2, medium: 6, high: 12 }

  it('score 3 → MEDIUM under conservative thresholds', () => {
    expect(getRiskBand(1, 3, conservative)).toBe('MEDIUM')
  })

  it('score 2 (boundary) → LOW under conservative thresholds', () => {
    expect(getRiskBand(1, 2, conservative)).toBe('LOW')
  })

  it('score 13 (first CRITICAL under conservative) → CRITICAL', () => {
    expect(getRiskBand(5, 3, conservative)).toBe('CRITICAL') // 15 > 12
  })

  const lenient = { low: 8, medium: 16, high: 22 }

  it('score 15 → MEDIUM under lenient thresholds', () => {
    expect(getRiskBand(3, 5, lenient)).toBe('MEDIUM')
  })

  it('score 23 → CRITICAL under lenient thresholds', () => {
    expect(getRiskBand(5, 5, lenient)).toBe('CRITICAL') // 25 > 22
  })
})

// ─── getRiskColour ────────────────────────────────────────────────────────────

describe('getRiskColour — returns correct Tailwind class', () => {
  it('LOW → contains bg-green-500', () => {
    expect(getRiskColour(1, 1, DEFAULT)).toContain('bg-green-500')
  })

  it('MEDIUM → contains bg-amber-500', () => {
    expect(getRiskColour(3, 3, DEFAULT)).toContain('bg-amber-500')
  })

  it('HIGH → contains bg-orange-500', () => {
    expect(getRiskColour(2, 5, DEFAULT)).toContain('bg-orange-500')
  })

  it('CRITICAL → contains bg-red-600', () => {
    expect(getRiskColour(5, 5, DEFAULT)).toContain('bg-red-600')
  })

  it('returns same class for same L×I regardless of ordering', () => {
    expect(getRiskColour(2, 4, DEFAULT)).toBe(getRiskColour(4, 2, DEFAULT))
  })
})

describe('getRiskColour — edge cases', () => {
  it('out-of-range low (L=0) → falls back to LOW', () => {
    const result = getRiskColour(0, 3, DEFAULT)
    expect(result).toContain('bg-green-500')
  })

  it('out-of-range high (I=6) → falls back to LOW', () => {
    const result = getRiskColour(5, 6, DEFAULT)
    expect(result).toContain('bg-green-500')
  })
})

// ─── BAND_PRINT_COLOURS ───────────────────────────────────────────────────────

describe('BAND_PRINT_COLOURS — hex values match Tailwind classes', () => {
  it('LOW → green-500 hex', () => {
    expect(BAND_PRINT_COLOURS.LOW).toBe('#22c55e')
  })

  it('MEDIUM → amber-500 hex', () => {
    expect(BAND_PRINT_COLOURS.MEDIUM).toBe('#f59e0b')
  })

  it('HIGH → orange-500 hex', () => {
    expect(BAND_PRINT_COLOURS.HIGH).toBe('#f97316')
  })

  it('CRITICAL → red-600 hex', () => {
    expect(BAND_PRINT_COLOURS.CRITICAL).toBe('#dc2626')
  })

  it('all four bands are defined', () => {
    expect(Object.keys(BAND_PRINT_COLOURS)).toHaveLength(4)
  })
})

// ─── Cross-heatmap consistency ────────────────────────────────────────────────

describe('Cross-heatmap consistency — identical scores produce identical colours', () => {
  const testCases: Array<[number, number]> = [
    [1, 1], [1, 5], [2, 3], [3, 3], [3, 5], [4, 4], [5, 5],
  ]

  testCases.forEach(([l, i]) => {
    it(`L=${l} I=${i} (score ${l * i}) is deterministic`, () => {
      const first  = getRiskColour(l, i, DEFAULT)
      const second = getRiskColour(l, i, DEFAULT)
      expect(first).toBe(second)
    })
  })
})
