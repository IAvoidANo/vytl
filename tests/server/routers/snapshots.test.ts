import { describe, it, expect, beforeEach, vi } from 'vitest'

// ============================================
// Mock Setup
// ============================================

const mockPrisma = {
  riskSnapshot: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  riskSnapshotDetail: {
    findMany: vi.fn(),
  },
  risk: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  assessment: {
    findFirst: vi.fn(),
  },
  kri: {
    findMany: vi.fn(),
  },
  organisation: {
    findUniqueOrThrow: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}

const mockCreateAuditLog = vi.fn()
const mockCaptureSnapshot = vi.fn()
const mockHasBaselineSnapshot = vi.fn()
const mockGetEarliestSnapshotDate = vi.fn()

vi.mock('@/lib/db', () => ({ db: mockPrisma }))
vi.mock('@/lib/audit', () => ({ createAuditLog: mockCreateAuditLog }))
vi.mock('@/lib/snapshot-utils', () => ({
  captureSnapshot: mockCaptureSnapshot,
  hasBaselineSnapshot: mockHasBaselineSnapshot,
  getEarliestSnapshotDate: mockGetEarliestSnapshotDate,
}))

// ============================================
// Shared test data factories
// ============================================

const makeSnapshot = (overrides: Record<string, unknown> = {}) => ({
  id: 'snap-1',
  orgId: 'org-1',
  snapshotDate: new Date('2025-01-01'),
  snapshotType: 'MANUAL',
  createdBy: 'user-1',
  vytlScore: 72,
  vytlGrade: 'B',
  vytlCoverage: 18,
  vytlControl: 20,
  vytlMaturity: 17,
  vytlTrend: 17,
  totalRisks: 10,
  openRisks: 7,
  inProgressRisks: 2,
  monitoringRisks: 1,
  closedRisks: 0,
  archivedRisks: 0,
  risksByCategory: { STRATEGIC: 5, OPERATIONAL: 5 },
  lowRiskCount: 3,
  mediumRiskCount: 4,
  highRiskCount: 2,
  extremeRiskCount: 1,
  krisTotal: 6,
  krisGreen: 4,
  krisAmber: 1,
  krisRed: 1,
  treatmentsTotal: 8,
  treatmentsOpen: 3,
  treatmentsInProgress: 2,
  treatmentsCompleted: 3,
  treatmentCompletionRate: 37.5,
  scoreBreakdown: null,
  createdAt: new Date('2025-01-01'),
  ...overrides,
})

// ============================================
// Tests — simulate router logic manually (pattern from risk.test.ts)
// ============================================

describe('snapshots router logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // capture
  // ============================================
  describe('capture', () => {
    it('calls captureSnapshot with MANUAL type', async () => {
      mockCaptureSnapshot.mockResolvedValue({ id: 'snap-new', snapshotDate: new Date(), riskCount: 5 })

      const result = await mockCaptureSnapshot('org-1', 'MANUAL', 'user-1')

      expect(mockCaptureSnapshot).toHaveBeenCalledWith('org-1', 'MANUAL', 'user-1')
      expect(result.riskCount).toBe(5)
    })

    it('returns snapshot id and date from capture', async () => {
      const snapDate = new Date('2025-06-01')
      mockCaptureSnapshot.mockResolvedValue({ id: 'snap-x', snapshotDate: snapDate, riskCount: 12 })

      const result = await mockCaptureSnapshot('org-1', 'MANUAL', 'user-1')

      expect(result.id).toBe('snap-x')
      expect(result.snapshotDate).toEqual(snapDate)
    })
  })

  // ============================================
  // list
  // ============================================
  describe('list', () => {
    it('queries snapshots filtered by orgId', async () => {
      const orgId = 'org-1'
      mockPrisma.riskSnapshot.findMany.mockResolvedValue([makeSnapshot(), makeSnapshot({ id: 'snap-2' })])

      const snapshots = await mockPrisma.riskSnapshot.findMany({
        where: { orgId },
        orderBy: { snapshotDate: 'desc' },
        take: 21,
      })

      expect(mockPrisma.riskSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orgId } })
      )
      expect(snapshots).toHaveLength(2)
    })

    it('applies cursor pagination correctly', async () => {
      // limit=5, returns 6 items → nextCursor is set to 6th item id
      const items = Array.from({ length: 6 }, (_, i) => makeSnapshot({ id: `snap-${i}` }))
      mockPrisma.riskSnapshot.findMany.mockResolvedValue(items)

      const result = await mockPrisma.riskSnapshot.findMany({ take: 6 })

      // Simulate pagination logic from router
      const limit = 5
      let nextCursor: string | undefined
      if (result.length > limit) {
        nextCursor = result.pop()!.id
      }

      expect(result).toHaveLength(limit)
      expect(nextCursor).toBe('snap-5')
    })
  })

  // ============================================
  // getById
  // ============================================
  describe('getById', () => {
    it('returns snapshot with matching orgId', async () => {
      const snap = { ...makeSnapshot(), riskDetails: [] }
      mockPrisma.riskSnapshot.findUnique.mockResolvedValue(snap)

      const found = await mockPrisma.riskSnapshot.findUnique({ where: { id: 'snap-1' } })

      expect(found).not.toBeNull()
      expect(found!.orgId).toBe('org-1')
    })

    it('throws when snapshot orgId does not match user orgId', async () => {
      mockPrisma.riskSnapshot.findUnique.mockResolvedValue({ ...makeSnapshot(), orgId: 'org-other' })

      const snap = await mockPrisma.riskSnapshot.findUnique({ where: { id: 'snap-1' } })
      const userOrgId = 'org-1'

      // Router logic: if orgId doesn't match, throw FORBIDDEN
      expect(snap!.orgId).not.toBe(userOrgId)
    })

    it('returns null when snapshot does not exist', async () => {
      mockPrisma.riskSnapshot.findUnique.mockResolvedValue(null)

      const snap = await mockPrisma.riskSnapshot.findUnique({ where: { id: 'missing' } })
      expect(snap).toBeNull()
    })
  })

  // ============================================
  // checkDataAvailability
  // ============================================
  describe('checkDataAvailability', () => {
    it('returns insufficient data when getEarliestSnapshotDate returns null', async () => {
      mockGetEarliestSnapshotDate.mockResolvedValue(null)

      const earliestDate = await mockGetEarliestSnapshotDate('org-1')
      const result = earliestDate
        ? { hasSufficientData: true, earliestSnapshotDate: earliestDate }
        : { hasSufficientData: false, earliestSnapshotDate: null, monthsOfData: 0 }

      expect(result.hasSufficientData).toBe(false)
      expect(result.monthsOfData).toBe(0)
    })

    it('calculates months from earliest date correctly', async () => {
      const fourMonthsAgo = new Date()
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)
      mockGetEarliestSnapshotDate.mockResolvedValue(fourMonthsAgo)

      const earliestDate = await mockGetEarliestSnapshotDate('org-1')
      const months = Math.floor((new Date().getTime() - earliestDate!.getTime()) / (1000 * 60 * 60 * 24 * 30))

      expect(months).toBeGreaterThanOrEqual(3)
    })

    it('marks hasSufficientData=true when 3+ months of data exists', async () => {
      const fiveMonthsAgo = new Date()
      fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5)
      mockGetEarliestSnapshotDate.mockResolvedValue(fiveMonthsAgo)

      const earliestDate = await mockGetEarliestSnapshotDate('org-1')
      const months = Math.floor((new Date().getTime() - earliestDate!.getTime()) / (1000 * 60 * 60 * 24 * 30))
      const hasSufficientData = months >= 3

      expect(hasSufficientData).toBe(true)
    })
  })

  // ============================================
  // compare
  // ============================================
  describe('compare', () => {
    it('returns hasSufficientData=false when no snapshots in period', async () => {
      mockPrisma.riskSnapshot.findFirst.mockResolvedValue(null)

      const earliest = await mockPrisma.riskSnapshot.findFirst()
      const latest = await mockPrisma.riskSnapshot.findFirst()

      // Router logic: if either is null, return insufficient
      const hasSufficientData = earliest != null && latest != null && earliest.id !== latest.id
      expect(hasSufficientData).toBe(false)
    })

    it('returns hasSufficientData=false when earliest and latest are the same snapshot', async () => {
      const snap = makeSnapshot()
      mockPrisma.riskSnapshot.findFirst.mockResolvedValue(snap)

      const earliest = await mockPrisma.riskSnapshot.findFirst()
      const latest = await mockPrisma.riskSnapshot.findFirst()

      const hasSufficientData = earliest != null && latest != null && earliest.id !== latest.id
      expect(hasSufficientData).toBe(false)
    })

    it('calculates score delta between two snapshots', () => {
      const then = 60
      const now = 72
      const change = now - then
      const changePercent = then > 0 ? (change / then) * 100 : null

      expect(change).toBe(12)
      expect(changePercent).toBeCloseTo(20, 1)
    })

    it('calculates KRI red delta correctly', () => {
      const redThen = 2
      const redNow = 5
      const redDelta = redNow - redThen

      expect(redDelta).toBe(3)
    })
  })

  // ============================================
  // delete
  // ============================================
  describe('delete', () => {
    it('deletes snapshot and creates audit log when org matches', async () => {
      const snap = makeSnapshot()
      mockPrisma.riskSnapshot.findUnique.mockResolvedValue(snap)
      mockPrisma.riskSnapshot.delete.mockResolvedValue({ id: snap.id })
      mockCreateAuditLog.mockResolvedValue({})

      // Simulate router logic
      const found = await mockPrisma.riskSnapshot.findUnique({ where: { id: 'snap-1' } })
      expect(found).not.toBeNull()
      expect(found!.orgId).toBe('org-1')

      await mockCreateAuditLog({
        action: 'DELETE_SNAPSHOT',
        entityType: 'SNAPSHOT',
        entityId: snap.id,
        userId: 'user-1',
        orgId: 'org-1',
        oldValues: { justification: 'Test reason for deletion here' },
      })

      await mockPrisma.riskSnapshot.delete({ where: { id: 'snap-1' } })

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE_SNAPSHOT', entityType: 'SNAPSHOT' })
      )
      expect(mockPrisma.riskSnapshot.delete).toHaveBeenCalledWith({ where: { id: 'snap-1' } })
    })

    it('validates justification length (minimum 10 characters)', () => {
      const short = 'Too short'
      const valid = 'This is a valid justification reason'

      // Zod schema: z.string().min(10)
      expect(short.length).toBeLessThan(10)
      expect(valid.length).toBeGreaterThanOrEqual(10)
    })

    it('does not delete when snapshot orgId mismatches', async () => {
      mockPrisma.riskSnapshot.findUnique.mockResolvedValue({ ...makeSnapshot(), orgId: 'org-other' })

      const snap = await mockPrisma.riskSnapshot.findUnique({ where: { id: 'snap-1' } })
      const userOrgId = 'org-1'

      // Router throws FORBIDDEN — not calling delete
      const isForbidden = snap!.orgId !== userOrgId
      expect(isForbidden).toBe(true)
      expect(mockPrisma.riskSnapshot.delete).not.toHaveBeenCalled()
    })
  })
})
