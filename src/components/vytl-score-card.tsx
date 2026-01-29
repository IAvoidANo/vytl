'use client'

import { trpc } from '@/lib/trpc-client'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Shield, Users, Calendar, Target } from 'lucide-react'
import { useState } from 'react'

interface ScoreDimension {
  score: number
  maxScore: number
  label: string
  icon: React.ReactNode
  color: string
}

export function VytlScoreCard() {
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
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-3"></div>
        <div className="h-20 bg-slate-700 rounded mb-3"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-400 text-sm">Unable to calculate score</p>
      </div>
    )
  }

  const { score, grade, gradeColor, breakdown, riskCount } = scoreData

  const getGradeColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-400 border-green-500/50 bg-green-500/10'
      case 'yellow':
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10'
      case 'red':
        return 'text-red-400 border-red-500/50 bg-red-500/10'
      default:
        return 'text-slate-400 border-slate-500/50 bg-slate-500/10'
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

  const dimensions: ScoreDimension[] = [
    {
      score: breakdown.coverage.score,
      maxScore: breakdown.coverage.maxScore,
      label: 'Coverage',
      icon: <Target className="w-3 h-3" />,
      color: 'text-blue-400',
    },
    {
      score: breakdown.controlEffectiveness.score,
      maxScore: breakdown.controlEffectiveness.maxScore,
      label: 'Controls',
      icon: <Shield className="w-3 h-3" />,
      color: 'text-purple-400',
    },
    {
      score: breakdown.maturity.score,
      maxScore: breakdown.maturity.maxScore,
      label: 'Maturity',
      icon: <Users className="w-3 h-3" />,
      color: 'text-teal-400',
    },
    {
      score: breakdown.trend.score,
      maxScore: breakdown.trend.maxScore,
      label: 'Trend',
      icon: <Calendar className="w-3 h-3" />,
      color: 'text-orange-400',
    },
  ]

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Vytl Score</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || saveMutation.isPending}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
          title="Recalculate score"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Score Display */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-3">
          {/* Score Circle - Compact */}
          <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-4 ${getGradeColorClasses(gradeColor)}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{score}</div>
              <div className="text-[10px] text-slate-400">/ 100</div>
            </div>
          </div>

          {/* Grade & Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-3xl font-bold ${gradeColor === 'green' ? 'text-green-400' : gradeColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                {grade}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {getTrendIcon(breakdown.trend.details.direction)}
                <span className="capitalize">{breakdown.trend.details.direction.replace('_', ' ')}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Based on {riskCount} risk{riskCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Score Breakdown - Compact */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Score Breakdown</p>
          <div className="grid grid-cols-2 gap-2">
            {dimensions.map((dim) => {
              const percentage = Math.round((dim.score / dim.maxScore) * 100)
              return (
                <div key={dim.label} className="bg-slate-900/50 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-1.5 ${dim.color}`}>
                      {dim.icon}
                      <span className="text-xs font-medium text-white">{dim.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage >= 70
                          ? 'bg-green-500'
                          : percentage >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Details Expandable */}
        <details className="mt-2">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
            View detailed breakdown
          </summary>
          <div className="mt-2 space-y-2 text-[10px] text-slate-400">
            <div className="bg-slate-900/50 rounded p-2">
              <p className="font-medium text-white mb-0.5">Coverage ({breakdown.coverage.score}/{breakdown.coverage.maxScore})</p>
              <p>Categories: {breakdown.coverage.details.categoriesCovered}/{breakdown.coverage.details.totalCategories} | Descriptions: {breakdown.coverage.details.risksWithDescriptions}/{breakdown.coverage.details.totalRisks}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <p className="font-medium text-white mb-0.5">Control Effectiveness ({breakdown.controlEffectiveness.score}/{breakdown.controlEffectiveness.maxScore})</p>
              <p>Avg reduction: {breakdown.controlEffectiveness.details.averageReduction}% | With controls: {breakdown.controlEffectiveness.details.risksWithControls}/{breakdown.controlEffectiveness.details.totalRisks}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <p className="font-medium text-white mb-0.5">Maturity ({breakdown.maturity.score}/{breakdown.maturity.maxScore})</p>
              <p>With owners: {breakdown.maturity.details.risksWithOwners}/{breakdown.maturity.details.totalRisks} | With due dates: {breakdown.maturity.details.risksWithDueDates}/{breakdown.maturity.details.totalRisks}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <p className="font-medium text-white mb-0.5">Trend ({breakdown.trend.score}/{breakdown.trend.maxScore})</p>
              <p>Direction: {breakdown.trend.details.direction.replace('_', ' ')}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
