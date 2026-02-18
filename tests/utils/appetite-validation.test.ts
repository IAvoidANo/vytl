import { describe, it, expect } from 'vitest'
import {
  thresholdBandSchema,
  updateAppetiteSchema,
  appetiteCategoryConfigSchema,
  resolveThresholds,
  classifyAppetiteBand,
  exceedsAppetite,
  bandToColorClasses,
  bandToHeatmapClasses,
  bandToHeatmapTextClass,
  bandToLabel,
  buildHeatmapLegend,
  countBreaches,
  DEFAULT_APPETITE_THRESHOLDS,
  RISK_CATEGORIES,
  CATEGORY_LABELS,
} from '@/lib/appetite-validation'

// ============================================
// CONSTANTS
// ============================================

describe('constants', () => {
  it('has 8 risk categories', () => {
    expect(RISK_CATEGORIES).toHaveLength(8)
  })

  it('has a label for every category', () => {
    for (const cat of RISK_CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof CATEGORY_LABELS[cat]).toBe('string')
    }
  })

  it('has valid default thresholds', () => {
    expect(DEFAULT_APPETITE_THRESHOLDS.low).toBe(4)
    expect(DEFAULT_APPETITE_THRESHOLDS.medium).toBe(9)
    expect(DEFAULT_APPETITE_THRESHOLDS.high).toBe(14)
    expect(DEFAULT_APPETITE_THRESHOLDS.low).toBeLessThan(DEFAULT_APPETITE_THRESHOLDS.medium)
    expect(DEFAULT_APPETITE_THRESHOLDS.medium).toBeLessThan(DEFAULT_APPETITE_THRESHOLDS.high)
  })
})

// ============================================
// THRESHOLD BAND SCHEMA
// ============================================

describe('thresholdBandSchema', () => {
  it('accepts valid thresholds', () => {
    expect(thresholdBandSchema.safeParse({ low: 4, medium: 9, high: 14 }).success).toBe(true)
  })

  it('accepts edge values', () => {
    expect(thresholdBandSchema.safeParse({ low: 1, medium: 2, high: 3 }).success).toBe(true)
    expect(thresholdBandSchema.safeParse({ low: 22, medium: 23, high: 24 }).success).toBe(true)
  })

  it('rejects low >= medium', () => {
    expect(thresholdBandSchema.safeParse({ low: 9, medium: 9, high: 14 }).success).toBe(false)
    expect(thresholdBandSchema.safeParse({ low: 10, medium: 9, high: 14 }).success).toBe(false)
  })

  it('rejects medium >= high', () => {
    expect(thresholdBandSchema.safeParse({ low: 4, medium: 14, high: 14 }).success).toBe(false)
    expect(thresholdBandSchema.safeParse({ low: 4, medium: 15, high: 14 }).success).toBe(false)
  })

  it('rejects out-of-range values', () => {
    expect(thresholdBandSchema.safeParse({ low: 0, medium: 9, high: 14 }).success).toBe(false)
    expect(thresholdBandSchema.safeParse({ low: 4, medium: 9, high: 25 }).success).toBe(false)
  })
})

// ============================================
// UPDATE APPETITE SCHEMA
// ============================================

describe('updateAppetiteSchema', () => {
  it('accepts empty object', () => {
    expect(updateAppetiteSchema.safeParse({}).success).toBe(true)
  })

  it('accepts statement only', () => {
    const r = updateAppetiteSchema.safeParse({ appetiteStatement: 'Board policy text.' })
    expect(r.success).toBe(true)
  })

  it('accepts null statement', () => {
    expect(updateAppetiteSchema.safeParse({ appetiteStatement: null }).success).toBe(true)
  })

  it('rejects statement over 2000 chars', () => {
    expect(updateAppetiteSchema.safeParse({ appetiteStatement: 'x'.repeat(2001) }).success).toBe(false)
  })

  it('accepts valid thresholds', () => {
    expect(updateAppetiteSchema.safeParse({
      appetiteLow: 3, appetiteMedium: 8, appetiteHigh: 16,
    }).success).toBe(true)
  })

  it('rejects low >= medium when both present', () => {
    expect(updateAppetiteSchema.safeParse({
      appetiteLow: 10, appetiteMedium: 9, appetiteHigh: 14,
    }).success).toBe(false)
  })

  it('rejects medium >= high when both present', () => {
    expect(updateAppetiteSchema.safeParse({
      appetiteLow: 4, appetiteMedium: 14, appetiteHigh: 14,
    }).success).toBe(false)
  })

  it('accepts category overrides', () => {
    expect(updateAppetiteSchema.safeParse({
      appetiteCategoryConfig: {
        COMPLIANCE: { low: 3, medium: 6, high: 9 },
      },
    }).success).toBe(true)
  })

  it('rejects invalid category key', () => {
    expect(updateAppetiteSchema.safeParse({
      appetiteCategoryConfig: {
        INVALID: { low: 3, medium: 6, high: 9 },
      },
    }).success).toBe(false)
  })

  it('rejects invalid category thresholds', () => {
    expect(updateAppetiteSchema.safeParse({
      appetiteCategoryConfig: {
        COMPLIANCE: { low: 9, medium: 6, high: 3 },
      },
    }).success).toBe(false)
  })
})

// ============================================
// CATEGORY CONFIG SCHEMA
// ============================================

describe('appetiteCategoryConfigSchema', () => {
  it('accepts undefined', () => {
    expect(appetiteCategoryConfigSchema.safeParse(undefined).success).toBe(true)
  })

  it('accepts empty object', () => {
    expect(appetiteCategoryConfigSchema.safeParse({}).success).toBe(true)
  })

  it('accepts multiple categories', () => {
    expect(appetiteCategoryConfigSchema.safeParse({
      COMPLIANCE: { low: 3, medium: 6, high: 9 },
      TECHNOLOGY: { low: 2, medium: 5, high: 10 },
    }).success).toBe(true)
  })
})

// ============================================
// resolveThresholds
// ============================================

describe('resolveThresholds', () => {
  const orgThresh = { low: 4, medium: 9, high: 14 }
  const catConfig = {
    COMPLIANCE: { low: 3, medium: 6, high: 9 },
  }

  it('returns org thresholds when no category override', () => {
    expect(resolveThresholds(orgThresh, 'STRATEGIC', catConfig)).toEqual(orgThresh)
  })

  it('returns category override when present', () => {
    expect(resolveThresholds(orgThresh, 'COMPLIANCE', catConfig)).toEqual({ low: 3, medium: 6, high: 9 })
  })

  it('returns org thresholds when category is null', () => {
    expect(resolveThresholds(orgThresh, null, catConfig)).toEqual(orgThresh)
  })

  it('returns org thresholds when categoryConfig is null', () => {
    expect(resolveThresholds(orgThresh, 'COMPLIANCE', null)).toEqual(orgThresh)
  })

  it('returns defaults when orgThresholds is null', () => {
    expect(resolveThresholds(null, null, null)).toEqual(DEFAULT_APPETITE_THRESHOLDS)
  })

  it('returns defaults when orgThresholds is undefined', () => {
    expect(resolveThresholds(undefined, undefined, undefined)).toEqual(DEFAULT_APPETITE_THRESHOLDS)
  })
})

// ============================================
// classifyAppetiteBand
// ============================================

describe('classifyAppetiteBand', () => {
  const t = DEFAULT_APPETITE_THRESHOLDS

  it('classifies LOW for scores <= low', () => {
    expect(classifyAppetiteBand(1, t)).toBe('LOW')
    expect(classifyAppetiteBand(4, t)).toBe('LOW')
  })

  it('classifies MEDIUM for scores between low+1 and medium', () => {
    expect(classifyAppetiteBand(5, t)).toBe('MEDIUM')
    expect(classifyAppetiteBand(9, t)).toBe('MEDIUM')
  })

  it('classifies HIGH for scores between medium+1 and high', () => {
    expect(classifyAppetiteBand(10, t)).toBe('HIGH')
    expect(classifyAppetiteBand(14, t)).toBe('HIGH')
  })

  it('classifies CRITICAL for scores > high', () => {
    expect(classifyAppetiteBand(15, t)).toBe('CRITICAL')
    expect(classifyAppetiteBand(25, t)).toBe('CRITICAL')
  })

  it('works with custom thresholds', () => {
    const custom = { low: 2, medium: 6, high: 12 }
    expect(classifyAppetiteBand(2, custom)).toBe('LOW')
    expect(classifyAppetiteBand(3, custom)).toBe('MEDIUM')
    expect(classifyAppetiteBand(7, custom)).toBe('HIGH')
    expect(classifyAppetiteBand(13, custom)).toBe('CRITICAL')
  })
})

// ============================================
// exceedsAppetite
// ============================================

describe('exceedsAppetite', () => {
  const t = DEFAULT_APPETITE_THRESHOLDS

  it('returns false for LOW band', () => {
    expect(exceedsAppetite(1, t)).toBe(false)
    expect(exceedsAppetite(4, t)).toBe(false)
  })

  it('returns false for MEDIUM band', () => {
    expect(exceedsAppetite(5, t)).toBe(false)
    expect(exceedsAppetite(9, t)).toBe(false)
  })

  it('returns true for HIGH band', () => {
    expect(exceedsAppetite(10, t)).toBe(true)
    expect(exceedsAppetite(14, t)).toBe(true)
  })

  it('returns true for CRITICAL band', () => {
    expect(exceedsAppetite(15, t)).toBe(true)
    expect(exceedsAppetite(25, t)).toBe(true)
  })
})

// ============================================
// bandToColorClasses
// ============================================

describe('bandToColorClasses', () => {
  it('returns green classes for LOW', () => {
    const c = bandToColorClasses('LOW')
    expect(c.bg).toContain('green')
    expect(c.text).toContain('green')
    expect(c.border).toContain('green')
  })

  it('returns yellow classes for MEDIUM', () => {
    const c = bandToColorClasses('MEDIUM')
    expect(c.bg).toContain('yellow')
  })

  it('returns orange classes for HIGH', () => {
    const c = bandToColorClasses('HIGH')
    expect(c.bg).toContain('orange')
  })

  it('returns red classes for CRITICAL', () => {
    const c = bandToColorClasses('CRITICAL')
    expect(c.bg).toContain('red')
  })
})

// ============================================
// bandToHeatmapClasses / bandToHeatmapTextClass
// ============================================

describe('bandToHeatmapClasses', () => {
  it('returns heatmap classes for each band', () => {
    expect(bandToHeatmapClasses('LOW')).toContain('green')
    expect(bandToHeatmapClasses('MEDIUM')).toContain('yellow')
    expect(bandToHeatmapClasses('HIGH')).toContain('orange')
    expect(bandToHeatmapClasses('CRITICAL')).toContain('red')
  })
})

describe('bandToHeatmapTextClass', () => {
  it('returns text color for each band', () => {
    expect(bandToHeatmapTextClass('LOW')).toContain('green')
    expect(bandToHeatmapTextClass('CRITICAL')).toContain('red')
  })
})

// ============================================
// bandToLabel
// ============================================

describe('bandToLabel', () => {
  it('returns human-readable labels', () => {
    expect(bandToLabel('LOW')).toBe('Low')
    expect(bandToLabel('MEDIUM')).toBe('Medium')
    expect(bandToLabel('HIGH')).toBe('High')
    expect(bandToLabel('CRITICAL')).toBe('Critical')
  })
})

// ============================================
// buildHeatmapLegend
// ============================================

describe('buildHeatmapLegend', () => {
  it('returns 4 entries with correct ranges for defaults', () => {
    const legend = buildHeatmapLegend(DEFAULT_APPETITE_THRESHOLDS)
    expect(legend).toHaveLength(4)
    expect(legend[0]).toEqual({ band: 'LOW', label: 'Low', range: '1–4' })
    expect(legend[1]).toEqual({ band: 'MEDIUM', label: 'Medium', range: '5–9' })
    expect(legend[2]).toEqual({ band: 'HIGH', label: 'High', range: '10–14' })
    expect(legend[3]).toEqual({ band: 'CRITICAL', label: 'Critical', range: '15–25' })
  })

  it('adapts to custom thresholds', () => {
    const legend = buildHeatmapLegend({ low: 3, medium: 6, high: 12 })
    expect(legend[0].range).toBe('1–3')
    expect(legend[1].range).toBe('4–6')
    expect(legend[2].range).toBe('7–12')
    expect(legend[3].range).toBe('13–25')
  })
})

// ============================================
// countBreaches
// ============================================

describe('countBreaches', () => {
  const orgThresh = { low: 4, medium: 9, high: 14 }

  const risks = [
    { residualScore: 2, category: 'STRATEGIC' },
    { residualScore: 4, category: 'OPERATIONAL' },
    { residualScore: 9, category: 'FINANCIAL' },
    { residualScore: 10, category: 'COMPLIANCE' },
    { residualScore: 20, category: 'COMPLIANCE' },
    { residualScore: 15, category: 'TECHNOLOGY' },
  ]

  it('counts risks exceeding medium threshold', () => {
    const result = countBreaches(risks, orgThresh, null)
    expect(result.total).toBe(3) // scores 10, 20, 15
  })

  it('groups breaches by category', () => {
    const result = countBreaches(risks, orgThresh, null)
    expect(result.byCategory['COMPLIANCE']).toBe(2)
    expect(result.byCategory['TECHNOLOGY']).toBe(1)
    expect(result.byCategory['STRATEGIC']).toBeUndefined()
  })

  it('applies category overrides', () => {
    const catConfig = { COMPLIANCE: { low: 2, medium: 5, high: 8 } }
    const result = countBreaches(risks, orgThresh, catConfig)
    // COMPLIANCE risks: score 10 and 20 both exceed medium=5 → 2 breaches
    // TECHNOLOGY: score 15 exceeds org medium=9 → 1 breach
    // Total: 3
    expect(result.total).toBe(3)
    expect(result.byCategory['COMPLIANCE']).toBe(2)
  })

  it('returns zero for empty risk list', () => {
    const result = countBreaches([], orgThresh, null)
    expect(result.total).toBe(0)
    expect(result.byCategory).toEqual({})
  })

  it('returns zero when all risks within appetite', () => {
    const safeRisks = [
      { residualScore: 1, category: 'STRATEGIC' },
      { residualScore: 9, category: 'OPERATIONAL' },
    ]
    const result = countBreaches(safeRisks, orgThresh, null)
    expect(result.total).toBe(0)
  })
})
