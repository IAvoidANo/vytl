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

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()

  return {
    session,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const user = ctx.session.user as SessionUser

  return next({
    ctx: {
      session: ctx.session,
      user,
    },
  })
})
