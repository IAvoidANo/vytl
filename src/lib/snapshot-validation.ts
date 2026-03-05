/**
 * Snapshot pure helper functions — extracted for unit testing.
 * No DB access. No side effects.
 */

export interface RiskForSnapshot {
  residualScore: number
  inherentScore: number
  category: string
  status: string
}

export interface KriForSnapshot {
  status: 'GREEN' | 'AMBER' | 'RED'
}

export interface TreatmentForSnapshot {
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

export interface SeverityCounts {
  low: number
  medium: number
  high: number
  extreme: number
}

export interface KriCounts {
  green: number
  amber: number
  red: number
}

export interface TreatmentCounts {
  open: number
  inProgress: number
  completed: number
  total: number
  completionRate: number | null
}

/**
 * Classify each risk into severity bands based on appetite thresholds.
 * Uses residualScore if available, falls back to inherentScore.
 */
export function buildSeverityCounts(
  risks: RiskForSnapshot[],
  appetiteLow: number,
  appetiteMedium: number,
  appetiteHigh: number
): SeverityCounts {
  return risks.reduce(
    (acc, risk) => {
      const score = risk.residualScore
      if (score <= appetiteLow) acc.low++
      else if (score <= appetiteMedium) acc.medium++
      else if (score <= appetiteHigh) acc.high++
      else acc.extreme++
      return acc
    },
    { low: 0, medium: 0, high: 0, extreme: 0 }
  )
}

/**
 * Count KRIs by status band.
 */
export function buildKriCounts(kris: KriForSnapshot[]): KriCounts {
  return kris.reduce(
    (acc, kri) => {
      if (kri.status === 'GREEN') acc.green++
      else if (kri.status === 'AMBER') acc.amber++
      else acc.red++
      return acc
    },
    { green: 0, amber: 0, red: 0 }
  )
}

/**
 * Count treatment actions by status and calculate completion rate.
 */
export function buildTreatmentCounts(actions: TreatmentForSnapshot[]): TreatmentCounts {
  const counts = actions.reduce(
    (acc, a) => {
      if (a.status === 'OPEN') acc.open++
      else if (a.status === 'IN_PROGRESS') acc.inProgress++
      else if (a.status === 'COMPLETED') acc.completed++
      return acc
    },
    { open: 0, inProgress: 0, completed: 0 }
  )
  const total = actions.length
  return {
    ...counts,
    total,
    completionRate: total > 0 ? (counts.completed / total) * 100 : null,
  }
}

/**
 * Group risks by category into a count map.
 */
export function buildCategoryMap(risks: RiskForSnapshot[]): Record<string, number> {
  return risks.reduce(
    (acc, risk) => {
      acc[risk.category] = (acc[risk.category] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}

/**
 * Sort risks by residualScore DESC and return top N.
 */
export function identifyTopRisks<T extends { residualScore: number; inherentScore: number }>(
  risks: T[],
  limit = 10
): T[] {
  return [...risks]
    .sort((a, b) => b.residualScore - a.residualScore || b.inherentScore - a.inherentScore)
    .slice(0, limit)
}

/**
 * Calculate whole months between two dates (floored).
 */
export function monthsDiff(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30))
}

export interface SnapshotDetailLike {
  riskId: string
  refCode: string
  title: string
  category: string
  residualScore: number
}

export type MoverType = 'INCREASED' | 'DECREASED' | 'NEW' | 'CLOSED'

export interface RiskMover {
  riskId: string
  refCode: string
  title: string
  category: string
  changeType: MoverType
  scoreThen: number | null
  scoreNow: number | null
  scoreDelta: number | null
}

/**
 * Identify material risk movements between two snapshots.
 * Returns movers for both directions, plus new and closed risks.
 */
export function detectRiskMovers(
  latestDetails: SnapshotDetailLike[],
  earliestDetails: SnapshotDetailLike[],
  materialityThreshold: number
): { increased: RiskMover[]; decreased: RiskMover[]; newRisks: RiskMover[]; closedRisks: RiskMover[] } {
  const result: { increased: RiskMover[]; decreased: RiskMover[]; newRisks: RiskMover[]; closedRisks: RiskMover[] } = {
    increased: [],
    decreased: [],
    newRisks: [],
    closedRisks: [],
  }

  for (const latest of latestDetails) {
    const earliest = earliestDetails.find((r) => r.riskId === latest.riskId)

    if (!earliest) {
      result.newRisks.push({
        riskId: latest.riskId,
        refCode: latest.refCode,
        title: latest.title,
        category: latest.category,
        changeType: 'NEW',
        scoreThen: null,
        scoreNow: latest.residualScore,
        scoreDelta: null,
      })
      continue
    }

    const delta = latest.residualScore - earliest.residualScore
    if (Math.abs(delta) >= materialityThreshold) {
      const mover: RiskMover = {
        riskId: latest.riskId,
        refCode: latest.refCode,
        title: latest.title,
        category: latest.category,
        changeType: delta > 0 ? 'INCREASED' : 'DECREASED',
        scoreThen: earliest.residualScore,
        scoreNow: latest.residualScore,
        scoreDelta: delta,
      }
      if (delta > 0) result.increased.push(mover)
      else result.decreased.push(mover)
    }
  }

  for (const earliest of earliestDetails) {
    if (!latestDetails.find((r) => r.riskId === earliest.riskId)) {
      result.closedRisks.push({
        riskId: earliest.riskId,
        refCode: earliest.refCode,
        title: earliest.title,
        category: earliest.category,
        changeType: 'CLOSED',
        scoreThen: earliest.residualScore,
        scoreNow: null,
        scoreDelta: null,
      })
    }
  }

  return result
}
