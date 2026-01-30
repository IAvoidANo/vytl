import { z } from 'zod'
import { router, protectedProcedure, adminProcedure, ownerProcedure, publicProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import { createAuditLog } from '@/lib/audit'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const roleEnum = z.enum(['OWNER', 'ADMIN', 'RISK_MANAGER', 'EDITOR', 'VIEWER'])

export const userRouter = router({
  // List all users in organisation (ADMIN+)
  list: adminProcedure.query(async ({ ctx }) => {
    const users = await db.user.findMany({
      where: { orgId: ctx.user.orgId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    })
    return users
  }),

  // Get a single user (ADMIN+)
  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.user.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          invitedBy: { select: { name: true, email: true } },
        },
      })

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      return user
    }),

  // Invite a new user (ADMIN+)
  invite: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      role: roleEnum.default('VIEWER'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Cannot invite OWNER role
      if (input.role === 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot invite a user with OWNER role',
        })
      }

      // Check if user already exists
      const existing = await db.user.findUnique({
        where: { email: input.email },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A user with this email already exists',
        })
      }

      // Generate invite token
      const inviteToken = crypto.randomBytes(32).toString('hex')
      const inviteTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const user = await db.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          status: 'INVITED',
          orgId: ctx.user.orgId,
          inviteToken,
          inviteTokenExpires,
          invitedById: ctx.user.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      })

      await createAuditLog({
        action: 'INVITE_USER',
        entityType: 'USER',
        entityId: user.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        newValues: {
          email: user.email,
          role: user.role,
        },
      })

      // TODO: Send invite email with link /accept-invite?token=${inviteToken}
      const inviteUrl = `${process.env.NEXTAUTH_URL}/accept-invite?token=${inviteToken}`

      return {
        user,
        inviteUrl, // Return for now since email isn't implemented
      }
    }),

  // Update user role (ADMIN+, cannot update OWNER or self to lower)
  updateRole: adminProcedure
    .input(z.object({
      id: z.string(),
      role: roleEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const targetUser = await db.user.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
      })

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      // Cannot change OWNER's role
      if (targetUser.role === 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change the role of the organisation owner',
        })
      }

      // Cannot set someone to OWNER
      if (input.role === 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot assign OWNER role',
        })
      }

      // Cannot change own role
      if (targetUser.id === ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change your own role',
        })
      }

      const oldRole = targetUser.role

      const user = await db.user.update({
        where: { id: input.id },
        data: { role: input.role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      })

      await createAuditLog({
        action: 'UPDATE_USER_ROLE',
        entityType: 'USER',
        entityId: user.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: { role: oldRole },
        newValues: { role: user.role },
      })

      return user
    }),

  // Disable/enable user (ADMIN+)
  setStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['ACTIVE', 'DISABLED']),
    }))
    .mutation(async ({ ctx, input }) => {
      const targetUser = await db.user.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
      })

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      // Cannot disable OWNER
      if (targetUser.role === 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot disable the organisation owner',
        })
      }

      // Cannot disable self
      if (targetUser.id === ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change your own status',
        })
      }

      const user = await db.user.update({
        where: { id: input.id },
        data: { status: input.status },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      })

      await createAuditLog({
        action: input.status === 'DISABLED' ? 'DISABLE_USER' : 'ENABLE_USER',
        entityType: 'USER',
        entityId: user.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return user
    }),

  // Delete user (OWNER only)
  delete: ownerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const targetUser = await db.user.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId },
      })

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      // Cannot delete OWNER
      if (targetUser.role === 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete the organisation owner',
        })
      }

      // Cannot delete self
      if (targetUser.id === ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete yourself',
        })
      }

      await db.user.delete({ where: { id: input.id } })

      await createAuditLog({
        action: 'DELETE_USER',
        entityType: 'USER',
        entityId: input.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        oldValues: {
          email: targetUser.email,
          role: targetUser.role,
        },
      })

      return { success: true }
    }),

  // Accept invite (public - no auth required)
  acceptInvite: publicProcedure
    .input(z.object({
      token: z.string(),
      name: z.string().min(1, 'Name is required'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ input }) => {
      const user = await db.user.findFirst({
        where: {
          inviteToken: input.token,
          status: 'INVITED',
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired invitation',
        })
      }

      if (user.inviteTokenExpires && user.inviteTokenExpires < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation has expired. Please request a new one.',
        })
      }

      const passwordHash = await bcrypt.hash(input.password, 12)

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          name: input.name,
          passwordHash,
          status: 'ACTIVE',
          inviteToken: null,
          inviteTokenExpires: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

      await createAuditLog({
        action: 'ACCEPT_INVITE',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        orgId: user.orgId,
      })

      return { success: true, email: updatedUser.email }
    }),

  // Resend invite (ADMIN+)
  resendInvite: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findFirst({
        where: { id: input.id, orgId: ctx.user.orgId, status: 'INVITED' },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found or not in invited status',
        })
      }

      // Generate new invite token
      const inviteToken = crypto.randomBytes(32).toString('hex')
      const inviteTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await db.user.update({
        where: { id: input.id },
        data: { inviteToken, inviteTokenExpires },
      })

      const inviteUrl = `${process.env.NEXTAUTH_URL}/accept-invite?token=${inviteToken}`

      // TODO: Send invite email

      return { inviteUrl }
    }),

  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        organisation: {
          select: { name: true, industry: true },
        },
      },
    })
    return user
  }),

  // Update own profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.update({
        where: { id: ctx.user.id },
        data: { name: input.name },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })
      return user
    }),

  // Change own password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
      })

      if (!user?.passwordHash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change password for this account type',
        })
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash)
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        })
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12)

      await db.user.update({
        where: { id: ctx.user.id },
        data: { passwordHash },
      })

      await createAuditLog({
        action: 'CHANGE_PASSWORD',
        entityType: 'USER',
        entityId: ctx.user.id,
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return { success: true }
    }),

  // Request password reset (public)
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // Rate limit by email to prevent abuse (10 requests per 15 minutes)
      checkRateLimit(`reset:${input.email}`, RATE_LIMITS.auth)

      const user = await db.user.findUnique({
        where: { email: input.email },
      })

      // Always return success to prevent email enumeration
      if (!user || user.status !== 'ACTIVE') {
        return { success: true, resetUrl: undefined }
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires },
      })

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

      // TODO: Send email with reset link
      // For now, log the URL (in production this would be sent via email)
      console.log(`[Password Reset] URL for ${input.email}: ${resetUrl}`)

      return { success: true, resetUrl } // Return resetUrl temporarily until email is set up
    }),

  // Verify reset token (public)
  verifyResetToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const user = await db.user.findFirst({
        where: {
          resetToken: input.token,
          resetTokenExpires: { gt: new Date() },
        },
        select: { email: true },
      })

      return { valid: !!user, email: user?.email }
    }),

  // Reset password with token (public)
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ input }) => {
      const user = await db.user.findFirst({
        where: {
          resetToken: input.token,
          resetTokenExpires: { gt: new Date() },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired reset token',
        })
      }

      const passwordHash = await bcrypt.hash(input.password, 12)

      await db.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpires: null,
        },
      })

      await createAuditLog({
        action: 'RESET_PASSWORD',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        orgId: user.orgId,
      })

      return { success: true }
    }),
})
