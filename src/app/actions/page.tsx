import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AppLayout } from '@/components/app-layout'
import { ActionsClient } from './actions-client'

export default async function ActionsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  })

  return (
    <AppLayout userName={user?.name} userRole={user?.role}>
      <ActionsClient />
    </AppLayout>
  )
}
