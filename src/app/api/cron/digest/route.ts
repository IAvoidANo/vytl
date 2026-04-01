import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { weeklyDigestEmail } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://vytlrx.app'

/**
 * Vercel Cron endpoint for weekly digest emails.
 * Schedule: every Monday at 7:00 AM UTC (vercel.json).
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[digest-cron] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Fetch all orgs with their ADMIN+ users and risk stats
    const organisations = await db.organisation.findMany({
      where: { riskRegisters: { some: { risks: { some: { status: { not: 'ARCHIVED' } } } } } },
      include: {
        users: {
          where: {
            status: 'ACTIVE',
            role: { in: ['OWNER', 'ADMIN', 'RISK_MANAGER'] },
          },
          select: { id: true, name: true, email: true, role: true },
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { vytlScore: true, vytlGrade: true },
        },
      },
    })

    const results: unknown[] = []
    const errors: unknown[] = []

    for (const org of organisations) {
      try {
        // Get risk stats for this org
        const risks = await db.risk.findMany({
          where: { register: { orgId: org.id }, status: { not: 'ARCHIVED' } },
          select: { residualScore: true },
        })

        const appConfig = org as unknown as { appetiteHigh?: number | null; appetiteLow?: number | null }
        const highThreshold = appConfig.appetiteHigh ?? 9
        const extremeThreshold = highThreshold + 5

        const totalRisks = risks.length
        const highRisks = risks.filter(r => r.residualScore > highThreshold && r.residualScore <= extremeThreshold).length
        const extremeRisks = risks.filter(r => r.residualScore > extremeThreshold).length

        const openIncidents = await db.incident.count({
          where: {
            risk: { register: { orgId: org.id } },
            status: { in: ['OPEN', 'INVESTIGATING', 'CONTAINED'] },
          },
        })

        const latestAssessment = org.assessments[0]
        const vytlScore = latestAssessment?.vytlScore != null
          ? Number(latestAssessment.vytlScore)
          : null
        const vytlGrade = latestAssessment?.vytlGrade ?? null

        // Send to all ADMIN+ users in the org
        for (const user of org.users) {
          if (!user.email) continue

          await sendEmail({
            to: user.email,
            subject: `[VytlRx] Weekly Risk Digest — ${org.name}`,
            html: weeklyDigestEmail({
              orgName: org.name,
              recipientName: user.name ?? 'Risk Manager',
              totalRisks,
              highRisks,
              extremeRisks,
              openIncidents,
              vytlScore,
              vytlGrade,
              appUrl: APP_URL,
            }),
          })
        }

        results.push({ organisationId: org.id, organisationName: org.name, recipientCount: org.users.length })
      } catch (error) {
        console.error(`[digest-cron] Failed for org ${org.id}:`, error)
        errors.push({
          organisationId: org.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processed: organisations.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    })
  } catch (error) {
    console.error('[digest-cron] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
