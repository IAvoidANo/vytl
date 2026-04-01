import { z } from 'zod'
import { router, protectedProcedure, riskManagerProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import {
  calculateVytlScore,
  getGrade,
  saveAssessment,
  getAssessmentHistory,
  type ScoreBreakdown,
} from '@/lib/vytl-score'

export const assessmentRouter = router({
  /**
   * Calculate VytlRx Score (without saving) — preview only
   */
  calculate: protectedProcedure.query(async ({ ctx }) => {
    const result = await calculateVytlScore(ctx.user.orgId)
    return result
  }),

  /**
   * Calculate and save a new assessment (RISK_MANAGER+)
   * This is the ONLY path that triggers a recalculation.
   */
  create: riskManagerProcedure
    .input(
      z.object({
        type: z.enum(['INITIAL', 'QUARTERLY', 'ANNUAL', 'AD_HOC']).default('AD_HOC'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await calculateVytlScore(ctx.user.orgId)
      const assessment = await saveAssessment(ctx.user.orgId, result, input.type, ctx.user.id)

      return {
        assessment,
        result,
      }
    }),

  /**
   * Get latest stored assessment — reads stored record, never recalculates
   */
  latest: protectedProcedure.query(async ({ ctx }) => {
    const assessment = await db.assessment.findFirst({
      where: { orgId: ctx.user.orgId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        triggeredBy: { select: { id: true, name: true, email: true } },
      },
    })

    return {
      assessment,
      currentScore: null,
    }
  }),

  /**
   * Get assessment history for trending
   */
  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const history = await getAssessmentHistory(ctx.user.orgId, input.limit)
      return history
    }),

  /**
   * Get current stored score — reads latest stored assessment, never recalculates.
   * Returns VytlScoreResult-compatible shape for backward compatibility with dashboard widgets.
   */
  current: protectedProcedure.query(async ({ ctx }) => {
    const assessment = await db.assessment.findFirst({
      where: { orgId: ctx.user.orgId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    })

    if (!assessment || !assessment.scoreBreakdown) {
      return null
    }

    const score = assessment.vytlScore ?? 0
    const { grade, color } = getGrade(score)
    const breakdown = assessment.scoreBreakdown as unknown as ScoreBreakdown

    // Return VytlScoreResult-compatible shape + Assessment record fields
    return {
      score,
      grade,
      gradeColor: color,
      breakdown,
      calculatedAt: assessment.completedAt ?? assessment.createdAt,
      riskCount: 0, // Not stored in assessment; widgets gracefully handle 0
      // Also include Assessment-style fields for reports-client
      vytlScore: assessment.vytlScore,
      vytlGrade: assessment.vytlGrade,
    }
  }),
})
