'use client'

import { useState } from 'react'
import { X, FileDown, CheckCircle, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { generateBoardReport, type BoardReportData } from '@/lib/board-report'

interface BoardReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BoardReportModal({ isOpen, onClose }: BoardReportModalProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all required data
  const { data: org } = trpc.organisation.get.useQuery()
  const { data: riskStats } = trpc.risk.stats.useQuery()
  const { data: topRisks } = trpc.risk.topRisks.useQuery({ limit: 10 })
  const { data: risks } = trpc.risk.list.useQuery()
  const { data: kris } = trpc.kri.list.useQuery()
  const { data: assessment } = trpc.assessment.current.useQuery()

  // Optional scoring data
  const { data: categoryTrends } = trpc.scoring.getCategoryTrends.useQuery(
    { daysBack: 90 },
    { retry: false }
  )
  const { data: recommendations } = trpc.scoring.getRecommendations.useQuery(
    undefined,
    { retry: false }
  )

  const dataReady = org && riskStats && topRisks && risks

  const handleGenerate = async () => {
    if (!dataReady) return

    setGenerating(true)
    setError(null)

    try {
      const reportData: BoardReportData = {
        orgName: org.name,
        generatedDate: new Date(),
        vytlScore: assessment?.vytlScore
          ? { score: assessment.vytlScore, grade: assessment.vytlGrade || 'N/A' }
          : null,
        riskStats: riskStats,
        topRisks: topRisks.map((r) => ({
          refCode: r.refCode,
          title: r.title,
          category: r.category,
          residualScore: r.residualScore,
          status: r.status,
          owner: r.owner,
        })),
        heatmapData: risks.map((r) => ({
          likelihood: r.residualLikelihood,
          impact: r.residualImpact,
        })),
        categoryTrends: categoryTrends || [],
        recommendations: recommendations || [],
        kris: (kris || []).map((k) => ({
          name: k.name,
          currentValue: k.currentValue,
          thresholdGreen: k.thresholdGreen,
          thresholdAmber: k.thresholdAmber,
          thresholdRed: k.thresholdRed,
          status: k.status,
        })),
      }

      const doc = generateBoardReport(reportData)
      const dateStr = new Date().toISOString().split('T')[0]
      doc.save(`board-risk-report-${dateStr}.pdf`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-md border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Board Risk Report</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-400">
            Generate a comprehensive PDF report for board governance meetings.
          </p>

          {/* Section checklist */}
          <div className="space-y-2">
            {[
              { label: 'Executive Summary & Vytl Score', ready: !!riskStats },
              { label: 'Risk Overview (Status & Category)', ready: !!riskStats },
              { label: 'Top 10 Risks Table', ready: !!topRisks },
              { label: '5×5 Risk Heatmap', ready: !!risks },
              { label: 'Category Trends', ready: true },
              { label: 'Scoring Recommendations', ready: true },
              { label: 'KRI Status Dashboard', ready: true },
            ].map((section) => (
              <div key={section.label} className="flex items-center gap-2 text-sm">
                <CheckCircle
                  className={`w-4 h-4 ${
                    section.ready ? 'text-green-400' : 'text-slate-600'
                  }`}
                />
                <span className={section.ready ? 'text-slate-300' : 'text-slate-500'}>
                  {section.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !dataReady}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Generate & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
