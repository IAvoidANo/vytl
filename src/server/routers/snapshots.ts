import { z } from 'zod'
import { router, protectedProcedure, riskManagerProcedure, adminProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { SnapshotType } from '@prisma/client'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { captureSnapshot, getEarliestSnapshotDate } from '@/lib/snapshot-utils'
import { detectRiskMovers, monthsDiff } from '@/lib/snapshot-validation'
import type { ScoreBreakdown } from '@/lib/vytl-score'

export const snapshotsRouter = router({
  /**
   * Manually trigger a snapshot (RISK_MANAGER+).
   */
  capture: riskManagerProcedure.mutation(async ({ ctx }) => {
    return captureSnapshot(ctx.user.orgId, SnapshotType.MANUAL, ctx.user.id)
  }),

  /**
   * List snapshots for the current org (paginated).
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const snapshots = await db.riskSnapshot.findMany({
        where: { orgId: ctx.user.orgId },
        orderBy: { snapshotDate: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          snapshotDate: true,
          snapshotType: true,
          vytlScore: true,
          vytlGrade: true,
          totalRisks: true,
          highRiskCount: true,
          extremeRiskCount: true,
          krisRed: true,
          createdBy: true,
          createdAt: true,
        },
      })

      let nextCursor: string | undefined
      if (snapshots.length > input.limit) {
        nextCursor = snapshots.pop()!.id
      }

      return { snapshots, nextCursor }
    }),

  /**
   * Get full snapshot with risk details by ID.
   */
  getById: protectedProcedure
    .input(z.object({ snapshotId: z.string() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await db.riskSnapshot.findUnique({
        where: { id: input.snapshotId },
        include: { riskDetails: { orderBy: { rankAtSnapshot: 'asc' } } },
      })

      if (!snapshot) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Snapshot not found' })
      }
      if (snapshot.orgId !== ctx.user.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      return snapshot
    }),

  /**
   * Check whether sufficient snapshot data exists for trend reporting.
   */
  checkDataAvailability: protectedProcedure.query(async ({ ctx }) => {
    const earliestDate = await getEarliestSnapshotDate(ctx.user.orgId)

    if (!earliestDate) {
      return { hasSufficientData: false, earliestSnapshotDate: null, monthsOfData: 0 }
    }

    const months = monthsDiff(earliestDate, new Date())
    return {
      hasSufficientData: months >= 3,
      earliestSnapshotDate: earliestDate,
      monthsOfData: months,
    }
  }),

  /**
   * Compare snapshots across a period and calculate movement metrics.
   */
  compare: protectedProcedure
    .input(z.object({ periodMonths: z.number().min(1).max(24) }))
    .query(async ({ ctx, input }) => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - input.periodMonths)

      const [earliestSnapshot, latestSnapshot, org] = await Promise.all([
        db.riskSnapshot.findFirst({
          where: { orgId: ctx.user.orgId, snapshotDate: { gte: startDate } },
          orderBy: { snapshotDate: 'asc' },
          include: { riskDetails: { select: { riskId: true, refCode: true, title: true, category: true, residualScore: true } } },
        }),
        db.riskSnapshot.findFirst({
          where: { orgId: ctx.user.orgId, snapshotDate: { lte: endDate } },
          orderBy: { snapshotDate: 'desc' },
          include: { riskDetails: { select: { riskId: true, refCode: true, title: true, category: true, residualScore: true } } },
        }),
        db.organisation.findUniqueOrThrow({
          where: { id: ctx.user.orgId },
          select: { snapshotMateriality: true },
        }),
      ])

      if (!earliestSnapshot || !latestSnapshot || earliestSnapshot.id === latestSnapshot.id) {
        return {
          hasSufficientData: false,
          earliestDate: earliestSnapshot?.snapshotDate ?? null,
          latestDate: latestSnapshot?.snapshotDate ?? null,
        }
      }

      const materialityThreshold = org.snapshotMateriality ?? 2

      // Vytl score trajectory
      const scoreDelta =
        latestSnapshot.vytlScore != null && earliestSnapshot.vytlScore != null
          ? latestSnapshot.vytlScore - earliestSnapshot.vytlScore
          : null
      const scorePct =
        scoreDelta != null && earliestSnapshot.vytlScore != null && earliestSnapshot.vytlScore > 0
          ? (scoreDelta / earliestSnapshot.vytlScore) * 100
          : null

      const eBreakdown = earliestSnapshot.scoreBreakdown as ScoreBreakdown | null | undefined
      const lBreakdown = latestSnapshot.scoreBreakdown as ScoreBreakdown | null | undefined

      // Risk movers
      const movers = detectRiskMovers(
        latestSnapshot.riskDetails,
        earliestSnapshot.riskDetails,
        materialityThreshold
      )

      // Category-level changes
      const allCategories = new Set([
        ...Object.keys(latestSnapshot.risksByCategory as object),
        ...Object.keys(earliestSnapshot.risksByCategory as object),
      ])
      const categoryChanges = Array.from(allCategories).map((category) => {
        const countThen = ((earliestSnapshot.risksByCategory as Record<string, number>)[category] ?? 0)
        const countNow = ((latestSnapshot.risksByCategory as Record<string, number>)[category] ?? 0)
        return {
          category,
          countThen,
          countNow,
          countDelta: countNow - countThen,
          percentChange: countThen > 0 ? ((countNow - countThen) / countThen) * 100 : null,
        }
      })

      // KRI breach pattern
      const kriBreach = {
        redThen: earliestSnapshot.krisRed,
        redNow: latestSnapshot.krisRed,
        redDelta: latestSnapshot.krisRed - earliestSnapshot.krisRed,
        redPercentChange:
          earliestSnapshot.krisRed > 0
            ? ((latestSnapshot.krisRed - earliestSnapshot.krisRed) / earliestSnapshot.krisRed) * 100
            : null,
      }

      // Treatment velocity
      const treatmentCompletion = {
        rateThen: earliestSnapshot.treatmentCompletionRate,
        rateNow: latestSnapshot.treatmentCompletionRate,
        rateDelta:
          latestSnapshot.treatmentCompletionRate != null &&
          earliestSnapshot.treatmentCompletionRate != null
            ? latestSnapshot.treatmentCompletionRate - earliestSnapshot.treatmentCompletionRate
            : null,
      }

      return {
        hasSufficientData: true,
        earliestDate: earliestSnapshot.snapshotDate,
        latestDate: latestSnapshot.snapshotDate,
        periodMonths: input.periodMonths,
        vytlScore: {
          then: earliestSnapshot.vytlScore,
          now: latestSnapshot.vytlScore,
          change: scoreDelta,
          changePercent: scorePct,
          gradeThen: earliestSnapshot.vytlGrade,
          gradeNow: latestSnapshot.vytlGrade,
          components: {
            coverage: {
              then: eBreakdown?.coverage?.score ?? earliestSnapshot.vytlCoverage,
              now: lBreakdown?.coverage?.score ?? latestSnapshot.vytlCoverage,
              change:
                (lBreakdown?.coverage?.score ?? latestSnapshot.vytlCoverage) != null &&
                (eBreakdown?.coverage?.score ?? earliestSnapshot.vytlCoverage) != null
                  ? (lBreakdown?.coverage?.score ?? latestSnapshot.vytlCoverage)! -
                    (eBreakdown?.coverage?.score ?? earliestSnapshot.vytlCoverage)!
                  : null,
            },
            control: {
              then: eBreakdown?.controlEffectiveness?.score ?? earliestSnapshot.vytlControl,
              now: lBreakdown?.controlEffectiveness?.score ?? latestSnapshot.vytlControl,
              change:
                (lBreakdown?.controlEffectiveness?.score ?? latestSnapshot.vytlControl) != null &&
                (eBreakdown?.controlEffectiveness?.score ?? earliestSnapshot.vytlControl) != null
                  ? (lBreakdown?.controlEffectiveness?.score ?? latestSnapshot.vytlControl)! -
                    (eBreakdown?.controlEffectiveness?.score ?? earliestSnapshot.vytlControl)!
                  : null,
            },
            maturity: {
              then: eBreakdown?.maturity?.score ?? earliestSnapshot.vytlMaturity,
              now: lBreakdown?.maturity?.score ?? latestSnapshot.vytlMaturity,
              change:
                (lBreakdown?.maturity?.score ?? latestSnapshot.vytlMaturity) != null &&
                (eBreakdown?.maturity?.score ?? earliestSnapshot.vytlMaturity) != null
                  ? (lBreakdown?.maturity?.score ?? latestSnapshot.vytlMaturity)! -
                    (eBreakdown?.maturity?.score ?? earliestSnapshot.vytlMaturity)!
                  : null,
            },
            trend: {
              then: eBreakdown?.trend?.score ?? earliestSnapshot.vytlTrend,
              now: lBreakdown?.trend?.score ?? latestSnapshot.vytlTrend,
              change:
                (lBreakdown?.trend?.score ?? latestSnapshot.vytlTrend) != null &&
                (eBreakdown?.trend?.score ?? earliestSnapshot.vytlTrend) != null
                  ? (lBreakdown?.trend?.score ?? latestSnapshot.vytlTrend)! -
                    (eBreakdown?.trend?.score ?? earliestSnapshot.vytlTrend)!
                  : null,
            },
          },
        },
        riskMovers: {
          increased: movers.increased,
          decreased: movers.decreased,
          new: movers.newRisks,
          closed: movers.closedRisks,
        },
        categoryChanges,
        kriBreach,
        treatmentCompletion,
      }
    }),

  /**
   * Delete a snapshot (ADMIN only, with justification and audit trail).
   */
  delete: adminProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        justification: z.string().min(10, 'Justification must be at least 10 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const snapshot = await db.riskSnapshot.findUnique({
        where: { id: input.snapshotId },
      })

      if (!snapshot) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Snapshot not found' })
      }
      if (snapshot.orgId !== ctx.user.orgId) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      await createAuditLog({
        action: 'DELETE_SNAPSHOT',
        entityType: 'SNAPSHOT',
        entityId: snapshot.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: {
          snapshotDate: snapshot.snapshotDate.toISOString(),
          snapshotType: snapshot.snapshotType,
          justification: input.justification,
        },
      })

      await db.riskSnapshot.delete({ where: { id: input.snapshotId } })

      return { success: true }
    }),
})
