import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import OnboardingClient from './onboarding-client'

export const metadata = {
  title: 'Get Started - VytlRx',
  description: 'Set up your risk management dashboard in 5 minutes',
}

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Resolve the user + org from DB (same pattern as all other server pages)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { orgId: true },
  })

  if (!user) {
    redirect('/login')
  }

  // If org already has risks they are already onboarded → dashboard
  const riskCount = await db.risk.count({
    where: { register: { orgId: user.orgId } },
  })

  if (riskCount > 0) {
    redirect('/dashboard')
  }

  const organisation = await db.organisation.findUnique({
    where: { id: user.orgId },
    select: { name: true },
  })

  return (
    <OnboardingClient
      organisationName={organisation?.name ?? 'Your Organisation'}
    />
  )
}
