import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Data Integrity Tests
 *
 * SQL-based checks to verify:
 * - Risk counts correct per org
 * - No orphaned audit logs
 * - Soft deletes not returned in queries
 * - Score calculations match stored values
 * - No cross-org data leakage
 * - All users have valid roles
 */

// ============================================
// Types
// ============================================

interface Organisation {
  id: string
  name: string
  createdAt: Date
}

interface User {
  id: string
  email: string
  role: string
  orgId: string
  isActive: boolean
}

interface Risk {
  id: string
  refCode: string
  title: string
  category: string
  likelihood: number
  impact: number
  inherentScore: number
  residualLikelihood: number
  residualImpact: number
  residualScore: number
  status: string
  orgId: string
  createdById: string
  ownerId: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  userId: string
  orgId: string
  changes: Record<string, unknown> | null
  createdAt: Date
}

interface Kri {
  id: string
  name: string
  riskId: string
  orgId: string
  deletedAt: Date | null
}

interface Assessment {
  id: string
  score: number
  grade: string
  orgId: string
  riskCount: number
  createdAt: Date
}

// Valid roles in the system
const VALID_ROLES = ['OWNER', 'ADMIN', 'RISK_MANAGER', 'EDITOR', 'VIEWER']

// ============================================
// Mock Database State
// ============================================

let mockOrganisations: Organisation[] = []
let mockUsers: User[] = []
let mockRisks: Risk[] = []
let mockAuditLogs: AuditLog[] = []
let mockKris: Kri[] = []
let mockAssessments: Assessment[] = []

// ============================================
// Helper Functions (Simulating SQL queries)
// ============================================

// COUNT(*) FROM risks WHERE orgId = ? AND deletedAt IS NULL
function countActiveRisksByOrg(orgId: string): number {
  return mockRisks.filter(r => r.orgId === orgId && r.deletedAt === null).length
}

// COUNT(*) FROM risks WHERE orgId = ? (including soft-deleted)
function countAllRisksByOrg(orgId: string): number {
  return mockRisks.filter(r => r.orgId === orgId).length
}

// SELECT * FROM risks WHERE orgId = ? AND deletedAt IS NULL
function getActiveRisksByOrg(orgId: string): Risk[] {
  return mockRisks.filter(r => r.orgId === orgId && r.deletedAt === null)
}

// SELECT * FROM risks WHERE deletedAt IS NOT NULL
function getSoftDeletedRisks(): Risk[] {
  return mockRisks.filter(r => r.deletedAt !== null)
}

// SELECT al.* FROM audit_logs al LEFT JOIN risks r ON al.entityId = r.id WHERE al.entityType = 'RISK' AND r.id IS NULL
function getOrphanedRiskAuditLogs(): AuditLog[] {
  const riskIds = new Set(mockRisks.map(r => r.id))
  return mockAuditLogs.filter(
    al => al.entityType === 'RISK' && !riskIds.has(al.entityId)
  )
}

// SELECT al.* FROM audit_logs al LEFT JOIN users u ON al.userId = u.id WHERE u.id IS NULL
function getOrphanedUserAuditLogs(): AuditLog[] {
  const userIds = new Set(mockUsers.map(u => u.id))
  return mockAuditLogs.filter(al => !userIds.has(al.userId))
}

// SELECT al.* FROM audit_logs al LEFT JOIN organisations o ON al.orgId = o.id WHERE o.id IS NULL
function getOrphanedOrgAuditLogs(): AuditLog[] {
  const orgIds = new Set(mockOrganisations.map(o => o.id))
  return mockAuditLogs.filter(al => !orgIds.has(al.orgId))
}

// SELECT k.* FROM kris k LEFT JOIN risks r ON k.riskId = r.id WHERE r.id IS NULL
function getOrphanedKris(): Kri[] {
  const riskIds = new Set(mockRisks.map(r => r.id))
  return mockKris.filter(k => !riskIds.has(k.riskId))
}

// SELECT * FROM users WHERE role NOT IN (valid_roles)
function getUsersWithInvalidRoles(): User[] {
  return mockUsers.filter(u => !VALID_ROLES.includes(u.role))
}

// SELECT * FROM users WHERE orgId NOT IN (SELECT id FROM organisations)
function getUsersWithInvalidOrg(): User[] {
  const orgIds = new Set(mockOrganisations.map(o => o.id))
  return mockUsers.filter(u => !orgIds.has(u.orgId))
}

// SELECT r.* FROM risks r WHERE r.orgId != (SELECT orgId FROM users WHERE id = r.createdById)
function getRisksWithCrossOrgCreator(): Risk[] {
  return mockRisks.filter(r => {
    const creator = mockUsers.find(u => u.id === r.createdById)
    return creator && creator.orgId !== r.orgId
  })
}

// SELECT r.* FROM risks r WHERE r.ownerId IS NOT NULL AND r.orgId != (SELECT orgId FROM users WHERE id = r.ownerId)
function getRisksWithCrossOrgOwner(): Risk[] {
  return mockRisks.filter(r => {
    if (!r.ownerId) return false
    const owner = mockUsers.find(u => u.id === r.ownerId)
    return owner && owner.orgId !== r.orgId
  })
}

// SELECT al.* FROM audit_logs al JOIN risks r ON al.entityId = r.id WHERE al.entityType = 'RISK' AND al.orgId != r.orgId
function getAuditLogsWithOrgMismatch(): AuditLog[] {
  return mockAuditLogs.filter(al => {
    if (al.entityType !== 'RISK') return false
    const risk = mockRisks.find(r => r.id === al.entityId)
    return risk && al.orgId !== risk.orgId
  })
}

// Check if inherentScore = likelihood * impact
function getRisksWithIncorrectInherentScore(): Risk[] {
  return mockRisks.filter(r => r.inherentScore !== r.likelihood * r.impact)
}

// Check if residualScore = residualLikelihood * residualImpact
function getRisksWithIncorrectResidualScore(): Risk[] {
  return mockRisks.filter(r => r.residualScore !== r.residualLikelihood * r.residualImpact)
}

// Verify assessment risk count matches actual count
function getAssessmentsWithIncorrectRiskCount(): Assessment[] {
  return mockAssessments.filter(a => {
    const actualCount = countActiveRisksByOrg(a.orgId)
    return a.riskCount !== actualCount
  })
}

// SELECT * FROM risks WHERE likelihood < 1 OR likelihood > 5 OR impact < 1 OR impact > 5
function getRisksWithInvalidScoreRange(): Risk[] {
  return mockRisks.filter(r =>
    r.likelihood < 1 || r.likelihood > 5 ||
    r.impact < 1 || r.impact > 5 ||
    r.residualLikelihood < 1 || r.residualLikelihood > 5 ||
    r.residualImpact < 1 || r.residualImpact > 5
  )
}

// Check for duplicate refCodes within same org
function getDuplicateRefCodesInOrg(): { orgId: string; refCode: string; count: number }[] {
  const refCodeCounts = new Map<string, number>()

  mockRisks.forEach(r => {
    const key = `${r.orgId}:${r.refCode}`
    refCodeCounts.set(key, (refCodeCounts.get(key) || 0) + 1)
  })

  const duplicates: { orgId: string; refCode: string; count: number }[] = []
  refCodeCounts.forEach((count, key) => {
    if (count > 1) {
      const [orgId, refCode] = key.split(':')
      duplicates.push({ orgId, refCode, count })
    }
  })

  return duplicates
}

// Check for KRIs with deleted parent risks
function getKrisWithDeletedRisk(): Kri[] {
  return mockKris.filter(k => {
    const risk = mockRisks.find(r => r.id === k.riskId)
    return risk && risk.deletedAt !== null && k.deletedAt === null
  })
}

// ============================================
// Test Data Factories
// ============================================

function createOrganisation(overrides: Partial<Organisation> = {}): Organisation {
  return {
    id: `org-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Organisation',
    createdAt: new Date(),
    ...overrides,
  }
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: `user-${Math.random().toString(36).substr(2, 5)}@test.com`,
    role: 'EDITOR',
    orgId: 'org-1',
    isActive: true,
    ...overrides,
  }
}

function createRisk(overrides: Partial<Risk> = {}): Risk {
  const likelihood = overrides.likelihood ?? 3
  const impact = overrides.impact ?? 4
  const residualLikelihood = overrides.residualLikelihood ?? 2
  const residualImpact = overrides.residualImpact ?? 3

  return {
    id: `risk-${Math.random().toString(36).substr(2, 9)}`,
    refCode: `R-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    title: 'Test Risk',
    category: 'OPERATIONAL',
    likelihood,
    impact,
    inherentScore: likelihood * impact,
    residualLikelihood,
    residualImpact,
    residualScore: residualLikelihood * residualImpact,
    status: 'OPEN',
    orgId: 'org-1',
    createdById: 'user-1',
    ownerId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: `audit-${Math.random().toString(36).substr(2, 9)}`,
    entityType: 'RISK',
    entityId: 'risk-1',
    action: 'CREATE',
    userId: 'user-1',
    orgId: 'org-1',
    changes: null,
    createdAt: new Date(),
    ...overrides,
  }
}

function createKri(overrides: Partial<Kri> = {}): Kri {
  return {
    id: `kri-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test KRI',
    riskId: 'risk-1',
    orgId: 'org-1',
    deletedAt: null,
    ...overrides,
  }
}

function createAssessment(overrides: Partial<Assessment> = {}): Assessment {
  return {
    id: `assess-${Math.random().toString(36).substr(2, 9)}`,
    score: 75,
    grade: 'B',
    orgId: 'org-1',
    riskCount: 10,
    createdAt: new Date(),
    ...overrides,
  }
}

// ============================================
// Tests
// ============================================

describe('Data Integrity Tests', () => {
  beforeEach(() => {
    // Reset all mock data
    mockOrganisations = []
    mockUsers = []
    mockRisks = []
    mockAuditLogs = []
    mockKris = []
    mockAssessments = []
  })

  // ----------------------------------------
  // 1. Risk Counts Per Org
  // ----------------------------------------
  describe('Risk Counts Per Org', () => {
    it('should return correct count of active risks per org', () => {
      const org1 = createOrganisation({ id: 'org-1' })
      const org2 = createOrganisation({ id: 'org-2' })
      mockOrganisations.push(org1, org2)

      // 5 active risks for org-1
      for (let i = 0; i < 5; i++) {
        mockRisks.push(createRisk({ orgId: 'org-1' }))
      }
      // 3 active risks for org-2
      for (let i = 0; i < 3; i++) {
        mockRisks.push(createRisk({ orgId: 'org-2' }))
      }

      expect(countActiveRisksByOrg('org-1')).toBe(5)
      expect(countActiveRisksByOrg('org-2')).toBe(3)
    })

    it('should exclude soft-deleted risks from active count', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      // 3 active, 2 soft-deleted
      mockRisks.push(createRisk({ orgId: 'org-1' }))
      mockRisks.push(createRisk({ orgId: 'org-1' }))
      mockRisks.push(createRisk({ orgId: 'org-1' }))
      mockRisks.push(createRisk({ orgId: 'org-1', deletedAt: new Date() }))
      mockRisks.push(createRisk({ orgId: 'org-1', deletedAt: new Date() }))

      expect(countActiveRisksByOrg('org-1')).toBe(3)
      expect(countAllRisksByOrg('org-1')).toBe(5)
    })

    it('should return zero for org with no risks', () => {
      const org = createOrganisation({ id: 'org-empty' })
      mockOrganisations.push(org)

      expect(countActiveRisksByOrg('org-empty')).toBe(0)
    })

    it('should handle org with only soft-deleted risks', () => {
      const org = createOrganisation({ id: 'org-deleted' })
      mockOrganisations.push(org)

      mockRisks.push(createRisk({ orgId: 'org-deleted', deletedAt: new Date() }))
      mockRisks.push(createRisk({ orgId: 'org-deleted', deletedAt: new Date() }))

      expect(countActiveRisksByOrg('org-deleted')).toBe(0)
      expect(countAllRisksByOrg('org-deleted')).toBe(2)
    })
  })

  // ----------------------------------------
  // 2. No Orphaned Audit Logs
  // ----------------------------------------
  describe('No Orphaned Audit Logs', () => {
    it('should detect audit logs referencing non-existent risks', () => {
      const org = createOrganisation({ id: 'org-1' })
      const user = createUser({ id: 'user-1', orgId: 'org-1' })
      mockOrganisations.push(org)
      mockUsers.push(user)

      // Valid audit log
      const risk = createRisk({ id: 'risk-1', orgId: 'org-1' })
      mockRisks.push(risk)
      mockAuditLogs.push(createAuditLog({ entityId: 'risk-1', entityType: 'RISK' }))

      // Orphaned audit log (risk doesn't exist)
      mockAuditLogs.push(createAuditLog({ entityId: 'risk-nonexistent', entityType: 'RISK' }))

      const orphaned = getOrphanedRiskAuditLogs()
      expect(orphaned).toHaveLength(1)
      expect(orphaned[0].entityId).toBe('risk-nonexistent')
    })

    it('should detect audit logs referencing non-existent users', () => {
      const org = createOrganisation({ id: 'org-1' })
      const user = createUser({ id: 'user-1', orgId: 'org-1' })
      mockOrganisations.push(org)
      mockUsers.push(user)

      // Valid audit log
      mockAuditLogs.push(createAuditLog({ userId: 'user-1', orgId: 'org-1' }))
      // Orphaned (user doesn't exist)
      mockAuditLogs.push(createAuditLog({ userId: 'user-deleted', orgId: 'org-1' }))

      const orphaned = getOrphanedUserAuditLogs()
      expect(orphaned).toHaveLength(1)
      expect(orphaned[0].userId).toBe('user-deleted')
    })

    it('should detect audit logs referencing non-existent organisations', () => {
      const org = createOrganisation({ id: 'org-1' })
      const user = createUser({ id: 'user-1', orgId: 'org-1' })
      mockOrganisations.push(org)
      mockUsers.push(user)

      // Valid audit log
      mockAuditLogs.push(createAuditLog({ orgId: 'org-1', userId: 'user-1' }))
      // Orphaned (org doesn't exist)
      mockAuditLogs.push(createAuditLog({ orgId: 'org-deleted', userId: 'user-1' }))

      const orphaned = getOrphanedOrgAuditLogs()
      expect(orphaned).toHaveLength(1)
      expect(orphaned[0].orgId).toBe('org-deleted')
    })

    it('should return empty array when no orphaned audit logs exist', () => {
      const org = createOrganisation({ id: 'org-1' })
      const user = createUser({ id: 'user-1', orgId: 'org-1' })
      const risk = createRisk({ id: 'risk-1', orgId: 'org-1' })
      mockOrganisations.push(org)
      mockUsers.push(user)
      mockRisks.push(risk)

      mockAuditLogs.push(createAuditLog({
        entityId: 'risk-1',
        entityType: 'RISK',
        userId: 'user-1',
        orgId: 'org-1',
      }))

      expect(getOrphanedRiskAuditLogs()).toHaveLength(0)
      expect(getOrphanedUserAuditLogs()).toHaveLength(0)
      expect(getOrphanedOrgAuditLogs()).toHaveLength(0)
    })

    it('should detect orphaned KRIs (risk deleted)', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      const risk = createRisk({ id: 'risk-1', orgId: 'org-1' })
      mockRisks.push(risk)

      // Valid KRI
      mockKris.push(createKri({ riskId: 'risk-1', orgId: 'org-1' }))
      // Orphaned KRI (risk doesn't exist)
      mockKris.push(createKri({ riskId: 'risk-nonexistent', orgId: 'org-1' }))

      const orphaned = getOrphanedKris()
      expect(orphaned).toHaveLength(1)
      expect(orphaned[0].riskId).toBe('risk-nonexistent')
    })
  })

  // ----------------------------------------
  // 3. Soft Deletes Not Returned in Queries
  // ----------------------------------------
  describe('Soft Deletes Not Returned in Queries', () => {
    it('should not return soft-deleted risks in active queries', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      const activeRisk = createRisk({ id: 'risk-active', orgId: 'org-1' })
      const deletedRisk = createRisk({
        id: 'risk-deleted',
        orgId: 'org-1',
        deletedAt: new Date(),
      })
      mockRisks.push(activeRisk, deletedRisk)

      const active = getActiveRisksByOrg('org-1')
      expect(active).toHaveLength(1)
      expect(active[0].id).toBe('risk-active')
    })

    it('should correctly identify all soft-deleted risks', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      mockRisks.push(createRisk({ orgId: 'org-1' }))
      mockRisks.push(createRisk({ orgId: 'org-1', deletedAt: new Date('2024-01-01') }))
      mockRisks.push(createRisk({ orgId: 'org-1', deletedAt: new Date('2024-06-15') }))

      const deleted = getSoftDeletedRisks()
      expect(deleted).toHaveLength(2)
      deleted.forEach(r => {
        expect(r.deletedAt).not.toBeNull()
      })
    })

    it('should handle mixed active and deleted across orgs', () => {
      mockOrganisations.push(
        createOrganisation({ id: 'org-1' }),
        createOrganisation({ id: 'org-2' })
      )

      // Org 1: 2 active, 1 deleted
      mockRisks.push(createRisk({ orgId: 'org-1' }))
      mockRisks.push(createRisk({ orgId: 'org-1' }))
      mockRisks.push(createRisk({ orgId: 'org-1', deletedAt: new Date() }))

      // Org 2: 1 active, 2 deleted
      mockRisks.push(createRisk({ orgId: 'org-2' }))
      mockRisks.push(createRisk({ orgId: 'org-2', deletedAt: new Date() }))
      mockRisks.push(createRisk({ orgId: 'org-2', deletedAt: new Date() }))

      expect(getActiveRisksByOrg('org-1')).toHaveLength(2)
      expect(getActiveRisksByOrg('org-2')).toHaveLength(1)
      expect(getSoftDeletedRisks()).toHaveLength(3)
    })

    it('should detect KRIs linked to soft-deleted risks', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      const activeRisk = createRisk({ id: 'risk-active', orgId: 'org-1' })
      const deletedRisk = createRisk({
        id: 'risk-deleted',
        orgId: 'org-1',
        deletedAt: new Date(),
      })
      mockRisks.push(activeRisk, deletedRisk)

      // KRI linked to active risk (OK)
      mockKris.push(createKri({ riskId: 'risk-active', orgId: 'org-1' }))
      // KRI linked to deleted risk (should be flagged)
      mockKris.push(createKri({ riskId: 'risk-deleted', orgId: 'org-1' }))

      const flagged = getKrisWithDeletedRisk()
      expect(flagged).toHaveLength(1)
      expect(flagged[0].riskId).toBe('risk-deleted')
    })
  })

  // ----------------------------------------
  // 4. Score Calculations Match Stored Values
  // ----------------------------------------
  describe('Score Calculations Match Stored Values', () => {
    it('should detect risks with incorrect inherent score', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      // Correct: 3 * 4 = 12
      mockRisks.push(createRisk({
        likelihood: 3,
        impact: 4,
        inherentScore: 12,
      }))

      // Incorrect: 5 * 5 should be 25, not 20
      mockRisks.push(createRisk({
        likelihood: 5,
        impact: 5,
        inherentScore: 20, // Wrong!
      }))

      const incorrect = getRisksWithIncorrectInherentScore()
      expect(incorrect).toHaveLength(1)
      expect(incorrect[0].inherentScore).toBe(20)
      expect(incorrect[0].likelihood * incorrect[0].impact).toBe(25)
    })

    it('should detect risks with incorrect residual score', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      // Correct: 2 * 3 = 6
      mockRisks.push(createRisk({
        residualLikelihood: 2,
        residualImpact: 3,
        residualScore: 6,
      }))

      // Incorrect: 4 * 4 should be 16, not 15
      mockRisks.push(createRisk({
        residualLikelihood: 4,
        residualImpact: 4,
        residualScore: 15, // Wrong!
      }))

      const incorrect = getRisksWithIncorrectResidualScore()
      expect(incorrect).toHaveLength(1)
      expect(incorrect[0].residualScore).toBe(15)
    })

    it('should validate all score combinations (1-5 range)', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      // Create risks with all valid L×I combinations
      for (let l = 1; l <= 5; l++) {
        for (let i = 1; i <= 5; i++) {
          mockRisks.push(createRisk({
            likelihood: l,
            impact: i,
            inherentScore: l * i,
            residualLikelihood: l,
            residualImpact: i,
            residualScore: l * i,
          }))
        }
      }

      expect(getRisksWithIncorrectInherentScore()).toHaveLength(0)
      expect(getRisksWithIncorrectResidualScore()).toHaveLength(0)
    })

    it('should detect assessment with incorrect risk count', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      // Create 5 active risks
      for (let i = 0; i < 5; i++) {
        mockRisks.push(createRisk({ orgId: 'org-1' }))
      }

      // Assessment says 10 risks (wrong!)
      mockAssessments.push(createAssessment({
        orgId: 'org-1',
        riskCount: 10,
      }))

      const incorrect = getAssessmentsWithIncorrectRiskCount()
      expect(incorrect).toHaveLength(1)
      expect(incorrect[0].riskCount).toBe(10)
    })

    it('should pass when assessment risk count is correct', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      // Create 7 active risks
      for (let i = 0; i < 7; i++) {
        mockRisks.push(createRisk({ orgId: 'org-1' }))
      }

      mockAssessments.push(createAssessment({
        orgId: 'org-1',
        riskCount: 7,
      }))

      expect(getAssessmentsWithIncorrectRiskCount()).toHaveLength(0)
    })

    it('should detect risks with out-of-range scores', () => {
      const org = createOrganisation({ id: 'org-1' })
      mockOrganisations.push(org)

      // Valid risk
      mockRisks.push(createRisk({
        likelihood: 3,
        impact: 4,
        residualLikelihood: 2,
        residualImpact: 3,
      }))

      // Invalid: likelihood = 0
      mockRisks.push({
        ...createRisk(),
        likelihood: 0,
        impact: 3,
        inherentScore: 0,
      })

      // Invalid: impact = 6
      mockRisks.push({
        ...createRisk(),
        likelihood: 3,
        impact: 6,
        inherentScore: 18,
      })

      // Invalid: residualLikelihood = -1
      mockRisks.push({
        ...createRisk(),
        residualLikelihood: -1,
        residualImpact: 3,
        residualScore: -3,
      })

      const invalid = getRisksWithInvalidScoreRange()
      expect(invalid).toHaveLength(3)
    })
  })

  // ----------------------------------------
  // 5. No Cross-Org Data Leakage
  // ----------------------------------------
  describe('No Cross-Org Data Leakage', () => {
    it('should detect risks created by users from different org', () => {
      mockOrganisations.push(
        createOrganisation({ id: 'org-1' }),
        createOrganisation({ id: 'org-2' })
      )

      mockUsers.push(
        createUser({ id: 'user-org1', orgId: 'org-1' }),
        createUser({ id: 'user-org2', orgId: 'org-2' })
      )

      // Valid: user from org-1 creates risk in org-1
      mockRisks.push(createRisk({
        orgId: 'org-1',
        createdById: 'user-org1',
      }))

      // Invalid: user from org-2 creates risk in org-1 (cross-org!)
      mockRisks.push(createRisk({
        orgId: 'org-1',
        createdById: 'user-org2',
      }))

      const crossOrg = getRisksWithCrossOrgCreator()
      expect(crossOrg).toHaveLength(1)
      expect(crossOrg[0].createdById).toBe('user-org2')
    })

    it('should detect risks owned by users from different org', () => {
      mockOrganisations.push(
        createOrganisation({ id: 'org-1' }),
        createOrganisation({ id: 'org-2' })
      )

      mockUsers.push(
        createUser({ id: 'user-org1', orgId: 'org-1' }),
        createUser({ id: 'user-org2', orgId: 'org-2' })
      )

      // Valid: owner from same org
      mockRisks.push(createRisk({
        orgId: 'org-1',
        createdById: 'user-org1',
        ownerId: 'user-org1',
      }))

      // Invalid: owner from different org
      mockRisks.push(createRisk({
        orgId: 'org-1',
        createdById: 'user-org1',
        ownerId: 'user-org2', // Cross-org!
      }))

      const crossOrg = getRisksWithCrossOrgOwner()
      expect(crossOrg).toHaveLength(1)
      expect(crossOrg[0].ownerId).toBe('user-org2')
    })

    it('should detect audit logs with org mismatch to entity', () => {
      mockOrganisations.push(
        createOrganisation({ id: 'org-1' }),
        createOrganisation({ id: 'org-2' })
      )

      const user = createUser({ id: 'user-1', orgId: 'org-1' })
      mockUsers.push(user)

      const risk = createRisk({ id: 'risk-1', orgId: 'org-1' })
      mockRisks.push(risk)

      // Valid: audit log org matches risk org
      mockAuditLogs.push(createAuditLog({
        entityId: 'risk-1',
        entityType: 'RISK',
        orgId: 'org-1',
      }))

      // Invalid: audit log claims org-2 but risk is in org-1
      mockAuditLogs.push(createAuditLog({
        entityId: 'risk-1',
        entityType: 'RISK',
        orgId: 'org-2', // Mismatch!
      }))

      const mismatched = getAuditLogsWithOrgMismatch()
      expect(mismatched).toHaveLength(1)
      expect(mismatched[0].orgId).toBe('org-2')
    })

    it('should ensure no data isolation violations across multiple orgs', () => {
      // Create 3 orgs with users and risks
      for (let o = 1; o <= 3; o++) {
        mockOrganisations.push(createOrganisation({ id: `org-${o}` }))
        mockUsers.push(createUser({ id: `user-${o}`, orgId: `org-${o}` }))

        for (let r = 1; r <= 5; r++) {
          mockRisks.push(createRisk({
            orgId: `org-${o}`,
            createdById: `user-${o}`,
            ownerId: `user-${o}`,
          }))
        }
      }

      expect(getRisksWithCrossOrgCreator()).toHaveLength(0)
      expect(getRisksWithCrossOrgOwner()).toHaveLength(0)
    })

    it('should allow null owner without flagging as cross-org', () => {
      mockOrganisations.push(createOrganisation({ id: 'org-1' }))
      mockUsers.push(createUser({ id: 'user-1', orgId: 'org-1' }))

      mockRisks.push(createRisk({
        orgId: 'org-1',
        createdById: 'user-1',
        ownerId: null, // No owner assigned
      }))

      expect(getRisksWithCrossOrgOwner()).toHaveLength(0)
    })
  })

  // ----------------------------------------
  // 6. All Users Have Valid Roles
  // ----------------------------------------
  describe('All Users Have Valid Roles', () => {
    it('should accept all valid roles', () => {
      mockOrganisations.push(createOrganisation({ id: 'org-1' }))

      VALID_ROLES.forEach(role => {
        mockUsers.push(createUser({ role, orgId: 'org-1' }))
      })

      expect(getUsersWithInvalidRoles()).toHaveLength(0)
    })

    it('should detect users with invalid roles', () => {
      mockOrganisations.push(createOrganisation({ id: 'org-1' }))

      mockUsers.push(createUser({ role: 'ADMIN', orgId: 'org-1' }))
      mockUsers.push(createUser({ role: 'SUPER_ADMIN', orgId: 'org-1' })) // Invalid
      mockUsers.push(createUser({ role: 'GUEST', orgId: 'org-1' })) // Invalid
      mockUsers.push(createUser({ role: '', orgId: 'org-1' })) // Invalid

      const invalid = getUsersWithInvalidRoles()
      expect(invalid).toHaveLength(3)
      expect(invalid.map(u => u.role)).toContain('SUPER_ADMIN')
      expect(invalid.map(u => u.role)).toContain('GUEST')
      expect(invalid.map(u => u.role)).toContain('')
    })

    it('should detect users with non-existent organisation', () => {
      mockOrganisations.push(createOrganisation({ id: 'org-1' }))

      mockUsers.push(createUser({ orgId: 'org-1' })) // Valid
      mockUsers.push(createUser({ orgId: 'org-deleted' })) // Invalid
      mockUsers.push(createUser({ orgId: 'org-nonexistent' })) // Invalid

      const invalid = getUsersWithInvalidOrg()
      expect(invalid).toHaveLength(2)
    })

    it('should validate role case sensitivity', () => {
      mockOrganisations.push(createOrganisation({ id: 'org-1' }))

      mockUsers.push(createUser({ role: 'ADMIN', orgId: 'org-1' })) // Valid
      mockUsers.push(createUser({ role: 'admin', orgId: 'org-1' })) // Invalid (lowercase)
      mockUsers.push(createUser({ role: 'Admin', orgId: 'org-1' })) // Invalid (mixed case)

      const invalid = getUsersWithInvalidRoles()
      expect(invalid).toHaveLength(2)
    })
  })

  // ----------------------------------------
  // Additional Integrity Checks
  // ----------------------------------------
  describe('Additional Integrity Checks', () => {
    it('should detect duplicate refCodes within same org', () => {
      mockOrganisations.push(
        createOrganisation({ id: 'org-1' }),
        createOrganisation({ id: 'org-2' })
      )

      // Same refCode in same org = duplicate
      mockRisks.push(createRisk({ refCode: 'R-0001', orgId: 'org-1' }))
      mockRisks.push(createRisk({ refCode: 'R-0001', orgId: 'org-1' })) // Duplicate!
      mockRisks.push(createRisk({ refCode: 'R-0002', orgId: 'org-1' })) // OK

      // Same refCode in different org = OK
      mockRisks.push(createRisk({ refCode: 'R-0001', orgId: 'org-2' })) // OK (different org)

      const duplicates = getDuplicateRefCodesInOrg()
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].refCode).toBe('R-0001')
      expect(duplicates[0].orgId).toBe('org-1')
      expect(duplicates[0].count).toBe(2)
    })

    it('should allow same refCode across different orgs', () => {
      mockOrganisations.push(
        createOrganisation({ id: 'org-1' }),
        createOrganisation({ id: 'org-2' }),
        createOrganisation({ id: 'org-3' })
      )

      // Each org has R-0001 - this is allowed
      mockRisks.push(createRisk({ refCode: 'R-0001', orgId: 'org-1' }))
      mockRisks.push(createRisk({ refCode: 'R-0001', orgId: 'org-2' }))
      mockRisks.push(createRisk({ refCode: 'R-0001', orgId: 'org-3' }))

      const duplicates = getDuplicateRefCodesInOrg()
      expect(duplicates).toHaveLength(0)
    })

    it('should perform comprehensive data integrity check', () => {
      // Set up valid data structure
      const org = createOrganisation({ id: 'org-1' })
      const user = createUser({ id: 'user-1', orgId: 'org-1', role: 'ADMIN' })
      mockOrganisations.push(org)
      mockUsers.push(user)

      // Create 10 valid risks
      for (let i = 1; i <= 10; i++) {
        const risk = createRisk({
          id: `risk-${i}`,
          refCode: `R-${i.toString().padStart(4, '0')}`,
          orgId: 'org-1',
          createdById: 'user-1',
          likelihood: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          impact: (((i + 2) % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        })
        risk.inherentScore = risk.likelihood * risk.impact
        mockRisks.push(risk)

        // Create audit log for each risk
        mockAuditLogs.push(createAuditLog({
          entityId: `risk-${i}`,
          entityType: 'RISK',
          userId: 'user-1',
          orgId: 'org-1',
        }))
      }

      // Create assessment with correct count
      mockAssessments.push(createAssessment({
        orgId: 'org-1',
        riskCount: 10,
      }))

      // Run all integrity checks
      expect(getOrphanedRiskAuditLogs()).toHaveLength(0)
      expect(getOrphanedUserAuditLogs()).toHaveLength(0)
      expect(getOrphanedOrgAuditLogs()).toHaveLength(0)
      expect(getRisksWithIncorrectInherentScore()).toHaveLength(0)
      expect(getRisksWithCrossOrgCreator()).toHaveLength(0)
      expect(getUsersWithInvalidRoles()).toHaveLength(0)
      expect(getUsersWithInvalidOrg()).toHaveLength(0)
      expect(getDuplicateRefCodesInOrg()).toHaveLength(0)
      expect(getAssessmentsWithIncorrectRiskCount()).toHaveLength(0)
    })

    it('should detect multiple integrity violations simultaneously', () => {
      mockOrganisations.push(createOrganisation({ id: 'org-1' }))

      // User with invalid role
      mockUsers.push(createUser({ id: 'user-1', orgId: 'org-1', role: 'INVALID' }))

      // Risk with wrong score
      mockRisks.push(createRisk({
        id: 'risk-1',
        likelihood: 5,
        impact: 5,
        inherentScore: 20, // Should be 25
        orgId: 'org-1',
        createdById: 'user-1',
      }))

      // Orphaned audit log
      mockAuditLogs.push(createAuditLog({
        entityId: 'risk-deleted',
        entityType: 'RISK',
        userId: 'user-1',
        orgId: 'org-1',
      }))

      // Assessment with wrong count
      mockAssessments.push(createAssessment({
        orgId: 'org-1',
        riskCount: 5, // Actually 1
      }))

      // All violations should be detected
      expect(getUsersWithInvalidRoles()).toHaveLength(1)
      expect(getRisksWithIncorrectInherentScore()).toHaveLength(1)
      expect(getOrphanedRiskAuditLogs()).toHaveLength(1)
      expect(getAssessmentsWithIncorrectRiskCount()).toHaveLength(1)
    })
  })
})
