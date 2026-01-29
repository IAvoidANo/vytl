'use client'

interface RiskScoreBadgeProps {
  score: number
  size?: 'sm' | 'md'
}

export function RiskScoreBadge({ score, size = 'md' }: RiskScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score <= 4) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (score <= 9) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (score <= 14) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const getLabel = (score: number) => {
    if (score <= 4) return 'Low'
    if (score <= 9) return 'Medium'
    if (score <= 14) return 'High'
    return 'Critical'
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded border font-medium ${getColor(score)} ${sizeClasses}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-75">({getLabel(score)})</span>
    </span>
  )
}
