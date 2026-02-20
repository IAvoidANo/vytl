'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc-client'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Shield, Target, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

function PulseDot({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-green-400' :
    score >= 40 ? 'bg-amber-400' :
                  'bg-red-400'

  return (
    <span className="relative flex h-3 w-3">
      <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', color)} />
      <span className={cn('relative inline-flex rounded-full h-3 w-3', color)} />
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

  useEffect(() => {
    if (!scoreData?.score) return
    const target = scoreData.score
    const steps = 45
    let current = 0
    const increment = target / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setAnimatedScore(target); clearInterval(timer) }
      else setAnimatedScore(Math.floor(current))
    }, 900 / steps)
    return () => clearInterval(timer)
  }, [scoreData?.score])

  const handleRefresh = () => { setIsRefreshing(true); saveMutation.mutate({ type: 'AD_HOC' }) }

  if (isLoading) {
    return (
      <div className="rounded-panel overflow-hidden bg-gradient-to-br from-teal-600 to-teal-700 p-8 animate-pulse">
        <div className="flex items-start gap-8">
          <div>
            <div className="h-20 w-32 bg-white/20 rounded-xl mb-3" />
            <div className="h-5 w-40 bg-white/10 rounded" />
          </div>
          <div className="flex-1 space-y-3 mt-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-white/15 rounded-full" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="rounded-panel bg-gradient-to-br from-teal-600 to-teal-700 p-8 flex items-center justify-center">
        <p className="text-white/70 text-sm">Run your first assessment to see your Vytl Score</p>
      </div>
    )
  }

  const { score, grade, gradeColor, breakdown, riskCount } = scoreData

  const calculatedAt = scoreData.calculatedAt ? new Date(scoreData.calculatedAt) : null
  const daysSince = calculatedAt ? Math.floor((Date.now() - calculatedAt.getTime()) / 86_400_000) : null
  const isStale = daysSince !== null && daysSince > 30

  const trendDir = breakdown.trend.details.direction
  const TrendIcon = trendDir === 'improving' ? TrendingUp : trendDir === 'worsening' ? TrendingDown : Minus
  const trendLabel = trendDir === 'improving' ? 'Improving' : trendDir === 'worsening' ? 'Needs attention' : 'Stable'
  const trendColor = trendDir === 'improving' ? 'text-green-300' : trendDir === 'worsening' ? 'text-red-300' : 'text-white/60'

  const gradeRing =
    gradeColor === 'green'  ? 'ring-green-300/50 text-green-300' :
    gradeColor === 'yellow' ? 'ring-amber-300/50 text-amber-300' :
                              'ring-red-300/50 text-red-300'

  const dimensions = [
    { label: 'Coverage', icon: Target,   score: breakdown.coverage.score,             max: breakdown.coverage.maxScore },
    { label: 'Controls', icon: Shield,   score: breakdown.controlEffectiveness.score,  max: breakdown.controlEffectiveness.maxScore },
    { label: 'Maturity', icon: Users,    score: breakdown.maturity.score,              max: breakdown.maturity.maxScore },
    { label: 'Trend',    icon: Calendar, score: breakdown.trend.score,                 max: breakdown.trend.maxScore },
  ]

  return (
    <div className="rounded-panel overflow-hidden shadow-panel bg-gradient-to-br from-teal-600 via-teal-600 to-teal-700">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-12">

          {/* Left: Score + trend */}
          <div className="flex-shrink-0">
            {/* Score row */}
            <div className="flex items-baseline gap-4">
              <span className="text-8xl font-bold text-white leading-none tabular-nums drop-shadow-sm">
                {animatedScore}
              </span>
              <span className={cn(
                'text-3xl font-bold leading-none px-3 py-1.5 rounded-xl bg-white/15 ring-2 backdrop-blur-sm',
                gradeRing,
              )}>
                {grade}
              </span>
            </div>

            <p className="text-white/50 text-xs mt-1.5 font-medium tracking-wide uppercase">Vytl Score · out of 100</p>

            {/* Trend row */}
            <div className="flex items-center gap-2.5 mt-5">
              <PulseDot score={score} />
              <TrendIcon className={cn('w-4 h-4', trendColor)} />
              <span className={cn('text-sm font-medium', trendColor)}>{trendLabel}</span>
              <span className="text-white/30">·</span>
              <span className="text-white/50 text-xs">{riskCount} risk{riskCount !== 1 ? 's' : ''}</span>
              {isStale && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30">
                  {daysSince}d ago
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px self-stretch bg-white/15" />

          {/* Right: Dimension bars */}
          <div className="flex-1 min-w-0 space-y-3.5">
            {dimensions.map((dim) => {
              const pct = Math.round((dim.score / dim.max) * 100)
              const Icon = dim.icon
              return (
                <div key={dim.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Icon className="w-3.5 h-3.5 text-white/40" />
                      {dim.label}
                    </div>
                    <span className="text-xs font-medium text-white/50 tabular-nums">
                      {dim.score}/{dim.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/80 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[11px] text-white/40">
                {calculatedAt
                  ? `Last calculated ${daysSince === 0 ? 'today' : `${daysSince}d ago`}`
                  : 'Not yet calculated'}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || saveMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white disabled:opacity-40 transition-colors"
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
