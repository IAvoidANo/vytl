import { describe, it, expect } from 'vitest'
import {
  createIncidentSchema,
  updateIncidentSchema,
  incidentSeverityEnum,
  incidentStatusEnum,
  getResolvedAtForStatus,
  sortBySeverity,
  getNextStatus,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  SEVERITY_COLORS,
  STATUS_COLORS,
  STATUS_CYCLE,
} from '@/lib/incident-validation'

// ============================================
// ENUMS
// ============================================

describe('incidentSeverityEnum', () => {
  it('accepts all valid severities', () => {
    for (const s of INCIDENT_SEVERITIES) {
      expect(incidentSeverityEnum.safeParse(s).success).toBe(true)
    }
  })

  it('rejects invalid severity', () => {
    expect(incidentSeverityEnum.safeParse('EXTREME').success).toBe(false)
  })

  it('has 4 severity levels', () => {
    expect(INCIDENT_SEVERITIES).toHaveLength(4)
  })
})

describe('incidentStatusEnum', () => {
  it('accepts all valid statuses', () => {
    for (const s of INCIDENT_STATUSES) {
      expect(incidentStatusEnum.safeParse(s).success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    expect(incidentStatusEnum.safeParse('PENDING').success).toBe(false)
  })

  it('has 5 status values', () => {
    expect(INCIDENT_STATUSES).toHaveLength(5)
  })
})

// ============================================
// LABELS & COLORS
// ============================================

describe('labels and colors', () => {
  it('has a label for every severity', () => {
    for (const s of INCIDENT_SEVERITIES) {
      expect(SEVERITY_LABELS[s]).toBeDefined()
      expect(typeof SEVERITY_LABELS[s]).toBe('string')
    }
  })

  it('has a label for every status', () => {
    for (const s of INCIDENT_STATUSES) {
      expect(STATUS_LABELS[s]).toBeDefined()
      expect(typeof STATUS_LABELS[s]).toBe('string')
    }
  })

  it('has a color for every severity', () => {
    for (const s of INCIDENT_SEVERITIES) {
      expect(SEVERITY_COLORS[s]).toBeDefined()
      expect(SEVERITY_COLORS[s]).toContain('bg-')
    }
  })

  it('has a color for every status', () => {
    for (const s of INCIDENT_STATUSES) {
      expect(STATUS_COLORS[s]).toBeDefined()
      expect(STATUS_COLORS[s]).toContain('bg-')
    }
  })
})

// ============================================
// CREATE SCHEMA
// ============================================

describe('createIncidentSchema', () => {
  const valid = {
    riskId: 'risk123',
    title: 'Server outage',
    severity: 'HIGH' as const,
    occurredAt: '2026-01-15T10:00:00Z',
  }

  it('accepts valid input', () => {
    expect(createIncidentSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts with optional fields', () => {
    const result = createIncidentSchema.safeParse({
      ...valid,
      description: 'Production server went down for 2 hours.',
      assigneeId: 'user123',
    })
    expect(result.success).toBe(true)
  })

  it('requires riskId', () => {
    const { riskId, ...rest } = valid
    expect(createIncidentSchema.safeParse(rest).success).toBe(false)
  })

  it('requires title', () => {
    const { title, ...rest } = valid
    expect(createIncidentSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects empty title', () => {
    expect(createIncidentSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })

  it('rejects title over 200 chars', () => {
    expect(createIncidentSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success).toBe(false)
  })

  it('requires occurredAt', () => {
    const { occurredAt, ...rest } = valid
    expect(createIncidentSchema.safeParse(rest).success).toBe(false)
  })

  it('coerces string dates', () => {
    const result = createIncidentSchema.safeParse(valid)
    if (result.success) {
      expect(result.data.occurredAt).toBeInstanceOf(Date)
    }
  })

  it('defaults severity to MEDIUM', () => {
    const { severity, ...rest } = valid
    const result = createIncidentSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.severity).toBe('MEDIUM')
    }
  })

  it('rejects invalid severity', () => {
    expect(createIncidentSchema.safeParse({ ...valid, severity: 'EXTREME' }).success).toBe(false)
  })
})

// ============================================
// UPDATE SCHEMA
// ============================================

describe('updateIncidentSchema', () => {
  it('requires id', () => {
    expect(updateIncidentSchema.safeParse({}).success).toBe(false)
  })

  it('accepts id-only update', () => {
    expect(updateIncidentSchema.safeParse({ id: 'inc123' }).success).toBe(true)
  })

  it('accepts all optional fields', () => {
    const result = updateIncidentSchema.safeParse({
      id: 'inc123',
      title: 'Updated title',
      description: 'Updated description',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      occurredAt: '2026-02-01T00:00:00Z',
      assigneeId: 'user456',
    })
    expect(result.success).toBe(true)
  })

  it('accepts null description', () => {
    expect(updateIncidentSchema.safeParse({ id: 'inc123', description: null }).success).toBe(true)
  })

  it('accepts null assigneeId', () => {
    expect(updateIncidentSchema.safeParse({ id: 'inc123', assigneeId: null }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(updateIncidentSchema.safeParse({ id: 'inc123', status: 'INVALID' }).success).toBe(false)
  })
})

// ============================================
// getResolvedAtForStatus
// ============================================

describe('getResolvedAtForStatus', () => {
  it('returns a date for RESOLVED', () => {
    const result = getResolvedAtForStatus('RESOLVED')
    expect(result).toBeInstanceOf(Date)
  })

  it('returns a date for CLOSED', () => {
    const result = getResolvedAtForStatus('CLOSED')
    expect(result).toBeInstanceOf(Date)
  })

  it('returns null for OPEN', () => {
    expect(getResolvedAtForStatus('OPEN')).toBeNull()
  })

  it('returns null for INVESTIGATING', () => {
    expect(getResolvedAtForStatus('INVESTIGATING')).toBeNull()
  })

  it('returns null for CONTAINED', () => {
    expect(getResolvedAtForStatus('CONTAINED')).toBeNull()
  })
})

// ============================================
// sortBySeverity
// ============================================

describe('sortBySeverity', () => {
  it('sorts CRITICAL first, LOW last', () => {
    const incidents = [
      { severity: 'LOW', title: 'a' },
      { severity: 'CRITICAL', title: 'b' },
      { severity: 'MEDIUM', title: 'c' },
      { severity: 'HIGH', title: 'd' },
    ]
    const sorted = sortBySeverity(incidents)
    expect(sorted.map(i => i.severity)).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  })

  it('handles empty array', () => {
    expect(sortBySeverity([])).toEqual([])
  })

  it('handles single item', () => {
    const result = sortBySeverity([{ severity: 'HIGH' }])
    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe('HIGH')
  })

  it('does not mutate original array', () => {
    const original = [{ severity: 'LOW' }, { severity: 'HIGH' }]
    const sorted = sortBySeverity(original)
    expect(original[0].severity).toBe('LOW')
    expect(sorted[0].severity).toBe('HIGH')
  })
})

// ============================================
// getNextStatus (STATUS_CYCLE)
// ============================================

describe('getNextStatus', () => {
  it('cycles OPEN → INVESTIGATING', () => {
    expect(getNextStatus('OPEN')).toBe('INVESTIGATING')
  })

  it('cycles INVESTIGATING → CONTAINED', () => {
    expect(getNextStatus('INVESTIGATING')).toBe('CONTAINED')
  })

  it('cycles CONTAINED → RESOLVED', () => {
    expect(getNextStatus('CONTAINED')).toBe('RESOLVED')
  })

  it('cycles RESOLVED → CLOSED', () => {
    expect(getNextStatus('RESOLVED')).toBe('CLOSED')
  })

  it('cycles CLOSED → OPEN', () => {
    expect(getNextStatus('CLOSED')).toBe('OPEN')
  })

  it('has an entry for every status', () => {
    for (const s of INCIDENT_STATUSES) {
      expect(STATUS_CYCLE[s]).toBeDefined()
      expect(INCIDENT_STATUSES).toContain(STATUS_CYCLE[s])
    }
  })
})
