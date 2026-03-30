'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Loader2, Camera } from 'lucide-react'

export function SnapshotSettings() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureMsg, setCaptureMsg] = useState('')

  const { data: org, refetch: refetchOrg } = trpc.organisation.get.useQuery()
  const { data: snapshotsData, refetch: refetchSnapshots } = trpc.snapshots.list.useQuery({ limit: 10 })

  const updateOrg = trpc.organisation.update.useMutation({
    onSuccess: () => refetchOrg(),
  })

  const captureSnapshot = trpc.snapshots.capture.useMutation({
    onSuccess: () => {
      setCaptureMsg('Snapshot captured successfully')
      setIsCapturing(false)
      void refetchSnapshots()
      setTimeout(() => setCaptureMsg(''), 4000)
    },
    onError: (err) => {
      setCaptureMsg(`Failed: ${err.message}`)
      setIsCapturing(false)
      setTimeout(() => setCaptureMsg(''), 6000)
    },
  })

  const handleCaptureNow = () => {
    setIsCapturing(true)
    setCaptureMsg('')
    captureSnapshot.mutate()
  }

  const handleFrequencyChange = (value: 'WEEKLY' | 'MONTHLY') => {
    updateOrg.mutate({ snapshotFrequency: value })
  }

  const handleMaterialityChange = (value: string) => {
    const n = parseInt(value, 10)
    if (!isNaN(n) && n >= 1 && n <= 25) {
      updateOrg.mutate({ snapshotMateriality: n })
    }
  }

  // Shared styles matching settings-client.tsx pattern
  const cardClass = 'bg-slate-800 border border-slate-700 rounded-lg p-6'
  const labelClass = 'block text-sm font-medium text-teal-400 mb-1'
  const helperClass = 'mt-1 text-sm text-slate-400'
  const inputClass = 'w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
  const btnClass = 'flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50 transition-colors text-sm'

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className={cardClass}>
        <h3 className="text-base font-semibold text-white mb-4">Snapshot Configuration</h3>

        {/* Frequency */}
        <div className="mb-6">
          <label className={labelClass}>Automated Snapshot Frequency</label>
          <div className="space-y-2 mt-2">
            {(['WEEKLY', 'MONTHLY'] as const).map((freq) => (
              <label key={freq} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={(org?.snapshotFrequency ?? 'WEEKLY') === freq}
                  onChange={() => handleFrequencyChange(freq)}
                  disabled={updateOrg.isPending}
                  className="accent-teal-500"
                />
                <span className="text-sm text-slate-300">
                  {freq === 'WEEKLY' ? 'Weekly (every Sunday at 2:00 AM)' : 'Monthly (1st of month, 2:00 AM)'}
                </span>
              </label>
            ))}
          </div>
          <p className={helperClass}>Quarterly snapshots (Jan 1, Apr 1, Jul 1, Oct 1) are always captured automatically.</p>
        </div>

        {/* Materiality */}
        <div className="mb-6">
          <label className={labelClass}>Materiality Threshold</label>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-slate-400">±</span>
            <input
              type="number"
              min={1}
              max={25}
              value={org?.snapshotMateriality ?? 2}
              onChange={(e) => handleMaterialityChange(e.target.value)}
              onBlur={(e) => handleMaterialityChange(e.target.value)}
              disabled={updateOrg.isPending}
              className={inputClass}
            />
            <span className="text-sm text-slate-400">points</span>
          </div>
          <p className={helperClass}>
            Risk score changes at or above this value are flagged as material in Movement & Trends reports.
          </p>
        </div>

        {/* Manual capture */}
        <div className="border-t border-slate-700 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={labelClass}>Manual Snapshot</p>
              <p className={helperClass}>Capture the current risk state immediately, e.g. before a board meeting.</p>
            </div>
            <button onClick={handleCaptureNow} disabled={isCapturing} className={btnClass}>
              {isCapturing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Capture Now
                </>
              )}
            </button>
          </div>
          {captureMsg && (
            <p className={`mt-3 text-sm ${captureMsg.startsWith('Failed') ? 'text-red-400' : 'text-teal-400'}`}>
              {captureMsg}
            </p>
          )}
        </div>
      </div>

      {/* Snapshot History */}
      <div className={cardClass}>
        <h3 className="text-base font-semibold text-white mb-4">Snapshot History</h3>
        {!snapshotsData?.snapshots.length ? (
          <p className="text-sm text-slate-400">
            No snapshots captured yet. The first snapshot is created automatically when you create your first risk, or capture one manually above.
          </p>
        ) : (
          <div className="space-y-2">
            {snapshotsData.snapshots.map((snap) => (
              <div key={snap.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {new Date(snap.snapshotDate).toLocaleDateString('en-ZA', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-600 text-slate-300">
                      {snap.snapshotType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {snap.totalRisks} risks · VytlRx Score:{' '}
                    {snap.vytlScore != null ? `${snap.vytlScore} (${snap.vytlGrade ?? '–'})` : 'N/A'}
                    {snap.krisRed > 0 && (
                      <span className="ml-2 text-red-400">
                        · {snap.krisRed} KRI{snap.krisRed > 1 ? 's' : ''} in red
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(snap.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
