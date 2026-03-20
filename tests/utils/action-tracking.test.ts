import { describe, it, expect } from 'vitest'
import {
  isOverdue,
  buildOverdueSummary,
  listAllActionsSchema,
} from '@/lib/treatment-validation'

// ============================================
// isOverdue
// ============================================

describe('isOverdue', () => {
  const yesterday = new Date(Date.now() - 86_400_000)
  const tomorrow = new Date(Date.now() + 86_400_000)

  it('returns false when dueDate is null', () => {
    expect(isOverdue({ dueDate: null, status: 'OPEN' })).toBe(false)
  })

  it('returns false when status is COMPLETED', () => {
    expect(isOverdue({ dueDate: yesterday, status: 'COMPLETED' })).toBe(false)
  })

  it('returns false when status is CANCELLED', () => {
    expect(isOverdue({ dueDate: yesterday, status: 'CANCELLED' })).toBe(false)
  })

  it('returns false when dueDate is in the future', () => {
    expect(isOverdue({ dueDate: tomorrow, status: 'OPEN' })).toBe(false)
  })

  it('returns true when past due and status is OPEN', () => {
    expect(isOverdue({ dueDate: yesterday, status: 'OPEN' })).toBe(true)
  })

  it('returns true when past due and status is IN_PROGRESS', () => {
    expect(isOverdue({ dueDate: yesterday, status: 'IN_PROGRESS' })).toBe(true)
  })

  it('accepts string dates', () => {
    expect(isOverdue({ dueDate: yesterday.toISOString(), status: 'OPEN' })).toBe(true)
    expect(isOverdue({ dueDate: tomorrow.toISOString(), status: 'OPEN' })).toBe(false)
  })
})

// ============================================
// buildOverdueSummary
// ============================================

describe('buildOverdueSummary', () => {
  const yesterday = new Date(Date.now() - 86_400_000)
  const tomorrow = new Date(Date.now() + 86_400_000)

  it('returns zeros for empty array', () => {
    const result = buildOverdueSummary([])
    expect(result.total).toBe(0)
    expect(result.overdue).toBe(0)
    expect(result.byPriority).toEqual({ LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 })
  })

  it('counts total and overdue correctly', () => {
    const actions = [
      { dueDate: yesterday, status: 'OPEN', priority: 'HIGH' },
      { dueDate: yesterday, status: 'IN_PROGRESS', priority: 'MEDIUM' },
      { dueDate: tomorrow, status: 'OPEN', priority: 'LOW' },
    ]
    const result = buildOverdueSummary(actions)
    expect(result.total).toBe(3)
    expect(result.overdue).toBe(2)
  })

  it('groups overdue counts by priority', () => {
    const actions = [
      { dueDate: yesterday, status: 'OPEN', priority: 'CRITICAL' },
      { dueDate: yesterday, status: 'OPEN', priority: 'CRITICAL' },
      { dueDate: yesterday, status: 'OPEN', priority: 'HIGH' },
      { dueDate: yesterday, status: 'OPEN', priority: 'LOW' },
    ]
    const result = buildOverdueSummary(actions)
    expect(result.byPriority.CRITICAL).toBe(2)
    expect(result.byPriority.HIGH).toBe(1)
    expect(result.byPriority.LOW).toBe(1)
    expect(result.byPriority.MEDIUM).toBe(0)
  })

  it('excludes COMPLETED/CANCELLED from overdue count even if past due', () => {
    const actions = [
      { dueDate: yesterday, status: 'COMPLETED', priority: 'HIGH' },
      { dueDate: yesterday, status: 'CANCELLED', priority: 'MEDIUM' },
      { dueDate: yesterday, status: 'OPEN', priority: 'LOW' },
    ]
    const result = buildOverdueSummary(actions)
    expect(result.total).toBe(3)
    expect(result.overdue).toBe(1)
  })

  it('returns all four byPriority keys even when counts are zero', () => {
    const result = buildOverdueSummary([
      { dueDate: yesterday, status: 'OPEN', priority: 'HIGH' },
    ])
    expect(Object.keys(result.byPriority)).toEqual(
      expect.arrayContaining(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    )
  })
})

// ============================================
// listAllActionsSchema
// ============================================

describe('listAllActionsSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(() => listAllActionsSchema.parse({})).not.toThrow()
  })

  it('accepts a fully populated valid input', () => {
    const result = listAllActionsSchema.parse({
      status: 'OPEN',
      priority: 'HIGH',
      assigneeId: 'user-123',
      overdueOnly: true,
      sortBy: 'dueDate',
      sortDir: 'desc',
    })
    expect(result.status).toBe('OPEN')
    expect(result.sortDir).toBe('desc')
  })

  it('rejects an invalid status value', () => {
    expect(() => listAllActionsSchema.parse({ status: 'PENDING' })).toThrow()
  })

  it('rejects an invalid priority value', () => {
    expect(() => listAllActionsSchema.parse({ priority: 'URGENT' })).toThrow()
  })

  it('rejects an invalid sortBy value', () => {
    expect(() => listAllActionsSchema.parse({ sortBy: 'name' })).toThrow()
  })
})
