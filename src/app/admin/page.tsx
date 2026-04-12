import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { AdminClient } from './admin-client'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = (session.user as { role?: string }).role
  if (role !== 'ADMIN' && role !== 'OWNER') {
    redirect('/dashboard')
  }

  return (
    <AppLayout>
      <AdminClient user={session.user as { name?: string | null; email?: string | null; role?: string }} />
    </AppLayout>
  )
}
