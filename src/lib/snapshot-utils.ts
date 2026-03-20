/**
 * Snapshot capture utility.
 * Core logic used by manual triggers, cron jobs, and baseline auto-creation.
 */

import { db } from '@/lib/db'
import { Prisma, SnapshotType } from '@prisma/client'
import { createAuditLog } from '@/lib/audit'
import {
  buildSeverityCounts,
  buildKriCounts,
  buildTreatmentCounts,
  buildCategoryMap,
  identifyTopRisks,
} from '@/lib/snapshot-validation'
import type { ScoreBreakdown } from '@/lib/vytl-score'

/**
 * Captures a complete snapshot of an organisation's risk state.
 */
export async function captureSnapshot(
  orgId: string,
  snapshotType: SnapshotType,
  userId?: string
): Promise<{ id: string; snapshotDate: Date; riskCount: number }> {
  // 1. Fetch all non-archived risks with relations
  const risks = await db.risk.findMany({
    where: {
      register: { orgId },
      status: { not: 'ARCHIVED' },
    },
    include: {
      owner: { select: { name: true, email: true } },
      treatmentActions: { select: { status: true } },
    },
    orderBy: { residualScore: 'desc' },
  })

  if (risks.length === 0) {
    throw new Error('Cannot create snapshot: no active risks found')
  }

  // 2. Fetch latest completed Vytl assessment
  const assessment = await db.assessment.findFirst({
    where: { orgId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
  })

  // 3. Fetch KRIs for this org
  const kris = await db.kri.findMany({
    where: { orgId },
    select: { status: true },
  })

  // 4. Fetch appetite thresholds
  const org = await db.organisation.findUniqueOrThrow({
    where: { id: orgId },
    select: { appetiteLow: true, appetiteMedium: true, appetiteHigh: true },
  })

  // 5. Compute aggregates using pure helpers
  const statusCounts = {
    open: risks.filter((r) => r.status === 'OPEN').length,
    inProgress: risks.filter((r) => r.status === 'IN_PROGRESS').length,
    monitoring: risks.filter((r) => r.status === 'MONITORING').length,
    closed: risks.filter((r) => r.status === 'CLOSED').length,
    archived: 0,
  }

  const risksByCategory = buildCategoryMap(
    risks.map((r) => ({ ...r, residualScore: r.residualScore, inherentScore: r.inherentScore }))
  )

  const severityCounts = buildSeverityCounts(
    risks.map((r) => ({ ...r })),
    org.appetiteLow,
    org.appetiteMedium,
    org.appetiteHigh
  )

  const kriCounts = buildKriCounts(kris as { status: 'GREEN' | 'AMBER' | 'RED' }[])

  const allActions = risks.flatMap((r) => r.treatmentActions)
  const treatmentCounts = buildTreatmentCounts(
    allActions as { status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' }[]
  )

  // 6. Extract Vytl Score components from scoreBreakdown JSON
  const breakdown = assessment?.scoreBreakdown as ScoreBreakdown | null | undefined
  const vytlCoverage = breakdown?.coverage?.score ?? null
  const vytlControl = breakdown?.controlEffectiveness?.score ?? null
  const vytlMaturity = breakdown?.maturity?.score ?? null
  const vytlTrend = breakdown?.trend?.score ?? null

  // 7. Identify Top 10 risks
  const top10 = identifyTopRisks(risks)

  // 8. Create snapshot record with nested details
  const snapshot = await db.riskSnapshot.create({
    data: {
      orgId,
      snapshotDate: new Date(),
      snapshotType,
      createdBy: userId ?? null,

      vytlScore: assessment?.vytlScore ?? null,
      vytlGrade: assessment?.vytlGrade ?? null,
      vytlCoverage,
      vytlControl,
      vytlMaturity,
      vytlTrend,

      totalRisks: risks.length,
      openRisks: statusCounts.open,
      inProgressRisks: statusCounts.inProgress,
      monitoringRisks: statusCounts.monitoring,
      closedRisks: statusCounts.closed,
      archivedRisks: statusCounts.archived,

      risksByCategory: risksByCategory as Prisma.JsonObject,

      lowRiskCount: severityCounts.low,
      mediumRiskCount: severityCounts.medium,
      highRiskCount: severityCounts.high,
      extremeRiskCount: severityCounts.extreme,

      krisTotal: kris.length,
      krisGreen: kriCounts.green,
      krisAmber: kriCounts.amber,
      krisRed: kriCounts.red,

      treatmentsTotal: treatmentCounts.total,
      treatmentsOpen: treatmentCounts.open,
      treatmentsInProgress: treatmentCounts.inProgress,
      treatmentsCompleted: treatmentCounts.completed,
      treatmentCompletionRate: treatmentCounts.completionRate,

      riskDetails: {
        create: risks.map((risk) => {
          const isTop = top10.includes(risk)
          const rank = isTop ? top10.indexOf(risk) + 1 : null
          return {
            riskId: risk.id,
            refCode: risk.refCode,
            title: risk.title,
            category: risk.category,
            status: risk.status,
            inherentLikelihood: risk.inherentLikelihood,
            inherentImpact: risk.inherentImpact,
            inherentScore: risk.inherentScore,
            residualLikelihood: risk.residualLikelihood,
            residualImpact: risk.residualImpact,
            residualScore: risk.residualScore,
            owner: risk.owner?.name ?? null,
            ownerEmail: risk.owner?.email ?? null,
            isTopRisk: isTop,
            rankAtSnapshot: rank,
            fullState: isTop
              ? ({
                  description: risk.description,
                  rootCause: risk.rootCause,
                  controls: risk.controls,
                  controlEffectiveness: risk.controlEffectiveness,
                  treatmentStrategy: risk.response,
                  financialExposure: risk.financialExposure?.toString() ?? null,
                  varValue: risk.varValue?.toString() ?? null,
                  treatmentCount: risk.treatmentActions.length,
                } as Prisma.JsonObject)
              : Prisma.JsonNull,
          }
        }),
      },
    },
  })

  // 9. Audit log
  await createAuditLog({
    action: 'CREATE_SNAPSHOT',
    entityType: 'SNAPSHOT',
    entityId: snapshot.id,
    userId: userId ?? 'SYSTEM',
    orgId,
    newValues: {
      snapshotType,
      riskCount: risks.length,
      vytlScore: assessment?.vytlScore ?? null,
      snapshotDate: snapshot.snapshotDate.toISOString(),
    },
  })

  return { id: snapshot.id, snapshotDate: snapshot.snapshotDate, riskCount: risks.length }
}

/**
 * Returns true if a BASELINE snapshot already exists for this org.
 */
export async function hasBaselineSnapshot(orgId: string): Promise<boolean> {
  const baseline = await db.riskSnapshot.findFirst({
    where: { orgId, snapshotType: 'BASELINE' },
    select: { id: true },
  })
  return baseline !== null
}

/**
 * Returns the earliest snapshot date for this org (for trend availability checks).
 */
export async function getEarliestSnapshotDate(orgId: string): Promise<Date | null> {
  const earliest = await db.riskSnapshot.findFirst({
    where: { orgId },
    orderBy: { snapshotDate: 'asc' },
    select: { snapshotDate: true },
  })
  return earliest?.snapshotDate ?? null
}
