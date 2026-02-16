import { describe, it, expect } from 'vitest'
import {
  createTreatmentActionSchema,
  updateTreatmentActionSchema,
  getCompletedAtForStatus,
  sortByPriority,
  PRIORITY_ORDER,
  actionPriorityEnum,
  actionStatusEnum,
} from '@/lib/treatment-validation'

describe('Treatment Action Validation', () => {
  // ----------------------------------------
  // Create Schema
  // ----------------------------------------
  describe('createTreatmentActionSchema', () => {
    it('should accept valid create input', () => {
      const result = createTreatmentActionSchema.safeParse({
        riskId: 'clr123abc',
        title: 'Implement firewall rules',
        priority: 'HIGH',
      })
      expect(result.success).toBe(true)
    })

    it('should accept full create input with all fields', () => {
      const result = createTreatmentActionSchema.safeParse({
        riskId: 'clr123abc',
        title: 'Deploy monitoring',
        description: 'Set up monitoring for the new service',
        priority: 'CRITICAL',
        dueDate: '2025-12-31',
        assigneeId: 'usr456def',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const result = createTreatmentActionSchema.safeParse({
        riskId: 'clr123abc',
        title: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing riskId', () => {
      const result = createTreatmentActionSchema.safeParse({
        title: 'Some action',
      })
      expect(result.success).toBe(false)
    })

    it('should reject title exceeding 200 characters', () => {
      const result = createTreatmentActionSchema.safeParse({
        riskId: 'clr123abc',
        title: 'x'.repeat(201),
      })
      expect(result.success).toBe(false)
    })

    it('should reject description exceeding 2000 characters', () => {
      const result = createTreatmentActionSchema.safeParse({
        riskId: 'clr123abc',
        title: 'Test',
        description: 'x'.repeat(2001),
      })
      expect(result.success).toBe(false)
    })

    it('should default priority to MEDIUM', () => {
      const result = createTreatmentActionSchema.safeParse({
        riskId: 'clr123abc',
        title: 'Test action',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('MEDIUM')
      }
    })

    it('should reject invalid priority', () => {
      const result = createTreatmentActionSchema.safeParse({
        riskId: 'clr123abc',
        title: 'Test',
        priority: 'URGENT',
      })
      expect(result.success).toBe(false)
    })
  })

  // ----------------------------------------
  // Update Schema
  // ----------------------------------------
  describe('updateTreatmentActionSchema', () => {
    it('should accept valid update with status change', () => {
      const result = updateTreatmentActionSchema.safeParse({
        id: 'act123',
        status: 'COMPLETED',
      })
      expect(result.success).toBe(true)
    })

    it('should accept update with only title', () => {
      const result = updateTreatmentActionSchema.safeParse({
        id: 'act123',
        title: 'Updated title',
      })
      expect(result.success).toBe(true)
    })

    it('should accept nullable dueDate', () => {
      const result = updateTreatmentActionSchema.safeParse({
        id: 'act123',
        dueDate: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept nullable assigneeId', () => {
      const result = updateTreatmentActionSchema.safeParse({
        id: 'act123',
        assigneeId: null,
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing id', () => {
      const result = updateTreatmentActionSchema.safeParse({
        status: 'OPEN',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = updateTreatmentActionSchema.safeParse({
        id: 'act123',
        status: 'DONE',
      })
      expect(result.success).toBe(false)
    })
  })

  // ----------------------------------------
  // Priority Ordering
  // ----------------------------------------
  describe('PRIORITY_ORDER', () => {
    it('should order CRITICAL > HIGH > MEDIUM > LOW', () => {
      expect(PRIORITY_ORDER.CRITICAL).toBeGreaterThan(PRIORITY_ORDER.HIGH)
      expect(PRIORITY_ORDER.HIGH).toBeGreaterThan(PRIORITY_ORDER.MEDIUM)
      expect(PRIORITY_ORDER.MEDIUM).toBeGreaterThan(PRIORITY_ORDER.LOW)
    })
  })

  describe('sortByPriority', () => {
    it('should sort CRITICAL first', () => {
      const actions = [
        { priority: 'LOW', createdAt: new Date('2025-01-01') },
        { priority: 'CRITICAL', createdAt: new Date('2025-01-02') },
        { priority: 'MEDIUM', createdAt: new Date('2025-01-03') },
      ]
      const sorted = sortByPriority(actions)
      expect(sorted[0].priority).toBe('CRITICAL')
      expect(sorted[1].priority).toBe('MEDIUM')
      expect(sorted[2].priority).toBe('LOW')
    })

    it('should sort by createdAt within same priority', () => {
      const actions = [
        { priority: 'HIGH', createdAt: new Date('2025-03-01') },
        { priority: 'HIGH', createdAt: new Date('2025-01-01') },
        { priority: 'HIGH', createdAt: new Date('2025-02-01') },
      ]
      const sorted = sortByPriority(actions)
      expect(sorted[0].createdAt).toEqual(new Date('2025-01-01'))
      expect(sorted[1].createdAt).toEqual(new Date('2025-02-01'))
      expect(sorted[2].createdAt).toEqual(new Date('2025-03-01'))
    })

    it('should not mutate original array', () => {
      const actions = [
        { priority: 'LOW', createdAt: new Date('2025-01-01') },
        { priority: 'HIGH', createdAt: new Date('2025-01-02') },
      ]
      const sorted = sortByPriority(actions)
      expect(actions[0].priority).toBe('LOW')
      expect(sorted[0].priority).toBe('HIGH')
    })
  })

  // ----------------------------------------
  // Status Transitions / completedAt
  // ----------------------------------------
  describe('getCompletedAtForStatus', () => {
    it('should return Date when transitioning to COMPLETED', () => {
      const result = getCompletedAtForStatus('COMPLETED', 'OPEN')
      expect(result).toBeInstanceOf(Date)
    })

    it('should return null when transitioning away from COMPLETED', () => {
      const result = getCompletedAtForStatus('OPEN', 'COMPLETED')
      expect(result).toBeNull()
    })

    it('should return null when transitioning from COMPLETED to IN_PROGRESS', () => {
      const result = getCompletedAtForStatus('IN_PROGRESS', 'COMPLETED')
      expect(result).toBeNull()
    })

    it('should return undefined when status is not changing', () => {
      const result = getCompletedAtForStatus('OPEN', 'OPEN')
      expect(result).toBeUndefined()
    })

    it('should return undefined when newStatus is undefined', () => {
      const result = getCompletedAtForStatus(undefined, 'OPEN')
      expect(result).toBeUndefined()
    })

    it('should return undefined for non-COMPLETED transitions', () => {
      const result = getCompletedAtForStatus('IN_PROGRESS', 'OPEN')
      expect(result).toBeUndefined()
    })
  })

  // ----------------------------------------
  // Enum Validation
  // ----------------------------------------
  describe('actionPriorityEnum', () => {
    it('should accept all valid priorities', () => {
      for (const p of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
        expect(actionPriorityEnum.safeParse(p).success).toBe(true)
      }
    })

    it('should reject invalid priority', () => {
      expect(actionPriorityEnum.safeParse('URGENT').success).toBe(false)
    })
  })

  describe('actionStatusEnum', () => {
    it('should accept all valid statuses', () => {
      for (const s of ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) {
        expect(actionStatusEnum.safeParse(s).success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(actionStatusEnum.safeParse('DONE').success).toBe(false)
    })
  })
})
