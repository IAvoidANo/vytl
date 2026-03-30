import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'

export const notificationRouter = router({
  // List recent notifications for current user
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const notifications = await db.notification.findMany({
        where: { userId: ctx.user.id, orgId: ctx.user.orgId },
        orderBy: { createdAt: 'desc' },
        take: input?.limit ?? 20,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          entityType: true,
          entityId: true,
          read: true,
          createdAt: true,
        },
      })
      return notifications
    }),

  // Count unread notifications
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await db.notification.count({
      where: { userId: ctx.user.id, orgId: ctx.user.orgId, read: false },
    })
    return { count }
  }),

  // Mark a notification as read
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.notification.updateMany({
        where: { id: input.id, userId: ctx.user.id },
        data: { read: true },
      })
      return { success: true }
    }),

  // Mark all notifications as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.notification.updateMany({
      where: { userId: ctx.user.id, orgId: ctx.user.orgId, read: false },
      data: { read: true },
    })
    return { success: true }
  }),
})
