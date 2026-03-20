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
// ORG-WIDE LIST SCHEMA
// ============================================

export const actionSortByEnum = z.enum(['dueDate', 'priority', 'createdAt', 'riskTitle'])

export const listAllActionsSchema = z.object({
  status: actionStatusEnum.optional(),
  priority: actionPriorityEnum.optional(),
  assigneeId: z.string().optional(),
  overdueOnly: z.boolean().optional(),
  sortBy: actionSortByEnum.optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

// ============================================
// OVERDUE HELPERS
// ============================================

/**
 * Returns true when an action is past its due date and not yet completed/cancelled.
 */
export function isOverdue(action: { dueDate: Date | string | null; status: string }): boolean {
  if (!action.dueDate) return false
  if (action.status === 'COMPLETED' || action.status === 'CANCELLED') return false
  return new Date(action.dueDate) < new Date()
}

/**
 * Builds an overdue summary from a list of actions (pure, no DB).
 */
export function buildOverdueSummary(
  actions: Array<{ dueDate: Date | string | null; status: string; priority: string }>
): {
  total: number
  overdue: number
  byPriority: Record<string, number>
} {
  const overdue = actions.filter(isOverdue)
  const byPriority: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  for (const a of overdue) {
    if (a.priority in byPriority) byPriority[a.priority]++
  }
  return { total: actions.length, overdue: overdue.length, byPriority }
}

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateTreatmentActionInput = z.infer<typeof createTreatmentActionSchema>
export type UpdateTreatmentActionInput = z.infer<typeof updateTreatmentActionSchema>
export type ActionPriority = z.infer<typeof actionPriorityEnum>
export type ActionStatus = z.infer<typeof actionStatusEnum>
export type ListAllActionsInput = z.infer<typeof listAllActionsSchema>
