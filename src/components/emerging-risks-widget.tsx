'use client'

import { trpc } from '@/lib/trpc-client'
import { ArrowRight, Inbox } from 'lucide-react'
import Link from 'next/link'

export function EmergingRisksWidget() {
  const { data } = trpc.risk.emergingRisksCount.useQuery()
  const count = data?.count ?? 0

  if (count === 0) return null

  return (
    <Link
      href="/workspace"
      className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Inbox className="h-4 w-4 text-slate-400" />
        <span className="text-slate-400">Emerging risks awaiting review</span>
        <span className="font-semibold text-white">{count}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  )
}
