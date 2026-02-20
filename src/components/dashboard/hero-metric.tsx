'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc-client'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Shield, Target, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

function PulseDot({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-green-500' :
    score >= 40 ? 'bg-amber-500' :
                  'bg-red-500'
  const ringColor =
    score >= 70 ? 'ring-green-400' :
    score >= 40 ? 'ring-amber-400' :
                  'ring-red-400'

  return (
    <span className="relative flex h-3 w-3">
      <span className={cn(
        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
        color,
      )} />
      <span className={cn(
        'relative inline-flex rounded-full h-3 w-3 ring-2 ring-offset-2 ring-offset-white',
        color, ringColor,
      )} />
    </span>
  )
}

export function HeroMetric() {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: scoreData, isLoading, refetch } = trpc.assessment.current.useQuery()
  const saveMutation = trpc.assessment.create.useMutation({
    onSuccess: () => { refetch(); setIsRefreshing(false) },
    onError: () => setIsRefreshing(false),
  })

  // Animate count-up on mount / score change
  useEffect(() => {
    if (!scoreData?.score) return
    const target = scoreData.score
    const duration = 900
    const steps = 45
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setAnimatedScore(target)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [scoreData?.score])

  const handleRefresh = () => {
    setIsRefreshing(true)
    saveMutation.mutate({ type: 'AD_HOC' })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-panel shadow-card border border-slate-100 p-8 animate-pulse">
        <div className="flex items-start gap-8">
          <div>
            <div className="h-20 w-32 bg-slate-100 rounded-xl mb-3" />
            <div className="h-5 w-40 bg-slate-100 rounded" />
          </div>
          <div className="flex-1 space-y-3 mt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-3 bg-slate-100 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="bg-white rounded-panel shadow-card border border-slate-100 p-8 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Run your first assessment to see your Vytl Score</p>
      </div>
    )
  }

  const { score, grade, gradeColor, breakdown, riskCount } = scoreData

  const calculatedAt = scoreData.calculatedAt ? new Date(scoreData.calculatedAt) : null
  const daysSince = calculatedAt
    ? Math.floor((Date.now() - calculatedAt.getTime()) / 86_400_000)
    : null
  const isStale = daysSince !== null && daysSince > 30

  const trendDir = breakdown.trend.details.direction
  const TrendIcon =
    trendDir === 'improving' ? TrendingUp :
    trendDir === 'worsening' ? TrendingDown :
    Minus
  const trendLabel =
    trendDir === 'improving' ? 'Improving' :
    trendDir === 'worsening' ? 'Needs attention' :
    'Stable'
  const trendColor =
    trendDir === 'improving' ? 'text-green-600' :
    trendDir === 'worsening' ? 'text-red-500' :
    'text-slate-500'

  const gradeTextColor =
    gradeColor === 'green' ? 'text-green-500' :
    gradeColor === 'yellow' ? 'text-amber-500' :
    'text-red-500'

  const gradeBgColor =
    gradeColor === 'green' ? 'bg-green-50 border-green-200' :
    gradeColor === 'yellow' ? 'bg-amber-50 border-amber-200' :
    'bg-red-50 border-red-200'

  const accentBar =
    gradeColor === 'green' ? 'bg-green-500' :
    gradeColor === 'yellow' ? 'bg-amber-500' :
    'bg-red-500'

  const dimensions = [
    { label: 'Coverage',  icon: Target,  score: breakdown.coverage.score,           max: breakdown.coverage.maxScore,           color: 'bg-teal-500' },
    { label: 'Controls',  icon: Shield,  score: breakdown.controlEffectiveness.score, max: breakdown.controlEffectiveness.maxScore, color: 'bg-purple-500' },
    { label: 'Maturity',  icon: Users,   score: breakdown.maturity.score,            max: breakdown.maturity.maxScore,            color: 'bg-blue-500' },
    { label: 'Trend',     icon: Calendar,score: breakdown.trend.score,               max: breakdown.trend.maxScore,               color: 'bg-orange-500' },
  ]

  return (
    <div className="bg-white rounded-panel shadow-card border border-slate-100 overflow-hidden">
      {/* Accent top bar */}
      <div className={cn('h-1', accentBar)} />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">

          {/* Left: Score */}
          <div className="flex-shrink-0">
            <div className="flex items-start gap-3">
              {/* Big number */}
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-8xl font-bold text-slate-900 leading-none tabular-nums">
                    {animatedScore}
                  </span>
                  <div className={cn('px-3 py-1 rounded-xl border text-3xl font-bold leading-none', gradeBgColor, gradeTextColor)}>
                    {grade}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-1.5">out of 100</p>
              </div>
            </div>

            {/* Trend + pulse row */}
            <div className="flex items-center gap-3 mt-4">
              <PulseDot score={score} />
              <TrendIcon className={cn('w-4 h-4', trendColor)} />
              <span className={cn('text-sm font-medium', trendColor)}>{trendLabel}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{riskCount} risk{riskCount !== 1 ? 's' : ''}</span>
              {isStale && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  {daysSince}d ago
                </span>
              )}
            </div>
          </div>

          {/* Right: Dimension bars */}
          <div className="flex-1 min-w-0 space-y-3 pt-1">
            {dimensions.map((dim) => {
              const pct = Math.round((dim.score / dim.max) * 100)
              const Icon = dim.icon
              return (
                <div key={dim.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {dim.label}
                    </div>
                    <span className="text-xs font-medium text-slate-500 tabular-nums">
                      {dim.score}/{dim.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', dim.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Footer: last calculated + recalc button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {calculatedAt
                  ? `Last calculated ${daysSince === 0 ? 'today' : `${daysSince}d ago`}`
                  : 'Not yet calculated'}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || saveMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                Recalculate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
