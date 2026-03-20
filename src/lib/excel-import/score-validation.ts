/**
 * score-validation.ts — INC-006: Excel import score range validation
 *
 * Pure functions (no DOM, no DB). Validates likelihood/impact values (1-5 scale)
 * and emits warnings when values are adjusted, so users can see what changed.
 */

export interface ScoreValidationResult {
  /** Clamped value in [1, 5] */
  value: number
  /** Raw value before processing */
  originalValue: unknown
  /** True if the value was clamped or coerced (user should be warned) */
  wasAdjusted: boolean
  /** True if the input was absent/null/undefined/blank */
  wasMissing: boolean
  /** Human-readable warning for the preview UI, set when wasAdjusted=true */
  warning?: string
}

const MIN = 1
const MAX = 5

/**
 * Validate a single likelihood or impact score.
 *
 * Resolution:
 *  1. Missing/blank → use defaultValue, wasMissing=true (no warning — expected)
 *  2. Non-numeric → use defaultValue, wasAdjusted=true + warning
 *  3. Float → round to nearest integer (e.g. 3.7 → 4)
 *  4. In [1,5] → accepted as-is
 *  5. Outside [1,5] → clamped, wasAdjusted=true + warning
 */
export function validateScore(
  raw: unknown,
  fieldName: string,
  defaultValue: number = 3,
): ScoreValidationResult {
  // Missing / blank
  if (raw === null || raw === undefined || String(raw).trim() === '') {
    return {
      value: defaultValue,
      originalValue: raw,
      wasAdjusted: false,
      wasMissing: true,
    }
  }

  const num = Number(raw)

  // Non-numeric
  if (isNaN(num)) {
    return {
      value: defaultValue,
      originalValue: raw,
      wasAdjusted: true,
      wasMissing: false,
      warning: `${fieldName}: "${raw}" is not a number — defaulted to ${defaultValue}`,
    }
  }

  // Round floats
  const rounded = Math.round(num)

  // In range
  if (rounded >= MIN && rounded <= MAX) {
    const wasRounded = rounded !== num
    return {
      value: rounded,
      originalValue: raw,
      wasAdjusted: wasRounded,
      wasMissing: false,
      warning: wasRounded
        ? `${fieldName}: ${num} rounded to ${rounded}`
        : undefined,
    }
  }

  // Out of range — clamp
  const clamped = Math.min(MAX, Math.max(MIN, rounded))
  return {
    value: clamped,
    originalValue: raw,
    wasAdjusted: true,
    wasMissing: false,
    warning: `${fieldName}: ${num} is out of range (1-5) — adjusted to ${clamped}`,
  }
}

/**
 * Validate that residual scores don't exceed inherent scores.
 * Returns warnings (not errors — the data is still importable).
 */
export function validateResidualNotExceedsInherent(
  residualL: number,
  inherentL: number,
  residualI: number,
  inherentI: number,
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  if (residualL > inherentL) {
    warnings.push(`Residual Likelihood (${residualL}) exceeds Inherent Likelihood (${inherentL})`)
  }
  if (residualI > inherentI) {
    warnings.push(`Residual Impact (${residualI}) exceeds Inherent Impact (${inherentI})`)
  }
  return { valid: warnings.length === 0, warnings }
}

/**
 * Validate a combined L×I cell (e.g. "3x4", "7,2", "3/6").
 * Parses both components and validates each independently.
 */
export function validateCombinedScore(
  raw: unknown,
  fieldName: string,
): { likelihood: ScoreValidationResult; impact: ScoreValidationResult } | null {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null

  const str = String(raw).trim()
  const separatorPattern = /^(\S+)\s*[xX×,\/\|]\s*(\S+)$/
  const match = str.match(separatorPattern)

  if (!match) return null

  return {
    likelihood: validateScore(match[1], `${fieldName} Likelihood`),
    impact: validateScore(match[2], `${fieldName} Impact`),
  }
}
