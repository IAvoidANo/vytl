import { describe, it, expect } from 'vitest'

/**
 * Risk Scoring Calculation Helpers
 *
 * Score = Likelihood × Impact (both 1-5 scale)
 * Result range: 1-25
 */

// Calculate risk score from likelihood and impact
function calculateRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact
}

// Validate likelihood/impact values (must be 1-5 integers)
function isValidScoreInput(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5
}

// Calculate score with validation
function calculateValidatedScore(likelihood: number, impact: number): number | null {
  if (!isValidScoreInput(likelihood) || !isValidScoreInput(impact)) {
    return null
  }
  return calculateRiskScore(likelihood, impact)
}

/**
 * Tolerance Status Determination
 *
 * - WITHIN: residual ≤ tolerance
 * - APPROACHING: residual > (tolerance × 0.8) AND residual ≤ tolerance
 * - EXCEEDED: residual > tolerance
 */
type ToleranceStatus = 'WITHIN' | 'APPROACHING' | 'EXCEEDED'

function getToleranceStatus(residualScore: number, tolerance: number): ToleranceStatus {
  if (residualScore > tolerance) {
    return 'EXCEEDED'
  }
  if (residualScore > tolerance * 0.8) {
    return 'APPROACHING'
  }
  return 'WITHIN'
}

// Get risk severity label based on score
function getRiskSeverity(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score <= 4) return 'LOW'
  if (score <= 9) return 'MEDIUM'
  if (score <= 15) return 'HIGH'
  return 'CRITICAL'
}

// Calculate risk reduction percentage
function calculateRiskReduction(inherentScore: number, residualScore: number): number {
  if (inherentScore === 0) return 0
  return Math.round(((inherentScore - residualScore) / inherentScore) * 100)
}

// ============================================
// TESTS
// ============================================

describe('Risk Scoring Calculations', () => {
  // ----------------------------------------
  // Basic Score Calculation Tests
  // ----------------------------------------
  describe('calculateRiskScore', () => {
    it('should calculate 1 × 1 = 1', () => {
      expect(calculateRiskScore(1, 1)).toBe(1)
    })

    it('should calculate 5 × 5 = 25', () => {
      expect(calculateRiskScore(5, 5)).toBe(25)
    })

    it('should calculate 3 × 3 = 9', () => {
      expect(calculateRiskScore(3, 3)).toBe(9)
    })

    it('should calculate 1 × 5 = 5', () => {
      expect(calculateRiskScore(1, 5)).toBe(5)
    })

    it('should calculate 5 × 1 = 5', () => {
      expect(calculateRiskScore(5, 1)).toBe(5)
    })

    it('should calculate 2 × 4 = 8', () => {
      expect(calculateRiskScore(2, 4)).toBe(8)
    })

    it('should calculate 4 × 2 = 8 (commutative)', () => {
      expect(calculateRiskScore(4, 2)).toBe(8)
    })

    it('should calculate 3 × 5 = 15', () => {
      expect(calculateRiskScore(3, 5)).toBe(15)
    })

    it('should calculate 4 × 4 = 16', () => {
      expect(calculateRiskScore(4, 4)).toBe(16)
    })

    it('should calculate 2 × 3 = 6', () => {
      expect(calculateRiskScore(2, 3)).toBe(6)
    })
  })

  // ----------------------------------------
  // All 25 Combinations (Comprehensive)
  // ----------------------------------------
  describe('All Score Combinations (5×5 Matrix)', () => {
    const combinations = [
      // Likelihood 1
      { l: 1, i: 1, expected: 1 },
      { l: 1, i: 2, expected: 2 },
      { l: 1, i: 3, expected: 3 },
      { l: 1, i: 4, expected: 4 },
      { l: 1, i: 5, expected: 5 },
      // Likelihood 2
      { l: 2, i: 1, expected: 2 },
      { l: 2, i: 2, expected: 4 },
      { l: 2, i: 3, expected: 6 },
      { l: 2, i: 4, expected: 8 },
      { l: 2, i: 5, expected: 10 },
      // Likelihood 3
      { l: 3, i: 1, expected: 3 },
      { l: 3, i: 2, expected: 6 },
      { l: 3, i: 3, expected: 9 },
      { l: 3, i: 4, expected: 12 },
      { l: 3, i: 5, expected: 15 },
      // Likelihood 4
      { l: 4, i: 1, expected: 4 },
      { l: 4, i: 2, expected: 8 },
      { l: 4, i: 3, expected: 12 },
      { l: 4, i: 4, expected: 16 },
      { l: 4, i: 5, expected: 20 },
      // Likelihood 5
      { l: 5, i: 1, expected: 5 },
      { l: 5, i: 2, expected: 10 },
      { l: 5, i: 3, expected: 15 },
      { l: 5, i: 4, expected: 20 },
      { l: 5, i: 5, expected: 25 },
    ]

    combinations.forEach(({ l, i, expected }) => {
      it(`should calculate L${l} × I${i} = ${expected}`, () => {
        expect(calculateRiskScore(l, i)).toBe(expected)
      })
    })
  })

  // ----------------------------------------
  // Input Validation Tests
  // ----------------------------------------
  describe('isValidScoreInput', () => {
    it('should accept 1 as valid', () => {
      expect(isValidScoreInput(1)).toBe(true)
    })

    it('should accept 5 as valid', () => {
      expect(isValidScoreInput(5)).toBe(true)
    })

    it('should accept 3 as valid', () => {
      expect(isValidScoreInput(3)).toBe(true)
    })

    it('should reject 0 as invalid', () => {
      expect(isValidScoreInput(0)).toBe(false)
    })

    it('should reject 6 as invalid', () => {
      expect(isValidScoreInput(6)).toBe(false)
    })

    it('should reject -1 as invalid', () => {
      expect(isValidScoreInput(-1)).toBe(false)
    })

    it('should reject 2.5 as invalid (non-integer)', () => {
      expect(isValidScoreInput(2.5)).toBe(false)
    })

    it('should reject 1.1 as invalid (non-integer)', () => {
      expect(isValidScoreInput(1.1)).toBe(false)
    })
  })

  describe('calculateValidatedScore', () => {
    it('should return score for valid inputs', () => {
      expect(calculateValidatedScore(3, 4)).toBe(12)
    })

    it('should return null for likelihood = 0', () => {
      expect(calculateValidatedScore(0, 3)).toBeNull()
    })

    it('should return null for impact = 6', () => {
      expect(calculateValidatedScore(3, 6)).toBeNull()
    })

    it('should return null for decimal likelihood', () => {
      expect(calculateValidatedScore(2.5, 3)).toBeNull()
    })

    it('should return null for negative values', () => {
      expect(calculateValidatedScore(-1, 3)).toBeNull()
    })
  })

  // ----------------------------------------
  // Tolerance Status Tests
  // ----------------------------------------
  describe('getToleranceStatus', () => {
    describe('with tolerance = 10', () => {
      const tolerance = 10

      it('should return WITHIN for residual = 5', () => {
        expect(getToleranceStatus(5, tolerance)).toBe('WITHIN')
      })

      it('should return WITHIN for residual = 8 (exactly 80%)', () => {
        expect(getToleranceStatus(8, tolerance)).toBe('WITHIN')
      })

      it('should return APPROACHING for residual = 9 (above 80%)', () => {
        expect(getToleranceStatus(9, tolerance)).toBe('APPROACHING')
      })

      it('should return APPROACHING for residual = 10 (at tolerance)', () => {
        expect(getToleranceStatus(10, tolerance)).toBe('APPROACHING')
      })

      it('should return EXCEEDED for residual = 11', () => {
        expect(getToleranceStatus(11, tolerance)).toBe('EXCEEDED')
      })

      it('should return EXCEEDED for residual = 25', () => {
        expect(getToleranceStatus(25, tolerance)).toBe('EXCEEDED')
      })
    })

    describe('with tolerance = 15', () => {
      const tolerance = 15

      it('should return WITHIN for residual = 10', () => {
        expect(getToleranceStatus(10, tolerance)).toBe('WITHIN')
      })

      it('should return WITHIN for residual = 12 (exactly 80%)', () => {
        expect(getToleranceStatus(12, tolerance)).toBe('WITHIN')
      })

      it('should return APPROACHING for residual = 13 (above 80%)', () => {
        expect(getToleranceStatus(13, tolerance)).toBe('APPROACHING')
      })

      it('should return APPROACHING for residual = 15 (at tolerance)', () => {
        expect(getToleranceStatus(15, tolerance)).toBe('APPROACHING')
      })

      it('should return EXCEEDED for residual = 16', () => {
        expect(getToleranceStatus(16, tolerance)).toBe('EXCEEDED')
      })
    })

    describe('with tolerance = 5', () => {
      const tolerance = 5

      it('should return WITHIN for residual = 3', () => {
        expect(getToleranceStatus(3, tolerance)).toBe('WITHIN')
      })

      it('should return WITHIN for residual = 4 (exactly 80%)', () => {
        expect(getToleranceStatus(4, tolerance)).toBe('WITHIN')
      })

      it('should return APPROACHING for residual = 5 (at tolerance, above 80%)', () => {
        expect(getToleranceStatus(5, tolerance)).toBe('APPROACHING')
      })

      it('should return EXCEEDED for residual = 6', () => {
        expect(getToleranceStatus(6, tolerance)).toBe('EXCEEDED')
      })
    })

    describe('edge cases', () => {
      it('should handle tolerance = 1', () => {
        expect(getToleranceStatus(1, 1)).toBe('APPROACHING') // 1 > 0.8
        expect(getToleranceStatus(2, 1)).toBe('EXCEEDED')
      })

      it('should handle residual = 0', () => {
        expect(getToleranceStatus(0, 10)).toBe('WITHIN')
      })

      it('should handle large tolerance = 25', () => {
        expect(getToleranceStatus(20, 25)).toBe('WITHIN') // 20 ≤ 20 (80%)
        expect(getToleranceStatus(21, 25)).toBe('APPROACHING')
        expect(getToleranceStatus(25, 25)).toBe('APPROACHING')
        expect(getToleranceStatus(26, 25)).toBe('EXCEEDED')
      })
    })
  })

  // ----------------------------------------
  // Risk Severity Tests
  // ----------------------------------------
  describe('getRiskSeverity', () => {
    it('should return LOW for score 1', () => {
      expect(getRiskSeverity(1)).toBe('LOW')
    })

    it('should return LOW for score 4', () => {
      expect(getRiskSeverity(4)).toBe('LOW')
    })

    it('should return MEDIUM for score 5', () => {
      expect(getRiskSeverity(5)).toBe('MEDIUM')
    })

    it('should return MEDIUM for score 9', () => {
      expect(getRiskSeverity(9)).toBe('MEDIUM')
    })

    it('should return HIGH for score 10', () => {
      expect(getRiskSeverity(10)).toBe('HIGH')
    })

    it('should return HIGH for score 15', () => {
      expect(getRiskSeverity(15)).toBe('HIGH')
    })

    it('should return CRITICAL for score 16', () => {
      expect(getRiskSeverity(16)).toBe('CRITICAL')
    })

    it('should return CRITICAL for score 25', () => {
      expect(getRiskSeverity(25)).toBe('CRITICAL')
    })
  })

  // ----------------------------------------
  // Risk Reduction Tests
  // ----------------------------------------
  describe('calculateRiskReduction', () => {
    it('should calculate 50% reduction (20 to 10)', () => {
      expect(calculateRiskReduction(20, 10)).toBe(50)
    })

    it('should calculate 0% reduction (same scores)', () => {
      expect(calculateRiskReduction(15, 15)).toBe(0)
    })

    it('should calculate 100% reduction (to 0)', () => {
      expect(calculateRiskReduction(25, 0)).toBe(100)
    })

    it('should calculate 60% reduction (25 to 10)', () => {
      expect(calculateRiskReduction(25, 10)).toBe(60)
    })

    it('should handle 0 inherent score', () => {
      expect(calculateRiskReduction(0, 0)).toBe(0)
    })

    it('should calculate 75% reduction (20 to 5)', () => {
      expect(calculateRiskReduction(20, 5)).toBe(75)
    })

    it('should round to nearest integer', () => {
      // 15 to 7 = 53.33% → 53%
      expect(calculateRiskReduction(15, 7)).toBe(53)
    })
  })

  // ----------------------------------------
  // Realistic Scenarios
  // ----------------------------------------
  describe('Realistic Scenarios', () => {
    it('should handle high inherent, low residual (well-controlled risk)', () => {
      const inherent = calculateRiskScore(5, 4) // 20
      const residual = calculateRiskScore(2, 2) // 4
      const reduction = calculateRiskReduction(inherent, residual)

      expect(inherent).toBe(20)
      expect(residual).toBe(4)
      expect(reduction).toBe(80)
      expect(getRiskSeverity(residual)).toBe('LOW')
    })

    it('should handle unchanged risk (no controls effective)', () => {
      const inherent = calculateRiskScore(4, 3) // 12
      const residual = calculateRiskScore(4, 3) // 12
      const reduction = calculateRiskReduction(inherent, residual)

      expect(inherent).toBe(12)
      expect(residual).toBe(12)
      expect(reduction).toBe(0)
    })

    it('should assess tolerance for compliance risk', () => {
      const residual = calculateRiskScore(3, 4) // 12
      const tolerance = 10

      expect(residual).toBe(12)
      expect(getToleranceStatus(residual, tolerance)).toBe('EXCEEDED')
    })

    it('should assess approaching tolerance for operational risk', () => {
      const residual = calculateRiskScore(2, 4) // 8
      const tolerance = 10 // 80% = 8

      expect(residual).toBe(8)
      expect(getToleranceStatus(residual, tolerance)).toBe('WITHIN')
    })

    it('should handle strategic risk with moderate control', () => {
      const inherent = calculateRiskScore(4, 5) // 20
      const residual = calculateRiskScore(3, 3) // 9
      const tolerance = 12

      expect(inherent).toBe(20)
      expect(residual).toBe(9)
      expect(calculateRiskReduction(inherent, residual)).toBe(55)
      expect(getToleranceStatus(residual, tolerance)).toBe('WITHIN')
      expect(getRiskSeverity(residual)).toBe('MEDIUM')
    })

    it('should handle critical uncontrolled risk', () => {
      const inherent = calculateRiskScore(5, 5) // 25
      const residual = calculateRiskScore(5, 4) // 20
      const tolerance = 15

      expect(inherent).toBe(25)
      expect(residual).toBe(20)
      expect(calculateRiskReduction(inherent, residual)).toBe(20)
      expect(getToleranceStatus(residual, tolerance)).toBe('EXCEEDED')
      expect(getRiskSeverity(residual)).toBe('CRITICAL')
    })
  })

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  describe('Edge Cases', () => {
    it('should handle minimum possible score (1)', () => {
      const score = calculateRiskScore(1, 1)
      expect(score).toBe(1)
      expect(getRiskSeverity(score)).toBe('LOW')
      expect(getToleranceStatus(score, 5)).toBe('WITHIN')
    })

    it('should handle maximum possible score (25)', () => {
      const score = calculateRiskScore(5, 5)
      expect(score).toBe(25)
      expect(getRiskSeverity(score)).toBe('CRITICAL')
      expect(getToleranceStatus(score, 20)).toBe('EXCEEDED')
    })

    it('should handle score exactly at severity boundary (4 to 5)', () => {
      expect(getRiskSeverity(4)).toBe('LOW')
      expect(getRiskSeverity(5)).toBe('MEDIUM')
    })

    it('should handle score exactly at severity boundary (9 to 10)', () => {
      expect(getRiskSeverity(9)).toBe('MEDIUM')
      expect(getRiskSeverity(10)).toBe('HIGH')
    })

    it('should handle score exactly at severity boundary (15 to 16)', () => {
      expect(getRiskSeverity(15)).toBe('HIGH')
      expect(getRiskSeverity(16)).toBe('CRITICAL')
    })

    it('should validate that L×I is commutative', () => {
      expect(calculateRiskScore(2, 5)).toBe(calculateRiskScore(5, 2))
      expect(calculateRiskScore(3, 4)).toBe(calculateRiskScore(4, 3))
    })
  })
})
