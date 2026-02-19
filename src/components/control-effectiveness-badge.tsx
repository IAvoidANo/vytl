'use client'

type ControlEffectivenessValue =
  | 'EFFECTIVE'
  | 'PARTIALLY_EFFECTIVE'
  | 'INEFFECTIVE'
  | 'NOT_TESTED'
  | 'NOT_APPLICABLE'

const CE_CONFIG: Record<ControlEffectivenessValue, { label: string; short: string; classes: string }> = {
  EFFECTIVE: {
    label: 'Effective',
    short: 'Eff',
    classes: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  PARTIALLY_EFFECTIVE: {
    label: 'Partially Effective',
    short: 'Part',
    classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  INEFFECTIVE: {
    label: 'Ineffective',
    short: 'Ineff',
    classes: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  NOT_TESTED: {
    label: 'Not Tested',
    short: 'N/T',
    classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
  NOT_APPLICABLE: {
    label: 'Not Applicable',
    short: 'N/A',
    classes: 'bg-slate-500/20 text-slate-500 border-slate-600/30',
  },
}

interface ControlEffectivenessBadgeProps {
  value: string
  compact?: boolean
}

export function ControlEffectivenessBadge({ value, compact = false }: ControlEffectivenessBadgeProps) {
  const config = CE_CONFIG[value as ControlEffectivenessValue] || CE_CONFIG.NOT_TESTED
  const displayText = compact ? config.short : config.label

  return (
    <span
      className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border ${config.classes}`}
      title={config.label}
    >
      {displayText}
    </span>
  )
}
