import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export const organisationRouter = router({
  // Get current organisation (any authenticated user)
  get: protectedProcedure.query(async ({ ctx }) => {
    const org = await db.organisation.findUnique({
      where: { id: ctx.user.orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        employeeCount: true,
        dataRetentionDays: true,
        consentGiven: true,
        consentDate: true,
        createdAt: true,
        snapshotFrequency: true,
        snapshotMateriality: true,
        plan: true,
      },
    })
    return org
  }),

  // Update organisation (ADMIN+)
  update: adminProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
      industry: z.string().nullable().optional(),
      employeeCount: z.number().nullable().optional(),
      snapshotFrequency: z.enum(['WEEKLY', 'MONTHLY']).optional(),
      snapshotMateriality: z.number().min(1).max(25).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const oldOrg = await db.organisation.findUnique({
        where: { id: ctx.user.orgId },
      })

      const { snapshotFrequency, snapshotMateriality, ...coreInput } = input

      const updateData: Record<string, unknown> = { ...coreInput }
      if (snapshotFrequency !== undefined) updateData.snapshotFrequency = snapshotFrequency
      if (snapshotMateriality !== undefined) updateData.snapshotMateriality = snapshotMateriality

      const org = await db.organisation.update({
        where: { id: ctx.user.orgId },
        data: updateData,
      })

      await createAuditLog({
        action: 'UPDATE_ORGANISATION',
        entityType: 'ORGANISATION',
        entityId: org.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: {
          name: oldOrg?.name,
          industry: oldOrg?.industry,
          employeeCount: oldOrg?.employeeCount,
          snapshotFrequency: oldOrg?.snapshotFrequency,
          snapshotMateriality: oldOrg?.snapshotMateriality,
        },
        newValues: {
          name: org.name,
          industry: org.industry,
          employeeCount: org.employeeCount,
          snapshotFrequency: org.snapshotFrequency,
          snapshotMateriality: org.snapshotMateriality,
        },
      })

      return org
    }),

  // Update POPIA settings (ADMIN+)
  updatePopia: adminProcedure
    .input(z.object({
      dataRetentionDays: z.number().min(365).max(3650),
      consentGiven: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await db.organisation.update({
        where: { id: ctx.user.orgId },
        data: {
          dataRetentionDays: input.dataRetentionDays,
          consentGiven: input.consentGiven,
          consentDate: input.consentGiven ? new Date() : null,
        },
      })

      await createAuditLog({
        action: 'UPDATE_POPIA_SETTINGS',
        entityType: 'ORGANISATION',
        entityId: org.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: {
          dataRetentionDays: org.dataRetentionDays,
          consentGiven: org.consentGiven,
        },
      })

      return org
    }),
})
