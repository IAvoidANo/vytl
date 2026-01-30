import { z } from 'zod'
import { router, protectedProcedure, editorProcedure, riskManagerProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { createAuditLog, pickAuditFields, hasChanges } from '@/lib/audit'

const riskCategoryEnum = z.enum([
  'STRATEGIC',
  'OPERATIONAL',
  'FINANCIAL',
  'COMPLIANCE',
  'TECHNOLOGY',
  'REPUTATIONAL',
  'ENVIRONMENTAL',
  'PEOPLE',
])

const riskResponseEnum = z.enum(['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT'])
const riskStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'MONITORING', 'CLOSED'])

const createRiskSchema = z.object({
  registerId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: riskCategoryEnum,
  inherentLikelihood: z.number().min(1).max(5),
  inherentImpact: z.number().min(1).max(5),
  residualLikelihood: z.number().min(1).max(5),
  residualImpact: z.number().min(1).max(5),
  response: riskResponseEnum,
  controls: z.string().optional(),
  rootCause: z.string().optional(),
  ownerId: z.string().optional(),
  dueDate: z.string().optional(),
  isOngoing: z.boolean().optional(),
})

const updateRiskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: riskCategoryEnum.optional(),
  inherentLikelihood: z.number().min(1).max(5).optional(),
  inherentImpact: z.number().min(1).max(5).optional(),
  residualLikelihood: z.number().min(1).max(5).optional(),
  residualImpact: z.number().min(1).max(5).optional(),
  response: riskResponseEnum.optional(),
  controls: z.string().nullable().optional(),
  rootCause: z.string().nullable().optional(),
  status: riskStatusEnum.optional(),
  ownerId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  isOngoing: z.boolean().optional(),
})

export const riskRouter = router({
  // List all risks for user's organisation
  list: protectedProcedure
    .input(
      z.object({
        registerId: z.string().optional(),
        status: riskStatusEnum.optional(),
        category: riskCategoryEnum.optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const risks = await db.risk.findMany({
        where: {
          register: {
            orgId: ctx.user.orgId,
          },
          ...(input?.registerId && { registerId: input.registerId }),
          ...(input?.status && { status: input.status }),
          ...(input?.category && { category: input.category }),
        },
        include: {
          register: { select: { name: true } },
          owner: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return risks
    }),

  // Get a single risk by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: {
          id: input.id,
          register: { orgId: ctx.user.orgId },
        },
        include: {
          register: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
          aiAnalysis: true,
        },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      return risk
    }),

  // Get risk statistics for dashboard
  stats: protectedProcedure.query(async ({ ctx }) => {
    const risks = await db.risk.findMany({
      where: { register: { orgId: ctx.user.orgId } },
      select: {
        status: true,
        category: true,
        residualScore: true,
      },
    })

    const total = risks.length

    // Count by status
    const byStatus = {
      OPEN: 0,
      IN_PROGRESS: 0,
      MONITORING: 0,
      CLOSED: 0,
    }
    for (const risk of risks) {
      byStatus[risk.status]++
    }

    // Count by category
    const byCategory: Record<string, number> = {}
    for (const risk of risks) {
      byCategory[risk.category] = (byCategory[risk.category] || 0) + 1
    }

    // Count high risks (residual score >= 15)
    const highRisks = risks.filter((r) => r.residualScore >= 15).length

    return {
      total,
      byStatus,
      byCategory,
      highRisks,
    }
  }),

  // Get top 5 highest-risk items
  topRisks: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).optional().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const risks = await db.risk.findMany({
        where: { register: { orgId: ctx.user.orgId } },
        select: {
          id: true,
          refCode: true,
          title: true,
          category: true,
          residualScore: true,
          residualLikelihood: true,
          residualImpact: true,
          status: true,
          owner: { select: { name: true } },
        },
        orderBy: { residualScore: 'desc' },
        take: input.limit,
      })
      return risks
    }),

  // Create a new risk (EDITOR+)
  create: editorProcedure
    .input(createRiskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify register belongs to user's org
      const register = await db.riskRegister.findFirst({
        where: { id: input.registerId, orgId: ctx.user.orgId },
      })

      if (!register) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk register not found' })
      }

      // Generate ref code
      const riskCount = await db.risk.count({ where: { registerId: input.registerId } })
      const categoryPrefix = input.category.substring(0, 3).toUpperCase()
      const refCode = `${categoryPrefix}-${String(riskCount + 1).padStart(3, '0')}`

      const risk = await db.risk.create({
        data: {
          refCode,
          title: input.title,
          description: input.description,
          category: input.category,
          inherentLikelihood: input.inherentLikelihood,
          inherentImpact: input.inherentImpact,
          inherentScore: input.inherentLikelihood * input.inherentImpact,
          residualLikelihood: input.residualLikelihood,
          residualImpact: input.residualImpact,
          residualScore: input.residualLikelihood * input.residualImpact,
          response: input.response,
          controls: input.controls,
          rootCause: input.rootCause,
          registerId: input.registerId,
          createdById: ctx.user.id,
          ownerId: input.ownerId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          isOngoing: input.isOngoing ?? false,
        },
        include: {
          register: { select: { name: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      })

      await createAuditLog({
        action: 'CREATE',
        entityType: 'RISK',
        entityId: risk.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: {
          refCode: risk.refCode,
          title: risk.title,
          category: risk.category,
          inherentScore: risk.inherentScore,
          residualScore: risk.residualScore,
          status: risk.status,
          response: risk.response,
        },
      })

      return risk
    }),

  // Update a risk (EDITOR+)
  update: editorProcedure
    .input(updateRiskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify risk belongs to user's org
      const existing = await db.risk.findFirst({
        where: { id: input.id, register: { orgId: ctx.user.orgId } },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const auditFields = [
        'title', 'description', 'category', 'inherentLikelihood',
        'inherentImpact', 'residualLikelihood', 'residualImpact',
        'response', 'controls', 'status', 'ownerId',
      ] as const
      const oldValues = pickAuditFields(existing as Record<string, unknown>, [...auditFields])

      const { id, ...updateData } = input

      // Calculate scores if likelihood/impact changed
      const inherentLikelihood = updateData.inherentLikelihood ?? existing.inherentLikelihood
      const inherentImpact = updateData.inherentImpact ?? existing.inherentImpact
      const residualLikelihood = updateData.residualLikelihood ?? existing.residualLikelihood
      const residualImpact = updateData.residualImpact ?? existing.residualImpact

      const risk = await db.risk.update({
        where: { id },
        data: {
          ...updateData,
          inherentScore: inherentLikelihood * inherentImpact,
          residualScore: residualLikelihood * residualImpact,
          dueDate: updateData.dueDate === null ? null : updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        },
        include: {
          register: { select: { name: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      })

      const newValues = pickAuditFields(risk as unknown as Record<string, unknown>, [...auditFields])

      if (hasChanges(oldValues, newValues)) {
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'RISK',
          entityId: risk.id,
          userId: ctx.user.id,
          orgId: ctx.user.orgId,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          oldValues,
          newValues,
        })
      }

      return risk
    }),

  // Delete a risk (RISK_MANAGER+)
  delete: riskManagerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify risk belongs to user's org
      const existing = await db.risk.findFirst({
        where: { id: input.id, register: { orgId: ctx.user.orgId } },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      await db.risk.delete({ where: { id: input.id } })

      await createAuditLog({
        action: 'DELETE',
        entityType: 'RISK',
        entityId: input.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: {
          refCode: existing.refCode,
          title: existing.title,
          category: existing.category,
        },
      })

      return { success: true }
    }),

  // Bulk create risks from Excel import (EDITOR+)
  bulkCreate: editorProcedure
    .input(
      z.object({
        registerId: z.string(),
        risks: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            category: riskCategoryEnum,
            inherentLikelihood: z.number().min(1).max(5),
            inherentImpact: z.number().min(1).max(5),
            residualLikelihood: z.number().min(1).max(5),
            residualImpact: z.number().min(1).max(5),
            response: riskResponseEnum.optional(),
            controls: z.string().optional(),
            status: riskStatusEnum.optional(),
            dueDate: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const register = await db.riskRegister.findFirst({
        where: { id: input.registerId, orgId: ctx.user.orgId },
      })

      if (!register) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk register not found' })
      }

      const riskCount = await db.risk.count({ where: { registerId: input.registerId } })

      const created = await db.$transaction(
        input.risks.map((risk, idx) => {
          const categoryPrefix = risk.category.substring(0, 3).toUpperCase()
          const refCode = `${categoryPrefix}-${String(riskCount + idx + 1).padStart(3, '0')}`

          return db.risk.create({
            data: {
              refCode,
              title: risk.title,
              description: risk.description,
              category: risk.category,
              inherentLikelihood: risk.inherentLikelihood,
              inherentImpact: risk.inherentImpact,
              inherentScore: risk.inherentLikelihood * risk.inherentImpact,
              residualLikelihood: risk.residualLikelihood,
              residualImpact: risk.residualImpact,
              residualScore: risk.residualLikelihood * risk.residualImpact,
              response: risk.response ?? 'MITIGATE',
              controls: risk.controls,
              status: risk.status ?? 'OPEN',
              source: 'EXCEL',
              registerId: input.registerId,
              createdById: ctx.user.id,
              dueDate: risk.dueDate ? new Date(risk.dueDate) : null,
            },
          })
        })
      )

      for (const risk of created) {
        await createAuditLog({
          action: 'CREATE',
          entityType: 'RISK',
          entityId: risk.id,
          userId: ctx.user.id,
          orgId: ctx.user.orgId,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          newValues: {
            refCode: risk.refCode,
            title: risk.title,
            category: risk.category,
            source: 'EXCEL',
          },
        })
      }

      return { count: created.length }
    }),

  // Get risk registers for dropdown
  registers: protectedProcedure.query(async ({ ctx }) => {
    const registers = await db.riskRegister.findMany({
      where: { orgId: ctx.user.orgId },
      select: { id: true, name: true, status: true },
      orderBy: { name: 'asc' },
    })
    return registers
  }),

  // Get users for owner dropdown
  users: protectedProcedure.query(async ({ ctx }) => {
    const users = await db.user.findMany({
      where: { orgId: ctx.user.orgId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    })
    return users
  }),

  // Get score trends for risks (extracted from audit logs)
  trends: protectedProcedure
    .input(
      z.object({
        riskIds: z.array(z.string()),
        days: z.number().min(1).max(90).optional().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify risks belong to user's org
      const risks = await db.risk.findMany({
        where: {
          id: { in: input.riskIds },
          register: { orgId: ctx.user.orgId },
        },
        select: {
          id: true,
          residualScore: true,
          createdAt: true,
        },
      })

      const riskMap = new Map(risks.map((r) => [r.id, r]))
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - input.days)

      // Get audit logs for these risks
      const auditLogs = await db.auditLog.findMany({
        where: {
          orgId: ctx.user.orgId,
          entityType: 'RISK',
          entityId: { in: input.riskIds },
          action: { in: ['CREATE', 'UPDATE'] },
          createdAt: { gte: cutoffDate },
        },
        select: {
          entityId: true,
          action: true,
          oldValues: true,
          newValues: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      // Build trend data for each risk
      const trends: Record<string, number[]> = {}

      for (const riskId of input.riskIds) {
        const risk = riskMap.get(riskId)
        if (!risk) continue

        const riskLogs = auditLogs.filter((log) => log.entityId === riskId)
        const scores: number[] = []

        // Get initial score from CREATE or first UPDATE
        for (const log of riskLogs) {
          const values = log.action === 'CREATE' ? log.newValues : log.newValues
          if (values && typeof values === 'object' && 'residualScore' in values) {
            const score = (values as Record<string, unknown>).residualScore
            if (typeof score === 'number') {
              scores.push(score)
            }
          }
        }

        // Add current score as last data point
        if (scores.length === 0 || scores[scores.length - 1] !== risk.residualScore) {
          scores.push(risk.residualScore)
        }

        // If only one data point, duplicate it to show a flat line
        if (scores.length === 1) {
          scores.push(scores[0])
        }

        trends[riskId] = scores
      }

      return trends
    }),
})
