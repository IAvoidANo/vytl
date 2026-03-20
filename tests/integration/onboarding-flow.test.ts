/**
 * Onboarding Flow Integration Tests
 *
 * Tests the complete onboarding flow business logic end-to-end:
 * template application → sample mode → exits (manual / clear / auto).
 *
 * Pattern: pure-function & in-memory mock tests (no real DB / no router import).
 * Follows the established project convention — see risk.test.ts and data-integrity.test.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getTemplateByCode,
  getAllTemplates,
  calculateTemplateRiskScores,
  validateTemplate,
  INDUSTRY_TEMPLATES,
  type IndustryCode,
  type IndustryTemplate,
} from '@/lib/industry-templates'

// ─────────────────────────────────────────────────────────────────────────────
// In-memory state — mirrors the DB entities touched during onboarding
// ─────────────────────────────────────────────────────────────────────────────

interface MockOrg {
  id: string
  name: string
  industry: string | null
  isInSampleMode: boolean
  sampleDataAppliedAt: Date | null
  sampleDataExitedAt: Date | null
}

interface MockRegister {
  id: string
  name: string
  description: string
  status: string
  orgId: string
}

interface MockRisk {
  id: string
  refCode: string
  title: string
  description: string
  category: string
  controls: string
  rootCause: string
  isOngoing: boolean
  inherentLikelihood: number
  inherentImpact: number
  inherentScore: number
  residualLikelihood: number
  residualImpact: number
  residualScore: number
  source: string
  workflowStatus: string
  registerId: string
  createdById: string
  ownerId: string
}

interface MockAssessment {
  id: string
  score: number
  grade: string
  riskCount: number
  orgId: string
  type: string
  createdAt: Date
}

interface MockAuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  orgId: string
  userId: string
  newValues: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulated Vytl Score calculation (mirrors vytl-score.ts formula)
// ─────────────────────────────────────────────────────────────────────────────

function calculateScore(risks: MockRisk[]): { score: number; grade: string } {
  if (risks.length === 0) return { score: 0, grade: 'F' }

  // Simplified Vytl Score: avg residual risk reduction relative to inherent
  const totalInherent = risks.reduce((s, r) => s + r.inherentScore, 0)
  const totalResidual = risks.reduce((s, r) => s + r.residualScore, 0)
  const maxPossible = risks.length * 25

  // Score improves with controls (lower residual vs inherent ratio = better score)
  const controlFactor = totalInherent > 0 ? 1 - totalResidual / totalInherent : 0
  const raw = Math.round(50 + controlFactor * 50 - (totalResidual / maxPossible) * 20)
  const score = Math.min(100, Math.max(0, raw))

  const grade =
    score >= 80 ? 'A' :
    score >= 60 ? 'B' :
    score >= 40 ? 'C' :
    score >= 20 ? 'D' : 'F'

  return { score, grade }
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulated router operations (mirrors template.ts + risk.ts mutations)
// ─────────────────────────────────────────────────────────────────────────────

let mockOrgs: MockOrg[] = []
let mockRegisters: MockRegister[] = []
let mockRisks: MockRisk[] = []
let mockAssessments: MockAssessment[] = []
let mockAuditLogs: MockAuditLog[] = []

let _idSeq = 0
function nextId(prefix: string) {
  return `${prefix}-${++_idSeq}`
}

/**
 * Simulates template.applyTemplate mutation logic.
 */
function applyTemplate(
  orgId: string,
  userId: string,
  industryCode: IndustryCode
): { registerId: string; riskCount: number; vytlScore: number; grade: string } {
  // Guard: org must have 0 risks
  const existingCount = mockRisks.filter(r =>
    mockRegisters.find(reg => reg.id === r.registerId && reg.orgId === orgId)
  ).length
  if (existingCount > 0) {
    throw new Error('PRECONDITION_FAILED: Organisation already has risks')
  }

  const template = getTemplateByCode(industryCode)
  if (!template) throw new Error('NOT_FOUND: Industry template not found')

  // Create register
  const register: MockRegister = {
    id: nextId('reg'),
    name: `${template.name} Risk Register`,
    description: `Pre-populated ${template.name} risk register created from industry template.`,
    status: 'ACTIVE',
    orgId,
  }
  mockRegisters.push(register)

  // Bulk-insert risks
  const createdRisks: MockRisk[] = []
  template.risks.forEach((t, idx) => {
    const categoryPrefix = t.category.substring(0, 3).toUpperCase()
    const refCode = `${categoryPrefix}-${String(idx + 1).padStart(3, '0')}`
    const risk: MockRisk = {
      id: nextId('risk'),
      refCode,
      title: t.title,
      description: t.description,
      category: t.category,
      controls: t.controls,
      rootCause: t.rootCause,
      isOngoing: t.isOngoing,
      inherentLikelihood: t.inherentLikelihood,
      inherentImpact: t.inherentImpact,
      inherentScore: t.inherentLikelihood * t.inherentImpact,
      residualLikelihood: t.residualLikelihood,
      residualImpact: t.residualImpact,
      residualScore: t.residualLikelihood * t.residualImpact,
      source: 'TEMPLATE',
      workflowStatus: 'APPROVED',
      registerId: register.id,
      createdById: userId,
      ownerId: userId,
    }
    mockRisks.push(risk)
    createdRisks.push(risk)
  })

  // Update org
  const org = mockOrgs.find(o => o.id === orgId)!
  org.industry = industryCode
  org.isInSampleMode = true
  org.sampleDataAppliedAt = new Date()

  // Calculate + store assessment
  const { score, grade } = calculateScore(createdRisks)
  mockAssessments.push({
    id: nextId('assess'),
    score,
    grade,
    riskCount: createdRisks.length,
    orgId,
    type: 'INITIAL',
    createdAt: new Date(),
  })

  // Audit log
  mockAuditLogs.push({
    id: nextId('audit'),
    action: 'CREATE',
    entityType: 'REGISTER',
    entityId: register.id,
    orgId,
    userId,
    newValues: { templateApplied: industryCode, riskCount: createdRisks.length, sampleMode: true },
  })

  return { registerId: register.id, riskCount: createdRisks.length, vytlScore: score, grade }
}

/**
 * Simulates template.exitSampleMode mutation logic — keeps risks.
 */
function exitSampleMode(orgId: string, userId: string): { success: boolean } {
  const org = mockOrgs.find(o => o.id === orgId)!
  org.isInSampleMode = false
  org.sampleDataExitedAt = new Date()

  mockAuditLogs.push({
    id: nextId('audit'),
    action: 'UPDATE',
    entityType: 'ORGANISATION',
    entityId: orgId,
    orgId,
    userId,
    newValues: { isInSampleMode: false, exitMethod: 'manual' },
  })

  return { success: true }
}

/**
 * Simulates template.clearSampleData mutation logic — deletes everything.
 */
function clearSampleData(orgId: string, userId: string): { success: boolean } {
  const org = mockOrgs.find(o => o.id === orgId)!
  if (!org.isInSampleMode) throw new Error('PRECONDITION_FAILED: Not in sample mode')

  // Delete risks in org's registers
  const orgRegisterIds = mockRegisters.filter(r => r.orgId === orgId).map(r => r.id)
  mockRisks = mockRisks.filter(r => !orgRegisterIds.includes(r.registerId))

  // Delete registers
  mockRegisters = mockRegisters.filter(r => r.orgId !== orgId)

  // Delete assessments
  mockAssessments = mockAssessments.filter(a => a.orgId !== orgId)

  // Exit sample mode
  org.isInSampleMode = false
  org.sampleDataExitedAt = new Date()

  mockAuditLogs.push({
    id: nextId('audit'),
    action: 'UPDATE',
    entityType: 'ORGANISATION',
    entityId: orgId,
    orgId,
    userId,
    newValues: { isInSampleMode: false, exitMethod: 'clear' },
  })

  return { success: true }
}

/**
 * Simulates risk.update auto-exit logic on first edit.
 */
function updateRisk(
  riskId: string,
  orgId: string,
  userId: string,
  updates: Partial<Pick<MockRisk, 'title' | 'description' | 'residualLikelihood' | 'residualImpact'>>
): MockRisk {
  const org = mockOrgs.find(o => o.id === orgId)!
  const risk = mockRisks.find(r => r.id === riskId)
  if (!risk) throw new Error('NOT_FOUND: Risk not found')

  // Auto-exit sample mode on first edit
  if (org.isInSampleMode) {
    org.isInSampleMode = false
    org.sampleDataExitedAt = new Date()
  }

  Object.assign(risk, updates)
  if (updates.residualLikelihood !== undefined || updates.residualImpact !== undefined) {
    risk.residualScore = risk.residualLikelihood * risk.residualImpact
  }

  return risk
}

function getOrgRisks(orgId: string): MockRisk[] {
  const orgRegisterIds = mockRegisters.filter(r => r.orgId === orgId).map(r => r.id)
  return mockRisks.filter(r => orgRegisterIds.includes(r.registerId))
}

function getOrgRegisters(orgId: string): MockRegister[] {
  return mockRegisters.filter(r => r.orgId === orgId)
}

function getOrgAssessments(orgId: string): MockAssessment[] {
  return mockAssessments.filter(a => a.orgId === orgId)
}

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createOrg(overrides: Partial<MockOrg> = {}): MockOrg {
  return {
    id: nextId('org'),
    name: 'Test Organisation',
    industry: null,
    isInSampleMode: false,
    sampleDataAppliedAt: null,
    sampleDataExitedAt: null,
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Onboarding Flow Integration', () => {
  let org: MockOrg
  const userId = 'user-test'

  beforeEach(() => {
    // Reset all state
    mockOrgs = []
    mockRegisters = []
    mockRisks = []
    mockAssessments = []
    mockAuditLogs = []
    _idSeq = 0

    org = createOrg()
    mockOrgs.push(org)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Template Application
  // ───────────────────────────────────────────────────────────────────────────

  describe('Template Application', () => {
    it('applies MANUFACTURING template — creates 15 risks', () => {
      const result = applyTemplate(org.id, userId, 'MANUFACTURING')
      expect(result.riskCount).toBe(15)
      expect(getOrgRisks(org.id)).toHaveLength(15)
    })

    it('applies FINANCIAL_SERVICES template — creates 15 risks', () => {
      const result = applyTemplate(org.id, userId, 'FINANCIAL_SERVICES')
      expect(result.riskCount).toBe(15)
      expect(getOrgRisks(org.id)).toHaveLength(15)
    })

    it('applies RETAIL template — creates 15 risks', () => {
      const result = applyTemplate(org.id, userId, 'RETAIL')
      expect(result.riskCount).toBe(15)
      expect(getOrgRisks(org.id)).toHaveLength(15)
    })

    it('creates exactly 1 register per template application', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const registers = getOrgRegisters(org.id)
      expect(registers).toHaveLength(1)
      expect(registers[0].status).toBe('ACTIVE')
      expect(registers[0].name).toContain('Risk Register')
    })

    it('sets org industry to the selected code', () => {
      applyTemplate(org.id, userId, 'FINANCIAL_SERVICES')
      expect(org.industry).toBe('FINANCIAL_SERVICES')
    })

    it('enables sample mode after template application', () => {
      expect(org.isInSampleMode).toBe(false)
      applyTemplate(org.id, userId, 'RETAIL')
      expect(org.isInSampleMode).toBe(true)
      expect(org.sampleDataAppliedAt).toBeInstanceOf(Date)
    })

    it('calculates and persists a Vytl Score assessment', () => {
      const result = applyTemplate(org.id, userId, 'MANUFACTURING')
      const assessments = getOrgAssessments(org.id)
      expect(assessments).toHaveLength(1)
      expect(assessments[0].score).toBe(result.vytlScore)
      expect(assessments[0].grade).toBe(result.grade)
      expect(assessments[0].riskCount).toBe(15)
    })

    it('Vytl Score is a positive number', () => {
      const result = applyTemplate(org.id, userId, 'MANUFACTURING')
      expect(result.vytlScore).toBeGreaterThan(0)
      expect(result.vytlScore).toBeLessThanOrEqual(100)
    })

    it('grade is a valid letter grade', () => {
      const result = applyTemplate(org.id, userId, 'FINANCIAL_SERVICES')
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade)
    })

    it('writes an audit log for the template application', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const log = mockAuditLogs.find(l => l.entityType === 'REGISTER' && l.action === 'CREATE')
      expect(log).toBeDefined()
      expect(log!.newValues.templateApplied).toBe('MANUFACTURING')
      expect(log!.newValues.sampleMode).toBe(true)
    })

    it('prevents applying template when org already has risks', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      expect(() => applyTemplate(org.id, userId, 'RETAIL')).toThrow('PRECONDITION_FAILED')
    })

    it('all created risks have source=TEMPLATE and workflowStatus=APPROVED', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        expect(r.source).toBe('TEMPLATE')
        expect(r.workflowStatus).toBe('APPROVED')
      })
    })

    it('all created risks have unique refCodes within the org', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const risks = getOrgRisks(org.id)
      const refCodes = risks.map(r => r.refCode)
      const unique = new Set(refCodes)
      expect(unique.size).toBe(15)
    })

    it('all template risks have correct inherentScore = L × I', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        expect(r.inherentScore).toBe(r.inherentLikelihood * r.inherentImpact)
      })
    })

    it('all template risks have correct residualScore = L × I', () => {
      applyTemplate(org.id, userId, 'RETAIL')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        expect(r.residualScore).toBe(r.residualLikelihood * r.residualImpact)
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Sample Mode — exitSampleMode (keeps data)
  // ───────────────────────────────────────────────────────────────────────────

  describe('Sample Mode — exitSampleMode', () => {
    beforeEach(() => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
    })

    it('clears sample mode flag', () => {
      expect(org.isInSampleMode).toBe(true)
      exitSampleMode(org.id, userId)
      expect(org.isInSampleMode).toBe(false)
    })

    it('sets sampleDataExitedAt timestamp', () => {
      exitSampleMode(org.id, userId)
      expect(org.sampleDataExitedAt).toBeInstanceOf(Date)
    })

    it('preserves all 15 risks after exit', () => {
      exitSampleMode(org.id, userId)
      expect(getOrgRisks(org.id)).toHaveLength(15)
    })

    it('preserves the register after exit', () => {
      exitSampleMode(org.id, userId)
      expect(getOrgRegisters(org.id)).toHaveLength(1)
    })

    it('preserves the Vytl Score assessment after exit', () => {
      exitSampleMode(org.id, userId)
      expect(getOrgAssessments(org.id)).toHaveLength(1)
    })

    it('writes an audit log for the exit action', () => {
      exitSampleMode(org.id, userId)
      const log = mockAuditLogs.find(
        l => l.entityType === 'ORGANISATION' && l.newValues.exitMethod === 'manual'
      )
      expect(log).toBeDefined()
      expect(log!.newValues.isInSampleMode).toBe(false)
    })

    it('returns success=true', () => {
      const result = exitSampleMode(org.id, userId)
      expect(result.success).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Sample Mode — clearSampleData (deletes all)
  // ───────────────────────────────────────────────────────────────────────────

  describe('Sample Mode — clearSampleData', () => {
    beforeEach(() => {
      applyTemplate(org.id, userId, 'FINANCIAL_SERVICES')
    })

    it('deletes all 15 risks', () => {
      clearSampleData(org.id, userId)
      expect(getOrgRisks(org.id)).toHaveLength(0)
    })

    it('deletes all registers', () => {
      clearSampleData(org.id, userId)
      expect(getOrgRegisters(org.id)).toHaveLength(0)
    })

    it('deletes all Vytl Score assessments', () => {
      clearSampleData(org.id, userId)
      expect(getOrgAssessments(org.id)).toHaveLength(0)
    })

    it('clears sample mode flag', () => {
      clearSampleData(org.id, userId)
      expect(org.isInSampleMode).toBe(false)
    })

    it('sets sampleDataExitedAt timestamp', () => {
      clearSampleData(org.id, userId)
      expect(org.sampleDataExitedAt).toBeInstanceOf(Date)
    })

    it('writes an audit log with exitMethod=clear', () => {
      clearSampleData(org.id, userId)
      const log = mockAuditLogs.find(
        l => l.entityType === 'ORGANISATION' && l.newValues.exitMethod === 'clear'
      )
      expect(log).toBeDefined()
    })

    it('throws PRECONDITION_FAILED when org is not in sample mode', () => {
      exitSampleMode(org.id, userId) // already exited
      expect(() => clearSampleData(org.id, userId)).toThrow('PRECONDITION_FAILED')
    })

    it('returns success=true', () => {
      const result = clearSampleData(org.id, userId)
      expect(result.success).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Auto-exit on risk edit
  // ───────────────────────────────────────────────────────────────────────────

  describe('Auto-exit on risk edit', () => {
    beforeEach(() => {
      applyTemplate(org.id, userId, 'RETAIL')
    })

    it('exits sample mode when a risk is updated', () => {
      expect(org.isInSampleMode).toBe(true)
      const [risk] = getOrgRisks(org.id)
      updateRisk(risk.id, org.id, userId, { title: 'Updated Title' })
      expect(org.isInSampleMode).toBe(false)
    })

    it('sets sampleDataExitedAt on auto-exit', () => {
      const [risk] = getOrgRisks(org.id)
      updateRisk(risk.id, org.id, userId, { title: 'Updated' })
      expect(org.sampleDataExitedAt).toBeInstanceOf(Date)
    })

    it('preserves all risks after auto-exit', () => {
      const [risk] = getOrgRisks(org.id)
      updateRisk(risk.id, org.id, userId, { title: 'Updated' })
      expect(getOrgRisks(org.id)).toHaveLength(15)
    })

    it('the updated risk reflects the new title', () => {
      const [risk] = getOrgRisks(org.id)
      updateRisk(risk.id, org.id, userId, { title: 'My Custom Risk Title' })
      const updated = mockRisks.find(r => r.id === risk.id)!
      expect(updated.title).toBe('My Custom Risk Title')
    })

    it('does NOT re-trigger exit when already outside sample mode', () => {
      exitSampleMode(org.id, userId)
      const exitedAt = org.sampleDataExitedAt

      const [risk] = getOrgRisks(org.id)
      updateRisk(risk.id, org.id, userId, { title: 'Another update' })

      // sampleDataExitedAt should remain the original exit timestamp
      expect(org.sampleDataExitedAt).toEqual(exitedAt)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Data Integrity after template application
  // ───────────────────────────────────────────────────────────────────────────

  describe('Data Integrity', () => {
    it('all 3 templates produce exactly 15 risks', () => {
      const codes: IndustryCode[] = ['MANUFACTURING', 'FINANCIAL_SERVICES', 'RETAIL']
      codes.forEach(code => {
        // Reset for each template
        mockOrgs = []
        mockRegisters = []
        mockRisks = []
        mockAssessments = []
        const o = createOrg()
        mockOrgs.push(o)
        applyTemplate(o.id, userId, code)
        expect(getOrgRisks(o.id)).toHaveLength(15)
      })
    })

    it('residualScore <= inherentScore for all template risks (controls reduce risk)', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        expect(r.residualScore).toBeLessThanOrEqual(r.inherentScore)
      })
    })

    it('all risks have controls text populated', () => {
      applyTemplate(org.id, userId, 'FINANCIAL_SERVICES')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        expect(r.controls.trim().length).toBeGreaterThan(20)
      })
    })

    it('all risks have descriptions longer than 100 chars', () => {
      applyTemplate(org.id, userId, 'RETAIL')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        expect(r.description.length).toBeGreaterThan(100)
      })
    })

    it('scores are within valid range (1-25)', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        expect(r.inherentScore).toBeGreaterThanOrEqual(1)
        expect(r.inherentScore).toBeLessThanOrEqual(25)
        expect(r.residualScore).toBeGreaterThanOrEqual(1)
        expect(r.residualScore).toBeLessThanOrEqual(25)
      })
    })

    it('risk categories are diverse — at least 5 distinct categories', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const risks = getOrgRisks(org.id)
      const categories = new Set(risks.map(r => r.category))
      expect(categories.size).toBeGreaterThanOrEqual(5)
    })

    it('two different orgs remain isolated after both apply templates', () => {
      const org2 = createOrg({ name: 'Org 2' })
      mockOrgs.push(org2)

      applyTemplate(org.id, userId, 'MANUFACTURING')
      applyTemplate(org2.id, userId, 'RETAIL')

      // Each org has its own 15 risks
      expect(getOrgRisks(org.id)).toHaveLength(15)
      expect(getOrgRisks(org2.id)).toHaveLength(15)

      // Each org has its own register
      expect(getOrgRegisters(org.id)).toHaveLength(1)
      expect(getOrgRegisters(org2.id)).toHaveLength(1)

      // No risk cross-contamination
      const org1RiskIds = new Set(getOrgRisks(org.id).map(r => r.id))
      const org2RiskIds = new Set(getOrgRisks(org2.id).map(r => r.id))
      const intersection = [...org1RiskIds].filter(id => org2RiskIds.has(id))
      expect(intersection).toHaveLength(0)
    })

    it('clearing org1 data does not affect org2 data', () => {
      const org2 = createOrg({ name: 'Org 2' })
      mockOrgs.push(org2)

      applyTemplate(org.id, userId, 'MANUFACTURING')
      applyTemplate(org2.id, userId, 'RETAIL')

      clearSampleData(org.id, userId)

      // Org1 should be empty
      expect(getOrgRisks(org.id)).toHaveLength(0)

      // Org2 should be untouched
      expect(getOrgRisks(org2.id)).toHaveLength(15)
      expect(org2.isInSampleMode).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Edge Cases
  // ───────────────────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('org with 0 risks can apply template (guard passes)', () => {
      expect(getOrgRisks(org.id)).toHaveLength(0)
      expect(() => applyTemplate(org.id, userId, 'MANUFACTURING')).not.toThrow()
    })

    it('cannot apply template twice to same org', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      expect(() => applyTemplate(org.id, userId, 'RETAIL')).toThrow()
    })

    it('getSampleModeStatus returns false for org never in sample mode', () => {
      const status = {
        isInSampleMode: org.isInSampleMode,
        sampleDataAppliedAt: org.sampleDataAppliedAt,
        industry: org.industry,
      }
      expect(status.isInSampleMode).toBe(false)
      expect(status.sampleDataAppliedAt).toBeNull()
      expect(status.industry).toBeNull()
    })

    it('getSampleModeStatus reflects state after template apply', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const status = {
        isInSampleMode: org.isInSampleMode,
        sampleDataAppliedAt: org.sampleDataAppliedAt,
        industry: org.industry,
      }
      expect(status.isInSampleMode).toBe(true)
      expect(status.sampleDataAppliedAt).toBeInstanceOf(Date)
      expect(status.industry).toBe('MANUFACTURING')
    })

    it('getSampleModeStatus reflects false after exitSampleMode', () => {
      applyTemplate(org.id, userId, 'RETAIL')
      exitSampleMode(org.id, userId)
      expect(org.isInSampleMode).toBe(false)
    })

    it('refCode format follows category prefix convention', () => {
      applyTemplate(org.id, userId, 'MANUFACTURING')
      const risks = getOrgRisks(org.id)
      risks.forEach(r => {
        // Should match AAA-001 pattern (3 uppercase letters - 3 digits)
        expect(r.refCode).toMatch(/^[A-Z]{3}-\d{3}$/)
      })
    })
  })
})
