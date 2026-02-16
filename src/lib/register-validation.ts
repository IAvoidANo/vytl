/**
 * Zod validation schemas for risk registers
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const registerStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])

// ============================================
// CREATE SCHEMA
// ============================================

export const createRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  status: registerStatusEnum.default('ACTIVE'),
})

// ============================================
// UPDATE SCHEMA
// ============================================

export const updateRegisterSchema = z.object({
  id: z.string().min(1, 'Register ID is required'),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: registerStatusEnum.optional(),
})

// ============================================
// DELETE SAFETY CHECKS (pure functions)
// ============================================

/**
 * Check if a register can be deleted.
 * Returns null if safe, or an error message string if not.
 */
export function canDeleteRegister(riskCount: number, totalRegisters: number): string | null {
  if (riskCount > 0) {
    return `Cannot delete register with ${riskCount} risk${riskCount !== 1 ? 's' : ''}. Move or delete risks first.`
  }
  if (totalRegisters <= 1) {
    return 'Cannot delete the only register. Create another register first.'
  }
  return null
}

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateRegisterInput = z.infer<typeof createRegisterSchema>
export type UpdateRegisterInput = z.infer<typeof updateRegisterSchema>
export type RegisterStatus = z.infer<typeof registerStatusEnum>
