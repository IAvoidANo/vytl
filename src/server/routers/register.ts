import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { createAuditLog } from '@/lib/audit'
import {
  createRegisterSchema,
  updateRegisterSchema,
  canDeleteRegister,
} from '@/lib/register-validation'

export const registerRouter = router({
  // List all registers for the org with risk counts
  list: protectedProcedure.query(async ({ ctx }) => {
    const registers = await db.riskRegister.findMany({
      where: { orgId: ctx.user.orgId },
      include: {
        _count: { select: { risks: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return registers
  }),

  // Create a new register (ADMIN+)
  create: adminProcedure
    .input(createRegisterSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify orgId from session exists in DB
      const org = await db.organisation.findUnique({
        where: { id: ctx.user.orgId },
        select: { id: true },
      })

      if (!org) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Your organisation could not be found. Please log out and log back in.',
        })
      }

      // Check unique name within org
      const existing = await db.riskRegister.findFirst({
        where: { orgId: org.id, name: input.name },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A register with this name already exists',
        })
      }

      const register = await db.riskRegister.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
          orgId: org.id,
        },
        include: {
          _count: { select: { risks: true } },
        },
      })

      await createAuditLog({
        action: 'CREATE',
        entityType: 'REGISTER',
        entityId: register.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: { name: register.name, status: register.status },
      })

      return register
    }),

  // Update a register (ADMIN+)
  update: adminProcedure
    .input(updateRegisterSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db.riskRegister.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Register not found' })
      }

      // Check unique name if being changed
      if (input.name && input.name !== existing.name) {
        const nameConflict = await db.riskRegister.findFirst({
          where: { orgId: ctx.user.orgId, name: input.name, NOT: { id: input.id } },
        })
        if (nameConflict) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A register with this name already exists',
          })
        }
      }

      const { id, ...updateData } = input

      const register = await db.riskRegister.update({
        where: { id },
        data: updateData,
        include: {
          _count: { select: { risks: true } },
        },
      })

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'REGISTER',
        entityId: register.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: { name: existing.name, status: existing.status },
        newValues: { name: register.name, status: register.status },
      })

      return register
    }),

  // Delete a register (ADMIN+)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.riskRegister.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
        include: { _count: { select: { risks: true } } },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Register not found' })
      }

      // Safety checks
      const registerCount = await db.riskRegister.count({
        where: { orgId: ctx.user.orgId },
      })

      const deleteError = canDeleteRegister(existing._count.risks, registerCount)
      if (deleteError) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: deleteError })
      }

      await db.riskRegister.delete({ where: { id: input.id } })

      await createAuditLog({
        action: 'DELETE',
        entityType: 'REGISTER',
        entityId: input.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: { name: existing.name },
      })

      return { success: true }
    }),
})
