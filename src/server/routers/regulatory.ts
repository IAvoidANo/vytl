import { z } from 'zod'
import { router, protectedProcedure, editorProcedure, riskManagerProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { createAuditLog } from '@/lib/audit'
import {
  createRegulatoryMappingSchema,
  updateRegulatoryMappingSchema,
  bulkCreateMappingsSchema,
  coverageQuerySchema,
  calculateCoverage,
  calculateOverallCoverage,
} from '@/lib/regulatory-validation'
import { isValidRequirementCode } from '@/lib/regulatory-frameworks'
import type { FrameworkId } from '@/lib/regulatory-frameworks'

export const regulatoryRouter = router({
  // List mappings for a risk
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

      return db.regulatoryMapping.findMany({
        where: { riskId: input.riskId },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  // Create a single mapping (EDITOR+)
  create: editorProcedure
    .input(createRegulatoryMappingSchema)
    .mutation(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      if (!isValidRequirementCode(input.requirementCode)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid requirement code' })
      }

      const mapping = await db.regulatoryMapping.create({
        data: {
          riskId: input.riskId,
          requirementCode: input.requirementCode,
          complianceStatus: input.complianceStatus,
          notes: input.notes,
          createdById: ctx.user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      })

      await createAuditLog({
        action: 'CREATE',
        entityType: 'REGULATORY_MAPPING',
        entityId: mapping.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: {
          requirementCode: mapping.requirementCode,
          complianceStatus: mapping.complianceStatus,
          riskId: mapping.riskId,
        },
      })

      return mapping
    }),

  // Bulk create mappings for a risk (EDITOR+)
  bulkCreate: editorProcedure
    .input(bulkCreateMappingsSchema)
    .mutation(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      // Validate all requirement codes
      const invalidCodes = input.requirementCodes.filter((code) => !isValidRequirementCode(code))
      if (invalidCodes.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid requirement codes: ${invalidCodes.join(', ')}`,
        })
      }

      // Skip codes that already have mappings for this risk
      const existing = await db.regulatoryMapping.findMany({
        where: { riskId: input.riskId, requirementCode: { in: input.requirementCodes } },
        select: { requirementCode: true },
      })
      const existingCodes = new Set(existing.map((m) => m.requirementCode))
      const newCodes = input.requirementCodes.filter((code) => !existingCodes.has(code))

      if (newCodes.length === 0) {
        return { created: 0, skipped: input.requirementCodes.length }
      }

      await db.regulatoryMapping.createMany({
        data: newCodes.map((code) => ({
          riskId: input.riskId,
          requirementCode: code,
          complianceStatus: input.complianceStatus,
          createdById: ctx.user.id,
        })),
      })

      await createAuditLog({
        action: 'CREATE',
        entityType: 'REGULATORY_MAPPING',
        entityId: input.riskId,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: {
          requirementCodes: newCodes,
          complianceStatus: input.complianceStatus,
          bulk: true,
        },
      })

      return { created: newCodes.length, skipped: existingCodes.size }
    }),

  // Update a mapping (EDITOR+)
  update: editorProcedure
    .input(updateRegulatoryMappingSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db.regulatoryMapping.findFirst({
        where: {
          id: input.id,
          risk: { register: { orgId: ctx.user.orgId } },
        },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Regulatory mapping not found' })
      }

      const { id, ...updateData } = input

      const mapping = await db.regulatoryMapping.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      })

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'REGULATORY_MAPPING',
        entityId: mapping.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: {
          complianceStatus: existing.complianceStatus,
          notes: existing.notes,
        },
        newValues: {
          complianceStatus: mapping.complianceStatus,
          notes: mapping.notes,
        },
      })

      return mapping
    }),

  // Delete a mapping (RISK_MANAGER+)
  delete: riskManagerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.regulatoryMapping.findFirst({
        where: {
          id: input.id,
          risk: { register: { orgId: ctx.user.orgId } },
        },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Regulatory mapping not found' })
      }

      await db.regulatoryMapping.delete({ where: { id: input.id } })

      await createAuditLog({
        action: 'DELETE',
        entityType: 'REGULATORY_MAPPING',
        entityId: input.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: {
          requirementCode: existing.requirementCode,
          complianceStatus: existing.complianceStatus,
          riskId: existing.riskId,
        },
      })

      return { success: true }
    }),

  // Org-wide coverage report
  coverage: protectedProcedure
    .input(coverageQuerySchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        risk: { register: { orgId: ctx.user.orgId } },
      }

      if (input.registerId) {
        where.risk = { registerId: input.registerId, register: { orgId: ctx.user.orgId } }
      }

      const mappings = await db.regulatoryMapping.findMany({
        where,
        select: { requirementCode: true, complianceStatus: true },
      })

      if (input.frameworkId) {
        return calculateCoverage(mappings, input.frameworkId as FrameworkId)
      }

      return calculateOverallCoverage(mappings)
    }),

  // Per-risk coverage
  riskCoverage: protectedProcedure
    .input(z.object({ riskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: { id: input.riskId, register: { orgId: ctx.user.orgId } },
        select: { id: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      const mappings = await db.regulatoryMapping.findMany({
        where: { riskId: input.riskId },
        select: { requirementCode: true, complianceStatus: true },
      })

      return calculateOverallCoverage(mappings)
    }),
})
