'use client'

import { trpc } from '@/lib/trpc-client'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'

/**
 * Optional dashboard widget: shows material risk movements since last snapshot.
 * Only renders if there are material movements to report.
 * Enabled by default — remove from dashboard-grid.tsx if not desired.
 */
export function MovementAlertWidget() {
  const { data: movement } = trpc.snapshots.compare.useQuery({ periodMonths: 1 })

  if (!movement?.hasSufficientData) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mv = movement as any
  const totalMovers =
    mv.riskMovers.increased.length +
    mv.riskMovers.decreased.length +
    mv.riskMovers.new.length +
    mv.riskMovers.closed.length

  if (totalMovers === 0) return null

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-teal-400" />
        <h3 className="text-sm font-semibold text-white">Risk Movements (Last Month)</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {mv.riskMovers.increased.length > 0 && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-slate-300">
              <span className="font-medium text-white">{mv.riskMovers.increased.length}</span> increased
            </span>
          </div>
        )}
        {mv.riskMovers.decreased.length > 0 && (
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            <span className="text-sm text-slate-300">
              <span className="font-medium text-white">{mv.riskMovers.decreased.length}</span> improved
            </span>
          </div>
        )}
        {mv.riskMovers.new.length > 0 && (
          <div className="text-sm text-slate-300">
            <span className="font-medium text-white">{mv.riskMovers.new.length}</span> new
          </div>
        )}
        {mv.riskMovers.closed.length > 0 && (
          <div className="text-sm text-slate-300">
            <span className="font-medium text-white">{mv.riskMovers.closed.length}</span> closed
          </div>
        )}
      </div>

      <Link
        href="/reports?tab=movement"
        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white rounded-md transition-colors"
      >
        View Movement & Trends
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
