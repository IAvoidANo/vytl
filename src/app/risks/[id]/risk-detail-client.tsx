'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { RiskScoreBadge } from '@/components/risk-score-badge'
import { RiskForm } from '@/components/risk-form'
import { AuditTimeline } from '@/components/audit-timeline'
import { format } from 'date-fns'

type TabId = 'overview' | 'analysis' | 'controls' | 'history' | 'documents'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'analysis', label: 'AI Analysis', icon: Brain },
  { id: 'controls', label: 'Controls', icon: Shield },
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
                <span className="text-white">
                  {risk.dueDate ? format(new Date(risk.dueDate), 'dd MMM yyyy') : 'Not set'}
                </span>
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
          <div className="p-6">
            {risk.aiAnalysis ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">AI Summary</h3>
                  <p className="text-slate-300 whitespace-pre-wrap">{risk.aiAnalysis.summary}</p>
                </div>
                {risk.aiAnalysis.suggestedControls && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Suggested Controls</h3>
                    <p className="text-slate-300 whitespace-pre-wrap">{risk.aiAnalysis.suggestedControls}</p>
                  </div>
                )}
                {risk.aiAnalysis.scoreJustification && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Score Justification</h3>
                    <p className="text-slate-300 whitespace-pre-wrap">{risk.aiAnalysis.scoreJustification}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-700 text-xs text-slate-500">
                  Generated by {risk.aiAnalysis.modelVersion} on{' '}
                  {format(new Date(risk.aiAnalysis.generatedAt), 'dd MMM yyyy HH:mm')}
                  {risk.aiAnalysis.confidence && (
                    <span className="ml-2">• Confidence: {(risk.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">No AI Analysis Yet</h3>
                <p className="text-slate-500 mb-4">Run AI analysis to get insights on this risk.</p>
                <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors">
                  Generate Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="p-6">
            {risk.controls ? (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Mitigation Controls</h3>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{risk.controls}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">No Controls Defined</h3>
                <p className="text-slate-500">Add controls to mitigate this risk.</p>
              </div>
            )}
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
            status: risk.status,
            registerId: risk.register.id,
            ownerId: risk.ownerId,
            dueDate: risk.dueDate ? new Date(risk.dueDate) : null,
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
