'use client'

import { trpc } from '@/lib/trpc-client'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Shield, Users, Calendar, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ScoreDimension {
  score: number
  maxScore: number
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

export function VytlScoreCard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

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

  if (isLoading) {
    return (
      <div className="h-full bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
        <div className="flex items-center gap-8">
          <div className="w-48 h-48 bg-slate-700 rounded-full"></div>
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-6 bg-slate-700 rounded w-full"></div>
            <div className="h-6 bg-slate-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="h-full bg-slate-800 rounded-xl p-6 border border-slate-700 flex items-center justify-center">
        <p className="text-slate-400">Unable to calculate score</p>
      </div>
    )
  }

  const { score, grade, gradeColor, breakdown, riskCount } = scoreData

  // Color configurations
  const gradeConfig = {
    green: {
      gradient: 'from-green-500/20 via-green-500/5 to-transparent',
      glow: 'shadow-green-500/20',
      ring: 'stroke-green-500',
      text: 'text-green-400',
      bg: 'bg-green-500',
    },
    yellow: {
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      glow: 'shadow-amber-500/20',
      ring: 'stroke-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500',
    },
    red: {
      gradient: 'from-red-500/20 via-red-500/5 to-transparent',
      glow: 'shadow-red-500/20',
      ring: 'stroke-red-500',
      text: 'text-red-400',
      bg: 'bg-red-500',
    },
  }

  const colors = gradeConfig[gradeColor as keyof typeof gradeConfig] || gradeConfig.red

  const getScoreInterpretation = (s: number): string => {
    if (s === 0) return 'No risk data yet. Add risks to calculate your score.'
    if (s < 20) return 'Critical gaps in risk governance. Immediate attention required.'
    if (s < 40) return 'Significant risk exposure. Key controls need strengthening.'
    if (s < 60) return 'Moderate risk management in place. Some gaps remain.'
    if (s < 80) return 'Good risk governance. Continue monitoring and improving.'
    return 'Strong risk governance. Maintain and monitor.'
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-400" />
      case 'worsening':
        return <TrendingDown className="w-5 h-5 text-red-400" />
      default:
        return <Minus className="w-5 h-5 text-slate-400" />
    }
  }

  const dimensions: ScoreDimension[] = [
    {
      score: breakdown.coverage.score,
      maxScore: breakdown.coverage.maxScore,
      label: 'Coverage',
      icon: <Target className="w-4 h-4" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500',
    },
    {
      score: breakdown.controlEffectiveness.score,
      maxScore: breakdown.controlEffectiveness.maxScore,
      label: 'Controls',
      icon: <Shield className="w-4 h-4" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500',
    },
    {
      score: breakdown.maturity.score,
      maxScore: breakdown.maturity.maxScore,
      label: 'Maturity',
      icon: <Users className="w-4 h-4" />,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500',
    },
    {
      score: breakdown.trend.score,
      maxScore: breakdown.trend.maxScore,
      label: 'Trend',
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500',
    },
  ]

  // Calculate SVG circle values - LARGER circle
  const circleRadius = 85
  const circumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div
      className={`h-full bg-gradient-to-br ${colors.gradient} bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl ${colors.glow}`}
    >
      {/* Header */}
      <div className="px-5 py-2.5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/30">
        <h3 className="text-sm font-semibold text-white">VytlRx Score</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || saveMutation.isPending}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Recalculate score"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-5 flex items-center gap-8 h-[calc(100%-44px)]">
        {/* Left: Score Circle with Animated Ring - LARGER */}
        <div className="relative flex-shrink-0 p-2">
          {/* SVG Progress Ring - 200x200 for 100px+ number */}
          <svg className="w-52 h-52 -rotate-90" viewBox="0 0 200 200">
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r={circleRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-700"
            />
            {/* Progress ring */}
            <circle
              cx="100"
              cy="100"
              r={circleRadius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={`${colors.ring} transition-all duration-1000 ease-out`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>

          {/* Center Content - 100px+ score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-bold text-white tabular-nums leading-none"
              style={{ fontSize: '100px' }}
            >
              {animatedScore}
            </span>
            <span className={`text-3xl font-bold ${colors.text} -mt-2`}>{grade}</span>
            <p className="text-xs text-slate-400 text-center mt-1 px-6 leading-tight">
              {getScoreInterpretation(score)}
            </p>
          </div>
        </div>

        {/* Right: Metrics Vertical Layout */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Trend indicator */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
            {getTrendIcon(breakdown.trend.details.direction)}
            <span className="text-sm text-slate-300 capitalize">
              {breakdown.trend.details.direction.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500">
              • {riskCount} risk{riskCount !== 1 ? 's' : ''} tracked
            </span>
          </div>

          {/* Dimension Bars */}
          {dimensions.map((dim) => {
            const percentage = Math.round((dim.score / dim.maxScore) * 100)
            return (
              <div key={dim.label} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className={`flex items-center gap-2 ${dim.color}`}>
                    {dim.icon}
                    <span className="text-sm font-medium text-slate-300">{dim.label}</span>
                  </div>
                  <span className="text-sm font-mono text-slate-400">
                    {dim.score}/{dim.maxScore}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${dim.bgColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
