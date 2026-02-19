'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Shield, Info, ChevronDown, ChevronUp } from 'lucide-react'
import {
  DEFAULT_APPETITE_THRESHOLDS,
  RISK_CATEGORIES,
  CATEGORY_LABELS,
  buildHeatmapLegend,
  bandToColorClasses,
  type AppetiteThresholds,
  type RiskCategory,
} from '@/lib/appetite-validation'

export function AppetiteSettings() {
  const [statement, setStatement] = useState('')
  const [low, setLow] = useState<number>(DEFAULT_APPETITE_THRESHOLDS.low)
  const [medium, setMedium] = useState<number>(DEFAULT_APPETITE_THRESHOLDS.medium)
  const [high, setHigh] = useState<number>(DEFAULT_APPETITE_THRESHOLDS.high)
  const [categoryOverrides, setCategoryOverrides] = useState<
    Record<string, { enabled: boolean; low: number; medium: number; high: number }>
  >({})
  const [showCategoryOverrides, setShowCategoryOverrides] = useState(false)
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const { data: rawAppetite, refetch } = trpc.appetite.get.useQuery()
  const appetite = rawAppetite as { appetiteStatement: string | null; appetiteLow: number; appetiteMedium: number; appetiteHigh: number; appetiteCategoryConfig: Record<string, AppetiteThresholds> | null } | undefined
  const { data: breachSummary } = trpc.appetite.breachSummary.useQuery()

  const updateAppetite = trpc.appetite.update.useMutation({
    onSuccess: () => {
      setSaved(true)
      refetch()
      setTimeout(() => setSaved(false), 3000)
    },
  })

  // Initialize form from fetched data
  useEffect(() => {
    if (appetite && !initialized) {
      setStatement(appetite.appetiteStatement ?? '')
      setLow(appetite.appetiteLow)
      setMedium(appetite.appetiteMedium)
      setHigh(appetite.appetiteHigh)

      const catConfig = appetite.appetiteCategoryConfig as Record<string, AppetiteThresholds> | null
      if (catConfig) {
        const overrides: Record<string, { enabled: boolean; low: number; medium: number; high: number }> = {}
        for (const [cat, t] of Object.entries(catConfig)) {
          overrides[cat] = { enabled: true, low: t.low, medium: t.medium, high: t.high }
        }
        setCategoryOverrides(overrides)
        if (Object.keys(overrides).length > 0) setShowCategoryOverrides(true)
      }

      setInitialized(true)
    }
  }, [appetite, initialized])

  const handleSave = () => {
    const catConfig: Record<string, { low: number; medium: number; high: number }> = {}
    for (const [cat, val] of Object.entries(categoryOverrides)) {
      if (val.enabled) {
        catConfig[cat] = { low: val.low, medium: val.medium, high: val.high }
      }
    }

    updateAppetite.mutate({
      appetiteStatement: statement || null,
      appetiteLow: low,
      appetiteMedium: medium,
      appetiteHigh: high,
      appetiteCategoryConfig: Object.keys(catConfig).length > 0 ? catConfig : undefined,
    })
  }

  const thresholdError = low >= medium || medium >= high
  const legend = buildHeatmapLegend({ low, medium, high })
  const breachTotal = breachSummary?.total ?? 0

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-teal-300 font-medium">Risk Appetite Configuration</p>
          <p className="text-xs text-slate-400 mt-1">
            Risk Appetite defines the maximum level of residual risk your organisation is willing to accept,
            as required by King V Principle 11 and ISO 31000:2018. These thresholds determine how risk scores
            are colour-coded across the entire platform.
          </p>
        </div>
      </div>

      {/* Breach Summary */}
      <div className={`rounded-lg border p-4 ${
        breachTotal > 0
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-green-500/10 border-green-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <Shield className={`w-5 h-5 ${breachTotal > 0 ? 'text-red-400' : 'text-green-400'}`} />
          <div>
            <p className={`text-sm font-medium ${breachTotal > 0 ? 'text-red-300' : 'text-green-300'}`}>
              {breachTotal === 0
                ? 'All risks are within appetite'
                : `${breachTotal} risk${breachTotal === 1 ? '' : 's'} exceed${breachTotal === 1 ? 's' : ''} appetite`}
            </p>
            {breachTotal > 0 && breachSummary?.byCategory && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(breachSummary.byCategory).map(([cat, count]) => (
                  <span key={cat} className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                    {CATEGORY_LABELS[cat as RiskCategory] ?? cat}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appetite Statement */}
      <div>
        <label className="block text-sm font-medium text-teal-400 mb-2">
          Board Appetite Statement
        </label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="e.g. The board accepts operational risks with residual scores up to Medium level. Compliance risks must remain within Low tolerance..."
          rows={4}
          maxLength={2000}
          className="w-full bg-slate-700 text-white text-sm rounded-md border border-slate-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">{statement.length}/2000 characters</p>
      </div>

      {/* Threshold Configuration */}
      <div>
        <label className="block text-sm font-medium text-teal-400 mb-3">
          L×I Score Threshold Bands
        </label>
        <p className="text-xs text-slate-400 mb-4">
          Set the breakpoints for classifying residual risk scores (1-25 scale).
          These thresholds apply to the heatmap, score badges, and breach detection across the platform.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Low (within appetite) ≤</label>
            <input
              type="number"
              min={1}
              max={23}
              value={low}
              onChange={(e) => setLow(Number(e.target.value))}
              className="w-full bg-slate-700 text-white text-sm rounded-md border border-slate-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Medium (near appetite) ≤</label>
            <input
              type="number"
              min={2}
              max={24}
              value={medium}
              onChange={(e) => setMedium(Number(e.target.value))}
              className="w-full bg-slate-700 text-white text-sm rounded-md border border-slate-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">High (approaching limit) ≤</label>
            <input
              type="number"
              min={3}
              max={24}
              value={high}
              onChange={(e) => setHigh(Number(e.target.value))}
              className="w-full bg-slate-700 text-white text-sm rounded-md border border-slate-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {thresholdError && (
          <p className="text-xs text-red-400 mt-2">
            Thresholds must be in ascending order: Low &lt; Medium &lt; High
          </p>
        )}

        {/* Live preview band strip */}
        <div className="mt-4 flex gap-1">
          {legend.map(({ band, label, range }) => {
            const { bg, text, border } = bandToColorClasses(band)
            return (
              <div
                key={band}
                className={`flex-1 ${bg} border ${border} rounded p-2 text-center`}
              >
                <p className={`text-xs font-medium ${text}`}>{label}</p>
                <p className="text-xs text-slate-400">{range}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-Category Overrides */}
      <div>
        <button
          onClick={() => setShowCategoryOverrides(!showCategoryOverrides)}
          className="flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
        >
          Per-Category Tolerance Overrides
          {showCategoryOverrides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <p className="text-xs text-slate-400 mt-1">
          Optionally set stricter or looser thresholds for specific risk categories.
        </p>

        {showCategoryOverrides && (
          <div className="mt-4 space-y-3">
            {RISK_CATEGORIES.map((cat) => {
              const override = categoryOverrides[cat] ?? { enabled: false, low: 3, medium: 6, high: 9 }
              return (
                <div key={cat} className="bg-slate-700/50 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={override.enabled}
                      onChange={(e) => {
                        setCategoryOverrides({
                          ...categoryOverrides,
                          [cat]: { ...override, enabled: e.target.checked },
                        })
                      }}
                      className="rounded border-slate-500 bg-slate-600 text-teal-500 focus:ring-teal-500"
                    />
                    <span className="text-sm text-white">{CATEGORY_LABELS[cat]}</span>
                  </label>

                  {override.enabled && (
                    <div className="grid grid-cols-3 gap-3 mt-3 pl-6">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Low ≤</label>
                        <input
                          type="number"
                          min={1}
                          max={23}
                          value={override.low}
                          onChange={(e) => setCategoryOverrides({
                            ...categoryOverrides,
                            [cat]: { ...override, low: Number(e.target.value) },
                          })}
                          className="w-full bg-slate-600 text-white text-sm rounded border border-slate-500 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Medium ≤</label>
                        <input
                          type="number"
                          min={2}
                          max={24}
                          value={override.medium}
                          onChange={(e) => setCategoryOverrides({
                            ...categoryOverrides,
                            [cat]: { ...override, medium: Number(e.target.value) },
                          })}
                          className="w-full bg-slate-600 text-white text-sm rounded border border-slate-500 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">High ≤</label>
                        <input
                          type="number"
                          min={3}
                          max={24}
                          value={override.high}
                          onChange={(e) => setCategoryOverrides({
                            ...categoryOverrides,
                            [cat]: { ...override, high: Number(e.target.value) },
                          })}
                          className="w-full bg-slate-600 text-white text-sm rounded border border-slate-500 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={thresholdError || updateAppetite.isPending}
          className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {updateAppetite.isPending ? 'Saving...' : 'Save Appetite Configuration'}
        </button>
        {saved && (
          <span className="text-sm text-green-400">Saved successfully</span>
        )}
        {updateAppetite.isError && (
          <span className="text-sm text-red-400">{updateAppetite.error.message}</span>
        )}
      </div>
    </div>
  )
}
