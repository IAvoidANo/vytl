import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'

export const auditRouter = router({
  listByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await db.auditLog.findMany({
        where: {
          orgId: ctx.user.orgId,
          entityType: input.entityType,
          entityId: input.entityId,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })
      return logs
    }),

  // Get recent activity across the organisation
  recent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await db.auditLog.findMany({
        where: {
          orgId: ctx.user.orgId,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })
      return logs
    }),
})
