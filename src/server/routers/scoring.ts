import { z } from 'zod'
import {
  router,
  protectedProcedure,
  riskManagerProcedure,
  adminProcedure,
} from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { createAuditLog } from '@/lib/audit'
import { checkRateLimit, createRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit'
import {
  calculateRiskScore,
  calculateBatchScores,
  saveScoreHistory,
  getDefaultProfile,
  getEngineStatus,
} from '@/lib/scoring-engine'
import {
  scoringProfileSchema,
  updateScoringProfileSchema,
  scoringRuleSchema,
  updateScoringRuleSchema,
  batchCalculateSchema,
  scoreHistoryQuerySchema,
  calculateSingleSchema,
  trendAnalysisSchema,
} from '@/lib/scoring-validation'
import { generateScoringRecommendations } from '@/lib/scoring-recommendations'
import { analyzeRiskTrend, analyzeOrgTrend, analyzeCategoryTrends } from '@/lib/score-trends'
import { getAllIndustryProfiles } from '@/lib/industry-profiles'

export const scoringRouter = router({
  // ============================================
  // SCORE CALCULATION
  // ============================================

  /**
   * Calculate composite score for a single risk (RISK_MANAGER+)
   */
  calculate: riskManagerProcedure
    .input(calculateSingleSchema)
    .mutation(async ({ ctx, input }) => {
      checkRateLimit(
        createRateLimitKey(ctx.user.id, ctx.user.orgId, 'scoring-calculate'),
        RATE_LIMITS.ai // reuse AI rate limit
      )

      // Get optional profile override
      let profileOverride = null
      if (input.profileId) {
        const profile = await db.scoringProfile.findFirst({
          where: { id: input.profileId, orgId: ctx.user.orgId },
          include: { rules: true },
        })
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Scoring profile not found' })
        }
        profileOverride = {
          ...profile,
          categoryMultipliers: profile.categoryMultipliers as Record<string, number> | null,
        }
      }

      const result = await calculateRiskScore(input.riskId, ctx.user.orgId, profileOverride)

      if (input.saveHistory) {
        await saveScoreHistory(input.riskId, result)
      }

      await createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: input.riskId,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        newValues: { action: 'score_calculated', compositeScore: result.compositeScore },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return result
    }),

  /**
   * Batch calculate scores for all risks in a register (RISK_MANAGER+)
   */
  batchCalculate: riskManagerProcedure
    .input(batchCalculateSchema)
    .mutation(async ({ ctx, input }) => {
      checkRateLimit(
        createRateLimitKey(ctx.user.id, ctx.user.orgId, 'scoring-batch'),
        { windowMs: 60 * 1000, maxRequests: 3 } // 3 batch calcs per minute
      )

      let profileOverride = null
      if (input.profileId) {
        const profile = await db.scoringProfile.findFirst({
          where: { id: input.profileId, orgId: ctx.user.orgId },
          include: { rules: true },
        })
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Scoring profile not found' })
        }
        profileOverride = {
          ...profile,
          categoryMultipliers: profile.categoryMultipliers as Record<string, number> | null,
        }
      }

      const result = await calculateBatchScores(input.registerId, ctx.user.orgId, profileOverride)

      // Save history for all risks if requested
      if (input.saveHistory) {
        await Promise.all(
          result.scores.map(s => saveScoreHistory(s.riskId, s.score))
        )
      }

      await createAuditLog({
        action: 'CREATE',
        entityType: 'REGISTER',
        entityId: input.registerId,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        newValues: {
          action: 'batch_score_calculated',
          risksScored: result.scores.length,
          averageScore: result.aggregate.averageScore,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return result
    }),

  // ============================================
  // SCORING PROFILES
  // ============================================

  /**
   * Get the org's scoring profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getDefaultProfile(ctx.user.orgId)
    return profile
  }),

  /**
   * Update scoring profile (ADMIN+)
   */
  updateProfile: adminProcedure
    .input(z.object({
      profileId: z.string(),
      data: updateScoringProfileSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.scoringProfile.findFirst({
        where: { id: input.profileId, orgId: ctx.user.orgId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scoring profile not found' })
      }

      const updated = await db.scoringProfile.update({
        where: { id: input.profileId },
        data: {
          ...input.data,
          categoryMultipliers: input.data.categoryMultipliers || undefined,
        },
        include: { rules: true },
      })

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'ORGANISATION',
        entityId: input.profileId,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        oldValues: {
          weightBase: existing.weightBase,
          weightControlQuality: existing.weightControlQuality,
          weightVelocity: existing.weightVelocity,
          weightCorrelation: existing.weightCorrelation,
          weightKriAlignment: existing.weightKriAlignment,
        },
        newValues: {
          weightBase: updated.weightBase,
          weightControlQuality: updated.weightControlQuality,
          weightVelocity: updated.weightVelocity,
          weightCorrelation: updated.weightCorrelation,
          weightKriAlignment: updated.weightKriAlignment,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return updated
    }),

  /**
   * Apply an industry profile preset (ADMIN+)
   */
  applyIndustryProfile: adminProcedure
    .input(z.object({ industryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profiles = getAllIndustryProfiles()
      const industry = profiles.find(p => p.id === input.industryId)

      if (!industry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Industry profile "${input.industryId}" not found`,
        })
      }

      const profile = await getDefaultProfile(ctx.user.orgId)

      const updated = await db.scoringProfile.update({
        where: { id: profile.id },
        data: {
          name: `${industry.name} Profile`,
          description: industry.description,
          industry: industry.id,
          weightBase: industry.weights.base,
          weightControlQuality: industry.weights.controlQuality,
          weightVelocity: industry.weights.velocity,
          weightCorrelation: industry.weights.correlation,
          weightKriAlignment: industry.weights.kriAlignment,
          categoryMultipliers: industry.categoryMultipliers,
          thresholdLow: industry.thresholds.low,
          thresholdMedium: industry.thresholds.medium,
          thresholdHigh: industry.thresholds.high,
        },
        include: { rules: true },
      })

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'ORGANISATION',
        entityId: profile.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        newValues: { action: 'industry_profile_applied', industry: industry.id },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return updated
    }),

  /**
   * List available industry profiles
   */
  listIndustryProfiles: protectedProcedure.query(() => {
    return getAllIndustryProfiles()
  }),

  // ============================================
  // SCORING RULES
  // ============================================

  /**
   * List rules for the org's default profile
   */
  getRules: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getDefaultProfile(ctx.user.orgId)
    return db.scoringRule.findMany({
      where: { profileId: profile.id },
      orderBy: { priority: 'asc' },
    })
  }),

  /**
   * Create a scoring rule (RISK_MANAGER+)
   */
  createRule: riskManagerProcedure
    .input(scoringRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await getDefaultProfile(ctx.user.orgId)

      const rule = await db.scoringRule.create({
        data: {
          ...input,
          profileId: profile.id,
        },
      })

      await createAuditLog({
        action: 'CREATE',
        entityType: 'ORGANISATION',
        entityId: rule.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        newValues: { name: rule.name, conditionField: rule.conditionField, scoreModifier: rule.scoreModifier },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return rule
    }),

  /**
   * Update a scoring rule (RISK_MANAGER+)
   */
  updateRule: riskManagerProcedure
    .input(z.object({
      ruleId: z.string(),
      data: updateScoringRuleSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getDefaultProfile(ctx.user.orgId)

      const existing = await db.scoringRule.findFirst({
        where: { id: input.ruleId, profileId: profile.id },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scoring rule not found' })
      }

      const updated = await db.scoringRule.update({
        where: { id: input.ruleId },
        data: input.data,
      })

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'ORGANISATION',
        entityId: input.ruleId,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        oldValues: { name: existing.name, scoreModifier: existing.scoreModifier, isActive: existing.isActive },
        newValues: { name: updated.name, scoreModifier: updated.scoreModifier, isActive: updated.isActive },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return updated
    }),

  /**
   * Delete a scoring rule (RISK_MANAGER+)
   */
  deleteRule: riskManagerProcedure
    .input(z.object({ ruleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getDefaultProfile(ctx.user.orgId)

      const existing = await db.scoringRule.findFirst({
        where: { id: input.ruleId, profileId: profile.id },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scoring rule not found' })
      }

      await db.scoringRule.delete({ where: { id: input.ruleId } })

      await createAuditLog({
        action: 'DELETE',
        entityType: 'ORGANISATION',
        entityId: input.ruleId,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        oldValues: { name: existing.name, conditionField: existing.conditionField },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return { success: true }
    }),

  // ============================================
  // HISTORY & TRENDS
  // ============================================

  /**
   * Get score history for a risk
   */
  getHistory: protectedProcedure
    .input(scoreHistoryQuerySchema)
    .query(async ({ ctx, input }) => {
      // Verify risk belongs to org
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const where: Record<string, unknown> = { riskId: input.riskId }
      if (input.startDate || input.endDate) {
        where.createdAt = {}
        if (input.startDate) (where.createdAt as Record<string, unknown>).gte = input.startDate
        if (input.endDate) (where.createdAt as Record<string, unknown>).lte = input.endDate
      }
      if (input.cursor) {
        where.id = { lt: input.cursor }
      }

      const history = await db.scoreHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })

      return {
        items: history,
        nextCursor: history.length === input.limit ? history[history.length - 1].id : null,
      }
    }),

  /**
   * Get trend analysis
   */
  getTrends: protectedProcedure
    .input(trendAnalysisSchema)
    .query(async ({ ctx, input }) => {
      if (input.riskId) {
        // Verify risk belongs to org
        const risk = await db.risk.findFirst({
          where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
          select: { id: true },
        })
        if (!risk) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
        }
        return analyzeRiskTrend(input.riskId, ctx.user.orgId, input.daysBack)
      }

      return analyzeOrgTrend(ctx.user.orgId, input.daysBack)
    }),

  /**
   * Get category-level trends
   */
  getCategoryTrends: protectedProcedure.query(async ({ ctx }) => {
    return analyzeCategoryTrends(ctx.user.orgId)
  }),

  // ============================================
  // RECOMMENDATIONS & STATUS
  // ============================================

  /**
   * Get scoring recommendations
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    return generateScoringRecommendations(ctx.user.orgId)
  }),

  /**
   * Get engine status / health
   */
  getEngineStatus: protectedProcedure.query(async ({ ctx }) => {
    return getEngineStatus(ctx.user.orgId)
  }),
})
