/**
 * Zod validation schemas and coverage calculation for regulatory mappings
 */

import { z } from 'zod'
import {
  COMPLIANCE_STATUSES,
  FRAMEWORK_IDS,
  type FrameworkId,
  getRequirementsByFramework,
  getAllFrameworks,
  getFramework,
} from './regulatory-frameworks'

// ============================================
// ENUMS
// ============================================

export const complianceStatusEnum = z.enum(COMPLIANCE_STATUSES)
export const frameworkIdEnum = z.enum(FRAMEWORK_IDS)

// ============================================
// CREATE SCHEMA
// ============================================

export const createRegulatoryMappingSchema = z.object({
  riskId: z.string().min(1, 'Risk ID is required'),
  requirementCode: z.string().min(1, 'Requirement code is required'),
  complianceStatus: complianceStatusEnum.default('NOT_ASSESSED'),
  notes: z.string().max(1000).optional(),
})

// ============================================
// UPDATE SCHEMA
// ============================================

export const updateRegulatoryMappingSchema = z.object({
  id: z.string().min(1, 'Mapping ID is required'),
  complianceStatus: complianceStatusEnum.optional(),
  notes: z.string().max(1000).nullable().optional(),
})

// ============================================
// BULK CREATE SCHEMA
// ============================================

export const bulkCreateMappingsSchema = z.object({
  riskId: z.string().min(1, 'Risk ID is required'),
  requirementCodes: z.array(z.string().min(1)).min(1, 'At least one requirement is required'),
  complianceStatus: complianceStatusEnum.default('NOT_ASSESSED'),
})

// ============================================
// COVERAGE QUERY SCHEMA
// ============================================

export const coverageQuerySchema = z.object({
  frameworkId: frameworkIdEnum.optional(),
  registerId: z.string().optional(),
})

// ============================================
// COVERAGE CALCULATION (pure functions)
// ============================================

export interface CoverageResult {
  frameworkId: string
  frameworkName: string
  totalRequirements: number
  mappedRequirements: number
  coveragePercent: number
  byStatus: Record<string, number>
}

/**
 * Calculate coverage for a single framework given a set of mappings.
 */
export function calculateCoverage(
  mappings: Array<{ requirementCode: string; complianceStatus: string }>,
  frameworkId: FrameworkId
): CoverageResult {
  const fw = getFramework(frameworkId)
  const requirements = getRequirementsByFramework(frameworkId)
  const totalRequirements = requirements.length

  // Filter mappings to this framework's requirement codes
  const fwCodes = new Set(requirements.map((r) => r.code))
  const fwMappings = mappings.filter((m) => fwCodes.has(m.requirementCode))

  // Deduplicate by requirement code (in case multiple risks map to same requirement)
  const uniqueCodes = new Set(fwMappings.map((m) => m.requirementCode))
  const mappedRequirements = uniqueCodes.size

  // Count by status
  const byStatus: Record<string, number> = {
    COMPLIANT: 0,
    PARTIALLY_COMPLIANT: 0,
    NON_COMPLIANT: 0,
    NOT_ASSESSED: 0,
    NOT_APPLICABLE: 0,
  }
  for (const m of fwMappings) {
    byStatus[m.complianceStatus] = (byStatus[m.complianceStatus] || 0) + 1
  }

  const coveragePercent =
    totalRequirements > 0 ? Math.round((mappedRequirements / totalRequirements) * 100) : 0

  return {
    frameworkId,
    frameworkName: fw?.name ?? frameworkId,
    totalRequirements,
    mappedRequirements,
    coveragePercent,
    byStatus,
  }
}

/**
 * Calculate coverage across all frameworks.
 */
export function calculateOverallCoverage(
  mappings: Array<{ requirementCode: string; complianceStatus: string }>
): { frameworks: CoverageResult[]; overallPercent: number } {
  const frameworks = getAllFrameworks().map((fw) =>
    calculateCoverage(mappings, fw.id)
  )

  const totalReqs = frameworks.reduce((sum, f) => sum + f.totalRequirements, 0)
  const totalMapped = frameworks.reduce((sum, f) => sum + f.mappedRequirements, 0)
  const overallPercent = totalReqs > 0 ? Math.round((totalMapped / totalReqs) * 100) : 0

  return { frameworks, overallPercent }
}

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateRegulatoryMappingInput = z.infer<typeof createRegulatoryMappingSchema>
export type UpdateRegulatoryMappingInput = z.infer<typeof updateRegulatoryMappingSchema>
export type BulkCreateMappingsInput = z.infer<typeof bulkCreateMappingsSchema>
