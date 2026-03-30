/**
 * In-app notification creation helpers.
 * These complement the email notification triggers — fire both or either independently.
 * All calls are fire-and-forget (.catch(() => {})) in routers.
 */

import { db } from './db'

type NotificationType =
  | 'APPETITE_BREACH'
  | 'KRI_RED'
  | 'KRI_AMBER'
  | 'RISK_ASSIGNED'
  | 'INCIDENT_CREATED'
  | 'ACTION_OVERDUE'
  | 'ASSESSMENT_COMPLETE'
  | 'SYSTEM'

interface CreateNotificationInput {
  orgId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: string
}

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({ data: input })
}

/** Notify all ADMIN+ users in an org */
export async function notifyAdmins(
  orgId: string,
  type: NotificationType,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
) {
  const admins = await db.user.findMany({
    where: {
      orgId,
      role: { in: ['OWNER', 'ADMIN'] },
      status: 'ACTIVE',
    },
    select: { id: true },
  })

  await db.notification.createMany({
    data: admins.map((u) => ({
      orgId,
      userId: u.id,
      type,
      title,
      message,
      entityType,
      entityId,
    })),
    skipDuplicates: true,
  })
}

/** Notify a specific user */
export async function notifyUser(
  orgId: string,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
) {
  return db.notification.create({
    data: { orgId, userId, type, title, message, entityType, entityId },
  })
}
