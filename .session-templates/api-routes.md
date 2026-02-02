# Vytl API Routes Reference

## tRPC Routers

All routers are in `src/server/routers/`

### Risk Router (`risk.ts`)
```typescript
risk.list      // Query - List risks with optional filters (registerId, status, category)
risk.get       // Query - Get single risk by ID
risk.create    // Mutation - Create new risk (editorProcedure)
risk.update    // Mutation - Update risk (editorProcedure)
risk.delete    // Mutation - Delete risk (riskManagerProcedure)
risk.stats     // Query - Get risk statistics for dashboard
risk.topRisks  // Query - Get top 5 highest-scoring risks
risk.bulkCreate // Mutation - Create multiple risks from import
```

### KRI Router (`kri.ts`)
```typescript
kri.list       // Query - List all KRIs for org
kri.get        // Query - Get single KRI by ID
kri.create     // Mutation - Create new KRI
kri.update     // Mutation - Update KRI
kri.delete     // Mutation - Delete KRI
kri.updateValue // Mutation - Update KRI current value
```

### Audit Router (`audit.ts`)
```typescript
audit.getForEntity  // Query - Get audit logs for specific entity
audit.recent        // Query - Get recent activity for dashboard
```

### Assessment Router (`assessment.ts`)
```typescript
assessment.current  // Query - Get current Vytl Score
assessment.create   // Mutation - Create new assessment
assessment.recalculate // Mutation - Recalculate Vytl Score
```

### AI Analysis Router (`ai-analysis.ts`)
```typescript
aiAnalysis.get      // Query - Get AI analysis for a risk
aiAnalysis.generate // Mutation - Generate new AI analysis
```

### User Router (`user.ts`)
```typescript
user.list               // Query - List users in org
user.invite             // Mutation - Invite new user
user.updateRole         // Mutation - Update user role
user.getDashboardLayout // Query - Get saved dashboard layout
user.saveDashboardLayout // Mutation - Save dashboard layout
user.resetDashboardLayout // Mutation - Reset to default layout
```

## Procedure Types

```typescript
import { router, publicProcedure, protectedProcedure, editorProcedure, riskManagerProcedure, adminProcedure } from '@/lib/trpc'

// publicProcedure - No auth required
// protectedProcedure - Requires authenticated user, provides ctx.user
// editorProcedure - Requires EDITOR role or higher
// riskManagerProcedure - Requires RISK_MANAGER role or higher
// adminProcedure - Requires ADMIN role or higher
```

## Context Shape

```typescript
ctx.user = {
  id: string
  email: string
  name: string | null
  role: Role
  orgId: string
}
```

## Common Query Patterns

### Org-scoped query
```typescript
const risks = await db.risk.findMany({
  where: {
    register: { orgId: ctx.user.orgId }
  }
})
```

### With includes
```typescript
const risk = await db.risk.findFirst({
  where: { id: input.id, register: { orgId: ctx.user.orgId } },
  include: {
    register: { select: { name: true } },
    owner: { select: { id: true, name: true, email: true } },
  }
})
```

## Rate Limiting

```typescript
import { checkRateLimit, createRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit'

// In mutation:
await checkRateLimit(createRateLimitKey('ai-analysis', ctx.user.orgId), RATE_LIMITS.AI_ANALYSIS)
```
