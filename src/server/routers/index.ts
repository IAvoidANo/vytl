import { router } from '@/lib/trpc'
import { riskRouter } from './risk'
import { kriRouter } from './kri'
import { auditRouter } from './audit'
import { importRouter } from './import'

export const appRouter = router({
  risk: riskRouter,
  kri: kriRouter,
  audit: auditRouter,
  import: importRouter,
})

export type AppRouter = typeof appRouter
