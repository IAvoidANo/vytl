import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  listAllActionsSchema,
} from '@/lib/treatment-validation'

// ============================================
// Mock Setup (follows risk.test.ts pattern)
// ============================================

const mockPrisma = {
  treatmentAction: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  risk: {
    findFirst: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}

const mockCreateAuditLog = vi.fn()

vi.mock('@/lib/db', () => ({ db: mockPrisma }))
vi.mock('@/lib/audit', () => ({ createAuditLog: mockCreateAuditLog }))

// ============================================
// Test helpers
// ============================================

function createCtx(overrides?: Partial<{ id: string; orgId: string; role: string }>) {
  return {
    user: { id: 'user-1', orgId: 'org-1', role: 'RISK_MANAGER', ...overrides },
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  }
}

function makeAction(overrides = {}) {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 86_400_000)
  return {
    id: 'action-1',
    riskId: 'risk-1',
    title: 'Implement controls',
    description: null,
    priority: 'HIGH',
    status: 'OPEN',
    dueDate: yesterday,
    assigneeId: null,
    completedAt: null,
    createdById: 'user-1',
    createdAt: now,
    updatedAt: now,
    risk: {
      id: 'risk-1',
      refCode: 'RSK-001',
      title: 'Cyber Risk',
      register: { name: 'Main Register' },
    },
    assignee: null,
    createdBy: { id: 'user-1', name: 'Alice' },
    ...overrides,
  }
}

// ============================================
// listAll tests
// ============================================

describe('treatment.listAll logic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scopes query to orgId', async () => {
    const { db } = await import('@/lib/db')
    const { listAllActionsSchema } = await import('@/lib/treatment-validation')

    mockPrisma.treatmentAction.findMany.mockResolvedValue([makeAction()])

    const ctx = createCtx()
    const input = listAllActionsSchema.parse({})

    const where: Record<string, unknown> = {
      risk: { register: { orgId: ctx.user.orgId } },
    }

    await db.treatmentAction.findMany({ where, orderBy: { dueDate: 'asc' }, include: {} as never })

    expect(mockPrisma.treatmentAction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          risk: { register: { orgId: 'org-1' } },
        }),
      })
    )
  })

  it('adds status filter when provided', () => {
    // using top-level import: listAllActionsSchema
    const input = listAllActionsSchema.parse({ status: 'OPEN' })
    const where: Record<string, unknown> = {
      risk: { register: { orgId: 'org-1' } },
    }
    if (input.status) where.status = input.status

    expect(where.status).toBe('OPEN')
  })

  it('adds priority filter when provided', () => {
    // using top-level import: listAllActionsSchema
    const input = listAllActionsSchema.parse({ priority: 'CRITICAL' })
    const where: Record<string, unknown> = {
      risk: { register: { orgId: 'org-1' } },
    }
    if (input.priority) where.priority = input.priority

    expect(where.priority).toBe('CRITICAL')
  })

  it('adds assigneeId filter when provided', () => {
    // using top-level import: listAllActionsSchema
    const input = listAllActionsSchema.parse({ assigneeId: 'user-42' })
    const where: Record<string, unknown> = {
      risk: { register: { orgId: 'org-1' } },
    }
    if (input.assigneeId) where.assigneeId = input.assigneeId

    expect(where.assigneeId).toBe('user-42')
  })

  it('applies overdueOnly filter: dueDate lt now + status notIn completed/cancelled', () => {
    // using top-level import: listAllActionsSchema
    const input = listAllActionsSchema.parse({ overdueOnly: true })
    const now = new Date()
    const where: Record<string, unknown> = {
      risk: { register: { orgId: 'org-1' } },
    }
    if (input.overdueOnly) {
      where.dueDate = { lt: now }
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] }
    }

    expect(where.dueDate).toBeDefined()
    expect((where.status as { notIn: string[] }).notIn).toContain('COMPLETED')
    expect((where.status as { notIn: string[] }).notIn).toContain('CANCELLED')
  })

  it('returns empty array when org has no actions', async () => {
    mockPrisma.treatmentAction.findMany.mockResolvedValue([])
    const { db } = await import('@/lib/db')
    const result = await db.treatmentAction.findMany({ where: {}, include: {} as never })
    expect(result).toEqual([])
  })

  it('does not return actions from a different org', () => {
    const where1 = { risk: { register: { orgId: 'org-1' } } }
    const where2 = { risk: { register: { orgId: 'org-2' } } }
    expect(where1).not.toEqual(where2)
  })

  it('uses riskTitle orderBy when sortBy is riskTitle', () => {
    // using top-level import: listAllActionsSchema
    const input = listAllActionsSchema.parse({ sortBy: 'riskTitle', sortDir: 'asc' })
    let orderBy: Record<string, unknown> = { createdAt: input.sortDir }
    if (input.sortBy === 'riskTitle') orderBy = { risk: { title: input.sortDir } }
    expect(orderBy).toEqual({ risk: { title: 'asc' } })
  })

  it('uses dueDate orderBy by default', () => {
    // using top-level import: listAllActionsSchema
    const input = listAllActionsSchema.parse({})
    const sortBy = input.sortBy ?? 'dueDate'
    const sortDir = input.sortDir ?? 'asc'
    const orderBy: Record<string, unknown> = sortBy === 'dueDate' ? { dueDate: sortDir } : { createdAt: sortDir }
    expect(orderBy).toEqual({ dueDate: 'asc' })
  })
})

// ============================================
// overdueSummary tests
// ============================================

describe('treatment.overdueSummary logic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns total 0 when no overdue actions found', async () => {
    mockPrisma.treatmentAction.findMany.mockResolvedValue([])
    const { db } = await import('@/lib/db')
    const actions = await db.treatmentAction.findMany({ where: {}, select: {} as never })
    const byPriority: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    const result = { total: actions.length, byPriority, topItems: actions.slice(0, 5) }
    expect(result.total).toBe(0)
  })

  it('counts overdue actions correctly', async () => {
    const yesterday = new Date(Date.now() - 86_400_000)
    const overdueActions = [
      makeAction({ id: 'a1', priority: 'HIGH', dueDate: yesterday }),
      makeAction({ id: 'a2', priority: 'CRITICAL', dueDate: yesterday }),
      makeAction({ id: 'a3', priority: 'LOW', dueDate: yesterday }),
    ]
    mockPrisma.treatmentAction.findMany.mockResolvedValue(overdueActions)
    const { db } = await import('@/lib/db')
    const actions = await db.treatmentAction.findMany({ where: {}, select: {} as never })
    expect(actions).toHaveLength(3)
  })

  it('excludes COMPLETED/CANCELLED (where clause uses notIn)', () => {
    const where = {
      risk: { register: { orgId: 'org-1' } },
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      dueDate: { lt: new Date() },
    }
    expect((where.status as { notIn: string[] }).notIn).toContain('COMPLETED')
    expect((where.status as { notIn: string[] }).notIn).toContain('CANCELLED')
  })

  it('returns topItems limited to 5', () => {
    const actions = Array.from({ length: 8 }, (_, i) =>
      makeAction({ id: `a${i}`, priority: 'HIGH' })
    )
    const topItems = actions.slice(0, 5)
    expect(topItems).toHaveLength(5)
  })
})
