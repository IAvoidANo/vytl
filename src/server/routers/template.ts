import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { getTemplateByCode } from '@/lib/industry-templates'
import { calculateVytlScore, saveAssessment } from '@/lib/vytl-score'
import { createAuditLog } from '@/lib/audit'

export const templateRouter = router({
  /**
   * Apply an industry template to the authenticated organisation.
   * Creates a named register, bulk-inserts 15 pre-scored risks,
   * calculates the initial Vytl Score, and enables sample mode.
   *
   * Guard: organisation must have 0 existing risks.
   */
  applyTemplate: protectedProcedure
    .input(
      z.object({
        industryCode: z.enum(['MANUFACTURING', 'FINANCIAL_SERVICES', 'RETAIL']),
        force: z.boolean().optional(), // ADMIN+ only: bypass the empty-org guard
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId
      const userId = ctx.user.id

      const existingCount = await db.risk.count({
        where: { register: { orgId } },
      })

      if (existingCount > 0 && !input.force) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Organisation already has risks. Template cannot be applied.',
        })
      }

      // Only ADMIN+ may use force
      if (input.force) {
        const allowedRoles = ['OWNER', 'ADMIN']
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can apply a template to an existing organisation.',
          })
        }
      }

      const template = getTemplateByCode(input.industryCode)
      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Industry template not found' })
      }

      // Create a named register for the template
      const register = await db.riskRegister.create({
        data: {
          name: `${template.name} Risk Register`,
          description: `Pre-populated ${template.name} risk register created from industry template.`,
          status: 'ACTIVE',
          orgId,
        },
      })

      // Bulk-insert risks — sequential to keep refCodes consistent
      const risks: { id: string }[] = []
      for (let idx = 0; idx < template.risks.length; idx++) {
        const t = template.risks[idx]
        const categoryPrefix = t.category.substring(0, 3).toUpperCase()
        const refCode = `${categoryPrefix}-${String(idx + 1).padStart(3, '0')}`

        const risk = await db.risk.create({
          data: {
            refCode,
            title: t.title,
            description: t.description,
            category: t.category,
            inherentLikelihood: t.inherentLikelihood,
            inherentImpact: t.inherentImpact,
            inherentScore: t.inherentLikelihood * t.inherentImpact,
            residualLikelihood: t.residualLikelihood,
            residualImpact: t.residualImpact,
            residualScore: t.residualLikelihood * t.residualImpact,
            controls: t.controls,
            rootCause: t.rootCause,
            isOngoing: t.isOngoing,
            source: 'TEMPLATE',
            workflowStatus: 'APPROVED',
            registerId: register.id,
            createdById: userId,
            ownerId: userId,
          },
          select: { id: true },
        })
        risks.push(risk)
      }

      // Update organisation: set industry + enable sample mode + record applied template
      await db.organisation.update({
        where: { id: orgId },
        data: {
          industry: input.industryCode,
          isInSampleMode: true,
          sampleDataAppliedAt: new Date(),
          appliedTemplate: input.industryCode,
        },
      })

      // Calculate and persist initial Vytl Score
      const scoreResult = await calculateVytlScore(orgId)
      await saveAssessment(orgId, scoreResult, 'INITIAL', userId)

      // Audit log
      await createAuditLog({
        action: 'CREATE',
        entityType: 'REGISTER',
        entityId: register.id,
        userId,
        orgId,
        newValues: {
          templateApplied: input.industryCode,
          registerId: register.id,
          riskCount: risks.length,
          sampleMode: true,
        },
      })

      return {
        registerId: register.id,
        riskCount: risks.length,
        vytlScore: scoreResult.score,
        grade: scoreResult.grade,
      }
    }),

  /**
   * Convert sample data to live data — clears the sample flag, keeps all risks.
   */
  exitSampleMode: protectedProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.user.orgId

    await db.organisation.update({
      where: { id: orgId },
      data: {
        isInSampleMode: false,
        sampleDataExitedAt: new Date(),
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'ORGANISATION',
      entityId: orgId,
      userId: ctx.user.id,
      orgId,
      newValues: { isInSampleMode: false, exitMethod: 'manual' },
    })

    return { success: true, message: 'Sample data converted to live data' }
  }),

  /**
   * Delete all template data and return to empty state.
   * Only callable while in sample mode.
   */
  clearSampleData: protectedProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.user.orgId

    const org = await db.organisation.findUnique({
      where: { id: orgId },
      select: { isInSampleMode: true },
    })

    if (!org?.isInSampleMode) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Organisation is not in sample mode',
      })
    }

    // Delete all risks (cascades to TreatmentAction, AIAnalysis, RegulatoryMapping, Incident)
    await db.risk.deleteMany({ where: { register: { orgId } } })

    // Delete all registers
    await db.riskRegister.deleteMany({ where: { orgId } })

    // Delete Vytl Score assessments
    await db.assessment.deleteMany({ where: { orgId } })

    // Exit sample mode
    await db.organisation.update({
      where: { id: orgId },
      data: {
        isInSampleMode: false,
        sampleDataExitedAt: new Date(),
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'ORGANISATION',
      entityId: orgId,
      userId: ctx.user.id,
      orgId,
      newValues: { isInSampleMode: false, exitMethod: 'clear' },
    })

    return { success: true, message: 'Sample data deleted' }
  }),

  /**
   * Returns the current sample mode status for the authenticated org.
   */
  getSampleModeStatus: protectedProcedure.query(async ({ ctx }) => {
    const org = await db.organisation.findUnique({
      where: { id: ctx.user.orgId },
      select: {
        isInSampleMode: true,
        sampleDataAppliedAt: true,
        industry: true,
        appliedTemplate: true,
      },
    })

    return {
      isInSampleMode: org?.isInSampleMode ?? false,
      sampleDataAppliedAt: org?.sampleDataAppliedAt ?? null,
      industry: org?.industry ?? null,
      appliedTemplate: org?.appliedTemplate ?? null,
    }
  }),
})
