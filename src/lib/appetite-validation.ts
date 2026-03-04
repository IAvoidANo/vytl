import { z } from 'zod'

// ============================================
// CONSTANTS
// ============================================

export const RISK_CATEGORIES = [
  'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
  'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
] as const

export type RiskCategory = (typeof RISK_CATEGORIES)[number]

export const DEFAULT_APPETITE_THRESHOLDS = {
  low: 4,
  medium: 9,
  high: 14,
} as const

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  STRATEGIC: 'Strategic',
  OPERATIONAL: 'Operational',
  FINANCIAL: 'Financial',
  COMPLIANCE: 'Compliance',
  TECHNOLOGY: 'Technology',
  REPUTATIONAL: 'Reputational',
  ENVIRONMENTAL: 'Environmental',
  PEOPLE: 'People',
}

// ============================================
// TYPES
// ============================================

export interface AppetiteThresholds {
  low: number
  medium: number
  high: number
}

export type AppetiteBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ============================================
// ZOD SCHEMAS
// ============================================

export const thresholdBandSchema = z.object({
  low: z.number().int().min(1).max(24),
  medium: z.number().int().min(2).max(24),
  high: z.number().int().min(3).max(24),
}).refine(
  (d) => d.low < d.medium,
  { message: 'Low threshold must be less than medium', path: ['low'] }
).refine(
  (d) => d.medium < d.high,
  { message: 'Medium threshold must be less than high', path: ['medium'] }
)

export const appetiteCategoryConfigSchema = z.record(
  z.enum(RISK_CATEGORIES),
  thresholdBandSchema
).optional()

export const updateAppetiteSchema = z.object({
  appetiteStatement: z.string().max(2000).nullable().optional(),
  appetiteLow: z.number().int().min(1).max(24).optional(),
  appetiteMedium: z.number().int().min(2).max(24).optional(),
  appetiteHigh: z.number().int().min(3).max(24).optional(),
  appetiteCategoryConfig: appetiteCategoryConfigSchema,
}).refine(
  (d) => {
    if (d.appetiteLow !== undefined && d.appetiteMedium !== undefined) {
      return d.appetiteLow < d.appetiteMedium
    }
    return true
  },
  { message: 'Low threshold must be less than medium', path: ['appetiteLow'] }
).refine(
  (d) => {
    if (d.appetiteMedium !== undefined && d.appetiteHigh !== undefined) {
      return d.appetiteMedium < d.appetiteHigh
    }
    return true
  },
  { message: 'Medium threshold must be less than high', path: ['appetiteMedium'] }
)

export type UpdateAppetiteInput = z.infer<typeof updateAppetiteSchema>

// ============================================
// PURE FUNCTIONS
// ============================================

export function resolveThresholds(
  orgThresholds: AppetiteThresholds | null | undefined,
  category: RiskCategory | string | null | undefined,
  categoryConfig: Record<string, AppetiteThresholds> | null | undefined
): AppetiteThresholds {
  const base: AppetiteThresholds = orgThresholds ?? { ...DEFAULT_APPETITE_THRESHOLDS }

  if (category && categoryConfig) {
    const override = categoryConfig[category]
    if (override) return override
  }

  return base
}

export function classifyAppetiteBand(
  score: number,
  thresholds: AppetiteThresholds
): AppetiteBand {
  if (score <= thresholds.low) return 'LOW'
  if (score <= thresholds.medium) return 'MEDIUM'
  if (score <= thresholds.high) return 'HIGH'
  return 'CRITICAL'
}

export function exceedsAppetite(
  score: number,
  thresholds: AppetiteThresholds
): boolean {
  return score > thresholds.medium
}

export function bandToColorClasses(band: AppetiteBand): {
  bg: string
  text: string
  border: string
} {
  switch (band) {
    case 'LOW':
      return { bg: 'bg-green-500/15', text: 'text-green-700 dark:text-green-400', border: 'border-green-600/40' }
    case 'MEDIUM':
      return { bg: 'bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-600/40' }
    case 'HIGH':
      return { bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-600/40' }
    case 'CRITICAL':
      return { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', border: 'border-red-600/40' }
  }
}

export function bandToHeatmapClasses(band: AppetiteBand): string {
  switch (band) {
    case 'LOW':      return 'bg-green-500  hover:bg-green-600  border-green-600'
    case 'MEDIUM':   return 'bg-amber-500  hover:bg-amber-600  border-amber-600'
    case 'HIGH':     return 'bg-orange-500 hover:bg-orange-600 border-orange-600'
    case 'CRITICAL': return 'bg-red-600    hover:bg-red-700    border-red-700'
  }
}

export function bandToHeatmapTextClass(_band: AppetiteBand): string {
  // Always white — heatmap cells use solid coloured backgrounds
  return 'text-white'
}

export function bandToLabel(band: AppetiteBand): string {
  switch (band) {
    case 'LOW': return 'Low'
    case 'MEDIUM': return 'Medium'
    case 'HIGH': return 'High'
    case 'CRITICAL': return 'Critical'
  }
}

export function buildHeatmapLegend(thresholds: AppetiteThresholds): Array<{
  band: AppetiteBand
  label: string
  range: string
}> {
  return [
    { band: 'LOW', label: 'Low', range: `1–${thresholds.low}` },
    { band: 'MEDIUM', label: 'Medium', range: `${thresholds.low + 1}–${thresholds.medium}` },
    { band: 'HIGH', label: 'High', range: `${thresholds.medium + 1}–${thresholds.high}` },
    { band: 'CRITICAL', label: 'Critical', range: `${thresholds.high + 1}–25` },
  ]
}

export function countBreaches(
  risks: Array<{ residualScore: number; category: string }>,
  orgThresholds: AppetiteThresholds,
  categoryConfig: Record<string, AppetiteThresholds> | null | undefined
): { total: number; byCategory: Record<string, number> } {
  let total = 0
  const byCategory: Record<string, number> = {}

  for (const risk of risks) {
    const thresholds = resolveThresholds(orgThresholds, risk.category, categoryConfig)
    if (exceedsAppetite(risk.residualScore, thresholds)) {
      total++
      byCategory[risk.category] = (byCategory[risk.category] ?? 0) + 1
    }
  }

  return { total, byCategory }
}
