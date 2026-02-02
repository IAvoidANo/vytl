'use client'

import { trpc } from '@/lib/trpc-client'
import { PieChart } from 'lucide-react'
import { useWidgetSize, useResponsiveValue } from '../widget-wrapper'

const CATEGORY_COLORS: Record<string, { fill: string }> = {
  STRATEGIC: { fill: '#a855f7' },
  OPERATIONAL: { fill: '#3b82f6' },
  FINANCIAL: { fill: '#22c55e' },
  COMPLIANCE: { fill: '#f59e0b' },
  TECHNOLOGY: { fill: '#06b6d4' },
  REPUTATIONAL: { fill: '#ec4899' },
  ENVIRONMENTAL: { fill: '#10b981' },
  PEOPLE: { fill: '#f97316' },
}

const CATEGORY_LABELS: Record<string, string> = {
  STRATEGIC: 'Strategic',
  OPERATIONAL: 'Operational',
  FINANCIAL: 'Financial',
  COMPLIANCE: 'Compliance',
  TECHNOLOGY: 'Technology',
  REPUTATIONAL: 'Reputational',
  ENVIRONMENTAL: 'Environmental',
  PEOPLE: 'People',
}

export function CategoryChartWidget() {
  const { data: stats, isLoading } = trpc.risk.stats.useQuery()
  const { size } = useWidgetSize()

  const chartSize = useResponsiveValue({ xs: 80, sm: 90, md: 110, lg: 130 }, 110)
  const showLegend = useResponsiveValue({ xs: false, sm: true }, true)
  const isCompact = size === 'xs'

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-6">
            <div className="w-24 h-24 bg-slate-700 rounded-full flex-shrink-0"></div>
            {showLegend && (
              <div className="flex-1 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-700 rounded"></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const categoryData = stats?.byCategory || {}
  const total = Object.values(categoryData).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <PieChart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No data to display</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort categories by count
  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  // Calculate SVG donut chart segments
  const radius = (chartSize / 2) - 13
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
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
      </div>
      <div className="flex-1 min-h-0 p-4 flex items-center justify-center">
        <div className={`flex items-center ${isCompact ? 'flex-col' : 'gap-5'}`}>
          {/* Donut Chart */}
          <div className="relative flex-shrink-0">
            <svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={chartSize / 2}
                cy={chartSize / 2}
                r={radius}
                fill="none"
                stroke="#334155"
                strokeWidth="12"
              />
              {/* Data segments */}
              {segments.map((segment) => (
                <circle
                  key={segment.category}
                  cx={chartSize / 2}
                  cy={chartSize / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="12"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-80"
                />
              ))}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{total}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="flex-1 space-y-1.5 min-w-0">
              {sortedCategories.map(([category, count]) => {
                const percentage = Math.round((count / total) * 100)
                const colors = CATEGORY_COLORS[category] || { fill: '#64748b' }
                const label = CATEGORY_LABELS[category] || category

                return (
                  <div key={category} className="flex items-center gap-2 group">
                    <div
                      className="w-3 h-3 rounded flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: colors.fill }}
                    />
                    <span className="flex-1 text-xs text-slate-300 truncate">
                      {label}
                    </span>
                    <span className="text-xs font-mono text-slate-400 w-6 text-right">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-500 w-8 text-right">
                      {percentage}%
                    </span>
                  </div>
                )
              })}

              {Object.keys(categoryData).length > 6 && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                  <div className="w-3 h-3 rounded flex-shrink-0 bg-slate-600" />
                  <span className="flex-1 text-xs text-slate-500 italic">
                    +{Object.keys(categoryData).length - 6} more
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
