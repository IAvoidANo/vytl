'use client'

import { AlertTriangle, TrendingUp } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { DashboardGrid, GridItem } from '@/components/dashboard/dashboard-grid'
import {
  VytlScoreWidget,
  RiskPulseWidget,
  StatWidget,
  StatusBreakdownWidget,
  TopRisksWidget,
  CategoryChartWidget,
  ActivityFeedWidget,
  ScoringRecommendationsWidget,
  CategoryTrendsWidget,
  ComplianceCoverageWidget,
} from '@/components/dashboard'

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

  const stats = riskStats || {
    total: initialRiskCount,
    byStatus: {} as Record<string, number>,
    byCategory: {},
    highRisks: 0
  }

  return (
    <div className="text-white h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {userName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">{orgName}</p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DashboardGrid>
        {/* Row 1: Vytl Score & Risk Pulse */}
        <GridItem id="vytl-score" className="lg:col-span-2">
          <VytlScoreWidget />
        </GridItem>
        <GridItem id="risk-pulse" className="lg:col-span-2">
          <RiskPulseWidget />
        </GridItem>

        {/* Row 2: Stats Cards */}
        <GridItem id="total-risks" className="lg:col-span-1">
          <StatWidget
            title="Total Risks"
            value={stats.total}
            icon={<TrendingUp className="w-5 h-5 text-teal-400" />}
            iconBg="bg-slate-700"
          />
        </GridItem>
        <GridItem id="high-risk" className="lg:col-span-1">
          <StatWidget
            title="High Risk Items"
            value={stats.highRisks || 0}
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            iconBg="bg-red-500/20"
            valueColor="text-red-400"
          />
        </GridItem>
        <GridItem id="status-breakdown" className="lg:col-span-2">
          <StatusBreakdownWidget byStatus={stats.byStatus} total={stats.total} />
        </GridItem>

        {/* Row 3: Charts & Lists */}
        <GridItem id="top-risks" title="Top Risks" className="lg:col-span-2">
          <TopRisksWidget />
        </GridItem>
        <GridItem id="category-chart" title="Risks by Category" className="lg:col-span-1">
          <CategoryChartWidget />
        </GridItem>
        <GridItem id="recent-activity" title="Recent Activity" className="lg:col-span-1">
          <ActivityFeedWidget />
        </GridItem>

        {/* Row 4: Scoring Widgets */}
        <GridItem id="scoring-recommendations" className="lg:col-span-2">
          <ScoringRecommendationsWidget />
        </GridItem>
        <GridItem id="category-trends" className="lg:col-span-2">
          <CategoryTrendsWidget />
        </GridItem>

        {/* Row 5: Compliance */}
        <GridItem id="compliance-coverage" className="lg:col-span-2">
          <ComplianceCoverageWidget />
        </GridItem>
      </DashboardGrid>

    </div>
  )
}
