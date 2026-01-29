import { router } from '@/lib/trpc'
import { riskRouter } from './risk'
import { kriRouter } from './kri'
import { auditRouter } from './audit'
import { importRouter } from './import'
import { assessmentRouter } from './assessment'

export const appRouter = router({
  risk: riskRouter,
  kri: kriRouter,
  audit: auditRouter,
  import: importRouter,
  assessment: assessmentRouter,
})

export type AppRouter = typeof appRouter
