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
    classes: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-600/40',
  },
  PARTIALLY_EFFECTIVE: {
    label: 'Partially Effective',
    short: 'Part',
    classes: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-600/40',
  },
  INEFFECTIVE: {
    label: 'Ineffective',
    short: 'Ineff',
    classes: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-600/40',
  },
  NOT_TESTED: {
    label: 'Not Tested',
    short: 'N/T',
    classes: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
  NOT_APPLICABLE: {
    label: 'Not Applicable',
    short: 'N/A',
    classes: 'bg-slate-400/15 text-slate-500 dark:text-slate-500 border-slate-400/30',
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
