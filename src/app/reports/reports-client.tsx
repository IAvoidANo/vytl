'use client'

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

type Tab = 'executive' | 'overview' | 'top10' | 'heatmap' | 'trends' | 'recommendations' | 'kri'

const tabs: { id: Tab; label: string }[] = [
  { id: 'executive', label: 'Executive Summary' },
  { id: 'overview', label: 'Risk Overview' },
  { id: 'top10', label: 'Top 10 Risks' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'trends', label: 'Category Trends' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'kri', label: 'KRI Status' },
]

const CATEGORY_LABELS: Record<string, string> = {
  STRATEGIC: 'Strategic',
  OPERATIONAL: 'Operational',
  FINANCIAL: 'Financial',
  COMPLIANCE: 'Compliance',
  TECHNOLOGY: 'Technology',
  REPUTATIONAL: 'Reputational',
  ENVIRONMENTAL: 'Environmental',
  PEOPLE: 'People',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  MONITORING: 'Monitoring',
  CLOSED: 'Closed',
}

function getRiskLevel(score: number): string {
  if (score >= 20) return 'critical'
  if (score >= 15) return 'high'
  if (score >= 8) return 'medium'
  return 'low'
}

const HEATMAP_COLORS: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
  critical: 'bg-red-700',
}

const HEATMAP_PRINT_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#b91c1c',
}

export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('executive')

  // Data fetching (same as board-report-modal)
  const { data: org } = trpc.organisation.get.useQuery()
  const { data: riskStats } = trpc.risk.stats.useQuery()
  const { data: topRisks } = trpc.risk.topRisks.useQuery({ limit: 10 })
  const { data: risks } = trpc.risk.list.useQuery()
  const { data: kris } = trpc.kri.list.useQuery()
  const { data: assessment } = trpc.assessment.current.useQuery()
  const { data: categoryTrends } = trpc.scoring.getCategoryTrends.useQuery(
    { daysBack: 90 },
    { retry: false }
  )
  const { data: recommendations } = trpc.scoring.getRecommendations.useQuery(
    undefined,
    { retry: false }
  )

  const dataReady = org && riskStats && topRisks && risks

  const dateStr = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider'
  const tdClass = 'px-4 py-3 text-sm text-slate-300'

  return (
    <div className="p-6 text-white">
      {/* Header with Print button */}
      <div className="mb-6 flex items-center justify-between print-hide">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400">Board governance reports</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      {/* Report Header (visible on screen and print) */}
      <div className="mb-6 print-header">
        <div className="print-only hidden">
          <h1 className="text-2xl font-bold">{org?.name || 'Organisation'}</h1>
          <p className="text-sm text-slate-400">{dateStr}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6 print-hide">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading state */}
      {!dataReady && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400 mr-3" />
          <span className="text-slate-400">Loading report data...</span>
        </div>
      )}

      {/* Report content (print region) */}
      {dataReady && (
        <div className="print-content">
          {/* Print-only header */}
          <div className="hidden print-block mb-8">
            <h1 className="text-3xl font-bold text-slate-900">{org.name}</h1>
            <p className="text-slate-500 mt-1">Board Risk Report — {dateStr}</p>
            <hr className="mt-4 border-slate-300" />
          </div>

          {/* Executive Summary */}
          {activeTab === 'executive' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Executive Summary & Vytl Score</h2>

              {/* Vytl Score Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Vytl Score</p>
                    {assessment?.vytlScore ? (
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-bold text-teal-400">{assessment.vytlScore}</span>
                        <span className="text-2xl font-semibold text-slate-300">
                          Grade: {assessment.vytlGrade || 'N/A'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xl text-slate-500">Not yet calculated</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <p className="text-sm text-slate-400">Total Risks</p>
                  <p className="text-3xl font-bold text-white mt-1">{riskStats.total}</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <p className="text-sm text-slate-400">High Risk Items</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{riskStats.highRisks}</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                  <p className="text-sm text-slate-400">KRIs in Red</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">
                    {(kris || []).filter((k) => k.status === 'RED').length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Risk Overview</h2>

              {/* By Status */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">By Status</h3>
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Count</th>
                        <th className={thClass}>%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {Object.entries(riskStats.byStatus).map(([status, count]) => (
                        <tr key={status}>
                          <td className={tdClass}>{STATUS_LABELS[status] || status}</td>
                          <td className={tdClass}>{count}</td>
                          <td className={tdClass}>
                            {riskStats.total > 0 ? Math.round((count / riskStats.total) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Category */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">By Category</h3>
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Count</th>
                        <th className={thClass}>%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {Object.entries(riskStats.byCategory).map(([cat, count]) => (
                        <tr key={cat}>
                          <td className={tdClass}>{CATEGORY_LABELS[cat] || cat}</td>
                          <td className={tdClass}>{count}</td>
                          <td className={tdClass}>
                            {riskStats.total > 0 ? Math.round((count / riskStats.total) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Top 10 Risks */}
          {activeTab === 'top10' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Top 10 Risks</h2>

              {topRisks.length > 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className={thClass}>Ref</th>
                        <th className={thClass}>Title</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Score</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {topRisks.map((risk) => (
                        <tr key={risk.refCode}>
                          <td className={`${tdClass} font-mono text-teal-400`}>{risk.refCode}</td>
                          <td className={tdClass}>{risk.title}</td>
                          <td className={tdClass}>{CATEGORY_LABELS[risk.category] || risk.category}</td>
                          <td className={tdClass}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              risk.residualScore >= 20 ? 'bg-red-500/20 text-red-400' :
                              risk.residualScore >= 15 ? 'bg-red-500/10 text-red-300' :
                              risk.residualScore >= 8 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {risk.residualScore}
                            </span>
                          </td>
                          <td className={tdClass}>{STATUS_LABELS[risk.status] || risk.status}</td>
                          <td className={tdClass}>{risk.owner?.name || 'Unassigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500">No risks recorded.</p>
              )}
            </div>
          )}

          {/* Heatmap */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">5×5 Risk Heatmap</h2>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <HeatmapGrid risks={risks} />
              </div>
            </div>
          )}

          {/* Category Trends */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Category Trends</h2>

              {(categoryTrends || []).length > 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Count</th>
                        <th className={thClass}>Avg Score</th>
                        <th className={thClass}>Direction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {(categoryTrends || []).map((t) => (
                        <tr key={t.category}>
                          <td className={tdClass}>{CATEGORY_LABELS[t.category] || t.category}</td>
                          <td className={tdClass}>{t.count}</td>
                          <td className={tdClass}>{t.avgScore}</td>
                          <td className={tdClass}>
                            <span className={`inline-flex items-center gap-1 ${
                              t.direction === 'improving' ? 'text-green-400' :
                              t.direction === 'worsening' ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              {t.direction === 'improving' ? '↓' : t.direction === 'worsening' ? '↑' : '→'}
                              {' '}
                              {t.direction === 'improving' ? 'Improving' : t.direction === 'worsening' ? 'Worsening' : 'Stable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500">No trend data available.</p>
              )}
            </div>
          )}

          {/* Recommendations */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Scoring Recommendations</h2>

              {(recommendations || []).length > 0 ? (
                <div className="space-y-3">
                  {(recommendations || []).slice(0, 10).map((r, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        r.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        r.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                      </span>
                      <p className="text-sm text-slate-300">{r.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No recommendations at this time.</p>
              )}
            </div>
          )}

          {/* KRI Status */}
          {activeTab === 'kri' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">KRI Status Dashboard</h2>

              {(kris || []).length > 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className={thClass}>KRI Name</th>
                        <th className={thClass}>Current</th>
                        <th className={thClass}>Green</th>
                        <th className={thClass}>Amber</th>
                        <th className={thClass}>Red</th>
                        <th className={thClass}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {(kris || []).map((kri) => (
                        <tr key={kri.id}>
                          <td className={tdClass}>{kri.name}</td>
                          <td className={tdClass}>{kri.currentValue != null ? String(kri.currentValue) : 'N/A'}</td>
                          <td className={tdClass}>{String(kri.thresholdGreen)}</td>
                          <td className={tdClass}>{String(kri.thresholdAmber)}</td>
                          <td className={tdClass}>{String(kri.thresholdRed)}</td>
                          <td className={tdClass}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              kri.status === 'GREEN' ? 'bg-green-500/20 text-green-400' :
                              kri.status === 'AMBER' ? 'bg-amber-500/20 text-amber-400' :
                              kri.status === 'RED' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {kri.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500">No KRIs configured.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Heatmap component
function HeatmapGrid({ risks }: { risks: { residualLikelihood: number; residualImpact: number }[] }) {
  // Build 5x5 grid
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0))
  for (const r of risks) {
    const li = Math.min(5, Math.max(1, r.residualLikelihood)) - 1
    const im = Math.min(5, Math.max(1, r.residualImpact)) - 1
    grid[li][im]++
  }

  return (
    <div className="flex items-end gap-4">
      {/* Y-axis label */}
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-xs text-slate-400 writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          Likelihood
        </span>
      </div>

      <div>
        {/* Grid rows (5 = top, 1 = bottom) */}
        <div className="inline-grid grid-cols-[auto_repeat(5,_3rem)] gap-0.5">
          {[5, 4, 3, 2, 1].map((li) => (
            <>
              {/* Row label */}
              <div key={`label-${li}`} className="flex items-center justify-center w-6 text-xs text-slate-400">
                {li}
              </div>
              {[1, 2, 3, 4, 5].map((im) => {
                const count = grid[li - 1][im - 1]
                const score = li * im
                const level = getRiskLevel(score)
                return (
                  <div
                    key={`${li}-${im}`}
                    className={`w-12 h-12 ${HEATMAP_COLORS[level]} flex items-center justify-center rounded-sm`}
                    style={{ backgroundColor: HEATMAP_PRINT_COLORS[level] }}
                  >
                    {count > 0 && (
                      <span className="text-white text-sm font-semibold">{count}</span>
                    )}
                  </div>
                )
              })}
            </>
          ))}
          {/* Column labels */}
          <div />
          {[1, 2, 3, 4, 5].map((im) => (
            <div key={`col-${im}`} className="flex items-center justify-center text-xs text-slate-400">
              {im}
            </div>
          ))}
        </div>

        {/* X-axis label */}
        <div className="text-center mt-2">
          <span className="text-xs text-slate-400">Impact</span>
        </div>
      </div>
    </div>
  )
}
