import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Audit Trail Tests
 *
 * Audit logs provide an immutable record of all changes:
 * - Who made the change (userId)
 * - When it happened (timestamp)
 * - What changed (before/after values)
 * - Why (for approval workflows)
 *
 * Key properties:
 * - Immutable: Cannot be modified after creation
 * - Non-deletable: Cannot be removed by users
 * - Complete: Captures all CRUD operations
 */

// ============================================
// Types and Interfaces
// ============================================

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'RESTORE'
type EntityType = 'RISK' | 'KRI' | 'ASSESSMENT' | 'USER' | 'ORGANISATION'

interface AuditLog {
  id: string
  action: AuditAction
  entityType: EntityType
  entityId: string
  userId: string
  orgId: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

interface User {
  id: string
  orgId: string
  role: string
}

// ============================================
// Audit Trail Helper Functions
// ============================================

// Simulated audit log storage
let auditLogs: AuditLog[] = []
let auditIdCounter = 1

// Create an audit log entry
function createAuditLog(params: {
  action: AuditAction
  entityType: EntityType
  entityId: string
  userId: string
  orgId: string
  ipAddress?: string
  userAgent?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
}): AuditLog {
  const log: AuditLog = {
    id: `audit-${auditIdCounter++}`,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    userId: params.userId,
    orgId: params.orgId,
    timestamp: new Date(),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    oldValues: params.oldValues,
    newValues: params.newValues,
    metadata: params.metadata,
  }

  // Freeze the log to make it immutable
  Object.freeze(log)
  if (log.oldValues) Object.freeze(log.oldValues)
  if (log.newValues) Object.freeze(log.newValues)
  if (log.metadata) Object.freeze(log.metadata)

  auditLogs.push(log)
  return log
}

// Attempt to modify an audit log (should fail)
function attemptModifyAuditLog(
  logId: string,
  updates: Partial<AuditLog>
): { success: boolean; error?: string } {
  const log = auditLogs.find((l) => l.id === logId)
  if (!log) {
    return { success: false, error: 'NOT_FOUND' }
  }

  // Audit logs are immutable - modification not allowed
  return { success: false, error: 'IMMUTABLE' }
}

// Attempt to delete an audit log (should fail)
function attemptDeleteAuditLog(
  logId: string,
  user: User
): { success: boolean; error?: string } {
  const log = auditLogs.find((l) => l.id === logId)
  if (!log) {
    return { success: false, error: 'NOT_FOUND' }
  }

  // Even admins cannot delete audit logs
  return { success: false, error: 'DELETION_NOT_ALLOWED' }
}

// Get audit logs for an entity
function getAuditLogsForEntity(entityType: EntityType, entityId: string): AuditLog[] {
  return auditLogs.filter(
    (log) => log.entityType === entityType && log.entityId === entityId
  )
}

// Get audit logs by user
function getAuditLogsByUser(userId: string): AuditLog[] {
  return auditLogs.filter((log) => log.userId === userId)
}

// Get audit logs for org
function getAuditLogsForOrg(orgId: string): AuditLog[] {
  return auditLogs.filter((log) => log.orgId === orgId)
}

// Detect changes between old and new values
function detectChanges(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): string[] {
  const changedFields: string[] = []
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])

  for (const key of allKeys) {
    if (oldValues[key] !== newValues[key]) {
      changedFields.push(key)
    }
  }

  return changedFields
}

// Calculate score change
function calculateScoreChange(
  oldScore: number,
  newScore: number
): { direction: 'improved' | 'worsened' | 'unchanged'; delta: number } {
  const delta = newScore - oldScore
  if (delta < 0) return { direction: 'improved', delta }
  if (delta > 0) return { direction: 'worsened', delta }
  return { direction: 'unchanged', delta: 0 }
}

// ============================================
// Test Data
// ============================================

const testUser: User = { id: 'user-1', orgId: 'org-1', role: 'RISK_MANAGER' }
const adminUser: User = { id: 'admin-1', orgId: 'org-1', role: 'OWNER' }

// ============================================
// TESTS
// ============================================

describe('Audit Trail', () => {
  beforeEach(() => {
    // Reset audit logs before each test
    auditLogs = []
    auditIdCounter = 1
  })

  // ----------------------------------------
  // Risk Creation Logging
  // ----------------------------------------
  describe('Risk Creation Logging', () => {
    it('should log risk creation with full data', () => {
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        newValues: {
          refCode: 'STR-001',
          title: 'Market Risk',
          category: 'STRATEGIC',
          inherentScore: 20,
          residualScore: 12,
          status: 'OPEN',
        },
      })

      expect(log.action).toBe('CREATE')
      expect(log.entityType).toBe('RISK')
      expect(log.entityId).toBe('risk-1')
      expect(log.userId).toBe(testUser.id)
      expect(log.orgId).toBe(testUser.orgId)
      expect(log.timestamp).toBeInstanceOf(Date)
      expect(log.ipAddress).toBe('192.168.1.1')
      expect(log.newValues?.refCode).toBe('STR-001')
    })

    it('should include timestamp on creation', () => {
      const before = new Date()
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
      })
      const after = new Date()

      expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(log.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should capture IP address and user agent', () => {
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
      })

      expect(log.ipAddress).toBe('10.0.0.1')
      expect(log.userAgent).toBe('Chrome/120.0')
    })
  })

  // ----------------------------------------
  // Score Change Logging
  // ----------------------------------------
  describe('Score Change Logging', () => {
    it('should log score changes with before/after values', () => {
      const log = createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
        oldValues: {
          residualLikelihood: 4,
          residualImpact: 5,
          residualScore: 20,
        },
        newValues: {
          residualLikelihood: 2,
          residualImpact: 3,
          residualScore: 6,
        },
      })

      expect(log.oldValues?.residualScore).toBe(20)
      expect(log.newValues?.residualScore).toBe(6)
    })

    it('should detect changed fields correctly', () => {
      const oldValues = {
        title: 'Original Title',
        residualScore: 15,
        status: 'OPEN',
      }
      const newValues = {
        title: 'Updated Title',
        residualScore: 10,
        status: 'OPEN',
      }

      const changes = detectChanges(oldValues, newValues)

      expect(changes).toContain('title')
      expect(changes).toContain('residualScore')
      expect(changes).not.toContain('status')
    })

    it('should calculate score improvement correctly', () => {
      const result = calculateScoreChange(20, 10)
      expect(result.direction).toBe('improved')
      expect(result.delta).toBe(-10)
    })

    it('should calculate score worsening correctly', () => {
      const result = calculateScoreChange(10, 18)
      expect(result.direction).toBe('worsened')
      expect(result.delta).toBe(8)
    })

    it('should detect unchanged scores', () => {
      const result = calculateScoreChange(15, 15)
      expect(result.direction).toBe('unchanged')
      expect(result.delta).toBe(0)
    })
  })

  // ----------------------------------------
  // Approval Workflow Logging
  // ----------------------------------------
  describe('Approval Workflow Logging', () => {
    it('should log approval with decision and reason', () => {
      const log = createAuditLog({
        action: 'APPROVE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: adminUser.id,
        orgId: adminUser.orgId,
        metadata: {
          decision: 'APPROVED',
          reason: 'Controls verified and effective',
          previousStatus: 'PENDING_REVIEW',
          newStatus: 'APPROVED',
        },
      })

      expect(log.action).toBe('APPROVE')
      expect(log.metadata?.decision).toBe('APPROVED')
      expect(log.metadata?.reason).toBe('Controls verified and effective')
    })

    it('should log rejection with reason', () => {
      const log = createAuditLog({
        action: 'REJECT',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: adminUser.id,
        orgId: adminUser.orgId,
        metadata: {
          decision: 'REJECTED',
          reason: 'Insufficient control documentation',
          previousStatus: 'PENDING_REVIEW',
        },
      })

      expect(log.action).toBe('REJECT')
      expect(log.metadata?.decision).toBe('REJECTED')
      expect(log.metadata?.reason).toBe('Insufficient control documentation')
    })

    it('should track workflow status transitions', () => {
      const log = createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
        oldValues: { workflowStatus: 'INBOX' },
        newValues: { workflowStatus: 'TRIAGE' },
      })

      expect(log.oldValues?.workflowStatus).toBe('INBOX')
      expect(log.newValues?.workflowStatus).toBe('TRIAGE')
    })
  })

  // ----------------------------------------
  // Deletion Logging (Soft Delete)
  // ----------------------------------------
  describe('Deletion Logging', () => {
    it('should log deletion with full entity snapshot', () => {
      const log = createAuditLog({
        action: 'DELETE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
        oldValues: {
          refCode: 'STR-001',
          title: 'Deleted Risk',
          category: 'STRATEGIC',
          inherentScore: 15,
          residualScore: 8,
          status: 'CLOSED',
        },
      })

      expect(log.action).toBe('DELETE')
      expect(log.oldValues?.refCode).toBe('STR-001')
      expect(log.oldValues?.title).toBe('Deleted Risk')
    })

    it('should preserve deletion record for compliance', () => {
      createAuditLog({
        action: 'DELETE',
        entityType: 'RISK',
        entityId: 'risk-deleted',
        userId: testUser.id,
        orgId: testUser.orgId,
        oldValues: { title: 'Important Risk' },
      })

      const logs = getAuditLogsForEntity('RISK', 'risk-deleted')
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe('DELETE')
    })

    it('should log restore after soft delete', () => {
      const log = createAuditLog({
        action: 'RESTORE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: adminUser.id,
        orgId: adminUser.orgId,
        metadata: {
          restoredFrom: 'DELETE',
          originalDeletedAt: new Date().toISOString(),
          originalDeletedBy: testUser.id,
        },
      })

      expect(log.action).toBe('RESTORE')
      expect(log.metadata?.restoredFrom).toBe('DELETE')
    })
  })

  // ----------------------------------------
  // Immutability Tests
  // ----------------------------------------
  describe('Audit Log Immutability', () => {
    it('should not allow modification of audit logs', () => {
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
      })

      const result = attemptModifyAuditLog(log.id, { action: 'DELETE' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('IMMUTABLE')
    })

    it('should not allow deletion of audit logs by users', () => {
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
      })

      const result = attemptDeleteAuditLog(log.id, testUser)

      expect(result.success).toBe(false)
      expect(result.error).toBe('DELETION_NOT_ALLOWED')
    })

    it('should not allow deletion of audit logs by admins', () => {
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
      })

      const result = attemptDeleteAuditLog(log.id, adminUser)

      expect(result.success).toBe(false)
      expect(result.error).toBe('DELETION_NOT_ALLOWED')
    })

    it('should freeze audit log objects', () => {
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
        newValues: { title: 'Test' },
      })

      expect(Object.isFrozen(log)).toBe(true)
    })

    it('should freeze nested values in audit logs', () => {
      const log = createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: testUser.id,
        orgId: testUser.orgId,
        oldValues: { score: 10 },
        newValues: { score: 20 },
      })

      expect(Object.isFrozen(log.oldValues)).toBe(true)
      expect(Object.isFrozen(log.newValues)).toBe(true)
    })
  })

  // ----------------------------------------
  // Query and Retrieval Tests
  // ----------------------------------------
  describe('Audit Log Queries', () => {
    beforeEach(() => {
      // Create multiple audit logs for testing
      createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: 'user-1',
        orgId: 'org-1',
      })
      createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: 'user-1',
        orgId: 'org-1',
      })
      createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-2',
        userId: 'user-2',
        orgId: 'org-1',
      })
      createAuditLog({
        action: 'CREATE',
        entityType: 'KRI',
        entityId: 'kri-1',
        userId: 'user-1',
        orgId: 'org-2',
      })
    })

    it('should retrieve audit logs for specific entity', () => {
      const logs = getAuditLogsForEntity('RISK', 'risk-1')
      expect(logs).toHaveLength(2)
      expect(logs.every((l) => l.entityId === 'risk-1')).toBe(true)
    })

    it('should retrieve audit logs by user', () => {
      const logs = getAuditLogsByUser('user-1')
      expect(logs).toHaveLength(3)
      expect(logs.every((l) => l.userId === 'user-1')).toBe(true)
    })

    it('should retrieve audit logs for organisation', () => {
      const logs = getAuditLogsForOrg('org-1')
      expect(logs).toHaveLength(3)
      expect(logs.every((l) => l.orgId === 'org-1')).toBe(true)
    })

    it('should return empty array for non-existent entity', () => {
      const logs = getAuditLogsForEntity('RISK', 'risk-999')
      expect(logs).toHaveLength(0)
    })
  })

  // ----------------------------------------
  // Comprehensive Audit Trail Scenario
  // ----------------------------------------
  describe('Full Risk Lifecycle Audit Trail', () => {
    it('should capture complete risk lifecycle', () => {
      const riskId = 'risk-lifecycle'

      // 1. Create
      createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: riskId,
        userId: 'user-1',
        orgId: 'org-1',
        newValues: {
          title: 'New Risk',
          status: 'OPEN',
          inherentScore: 20,
          residualScore: 20,
        },
      })

      // 2. Update (add controls)
      createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: riskId,
        userId: 'user-1',
        orgId: 'org-1',
        oldValues: { residualScore: 20, controls: null },
        newValues: { residualScore: 12, controls: 'Implemented firewall' },
      })

      // 3. Approve
      createAuditLog({
        action: 'APPROVE',
        entityType: 'RISK',
        entityId: riskId,
        userId: 'admin-1',
        orgId: 'org-1',
        metadata: { decision: 'APPROVED', reason: 'Controls effective' },
      })

      // 4. Close
      createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: riskId,
        userId: 'user-1',
        orgId: 'org-1',
        oldValues: { status: 'MONITORING' },
        newValues: { status: 'CLOSED' },
      })

      const logs = getAuditLogsForEntity('RISK', riskId)

      expect(logs).toHaveLength(4)
      expect(logs[0].action).toBe('CREATE')
      expect(logs[1].action).toBe('UPDATE')
      expect(logs[2].action).toBe('APPROVE')
      expect(logs[3].action).toBe('UPDATE')
    })

    it('should maintain chronological order', () => {
      const riskId = 'risk-chrono'

      createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: riskId,
        userId: 'user-1',
        orgId: 'org-1',
      })

      createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: riskId,
        userId: 'user-1',
        orgId: 'org-1',
      })

      const logs = getAuditLogsForEntity('RISK', riskId)

      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(
        logs[1].timestamp.getTime()
      )
    })
  })

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  describe('Edge Cases', () => {
    it('should handle audit log with no optional fields', () => {
      const log = createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: 'risk-minimal',
        userId: 'user-1',
        orgId: 'org-1',
      })

      expect(log.ipAddress).toBeUndefined()
      expect(log.userAgent).toBeUndefined()
      expect(log.oldValues).toBeUndefined()
      expect(log.newValues).toBeUndefined()
      expect(log.metadata).toBeUndefined()
    })

    it('should handle large metadata objects', () => {
      const largeMetadata: Record<string, unknown> = {}
      for (let i = 0; i < 100; i++) {
        largeMetadata[`field${i}`] = `value${i}`
      }

      const log = createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: 'user-1',
        orgId: 'org-1',
        metadata: largeMetadata,
      })

      expect(Object.keys(log.metadata || {}).length).toBe(100)
    })

    it('should handle special characters in values', () => {
      const log = createAuditLog({
        action: 'UPDATE',
        entityType: 'RISK',
        entityId: 'risk-1',
        userId: 'user-1',
        orgId: 'org-1',
        newValues: {
          title: 'Risk with "quotes" and <html> & special chars',
          description: 'Multi\nline\ntext',
        },
      })

      expect(log.newValues?.title).toBe(
        'Risk with "quotes" and <html> & special chars'
      )
      expect(log.newValues?.description).toContain('\n')
    })
  })
})
