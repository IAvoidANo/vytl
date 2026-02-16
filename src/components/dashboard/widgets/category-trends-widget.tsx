'use client'

import { trpc } from '@/lib/trpc-client'
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useVisibleRows } from '../widget-wrapper'

const DIRECTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  improving: { icon: ArrowDownRight, color: 'text-green-400', label: 'Improving' },
  stable: { icon: Minus, color: 'text-slate-400', label: 'Stable' },
  worsening: { icon: ArrowUpRight, color: 'text-red-400', label: 'Worsening' },
}

const CATEGORY_SHORT: Record<string, string> = {
  STRATEGIC: 'Strategic',
  OPERATIONAL: 'Operational',
  FINANCIAL: 'Financial',
  COMPLIANCE: 'Compliance',
  TECHNOLOGY: 'Technology',
  REPUTATIONAL: 'Reputational',
  ENVIRONMENTAL: 'Environmental',
  PEOPLE: 'People',
}

export function CategoryTrendsWidget() {
  const visibleRows = useVisibleRows(40, 4)
  const { data: trends, isLoading } = trpc.scoring.getCategoryTrends.useQuery()

  const displayItems = trends?.slice(0, Math.max(visibleRows, 6)) || []

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Category Trends</h3>
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!trends || trends.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Category Trends</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <TrendingUp className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No trend data</p>
            <p className="text-slate-500 text-[10px] mt-1">Calculate scores to see category trends</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Category Trends</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-auto divide-y divide-slate-700/50">
        {displayItems.map((trend) => {
          const dir = DIRECTION_CONFIG[trend.direction] || DIRECTION_CONFIG.stable
          const DirIcon = dir.icon
          return (
            <div key={trend.category} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-slate-300 truncate">
                  {CATEGORY_SHORT[trend.category] || trend.category}
                </span>
                <span className="text-[10px] text-slate-500">{trend.riskCount} risks</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-white tabular-nums">
                  {Math.round(trend.averageScore)}
                </span>
                <DirIcon className={`w-3.5 h-3.5 ${dir.color}`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
