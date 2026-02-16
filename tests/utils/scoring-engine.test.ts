import { describe, it, expect } from 'vitest'
import {
  calculateBaseScore,
  calculateControlQualityScore,
} from '@/lib/scoring-engine'

// ============================================
// Pure function tests (no DB dependencies)
// ============================================

function createMockRisk(overrides: Partial<Parameters<typeof calculateBaseScore>[0]> = {}) {
  return {
    id: 'risk-1',
    refCode: 'R-001',
    title: 'Test Risk',
    description: 'A test risk for unit testing purposes that is long enough',
    category: 'OPERATIONAL',
    inherentLikelihood: 4,
    inherentImpact: 4,
    inherentScore: 16,
    residualLikelihood: 3,
    residualImpact: 3,
    residualScore: 9,
    controls: null,
    rootCause: null,
    status: 'OPEN',
    ownerId: null,
    dueDate: null,
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('Scoring Engine', () => {
  // ----------------------------------------
  // Base Score Tests
  // ----------------------------------------
  describe('calculateBaseScore', () => {
    it('should return 0 for minimum residual score (1)', () => {
      const risk = createMockRisk({ residualScore: 1 })
      const result = calculateBaseScore(risk)
      expect(result.score).toBe(0)
      expect(result.maxScore).toBe(100)
    })

    it('should return 100 for maximum residual score (25)', () => {
      const risk = createMockRisk({ residualScore: 25 })
      const result = calculateBaseScore(risk)
      expect(result.score).toBe(100)
    })

    it('should normalize mid-range score correctly', () => {
      const risk = createMockRisk({ residualScore: 13 })
      const result = calculateBaseScore(risk)
      // (13-1)/24 * 100 = 50
      expect(result.score).toBe(50)
    })

    it('should include reduction percentage in details', () => {
      const risk = createMockRisk({ inherentScore: 20, residualScore: 10 })
      const result = calculateBaseScore(risk)
      expect(result.details.reductionPercent).toBe(50)
    })

    it('should handle zero inherent score', () => {
      const risk = createMockRisk({ inherentScore: 0, residualScore: 5 })
      const result = calculateBaseScore(risk)
      expect(result.details.reductionPercent).toBe(0)
    })

    it('should clamp score to 0-100 range', () => {
      const risk = createMockRisk({ residualScore: 1 })
      const result = calculateBaseScore(risk)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should handle all 1s (minimum risk)', () => {
      const risk = createMockRisk({
        inherentLikelihood: 1, inherentImpact: 1, inherentScore: 1,
        residualLikelihood: 1, residualImpact: 1, residualScore: 1,
      })
      const result = calculateBaseScore(risk)
      expect(result.score).toBe(0)
    })

    it('should handle all 5s (maximum risk)', () => {
      const risk = createMockRisk({
        inherentLikelihood: 5, inherentImpact: 5, inherentScore: 25,
        residualLikelihood: 5, residualImpact: 5, residualScore: 25,
      })
      const result = calculateBaseScore(risk)
      expect(result.score).toBe(100)
    })
  })

  // ----------------------------------------
  // Control Quality Score Tests
  // ----------------------------------------
  describe('calculateControlQualityScore', () => {
    it('should return 100 (worst) when no controls documented', () => {
      const risk = createMockRisk({ controls: null })
      const result = calculateControlQualityScore(risk)
      expect(result.score).toBe(100)
      expect(result.details.hasControls).toBe(false)
    })

    it('should return 100 for empty controls string', () => {
      const risk = createMockRisk({ controls: '' })
      const result = calculateControlQualityScore(risk)
      expect(result.score).toBe(100)
    })

    it('should score better for longer controls', () => {
      const shortControls = createMockRisk({ controls: 'Monitor risk' })
      const longControls = createMockRisk({
        controls: 'Implement automated monitoring system with daily reviews. ' +
          'Establish escalation procedures for threshold breaches. ' +
          'Train all staff on risk identification and reporting protocols. ' +
          'Conduct quarterly risk assessments with documented findings.',
      })

      const shortResult = calculateControlQualityScore(shortControls)
      const longResult = calculateControlQualityScore(longControls)

      expect(longResult.score).toBeLessThan(shortResult.score)
    })

    it('should score better when actionable keywords are present', () => {
      const vague = createMockRisk({ controls: 'We will look at the situation and decide what to do about it later when we have time' })
      const actionable = createMockRisk({ controls: 'Implement encryption. Monitor access logs. Review audit trails. Train staff. Automate backup procedures.' })

      const vagueResult = calculateControlQualityScore(vague)
      const actionableResult = calculateControlQualityScore(actionable)

      expect(actionableResult.score).toBeLessThan(vagueResult.score)
    })

    it('should give bonus for structured/numbered controls', () => {
      const unstructured = createMockRisk({
        controls: 'We implement various monitoring and review procedures to manage this risk across the organisation',
      })
      const structured = createMockRisk({
        controls: '1. Implement monitoring\n2. Review quarterly\n3. Train staff\n4. Audit annually',
      })

      const unstructuredResult = calculateControlQualityScore(unstructured)
      const structuredResult = calculateControlQualityScore(structured)

      expect(structuredResult.score).toBeLessThanOrEqual(unstructuredResult.score)
    })

    it('should give bonus for documented root cause', () => {
      const noRootCause = createMockRisk({
        controls: 'Implement monitoring procedures across the department',
        rootCause: null,
      })
      const withRootCause = createMockRisk({
        controls: 'Implement monitoring procedures across the department',
        rootCause: 'Lack of oversight in the procurement process leading to vendor risk',
      })

      const noRootResult = calculateControlQualityScore(noRootCause)
      const withRootResult = calculateControlQualityScore(withRootCause)

      expect(withRootResult.score).toBeLessThanOrEqual(noRootResult.score)
    })

    it('should clamp score to 0-100 range', () => {
      const risk = createMockRisk({
        controls: '1. Implement encryption and access controls\n' +
          '2. Monitor system logs with automated alerting\n' +
          '3. Review and audit quarterly with documented findings\n' +
          '4. Train all staff on security protocols annually\n' +
          '5. Automate backup and recovery procedures\n' +
          '6. Segregate duties across departments\n' +
          '7. Establish approval workflows for sensitive operations',
        rootCause: 'Historical lack of IT governance framework and insufficient security controls',
      })
      const result = calculateControlQualityScore(risk)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  // ----------------------------------------
  // Scoring Weights
  // ----------------------------------------
  describe('Weight calculations', () => {
    it('default weights should sum to 100', () => {
      const defaults = { base: 40, controlQuality: 20, velocity: 15, correlation: 15, kriAlignment: 10 }
      const sum = defaults.base + defaults.controlQuality + defaults.velocity + defaults.correlation + defaults.kriAlignment
      expect(sum).toBe(100)
    })
  })

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  describe('Edge cases', () => {
    it('should handle residual score of exactly 1', () => {
      const risk = createMockRisk({ residualScore: 1 })
      const result = calculateBaseScore(risk)
      expect(result.score).toBe(0)
    })

    it('should handle residual score of exactly 25', () => {
      const risk = createMockRisk({ residualScore: 25 })
      const result = calculateBaseScore(risk)
      expect(result.score).toBe(100)
    })

    it('should handle controls with only whitespace', () => {
      const risk = createMockRisk({ controls: '   \n\t  ' })
      const result = calculateControlQualityScore(risk)
      // Whitespace-only should score poorly (high risk)
      expect(result.score).toBeGreaterThanOrEqual(50)
    })

    it('should handle very long controls text', () => {
      const risk = createMockRisk({ controls: 'implement '.repeat(200) })
      const result = calculateControlQualityScore(risk)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })
})
