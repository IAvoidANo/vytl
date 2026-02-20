'use client'

import { useSession } from 'next-auth/react'
import { AlertTriangle, Activity, CheckSquare, BarChart2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { HeroMetric } from '@/components/dashboard/hero-metric'
import { StatCard } from '@/components/dashboard/stat-card'
import { TopRisksPanel } from '@/components/dashboard/top-risks-panel'
import { DashboardHeatmap } from '@/components/dashboard/dashboard-heatmap'

interface DashboardClientProps {
  userName: string | null | undefined
  orgName: string
  initialRiskCount: number
}

export function DashboardClient({ userName, orgName, initialRiskCount }: DashboardClientProps) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string })?.role
  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN'
  const firstName = userName?.split(' ')[0] || 'there'

  const { data: riskStats, isLoading: riskLoading } = trpc.risk.stats.useQuery(undefined, {
    initialData: {
      total: initialRiskCount,
      byStatus: { OPEN: 0, IN_PROGRESS: 0, MONITORING: 0, CLOSED: 0 },
      byCategory: {},
      highRisks: 0,
    },
  })
  const { data: breachData, isLoading: breachLoading } = trpc.appetite.breachSummary.useQuery()
  const { data: kriStats,   isLoading: kriLoading     } = trpc.kri.stats.useQuery()
  const { data: treatmentStats, isLoading: treatmentLoading } = trpc.treatment.orgStats.useQuery()

  // Silence unused warning — isAdmin used for future role-based visibility
  void isAdmin

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Page header — compact single line */}
      <div className="flex items-baseline justify-between flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-900">
          Good morning, {firstName}
        </h1>
        <p className="text-xs text-slate-400 hidden sm:block">{orgName}</p>
      </div>

      {/* Hero: Vytl Score */}
      <div className="flex-shrink-0">
        <HeroMetric />
      </div>

      {/* Stat Cards — 4 in a row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        <StatCard
          title="Total Risks"
          value={riskStats?.total ?? 0}
          sublabel="Across all registers"
          href="/risks"
          icon={<BarChart2 className="w-4 h-4" />}
          loading={riskLoading}
        />
        <StatCard
          title="Above Appetite"
          value={breachData?.total ?? 0}
          sublabel="Exceeding thresholds"
          href="/risks"
          variant={breachData?.total ? 'warning' : 'default'}
          icon={<AlertTriangle className="w-4 h-4" />}
          loading={breachLoading}
        />
        <StatCard
          title="KRIs in Red"
          value={kriStats?.red ?? 0}
          sublabel="Breached indicators"
          href="/kris"
          variant={kriStats?.red ? 'danger' : 'default'}
          icon={<Activity className="w-4 h-4" />}
          loading={kriLoading}
        />
        <StatCard
          title="Open Actions"
          value={treatmentStats?.openCount ?? 0}
          sublabel={treatmentStats?.overdue ? `${treatmentStats.overdue} overdue` : 'Treatment tasks'}
          href="/risks"
          variant={treatmentStats?.overdue ? 'warning' : 'default'}
          icon={<CheckSquare className="w-4 h-4" />}
          loading={treatmentLoading}
        />
      </div>

      {/* Bottom row: Heatmap (left) + Top Risks (right) — 50/50, fills remaining height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="min-h-0">
          <DashboardHeatmap />
        </div>
        <div className="min-h-0">
          <TopRisksPanel />
        </div>
      </div>

    </div>
  )
}
