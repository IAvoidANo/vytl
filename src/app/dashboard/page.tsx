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

  const riskCount = await db.risk.count({
    where: {
      register: {
        orgId: user?.orgId,
      },
    },
  })

  // New organisations with no risks go through the onboarding wizard
  if (riskCount === 0) {
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
