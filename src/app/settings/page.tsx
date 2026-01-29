import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AppLayout } from '@/components/app-layout'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organisation: true },
  })

  return (
    <AppLayout userName={user?.name} userRole={user?.role}>
      <div className="text-white">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Settings</h2>
          <p className="text-slate-400">Manage your account and organisation</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Organisation</h3>
          <div className="space-y-2 text-slate-300">
            <p><span className="text-slate-500">Name:</span> {user?.organisation.name}</p>
            <p><span className="text-slate-500">Industry:</span> {user?.organisation.industry || 'Not set'}</p>
            <p><span className="text-slate-500">Employees:</span> {user?.organisation.employeeCount || 'Not set'}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
