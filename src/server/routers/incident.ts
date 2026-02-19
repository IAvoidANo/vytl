import { z } from 'zod'
import { router, protectedProcedure, editorProcedure, riskManagerProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { createAuditLog } from '@/lib/audit'
import {
  createIncidentSchema,
  updateIncidentSchema,
  getResolvedAtForStatus,
} from '@/lib/incident-validation'

export const incidentRouter = router({
  list: protectedProcedure
    .input(z.object({ riskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      return db.incident.findMany({
        where: { riskId: input.riskId },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { occurredAt: 'desc' },
      })
    }),

  create: editorProcedure
    .input(createIncidentSchema)
    .mutation(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const incident = await db.incident.create({
        data: {
          title: input.title,
          description: input.description,
          severity: input.severity,
          occurredAt: input.occurredAt,
          riskId: input.riskId,
          reportedById: ctx.user.id,
          assigneeId: input.assigneeId,
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      })

      await createAuditLog({
        action: 'CREATE',
        entityType: 'INCIDENT',
        entityId: incident.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: {
          title: incident.title,
          severity: incident.severity,
          riskId: incident.riskId,
        },
      })

      return incident
    }),

  update: editorProcedure
    .input(updateIncidentSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db.incident.findFirst({
        where: {
          id: input.id,
          risk: { register: { orgId: ctx.user.orgId } },
        },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Incident not found' })
      }

      const { id, ...updateData } = input

      // Handle resolvedAt based on status transition
      const resolvedAt = updateData.status
        ? getResolvedAtForStatus(updateData.status)
        : undefined

      const incident = await db.incident.update({
        where: { id },
        data: {
          ...updateData,
          ...(resolvedAt !== undefined && { resolvedAt }),
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      })

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'INCIDENT',
        entityId: incident.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: { status: existing.status, severity: existing.severity, title: existing.title },
        newValues: { status: incident.status, severity: incident.severity, title: incident.title },
      })

      return incident
    }),

  delete: riskManagerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.incident.findFirst({
        where: {
          id: input.id,
          risk: { register: { orgId: ctx.user.orgId } },
        },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Incident not found' })
      }

      await db.incident.delete({ where: { id: input.id } })

      await createAuditLog({
        action: 'DELETE',
        entityType: 'INCIDENT',
        entityId: input.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: { title: existing.title, riskId: existing.riskId },
      })

      return { success: true }
    }),

  stats: protectedProcedure
    .input(z.object({ riskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const incidents = await db.incident.findMany({
        where: { riskId: input.riskId },
        select: { status: true },
      })

      const byStatus: Record<string, number> = {
        OPEN: 0,
        INVESTIGATING: 0,
        CONTAINED: 0,
        RESOLVED: 0,
        CLOSED: 0,
      }
      for (const inc of incidents) {
        byStatus[inc.status]++
      }

      return {
        total: incidents.length,
        resolved: byStatus.RESOLVED + byStatus.CLOSED,
        byStatus,
      }
    }),
})
