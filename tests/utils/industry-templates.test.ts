import { describe, it, expect } from 'vitest'
import {
  INDUSTRY_TEMPLATES,
  MANUFACTURING_TEMPLATE,
  FINANCIAL_SERVICES_TEMPLATE,
  RETAIL_TEMPLATE,
  getTemplateByCode,
  getAllTemplates,
  calculateTemplateRiskScores,
  validateTemplate,
} from '@/lib/industry-templates'
import { RISK_CATEGORIES } from '@/lib/appetite-validation'

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('INDUSTRY_TEMPLATES registry', () => {
  it('exports exactly 3 templates', () => {
    expect(INDUSTRY_TEMPLATES).toHaveLength(3)
  })

  it('contains MANUFACTURING, FINANCIAL_SERVICES and RETAIL codes', () => {
    const codes = INDUSTRY_TEMPLATES.map((t) => t.code)
    expect(codes).toContain('MANUFACTURING')
    expect(codes).toContain('FINANCIAL_SERVICES')
    expect(codes).toContain('RETAIL')
  })
})

// ---------------------------------------------------------------------------
// getTemplateByCode
// ---------------------------------------------------------------------------

describe('getTemplateByCode', () => {
  it('returns the correct template for each valid code', () => {
    expect(getTemplateByCode('MANUFACTURING')).toBe(MANUFACTURING_TEMPLATE)
    expect(getTemplateByCode('FINANCIAL_SERVICES')).toBe(FINANCIAL_SERVICES_TEMPLATE)
    expect(getTemplateByCode('RETAIL')).toBe(RETAIL_TEMPLATE)
  })

  it('returns undefined for an unknown code', () => {
    // @ts-expect-error intentional invalid code
    expect(getTemplateByCode('UNKNOWN')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getAllTemplates
// ---------------------------------------------------------------------------

describe('getAllTemplates', () => {
  it('returns the same array as INDUSTRY_TEMPLATES', () => {
    expect(getAllTemplates()).toStrictEqual(INDUSTRY_TEMPLATES)
  })
})

// ---------------------------------------------------------------------------
// Template data integrity — all 3 templates
// ---------------------------------------------------------------------------

describe.each(INDUSTRY_TEMPLATES)('Template "$name" data integrity', (template) => {
  it('has exactly 15 risks', () => {
    expect(template.risks).toHaveLength(15)
  })

  it('every risk has a valid category', () => {
    template.risks.forEach((r) => {
      expect(RISK_CATEGORIES).toContain(r.category)
    })
  })

  it('all likelihood/impact values are integers in range 1–5', () => {
    template.risks.forEach((r) => {
      for (const val of [
        r.inherentLikelihood,
        r.inherentImpact,
        r.residualLikelihood,
        r.residualImpact,
      ]) {
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(5)
        expect(Number.isInteger(val)).toBe(true)
      }
    })
  })

  it('residual score does not exceed inherent score for any risk', () => {
    template.risks.forEach((r) => {
      const inherent = r.inherentLikelihood * r.inherentImpact
      const residual = r.residualLikelihood * r.residualImpact
      expect(residual).toBeLessThanOrEqual(inherent)
    })
  })

  it('required text fields are non-empty for every risk', () => {
    template.risks.forEach((r) => {
      expect(r.title.trim()).not.toBe('')
      expect(r.description.trim()).not.toBe('')
      expect(r.controls.trim()).not.toBe('')
      expect(r.rootCause.trim()).not.toBe('')
    })
  })

  it('benchmarkScore is a number between 0 and 100', () => {
    expect(template.benchmarkScore).toBeGreaterThanOrEqual(0)
    expect(template.benchmarkScore).toBeLessThanOrEqual(100)
  })
})

// ---------------------------------------------------------------------------
// calculateTemplateRiskScores
// ---------------------------------------------------------------------------

describe('calculateTemplateRiskScores', () => {
  it('appends correct inherentScore and residualScore', () => {
    const risks = MANUFACTURING_TEMPLATE.risks.slice(0, 3)
    const scored = calculateTemplateRiskScores(risks)

    scored.forEach((r) => {
      expect(r.inherentScore).toBe(r.inherentLikelihood * r.inherentImpact)
      expect(r.residualScore).toBe(r.residualLikelihood * r.residualImpact)
    })
  })

  it('preserves all original fields', () => {
    const [first] = RETAIL_TEMPLATE.risks
    const [scored] = calculateTemplateRiskScores([first])
    expect(scored.title).toBe(first.title)
    expect(scored.category).toBe(first.category)
    expect(scored.isOngoing).toBe(first.isOngoing)
  })

  it('handles an empty array without error', () => {
    expect(calculateTemplateRiskScores([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// validateTemplate
// ---------------------------------------------------------------------------

describe('validateTemplate', () => {
  it('returns an empty array for valid built-in templates', () => {
    expect(validateTemplate(MANUFACTURING_TEMPLATE)).toEqual([])
    expect(validateTemplate(FINANCIAL_SERVICES_TEMPLATE)).toEqual([])
    expect(validateTemplate(RETAIL_TEMPLATE)).toEqual([])
  })

  it('reports an error when residual score exceeds inherent score', () => {
    const badTemplate = {
      ...MANUFACTURING_TEMPLATE,
      risks: [
        {
          ...MANUFACTURING_TEMPLATE.risks[0],
          residualLikelihood: 5,
          residualImpact: 5,
          inherentLikelihood: 1,
          inherentImpact: 1,
        },
      ],
    }
    const errors = validateTemplate(badTemplate)
    expect(errors.some((e) => e.includes('residualScore'))).toBe(true)
  })

  it('reports an error for an out-of-range likelihood value', () => {
    const badTemplate = {
      ...MANUFACTURING_TEMPLATE,
      risks: [
        {
          ...MANUFACTURING_TEMPLATE.risks[0],
          inherentLikelihood: 6, // invalid
        },
      ],
    }
    const errors = validateTemplate(badTemplate)
    expect(errors.some((e) => e.includes('inherentLikelihood'))).toBe(true)
  })

  it('reports an error for an unknown category', () => {
    const badTemplate = {
      ...RETAIL_TEMPLATE,
      risks: [
        {
          ...RETAIL_TEMPLATE.risks[0],
          category: 'UNKNOWN_CATEGORY' as never,
        },
      ],
    }
    const errors = validateTemplate(badTemplate)
    expect(errors.some((e) => e.includes('category'))).toBe(true)
  })

  it('reports an error for empty title', () => {
    const badTemplate = {
      ...RETAIL_TEMPLATE,
      risks: [
        {
          ...RETAIL_TEMPLATE.risks[0],
          title: '   ',
        },
      ],
    }
    const errors = validateTemplate(badTemplate)
    expect(errors.some((e) => e.includes('title'))).toBe(true)
  })

  it('reports an error for an invalid benchmarkScore', () => {
    const badTemplate = { ...MANUFACTURING_TEMPLATE, benchmarkScore: 150 }
    const errors = validateTemplate(badTemplate)
    expect(errors.some((e) => e.includes('benchmarkScore'))).toBe(true)
  })
})
