'use client'

import { trpc } from '@/lib/trpc-client'
import { CheckSquare } from 'lucide-react'
import Link from 'next/link'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-400',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-blue-400',
  LOW: 'text-slate-400',
}

export function ActionsOverviewWidget() {
  const { data, isLoading } = trpc.treatment.overdueSummary.useQuery()

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex items-center gap-2 flex-shrink-0">
          <CheckSquare className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-white">Actions</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  const total = data?.total ?? 0
  const hasOverdue = total > 0

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex items-center gap-2 flex-shrink-0">
        <CheckSquare className={`w-4 h-4 ${hasOverdue ? 'text-red-400' : 'text-green-400'}`} />
        <h3 className="text-sm font-semibold text-white">Actions</h3>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="text-center mb-3">
          <span className={`text-4xl font-bold ${hasOverdue ? 'text-red-400' : 'text-green-400'}`}>
            {total}
          </span>
          <p className="text-xs text-slate-400 mt-1">
            {hasOverdue ? 'overdue actions' : 'all on track'}
          </p>
        </div>

        {hasOverdue && data?.topItems && data.topItems.length > 0 && (
          <div className="space-y-1.5">
            {data.topItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-xs">
                <span className={`font-medium shrink-0 ${PRIORITY_COLORS[item.priority] ?? 'text-slate-400'}`}>
                  {item.priority}
                </span>
                <span className="text-slate-400 line-clamp-1">
                  {item.risk.refCode} — {item.risk.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-700/50 flex-shrink-0">
        <Link href="/actions" className="text-xs text-teal-400 hover:underline">
          View all actions →
        </Link>
      </div>
    </div>
  )
}
