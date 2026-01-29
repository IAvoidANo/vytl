'use client'

import { trpc } from '@/lib/trpc-client'
import { PieChart } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  STRATEGIC: '#a855f7',
  OPERATIONAL: '#3b82f6',
  FINANCIAL: '#22c55e',
  COMPLIANCE: '#f59e0b',
  TECHNOLOGY: '#06b6d4',
  REPUTATIONAL: '#ec4899',
  ENVIRONMENTAL: '#10b981',
  PEOPLE: '#f97316',
}

export function CategoryChartCompact() {
  const { data: stats, isLoading } = trpc.risk.stats.useQuery()

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
        <div className="p-2 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">By Category</h3>
        </div>
        <div className="p-3 flex-1 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const categoryData = stats?.byCategory || {}
  const total = Object.values(categoryData).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
        <div className="p-2 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">By Category</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <PieChart className="w-6 h-6 text-slate-600 mx-auto mb-1" />
            <p className="text-slate-400 text-xs">No data</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort categories by count and take top 6
  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  // Calculate SVG donut chart segments
  const radius = 35
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  const segments = sortedCategories.map(([category, count]) => {
    const percent = count / total
    const strokeDasharray = `${percent * circumference} ${circumference}`
    const strokeDashoffset = -cumulativePercent * circumference
    cumulativePercent += percent

    return {
      category,
      count,
      strokeDasharray,
      strokeDashoffset,
      color: CATEGORY_COLORS[category] || '#64748b',
    }
  })

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
      <div className="p-2 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">By Category</h3>
      </div>
      <div className="p-2 flex-1 flex items-center">
        <div className="flex items-center gap-3 w-full">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 90 90" className="transform -rotate-90">
              <circle cx="45" cy="45" r={radius} fill="none" stroke="#334155" strokeWidth="10" />
              {segments.map((segment) => (
                <circle
                  key={segment.category}
                  cx="45"
                  cy="45"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="10"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{total}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1 overflow-auto max-h-[100px]">
            {sortedCategories.map(([category, count]) => (
              <div key={category} className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[category] || '#64748b' }} />
                <span className="text-slate-400 truncate flex-1">{category.charAt(0) + category.slice(1).toLowerCase()}</span>
                <span className="text-slate-500 flex-shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
