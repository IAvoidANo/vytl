import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { captureSnapshot } from '@/lib/snapshot-utils'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron endpoint for automated snapshot capture.
 * Schedule: every Sunday at 2:00 AM UTC (vercel.json).
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[snapshot-cron] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const isFirstOfMonth = now.getDate() === 1
    // Quarterly = first day of Jan, Apr, Jul, Oct
    const isQuarterly = isFirstOfMonth && [1, 4, 7, 10].includes(now.getMonth() + 1)

    // Fetch all orgs that have at least one active risk
    const organisations = await db.organisation.findMany({
      where: { riskRegisters: { some: { risks: { some: { status: { not: 'ARCHIVED' } } } } } },
    })

    const results: unknown[] = []
    const errors: unknown[] = []

    for (const org of organisations) {
      try {
        const freq = (org as unknown as { snapshotFrequency?: string }).snapshotFrequency ?? 'WEEKLY'
        const shouldSnapshot = freq === 'WEEKLY' || (freq === 'MONTHLY' && isFirstOfMonth)

        if (!shouldSnapshot) continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshotType: any = isQuarterly ? 'QUARTERLY' : 'SCHEDULED'
        const result = await captureSnapshot(org.id, snapshotType)

        results.push({
          organisationId: org.id,
          organisationName: org.name,
          success: true,
          snapshotId: result.id,
          riskCount: result.riskCount,
          snapshotType,
        })
      } catch (error) {
        console.error(`[snapshot-cron] Failed for org ${org.id}:`, error)
        errors.push({
          organisationId: org.id,
          organisationName: org.name,
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
    console.error('[snapshot-cron] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
