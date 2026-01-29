'use client'

import Link from 'next/link'
import { VytlScoreCard } from '@/components/vytl-score-card'
import { trpc } from '@/lib/trpc-client'
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

interface DashboardClientProps {
  userName: string | null | undefined
  orgName: string
  initialRiskCount: number
}

export function DashboardClient({ userName, orgName, initialRiskCount }: DashboardClientProps) {
  // Get live risk stats
  const { data: riskStats } = trpc.risk.stats.useQuery(undefined, {
    initialData: {
      total: initialRiskCount,
      byStatus: { OPEN: 0, IN_PROGRESS: 0, MONITORING: 0, CLOSED: 0 },
      byCategory: {},
      highRisks: 0,
    },
  })

  const stats = riskStats || { total: initialRiskCount, byStatus: {}, highRisks: 0 }

  return (
    <div className="text-white">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome back, {userName?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-slate-400">Organisation: {orgName}</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Vytl Score Card - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <VytlScoreCard />
        </div>

        {/* Quick Stats Column */}
        <div className="space-y-4">
          {/* Total Risks */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Risks</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
            </div>
          </div>

          {/* High Risks */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">High Risk Items</p>
                <p className="text-2xl font-bold text-red-400">{stats.highRisks || 0}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-3">By Status</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Open
                </span>
                <span className="text-white">{stats.byStatus?.OPEN || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  In Progress
                </span>
                <span className="text-white">{stats.byStatus?.IN_PROGRESS || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Monitoring
                </span>
                <span className="text-white">{stats.byStatus?.MONITORING || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Closed
                </span>
                <span className="text-white">{stats.byStatus?.CLOSED || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/risks"
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors flex items-center gap-2"
          >
            + Add Risk
          </Link>
          <Link
            href="/risks"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            View Register
          </Link>
          <Link
            href="/kris"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            KRI Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
