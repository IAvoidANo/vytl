'use client'

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { MovementTrendsTab } from '@/components/movement-trends-tab'
import { useAppetite } from '@/lib/use-appetite'
import { getRiskBand, BAND_PRINT_COLOURS } from '@/lib/risk-colour-mapping'
import { bandToHeatmapClasses, bandToBadgeClasses } from '@/lib/appetite-validation'

type Tab = 'summary' | 'overview' | 'top10' | 'trends' | 'movement'

const tabs: { id: Tab; label: string }[] = [
  { id: 'summary',  label: 'Summary' },
  { id: 'overview', label: 'Risk Overview' },
  { id: 'top10',    label: 'Top 10 Risks' },
  { id: 'trends',   label: 'Category Trends & KRI' },
  { id: 'movement', label: 'Movement & Trends' },
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


export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const appetite = useAppetite()

  // Data fetching (same as board-report-modal)
  const { data: org } = trpc.organisation.get.useQuery()
  const { data: riskStats } = trpc.risk.stats.useQuery()
  const { data: topRisks } = trpc.risk.topRisks.useQuery({ limit: 10 })
  const { data: risks } = trpc.risk.list.useQuery()
  const { data: kris } = trpc.kri.list.useQuery()
  const { data: assessment } = trpc.assessment.current.useQuery()
  const { data: categoryTrends } = trpc.scoring.getCategoryTrends.useQuery(
    undefined,
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

  // ── Derived metrics for summaries ──────────────────────────────────────────
  const krisRed    = (kris || []).filter((k) => k.status === 'RED').length
  const krisAmber  = (kris || []).filter((k) => k.status === 'AMBER').length
  const krisGreen  = (kris || []).filter((k) => k.status === 'GREEN').length
  const krisTotal  = (kris || []).length

  const vytlScore  = assessment?.vytlScore ?? null
  const vytlGrade  = assessment?.vytlGrade ?? null

  const scoreHealth =
    vytlScore === null ? null :
    vytlScore >= 80    ? 'strong'  :
    vytlScore >= 60    ? 'acceptable' :
    vytlScore >= 40    ? 'moderate' : 'challenged'

  const openCount       = riskStats?.byStatus?.OPEN ?? 0
  const inProgressCount = riskStats?.byStatus?.IN_PROGRESS ?? 0
  const monitoringCount = riskStats?.byStatus?.MONITORING ?? 0
  const total           = riskStats?.total ?? 0

  const topCategory = riskStats
    ? Object.entries(riskStats.byCategory).sort((a, b) => b[1] - a[1])[0]
    : null
  const topCategoryLabel = topCategory ? (CATEGORY_LABELS[topCategory[0]] || topCategory[0]) : null
  const topCategoryCount = topCategory?.[1] ?? 0
  const topCategoryPct   = total > 0 && topCategoryCount ? Math.round((topCategoryCount / total) * 100) : 0
  const categoryCount    = riskStats ? Object.keys(riskStats.byCategory).filter((c) => riskStats.byCategory[c] > 0).length : 0

  const criticalRisks = (topRisks || []).filter((r) => appetite.getBand(r.residualScore) === 'CRITICAL')
  const unassignedTop = (topRisks || []).filter((r) => !r.owner?.name).length

  const worseningCats  = (categoryTrends || []).filter((t) => t.direction === 'worsening')
  const improvingCats  = (categoryTrends || []).filter((t) => t.direction === 'improving')
  const highestAvgCat  = (categoryTrends || []).sort((a, b) => b.averageScore - a.averageScore)[0]

  const recCritical = (recommendations || []).filter((r) => r.severity === 'critical').length
  const recWarning  = (recommendations || []).filter((r) => r.severity === 'warning').length
  const recInfo     = (recommendations || []).filter((r) => r.severity === 'info').length

  // Shared style helpers
  const thClass  = 'px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider'
  const tdClass  = 'px-4 py-3 text-sm text-slate-300'
  const sumCard  = 'bg-slate-800/50 border border-slate-700/60 rounded-lg p-5 space-y-3'
  const sumPara  = 'text-sm text-slate-300 leading-relaxed'

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

          {/* Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Executive Summary & VytlRx Score</h2>

              <div className={sumCard}>
                <p className={sumPara}>
                  This report presents the risk governance posture of <strong className="text-white">{org.name}</strong> as at <strong className="text-white">{dateStr}</strong>. It has been prepared for board-level review and consolidates the organisation&apos;s full residual risk exposure, control effectiveness assessments, Key Risk Indicator (KRI) performance, and trend analysis across all registered risk categories.
                </p>
                {vytlScore !== null ? (
                  <p className={sumPara}>
                    The organisation&apos;s current <strong className="text-white">VytlRx Score is {vytlScore} (Grade {vytlGrade})</strong>, reflecting a{' '}
                    {scoreHealth === 'strong'     && 'strong and well-governed risk environment. Controls are operating effectively and the portfolio is well-monitored. Continued focus on maintaining coverage and maturity is recommended.'}
                    {scoreHealth === 'acceptable' && 'generally sound risk posture with room for improvement. Core governance practices are in place; however, targeted enhancements to control effectiveness and risk coverage would further strengthen the position.'}
                    {scoreHealth === 'moderate'   && 'risk posture that warrants management attention. While foundational governance structures are present, material gaps in control effectiveness, maturity, or risk coverage have been identified and should be addressed as a priority.'}
                    {scoreHealth === 'challenged' && 'risk posture that requires urgent corrective action. Significant weaknesses in governance coverage, control effectiveness, or monitoring have been identified. The board should direct management to develop and implement remediation plans as a matter of priority.'}
                  </p>
                ) : (
                  <p className={sumPara}>
                    No VytlRx Score has been calculated yet. An assessment should be run to establish the organisation&apos;s baseline risk governance score.
                  </p>
                )}
                <p className={sumPara}>
                  The register currently holds <strong className="text-white">{total} risks</strong> across {categoryCount} categories.{' '}
                  {riskStats?.highRisks ? <><strong className="text-white">{riskStats.highRisks}</strong> risks are rated above the medium severity threshold and warrant active board oversight.</> : 'No risks are currently rated above the medium severity threshold.'}{' '}
                  {krisTotal > 0
                    ? <>{krisRed > 0 ? <><strong className="text-red-400">{krisRed} KRI{krisRed !== 1 ? 's' : ''}</strong> {krisRed === 1 ? 'has' : 'have'} breached the red threshold, indicating potential risk materialisation.</> : 'All monitored KRIs are within acceptable thresholds.'} {krisAmber > 0 && <>{krisAmber} KRI{krisAmber !== 1 ? 's' : ''} {krisAmber === 1 ? 'is' : 'are'} in amber caution and should be monitored closely.</>}</>
                    : 'No KRIs have been configured for this period.'}
                </p>
              </div>

              {/* VytlRx Score Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">VytlRx Score</p>
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

              {/* Recommendations (merged) */}
              <div className="pt-2">
                <h2 className="text-lg font-semibold text-white mb-4">Risk Intelligence Recommendations</h2>

                <div className={sumCard}>
                  <p className={sumPara}>
                    The recommendations below are generated by VytlRx&apos;s risk intelligence engine, which continuously analyses the organisation&apos;s risk register for scoring inconsistencies, coverage gaps, control weaknesses, and KRI alignment issues.
                  </p>
                  {(recommendations || []).length > 0 ? (
                    <p className={sumPara}>
                      There are currently{' '}
                      {recCritical > 0 && <><strong className="text-red-400">{recCritical} critical</strong>{(recWarning > 0 || recInfo > 0) ? ', ' : ' '}</>}
                      {recWarning > 0  && <><strong className="text-amber-400">{recWarning} warning</strong>{recInfo > 0 ? ', and ' : ' '}</>}
                      {recInfo > 0     && <><strong className="text-blue-400">{recInfo} informational</strong> </>}
                      recommendation{(recCritical + recWarning + recInfo) !== 1 ? 's' : ''} outstanding.{' '}
                      {recCritical > 0
                        ? 'Critical items represent material deficiencies that could lead to an inaccurate assessment of the organisation\'s risk posture and should be addressed as an immediate priority.'
                        : recWarning > 0
                        ? 'Warning-level items indicate emerging concerns that should be addressed within the current reporting period.'
                        : 'No critical or warning-level issues are outstanding.'}
                    </p>
                  ) : (
                    <p className={sumPara}>No recommendations have been generated at this time, indicating that the risk register is well-structured and consistently maintained.</p>
                  )}
                </div>

                {(recommendations || []).length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {(recommendations || []).slice(0, 10).map((r, i) => (
                      <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          r.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          r.severity === 'warning'  ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                        </span>
                        <p className="text-sm text-slate-300">{r.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 mt-4">No recommendations at this time.</p>
                )}
              </div>
            </div>
          )}

          {/* Risk Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Risk Overview</h2>

              <div className={sumCard}>
                <p className={sumPara}>
                  This section provides a portfolio-level breakdown of the organisation&apos;s <strong className="text-white">{total} registered risks</strong> by lifecycle status and business category. Understanding the distribution of risks across these dimensions enables management and the board to identify structural patterns, governance gaps, and areas of concentration that may require targeted attention.
                </p>
                <p className={sumPara}>
                  By status,{' '}
                  <strong className="text-white">{openCount}</strong> risk{openCount !== 1 ? 's' : ''} ({total > 0 ? Math.round((openCount / total) * 100) : 0}%) remain open and require active treatment or escalation.{' '}
                  <strong className="text-white">{inProgressCount}</strong> {inProgressCount === 1 ? 'risk is' : 'risks are'} currently in progress with treatment plans underway, and{' '}
                  <strong className="text-white">{monitoringCount}</strong> {monitoringCount === 1 ? 'risk is' : 'risks are'} under ongoing monitoring. A high proportion of open risks relative to in-progress items may indicate insufficient treatment velocity.
                </p>
                {topCategoryLabel && (
                  <p className={sumPara}>
                    By category, <strong className="text-white">{topCategoryLabel}</strong> carries the highest concentration with <strong className="text-white">{topCategoryCount} risks ({topCategoryPct}%)</strong> of the total portfolio. This concentration should be considered in the context of the organisation&apos;s strategic priorities. The board should satisfy itself that the level of monitoring and control investment is proportionate to this exposure. Categories with very low risk counts may indicate coverage gaps requiring attention.
                  </p>
                )}
              </div>

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

              {/* Heatmap (merged) */}
              <div className="pt-2">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Risk Heatmap</h3>
                <div className={`${sumCard} mb-4`}>
                  <p className={sumPara}>
                    The heatmap plots residual risks across a 5×5 likelihood-impact matrix. Cell colours reflect the organisation&apos;s configured appetite thresholds. The board should focus on risks in the upper-right quadrant — high likelihood and high impact — which signal systemic control gaps or emerging threats.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 inline-block">
                    <HeatmapGrid risks={risks} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top 10 Risks */}
          {activeTab === 'top10' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Top 10 Risks</h2>

              <div className={sumCard}>
                <p className={sumPara}>
                  The following table presents the ten highest-priority risks in the organisation&apos;s register, ranked by residual risk score — the risk remaining after existing controls have been applied. Residual scores are derived from the product of assessed likelihood (1–5) and impact (1–5), yielding a maximum score of 25. Where financial exposure has been captured, the associated Value at Risk (VaR) is presented to enable prioritisation based on potential monetary consequence.
                </p>
                {criticalRisks.length > 0 ? (
                  <p className={sumPara}>
                    <strong className="text-red-400">{criticalRisks.length} risk{criticalRisks.length !== 1 ? 's' : ''}</strong> within the top 10 {criticalRisks.length === 1 ? 'is' : 'are'} rated in the <strong className="text-red-400">critical severity band</strong>, representing threats that exceed the organisation&apos;s risk appetite and require board-level awareness and management escalation. These items should have documented treatment plans with assigned owners and defined timelines.
                  </p>
                ) : (
                  <p className={sumPara}>
                    No risks within the top 10 are currently rated in the critical band. While this is positive, management should ensure that residual scores accurately reflect the current state of controls and that assessments are kept current.
                  </p>
                )}
                <p className={sumPara}>
                  {unassignedTop > 0
                    ? <><strong className="text-amber-400">{unassignedTop} of the top 10 risks</strong> {unassignedTop === 1 ? 'is' : 'are'} currently unassigned. Risk ownership is a fundamental governance requirement — the board should direct management to assign accountable owners to all high-priority risks as a matter of urgency.</>
                    : 'All top 10 risks have been assigned to named owners, which supports clear accountability for treatment and monitoring.'}
                </p>
              </div>

              {topRisks.length > 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className={thClass}>Ref</th>
                        <th className={thClass}>Title</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Score</th>
                        <th className={thClass}>VaR</th>
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
                            <span className={`inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded text-xs font-bold ${bandToBadgeClasses(appetite.getBand(risk.residualScore))}`}>
                              {risk.residualScore}
                            </span>
                          </td>
                          <td className={tdClass}>
                            {risk.varValue
                              ? <span className="text-xs font-mono">R {Number(risk.varValue).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</span>
                              : <span className="text-slate-600">—</span>
                            }
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

          {/* Category Trends & KRI */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Category Trends</h2>

              <div className={sumCard}>
                <p className={sumPara}>
                  This report analyses risk exposure across the organisation&apos;s business categories, presenting the total number of risks per category, the average residual score, and the current directional trend. Category-level analysis enables the board to identify which business domains carry disproportionate risk exposure and whether the overall trend within each category is improving, stable, or deteriorating.
                </p>
                {highestAvgCat && (
                  <p className={sumPara}>
                    <strong className="text-white">{CATEGORY_LABELS[highestAvgCat.category] || highestAvgCat.category}</strong> carries the highest average residual score of <strong className="text-white">{highestAvgCat.averageScore}</strong>, indicating this category warrants the most intensive management focus. Average scores reflect the mean residual exposure across all risks within a category and are colour-coded against the organisation&apos;s appetite thresholds for ease of interpretation.
                  </p>
                )}
                {worseningCats.length > 0 ? (
                  <p className={sumPara}>
                    <strong className="text-red-400">{worseningCats.length} {worseningCats.length === 1 ? 'category is' : 'categories are'} trending upward</strong> ({worseningCats.map((c) => CATEGORY_LABELS[c.category] || c.category).join(', ')}), indicating a deteriorating risk environment in these areas. Management should review the adequacy of existing controls and treatment plans for risks within these categories and consider whether additional mitigation measures are required.
                  </p>
                ) : improvingCats.length > 0 ? (
                  <p className={sumPara}>
                    No categories are currently trending in a worsening direction. <strong className="text-green-400">{improvingCats.length} {improvingCats.length === 1 ? 'category is' : 'categories are'} improving</strong>, reflecting the effectiveness of active treatment programmes. Maintaining this trajectory requires continued management discipline and regular control testing.
                  </p>
                ) : (
                  <p className={sumPara}>
                    All categories are currently stable. While the absence of deterioration is positive, management should ensure that stability reflects genuine control effectiveness rather than infrequent risk reassessment.
                  </p>
                )}
              </div>

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
                          <td className={tdClass}>{t.riskCount}</td>
                          <td className={tdClass}>
                            <span className={`inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded text-xs font-bold ${bandToBadgeClasses(appetite.getBand(t.averageScore))}`}>
                              {t.averageScore}
                            </span>
                          </td>
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

              {/* KRI Status (merged) */}
              <div className="pt-2">
                <h2 className="text-lg font-semibold text-white mb-4">KRI Status Dashboard</h2>

                <div className={`${sumCard} mb-4`}>
                  <p className={sumPara}>
                    Key Risk Indicators (KRIs) are forward-looking quantitative measures that signal changes in risk exposure before risks fully materialise. Each KRI is configured with Green, Amber, and Red thresholds calibrated to the organisation&apos;s risk appetite.
                  </p>
                  {krisTotal > 0 ? (
                    <p className={sumPara}>
                      The organisation currently monitors <strong className="text-white">{krisTotal} KRI{krisTotal !== 1 ? 's' : ''}</strong>.{' '}
                      {krisGreen > 0 && <><strong className="text-green-400">{krisGreen}</strong> {krisGreen === 1 ? 'is' : 'are'} within green thresholds; </>}
                      {krisAmber > 0 && <><strong className="text-amber-400">{krisAmber}</strong> {krisAmber === 1 ? 'is' : 'are'} in amber caution; </>}
                      {krisRed > 0
                        ? <><strong className="text-red-400">{krisRed}</strong> {krisRed === 1 ? 'has' : 'have'} breached the red threshold and require immediate management response.</>
                        : 'and none have breached the red threshold.'}
                    </p>
                  ) : (
                    <p className={sumPara}>No KRIs have been configured. The board should direct management to establish KRIs aligned to the most significant risks in the register.</p>
                  )}
                  {krisRed > 0 && (
                    <p className={sumPara}>
                      <strong className="text-red-400">Board action required:</strong> All red-status KRIs represent breaches of the organisation&apos;s defined risk appetite and require formal management response.
                    </p>
                  )}
                </div>

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
                                kri.status === 'RED'   ? 'bg-red-500/20 text-red-400' :
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
            </div>
          )}

          {/* Movement & Trends */}
          {activeTab === 'movement' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Movement & Trends</h2>

              <div className={sumCard}>
                <p className={sumPara}>
                  The Movement & Trends report provides a temporal analysis of the organisation&apos;s risk portfolio, comparing the current risk profile against historical snapshots to identify material changes in risk exposure, control effectiveness, and overall governance posture. This section directly supports the board&apos;s responsibility to assess whether the organisation&apos;s risk management programme is producing measurable improvement over time.
                </p>
                <p className={sumPara}>
                  Risk snapshots are captured automatically on a scheduled basis and may also be triggered manually. The analysis compares the most recent snapshot against the earliest snapshot within the selected time window (3, 6, or 12 months). Material movements are flagged where residual risk scores have changed by a defined threshold — risks that have increased, decreased, been newly added, or closed during the period are highlighted separately for ease of review.
                </p>
                <p className={sumPara}>
                  The board should use this report to assess whether treatment plans are reducing residual risk over time, to identify risks that are escalating despite management intervention, and to evaluate the organisation&apos;s overall risk trajectory. A consistent pattern of improvement in the VytlRx Score trajectory, declining KRI breaches, and increasing treatment completion rates indicates an effective and maturing risk management function.
                </p>
              </div>

              <MovementTrendsTab />
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// Heatmap component — uses org-configured appetite thresholds via useAppetite()
// for colour consistency with Dashboard and Risk Register heatmaps.
function HeatmapGrid({ risks }: { risks: { residualLikelihood: number; residualImpact: number }[] }) {
  const appetite = useAppetite()

  // Build 5x5 grid
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0))
  for (const r of risks) {
    const li = Math.min(5, Math.max(1, r.residualLikelihood)) - 1
    const im = Math.min(5, Math.max(1, r.residualImpact)) - 1
    grid[li][im]++
  }

  return (
    <div className="flex flex-col gap-3 w-[580px]">
    <div className="flex items-stretch gap-2">
      {/* Y-axis label */}
      <div className="flex items-center justify-center w-4 flex-shrink-0">
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest -rotate-90 whitespace-nowrap">
          Likelihood
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Column headers */}
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '28px repeat(5, 1fr)' }}>
          <div />
          {[1, 2, 3, 4, 5].map((im) => (
            <div key={im} className="text-center">
              <span className="text-[10px] font-semibold text-slate-400">{im}</span>
            </div>
          ))}
        </div>

        {/* Grid rows (5 = top, 1 = bottom) */}
        <div className="grid gap-1" style={{ gridTemplateColumns: '28px repeat(5, 1fr)' }}>
          {[5, 4, 3, 2, 1].map((li) => (
            <div key={li} className="contents">
              {/* Row label */}
              <div className="flex items-center justify-end pr-1">
                <span className="text-[10px] font-semibold text-slate-400">{li}</span>
              </div>
              {[1, 2, 3, 4, 5].map((im) => {
                const count = grid[li - 1][im - 1]
                const band  = getRiskBand(li, im, appetite.thresholds)
                return (
                  <div
                    key={`${li}-${im}`}
                    className={`h-14 ${bandToHeatmapClasses(band)} flex items-center justify-center rounded border`}
                    style={{ backgroundColor: BAND_PRINT_COLOURS[band] }}
                  >
                    {count > 0 && (
                      <span className="text-sm font-bold tabular-nums text-white">{count}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* X-axis label */}
        <div className="text-center mt-2">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Impact</span>
        </div>
      </div>
    </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-3 border-t border-slate-700 flex-wrap">
        {appetite.getLegend().map(({ band, label, range }) => (
          <div key={band} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: BAND_PRINT_COLOURS[band as keyof typeof BAND_PRINT_COLOURS] }}
            />
            <span className="text-xs text-slate-400">{label} <span className="text-slate-500">{range}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}
