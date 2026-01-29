'use client'

import { trpc } from '@/lib/trpc-client'
import { PieChart } from 'lucide-react'

interface CategoryChartProps {
  className?: string
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  STRATEGIC: { bg: 'bg-purple-500/20', text: 'text-purple-400', fill: '#a855f7' },
  OPERATIONAL: { bg: 'bg-blue-500/20', text: 'text-blue-400', fill: '#3b82f6' },
  FINANCIAL: { bg: 'bg-green-500/20', text: 'text-green-400', fill: '#22c55e' },
  COMPLIANCE: { bg: 'bg-amber-500/20', text: 'text-amber-400', fill: '#f59e0b' },
  TECHNOLOGY: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', fill: '#06b6d4' },
  REPUTATIONAL: { bg: 'bg-pink-500/20', text: 'text-pink-400', fill: '#ec4899' },
  ENVIRONMENTAL: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', fill: '#10b981' },
  PEOPLE: { bg: 'bg-orange-500/20', text: 'text-orange-400', fill: '#f97316' },
}

export function CategoryChart({ className = '' }: CategoryChartProps) {
  const { data: stats, isLoading } = trpc.risk.stats.useQuery()

  if (isLoading) {
    return (
      <div className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
        <div className="px-3 py-2 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
        </div>
        <div className="p-3">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-3"></div>
            <div className="space-y-1.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-3 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const categoryData = stats?.byCategory || {}
  const total = Object.values(categoryData).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return (
      <div className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
        <div className="px-3 py-2 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
        </div>
        <div className="p-6 text-center">
          <PieChart className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-xs">No data to display</p>
        </div>
      </div>
    )
  }

  // Sort categories by count
  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  // Calculate SVG donut chart segments
  const radius = 38
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
      percent,
      strokeDasharray,
      strokeDashoffset,
      color: CATEGORY_COLORS[category]?.fill || '#64748b',
    }
  })

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      <div className="px-3 py-2 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
      </div>
      <div className="p-3">
        {/* Donut Chart */}
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#334155"
                strokeWidth="10"
              />
              {/* Data segments */}
              {segments.map((segment) => (
                <circle
                  key={segment.category}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="10"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  className="transition-all duration-500"
                  style={{ transformOrigin: '50px 50px' }}
                />
              ))}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{total}</p>
                <p className="text-[10px] text-slate-400">risks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-1">
          {sortedCategories.map(([category, count]) => {
            return (
              <div key={category} className="flex items-center gap-1.5 text-[10px]">
                <div className={`w-2 h-2 rounded-sm flex-shrink-0`} style={{ backgroundColor: CATEGORY_COLORS[category]?.fill || '#64748b' }}></div>
                <span className="text-slate-400 truncate">{category.slice(0, 3)}</span>
                <span className="text-slate-500">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
