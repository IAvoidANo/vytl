'use client'

import { useState } from 'react'
import { Info, X, Check, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'

const INDUSTRY_LABELS: Record<string, string> = {
  MANUFACTURING: 'Manufacturing & Production',
  FINANCIAL_SERVICES: 'Financial Services',
  RETAIL: 'Retail & Consumer',
}

export function SampleDataBanner() {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: status } = trpc.template.getSampleModeStatus.useQuery(undefined, {
    // Refresh after mutations that change sample mode
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })

  const exitMutation = trpc.template.exitSampleMode.useMutation({
    onSuccess: () => router.refresh(),
  })

  const clearMutation = trpc.template.clearSampleData.useMutation({
    onSuccess: () => {
      router.push('/dashboard')
      router.refresh()
    },
  })

  // Not in sample mode, or dismissed for this session
  if (!status?.isInSampleMode || isDismissed) return null

  const industryLabel = status.industry
    ? (INDUSTRY_LABELS[status.industry] ?? status.industry)
    : 'your industry'

  const isBusy = exitMutation.isPending || clearMutation.isPending

  return (
    <>
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-b-2 border-amber-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Message */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="bg-amber-200 rounded-full p-1.5 mt-0.5 flex-shrink-0">
                <Info className="h-4 w-4 text-amber-700" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-amber-900 text-sm">
                  You&rsquo;re viewing sample data for {industryLabel}
                </p>
                <p className="text-amber-700 text-sm mt-0.5">
                  Edit any risk to make it yours, or choose an action below
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Make This My Data */}
              <button
                onClick={() => exitMutation.mutate()}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
              >
                {exitMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {exitMutation.isPending ? 'Converting…' : 'Make This My Data'}
              </button>

              {/* Start Fresh */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 disabled:opacity-60 text-amber-800 text-sm font-medium rounded-md border border-amber-300 hover:border-amber-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Start Fresh
              </button>

              {/* Dismiss (session-only) */}
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 hover:bg-amber-200 rounded transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4 text-amber-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete all sample data?
            </h3>
            <p className="text-slate-600 text-sm mb-3">
              This will permanently delete all {industryLabel} template data:
            </p>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mb-4">
              <li>All 15 sample risks (and their incidents, treatments, mappings)</li>
              <li>Risk register and snapshot data</li>
              <li>Your current VytlRx Score assessment</li>
            </ul>
            <p className="text-sm font-medium text-slate-900 mb-6">
              You&rsquo;ll return to an empty dashboard to add your own data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={clearMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-md transition-colors"
              >
                {clearMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {clearMutation.isPending ? 'Deleting…' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
