'use client'

import Link from 'next/link'
import { VytlScoreCard } from '@/components/vytl-score-card'
import { RiskPulse, TopRisks, ActivityFeed, CategoryChart } from '@/components/dashboard'
import { trpc } from '@/lib/trpc-client'
import { AlertTriangle, TrendingUp } from 'lucide-react'

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
      {/* Header - Compact */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold">
          Welcome back, {userName?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-slate-400 text-sm">{orgName}</p>
      </div>

      {/* Row 1: Vytl Score + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-3">
        {/* Vytl Score Card - Takes 2 columns */}
        <div className="lg:col-span-2">
          <VytlScoreCard />
        </div>

        {/* Quick Stats Column */}
        <div className="space-y-3">
          {/* Risk Pulse */}
          <RiskPulse />

          {/* Total Risks */}
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Total Risks</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-2 bg-slate-700 rounded-lg">
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
            </div>
          </div>

          {/* High Risks */}
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">High Risk Items</p>
                <p className="text-xl font-bold text-red-400">{stats.highRisks || 0}</p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-slate-400 text-xs mb-2">Status Breakdown</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span className="text-xs">Open</span>
              </span>
              <span className="text-white font-medium text-sm">{stats.byStatus?.OPEN || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span className="text-xs">In Progress</span>
              </span>
              <span className="text-white font-medium text-sm">{stats.byStatus?.IN_PROGRESS || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span className="text-xs">Monitoring</span>
              </span>
              <span className="text-white font-medium text-sm">{stats.byStatus?.MONITORING || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-xs">Closed</span>
              </span>
              <span className="text-white font-medium text-sm">{stats.byStatus?.CLOSED || 0}</span>
            </div>
          </div>

          {/* Mini progress bars */}
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-700">
              {stats.total > 0 && (
                <>
                  <div
                    className="bg-red-400 transition-all"
                    style={{ width: `${((stats.byStatus?.OPEN || 0) / stats.total) * 100}%` }}
                  />
                  <div
                    className="bg-yellow-400 transition-all"
                    style={{ width: `${((stats.byStatus?.IN_PROGRESS || 0) / stats.total) * 100}%` }}
                  />
                  <div
                    className="bg-blue-400 transition-all"
                    style={{ width: `${((stats.byStatus?.MONITORING || 0) / stats.total) * 100}%` }}
                  />
                  <div
                    className="bg-green-400 transition-all"
                    style={{ width: `${((stats.byStatus?.CLOSED || 0) / stats.total) * 100}%` }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Top Risks + Category Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Top Risks */}
        <TopRisks />

        {/* Category Chart */}
        <CategoryChart />

        {/* Activity Feed */}
        <ActivityFeed />
      </div>

      {/* Row 3: Quick Actions */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <h3 className="text-xs font-semibold mb-2 text-slate-400">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/risks"
            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors text-sm font-medium"
          >
            + Add Risk
          </Link>
          <Link
            href="/risks"
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-xs"
          >
            View Register
          </Link>
          <Link
            href="/kris"
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-xs"
          >
            KRI Dashboard
          </Link>
          <Link
            href="/risks?view=heatmap"
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-xs"
          >
            Risk Heatmap
          </Link>
        </div>
      </div>
    </div>
  )
}
