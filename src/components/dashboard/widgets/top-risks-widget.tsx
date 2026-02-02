'use client'

import { trpc } from '@/lib/trpc-client'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useVisibleRows, useWidgetSize } from '../widget-wrapper'

function getScoreColor(score: number): string {
  if (score >= 20) return 'text-red-400 bg-red-500/20'
  if (score >= 12) return 'text-orange-400 bg-orange-500/20'
  if (score >= 6) return 'text-yellow-400 bg-yellow-500/20'
  return 'text-green-400 bg-green-500/20'
}

function getScoreBgColor(score: number): string {
  if (score >= 20) return 'bg-red-500'
  if (score >= 12) return 'bg-orange-500'
  if (score >= 6) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function TopRisksWidget() {
  const visibleRows = useVisibleRows(44, 3)
  const { size } = useWidgetSize()
  const isCompact = size === 'xs' || size === 'sm'

  const { data: risks, isLoading } = trpc.risk.topRisks.useQuery({ limit: Math.max(visibleRows, 5) })

  const displayRisks = risks?.slice(0, visibleRows) || []

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Top Risks</h3>
        </div>
        <div className="flex-1 p-2 space-y-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-2 px-2">
              <div className="w-8 h-8 bg-slate-700 rounded"></div>
              <div className="flex-1">
                <div className="h-3 bg-slate-700 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!risks || risks.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Top Risks</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <AlertTriangle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No risks in register</p>
            <Link href="/risks" className="text-teal-400 text-xs hover:underline mt-1 inline-block">
              Add your first risk
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Top {displayRisks.length} Risks</h3>
        <Link href="/risks" className="text-[10px] text-slate-400 hover:text-teal-400 flex items-center gap-0.5">
          View all <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="flex-1 min-h-0 overflow-auto divide-y divide-slate-700/50">
        {displayRisks.map((risk) => (
          <Link
            key={risk.id}
            href={`/risks/${risk.id}`}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 transition-colors"
          >
            {/* Score */}
            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${getScoreColor(risk.residualScore)}`}>
              {risk.residualScore}
            </div>

            {/* Risk Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">
                {risk.title}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="px-1 py-0.5 bg-slate-700 rounded">
                  {risk.category.slice(0, 3)}
                </span>
                <span>{risk.refCode}</span>
              </div>
            </div>

            {/* Score Bar (hidden on compact) */}
            {!isCompact && (
              <div className="w-12 flex-shrink-0">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreBgColor(risk.residualScore)}`}
                    style={{ width: `${(risk.residualScore / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 text-center mt-0.5">
                  {risk.residualLikelihood}×{risk.residualImpact}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
