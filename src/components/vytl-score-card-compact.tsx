'use client'

import { trpc } from '@/lib/trpc-client'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { useState } from 'react'

export function VytlScoreCardCompact() {
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const handleRefresh = () => {
    setIsRefreshing(true)
    saveMutation.mutate({ type: 'AD_HOC' })
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 animate-pulse h-full">
        <div className="h-6 bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-16 bg-slate-700 rounded"></div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 h-full">
        <p className="text-slate-400 text-sm">Unable to calculate score</p>
      </div>
    )
  }

  const { score, grade, gradeColor, breakdown } = scoreData

  const getGradeColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-400 border-green-500'
      case 'yellow':
        return 'text-yellow-400 border-yellow-500'
      case 'red':
        return 'text-red-400 border-red-500'
      default:
        return 'text-slate-400 border-slate-500'
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="w-3 h-3 text-green-400" />
      case 'worsening':
        return <TrendingDown className="w-3 h-3 text-red-400" />
      default:
        return <Minus className="w-3 h-3 text-slate-400" />
    }
  }

  // Calculate pulse animation based on score
  const getPulseClass = () => {
    if (score >= 70) return 'animate-pulse-slow'
    if (score >= 40) return 'animate-pulse'
    return 'animate-pulse-fast'
  }

  const getPulseColor = () => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Vytl Score</h3>
          {/* Risk Pulse - Integrated */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getPulseColor()} ${getPulseClass()}`} />
            <Activity className="w-3 h-3 text-slate-500" />
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || saveMutation.isPending}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
          title="Recalculate score"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Score Display - Compact */}
      <div className="p-3 flex items-center gap-3 flex-1">
        {/* Score Circle */}
        <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-3 ${getGradeColorClass(gradeColor)} bg-slate-900/50`}>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{score}</div>
          </div>
        </div>

        {/* Grade & Breakdown */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-2xl font-bold ${gradeColor === 'green' ? 'text-green-400' : gradeColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
              {grade}
            </span>
            <div className="flex items-center gap-0.5 text-xs text-slate-400">
              {getTrendIcon(breakdown.trend.details.direction)}
            </div>
          </div>

          {/* Mini Dimension Bars */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 w-8">Cov</span>
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400" style={{ width: `${(breakdown.coverage.score / breakdown.coverage.maxScore) * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 w-8">Ctrl</span>
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400" style={{ width: `${(breakdown.controlEffectiveness.score / breakdown.controlEffectiveness.maxScore) * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 w-8">Mat</span>
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400" style={{ width: `${(breakdown.maturity.score / breakdown.maturity.maxScore) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
