/**
 * Zod validation schemas for treatment actions
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const actionPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export const actionStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export const PRIORITY_ORDER: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
}

// ============================================
// CREATE SCHEMA
// ============================================

export const createTreatmentActionSchema = z.object({
  riskId: z.string().min(1, 'Risk ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: actionPriorityEnum.default('MEDIUM'),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

// ============================================
// UPDATE SCHEMA
// ============================================

export const updateTreatmentActionSchema = z.object({
  id: z.string().min(1, 'Action ID is required'),
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: actionPriorityEnum.optional(),
  status: actionStatusEnum.optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
})

// ============================================
// STATUS TRANSITION LOGIC
// ============================================

/**
 * Returns completedAt value based on status transition.
 * When status changes to COMPLETED, returns current date.
 * When status changes away from COMPLETED, returns null.
 * Otherwise returns undefined (no change).
 */
export function getCompletedAtForStatus(
  newStatus: string | undefined,
  currentStatus: string
): Date | null | undefined {
  if (!newStatus || newStatus === currentStatus) return undefined
  if (newStatus === 'COMPLETED') return new Date()
  if (currentStatus === 'COMPLETED' && newStatus !== 'COMPLETED') return null
  return undefined
}

/**
 * Sort actions by priority (CRITICAL first) then by createdAt
 */
export function sortByPriority<T extends { priority: string; createdAt: Date | string }>(
  actions: T[]
): T[] {
  return [...actions].sort((a, b) => {
    const priorityDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateTreatmentActionInput = z.infer<typeof createTreatmentActionSchema>
export type UpdateTreatmentActionInput = z.infer<typeof updateTreatmentActionSchema>
export type ActionPriority = z.infer<typeof actionPriorityEnum>
export type ActionStatus = z.infer<typeof actionStatusEnum>
