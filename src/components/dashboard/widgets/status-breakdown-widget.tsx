'use client'

import { useResponsiveValue } from '../widget-wrapper'

interface StatusBreakdownWidgetProps {
  byStatus: Record<string, number>
  total: number
}

export function StatusBreakdownWidget({ byStatus, total }: StatusBreakdownWidgetProps) {
  const isVertical = useResponsiveValue({ xs: true, sm: true, md: false }, false)
  const valueTextSize = useResponsiveValue({ xs: 'text-lg', sm: 'text-xl', md: 'text-2xl' }, 'text-xl')

  const statuses = [
    { key: 'OPEN', label: 'Open', color: 'bg-red-400', textColor: 'text-red-400' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-400', textColor: 'text-yellow-400' },
    { key: 'MONITORING', label: 'Monitoring', color: 'bg-blue-400', textColor: 'text-blue-400' },
    { key: 'CLOSED', label: 'Closed', color: 'bg-green-400', textColor: 'text-green-400' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Status Breakdown</h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Status Cards */}
        <div className={`flex-1 ${isVertical ? 'flex flex-col gap-2' : 'grid grid-cols-4 gap-3'}`}>
          {statuses.map(({ key, label, color, textColor }) => (
            <div key={key} className={`${isVertical ? 'flex items-center justify-between' : 'text-center'}`}>
              <div className={`flex items-center gap-1.5 ${isVertical ? '' : 'justify-center mb-1'}`}>
                <span className={`w-2 h-2 ${color} rounded-full`}></span>
                <span className="text-[11px] text-slate-400">{label}</span>
              </div>
              <span className={`${valueTextSize} font-bold ${textColor}`}>
                {byStatus[key] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-3 pt-2 border-t border-slate-700">
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-slate-700">
            {total > 0 && statuses.map(({ key, color }) => (
              <div
                key={key}
                className={`${color} transition-all`}
                style={{ width: `${((byStatus[key] || 0) / total) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
