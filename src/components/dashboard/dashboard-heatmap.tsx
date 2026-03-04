'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { useAppetite } from '@/lib/use-appetite'
import { bandToHeatmapClasses } from '@/lib/appetite-validation'
import { BAND_PRINT_COLOURS } from '@/lib/risk-colour-mapping'
import { cn } from '@/lib/utils'


export function DashboardHeatmap() {
  const [hovered, setHovered] = useState<string | null>(null)
  const { data: risks, isLoading } = trpc.risk.list.useQuery()
  const appetite = useAppetite()

  // Build L×I count matrix
  const matrix: Record<string, number> = {}
  risks?.forEach((r) => {
    const key = `${r.residualLikelihood}-${r.residualImpact}`
    matrix[key] = (matrix[key] ?? 0) + 1
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-panel shadow-card border border-slate-100 p-5 animate-pulse">
        <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
        <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)' }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-panel shadow-card border border-slate-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-900">Risk Heatmap</h2>
        <Link
          href="/risks"
          className="text-xs text-slate-400 hover:text-teal-600 transition-colors"
        >
          View register →
        </Link>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 flex flex-col justify-between min-h-0">
        <div className="flex gap-2">
          {/* Y-axis label */}
          <div className="flex items-center justify-center w-4 flex-shrink-0">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest -rotate-90 whitespace-nowrap">
              Likelihood
            </span>
          </div>

          {/* Matrix + x-axis */}
          <div className="flex-1 min-w-0">
            {/* Impact column headers */}
            <div
              className="grid gap-1 mb-1"
              style={{ gridTemplateColumns: '28px repeat(5, 1fr)' }}
            >
              <div />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center">
                  <span className="text-[10px] font-semibold text-slate-400">{i}</span>
                </div>
              ))}
            </div>

            {/* Rows: likelihood 5 → 1 */}
            <div className="grid gap-1" style={{ gridTemplateColumns: '28px repeat(5, 1fr)' }}>
              {[5, 4, 3, 2, 1].map((l) => (
                <div key={l} className="contents">
                  {/* Row label */}
                  <div className="flex items-center justify-end pr-1">
                    <span className="text-[10px] font-semibold text-slate-400">{l}</span>
                  </div>

                  {/* Cells */}
                  {[1, 2, 3, 4, 5].map((i) => {
                    const key = `${l}-${i}`
                    const count = matrix[key] ?? 0
                    const score = l * i
                    const band = appetite.getBand(score)
                    const isHovered = hovered === key

                    return (
                      <Link
                        key={key}
                        href={`/risks?likelihood=${l}&impact=${i}`}
                        title={`L${l} × I${i} (score ${score}) — ${count} risk${count !== 1 ? 's' : ''}`}
                        className={cn(
                          'flex items-center justify-center rounded border transition-all duration-150 h-10',
                          bandToHeatmapClasses(band as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
                          isHovered && 'ring-2 ring-offset-1 ring-slate-400',
                        )}
                        onMouseEnter={() => setHovered(key)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <span className="text-sm font-bold tabular-nums text-white">
                          {count > 0 ? count : ''}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* X-axis label */}
            <div className="text-center mt-2">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                Impact
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-100 flex-wrap flex-shrink-0">
          {appetite.getLegend().map(({ band, label, range }) => (
            <div key={band} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: BAND_PRINT_COLOURS[band as keyof typeof BAND_PRINT_COLOURS] }}
              />
              <span className="text-[10px] text-slate-500">
                {label} <span className="text-slate-400">{range}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
