import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { Decimal } from '@prisma/client/runtime/library'

const kriDirectionEnum = z.enum(['HIGHER_IS_WORSE', 'LOWER_IS_WORSE'])

const createKriSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  direction: kriDirectionEnum,
  currentValue: z.number().optional(),
  thresholdGreen: z.number(),
  thresholdAmber: z.number(),
  thresholdRed: z.number(),
  ownerId: z.string().optional(),
})

const updateKriSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  unit: z.string().min(1).optional(),
  direction: kriDirectionEnum.optional(),
  currentValue: z.number().nullable().optional(),
  thresholdGreen: z.number().optional(),
  thresholdAmber: z.number().optional(),
  thresholdRed: z.number().optional(),
  ownerId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

// Calculate KRI status based on value, thresholds, and direction
function calculateStatus(
  value: number | null,
  green: number,
  amber: number,
  red: number,
  direction: 'HIGHER_IS_WORSE' | 'LOWER_IS_WORSE'
): 'GREEN' | 'AMBER' | 'RED' {
  if (value === null) return 'GREEN'

  if (direction === 'HIGHER_IS_WORSE') {
    // Higher values are worse: green < amber < red
    if (value >= red) return 'RED'
    if (value >= amber) return 'AMBER'
    return 'GREEN'
  } else {
    // Lower values are worse: green > amber > red
    if (value <= red) return 'RED'
    if (value <= amber) return 'AMBER'
    return 'GREEN'
  }
}

export const kriRouter = router({
  // List all KRIs for user's organisation
  list: protectedProcedure
    .input(
      z.object({
        activeOnly: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const kris = await db.kri.findMany({
        where: {
          orgId: ctx.user.orgId,
          ...(input?.activeOnly && { isActive: true }),
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { name: 'asc' },
      })
      return kris
    }),

  // Get a single KRI by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const kri = await db.kri.findFirst({
        where: {
          id: input.id,
          orgId: ctx.user.orgId,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      })

      if (!kri) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'KRI not found' })
      }

      return kri
    }),

  // Create a new KRI
  create: protectedProcedure
    .input(createKriSchema)
    .mutation(async ({ ctx, input }) => {
      const status = calculateStatus(
        input.currentValue ?? null,
        input.thresholdGreen,
        input.thresholdAmber,
        input.thresholdRed,
        input.direction
      )

      const kri = await db.kri.create({
        data: {
          name: input.name,
          description: input.description,
          unit: input.unit,
          direction: input.direction,
          currentValue: input.currentValue,
          thresholdGreen: input.thresholdGreen,
          thresholdAmber: input.thresholdAmber,
          thresholdRed: input.thresholdRed,
          status,
          lastUpdated: input.currentValue !== undefined ? new Date() : null,
          orgId: ctx.user.orgId,
          ownerId: input.ownerId,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      })

      return kri
    }),

  // Update a KRI
  update: protectedProcedure
    .input(updateKriSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db.kri.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'KRI not found' })
      }

      const { id, ...updateData } = input

      // Recalculate status if value or thresholds changed
      const currentValue = updateData.currentValue !== undefined
        ? updateData.currentValue
        : existing.currentValue?.toNumber() ?? null
      const thresholdGreen = updateData.thresholdGreen ?? existing.thresholdGreen.toNumber()
      const thresholdAmber = updateData.thresholdAmber ?? existing.thresholdAmber.toNumber()
      const thresholdRed = updateData.thresholdRed ?? existing.thresholdRed.toNumber()
      const direction = updateData.direction ?? existing.direction

      const status = calculateStatus(currentValue, thresholdGreen, thresholdAmber, thresholdRed, direction)

      const kri = await db.kri.update({
        where: { id },
        data: {
          ...updateData,
          status,
          lastUpdated: updateData.currentValue !== undefined ? new Date() : existing.lastUpdated,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      })

      return kri
    }),

  // Update just the current value (for quick updates)
  updateValue: protectedProcedure
    .input(z.object({
      id: z.string(),
      value: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.kri.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'KRI not found' })
      }

      const status = calculateStatus(
        input.value,
        existing.thresholdGreen.toNumber(),
        existing.thresholdAmber.toNumber(),
        existing.thresholdRed.toNumber(),
        existing.direction
      )

      const kri = await db.kri.update({
        where: { id: input.id },
        data: {
          currentValue: input.value,
          status,
          lastUpdated: new Date(),
        },
      })

      return kri
    }),

  // Delete a KRI
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.kri.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'KRI not found' })
      }

      await db.kri.delete({ where: { id: input.id } })

      return { success: true }
    }),

  // Get summary stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const kris = await db.kri.findMany({
      where: { orgId: ctx.user.orgId, isActive: true },
      select: { status: true },
    })

    return {
      total: kris.length,
      green: kris.filter((k) => k.status === 'GREEN').length,
      amber: kris.filter((k) => k.status === 'AMBER').length,
      red: kris.filter((k) => k.status === 'RED').length,
    }
  }),
})
