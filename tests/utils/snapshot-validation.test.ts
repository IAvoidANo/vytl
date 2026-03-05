import { describe, it, expect } from 'vitest'
import {
  buildSeverityCounts,
  buildKriCounts,
  buildTreatmentCounts,
  buildCategoryMap,
  identifyTopRisks,
  monthsDiff,
  detectRiskMovers,
  type RiskForSnapshot,
  type KriForSnapshot,
  type TreatmentForSnapshot,
  type SnapshotDetailLike,
} from '@/lib/snapshot-validation'

// ============================================
// buildSeverityCounts
// ============================================

describe('buildSeverityCounts', () => {
  const appetite = { low: 4, medium: 9, high: 14 }

  it('classifies risk at or below appetiteLow as low', () => {
    const risks: RiskForSnapshot[] = [
      { residualScore: 4, inherentScore: 8, category: 'OPERATIONAL', status: 'OPEN' },
      { residualScore: 1, inherentScore: 4, category: 'STRATEGIC', status: 'OPEN' },
    ]
    const result = buildSeverityCounts(risks, appetite.low, appetite.medium, appetite.high)
    expect(result.low).toBe(2)
    expect(result.medium).toBe(0)
    expect(result.high).toBe(0)
    expect(result.extreme).toBe(0)
  })

  it('classifies risk above appetiteLow up to appetiteMedium as medium', () => {
    const risks: RiskForSnapshot[] = [
      { residualScore: 5, inherentScore: 9, category: 'FINANCIAL', status: 'OPEN' },
      { residualScore: 9, inherentScore: 12, category: 'COMPLIANCE', status: 'OPEN' },
    ]
    const result = buildSeverityCounts(risks, appetite.low, appetite.medium, appetite.high)
    expect(result.medium).toBe(2)
    expect(result.low).toBe(0)
  })

  it('classifies risk above appetiteHigh as extreme', () => {
    const risks: RiskForSnapshot[] = [
      { residualScore: 15, inherentScore: 20, category: 'TECHNOLOGY', status: 'OPEN' },
      { residualScore: 25, inherentScore: 25, category: 'STRATEGIC', status: 'OPEN' },
    ]
    const result = buildSeverityCounts(risks, appetite.low, appetite.medium, appetite.high)
    expect(result.extreme).toBe(2)
    expect(result.high).toBe(0)
  })

  it('returns all zeros for empty risks array', () => {
    const result = buildSeverityCounts([], 4, 9, 14)
    expect(result).toEqual({ low: 0, medium: 0, high: 0, extreme: 0 })
  })

  it('handles mixed severity classifications correctly', () => {
    const risks: RiskForSnapshot[] = [
      { residualScore: 3, inherentScore: 5, category: 'PEOPLE', status: 'OPEN' },    // low
      { residualScore: 7, inherentScore: 10, category: 'FINANCIAL', status: 'OPEN' }, // medium
      { residualScore: 12, inherentScore: 15, category: 'STRATEGIC', status: 'OPEN' },// high
      { residualScore: 16, inherentScore: 20, category: 'CYBER', status: 'OPEN' },    // extreme
    ]
    const result = buildSeverityCounts(risks, 4, 9, 14)
    expect(result).toEqual({ low: 1, medium: 1, high: 1, extreme: 1 })
  })
})

// ============================================
// buildKriCounts
// ============================================

describe('buildKriCounts', () => {
  it('counts KRIs by status correctly', () => {
    const kris: KriForSnapshot[] = [
      { status: 'GREEN' },
      { status: 'GREEN' },
      { status: 'AMBER' },
      { status: 'RED' },
      { status: 'RED' },
      { status: 'RED' },
    ]
    const result = buildKriCounts(kris)
    expect(result).toEqual({ green: 2, amber: 1, red: 3 })
  })

  it('returns all zeros for empty array', () => {
    expect(buildKriCounts([])).toEqual({ green: 0, amber: 0, red: 0 })
  })

  it('handles all-green KRIs', () => {
    const kris: KriForSnapshot[] = [{ status: 'GREEN' }, { status: 'GREEN' }]
    const result = buildKriCounts(kris)
    expect(result.green).toBe(2)
    expect(result.red).toBe(0)
  })
})

// ============================================
// buildTreatmentCounts
// ============================================

describe('buildTreatmentCounts', () => {
  it('calculates completion rate correctly', () => {
    const actions: TreatmentForSnapshot[] = [
      { status: 'OPEN' },
      { status: 'IN_PROGRESS' },
      { status: 'COMPLETED' },
      { status: 'COMPLETED' },
    ]
    const result = buildTreatmentCounts(actions)
    expect(result.open).toBe(1)
    expect(result.inProgress).toBe(1)
    expect(result.completed).toBe(2)
    expect(result.total).toBe(4)
    expect(result.completionRate).toBe(50)
  })

  it('returns null completionRate for empty array', () => {
    const result = buildTreatmentCounts([])
    expect(result.completionRate).toBeNull()
    expect(result.total).toBe(0)
  })

  it('ignores CANCELLED actions in counts', () => {
    const actions: TreatmentForSnapshot[] = [
      { status: 'CANCELLED' },
      { status: 'COMPLETED' },
    ]
    const result = buildTreatmentCounts(actions)
    expect(result.open).toBe(0)
    expect(result.inProgress).toBe(0)
    expect(result.completed).toBe(1)
    expect(result.total).toBe(2)
    expect(result.completionRate).toBe(50)
  })
})

// ============================================
// buildCategoryMap
// ============================================

describe('buildCategoryMap', () => {
  it('groups risks by category correctly', () => {
    const risks: RiskForSnapshot[] = [
      { residualScore: 5, inherentScore: 8, category: 'STRATEGIC', status: 'OPEN' },
      { residualScore: 5, inherentScore: 8, category: 'STRATEGIC', status: 'OPEN' },
      { residualScore: 5, inherentScore: 8, category: 'OPERATIONAL', status: 'OPEN' },
    ]
    const result = buildCategoryMap(risks)
    expect(result).toEqual({ STRATEGIC: 2, OPERATIONAL: 1 })
  })

  it('returns empty object for no risks', () => {
    expect(buildCategoryMap([])).toEqual({})
  })
})

// ============================================
// identifyTopRisks
// ============================================

describe('identifyTopRisks', () => {
  it('returns top N risks by residualScore descending', () => {
    const risks = [
      { id: 'a', residualScore: 5, inherentScore: 8 },
      { id: 'b', residualScore: 20, inherentScore: 20 },
      { id: 'c', residualScore: 12, inherentScore: 15 },
    ]
    const top2 = identifyTopRisks(risks, 2)
    expect(top2[0]!.id).toBe('b')
    expect(top2[1]!.id).toBe('c')
    expect(top2).toHaveLength(2)
  })

  it('returns all risks when limit exceeds count', () => {
    const risks = [
      { id: 'a', residualScore: 5, inherentScore: 8 },
      { id: 'b', residualScore: 10, inherentScore: 12 },
    ]
    expect(identifyTopRisks(risks, 10)).toHaveLength(2)
  })

  it('does not mutate the original array', () => {
    const risks = [
      { id: 'a', residualScore: 5, inherentScore: 8 },
      { id: 'b', residualScore: 20, inherentScore: 20 },
    ]
    const original = [...risks]
    identifyTopRisks(risks, 10)
    expect(risks).toEqual(original)
  })
})

// ============================================
// monthsDiff
// ============================================

describe('monthsDiff', () => {
  it('returns 0 for same date', () => {
    const d = new Date('2025-01-01')
    expect(monthsDiff(d, d)).toBe(0)
  })

  it('returns 3 for 90 days apart', () => {
    const from = new Date('2025-01-01')
    const to = new Date('2025-04-01')
    expect(monthsDiff(from, to)).toBe(3)
  })

  it('floors partial months', () => {
    const from = new Date('2025-01-01')
    const to = new Date('2025-03-15')
    // ~73 days / 30 = 2.43 → floor = 2
    expect(monthsDiff(from, to)).toBe(2)
  })
})

// ============================================
// detectRiskMovers
// ============================================

describe('detectRiskMovers', () => {
  const makeDetail = (riskId: string, refCode: string, score: number): SnapshotDetailLike => ({
    riskId,
    refCode,
    title: `Risk ${refCode}`,
    category: 'STRATEGIC',
    residualScore: score,
  })

  it('detects increased risks above materiality threshold', () => {
    const latest = [makeDetail('r1', 'STR-001', 10)]
    const earliest = [makeDetail('r1', 'STR-001', 5)]
    const result = detectRiskMovers(latest, earliest, 2)
    expect(result.increased).toHaveLength(1)
    expect(result.increased[0]!.scoreDelta).toBe(5)
    expect(result.increased[0]!.changeType).toBe('INCREASED')
  })

  it('detects decreased risks above materiality threshold', () => {
    const latest = [makeDetail('r1', 'STR-001', 3)]
    const earliest = [makeDetail('r1', 'STR-001', 8)]
    const result = detectRiskMovers(latest, earliest, 2)
    expect(result.decreased).toHaveLength(1)
    expect(result.decreased[0]!.scoreDelta).toBe(-5)
  })

  it('does not flag changes below materiality threshold', () => {
    const latest = [makeDetail('r1', 'STR-001', 6)]
    const earliest = [makeDetail('r1', 'STR-001', 5)]
    const result = detectRiskMovers(latest, earliest, 2)
    expect(result.increased).toHaveLength(0)
    expect(result.decreased).toHaveLength(0)
  })

  it('detects new risks not in earliest snapshot', () => {
    const latest = [makeDetail('r2', 'STR-002', 8)]
    const earliest: SnapshotDetailLike[] = []
    const result = detectRiskMovers(latest, earliest, 2)
    expect(result.newRisks).toHaveLength(1)
    expect(result.newRisks[0]!.changeType).toBe('NEW')
    expect(result.newRisks[0]!.scoreThen).toBeNull()
  })

  it('detects closed risks not in latest snapshot', () => {
    const latest: SnapshotDetailLike[] = []
    const earliest = [makeDetail('r1', 'STR-001', 10)]
    const result = detectRiskMovers(latest, earliest, 2)
    expect(result.closedRisks).toHaveLength(1)
    expect(result.closedRisks[0]!.changeType).toBe('CLOSED')
    expect(result.closedRisks[0]!.scoreNow).toBeNull()
  })

  it('respects custom materiality threshold', () => {
    const latest = [makeDetail('r1', 'STR-001', 7)]
    const earliest = [makeDetail('r1', 'STR-001', 5)]
    // Delta = 2 — below threshold of 3
    const result = detectRiskMovers(latest, earliest, 3)
    expect(result.increased).toHaveLength(0)
  })

  it('handles empty snapshots gracefully', () => {
    const result = detectRiskMovers([], [], 2)
    expect(result.increased).toHaveLength(0)
    expect(result.decreased).toHaveLength(0)
    expect(result.newRisks).toHaveLength(0)
    expect(result.closedRisks).toHaveLength(0)
  })
})
