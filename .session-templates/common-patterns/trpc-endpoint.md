# tRPC Endpoint Pattern

## Basic Query

```typescript
// src/server/routers/example.ts
import { z } from 'zod'
import { router, protectedProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'

export const exampleRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return db.example.findMany({
        where: {
          orgId: ctx.user.orgId,  // Always scope to org
          ...(input?.status && { status: input.status }),
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await db.example.findFirst({
        where: {
          id: input.id,
          orgId: ctx.user.orgId,  // Security: always check org ownership
        },
      })
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' })
      }
      return item
    }),
})
```

## Mutation with Audit Logging

```typescript
import { createAuditLog, pickAuditFields, hasChanges } from '@/lib/audit'

create: editorProcedure
  .input(createSchema)
  .mutation(async ({ ctx, input }) => {
    const item = await db.example.create({
      data: {
        ...input,
        orgId: ctx.user.orgId,
        createdById: ctx.user.id,
      },
    })

    // Audit log
    await createAuditLog({
      action: 'EXAMPLE_CREATED',
      entityType: 'Example',
      entityId: item.id,
      newValues: pickAuditFields(item, ['title', 'status']),
      userId: ctx.user.id,
      orgId: ctx.user.orgId,
    })

    return item
  }),

update: editorProcedure
  .input(updateSchema)
  .mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    const existing = await db.example.findFirst({
      where: { id, orgId: ctx.user.orgId },
    })
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    const updated = await db.example.update({
      where: { id },
      data,
    })

    // Only log if values changed
    const auditFields = ['title', 'status', 'description']
    if (hasChanges(existing, updated, auditFields)) {
      await createAuditLog({
        action: 'EXAMPLE_UPDATED',
        entityType: 'Example',
        entityId: id,
        oldValues: pickAuditFields(existing, auditFields),
        newValues: pickAuditFields(updated, auditFields),
        userId: ctx.user.id,
        orgId: ctx.user.orgId,
      })
    }

    return updated
  }),
```

## Register in Root Router

```typescript
// src/server/routers/index.ts
import { exampleRouter } from './example'

export const appRouter = router({
  example: exampleRouter,
  // ... other routers
})
```
