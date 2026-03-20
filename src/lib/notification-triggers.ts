/**
 * notification-triggers.ts — Fire-and-forget email notifications.
 *
 * Each function checks conditions and sends email if warranted.
 * All errors are swallowed — notifications must never crash mutations.
 * Call these from tRPC mutations with .catch(() => {}).
 */

import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import {
  appetiteBreachEmail,
  kriRedAlertEmail,
  riskAssignedEmail,
  incidentCreatedEmail,
} from '@/lib/email-templates'

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://app.vytl.io'

// Default appetite thresholds (matches appetite-validation.ts defaults)
const DEFAULT_HIGH_THRESHOLD = 9
const DEFAULT_EXTREME_THRESHOLD = 14

// ─── Appetite Breach ──────────────────────────────────────────────────────────

/**
 * Send an alert when a risk's residual score exceeds the HIGH or EXTREME band.
 * Pass `previousScore` to avoid resending when score hasn't changed bands.
 */
export async function maybeNotifyAppetiteBreach(
  orgId: string,
  riskId: string,
  previousScore?: number,
): Promise<void> {
  try {
    const [risk, org] = await Promise.all([
      db.risk.findUnique({
        where: { id: riskId },
        select: {
          title: true,
          refCode: true,
          residualScore: true,
          owner: { select: { email: true, name: true } },
        },
      }),
      db.organisation.findUnique({
        where: { id: orgId },
        select: { name: true, appetiteHigh: true },
      }),
    ])

    if (!risk || !org || !risk.owner?.email) return

    const highThreshold = org.appetiteHigh ?? DEFAULT_HIGH_THRESHOLD
    const extremeThreshold = highThreshold + (DEFAULT_EXTREME_THRESHOLD - DEFAULT_HIGH_THRESHOLD)
    const score = risk.residualScore

    // Determine band
    let band: 'HIGH' | 'EXTREME' | null = null
    if (score > extremeThreshold) band = 'EXTREME'
    else if (score > highThreshold) band = 'HIGH'

    if (!band) return

    // Skip if already in same band (score hasn't changed bands)
    if (previousScore !== undefined) {
      const prevBand = previousScore > extremeThreshold ? 'EXTREME' : previousScore > highThreshold ? 'HIGH' : null
      if (prevBand === band) return
    }

    await sendEmail({
      to: risk.owner.email,
      subject: `[Vytl] Risk Appetite Breach — ${risk.refCode}`,
      html: appetiteBreachEmail({
        orgName: org.name,
        recipientName: risk.owner.name ?? 'Risk Owner',
        riskTitle: risk.title,
        refCode: risk.refCode,
        residualScore: score,
        band,
        appUrl: APP_URL,
      }),
    })
  } catch {
    // Swallow — notifications must not crash mutations
  }
}

// ─── Risk Assigned ────────────────────────────────────────────────────────────

/**
 * Notify the new risk owner when ownership changes.
 */
export async function maybeNotifyRiskAssigned(
  orgId: string,
  riskId: string,
  assignerId: string,
): Promise<void> {
  try {
    const [risk, assigner] = await Promise.all([
      db.risk.findUnique({
        where: { id: riskId },
        select: {
          title: true,
          refCode: true,
          owner: { select: { email: true, name: true } },
          register: { select: { orgId: true } },
        },
      }),
      db.user.findUnique({
        where: { id: assignerId },
        select: { name: true },
      }),
    ])

    if (!risk || !risk.owner?.email || risk.register?.orgId !== orgId) return

    const org = await db.organisation.findUnique({ where: { id: orgId }, select: { name: true } })
    if (!org) return

    await sendEmail({
      to: risk.owner.email,
      subject: `[Vytl] Risk Assigned — ${risk.refCode}`,
      html: riskAssignedEmail({
        orgName: org.name,
        recipientName: risk.owner.name ?? 'Risk Owner',
        riskTitle: risk.title,
        refCode: risk.refCode,
        assignerName: assigner?.name ?? 'A colleague',
        appUrl: APP_URL,
      }),
    })
  } catch {
    // Swallow
  }
}

// ─── KRI Red Alert ────────────────────────────────────────────────────────────

/**
 * Notify the risk owner when a KRI transitions to RED.
 * Pass `previousStatus` to only send on the RED transition (not on every update).
 */
export async function maybeNotifyKriRed(
  orgId: string,
  kriId: string,
  previousStatus?: string,
): Promise<void> {
  try {
    if (previousStatus === 'RED') return  // already was RED

    const kri = await db.kri.findUnique({
      where: { id: kriId },
      select: {
        name: true,
        status: true,
        orgId: true,
        owner: { select: { email: true, name: true } },
      },
    })

    if (!kri || kri.status !== 'RED' || kri.orgId !== orgId) return
    if (!kri.owner?.email) return

    const org = await db.organisation.findUnique({ where: { id: orgId }, select: { name: true } })
    if (!org) return

    await sendEmail({
      to: kri.owner.email,
      subject: `[Vytl] KRI Alert: Red Status — ${kri.name}`,
      html: kriRedAlertEmail({
        orgName: org.name,
        recipientName: kri.owner.name ?? 'KRI Owner',
        kriName: kri.name,
        riskTitle: '',
        refCode: '',
        appUrl: APP_URL,
      }),
    })
  } catch {
    // Swallow
  }
}

// ─── Incident Created ─────────────────────────────────────────────────────────

/**
 * Notify the risk owner when a new incident is linked to their risk.
 */
export async function maybeNotifyIncidentCreated(
  orgId: string,
  incidentId: string,
): Promise<void> {
  try {
    const incident = await db.incident.findUnique({
      where: { id: incidentId },
      select: {
        title: true,
        severity: true,
        risk: {
          select: {
            title: true,
            refCode: true,
            register: { select: { orgId: true } },
            owner: { select: { email: true, name: true } },
          },
        },
      },
    })

    if (!incident || !incident.risk?.register || incident.risk.register.orgId !== orgId) return
    if (!incident.risk.owner?.email) return

    const org = await db.organisation.findUnique({ where: { id: orgId }, select: { name: true } })
    if (!org) return

    await sendEmail({
      to: incident.risk.owner.email,
      subject: `[Vytl] New Incident — ${incident.risk.refCode}`,
      html: incidentCreatedEmail({
        orgName: org.name,
        recipientName: incident.risk.owner.name ?? 'Risk Owner',
        incidentTitle: incident.title,
        severity: incident.severity,
        riskTitle: incident.risk.title,
        refCode: incident.risk.refCode,
        appUrl: APP_URL,
      }),
    })
  } catch {
    // Swallow
  }
}
