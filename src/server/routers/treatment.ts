import { z } from 'zod'
import { router, protectedProcedure, editorProcedure, riskManagerProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { createAuditLog } from '@/lib/audit'
import {
  createTreatmentActionSchema,
  updateTreatmentActionSchema,
  getCompletedAtForStatus,
} from '@/lib/treatment-validation'

export const treatmentRouter = router({
  // List actions for a risk
  list: protectedProcedure
    .input(z.object({ riskId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify risk belongs to org
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const actions = await db.treatmentAction.findMany({
        where: { riskId: input.riskId },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return actions
    }),

  // Create a treatment action (EDITOR+)
  create: editorProcedure
    .input(createTreatmentActionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify risk belongs to org
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const action = await db.treatmentAction.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          riskId: input.riskId,
          createdById: ctx.user.id,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
      })

      await createAuditLog({
        action: 'CREATE',
        entityType: 'TREATMENT_ACTION',
        entityId: action.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: {
          title: action.title,
          priority: action.priority,
          riskId: action.riskId,
        },
      })

      return action
    }),

  // Update a treatment action (EDITOR+)
  update: editorProcedure
    .input(updateTreatmentActionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify action belongs to org via risk
      const existing = await db.treatmentAction.findFirst({
        where: {
          id: input.id,
          risk: { register: { orgId: ctx.user.orgId } },
        },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Treatment action not found' })
      }

      const { id, ...updateData } = input

      // Handle completedAt based on status transition
      const completedAt = getCompletedAtForStatus(updateData.status, existing.status)

      const action = await db.treatmentAction.update({
        where: { id },
        data: {
          ...updateData,
          dueDate: updateData.dueDate === null ? null : updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          completedAt: completedAt,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
      })

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'TREATMENT_ACTION',
        entityId: action.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: { status: existing.status, priority: existing.priority, title: existing.title },
        newValues: { status: action.status, priority: action.priority, title: action.title },
      })

      return action
    }),

  // Delete a treatment action (RISK_MANAGER+)
  delete: riskManagerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify action belongs to org via risk
      const existing = await db.treatmentAction.findFirst({
        where: {
          id: input.id,
          risk: { register: { orgId: ctx.user.orgId } },
        },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Treatment action not found' })
      }

      await db.treatmentAction.delete({ where: { id: input.id } })

      await createAuditLog({
        action: 'DELETE',
        entityType: 'TREATMENT_ACTION',
        entityId: input.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: { title: existing.title, riskId: existing.riskId },
      })

      return { success: true }
    }),

  // Get action stats for a risk
  stats: protectedProcedure
    .input(z.object({ riskId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify risk belongs to org
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const actions = await db.treatmentAction.findMany({
        where: { riskId: input.riskId },
        select: { status: true },
      })

      const total = actions.length
      const byStatus: Record<string, number> = {
        OPEN: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      }
      for (const action of actions) {
        byStatus[action.status]++
      }

      return {
        total,
        completed: byStatus.COMPLETED,
        byStatus,
      }
    }),

  // Org-wide treatment action stats for dashboard
  orgStats: protectedProcedure.query(async ({ ctx }) => {
    const actions = await db.treatmentAction.findMany({
      where: {
        risk: { register: { orgId: ctx.user.orgId } },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      select: { status: true, dueDate: true },
    })

    const now = new Date()
    const overdue = actions.filter((a) => a.dueDate && new Date(a.dueDate) < now).length
    const openCount = actions.length

    return { openCount, overdue }
  }),
})
