'use client'

import { trpc } from '@/lib/trpc-client'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import { CATEGORY_LABELS, type RiskCategory } from '@/lib/appetite-validation'

export function AppetiteBreachWidget() {
  const { data: breachSummary, isLoading } = trpc.appetite.breachSummary.useQuery()

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex items-center gap-2 flex-shrink-0">
          <Shield className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-white">Risk Appetite</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  const hasBreaches = (breachSummary?.total ?? 0) > 0
  const categories = breachSummary?.byCategory
    ? Object.entries(breachSummary.byCategory).sort(([, a], [, b]) => b - a)
    : []

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex items-center gap-2 flex-shrink-0">
        <Shield className={`w-4 h-4 ${hasBreaches ? 'text-red-400' : 'text-green-400'}`} />
        <h3 className="text-sm font-semibold text-white">Risk Appetite</h3>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="text-center mb-3">
          <span className={`text-4xl font-bold ${hasBreaches ? 'text-red-400' : 'text-green-400'}`}>
            {breachSummary?.total ?? 0}
          </span>
          <p className="text-xs text-slate-400 mt-1">
            {hasBreaches ? 'risks exceed appetite' : 'all within appetite'}
          </p>
        </div>

        {hasBreaches && categories.length > 0 && (
          <div className="space-y-1.5">
            {categories.slice(0, 4).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{CATEGORY_LABELS[cat as RiskCategory] ?? cat}</span>
                <span className="text-red-400 font-medium">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-700/50 flex-shrink-0">
        <Link href="/settings" className="text-xs text-teal-400 hover:underline">
          Configure appetite
        </Link>
      </div>
    </div>
  )
}
