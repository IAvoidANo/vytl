import { router } from '@/lib/trpc'
import { riskRouter } from './risk'
import { kriRouter } from './kri'
import { auditRouter } from './audit'
import { importRouter } from './import'
import { assessmentRouter } from './assessment'
import { aiAnalysisRouter } from './ai-analysis'
import { userRouter } from './user'
import { organisationRouter } from './organisation'
import { scoringRouter } from './scoring'
import { treatmentRouter } from './treatment'
import { registerRouter } from './register'
import { regulatoryRouter } from './regulatory'
import { appetiteRouter } from './appetite'

export const appRouter = router({
  risk: riskRouter,
  kri: kriRouter,
  audit: auditRouter,
  import: importRouter,
  assessment: assessmentRouter,
  aiAnalysis: aiAnalysisRouter,
  user: userRouter,
  organisation: organisationRouter,
  scoring: scoringRouter,
  treatment: treatmentRouter,
  register: registerRouter,
  regulatory: regulatoryRouter,
  appetite: appetiteRouter,
})

export type AppRouter = typeof appRouter
