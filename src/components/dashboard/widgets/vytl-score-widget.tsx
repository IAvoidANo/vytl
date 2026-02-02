'use client'

import { trpc } from '@/lib/trpc-client'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Shield, Users, Calendar, Target } from 'lucide-react'
import { useState, useEffect } from 'react'
import { WidgetWrapper, useWidgetSize, useResponsiveValue } from '../widget-wrapper'

export function VytlScoreWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const { size } = useWidgetSize()

  const { data: scoreData, isLoading, refetch } = trpc.assessment.current.useQuery()
  const saveMutation = trpc.assessment.create.useMutation({
    onSuccess: () => {
      refetch()
      setIsRefreshing(false)
    },
    onError: () => {
      setIsRefreshing(false)
    },
  })

  // Animate score on mount
  useEffect(() => {
    if (scoreData?.score) {
      const duration = 1000
      const steps = 60
      const increment = scoreData.score / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= scoreData.score) {
          setAnimatedScore(scoreData.score)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [scoreData?.score])

  const handleRefresh = () => {
    setIsRefreshing(true)
    saveMutation.mutate({ type: 'AD_HOC' })
  }

  // Responsive sizing
  const circleSize = useResponsiveValue({ xs: 80, sm: 100, md: 120, lg: 144 }, 120)
  const scoreTextSize = useResponsiveValue({ xs: 'text-3xl', sm: 'text-4xl', md: 'text-5xl', lg: 'text-6xl' }, 'text-5xl')
  const gradeTextSize = useResponsiveValue({ xs: 'text-lg', sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }, 'text-2xl')
  const showDimensions = useResponsiveValue({ xs: false, sm: false, md: true }, true)
  const isCompact = size === 'xs' || size === 'sm'

  if (isLoading) {
    return (
      <WidgetWrapper title="Vytl Score">
        <div className="animate-pulse h-full flex items-center justify-center">
          <div className="w-24 h-24 bg-slate-700 rounded-full"></div>
        </div>
      </WidgetWrapper>
    )
  }

  if (!scoreData) {
    return (
      <WidgetWrapper title="Vytl Score">
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-400 text-sm">Unable to calculate score</p>
        </div>
      </WidgetWrapper>
    )
  }

  const { score, grade, gradeColor, breakdown, riskCount } = scoreData

  // Color configurations
  const gradeConfig = {
    green: {
      gradient: 'from-green-500/20 via-green-500/5 to-transparent',
      ring: 'stroke-green-500',
      text: 'text-green-400',
      bg: 'bg-green-500',
    },
    yellow: {
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      ring: 'stroke-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500',
    },
    red: {
      gradient: 'from-red-500/20 via-red-500/5 to-transparent',
      ring: 'stroke-red-500',
      text: 'text-red-400',
      bg: 'bg-red-500',
    },
  }

  const colors = gradeConfig[gradeColor as keyof typeof gradeConfig] || gradeConfig.red

  const getTrendIcon = (direction: string) => {
    const iconSize = isCompact ? 'w-3 h-3' : 'w-4 h-4'
    switch (direction) {
      case 'improving':
        return <TrendingUp className={`${iconSize} text-green-400`} />
      case 'worsening':
        return <TrendingDown className={`${iconSize} text-red-400`} />
      default:
        return <Minus className={`${iconSize} text-slate-400`} />
    }
  }

  const dimensions = [
    { score: breakdown.coverage.score, maxScore: breakdown.coverage.maxScore, label: 'Coverage', icon: <Target className="w-3 h-3" />, color: 'text-blue-400', bgColor: 'bg-blue-500' },
    { score: breakdown.controlEffectiveness.score, maxScore: breakdown.controlEffectiveness.maxScore, label: 'Controls', icon: <Shield className="w-3 h-3" />, color: 'text-purple-400', bgColor: 'bg-purple-500' },
    { score: breakdown.maturity.score, maxScore: breakdown.maturity.maxScore, label: 'Maturity', icon: <Users className="w-3 h-3" />, color: 'text-teal-400', bgColor: 'bg-teal-500' },
    { score: breakdown.trend.score, maxScore: breakdown.trend.maxScore, label: 'Trend', icon: <Calendar className="w-3 h-3" />, color: 'text-orange-400', bgColor: 'bg-orange-500' },
  ]

  // SVG circle calculations
  const circleRadius = (circleSize / 2) - 8
  const circumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={`h-full bg-gradient-to-br ${colors.gradient} flex flex-col`}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/30 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Vytl Score</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || saveMutation.isPending}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Recalculate score"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 min-h-0 p-4 flex ${isCompact ? 'flex-col items-center' : 'items-center gap-6'}`}>
        {/* Score Circle */}
        <div className="relative flex-shrink-0">
          <svg
            className="-rotate-90"
            width={circleSize}
            height={circleSize}
            viewBox={`0 0 ${circleSize} ${circleSize}`}
          >
            {/* Background ring */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={circleRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-700"
            />
            {/* Progress ring */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={circleRadius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={`${colors.ring} transition-all duration-1000 ease-out`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${scoreTextSize} font-bold text-white tabular-nums leading-none`}>
              {animatedScore}
            </span>
            <span className={`${gradeTextSize} font-bold ${colors.text} -mt-0.5`}>{grade}</span>
          </div>
        </div>

        {/* Right side content - only show if not compact */}
        {!isCompact && (
          <div className="flex-1 min-w-0 space-y-2">
            {/* Trend indicator */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
              {getTrendIcon(breakdown.trend.details.direction)}
              <span className="text-sm text-slate-300 capitalize">
                {breakdown.trend.details.direction.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500">
                • {riskCount} risk{riskCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Dimension Bars */}
            {showDimensions && dimensions.map((dim) => {
              const percentage = Math.round((dim.score / dim.maxScore) * 100)
              return (
                <div key={dim.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-1.5 ${dim.color}`}>
                      {dim.icon}
                      <span className="text-xs text-slate-300">{dim.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${dim.bgColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Compact trend indicator */}
        {isCompact && (
          <div className="flex items-center gap-1.5 mt-2">
            {getTrendIcon(breakdown.trend.details.direction)}
            <span className="text-xs text-slate-400">
              {riskCount} risk{riskCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
