'use client'

import { trpc } from '@/lib/trpc-client'
import { ClipboardCheck } from 'lucide-react'

export function ComplianceCoverageWidget() {
  const { data: coverage, isLoading } = trpc.regulatory.coverage.useQuery({})

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Compliance Coverage</h3>
        </div>
        <div className="flex-1 p-3 space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isOverall = coverage && 'frameworks' in coverage
  const overallPercent = isOverall ? coverage.overallPercent : 0
  const frameworks = isOverall ? coverage.frameworks : []

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Compliance Coverage</h3>
          <span className={`text-lg font-bold ${
            overallPercent >= 80 ? 'text-green-400' :
            overallPercent >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {overallPercent}%
          </span>
        </div>
      </div>

      {frameworks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <ClipboardCheck className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No mappings yet</p>
            <p className="text-slate-500 text-[10px] mt-1">Map risks to regulatory requirements</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-3 space-y-3">
          {frameworks.map((fw) => (
            <div key={fw.frameworkId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">{fw.frameworkName}</span>
                <span className={`text-xs font-medium ${
                  fw.coveragePercent >= 80 ? 'text-green-400' :
                  fw.coveragePercent >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {fw.coveragePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    fw.coveragePercent >= 80 ? 'bg-green-500' :
                    fw.coveragePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${fw.coveragePercent}%` }}
                />
              </div>
              <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
                <span>{fw.mappedRequirements}/{fw.totalRequirements}</span>
                {fw.byStatus.COMPLIANT > 0 && (
                  <span className="text-green-400">{fw.byStatus.COMPLIANT} ok</span>
                )}
                {fw.byStatus.NON_COMPLIANT > 0 && (
                  <span className="text-red-400">{fw.byStatus.NON_COMPLIANT} gaps</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
