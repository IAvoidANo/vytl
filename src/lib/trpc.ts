import * as Sentry from '@sentry/nextjs'
import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from './auth'
import type { Role } from '@prisma/client'

interface SessionUser {
  id: string
  role: Role
  orgId: string
  email?: string | null
  name?: string | null
}

// Role hierarchy: OWNER > ADMIN > RISK_MANAGER > EDITOR > VIEWER
const ROLE_LEVELS: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  RISK_MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]
}

export function requireRole(userRole: Role, requiredRole: Role): void {
  if (!hasRole(userRole, requiredRole)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `This action requires ${requiredRole} role or higher`,
    })
  }
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()

  // Extract IP and User-Agent for audit logging
  const ipAddress = opts.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || opts.headers.get('x-real-ip')
    || 'unknown'
  const userAgent = opts.headers.get('user-agent') || 'unknown'

  return {
    session,
    ipAddress,
    userAgent,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    if (
      error.code !== 'UNAUTHORIZED' &&
      error.code !== 'FORBIDDEN' &&
      error.code !== 'BAD_REQUEST' &&
      error.code !== 'NOT_FOUND' &&
      error.code !== 'CONFLICT' &&
      error.code !== 'TOO_MANY_REQUESTS'
    ) {
      Sentry.captureException(error.cause ?? error)
    }
    return shape
  },
})

export const router = t.router
export const publicProcedure = t.procedure

// Base protected procedure - any authenticated user
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const user = ctx.session.user as SessionUser

  return next({
    ctx: {
      session: ctx.session,
      user,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  })
})

// EDITOR+ procedure - can create/edit (EDITOR, RISK_MANAGER, ADMIN, OWNER)
export const editorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  requireRole(ctx.user.role, 'EDITOR')
  return next({ ctx })
})

// RISK_MANAGER+ procedure - can delete, manage KRIs (RISK_MANAGER, ADMIN, OWNER)
export const riskManagerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  requireRole(ctx.user.role, 'RISK_MANAGER')
  return next({ ctx })
})

// ADMIN+ procedure - can manage users, settings (ADMIN, OWNER)
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  requireRole(ctx.user.role, 'ADMIN')
  return next({ ctx })
})

// OWNER only procedure - full org control
export const ownerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  requireRole(ctx.user.role, 'OWNER')
  return next({ ctx })
})

