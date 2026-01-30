import { z } from 'zod'
import { router, protectedProcedure, riskManagerProcedure } from '@/lib/trpc'
import {
  calculateVytlScore,
  saveAssessment,
  getLatestAssessment,
  getAssessmentHistory,
} from '@/lib/vytl-score'

export const assessmentRouter = router({
  /**
   * Calculate Vytl Score (without saving)
   */
  calculate: protectedProcedure.query(async ({ ctx }) => {
    const result = await calculateVytlScore(ctx.user.orgId)
    return result
  }),

  /**
   * Calculate and save a new assessment (RISK_MANAGER+)
   */
  create: riskManagerProcedure
    .input(
      z.object({
        type: z.enum(['INITIAL', 'QUARTERLY', 'ANNUAL', 'AD_HOC']).default('AD_HOC'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await calculateVytlScore(ctx.user.orgId)
      const assessment = await saveAssessment(ctx.user.orgId, result, input.type)

      return {
        assessment,
        result,
      }
    }),

  /**
   * Get latest assessment
   */
  latest: protectedProcedure.query(async ({ ctx }) => {
    const assessment = await getLatestAssessment(ctx.user.orgId)

    if (!assessment) {
      // No assessment yet - calculate one but don't save
      const result = await calculateVytlScore(ctx.user.orgId)
      return {
        assessment: null,
        currentScore: result,
      }
    }

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
   * Get current score with live calculation
   */
  current: protectedProcedure.query(async ({ ctx }) => {
    const result = await calculateVytlScore(ctx.user.orgId)
    return result
  }),
})
