import { describe, it, expect } from 'vitest'
import {
  createRegulatoryMappingSchema,
  updateRegulatoryMappingSchema,
  bulkCreateMappingsSchema,
  complianceStatusEnum,
  frameworkIdEnum,
  calculateCoverage,
  calculateOverallCoverage,
} from '@/lib/regulatory-validation'

describe('Regulatory Validation', () => {
  // ----------------------------------------
  // Create Schema
  // ----------------------------------------
  describe('createRegulatoryMappingSchema', () => {
    it('should accept valid input', () => {
      const result = createRegulatoryMappingSchema.safeParse({
        riskId: 'risk123',
        requirementCode: 'KING_V_P1_1',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.complianceStatus).toBe('NOT_ASSESSED')
      }
    })

    it('should accept input with all fields', () => {
      const result = createRegulatoryMappingSchema.safeParse({
        riskId: 'risk123',
        requirementCode: 'ISO_31000_PR1',
        complianceStatus: 'COMPLIANT',
        notes: 'Fully implemented with evidence',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty riskId', () => {
      const result = createRegulatoryMappingSchema.safeParse({
        riskId: '',
        requirementCode: 'KING_V_P1_1',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty requirementCode', () => {
      const result = createRegulatoryMappingSchema.safeParse({
        riskId: 'risk123',
        requirementCode: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject notes exceeding 1000 characters', () => {
      const result = createRegulatoryMappingSchema.safeParse({
        riskId: 'risk123',
        requirementCode: 'KING_V_P1_1',
        notes: 'x'.repeat(1001),
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid compliance status', () => {
      const result = createRegulatoryMappingSchema.safeParse({
        riskId: 'risk123',
        requirementCode: 'KING_V_P1_1',
        complianceStatus: 'APPROVED',
      })
      expect(result.success).toBe(false)
    })
  })

  // ----------------------------------------
  // Update Schema
  // ----------------------------------------
  describe('updateRegulatoryMappingSchema', () => {
    it('should accept status update', () => {
      const result = updateRegulatoryMappingSchema.safeParse({
        id: 'map123',
        complianceStatus: 'COMPLIANT',
      })
      expect(result.success).toBe(true)
    })

    it('should accept nullable notes', () => {
      const result = updateRegulatoryMappingSchema.safeParse({
        id: 'map123',
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing id', () => {
      const result = updateRegulatoryMappingSchema.safeParse({
        complianceStatus: 'COMPLIANT',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = updateRegulatoryMappingSchema.safeParse({
        id: 'map123',
        complianceStatus: 'DONE',
      })
      expect(result.success).toBe(false)
    })
  })

  // ----------------------------------------
  // Bulk Create Schema
  // ----------------------------------------
  describe('bulkCreateMappingsSchema', () => {
    it('should accept valid bulk input', () => {
      const result = bulkCreateMappingsSchema.safeParse({
        riskId: 'risk123',
        requirementCodes: ['KING_V_P1_1', 'KING_V_P1_2'],
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty requirementCodes array', () => {
      const result = bulkCreateMappingsSchema.safeParse({
        riskId: 'risk123',
        requirementCodes: [],
      })
      expect(result.success).toBe(false)
    })

    it('should default status to NOT_ASSESSED', () => {
      const result = bulkCreateMappingsSchema.safeParse({
        riskId: 'risk123',
        requirementCodes: ['KING_V_P1_1'],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.complianceStatus).toBe('NOT_ASSESSED')
      }
    })
  })

  // ----------------------------------------
  // Enums
  // ----------------------------------------
  describe('complianceStatusEnum', () => {
    it('should accept all 5 valid statuses', () => {
      for (const s of ['COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'NOT_ASSESSED', 'NOT_APPLICABLE']) {
        expect(complianceStatusEnum.safeParse(s).success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(complianceStatusEnum.safeParse('PENDING').success).toBe(false)
    })
  })

  describe('frameworkIdEnum', () => {
    it('should accept KING_V and ISO_31000', () => {
      expect(frameworkIdEnum.safeParse('KING_V').success).toBe(true)
      expect(frameworkIdEnum.safeParse('ISO_31000').success).toBe(true)
    })

    it('should reject invalid framework', () => {
      expect(frameworkIdEnum.safeParse('SOX').success).toBe(false)
    })
  })

  // ----------------------------------------
  // Coverage Calculations
  // ----------------------------------------
  describe('calculateCoverage', () => {
    it('should return 0% for empty mappings', () => {
      const result = calculateCoverage([], 'KING_V')
      expect(result.coveragePercent).toBe(0)
      expect(result.mappedRequirements).toBe(0)
      expect(result.totalRequirements).toBeGreaterThan(0)
    })

    it('should calculate correct percentage', () => {
      const result = calculateCoverage(
        [
          { requirementCode: 'KING_V_P1_1', complianceStatus: 'COMPLIANT' },
          { requirementCode: 'KING_V_P1_2', complianceStatus: 'NOT_ASSESSED' },
        ],
        'KING_V'
      )
      expect(result.mappedRequirements).toBe(2)
      expect(result.coveragePercent).toBe(Math.round((2 / result.totalRequirements) * 100))
    })

    it('should count status breakdown correctly', () => {
      const result = calculateCoverage(
        [
          { requirementCode: 'KING_V_P1_1', complianceStatus: 'COMPLIANT' },
          { requirementCode: 'KING_V_P1_2', complianceStatus: 'COMPLIANT' },
          { requirementCode: 'KING_V_P2_1', complianceStatus: 'NON_COMPLIANT' },
        ],
        'KING_V'
      )
      expect(result.byStatus.COMPLIANT).toBe(2)
      expect(result.byStatus.NON_COMPLIANT).toBe(1)
    })

    it('should ignore mappings from other frameworks', () => {
      const result = calculateCoverage(
        [
          { requirementCode: 'ISO_31000_PR1', complianceStatus: 'COMPLIANT' },
        ],
        'KING_V'
      )
      expect(result.mappedRequirements).toBe(0)
    })

    it('should deduplicate by requirement code', () => {
      const result = calculateCoverage(
        [
          { requirementCode: 'KING_V_P1_1', complianceStatus: 'COMPLIANT' },
          { requirementCode: 'KING_V_P1_1', complianceStatus: 'NOT_ASSESSED' },
        ],
        'KING_V'
      )
      expect(result.mappedRequirements).toBe(1)
    })
  })

  describe('calculateOverallCoverage', () => {
    it('should return 0% for empty mappings', () => {
      const result = calculateOverallCoverage([])
      expect(result.overallPercent).toBe(0)
      expect(result.frameworks).toHaveLength(2)
    })

    it('should aggregate across frameworks', () => {
      const result = calculateOverallCoverage([
        { requirementCode: 'KING_V_P1_1', complianceStatus: 'COMPLIANT' },
        { requirementCode: 'ISO_31000_PR1', complianceStatus: 'COMPLIANT' },
      ])
      expect(result.frameworks).toHaveLength(2)

      const kingV = result.frameworks.find((f) => f.frameworkId === 'KING_V')!
      expect(kingV.mappedRequirements).toBe(1)

      const iso = result.frameworks.find((f) => f.frameworkId === 'ISO_31000')!
      expect(iso.mappedRequirements).toBe(1)

      expect(result.overallPercent).toBeGreaterThan(0)
    })
  })
})
