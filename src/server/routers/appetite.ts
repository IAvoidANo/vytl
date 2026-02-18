import { router, protectedProcedure, adminProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import {
  updateAppetiteSchema,
  countBreaches,
  type AppetiteThresholds,
} from '@/lib/appetite-validation'

const APPETITE_SELECT = {
  appetiteStatement: true,
  appetiteLow: true,
  appetiteMedium: true,
  appetiteHigh: true,
  appetiteCategoryConfig: true,
} as const

export const appetiteRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const org = await db.organisation.findUnique({
      where: { id: ctx.user.orgId },
      select: APPETITE_SELECT,
    })
    return org
  }),

  update: adminProcedure
    .input(updateAppetiteSchema)
    .mutation(async ({ ctx, input }) => {
      const old = await db.organisation.findUnique({
        where: { id: ctx.user.orgId },
        select: APPETITE_SELECT,
      })

      const data: Record<string, unknown> = {}
      if (input.appetiteStatement !== undefined) data.appetiteStatement = input.appetiteStatement
      if (input.appetiteLow !== undefined) data.appetiteLow = input.appetiteLow
      if (input.appetiteMedium !== undefined) data.appetiteMedium = input.appetiteMedium
      if (input.appetiteHigh !== undefined) data.appetiteHigh = input.appetiteHigh
      if (input.appetiteCategoryConfig !== undefined) {
        data.appetiteCategoryConfig = input.appetiteCategoryConfig ?? null
      }

      const org = await db.organisation.update({
        where: { id: ctx.user.orgId },
        data,
        select: APPETITE_SELECT,
      })

      await createAuditLog({
        action: 'UPDATE_APPETITE_CONFIG',
        entityType: 'ORGANISATION',
        entityId: ctx.user.orgId,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: {
          appetiteStatement: old?.appetiteStatement,
          appetiteLow: old?.appetiteLow,
          appetiteMedium: old?.appetiteMedium,
          appetiteHigh: old?.appetiteHigh,
        },
        newValues: {
          appetiteStatement: org.appetiteStatement,
          appetiteLow: org.appetiteLow,
          appetiteMedium: org.appetiteMedium,
          appetiteHigh: org.appetiteHigh,
        },
      })

      return org
    }),

  breachSummary: protectedProcedure.query(async ({ ctx }) => {
    const org = await db.organisation.findUnique({
      where: { id: ctx.user.orgId },
      select: APPETITE_SELECT,
    })

    const risks = await db.risk.findMany({
      where: {
        register: { orgId: ctx.user.orgId },
        status: { notIn: ['CLOSED'] },
      },
      select: { residualScore: true, category: true },
    })

    const orgThresholds: AppetiteThresholds = {
      low: org?.appetiteLow ?? 4,
      medium: org?.appetiteMedium ?? 9,
      high: org?.appetiteHigh ?? 14,
    }

    const categoryConfig = org?.appetiteCategoryConfig as
      Record<string, AppetiteThresholds> | null | undefined

    return countBreaches(risks, orgThresholds, categoryConfig)
  }),
})
