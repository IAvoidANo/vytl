import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { AccountClient } from './account-client'

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return (
    <AppLayout>
      <AccountClient user={session.user as { name?: string | null; email?: string | null; role?: string }} />
    </AppLayout>
  )
}
