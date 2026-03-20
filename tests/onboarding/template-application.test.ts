import { describe, it, expect } from 'vitest'
import {
  getTemplateByCode,
  getAllTemplates,
  validateTemplate,
  calculateTemplateRiskScores,
  INDUSTRY_TEMPLATES,
  type IndustryCode,
} from '@/lib/industry-templates'

// ---------------------------------------------------------------------------
// Template availability
// ---------------------------------------------------------------------------

describe('Template availability', () => {
  it('all three industry templates can be retrieved', () => {
    const codes: IndustryCode[] = ['MANUFACTURING', 'FINANCIAL_SERVICES', 'RETAIL']
    codes.forEach((code) => {
      expect(getTemplateByCode(code)).toBeDefined()
    })
  })

  it('getAllTemplates returns 3 templates', () => {
    expect(getAllTemplates()).toHaveLength(3)
  })

  it('unknown code returns undefined', () => {
    // @ts-expect-error intentional invalid code
    expect(getTemplateByCode('MINING')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Template data validation
// ---------------------------------------------------------------------------

describe('Template data validation', () => {
  it('all templates pass validateTemplate', () => {
    INDUSTRY_TEMPLATES.forEach((template) => {
      const errors = validateTemplate(template)
      expect(errors, `${template.code} errors: ${errors.join(', ')}`).toHaveLength(0)
    })
  })

  it('manufacturing template has correct properties', () => {
    const template = getTemplateByCode('MANUFACTURING')
    expect(template).toBeDefined()
    expect(template!.risks).toHaveLength(15)
    expect(template!.benchmarkScore).toBe(58)
    expect(template!.name).toBeTruthy()
    expect(template!.description).toBeTruthy()
  })

  it('financial services template has correct properties', () => {
    const template = getTemplateByCode('FINANCIAL_SERVICES')
    expect(template).toBeDefined()
    expect(template!.risks).toHaveLength(15)
    expect(template!.benchmarkScore).toBe(62)
  })

  it('retail template has correct properties', () => {
    const template = getTemplateByCode('RETAIL')
    expect(template).toBeDefined()
    expect(template!.risks).toHaveLength(15)
    expect(template!.benchmarkScore).toBe(54)
  })
})

// ---------------------------------------------------------------------------
// Template risk structure
// ---------------------------------------------------------------------------

describe('Template risk structure', () => {
  it('all manufacturing risks have required fields and valid scores', () => {
    const template = getTemplateByCode('MANUFACTURING')!
    template.risks.forEach((risk) => {
      expect(risk.title.trim()).not.toBe('')
      expect(risk.description.trim()).not.toBe('')
      expect(risk.controls.trim()).not.toBe('')
      expect(risk.rootCause.trim()).not.toBe('')
      expect(risk.inherentLikelihood).toBeGreaterThanOrEqual(1)
      expect(risk.inherentImpact).toBeLessThanOrEqual(5)
      // residual ≤ inherent
      expect(risk.residualLikelihood * risk.residualImpact).toBeLessThanOrEqual(
        risk.inherentLikelihood * risk.inherentImpact
      )
    })
  })

  it('descriptions are substantial (>100 chars) for all templates', () => {
    INDUSTRY_TEMPLATES.forEach((template) => {
      template.risks.forEach((risk) => {
        expect(
          risk.description.length,
          `${template.code} — "${risk.title}" description too short`
        ).toBeGreaterThan(100)
      })
    })
  })
})

// ---------------------------------------------------------------------------
// calculateTemplateRiskScores
// ---------------------------------------------------------------------------

describe('calculateTemplateRiskScores', () => {
  it('correctly computes inherentScore and residualScore', () => {
    const template = getTemplateByCode('RETAIL')!
    const scored = calculateTemplateRiskScores(template.risks)

    scored.forEach((r) => {
      expect(r.inherentScore).toBe(r.inherentLikelihood * r.inherentImpact)
      expect(r.residualScore).toBe(r.residualLikelihood * r.residualImpact)
    })
  })

  it('preserves all original fields', () => {
    const [risk] = getTemplateByCode('FINANCIAL_SERVICES')!.risks
    const [scored] = calculateTemplateRiskScores([risk])
    expect(scored.title).toBe(risk.title)
    expect(scored.category).toBe(risk.category)
    expect(scored.controls).toBe(risk.controls)
    expect(scored.isOngoing).toBe(risk.isOngoing)
  })
})

// ---------------------------------------------------------------------------
// Template application prerequisites
// ---------------------------------------------------------------------------

describe('Template application prerequisites', () => {
  it('template has sufficient risk coverage across categories', () => {
    // Each template should cover at least 5 distinct categories
    INDUSTRY_TEMPLATES.forEach((template) => {
      const categories = new Set(template.risks.map((r) => r.category))
      expect(
        categories.size,
        `${template.code} covers only ${categories.size} categories`
      ).toBeGreaterThanOrEqual(5)
    })
  })

  it('all risk scores produce valid L×I products (1-25)', () => {
    INDUSTRY_TEMPLATES.forEach((template) => {
      template.risks.forEach((risk) => {
        const inherent = risk.inherentLikelihood * risk.inherentImpact
        const residual = risk.residualLikelihood * risk.residualImpact
        expect(inherent).toBeGreaterThanOrEqual(1)
        expect(inherent).toBeLessThanOrEqual(25)
        expect(residual).toBeGreaterThanOrEqual(1)
        expect(residual).toBeLessThanOrEqual(25)
      })
    })
  })
})
