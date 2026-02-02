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

export function CategoryChart({ className = '' }: CategoryChartProps) {
  const { data: stats, isLoading } = trpc.risk.stats.useQuery()

  if (isLoading) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 ${className}`}>
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
        </div>
        <div className="p-4">
          <div className="animate-pulse flex items-center gap-6">
            <div className="w-28 h-28 bg-slate-700 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-slate-700 rounded"></div>
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
      <div className={`bg-slate-800 rounded-xl border border-slate-700 ${className}`}>
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
        </div>
        <div className="p-8 text-center">
          <PieChart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No data to display</p>
        </div>
      </div>
    )
  }

  // Sort categories by count
  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  // Calculate SVG donut chart segments
  const radius = 42
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
    <div className={`bg-slate-800 rounded-xl border border-slate-700 ${className}`}>
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white">Risks by Category</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-5">
          {/* Donut Chart - Left Side */}
          <div className="relative flex-shrink-0">
            <svg width="110" height="110" viewBox="0 0 110 110" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="55"
                cy="55"
                r={radius}
                fill="none"
                stroke="#334155"
                strokeWidth="12"
              />
              {/* Data segments */}
              {segments.map((segment) => (
                <circle
                  key={segment.category}
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="12"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-80"
                  style={{ transformOrigin: '55px 55px' }}
                />
              ))}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
              </div>
            </div>
          </div>

          {/* Legend - Right Side */}
          <div className="flex-1 space-y-1.5">
            {sortedCategories.map(([category, count]) => {
              const percentage = Math.round((count / total) * 100)
              const colors = CATEGORY_COLORS[category] || { fill: '#64748b', text: 'text-slate-400' }
              const label = CATEGORY_LABELS[category] || category

              return (
                <div key={category} className="flex items-center gap-2 group">
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: colors.fill }}
                  />
                  {/* Category name */}
                  <span className="flex-1 text-xs text-slate-300 truncate">
                    {label}
                  </span>
                  {/* Count */}
                  <span className="text-xs font-mono text-slate-400 w-6 text-right">
                    {count}
                  </span>
                  {/* Percentage */}
                  <span className="text-[10px] text-slate-500 w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              )
            })}

            {/* Show "Others" if there are more categories */}
            {Object.keys(categoryData).length > 6 && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                <div className="w-3 h-3 rounded flex-shrink-0 bg-slate-600" />
                <span className="flex-1 text-xs text-slate-500 italic">
                  +{Object.keys(categoryData).length - 6} more
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
