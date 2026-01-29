import { db } from './db'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'
type EntityType = 'RISK' | 'KRI' | 'REGISTER'

interface AuditLogParams {
  action: AuditAction
  entityType: EntityType
  entityId: string
  userId: string
  orgId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditLogParams) {
  return db.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      orgId: params.orgId,
      oldValues: params.oldValues ?? undefined,
      newValues: params.newValues ?? undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

export function pickAuditFields<T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    result[key as string] = obj[key]
  }
  return result
}

export function hasChanges(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): boolean {
  const keys = Object.keys(newValues)
  return keys.some((key) => {
    const oldVal = oldValues[key]
    const newVal = newValues[key]
    if (oldVal instanceof Date && newVal instanceof Date) {
      return oldVal.getTime() !== newVal.getTime()
    }
    return oldVal !== newVal
  })
}
