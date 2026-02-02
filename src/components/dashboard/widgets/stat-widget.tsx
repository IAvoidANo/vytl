'use client'

import { ReactNode } from 'react'
import { useWidgetSize, useResponsiveValue } from '../widget-wrapper'

interface StatWidgetProps {
  title: string
  value: number | string
  icon: ReactNode
  iconBg?: string
  valueColor?: string
}

export function StatWidget({ title, value, icon, iconBg = 'bg-slate-700', valueColor = 'text-white' }: StatWidgetProps) {
  const { size } = useWidgetSize()

  const valueTextSize = useResponsiveValue(
    { xs: 'text-2xl', sm: 'text-3xl', md: 'text-4xl', lg: 'text-5xl' },
    'text-3xl'
  )

  const iconSize = useResponsiveValue(
    { xs: 'p-2', sm: 'p-2.5', md: 'p-3', lg: 'p-4' },
    'p-3'
  )

  const isCompact = size === 'xs'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex items-center justify-between">
        <div className="min-w-0">
          <p className={`${valueTextSize} font-bold ${valueColor} tabular-nums`}>{value}</p>
        </div>
        {!isCompact && (
          <div className={`${iconSize} ${iconBg} rounded-lg flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
