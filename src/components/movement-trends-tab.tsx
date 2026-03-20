'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { TrendingUp, ArrowUp, ArrowDown, Plus, CheckCircle2 } from 'lucide-react'

interface MovementTrendsTabProps {
  // orgId comes from session — no prop needed; included for future flexibility
  className?: string
}

interface RiskMover {
  riskId: string
  refCode: string
  title: string
  category: string
  scoreThen: number
  scoreNow: number
  scoreDelta: number
}

interface CategoryChange {
  category: string
  countThen: number
  countNow: number
  countDelta: number
}

const PERIOD_OPTIONS = [
  { label: '3 Months', value: 3 },
  { label: '6 Months', value: 6 },
  { label: '12 Months', value: 12 },
]

export function MovementTrendsTab({ className = '' }: MovementTrendsTabProps) {
  const [periodMonths, setPeriodMonths] = useState(3)

  const { data: dataCheck, isLoading: checkLoading } = trpc.snapshots.checkDataAvailability.useQuery()
  const { data: movement, isLoading: moveLoading } = trpc.snapshots.compare.useQuery(
    { periodMonths },
    { enabled: dataCheck?.hasSufficientData === true }
  )

  const cardClass = 'bg-slate-800 border border-slate-700 rounded-lg p-6'
  const sectionTitle = 'text-base font-semibold text-white mb-4'
  const labelMuted = 'text-sm text-slate-400'
  const bigNum = 'text-3xl font-bold text-white'

  // Loading
  if (checkLoading || moveLoading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-slate-400">Loading movement data...</span>
      </div>
    )
  }

  // Insufficient data state
  if (!dataCheck?.hasSufficientData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className={cardClass}>
          <h2 className={sectionTitle}>Movement &amp; Trends</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Insufficient Data</h3>
            <p className="text-slate-400 max-w-md">
              {dataCheck?.earliestSnapshotDate ? (
                <>
                  Snapshot data available from{' '}
                  <span className="font-medium text-white">
                    {new Date(dataCheck.earliestSnapshotDate).toLocaleDateString('en-ZA', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  . Trend analysis requires at least 3 months of data.
                  {(dataCheck.monthsOfData ?? 0) > 0 && (
                    <> Currently {dataCheck.monthsOfData} month{dataCheck.monthsOfData !== 1 ? 's' : ''} collected.</>
                  )}
                </>
              ) : (
                <>
                  No snapshots captured yet. The first snapshot is created automatically on your first risk, or you can
                  trigger one manually in{' '}
                  <span className="text-teal-400">Settings → Snapshots</span>.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!movement?.hasSufficientData) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mv = movement as any

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })

  const deltaColour = (n: number | null | undefined, inverseGood = false) => {
    if (n == null) return 'text-slate-400'
    if (n === 0) return 'text-slate-400'
    const positive = n > 0
    const good = inverseGood ? !positive : positive
    return good ? 'text-green-400' : 'text-red-400'
  }

  const fmtDelta = (n: number | null | undefined, decimals = 1) => {
    if (n == null) return '–'
    return `${n > 0 ? '+' : ''}${n.toFixed(decimals)}`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Period Selector */}
      <div className={cardClass}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className={labelMuted}>
              Comparing {formatDate(mv.earliestDate)} → {formatDate(mv.latestDate)}
            </p>
          </div>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriodMonths(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  periodMonths === opt.value
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vytl Score Trajectory */}
      <div className={cardClass}>
        <h3 className={sectionTitle}>Vytl Score Trajectory</h3>
        <div className="flex items-start gap-8 flex-wrap">
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className={bigNum}>{mv.vytlScore.now ?? '–'}</span>
              <span className="text-xl text-slate-400">({mv.vytlScore.gradeNow ?? '–'})</span>
              {mv.vytlScore.change != null && (
                <span className={`text-lg font-medium ${deltaColour(mv.vytlScore.change)}`}>
                  {fmtDelta(mv.vytlScore.change, 0)}
                  {mv.vytlScore.changePercent != null && (
                    <span className="text-sm ml-1">({fmtDelta(mv.vytlScore.changePercent)}%)</span>
                  )}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {[
                { label: 'Risk Coverage', c: mv.vytlScore.components.coverage },
                { label: 'Control Effectiveness', c: mv.vytlScore.components.control },
                { label: 'Risk Maturity', c: mv.vytlScore.components.maturity },
                { label: 'Trend Direction', c: mv.vytlScore.components.trend },
              ].map(({ label, c }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className={labelMuted}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{c.now?.toFixed(1) ?? '–'}</span>
                    {c.change != null && (
                      <span className={`text-xs ${deltaColour(c.change)}`}>({fmtDelta(c.change)})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-sm text-slate-500">
            <p>Previously: {mv.vytlScore.then ?? '–'} ({mv.vytlScore.gradeThen ?? '–'})</p>
          </div>
        </div>
      </div>

      {/* Risk Movers */}
      <div className={cardClass}>
        <h3 className={sectionTitle}>Risk Movers</h3>
        <p className={`${labelMuted} mb-4`}>
          Material changes (±{/* materiality from org config — displayed inline */} points or greater)
        </p>

        {mv.riskMovers.increased.length === 0 &&
        mv.riskMovers.decreased.length === 0 &&
        mv.riskMovers.new.length === 0 &&
        mv.riskMovers.closed.length === 0 ? (
          <p className="text-slate-400 text-sm">No material risk movements detected in this period.</p>
        ) : (
          <div className="space-y-6">
            {mv.riskMovers.increased.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUp className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Increased (Concerning)</span>
                </div>
                <div className="space-y-2">
                  {mv.riskMovers.increased.map((m: RiskMover) => (
                    <div key={m.riskId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{m.refCode}: {m.title}</p>
                        <p className="text-xs text-slate-400">{m.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-400">+{m.scoreDelta} pts</p>
                        <p className="text-xs text-slate-400">{m.scoreThen} → {m.scoreNow}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mv.riskMovers.decreased.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Decreased (Improving)</span>
                </div>
                <div className="space-y-2">
                  {mv.riskMovers.decreased.map((m: RiskMover) => (
                    <div key={m.riskId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{m.refCode}: {m.title}</p>
                        <p className="text-xs text-slate-400">{m.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-400">{m.scoreDelta} pts</p>
                        <p className="text-xs text-slate-400">{m.scoreThen} → {m.scoreNow}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mv.riskMovers.new.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4 text-slate-300" />
                  <span className="text-sm font-medium text-slate-300">New Risks</span>
                </div>
                <div className="space-y-2">
                  {mv.riskMovers.new.map((m: RiskMover) => (
                    <div key={m.riskId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{m.refCode}: {m.title}</p>
                        <p className="text-xs text-slate-400">{m.category}</p>
                      </div>
                      <p className="text-xs text-slate-400">Score: {m.scoreNow}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mv.riskMovers.closed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Closed / Resolved</span>
                </div>
                <div className="space-y-2">
                  {mv.riskMovers.closed.map((m: RiskMover) => (
                    <div key={m.riskId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{m.refCode}: {m.title}</p>
                        <p className="text-xs text-slate-400">{m.category}</p>
                      </div>
                      <p className="text-xs text-slate-400">Was: {m.scoreThen}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KRI Breach Patterns */}
      <div className={cardClass}>
        <h3 className={sectionTitle}>KRI Breach Patterns</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={labelMuted}>KRIs in Red</p>
            <div className="flex items-baseline gap-2">
              <span className={bigNum}>{mv.kriBreach.redNow}</span>
              {mv.kriBreach.redDelta !== 0 && (
                <span className={`text-lg font-medium ${deltaColour(mv.kriBreach.redDelta, true)}`}>
                  {fmtDelta(mv.kriBreach.redDelta, 0)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={labelMuted}>Previously: {mv.kriBreach.redThen}</p>
            {mv.kriBreach.redPercentChange != null && (
              <p className={`text-sm font-medium ${deltaColour(mv.kriBreach.redPercentChange, true)}`}>
                {fmtDelta(mv.kriBreach.redPercentChange)}%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Treatment Velocity */}
      <div className={cardClass}>
        <h3 className={sectionTitle}>Treatment Velocity</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={labelMuted}>Completion Rate</p>
            <div className="flex items-baseline gap-2">
              <span className={bigNum}>
                {mv.treatmentCompletion.rateNow != null ? `${mv.treatmentCompletion.rateNow.toFixed(0)}%` : '–'}
              </span>
              {mv.treatmentCompletion.rateDelta != null && (
                <span className={`text-lg font-medium ${deltaColour(mv.treatmentCompletion.rateDelta)}`}>
                  {fmtDelta(mv.treatmentCompletion.rateDelta)}%
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={labelMuted}>
              Previously:{' '}
              {mv.treatmentCompletion.rateThen != null
                ? `${mv.treatmentCompletion.rateThen.toFixed(0)}%`
                : '–'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Evolution */}
      {mv.categoryChanges.length > 0 && (
        <div className={cardClass}>
          <h3 className={sectionTitle}>Category Evolution</h3>
          <div className="space-y-2">
            {mv.categoryChanges.map((cat: CategoryChange) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <span className={labelMuted}>{cat.category}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">{cat.countThen} → {cat.countNow}</span>
                  <span
                    className={`font-medium w-12 text-right ${
                      cat.countDelta > 0
                        ? 'text-red-400'
                        : cat.countDelta < 0
                        ? 'text-green-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {cat.countDelta > 0 ? `+${cat.countDelta}` : cat.countDelta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
