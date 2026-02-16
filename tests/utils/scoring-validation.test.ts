import { describe, it, expect } from 'vitest'
import {
  scoringProfileSchema,
  scoringRuleSchema,
  batchCalculateSchema,
  scoreHistoryQuerySchema,
} from '@/lib/scoring-validation'

describe('Scoring Validation Schemas', () => {
  // ----------------------------------------
  // Scoring Profile Schema
  // ----------------------------------------
  describe('scoringProfileSchema', () => {
    it('should accept valid profile with weights summing to 100', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Test Profile',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10,
        thresholdLow: 25,
        thresholdMedium: 50,
        thresholdHigh: 75,
      })
      expect(result.success).toBe(true)
    })

    it('should reject weights not summing to 100', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Bad Profile',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 15, // Total = 105
        thresholdLow: 25,
        thresholdMedium: 50,
        thresholdHigh: 75,
      })
      expect(result.success).toBe(false)
    })

    it('should reject weights summing to 99', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Almost Profile',
        weightBase: 39,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10, // Total = 99
        thresholdLow: 25,
        thresholdMedium: 50,
        thresholdHigh: 75,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty profile name', () => {
      const result = scoringProfileSchema.safeParse({
        name: '',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10,
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative weights', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Negative Profile',
        weightBase: -10,
        weightControlQuality: 40,
        weightVelocity: 30,
        weightCorrelation: 30,
        weightKriAlignment: 10,
      })
      expect(result.success).toBe(false)
    })

    it('should reject weight above 100', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Over Profile',
        weightBase: 101,
        weightControlQuality: 0,
        weightVelocity: 0,
        weightCorrelation: 0,
        weightKriAlignment: -1,
      })
      expect(result.success).toBe(false)
    })

    it('should reject thresholds not in ascending order', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Bad Thresholds',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10,
        thresholdLow: 50,
        thresholdMedium: 25, // Less than low
        thresholdHigh: 75,
      })
      expect(result.success).toBe(false)
    })

    it('should reject medium >= high threshold', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Bad Thresholds',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10,
        thresholdLow: 25,
        thresholdMedium: 75,
        thresholdHigh: 75, // Equal to medium
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid category multipliers', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'With Multipliers',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10,
        categoryMultipliers: {
          COMPLIANCE: 1.5,
          FINANCIAL: 1.2,
          TECHNOLOGY: 0.8,
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject category multiplier below 0.1', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Bad Multiplier',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10,
        categoryMultipliers: {
          COMPLIANCE: 0.05, // Too low
        },
      })
      expect(result.success).toBe(false)
    })

    it('should reject category multiplier above 3.0', () => {
      const result = scoringProfileSchema.safeParse({
        name: 'Bad Multiplier',
        weightBase: 40,
        weightControlQuality: 20,
        weightVelocity: 15,
        weightCorrelation: 15,
        weightKriAlignment: 10,
        categoryMultipliers: {
          COMPLIANCE: 5.0, // Too high
        },
      })
      expect(result.success).toBe(false)
    })
  })

  // ----------------------------------------
  // Scoring Rule Schema
  // ----------------------------------------
  describe('scoringRuleSchema', () => {
    it('should accept valid rule', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'Compliance Penalty',
        conditionField: 'category',
        conditionOperator: 'equals',
        conditionValue: 'COMPLIANCE',
        scoreModifier: 5,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty rule name', () => {
      const result = scoringRuleSchema.safeParse({
        name: '',
        conditionField: 'category',
        conditionOperator: 'equals',
        conditionValue: 'COMPLIANCE',
        scoreModifier: 5,
      })
      expect(result.success).toBe(false)
    })

    it('should reject scoreModifier above 25', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'Too High',
        conditionField: 'category',
        conditionOperator: 'equals',
        conditionValue: 'COMPLIANCE',
        scoreModifier: 30,
      })
      expect(result.success).toBe(false)
    })

    it('should reject scoreModifier below -25', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'Too Low',
        conditionField: 'category',
        conditionOperator: 'equals',
        conditionValue: 'COMPLIANCE',
        scoreModifier: -30,
      })
      expect(result.success).toBe(false)
    })

    it('should accept negative modifier (bonus)', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'Good Controls Bonus',
        conditionField: 'controls',
        conditionOperator: 'isNotEmpty',
        conditionValue: '',
        scoreModifier: -5,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid condition field', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'Invalid Field',
        conditionField: 'nonexistent',
        conditionOperator: 'equals',
        conditionValue: 'test',
        scoreModifier: 5,
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid operator', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'Invalid Op',
        conditionField: 'category',
        conditionOperator: 'regex',
        conditionValue: '.*',
        scoreModifier: 5,
      })
      expect(result.success).toBe(false)
    })

    it('should accept priority between 1 and 100', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'High Priority',
        conditionField: 'status',
        conditionOperator: 'equals',
        conditionValue: 'OPEN',
        scoreModifier: 3,
        priority: 1,
      })
      expect(result.success).toBe(true)
    })

    it('should reject priority above 100', () => {
      const result = scoringRuleSchema.safeParse({
        name: 'Bad Priority',
        conditionField: 'status',
        conditionOperator: 'equals',
        conditionValue: 'OPEN',
        scoreModifier: 3,
        priority: 101,
      })
      expect(result.success).toBe(false)
    })
  })

  // ----------------------------------------
  // Batch Calculate Schema
  // ----------------------------------------
  describe('batchCalculateSchema', () => {
    it('should accept valid batch request', () => {
      const result = batchCalculateSchema.safeParse({
        registerId: 'reg-1',
        saveHistory: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty registerId', () => {
      const result = batchCalculateSchema.safeParse({
        registerId: '',
      })
      expect(result.success).toBe(false)
    })

    it('should default saveHistory to true', () => {
      const result = batchCalculateSchema.safeParse({
        registerId: 'reg-1',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.saveHistory).toBe(true)
      }
    })
  })

  // ----------------------------------------
  // Score History Query Schema
  // ----------------------------------------
  describe('scoreHistoryQuerySchema', () => {
    it('should accept valid query', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: 'risk-1',
        limit: 20,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty riskId', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit above 100', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: 'risk-1',
        limit: 101,
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit below 1', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: 'risk-1',
        limit: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject startDate after endDate', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: 'risk-1',
        startDate: '2025-06-01',
        endDate: '2025-01-01',
      })
      expect(result.success).toBe(false)
    })

    it('should reject date range exceeding 1 year', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: 'risk-1',
        startDate: '2024-01-01',
        endDate: '2025-06-01',
      })
      expect(result.success).toBe(false)
    })

    it('should accept date range within 1 year', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: 'risk-1',
        startDate: '2025-01-01',
        endDate: '2025-06-01',
      })
      expect(result.success).toBe(true)
    })

    it('should default limit to 50', () => {
      const result = scoreHistoryQuerySchema.safeParse({
        riskId: 'risk-1',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(50)
      }
    })
  })
})
