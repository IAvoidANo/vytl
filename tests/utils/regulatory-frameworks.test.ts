import { describe, it, expect } from 'vitest'
import {
  getAllFrameworks,
  getFramework,
  getRequirement,
  getRequirementsByFramework,
  getRequirementsForCategory,
  getAllRequirementCodes,
  isValidRequirementCode,
  COMPLIANCE_STATUSES,
  FRAMEWORK_IDS,
} from '@/lib/regulatory-frameworks'

const VALID_CATEGORIES = [
  'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
  'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE', 'HEALTH_SAFETY',
]

describe('Regulatory Frameworks', () => {
  describe('getAllFrameworks', () => {
    it('should return exactly 2 frameworks', () => {
      expect(getAllFrameworks()).toHaveLength(2)
    })

    it('should contain King V and ISO 31000', () => {
      const ids = getAllFrameworks().map((f) => f.id)
      expect(ids).toContain('KING_V')
      expect(ids).toContain('ISO_31000')
    })
  })

  describe('getFramework', () => {
    it('should return King V framework', () => {
      const fw = getFramework('KING_V')
      expect(fw).not.toBeNull()
      expect(fw!.name).toBe('King V Code')
      expect(fw!.requirements.length).toBeGreaterThan(0)
    })

    it('should return ISO 31000 framework', () => {
      const fw = getFramework('ISO_31000')
      expect(fw).not.toBeNull()
      expect(fw!.name).toBe('ISO 31000:2018')
    })

    it('should return null for invalid framework', () => {
      expect(getFramework('INVALID')).toBeNull()
    })
  })

  describe('King V data integrity', () => {
    it('should have 13 principles covered', () => {
      const reqs = getRequirementsByFramework('KING_V')
      const principles = new Set(reqs.map((r) => r.principle))
      expect(principles.size).toBe(13)
    })

    it('should have all requirement codes starting with KING_V_P', () => {
      const reqs = getRequirementsByFramework('KING_V')
      for (const req of reqs) {
        expect(req.code).toMatch(/^KING_V_P\d+_\d+$/)
      }
    })

    it('should have at least 30 requirements', () => {
      const reqs = getRequirementsByFramework('KING_V')
      expect(reqs.length).toBeGreaterThanOrEqual(30)
    })
  })

  describe('ISO 31000 data integrity', () => {
    it('should have Principles and Process groups', () => {
      const reqs = getRequirementsByFramework('ISO_31000')
      const principles = new Set(reqs.map((r) => r.principle))
      expect(principles.has('Principles')).toBe(true)
      expect(principles.has('Process')).toBe(true)
    })

    it('should have 8 principles and 8 process steps', () => {
      const reqs = getRequirementsByFramework('ISO_31000')
      const principles = reqs.filter((r) => r.code.includes('_PR'))
      const processes = reqs.filter((r) => r.code.includes('_PS'))
      expect(principles).toHaveLength(8)
      expect(processes).toHaveLength(8)
    })

    it('should have all requirement codes starting with ISO_31000_', () => {
      const reqs = getRequirementsByFramework('ISO_31000')
      for (const req of reqs) {
        expect(req.code).toMatch(/^ISO_31000_(PR|PS)\d+$/)
      }
    })
  })

  describe('requirement codes uniqueness', () => {
    it('should have all unique codes across both frameworks', () => {
      const codes = getAllRequirementCodes()
      const uniqueCodes = new Set(codes)
      expect(codes.length).toBe(uniqueCodes.size)
    })
  })

  describe('getRequirement', () => {
    it('should return a valid King V requirement', () => {
      const req = getRequirement('KING_V_P8_1')
      expect(req).not.toBeNull()
      expect(req!.frameworkId).toBe('KING_V')
      expect(req!.principle).toContain('Risk Management')
    })

    it('should return a valid ISO 31000 requirement', () => {
      const req = getRequirement('ISO_31000_PR1')
      expect(req).not.toBeNull()
      expect(req!.frameworkId).toBe('ISO_31000')
    })

    it('should return null for invalid code', () => {
      expect(getRequirement('INVALID_CODE')).toBeNull()
    })
  })

  describe('getRequirementsForCategory', () => {
    it('should return requirements for COMPLIANCE', () => {
      const reqs = getRequirementsForCategory('COMPLIANCE')
      expect(reqs.length).toBeGreaterThan(0)
      for (const req of reqs) {
        expect(req.riskCategories).toContain('COMPLIANCE')
      }
    })

    it('should return requirements for TECHNOLOGY', () => {
      const reqs = getRequirementsForCategory('TECHNOLOGY')
      expect(reqs.length).toBeGreaterThan(0)
    })

    it('should return empty array for invalid category', () => {
      expect(getRequirementsForCategory('NONEXISTENT')).toHaveLength(0)
    })
  })

  describe('isValidRequirementCode', () => {
    it('should return true for valid King V code', () => {
      expect(isValidRequirementCode('KING_V_P1_1')).toBe(true)
    })

    it('should return true for valid ISO 31000 code', () => {
      expect(isValidRequirementCode('ISO_31000_PR1')).toBe(true)
    })

    it('should return false for invalid code', () => {
      expect(isValidRequirementCode('FAKE_CODE')).toBe(false)
    })
  })

  describe('data quality', () => {
    it('should have non-empty title for every requirement', () => {
      const codes = getAllRequirementCodes()
      for (const code of codes) {
        const req = getRequirement(code)!
        expect(req.title.length).toBeGreaterThan(0)
      }
    })

    it('should only reference valid risk categories', () => {
      const codes = getAllRequirementCodes()
      for (const code of codes) {
        const req = getRequirement(code)!
        for (const cat of req.riskCategories) {
          expect(VALID_CATEGORIES).toContain(cat)
        }
      }
    })

    it('should have at least one risk category per requirement', () => {
      const codes = getAllRequirementCodes()
      for (const code of codes) {
        const req = getRequirement(code)!
        expect(req.riskCategories.length).toBeGreaterThan(0)
      }
    })
  })

  describe('constants', () => {
    it('should have 5 compliance statuses', () => {
      expect(COMPLIANCE_STATUSES).toHaveLength(5)
    })

    it('should have 2 framework IDs', () => {
      expect(FRAMEWORK_IDS).toHaveLength(2)
    })
  })
})
