'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { useAppetite } from '@/lib/use-appetite'
import { BAND_PRINT_COLOURS } from '@/lib/risk-colour-mapping'

interface Risk {
  id: string
  title: string
  refCode: string
  residualLikelihood: number
  residualImpact: number
  residualScore: number
  controlEffectiveness?: string
}

const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']
const IMPACT_LABELS = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic']

export function RiskHeatmap() {
  const [hoveredCell, setHoveredCell] = useState<{ l: number; i: number } | null>(null)
  const { data: risks, isLoading } = trpc.risk.list.useQuery()
  const appetite = useAppetite()

  // Group risks by likelihood and impact
  const riskMatrix: Record<string, Risk[]> = {}
  risks?.forEach((risk) => {
    const key = `${risk.residualLikelihood}-${risk.residualImpact}`
    if (!riskMatrix[key]) riskMatrix[key] = []
    riskMatrix[key].push(risk as Risk)
  })

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading heatmap...</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-stretch gap-6">
        {/* Y-axis label */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-slate-400 -rotate-90 whitespace-nowrap tracking-wider">
            LIKELIHOOD
          </span>
        </div>

        <div className="flex-1">
          {/* Matrix grid */}
          <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)' }}>
            {/* Empty corner */}
            <div></div>

            {/* Impact headers */}
            {IMPACT_LABELS.map((label, i) => (
              <div key={i} className="text-center px-2 py-1">
                <span className="text-xs font-medium text-slate-400">{i + 1}</span>
                <p className="text-xs text-slate-500 truncate">{label}</p>
              </div>
            ))}

            {/* Rows (likelihood 5 down to 1) */}
            {[5, 4, 3, 2, 1].map((likelihood) => (
              <>
                {/* Likelihood label */}
                <div key={`label-${likelihood}`} className="flex items-center justify-end pr-2">
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-400">{likelihood}</span>
                    <p className="text-xs text-slate-500">{LIKELIHOOD_LABELS[likelihood - 1]}</p>
                  </div>
                </div>

                {/* Cells */}
                {[1, 2, 3, 4, 5].map((impact) => {
                  const key = `${likelihood}-${impact}`
                  const cellRisks = riskMatrix[key] || []
                  const isHovered = hoveredCell?.l === likelihood && hoveredCell?.i === impact
                  const score = likelihood * impact

                  return (
                    <div
                      key={key}
                      className={`relative min-h-[80px] rounded border transition-all ${appetite.getHeatmapClasses(score)} ${
                        isHovered ? 'ring-2 ring-white/50 z-10' : ''
                      }`}
                      onMouseEnter={() => setHoveredCell({ l: likelihood, i: impact })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Score */}
                      <div className="absolute top-1 right-1">
                        <span className={`text-xs font-bold ${appetite.getHeatmapTextClass(score)}`}>
                          {score}
                        </span>
                      </div>

                      {/* Risk count or list */}
                      <div className="p-2 pt-5">
                        {cellRisks.length > 0 ? (
                          <div className="space-y-1">
                            {cellRisks.slice(0, 3).map((risk) => {
                              const ceLabel = risk.controlEffectiveness && risk.controlEffectiveness !== 'NOT_TESTED'
                                ? ` [${risk.controlEffectiveness.replace('_', ' ')}]`
                                : ''
                              return (
                                <Link
                                  key={risk.id}
                                  href={`/risks/${risk.id}`}
                                  className="block text-xs bg-slate-900/50 rounded px-1.5 py-0.5 truncate hover:bg-slate-900 transition-colors text-white"
                                  title={`${risk.title}${ceLabel}`}
                                >
                                  {risk.refCode}
                                </Link>
                              )
                            })}
                            {cellRisks.length > 3 && (
                              <span className="text-xs text-slate-400">
                                +{cellRisks.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500/50">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            ))}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-4">
            <span className="text-sm font-medium text-slate-400 tracking-wider">IMPACT</span>
          </div>
        </div>
      </div>

      {/* Legend - dynamic from appetite thresholds */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-700">
        {appetite.getLegend().map(({ band, label, range }) => (
          <div key={band} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: BAND_PRINT_COLOURS[band as keyof typeof BAND_PRINT_COLOURS] }}
            />
            <span className="text-xs text-slate-400">{label} ({range})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
