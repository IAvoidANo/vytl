/**
 * Zod validation schemas for the scoring engine
 */

import { z } from 'zod'

// ============================================
// SCORING PROFILE
// ============================================

export const scoringProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(100),
  description: z.string().max(500).optional(),
  industry: z.string().max(50).optional(),

  // Dimension weights
  weightBase: z.number().int().min(0).max(100).default(40),
  weightControlQuality: z.number().int().min(0).max(100).default(20),
  weightVelocity: z.number().int().min(0).max(100).default(15),
  weightCorrelation: z.number().int().min(0).max(100).default(15),
  weightKriAlignment: z.number().int().min(0).max(100).default(10),

  // Category multipliers
  categoryMultipliers: z.record(
    z.enum([
      'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
      'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
    ]),
    z.number().min(0.1).max(3.0)
  ).optional(),

  // Thresholds
  thresholdLow: z.number().int().min(1).max(99).default(25),
  thresholdMedium: z.number().int().min(1).max(99).default(50),
  thresholdHigh: z.number().int().min(1).max(99).default(75),
}).refine(
  (data) => {
    const total = data.weightBase + data.weightControlQuality + data.weightVelocity
      + data.weightCorrelation + data.weightKriAlignment
    return total === 100
  },
  { message: 'Dimension weights must sum to 100', path: ['weightBase'] }
).refine(
  (data) => data.thresholdLow < data.thresholdMedium,
  { message: 'Low threshold must be less than medium threshold', path: ['thresholdLow'] }
).refine(
  (data) => data.thresholdMedium < data.thresholdHigh,
  { message: 'Medium threshold must be less than high threshold', path: ['thresholdMedium'] }
)

// Base shape (before refinements) for partial updates
const scoringProfileBaseShape = z.object({
  name: z.string().min(1, 'Profile name is required').max(100),
  description: z.string().max(500).optional(),
  industry: z.string().max(50).optional(),
  weightBase: z.number().int().min(0).max(100),
  weightControlQuality: z.number().int().min(0).max(100),
  weightVelocity: z.number().int().min(0).max(100),
  weightCorrelation: z.number().int().min(0).max(100),
  weightKriAlignment: z.number().int().min(0).max(100),
  categoryMultipliers: z.record(
    z.enum([
      'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
      'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
    ]),
    z.number().min(0.1).max(3.0)
  ).optional(),
  thresholdLow: z.number().int().min(1).max(99),
  thresholdMedium: z.number().int().min(1).max(99),
  thresholdHigh: z.number().int().min(1).max(99),
})

export const updateScoringProfileSchema = scoringProfileBaseShape.partial().refine(
  (data) => {
    // Only validate weight sum if all weights are provided
    const weights = [data.weightBase, data.weightControlQuality, data.weightVelocity,
      data.weightCorrelation, data.weightKriAlignment].filter(w => w !== undefined)
    if (weights.length === 5) {
      return (data.weightBase! + data.weightControlQuality! + data.weightVelocity!
        + data.weightCorrelation! + data.weightKriAlignment!) === 100
    }
    return true
  },
  { message: 'When all weights are provided, they must sum to 100', path: ['weightBase'] }
)

// ============================================
// SCORING RULES
// ============================================

const validConditionFields = [
  'category', 'status', 'residualScore', 'inherentScore',
  'residualLikelihood', 'residualImpact', 'controls', 'rootCause',
  'ownerId', 'dueDate',
] as const

const validOperators = [
  'equals', 'notEquals', 'greaterThan', 'lessThan',
  'contains', 'isEmpty', 'isNotEmpty',
] as const

export const scoringRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(1).max(100).default(50),

  conditionField: z.enum(validConditionFields),
  conditionOperator: z.enum(validOperators),
  conditionValue: z.string().max(200),

  scoreModifier: z.number().int().min(-25).max(25),
  modifierType: z.enum(['absolute', 'percentage']).default('absolute'),
})

export const updateScoringRuleSchema = scoringRuleSchema.partial().omit({})

// ============================================
// BATCH CALCULATE
// ============================================

export const batchCalculateSchema = z.object({
  registerId: z.string().min(1, 'Register ID is required'),
  profileId: z.string().optional(), // Optional profile override
  saveHistory: z.boolean().default(true),
})

// ============================================
// SCORE HISTORY QUERY
// ============================================

export const scoreHistoryQuerySchema = z.object({
  riskId: z.string().min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(), // For cursor-based pagination
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate
    }
    return true
  },
  { message: 'Start date must be before end date', path: ['startDate'] }
).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const yearMs = 365 * 24 * 60 * 60 * 1000
      return (data.endDate.getTime() - data.startDate.getTime()) <= yearMs
    }
    return true
  },
  { message: 'Date range cannot exceed 1 year', path: ['endDate'] }
)

// ============================================
// TREND ANALYSIS
// ============================================

export const trendAnalysisSchema = z.object({
  riskId: z.string().optional(),
  daysBack: z.number().int().min(7).max(365).default(90),
})

// ============================================
// SINGLE RISK CALCULATE
// ============================================

export const calculateSingleSchema = z.object({
  riskId: z.string().min(1, 'Risk ID is required'),
  profileId: z.string().optional(),
  saveHistory: z.boolean().default(false),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type ScoringProfileInput = z.infer<typeof scoringProfileSchema>
export type UpdateScoringProfileInput = z.infer<typeof updateScoringProfileSchema>
export type ScoringRuleInput = z.infer<typeof scoringRuleSchema>
export type BatchCalculateInput = z.infer<typeof batchCalculateSchema>
export type ScoreHistoryQueryInput = z.infer<typeof scoreHistoryQuerySchema>
