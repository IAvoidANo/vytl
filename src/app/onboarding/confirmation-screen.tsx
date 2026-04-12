'use client'

import { CheckCircle2, TrendingUp, Shield, FileText, ArrowRight, Info } from 'lucide-react'
import { type IndustryCode } from '@/lib/industry-templates'
import { cn } from '@/lib/utils'

interface ConfirmationScreenProps {
  industryCode: IndustryCode
  riskCount: number
  vytlScore: number
  grade: string
  onViewDashboard: () => void
  onEditRisks: () => void
}

const INDUSTRY_NAMES: Record<IndustryCode, string> = {
  MANUFACTURING: 'Manufacturing & Production',
  FINANCIAL_SERVICES: 'Financial Services',
  RETAIL: 'Retail & Consumer',
  MINING_RESOURCES: 'Mining & Resources',
  HEALTHCARE: 'Healthcare',
  PROFESSIONAL_SERVICES: 'Professional Services',
}

const INDUSTRY_BENCHMARKS: Record<string, number> = {
  MANUFACTURING: 58,
  FINANCIAL_SERVICES: 62,
  RETAIL: 54,
  MINING_RESOURCES: 42,
  HEALTHCARE: 38,
  PROFESSIONAL_SERVICES: 44,
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-orange-600'
}

function gradeClasses(grade: string) {
  if (grade.startsWith('A')) return 'bg-green-100 text-green-700'
  if (grade.startsWith('B')) return 'bg-emerald-100 text-emerald-700'
  if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700'
  if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export default function ConfirmationScreen({
  industryCode,
  riskCount,
  vytlScore,
  grade,
  onViewDashboard,
  onEditRisks,
}: ConfirmationScreenProps) {
  const industryName = INDUSTRY_NAMES[industryCode]
  const industryBenchmark = INDUSTRY_BENCHMARKS[industryCode] ?? 50

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Success icon */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
        <CheckCircle2 className="h-20 w-20 text-emerald-500 relative" />
      </div>

      {/* Header */}
      <div className="text-center mb-8 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Your Risk Profile is Ready!
        </h2>
        <p className="text-lg text-slate-600">
          We&rsquo;ve created{' '}
          <span className="font-semibold">
            {riskCount} {industryName.toLowerCase()} risks
          </span>{' '}
          relevant to your business.
        </p>
      </div>

      {/* Score card */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 mb-8 max-w-lg w-full">
        {/* VytlRx Score */}
        <div className="text-center mb-6 pb-6 border-b border-slate-200">
          <p className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-2">
            Your VytlRx Score
          </p>
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className={cn('text-6xl font-bold', scoreColor(vytlScore))}>{vytlScore}</span>
            <span className={cn('text-3xl font-bold px-4 py-2 rounded-lg', gradeClasses(grade))}>
              {grade}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Industry benchmark: {industryBenchmark}
          </p>
        </div>

        {/* Sample mode notice */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200 mb-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-200 rounded-full p-1.5 mt-0.5 flex-shrink-0">
              <Info className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="font-medium text-amber-900 mb-1">You&rsquo;re in sample data mode</p>
              <p className="text-sm text-amber-700">
                Explore the full application with these template risks. Edit any risk to make it
                yours, or click &ldquo;Make This My Data&rdquo; in the banner to convert everything
                to live data.
              </p>
            </div>
          </div>
        </div>

        {/* What's included */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-3">
            What&rsquo;s included:
          </p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>{riskCount} pre-scored risks specific to {industryName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Control measures and root causes for each risk</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Risk heatmap and category distribution</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Board-ready risk report</span>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
            <div className="bg-emerald-100 rounded-full p-1.5 mt-0.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Review and customise risks</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Update descriptions, scores, and controls for your situation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
            <div className="bg-blue-100 rounded-full p-1.5 mt-0.5">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Assign risk owners</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Delegate responsibility to the right people in your team
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200">
            <div className="bg-purple-100 rounded-full p-1.5 mt-0.5">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Generate your first board report</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Download a professional PDF summary to share with leadership
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        <button
          onClick={onViewDashboard}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg px-6 py-3 shadow-lg transition-all"
        >
          View Dashboard
          <ArrowRight className="h-5 w-5" />
        </button>

        <button
          onClick={onEditRisks}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg px-6 py-3 border-2 border-slate-200 hover:border-slate-300 transition-all"
        >
          Edit Risks First
        </button>
      </div>

      {/* Tip */}
      <p className="mt-8 text-center text-sm text-slate-500 max-w-xl">
        <strong>Tip:</strong>{' '}
        You can edit any of these risks to match your actual situation. When you&rsquo;re ready,
        click &ldquo;Make This My Data&rdquo; in the banner to convert them to live risks.
      </p>
    </div>
  )
}