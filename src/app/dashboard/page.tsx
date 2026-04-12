import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AppLayout } from '@/components/app-layout'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organisation: true },
  })

  const [riskCount, organisation] = await Promise.all([
    db.risk.count({
      where: {
        register: {
          orgId: user?.orgId,
        },
      },
    }),
    db.organisation.findUnique({
      where: { id: user?.orgId },
      select: { appliedTemplate: true },
    }),
  ])

  // Only redirect to onboarding if the org has genuinely never completed setup.
  // An org with risks OR an applied template has completed onboarding.
  const hasCompletedOnboarding =
    riskCount > 0 || organisation?.appliedTemplate != null

  if (!hasCompletedOnboarding) {
    redirect('/onboarding')
  }

  return (
    <AppLayout userName={user?.name} userRole={user?.role}>
      <DashboardClient
        userName={user?.name}
        orgName={user?.organisation.name || 'Organisation'}
        initialRiskCount={riskCount}
      />
    </AppLayout>
  )
}
