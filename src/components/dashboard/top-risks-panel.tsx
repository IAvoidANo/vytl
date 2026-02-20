'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { AlertTriangle, ArrowRight, Plus } from 'lucide-react'
import { useAppetite } from '@/lib/use-appetite'
import { bandToColorClasses } from '@/lib/appetite-validation'
import { ControlEffectivenessBadge } from '@/components/control-effectiveness-badge'
import { cn } from '@/lib/utils'

export function TopRisksPanel() {
  const appetite = useAppetite()
  const { data: risks, isLoading } = trpc.risk.topRisks.useQuery({ limit: 5 })

  if (isLoading) {
    return (
      <div className="bg-white rounded-panel shadow-card border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                <div className="h-2.5 bg-slate-50 rounded w-1/3" />
              </div>
              <div className="w-16 h-1.5 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!risks || risks.length === 0) {
    return (
      <div className="bg-white rounded-panel shadow-card border border-slate-100 p-10 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-teal-500" />
        </div>
        <p className="text-sm font-medium text-slate-700">No risks captured yet</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">Add your first risk to see it here</p>
        <Link
          href="/risks"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add a risk
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-panel shadow-card border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Top Risks</h2>
        <Link
          href="/risks"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Risk rows */}
      <div className="divide-y divide-slate-50">
        {risks.map((risk, idx) => {
          const band = appetite.getBand(risk.residualScore)
          const { bg, text } = bandToColorClasses(band)

          const barWidth = `${(risk.residualScore / 25) * 100}%`
          const barBg =
            band === 'CRITICAL' ? 'bg-red-500' :
            band === 'HIGH'     ? 'bg-orange-400' :
            band === 'MEDIUM'   ? 'bg-amber-400' :
            'bg-green-400'

          return (
            <Link
              key={risk.id}
              href={`/risks/${risk.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors group"
            >
              {/* Rank + score badge */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="text-xs font-medium text-slate-300 w-4 text-center">
                  {idx + 1}
                </span>
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
                  text, bg,
                )}>
                  {risk.residualScore}
                </div>
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                  {risk.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{risk.refCode}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400 capitalize">
                    {risk.category.toLowerCase().replace(/_/g, ' ')}
                  </span>
                  {risk.controlEffectiveness && risk.controlEffectiveness !== 'NOT_TESTED' && (
                    <>
                      <span className="text-slate-200">·</span>
                      <ControlEffectivenessBadge value={risk.controlEffectiveness} compact />
                    </>
                  )}
                </div>
              </div>

              {/* Score bar + VaR */}
              <div className="w-20 flex-shrink-0">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                    className={cn('h-full rounded-full transition-all', barBg)}
                    style={{ width: barWidth }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-right">
                  {risk.varValue
                    ? `R ${Number(risk.varValue).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
                    : `L${risk.residualLikelihood}×I${risk.residualImpact}`}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
