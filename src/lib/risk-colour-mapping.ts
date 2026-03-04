/**
 * Canonical Risk Colour Mapping
 *
 * SINGLE SOURCE OF TRUTH for (likelihood × impact) → colour.
 *
 * All heatmap components — Dashboard, Risk Register, Reports — must
 * call getRiskColour() from this module.  Do NOT add colour logic
 * directly to components.
 *
 * Architecture:
 *   getRiskColour(l, i, thresholds)
 *     → classifyAppetiteBand(score, thresholds)   [appetite-validation.ts]
 *       → bandToHeatmapClasses(band)              [appetite-validation.ts]
 *
 * Thresholds come from the Organisation model fields:
 *   appetiteLow    (default 4)  — upper bound of LOW band
 *   appetiteMedium (default 9)  — upper bound of MEDIUM band
 *   appetiteHigh   (default 14) — upper bound of HIGH band
 *
 * In React components, thresholds are obtained via:
 *   const appetite = useAppetite()
 *   const classes   = getRiskColour(l, i, appetite.thresholds)
 *
 * Governance references:
 *   ISO 31000 §6.4.3  — Risk Analysis (consistent visualisation)
 *   King V Principle 11 — Accurate and consistent risk information
 *   COSO ERM Principle 7 — Repeatable and reliable risk assessment
 */

import {
  classifyAppetiteBand,
  bandToHeatmapClasses,
  type AppetiteThresholds,
  type AppetiteBand,
} from './appetite-validation'

// ─── Canonical colour function ────────────────────────────────────────────────

/**
 * Returns the Tailwind CSS class string for a heatmap cell.
 *
 * @param likelihood  1–5 likelihood score
 * @param impact      1–5 impact score
 * @param thresholds  Org-configured appetite thresholds (from useAppetite())
 * @returns           Tailwind class string e.g. "bg-orange-500 hover:bg-orange-600 border-orange-600"
 */
export function getRiskColour(
  likelihood: number,
  impact: number,
  thresholds: AppetiteThresholds,
): string {
  if (
    likelihood < 1 || likelihood > 5 ||
    impact     < 1 || impact     > 5
  ) {
    // Out-of-range inputs fall back to lowest band
    return bandToHeatmapClasses('LOW')
  }
  const score = likelihood * impact
  const band  = classifyAppetiteBand(score, thresholds)
  return bandToHeatmapClasses(band)
}

/**
 * Returns the risk band for a given L×I score — useful when you need
 * the band name as well as the colour (e.g. for aria-labels or legends).
 */
export function getRiskBand(
  likelihood: number,
  impact: number,
  thresholds: AppetiteThresholds,
): AppetiteBand {
  const score = (likelihood * impact)
  return classifyAppetiteBand(score, thresholds)
}

// ─── Print-safe hex colours ───────────────────────────────────────────────────
//
// Tailwind background classes may be stripped in print mode.  Use these
// hex values in `style={{ backgroundColor }}` alongside the Tailwind class
// to guarantee correct colour in PDF / print output.
//
// Values match the solid Tailwind colours used by bandToHeatmapClasses():
//   LOW      → bg-green-500  → #22c55e
//   MEDIUM   → bg-amber-500  → #f59e0b
//   HIGH     → bg-orange-500 → #f97316
//   CRITICAL → bg-red-600    → #dc2626

export const BAND_PRINT_COLOURS: Record<AppetiteBand, string> = {
  LOW:      '#22c55e',
  MEDIUM:   '#f59e0b',
  HIGH:     '#f97316',
  CRITICAL: '#dc2626',
}
