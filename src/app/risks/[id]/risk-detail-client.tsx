'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Brain,
  Shield,
  Clock,
  Paperclip,
  AlertTriangle,
  User,
  Calendar,
  Building,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Lightbulb,
  Target,
  TrendingUp,
  Activity,
  X,
  Gauge,
  ClipboardCheck,
  AlertOctagon,
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { RiskScoreBadge } from '@/components/risk-score-badge'
import { RiskForm } from '@/components/risk-form'
import { AuditTimeline } from '@/components/audit-timeline'
import { TreatmentActions } from '@/components/treatment-actions'
import { RegulatoryMappings } from '@/components/regulatory-mappings'
import { IncidentLinks } from '@/components/incident-links'
import { ControlEffectivenessBadge } from '@/components/control-effectiveness-badge'
import { addRecentItem } from '@/lib/recent-items'
import { format } from 'date-fns'

type TabId = 'overview' | 'analysis' | 'controls' | 'compliance' | 'incidents' | 'scoring' | 'history' | 'documents'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'analysis', label: 'AI Analysis', icon: Brain },
  { id: 'controls', label: 'Treatment', icon: Shield },
  { id: 'compliance', label: 'Compliance', icon: ClipboardCheck },
  { id: 'incidents', label: 'Incidents', icon: AlertOctagon },
  { id: 'scoring', label: 'Risk Intelligence', icon: Gauge },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'documents', label: 'Documents', icon: Paperclip },
]

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  MONITORING: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CLOSED: 'bg-green-500/20 text-green-400 border-green-500/30',
}

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

const RESPONSE_LABELS: Record<string, { label: string; desc: string }> = {
  AVOID: { label: 'Avoid', desc: 'Eliminate the risk entirely' },
  MITIGATE: { label: 'Mitigate', desc: 'Reduce likelihood or impact' },
  TRANSFER: { label: 'Transfer', desc: 'Shift to third party' },
  ACCEPT: { label: 'Accept', desc: 'Acknowledge and monitor' },
}

interface RiskDetailClientProps {
  riskId: string
}

export function RiskDetailClient({ riskId }: RiskDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showEditForm, setShowEditForm] = useState(false)
  const router = useRouter()

  const utils = trpc.useUtils()
  const { data: risk, isLoading, isError, error } = trpc.risk.get.useQuery({ id: riskId })

  const deleteMutation = trpc.risk.delete.useMutation({
    onSuccess: () => {
      router.push('/risks')
    },
  })

  // Track in recent items for command palette
  useEffect(() => {
    if (risk) {
      addRecentItem({
        id: risk.id,
        title: risk.title,
        type: 'risk',
        refCode: risk.refCode,
      })
    }
  }, [risk])

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
      deleteMutation.mutate({ id: riskId })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (isError || !risk) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Risk Not Found</h2>
        <p className="text-red-400 mb-4">{error?.message || 'The requested risk could not be found.'}</p>
        <Link href="/risks" className="text-teal-400 hover:underline">
          ← Back to Risk Register
        </Link>
      </div>
    )
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/risks"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Register
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
              {risk.refCode}
            </span>
            <h1 className="text-2xl font-semibold">{risk.title}</h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[risk.status]}`}>
              {risk.status.replace('_', ' ')}
            </span>
            <span className="text-sm text-slate-400">{CATEGORY_LABELS[risk.category]}</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-400">{risk.register.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-teal-400 border-teal-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Score Cards */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Inherent Risk</h3>
                <div className="flex items-center justify-between">
                  <RiskScoreBadge score={risk.inherentScore} />
                  <div className="text-right text-sm text-slate-400">
                    <p>Likelihood: {risk.inherentLikelihood}/5</p>
                    <p>Impact: {risk.inherentImpact}/5</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Residual Risk</h3>
                <div className="flex items-center justify-between">
                  <RiskScoreBadge score={risk.residualScore} />
                  <div className="text-right text-sm text-slate-400">
                    <p>Likelihood: {risk.residualLikelihood}/5</p>
                    <p>Impact: {risk.residualImpact}/5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Value at Risk */}
            {risk.varValue && (
              <div className="mb-6 bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Value at Risk (VaR)</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-white">
                    R {Number(risk.varValue).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {risk.financialExposure && (
                    <span className="text-sm text-slate-500">
                      of R {Number(risk.financialExposure).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} exposure
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{risk.description}</p>
            </div>

            {/* Response */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Risk Response</h3>
              <div className="inline-flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
                <span className="font-medium text-teal-400">
                  {RESPONSE_LABELS[risk.response].label}
                </span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-400 text-sm">
                  {RESPONSE_LABELS[risk.response].desc}
                </span>
              </div>
            </div>

            {/* Control Effectiveness */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Control Effectiveness</h3>
              <ControlEffectivenessBadge value={risk.controlEffectiveness} />
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">Owner:</span>
                <span className="text-white">{risk.owner?.name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">Due:</span>
                {risk.isOngoing ? (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                    Ongoing
                  </span>
                ) : (
                  <span className="text-white">
                    {risk.dueDate ? format(new Date(risk.dueDate), 'dd MMM yyyy') : 'Not set'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">Created:</span>
                <span className="text-white">
                  {format(new Date(risk.createdAt), 'dd MMM yyyy')}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <AIAnalysisTab riskId={riskId} existingAnalysis={risk.aiAnalysis} />
        )}

        {activeTab === 'controls' && (
          <div className="p-6">
            {risk.controls && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Mitigation Controls</h3>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{risk.controls}</p>
                </div>
              </div>
            )}

            <div className={risk.controls ? 'border-t border-slate-700 pt-6' : ''}>
              <TreatmentActions riskId={riskId} />
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <RegulatoryMappings riskId={riskId} />
        )}

        {activeTab === 'incidents' && (
          <div className="p-6">
            <IncidentLinks riskId={riskId} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <AuditTimeline entityType="RISK" entityId={riskId} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="p-6">
            <div className="text-center py-12">
              <Paperclip className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No Documents</h3>
              <p className="text-slate-500 mb-4">Attach supporting documents to this risk.</p>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                Upload Document
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <ScoringTab riskId={riskId} />
        )}
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <RiskForm
          risk={{
            id: risk.id,
            title: risk.title,
            description: risk.description,
            category: risk.category,
            inherentLikelihood: risk.inherentLikelihood,
            inherentImpact: risk.inherentImpact,
            residualLikelihood: risk.residualLikelihood,
            residualImpact: risk.residualImpact,
            response: risk.response,
            controls: risk.controls,
            controlEffectiveness: risk.controlEffectiveness as 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'NOT_TESTED' | 'NOT_APPLICABLE',
            rootCause: risk.rootCause,
            financialExposure: risk.financialExposure ? Number(risk.financialExposure) : null,
            status: risk.status,
            registerId: risk.register.id,
            ownerId: risk.ownerId,
            dueDate: risk.dueDate ? new Date(risk.dueDate) : null,
            isOngoing: risk.isOngoing,
          }}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false)
            utils.risk.get.invalidate({ id: riskId })
          }}
        />
      )}
    </div>
  )
}

// AI Analysis Tab Component
interface AIAnalysisTabProps {
  riskId: string
  existingAnalysis: {
    id: string
    summary: string
    suggestedControls: string | null
    scoreJustification: string | null
    relatedRisks: string[]
    modelVersion: string
    generatedAt: Date | string
    confidence: number | null
  } | null
}

type ApplyModalType = 'summary' | 'controls' | 'rootCause' | null

function AIAnalysisTab({ riskId, existingAnalysis }: AIAnalysisTabProps) {
  const utils = trpc.useUtils()
  const [applyModal, setApplyModal] = useState<ApplyModalType>(null)
  const [editContent, setEditContent] = useState('')
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set())

  const generateMutation = trpc.aiAnalysis.generate.useMutation({
    onSuccess: () => {
      utils.risk.get.invalidate({ id: riskId })
      setAppliedFields(new Set()) // Reset applied indicators on regenerate
    },
  })

  const updateRiskMutation = trpc.risk.update.useMutation({
    onSuccess: () => {
      utils.risk.get.invalidate({ id: riskId })
      if (applyModal) {
        setAppliedFields((prev) => new Set(Array.from(prev).concat(applyModal)))
      }
      setApplyModal(null)
    },
  })

  const handleGenerate = () => {
    generateMutation.mutate({ riskId })
  }

  const openApplyModal = (type: ApplyModalType, content: string) => {
    setApplyModal(type)
    setEditContent(content)
  }

  const handleApply = () => {
    if (!applyModal) return

    const updates: Record<string, string | null> = {}
    if (applyModal === 'summary') {
      updates.description = editContent
    } else if (applyModal === 'controls') {
      updates.controls = editContent
    } else if (applyModal === 'rootCause') {
      updates.rootCause = editContent
    }

    updateRiskMutation.mutate({ id: riskId, ...updates })
  }

  const isGenerating = generateMutation.isPending

  // Show generating state
  if (isGenerating) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="relative inline-block">
            <Brain className="w-16 h-16 text-teal-500 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <h3 className="text-lg font-medium text-white mt-4 mb-2">Analysing Risk...</h3>
          <p className="text-slate-400 text-sm">
            Claude is reviewing your risk and generating insights.
          </p>
          <p className="text-slate-500 text-xs mt-2">This usually takes 10-20 seconds.</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (generateMutation.isError) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium">Analysis Failed</h4>
              <p className="text-red-400/70 text-sm mt-1">
                {generateMutation.error.message}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    )
  }

  // Show existing analysis
  if (existingAnalysis) {
    // Extract plain text from summary for root cause
    const extractRootCause = () => {
      const summary = existingAnalysis.summary
      // Try to extract a meaningful root cause from the summary
      return `Root cause analysis based on AI insights:\n\n${summary}`
    }

    return (
      <div className="p-6">
        {/* Header with confidence and regenerate */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-teal-500/20 text-teal-400 px-3 py-1.5 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              AI Analysis Complete
            </div>
            {existingAnalysis.confidence && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Activity className="w-4 h-4" />
                {(existingAnalysis.confidence * 100).toFixed(0)}% confidence
              </div>
            )}
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        {/* Executive Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Executive Summary</h3>
              {appliedFields.has('summary') && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Applied
                </span>
              )}
            </div>
            <button
              onClick={() => openApplyModal('summary', existingAnalysis.summary)}
              className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded transition-colors"
            >
              Apply to Description
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-300 leading-relaxed">{existingAnalysis.summary}</p>
          </div>
        </div>

        {/* Suggested Controls */}
        {existingAnalysis.suggestedControls && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Suggested Controls & KRIs</h3>
                {appliedFields.has('controls') && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Applied
                  </span>
                )}
              </div>
              <button
                onClick={() => openApplyModal('controls', existingAnalysis.suggestedControls || '')}
                className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded transition-colors"
              >
                Add to Controls
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {formatControlsText(existingAnalysis.suggestedControls)}
              </div>
            </div>
          </div>
        )}

        {/* Score Justification - Can be used as Root Cause */}
        {existingAnalysis.scoreJustification && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Score Justification</h3>
                {appliedFields.has('rootCause') && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Applied
                  </span>
                )}
              </div>
              <button
                onClick={() => openApplyModal('rootCause', extractRootCause())}
                className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded transition-colors"
              >
                Apply as Root Cause
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {formatJustificationText(existingAnalysis.scoreJustification)}
              </div>
            </div>
          </div>
        )}

        {/* Related Risk Categories */}
        {existingAnalysis.relatedRisks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Related Risk Categories</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {existingAnalysis.relatedRisks.map((category) => (
                <span
                  key={category}
                  className="px-3 py-1.5 bg-slate-700 rounded-full text-sm text-slate-300"
                >
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>
            Generated by {existingAnalysis.modelVersion} on{' '}
            {format(new Date(existingAnalysis.generatedAt), "dd MMM yyyy 'at' HH:mm")}
          </span>
        </div>

        {/* Apply Modal */}
        {applyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  {applyModal === 'summary' && 'Apply to Risk Description'}
                  {applyModal === 'controls' && 'Add to Controls'}
                  {applyModal === 'rootCause' && 'Apply as Root Cause'}
                </h2>
                <button onClick={() => setApplyModal(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-auto">
                <p className="text-sm text-slate-400 mb-3">
                  Edit the content below before applying it to the risk record:
                </p>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                <button
                  onClick={() => setApplyModal(null)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={updateRiskMutation.isPending}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateRiskMutation.isPending ? (
                    <>Applying...</>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Apply Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show empty state with generate button
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <div className="relative inline-block mb-4">
          <Brain className="w-16 h-16 text-slate-600" />
          <Sparkles className="w-6 h-6 text-slate-500 absolute -top-1 -right-1" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">AI Risk Analysis</h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Get AI-powered insights including an executive summary, suggested controls,
          score justification, and key risk indicators to monitor.
        </p>
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors font-medium"
        >
          <Sparkles className="w-5 h-5" />
          Analyse with AI
        </button>
        <p className="text-slate-500 text-xs mt-4">
          Powered by Claude AI. Analysis typically takes 10-20 seconds.
        </p>
      </div>
    </div>
  )
}

// Risk Intelligence Tab Component (formerly Scoring)
function ScoringTab({ riskId }: { riskId: string }) {
  const utils = trpc.useUtils()
  const { data: risk } = trpc.risk.get.useQuery({ id: riskId })

  const [scoreResult, setScoreResult] = useState<{
    compositeScore: number
    grade: string
    gradeColor: string
    dimensions: {
      base: { score: number }
      controlQuality: { score: number }
      velocity: { score: number }
      correlation: { score: number }
      kriAlignment: { score: number }
    }
    rulesApplied: { ruleName: string; modifier: number }[]
  } | null>(null)

  const calculateMutation = trpc.scoring.calculate.useMutation({
    onSuccess: (data) => {
      setScoreResult(data)
      utils.scoring.getHistory.invalidate({ riskId })
    },
  })

  const { data: historyData } = trpc.scoring.getHistory.useQuery(
    { riskId, limit: 10 },
  ) as { data: { items: { id: string; createdAt: string; compositeScore: number; baseScore: number; controlQualityScore: number; velocityScore: number; correlationScore: number; kriAlignmentScore: number }[]; nextCursor: string | null } | undefined }

  const handleCalculate = () => {
    calculateMutation.mutate({ riskId, saveHistory: true })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-teal-400" />
          <h3 className="font-semibold text-white">Risk Intelligence</h3>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          {calculateMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analysing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {calculateMutation.isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
          {calculateMutation.error.message}
        </div>
      )}

      {/* ISO 31000 Risk Summary */}
      {risk && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 rounded-lg p-4">
            <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Inherent Risk</h4>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-white">{risk.inherentScore}</span>
              <span className="text-sm text-slate-400">{risk.inherentLikelihood} × {risk.inherentImpact}</span>
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Residual Risk</h4>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-white">{risk.residualScore}</span>
              <span className="text-sm text-slate-400">{risk.residualLikelihood} × {risk.residualImpact}</span>
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Control Effectiveness</h4>
            <ControlEffectivenessBadge value={risk.controlEffectiveness} />
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Value at Risk</h4>
            {risk.varValue ? (
              <span className="text-lg font-bold text-white">
                R {Number(risk.varValue).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-sm text-slate-500">Not set — add Financial Exposure to calculate</span>
            )}
          </div>
        </div>
      )}

      {/* Velocity & KRI Overlays */}
      {scoreResult && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Intelligence Overlays</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Velocity</p>
                <p className="text-sm font-medium text-white">{scoreResult.dimensions.velocity.score}/100</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">KRI Alignment</p>
                <p className="text-sm font-medium text-white">{scoreResult.dimensions.kriAlignment.score}/100</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Correlation</p>
                <p className="text-sm font-medium text-white">{scoreResult.dimensions.correlation.score}/100</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Control Quality</p>
                <p className="text-sm font-medium text-white">{scoreResult.dimensions.controlQuality.score}/100</p>
              </div>
            </div>
          </div>

          {/* Rules Applied */}
          {scoreResult.rulesApplied.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Active Rules</h4>
              <div className="space-y-1">
                {scoreResult.rulesApplied.map((rule, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900 rounded px-3 py-1.5">
                    <span className="text-xs text-slate-300">{rule.ruleName}</span>
                    <span className={`text-xs font-medium ${rule.modifier > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {rule.modifier > 0 ? '+' : ''}{rule.modifier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!scoreResult && (
        <div className="text-center py-6 mb-6">
          <Gauge className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Click &ldquo;Run Analysis&rdquo; for velocity, KRI, and correlation overlays.</p>
        </div>
      )}

      {/* Score History */}
      {historyData && historyData.items.length > 0 && (
        <div className="border-t border-slate-700 pt-6 mb-6">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Analysis History</h4>
          <div className="space-y-2">
            {historyData.items.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-400">
                  {format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm')}
                </span>
                <span className="text-sm font-medium text-white tabular-nums">{entry.compositeScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methodology Footer */}
      <div className="border-t border-slate-700 pt-4">
        <p className="text-xs text-slate-500">
          Risk scoring follows ISO 31000:2018 — Inherent Risk (L×I before controls), Residual Risk (L×I after controls),
          and Value at Risk (financial exposure × probability). Intelligence overlays (velocity, KRI alignment, correlation,
          control quality) provide additional context for risk-informed decision-making.
        </p>
      </div>
    </div>
  )
}

// Helper function to format controls text with better styling
function formatControlsText(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Check if it's a numbered item
    if (/^\d+\.\s/.test(line)) {
      return (
        <div key={i} className="flex gap-3 mb-2">
          <span className="text-teal-400 font-medium">{line.match(/^\d+/)?.[0]}.</span>
          <span>{line.replace(/^\d+\.\s*/, '')}</span>
        </div>
      )
    }
    // Check if it's a section header
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <h4 key={i} className="font-semibold text-white mt-4 mb-2">
          {line.replace(/\*\*/g, '')}
        </h4>
      )
    }
    // Check if it's a bullet point
    if (line.startsWith('•')) {
      return (
        <div key={i} className="flex gap-2 mb-1 ml-4">
          <span className="text-slate-500">•</span>
          <span>{line.replace(/^•\s*/, '')}</span>
        </div>
      )
    }
    // Regular text
    return line ? <p key={i} className="mb-2">{line}</p> : <br key={i} />
  })
}

// Helper function to format justification text
function formatJustificationText(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Check if it's a bold header
    if (line.startsWith('**')) {
      const match = line.match(/\*\*([^*]+)\*\*(.*)/)
      if (match) {
        return (
          <div key={i} className="mb-3">
            <span className="font-semibold text-white">{match[1]}</span>
            <span>{match[2]}</span>
          </div>
        )
      }
    }
    return line ? <p key={i} className="mb-2">{line}</p> : <br key={i} />
  })
}
