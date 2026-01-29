import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AppLayout } from '@/components/app-layout'
import Link from 'next/link'

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

  return (
    <AppLayout userName={user?.name} userRole={user?.role}>
      <div className="text-white">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-slate-400">
            Organisation: {user?.organisation.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Total Risks</p>
            <p className="text-3xl font-bold text-white">{riskCount}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Vytl Score</p>
            <p className="text-3xl font-bold text-teal-400">--</p>
            <p className="text-xs text-slate-500 mt-1">Not yet calculated</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Risk Pulse</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400">Healthy</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex gap-4">
            <Link
              href="/risks"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
            >
              + Add Risk
            </Link>
            <Link
              href="/risks"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              View Register
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
