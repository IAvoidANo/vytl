import { router } from '@/lib/trpc'
import { riskRouter } from './risk'
import { kriRouter } from './kri'
import { auditRouter } from './audit'

export const appRouter = router({
  risk: riskRouter,
  kri: kriRouter,
  audit: auditRouter,
})

export type AppRouter = typeof appRouter
