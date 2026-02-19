'use client'

import { trpc } from '@/lib/trpc-client'
import { Lightbulb, AlertTriangle, Info } from 'lucide-react'
import { useVisibleRows } from '../widget-wrapper'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
}

export function ScoringRecommendationsWidget() {
  const visibleRows = useVisibleRows(56, 3)
  const { data: recommendations, isLoading } = trpc.scoring.getRecommendations.useQuery()

  const displayItems = recommendations?.slice(0, Math.max(visibleRows, 5)) || []

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Risk Intelligence Alerts</h3>
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Risk Intelligence Alerts</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <Lightbulb className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No alerts</p>
            <p className="text-slate-500 text-[10px] mt-1">Risk intelligence alerts will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Risk Intelligence Alerts</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-auto divide-y divide-slate-700/50">
        {displayItems.map((rec, i) => {
          const Icon = SEVERITY_ICONS[rec.severity] || Info
          return (
            <div key={i} className="px-3 py-2.5">
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${SEVERITY_STYLES[rec.severity]}`}>
                  <Icon className="w-2.5 h-2.5" />
                  {rec.severity}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate">{rec.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{rec.actionable}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
