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
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-700 rounded mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400">Unable to calculate score</p>
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
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'worsening':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      default:
        return <Minus className="w-4 h-4 text-slate-400" />
    }
  }

  const dimensions: ScoreDimension[] = [
    {
      score: breakdown.coverage.score,
      maxScore: breakdown.coverage.maxScore,
      label: 'Coverage',
      icon: <Target className="w-4 h-4" />,
      color: 'text-blue-400',
    },
    {
      score: breakdown.controlEffectiveness.score,
      maxScore: breakdown.controlEffectiveness.maxScore,
      label: 'Controls',
      icon: <Shield className="w-4 h-4" />,
      color: 'text-purple-400',
    },
    {
      score: breakdown.maturity.score,
      maxScore: breakdown.maturity.maxScore,
      label: 'Maturity',
      icon: <Users className="w-4 h-4" />,
      color: 'text-teal-400',
    },
    {
      score: breakdown.trend.score,
      maxScore: breakdown.trend.maxScore,
      label: 'Trend',
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-orange-400',
    },
  ]

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Vytl Score</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || saveMutation.isPending}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Recalculate score"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Score Display */}
      <div className="p-6">
        <div className="flex items-center gap-6 mb-6">
          {/* Score Circle */}
          <div className={`relative flex items-center justify-center w-28 h-28 rounded-full border-4 ${getGradeColorClasses(gradeColor)}`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{score}</div>
              <div className="text-xs text-slate-400">/ 100</div>
            </div>
          </div>

          {/* Grade & Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-5xl font-bold ${gradeColor === 'green' ? 'text-green-400' : gradeColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                {grade}
              </span>
              <div className="flex items-center gap-1 text-sm text-slate-400">
                {getTrendIcon(breakdown.trend.details.direction)}
                <span className="capitalize">{breakdown.trend.details.direction.replace('_', ' ')}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Based on {riskCount} risk{riskCount !== 1 ? 's' : ''} in your register
            </p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Score Breakdown</p>
          <div className="grid grid-cols-2 gap-3">
            {dimensions.map((dim) => {
              const percentage = Math.round((dim.score / dim.maxScore) * 100)
              return (
                <div key={dim.label} className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 ${dim.color}`}>
                      {dim.icon}
                      <span className="text-sm font-medium text-white">{dim.label}</span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
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
        <details className="mt-4">
          <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
            View detailed breakdown
          </summary>
          <div className="mt-3 space-y-3 text-xs text-slate-400">
            <div className="bg-slate-900/50 rounded p-3">
              <p className="font-medium text-white mb-1">Coverage ({breakdown.coverage.score}/{breakdown.coverage.maxScore})</p>
              <p>Categories covered: {breakdown.coverage.details.categoriesCovered}/{breakdown.coverage.details.totalCategories}</p>
              <p>Risks with descriptions: {breakdown.coverage.details.risksWithDescriptions}/{breakdown.coverage.details.totalRisks}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="font-medium text-white mb-1">Control Effectiveness ({breakdown.controlEffectiveness.score}/{breakdown.controlEffectiveness.maxScore})</p>
              <p>Average risk reduction: {breakdown.controlEffectiveness.details.averageReduction}%</p>
              <p>Risks with controls documented: {breakdown.controlEffectiveness.details.risksWithControls}/{breakdown.controlEffectiveness.details.totalRisks}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="font-medium text-white mb-1">Maturity ({breakdown.maturity.score}/{breakdown.maturity.maxScore})</p>
              <p>Risks with owners: {breakdown.maturity.details.risksWithOwners}/{breakdown.maturity.details.totalRisks}</p>
              <p>Risks with due dates: {breakdown.maturity.details.risksWithDueDates}/{breakdown.maturity.details.totalRisks}</p>
            </div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="font-medium text-white mb-1">Trend ({breakdown.trend.score}/{breakdown.trend.maxScore})</p>
              <p>Direction: {breakdown.trend.details.direction.replace('_', ' ')}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
