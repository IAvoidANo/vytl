'use client'

import {
  classifyAppetiteBand,
  bandToColorClasses,
  bandToLabel,
  resolveThresholds,
  DEFAULT_APPETITE_THRESHOLDS,
  type AppetiteThresholds,
} from '@/lib/appetite-validation'

interface RiskScoreBadgeProps {
  score: number
  size?: 'sm' | 'md'
  thresholds?: AppetiteThresholds
  category?: string
  categoryConfig?: Record<string, AppetiteThresholds> | null
}

export function RiskScoreBadge({
  score,
  size = 'md',
  thresholds,
  category,
  categoryConfig,
}: RiskScoreBadgeProps) {
  const effective = resolveThresholds(
    thresholds ?? DEFAULT_APPETITE_THRESHOLDS,
    category,
    categoryConfig
  )
  const band = classifyAppetiteBand(score, effective)
  const { bg, text, border } = bandToColorClasses(band)
  const label = bandToLabel(band)
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded border font-medium ${bg} ${text} ${border} ${sizeClasses}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-75">({label})</span>
    </span>
  )
}
