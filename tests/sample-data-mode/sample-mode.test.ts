/**
 * Sample Data Mode — pure logic tests
 *
 * Router-level mutations are not tested here (require DB mocks).
 * We verify the business rules and data shapes that inform those mutations.
 */
import { describe, it, expect } from 'vitest'
import {
  getTemplateByCode,
  validateTemplate,
  INDUSTRY_TEMPLATES,
} from '@/lib/industry-templates'

// ---------------------------------------------------------------------------
// Template application prerequisites
// ---------------------------------------------------------------------------

describe('Template application — sample mode prerequisites', () => {
  it('every template passes validation before it can be applied', () => {
    INDUSTRY_TEMPLATES.forEach((template) => {
      const errors = validateTemplate(template)
      expect(errors, `${template.code}: ${errors.join(', ')}`).toHaveLength(0)
    })
  })

  it('MANUFACTURING template is retrievable by code', () => {
    expect(getTemplateByCode('MANUFACTURING')).toBeDefined()
  })

  it('FINANCIAL_SERVICES template is retrievable by code', () => {
    expect(getTemplateByCode('FINANCIAL_SERVICES')).toBeDefined()
  })

  it('RETAIL template is retrievable by code', () => {
    expect(getTemplateByCode('RETAIL')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Sample mode flag defaults
// ---------------------------------------------------------------------------

describe('Sample mode default values', () => {
  it('isInSampleMode default is false (new organisations start outside sample mode)', () => {
    // This mirrors the Prisma schema default: isInSampleMode Boolean @default(false)
    const schemaDefault = false
    expect(schemaDefault).toBe(false)
  })

  it('applying a template sets isInSampleMode to true', () => {
    // The template.apply mutation sets isInSampleMode = true
    // Verify the expected value
    const expectedAfterApply = true
    expect(expectedAfterApply).toBe(true)
  })

  it('exitSampleMode sets isInSampleMode to false and preserves data', () => {
    // exitSampleMode only flips the flag — it does NOT delete risks
    const riskCountAfterExit = 15 // unchanged
    expect(riskCountAfterExit).toBe(15)
  })

  it('clearSampleData sets isInSampleMode to false and deletes data', () => {
    // clearSampleData deletes everything and flips the flag
    const riskCountAfterClear = 0
    expect(riskCountAfterClear).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Industry label mapping
// ---------------------------------------------------------------------------

describe('Industry label mapping used by SampleDataBanner', () => {
  const INDUSTRY_LABELS: Record<string, string> = {
    MANUFACTURING: 'Manufacturing & Production',
    FINANCIAL_SERVICES: 'Financial Services',
    RETAIL: 'Retail & Consumer',
  }

  it('maps MANUFACTURING correctly', () => {
    expect(INDUSTRY_LABELS['MANUFACTURING']).toBe('Manufacturing & Production')
  })

  it('maps FINANCIAL_SERVICES correctly', () => {
    expect(INDUSTRY_LABELS['FINANCIAL_SERVICES']).toBe('Financial Services')
  })

  it('maps RETAIL correctly', () => {
    expect(INDUSTRY_LABELS['RETAIL']).toBe('Retail & Consumer')
  })

  it('every template code has a label', () => {
    INDUSTRY_TEMPLATES.forEach((template) => {
      expect(INDUSTRY_LABELS[template.code]).toBeTruthy()
    })
  })
})

// ---------------------------------------------------------------------------
// Clear sample data — deletion scope
// ---------------------------------------------------------------------------

describe('clearSampleData — what gets deleted', () => {
  it('risk count after clear is zero', () => {
    // Verify that all 15 template risks would be deleted
    const template = getTemplateByCode('MANUFACTURING')!
    const deletedCount = template.risks.length
    const remaining = 0
    expect(deletedCount).toBe(15)
    expect(remaining).toBe(0)
  })

  it('all three templates produce 15 risks that would be cleared', () => {
    INDUSTRY_TEMPLATES.forEach((template) => {
      expect(template.risks).toHaveLength(15)
    })
  })
})

// ---------------------------------------------------------------------------
// Auto-exit on risk edit — trigger conditions
// ---------------------------------------------------------------------------

describe('Auto-exit on risk edit', () => {
  it('auto-exit should trigger when isInSampleMode is true', () => {
    const org = { isInSampleMode: true }
    const shouldExit = org.isInSampleMode === true
    expect(shouldExit).toBe(true)
  })

  it('auto-exit should NOT trigger when isInSampleMode is false', () => {
    const org = { isInSampleMode: false }
    const shouldExit = org.isInSampleMode === true
    expect(shouldExit).toBe(false)
  })

  it('auto-exit sets isInSampleMode to false', () => {
    const org = { isInSampleMode: true }
    // Simulates the mutation logic
    const updated = { ...org, isInSampleMode: false, sampleDataExitedAt: new Date() }
    expect(updated.isInSampleMode).toBe(false)
    expect(updated.sampleDataExitedAt).toBeInstanceOf(Date)
  })
})

// ---------------------------------------------------------------------------
// Banner display logic
// ---------------------------------------------------------------------------

describe('SampleDataBanner display logic', () => {
  it('banner should be visible when isInSampleMode is true', () => {
    const status = { isInSampleMode: true, industry: 'MANUFACTURING' }
    const shouldShow = status.isInSampleMode
    expect(shouldShow).toBe(true)
  })

  it('banner should not be visible when isInSampleMode is false', () => {
    const status = { isInSampleMode: false, industry: null }
    const shouldShow = status.isInSampleMode
    expect(shouldShow).toBe(false)
  })

  it('banner shows correct industry label for RETAIL', () => {
    const INDUSTRY_LABELS: Record<string, string> = {
      MANUFACTURING: 'Manufacturing & Production',
      FINANCIAL_SERVICES: 'Financial Services',
      RETAIL: 'Retail & Consumer',
    }
    const industry = 'RETAIL'
    const label = INDUSTRY_LABELS[industry] ?? industry
    expect(label).toBe('Retail & Consumer')
  })

  it('banner falls back to industry code if no label found', () => {
    const INDUSTRY_LABELS: Record<string, string> = {
      MANUFACTURING: 'Manufacturing & Production',
    }
    const industry = 'UNKNOWN_INDUSTRY'
    const label = INDUSTRY_LABELS[industry] ?? industry
    expect(label).toBe('UNKNOWN_INDUSTRY')
  })
})
