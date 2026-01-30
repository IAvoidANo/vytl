'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { VytlScoreCard } from '@/components/vytl-score-card'
import { RiskPulse, TopRisks, ActivityFeed, CategoryChart } from '@/components/dashboard'
import { DashboardGrid, DashboardWidget, LayoutItem } from '@/components/dashboard-grid'
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

  const stats = useMemo(
    () => riskStats || { total: initialRiskCount, byStatus: {} as Record<string, number>, highRisks: 0 },
    [riskStats, initialRiskCount]
  )

  // Define default layout
  const defaultLayout: LayoutItem[] = useMemo(
    () => [
      { i: 'vytl-score', x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
      { i: 'risk-pulse', x: 6, y: 0, w: 2, h: 1, minW: 2, minH: 1 },
      { i: 'total-risks', x: 6, y: 1, w: 2, h: 1, minW: 2, minH: 1 },
      { i: 'high-risks', x: 6, y: 2, w: 2, h: 1, minW: 2, minH: 1 },
      { i: 'status-breakdown', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'top-risks', x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'category-chart', x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'activity-feed', x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'quick-actions', x: 0, y: 6, w: 12, h: 1, minW: 6, minH: 1 },
    ],
    []
  )

  // Define widgets
  const widgets = useMemo(
    () => [
      {
        id: 'vytl-score',
        title: 'Vytl Score',
        component: (
          <DashboardWidget>
            <VytlScoreCard />
          </DashboardWidget>
        ),
        minW: 4,
        minH: 2,
      },
      {
        id: 'risk-pulse',
        title: 'Risk Pulse',
        component: (
          <DashboardWidget>
            <RiskPulse />
          </DashboardWidget>
        ),
        minW: 2,
        minH: 1,
      },
      {
        id: 'total-risks',
        title: 'Total Risks',
        component: (
          <DashboardWidget>
            <div className="h-full flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Total Risks</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-2 bg-slate-700 rounded-lg">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
            </div>
          </DashboardWidget>
        ),
        minW: 2,
        minH: 1,
      },
      {
        id: 'high-risks',
        title: 'High Risks',
        component: (
          <DashboardWidget>
            <div className="h-full flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">High Risk Items</p>
                <p className="text-2xl font-bold text-red-400">{stats.highRisks || 0}</p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </DashboardWidget>
        ),
        minW: 2,
        minH: 1,
      },
      {
        id: 'status-breakdown',
        title: 'Status Breakdown',
        component: (
          <DashboardWidget>
            <div className="h-full flex flex-col">
              <p className="text-slate-400 text-xs mb-2">Status Breakdown</p>
              <div className="space-y-1.5 flex-1">
                <StatusRow label="Open" color="red" count={stats.byStatus?.OPEN || 0} />
                <StatusRow label="In Progress" color="yellow" count={stats.byStatus?.IN_PROGRESS || 0} />
                <StatusRow label="Monitoring" color="blue" count={stats.byStatus?.MONITORING || 0} />
                <StatusRow label="Closed" color="green" count={stats.byStatus?.CLOSED || 0} />
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
          </DashboardWidget>
        ),
        minW: 3,
        minH: 2,
      },
      {
        id: 'top-risks',
        title: 'Top Risks',
        component: (
          <DashboardWidget>
            <TopRisks />
          </DashboardWidget>
        ),
        minW: 3,
        minH: 2,
      },
      {
        id: 'category-chart',
        title: 'Categories',
        component: (
          <DashboardWidget>
            <CategoryChart />
          </DashboardWidget>
        ),
        minW: 3,
        minH: 2,
      },
      {
        id: 'activity-feed',
        title: 'Activity',
        component: (
          <DashboardWidget>
            <ActivityFeed />
          </DashboardWidget>
        ),
        minW: 3,
        minH: 2,
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        component: (
          <DashboardWidget>
            <div className="h-full flex items-center">
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/risks"
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors text-sm font-medium text-white"
                >
                  + Add Risk
                </Link>
                <Link
                  href="/risks"
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-xs text-white"
                >
                  View Register
                </Link>
                <Link
                  href="/kris"
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-xs text-white"
                >
                  KRI Dashboard
                </Link>
                <Link
                  href="/risks?view=heatmap"
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-xs text-white"
                >
                  Risk Heatmap
                </Link>
              </div>
            </div>
          </DashboardWidget>
        ),
        minW: 6,
        minH: 1,
      },
    ],
    [stats]
  )

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Welcome back, {userName?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-slate-400 text-sm">{orgName}</p>
        </div>
      </div>

      {/* Bento Grid Dashboard */}
      <DashboardGrid widgets={widgets} defaultLayout={defaultLayout} />
    </div>
  )
}

// Helper component for status rows
function StatusRow({ label, color, count }: { label: string; color: string; count: number }) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-400',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5">
        <span className={`w-2 h-2 ${colorClasses[color]} rounded-full`}></span>
        <span className="text-xs text-slate-300">{label}</span>
      </span>
      <span className="text-white font-medium text-sm">{count}</span>
    </div>
  )
}
