import { describe, it, expect } from 'vitest'
import {
  createRegisterSchema,
  updateRegisterSchema,
  registerStatusEnum,
  canDeleteRegister,
} from '@/lib/register-validation'

describe('Register Validation', () => {
  // ----------------------------------------
  // Create Schema
  // ----------------------------------------
  describe('createRegisterSchema', () => {
    it('should accept valid create input with name only', () => {
      const result = createRegisterSchema.safeParse({
        name: 'IT Risk Register',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('ACTIVE')
      }
    })

    it('should accept full create input with all fields', () => {
      const result = createRegisterSchema.safeParse({
        name: 'Compliance Register',
        description: 'For regulatory compliance risks',
        status: 'DRAFT',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Compliance Register')
        expect(result.data.status).toBe('DRAFT')
      }
    })

    it('should reject empty name', () => {
      const result = createRegisterSchema.safeParse({
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing name', () => {
      const result = createRegisterSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject name exceeding 100 characters', () => {
      const result = createRegisterSchema.safeParse({
        name: 'x'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('should accept name at exactly 100 characters', () => {
      const result = createRegisterSchema.safeParse({
        name: 'x'.repeat(100),
      })
      expect(result.success).toBe(true)
    })

    it('should reject description exceeding 500 characters', () => {
      const result = createRegisterSchema.safeParse({
        name: 'Test',
        description: 'x'.repeat(501),
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = createRegisterSchema.safeParse({
        name: 'Test',
        status: 'DELETED',
      })
      expect(result.success).toBe(false)
    })

    it('should default status to ACTIVE', () => {
      const result = createRegisterSchema.safeParse({
        name: 'Test',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('ACTIVE')
      }
    })

    it('should accept all valid statuses', () => {
      for (const status of ['DRAFT', 'ACTIVE', 'ARCHIVED']) {
        const result = createRegisterSchema.safeParse({
          name: 'Test',
          status,
        })
        expect(result.success).toBe(true)
      }
    })
  })

  // ----------------------------------------
  // Update Schema
  // ----------------------------------------
  describe('updateRegisterSchema', () => {
    it('should accept update with name change', () => {
      const result = updateRegisterSchema.safeParse({
        id: 'reg123',
        name: 'Updated Name',
      })
      expect(result.success).toBe(true)
    })

    it('should accept update with status change only', () => {
      const result = updateRegisterSchema.safeParse({
        id: 'reg123',
        status: 'ARCHIVED',
      })
      expect(result.success).toBe(true)
    })

    it('should accept nullable description', () => {
      const result = updateRegisterSchema.safeParse({
        id: 'reg123',
        description: null,
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing id', () => {
      const result = updateRegisterSchema.safeParse({
        name: 'Updated Name',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty id', () => {
      const result = updateRegisterSchema.safeParse({
        id: '',
        name: 'Updated Name',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = updateRegisterSchema.safeParse({
        id: 'reg123',
        status: 'PENDING',
      })
      expect(result.success).toBe(false)
    })

    it('should reject name exceeding 100 characters', () => {
      const result = updateRegisterSchema.safeParse({
        id: 'reg123',
        name: 'x'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('should accept full update with all fields', () => {
      const result = updateRegisterSchema.safeParse({
        id: 'reg123',
        name: 'Updated',
        description: 'New description',
        status: 'ACTIVE',
      })
      expect(result.success).toBe(true)
    })
  })

  // ----------------------------------------
  // Register Status Enum
  // ----------------------------------------
  describe('registerStatusEnum', () => {
    it('should accept all valid statuses', () => {
      for (const s of ['DRAFT', 'ACTIVE', 'ARCHIVED']) {
        expect(registerStatusEnum.safeParse(s).success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(registerStatusEnum.safeParse('DELETED').success).toBe(false)
      expect(registerStatusEnum.safeParse('PENDING').success).toBe(false)
      expect(registerStatusEnum.safeParse('').success).toBe(false)
    })
  })

  // ----------------------------------------
  // canDeleteRegister
  // ----------------------------------------
  describe('canDeleteRegister', () => {
    it('should allow deletion when register is empty and not the only one', () => {
      expect(canDeleteRegister(0, 3)).toBeNull()
    })

    it('should allow deletion when register is empty and there are exactly 2', () => {
      expect(canDeleteRegister(0, 2)).toBeNull()
    })

    it('should block deletion when register has risks', () => {
      const error = canDeleteRegister(5, 3)
      expect(error).not.toBeNull()
      expect(error).toContain('5 risks')
    })

    it('should block deletion when register has 1 risk', () => {
      const error = canDeleteRegister(1, 3)
      expect(error).not.toBeNull()
      expect(error).toContain('1 risk')
      // Should not say "1 risks" (plural)
      expect(error).not.toContain('1 risks')
    })

    it('should block deletion when it is the only register', () => {
      const error = canDeleteRegister(0, 1)
      expect(error).not.toBeNull()
      expect(error).toContain('only register')
    })

    it('should prioritize risk count error over only-register error', () => {
      const error = canDeleteRegister(3, 1)
      expect(error).not.toBeNull()
      expect(error).toContain('3 risks')
    })

    it('should handle zero total registers', () => {
      const error = canDeleteRegister(0, 0)
      expect(error).not.toBeNull()
      expect(error).toContain('only register')
    })
  })
})
