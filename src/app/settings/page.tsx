import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userRole = (session.user as { role?: string }).role || 'VIEWER'
  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <AppLayout>
      <SettingsClient isAdmin={isAdmin} />
    </AppLayout>
  )
}
