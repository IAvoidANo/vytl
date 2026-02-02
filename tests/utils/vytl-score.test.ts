import { describe, it, expect } from 'vitest'
import { getGrade } from '@/lib/vytl-score'

/**
 * Pure calculation helpers for testing
 * These mirror the logic in vytl-score.ts but are extracted for unit testing
 */

const ALL_CATEGORIES = [
  'STRATEGIC',
  'OPERATIONAL',
  'FINANCIAL',
  'COMPLIANCE',
  'TECHNOLOGY',
  'REPUTATIONAL',
  'ENVIRONMENTAL',
  'PEOPLE',
]

// Coverage score calculation (25 points max)
function calculateCoverageScorePure(
  categoriesCovered: number,
  totalCategories: number,
  risksWithDescriptions: number,
  totalRisks: number
): number {
  if (totalRisks === 0) return 0
  const categoryScore = Math.round((categoriesCovered / totalCategories) * 15)
  const descriptionScore = Math.round((risksWithDescriptions / totalRisks) * 10)
  return categoryScore + descriptionScore
}

// Control effectiveness score calculation (25 points max)
function calculateControlEffectivenessScorePure(
  averageReduction: number,
  risksWithControls: number,
  totalRisks: number
): number {
  if (totalRisks === 0) return 0
  const reductionScore = Math.min(15, Math.round((averageReduction / 50) * 15))
  const controlsScore = Math.round((risksWithControls / totalRisks) * 10)
  return reductionScore + controlsScore
}

// Maturity score calculation (25 points max)
function calculateMaturityScorePure(
  risksWithOwners: number,
  risksWithDueDates: number,
  risksWithControls: number,
  totalRisks: number
): number {
  if (totalRisks === 0) return 0
  const ownerScore = Math.round((risksWithOwners / totalRisks) * 10)
  const dueDateScore = Math.round((risksWithDueDates / totalRisks) * 8)
  const controlsScore = Math.round((risksWithControls / totalRisks) * 7)
  return ownerScore + dueDateScore + controlsScore
}

// Trend score calculation (25 points max)
function calculateTrendScorePure(
  direction: 'improving' | 'stable' | 'worsening' | 'insufficient_data'
): number {
  switch (direction) {
    case 'improving':
      return 25
    case 'stable':
      return 15
    case 'worsening':
      return 5
    case 'insufficient_data':
      return 12
  }
}

// Total score calculation
function calculateTotalScore(
  coverage: number,
  controlEffectiveness: number,
  maturity: number,
  trend: number
): number {
  return coverage + controlEffectiveness + maturity + trend
}

// ============================================
// TESTS
// ============================================

describe('Vytl Score Calculation', () => {
  // ----------------------------------------
  // Grade Assignment Tests
  // ----------------------------------------
  describe('getGrade', () => {
    it('should return grade A for score 80', () => {
      const result = getGrade(80)
      expect(result.grade).toBe('A')
      expect(result.color).toBe('green')
    })

    it('should return grade A for score 100', () => {
      const result = getGrade(100)
      expect(result.grade).toBe('A')
      expect(result.color).toBe('green')
    })

    it('should return grade A for score 95', () => {
      const result = getGrade(95)
      expect(result.grade).toBe('A')
      expect(result.color).toBe('green')
    })

    it('should return grade B for score 79', () => {
      const result = getGrade(79)
      expect(result.grade).toBe('B')
      expect(result.color).toBe('green')
    })

    it('should return grade B for score 60', () => {
      const result = getGrade(60)
      expect(result.grade).toBe('B')
      expect(result.color).toBe('green')
    })

    it('should return grade C for score 59', () => {
      const result = getGrade(59)
      expect(result.grade).toBe('C')
      expect(result.color).toBe('yellow')
    })

    it('should return grade C for score 40', () => {
      const result = getGrade(40)
      expect(result.grade).toBe('C')
      expect(result.color).toBe('yellow')
    })

    it('should return grade D for score 39', () => {
      const result = getGrade(39)
      expect(result.grade).toBe('D')
      expect(result.color).toBe('red')
    })

    it('should return grade D for score 20', () => {
      const result = getGrade(20)
      expect(result.grade).toBe('D')
      expect(result.color).toBe('red')
    })

    it('should return grade F for score 19', () => {
      const result = getGrade(19)
      expect(result.grade).toBe('F')
      expect(result.color).toBe('red')
    })

    it('should return grade F for score 0', () => {
      const result = getGrade(0)
      expect(result.grade).toBe('F')
      expect(result.color).toBe('red')
    })

    it('should return grade C for score 50 (midpoint)', () => {
      const result = getGrade(50)
      expect(result.grade).toBe('C')
      expect(result.color).toBe('yellow')
    })
  })

  // ----------------------------------------
  // Coverage Score Tests
  // ----------------------------------------
  describe('Coverage Score Calculation', () => {
    it('should return 0 when no risks exist', () => {
      const score = calculateCoverageScorePure(0, 8, 0, 0)
      expect(score).toBe(0)
    })

    it('should return max 25 when all categories covered and all have descriptions', () => {
      const score = calculateCoverageScorePure(8, 8, 10, 10)
      expect(score).toBe(25) // 15 (categories) + 10 (descriptions)
    })

    it('should calculate partial category coverage correctly', () => {
      // 4 of 8 categories = 50% of 15 = 7.5 rounded to 8
      const score = calculateCoverageScorePure(4, 8, 0, 10)
      expect(score).toBe(8)
    })

    it('should calculate partial description coverage correctly', () => {
      // All categories, 5 of 10 with descriptions = 50% of 10 = 5
      const score = calculateCoverageScorePure(8, 8, 5, 10)
      expect(score).toBe(20) // 15 + 5
    })

    it('should handle single risk with full coverage', () => {
      const score = calculateCoverageScorePure(1, 8, 1, 1)
      // 1/8 categories = 12.5% of 15 = 1.875 rounded to 2
      // 1/1 descriptions = 100% of 10 = 10
      expect(score).toBe(12)
    })

    it('should handle zero categories covered', () => {
      const score = calculateCoverageScorePure(0, 8, 5, 10)
      expect(score).toBe(5) // 0 + 5
    })
  })

  // ----------------------------------------
  // Control Effectiveness Score Tests
  // ----------------------------------------
  describe('Control Effectiveness Score Calculation', () => {
    it('should return 0 when no risks exist', () => {
      const score = calculateControlEffectivenessScorePure(0, 0, 0)
      expect(score).toBe(0)
    })

    it('should return max 25 with 50%+ reduction and all risks have controls', () => {
      const score = calculateControlEffectivenessScorePure(50, 10, 10)
      expect(score).toBe(25) // 15 (reduction) + 10 (controls)
    })

    it('should cap reduction score at 15 for >50% reduction', () => {
      const score = calculateControlEffectivenessScorePure(80, 10, 10)
      expect(score).toBe(25) // 15 (capped) + 10 (controls)
    })

    it('should calculate partial reduction correctly', () => {
      // 25% reduction = 50% of max reduction score = 7.5 rounded to 8
      const score = calculateControlEffectivenessScorePure(25, 0, 10)
      expect(score).toBe(8) // 8 + 0
    })

    it('should calculate partial controls coverage correctly', () => {
      // 0% reduction, 5 of 10 risks have controls = 50% of 10 = 5
      const score = calculateControlEffectivenessScorePure(0, 5, 10)
      expect(score).toBe(5)
    })

    it('should handle 100% reduction', () => {
      const score = calculateControlEffectivenessScorePure(100, 10, 10)
      expect(score).toBe(25) // capped at 15 + 10
    })
  })

  // ----------------------------------------
  // Maturity Score Tests
  // ----------------------------------------
  describe('Maturity Score Calculation', () => {
    it('should return 0 when no risks exist', () => {
      const score = calculateMaturityScorePure(0, 0, 0, 0)
      expect(score).toBe(0)
    })

    it('should return max 25 when all risks are fully mature', () => {
      const score = calculateMaturityScorePure(10, 10, 10, 10)
      expect(score).toBe(25) // 10 (owners) + 8 (due dates) + 7 (controls)
    })

    it('should calculate owner coverage correctly', () => {
      // 5 of 10 with owners = 50% of 10 = 5
      const score = calculateMaturityScorePure(5, 0, 0, 10)
      expect(score).toBe(5)
    })

    it('should calculate due date coverage correctly', () => {
      // 5 of 10 with due dates = 50% of 8 = 4
      const score = calculateMaturityScorePure(0, 5, 0, 10)
      expect(score).toBe(4)
    })

    it('should calculate controls coverage correctly', () => {
      // 5 of 10 with controls = 50% of 7 = 3.5 rounded to 4
      const score = calculateMaturityScorePure(0, 0, 5, 10)
      expect(score).toBe(4)
    })

    it('should combine all maturity factors', () => {
      // Half coverage on all: 5 + 4 + 4 = 13
      const score = calculateMaturityScorePure(5, 5, 5, 10)
      expect(score).toBe(13)
    })
  })

  // ----------------------------------------
  // Trend Score Tests
  // ----------------------------------------
  describe('Trend Score Calculation', () => {
    it('should return 25 for improving trend', () => {
      const score = calculateTrendScorePure('improving')
      expect(score).toBe(25)
    })

    it('should return 15 for stable trend', () => {
      const score = calculateTrendScorePure('stable')
      expect(score).toBe(15)
    })

    it('should return 5 for worsening trend', () => {
      const score = calculateTrendScorePure('worsening')
      expect(score).toBe(5)
    })

    it('should return 12 for insufficient data', () => {
      const score = calculateTrendScorePure('insufficient_data')
      expect(score).toBe(12)
    })
  })

  // ----------------------------------------
  // Total Score Calculation Tests
  // ----------------------------------------
  describe('Total Score Calculation', () => {
    it('should return 0 when all components are 0', () => {
      const score = calculateTotalScore(0, 0, 0, 0)
      expect(score).toBe(0)
    })

    it('should return 100 when all components are maxed', () => {
      const score = calculateTotalScore(25, 25, 25, 25)
      expect(score).toBe(100)
    })

    it('should return 50 when components average 12.5', () => {
      const score = calculateTotalScore(12, 13, 12, 13)
      expect(score).toBe(50)
    })

    it('should correctly sum varied component scores', () => {
      const score = calculateTotalScore(20, 15, 10, 5)
      expect(score).toBe(50)
    })

    it('should handle single high component', () => {
      const score = calculateTotalScore(25, 0, 0, 0)
      expect(score).toBe(25)
    })
  })

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  describe('Edge Cases', () => {
    it('should handle score of exactly 0', () => {
      const grade = getGrade(0)
      expect(grade.grade).toBe('F')
      expect(grade.color).toBe('red')
    })

    it('should handle score of exactly 50', () => {
      const grade = getGrade(50)
      expect(grade.grade).toBe('C')
      expect(grade.color).toBe('yellow')
    })

    it('should handle score of exactly 100', () => {
      const grade = getGrade(100)
      expect(grade.grade).toBe('A')
      expect(grade.color).toBe('green')
    })

    it('should handle negative score gracefully', () => {
      const grade = getGrade(-10)
      expect(grade.grade).toBe('F')
      expect(grade.color).toBe('red')
    })

    it('should handle score above 100', () => {
      const grade = getGrade(150)
      expect(grade.grade).toBe('A')
      expect(grade.color).toBe('green')
    })

    it('should handle decimal scores', () => {
      const grade = getGrade(79.5)
      expect(grade.grade).toBe('B')
    })

    it('should handle grade boundary at 79.99', () => {
      const grade = getGrade(79.99)
      expect(grade.grade).toBe('B')
    })

    it('should handle very small positive score', () => {
      const grade = getGrade(0.1)
      expect(grade.grade).toBe('F')
    })
  })

  // ----------------------------------------
  // Integration-style Scenarios
  // ----------------------------------------
  describe('Realistic Scenarios', () => {
    it('should calculate A-grade for well-managed risk program', () => {
      // Excellent coverage: 8/8 categories, 9/10 descriptions
      const coverage = calculateCoverageScorePure(8, 8, 9, 10)
      // Excellent control: 45% reduction, 8/10 have controls
      const control = calculateControlEffectivenessScorePure(45, 8, 10)
      // High maturity: 9/10 owners, 8/10 due dates, 7/10 controls
      const maturity = calculateMaturityScorePure(9, 8, 7, 10)
      // Improving trend
      const trend = calculateTrendScorePure('improving')

      const total = calculateTotalScore(coverage, control, maturity, trend)
      const grade = getGrade(total)

      expect(total).toBeGreaterThanOrEqual(80)
      expect(grade.grade).toBe('A')
    })

    it('should calculate C-grade for average risk program', () => {
      // Partial coverage: 4/8 categories, 5/10 descriptions
      const coverage = calculateCoverageScorePure(4, 8, 5, 10)
      // Moderate control: 20% reduction, 5/10 have controls
      const control = calculateControlEffectivenessScorePure(20, 5, 10)
      // Moderate maturity: 5/10 owners, 4/10 due dates, 3/10 controls
      const maturity = calculateMaturityScorePure(5, 4, 3, 10)
      // Stable trend
      const trend = calculateTrendScorePure('stable')

      const total = calculateTotalScore(coverage, control, maturity, trend)
      const grade = getGrade(total)

      expect(total).toBeGreaterThanOrEqual(40)
      expect(total).toBeLessThan(60)
      expect(grade.grade).toBe('C')
    })

    it('should calculate F-grade for immature risk program', () => {
      // Poor coverage: 1/8 categories, 1/10 descriptions
      const coverage = calculateCoverageScorePure(1, 8, 1, 10)
      // No control: 0% reduction, 0/10 have controls
      const control = calculateControlEffectivenessScorePure(0, 0, 10)
      // No maturity: 0/10 owners, 0/10 due dates, 0/10 controls
      const maturity = calculateMaturityScorePure(0, 0, 0, 10)
      // Worsening trend
      const trend = calculateTrendScorePure('worsening')

      const total = calculateTotalScore(coverage, control, maturity, trend)
      const grade = getGrade(total)

      expect(total).toBeLessThan(20)
      expect(grade.grade).toBe('F')
    })

    it('should handle new organisation with no risks', () => {
      const coverage = calculateCoverageScorePure(0, 8, 0, 0)
      const control = calculateControlEffectivenessScorePure(0, 0, 0)
      const maturity = calculateMaturityScorePure(0, 0, 0, 0)
      const trend = calculateTrendScorePure('insufficient_data')

      const total = calculateTotalScore(coverage, control, maturity, trend)

      expect(total).toBe(12) // Only trend score for insufficient data
    })
  })
})
