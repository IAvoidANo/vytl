import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppLayout } from '@/components/app-layout'
import { UsersClient } from './users-client'

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Only ADMIN+ can access user management
  const role = (session.user as { role?: string }).role || 'VIEWER'
  if (!['OWNER', 'ADMIN'].includes(role)) {
    redirect('/dashboard')
  }

  return (
    <AppLayout>
      <UsersClient currentUserRole={role} />
    </AppLayout>
  )
}
