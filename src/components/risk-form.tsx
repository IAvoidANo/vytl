'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Check } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { RiskScoreBadge } from './risk-score-badge'
import { useDebounce } from '@/lib/use-debounce'

const CATEGORIES = [
  { value: 'STRATEGIC', label: 'Strategic' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'REPUTATIONAL', label: 'Reputational' },
  { value: 'ENVIRONMENTAL', label: 'Environmental' },
  { value: 'PEOPLE', label: 'People' },
] as const

const RESPONSES = [
  { value: 'MITIGATE', label: 'Mitigate', desc: 'Reduce likelihood or impact' },
  { value: 'AVOID', label: 'Avoid', desc: 'Eliminate the risk entirely' },
  { value: 'TRANSFER', label: 'Transfer', desc: 'Shift to third party (insurance)' },
  { value: 'ACCEPT', label: 'Accept', desc: 'Acknowledge and monitor' },
] as const

const STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'MONITORING', label: 'Monitoring' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const

type RiskCategory = typeof CATEGORIES[number]['value']
type RiskResponse = typeof RESPONSES[number]['value']
type RiskStatus = typeof STATUSES[number]['value']

interface RiskFormProps {
  risk?: {
    id: string
    title: string
    description: string
    category: RiskCategory
    inherentLikelihood: number
    inherentImpact: number
    residualLikelihood: number
    residualImpact: number
    response: RiskResponse
    controls: string | null
    rootCause: string | null
    status: RiskStatus
    registerId: string
    ownerId: string | null
    dueDate: Date | null
    isOngoing: boolean
  }
  onClose: () => void
  onSuccess: () => void
}

export function RiskForm({ risk, onClose, onSuccess }: RiskFormProps) {
  const isEditing = !!risk

  const [formData, setFormData] = useState({
    title: risk?.title ?? '',
    description: risk?.description ?? '',
    category: risk?.category ?? 'OPERATIONAL' as RiskCategory,
    inherentLikelihood: risk?.inherentLikelihood ?? 3,
    inherentImpact: risk?.inherentImpact ?? 3,
    residualLikelihood: risk?.residualLikelihood ?? 2,
    residualImpact: risk?.residualImpact ?? 2,
    response: risk?.response ?? 'MITIGATE' as RiskResponse,
    controls: risk?.controls ?? '',
    rootCause: risk?.rootCause ?? '',
    status: risk?.status ?? 'OPEN' as RiskStatus,
    registerId: risk?.registerId ?? '',
    ownerId: risk?.ownerId ?? '',
    dueDate: risk?.dueDate ? new Date(risk.dueDate).toISOString().split('T')[0] : '',
    isOngoing: risk?.isOngoing ?? false,
  })

  const [error, setError] = useState('')

  // AI Suggestions state
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string
    likelihood: number
    impact: number
    reasoning: string
  } | null>(null)
  const [suggestionApplied, setSuggestionApplied] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Debounce description for AI suggestions (500ms delay)
  const debouncedDescription = useDebounce(formData.description, 500)

  const { data: registers } = trpc.risk.registers.useQuery()
  const { data: users } = trpc.risk.users.useQuery()

  const utils = trpc.useUtils()

  const createMutation = trpc.risk.create.useMutation({
    onSuccess: () => {
      utils.risk.list.invalidate()
      onSuccess()
    },
    onError: (err) => setError(err.message),
  })

  const updateMutation = trpc.risk.update.useMutation({
    onSuccess: () => {
      utils.risk.list.invalidate()
      utils.risk.listForWorkspace.invalidate()
      onSuccess()
    },
    onError: (err) => setError(err.message),
  })

  // AI suggestion mutation
  const suggestMutation = trpc.aiAnalysis.suggest.useMutation({
    onSuccess: (data) => {
      if (data) {
        setAiSuggestion(data)
        setSuggestionApplied(false)
      }
    },
    onError: () => {
      // Silently fail - suggestions are optional
      setAiSuggestion(null)
    },
  })

  // Trigger AI suggestions when description changes (50+ chars, not editing existing risk)
  useEffect(() => {
    if (!isEditing && debouncedDescription.length >= 50 && !suggestionApplied) {
      suggestMutation.mutate({
        description: debouncedDescription,
        title: formData.title || undefined,
      })
    } else if (debouncedDescription.length < 50) {
      setAiSuggestion(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDescription, formData.title, isEditing, suggestionApplied])

  // Handle Tab key to accept suggestions
  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && aiSuggestion && !suggestionApplied) {
      e.preventDefault()
      applySuggestion()
    }
  }

  const applySuggestion = () => {
    if (!aiSuggestion) return

    setFormData(prev => ({
      ...prev,
      category: aiSuggestion.category as RiskCategory,
      inherentLikelihood: aiSuggestion.likelihood,
      inherentImpact: aiSuggestion.impact,
      residualLikelihood: Math.max(1, aiSuggestion.likelihood - 1),
      residualImpact: Math.max(1, aiSuggestion.impact - 1),
    }))
    setSuggestionApplied(true)
  }

  // Auto-select first register if none selected
  useEffect(() => {
    if (!formData.registerId && registers?.length) {
      setFormData((prev) => ({ ...prev, registerId: registers[0].id }))
    }
  }, [registers, formData.registerId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.registerId) {
      setError('Please select a risk register')
      return
    }

    if (isEditing) {
      updateMutation.mutate({
        id: risk.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        inherentLikelihood: formData.inherentLikelihood,
        inherentImpact: formData.inherentImpact,
        residualLikelihood: formData.residualLikelihood,
        residualImpact: formData.residualImpact,
        response: formData.response,
        controls: formData.controls || null,
        rootCause: formData.rootCause || null,
        status: formData.status,
        ownerId: formData.ownerId || null,
        dueDate: formData.isOngoing ? null : (formData.dueDate || null),
        isOngoing: formData.isOngoing,
      })
    } else {
      createMutation.mutate({
        registerId: formData.registerId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        inherentLikelihood: formData.inherentLikelihood,
        inherentImpact: formData.inherentImpact,
        residualLikelihood: formData.residualLikelihood,
        residualImpact: formData.residualImpact,
        response: formData.response,
        controls: formData.controls || undefined,
        rootCause: formData.rootCause || undefined,
        ownerId: formData.ownerId || undefined,
        dueDate: formData.isOngoing ? undefined : (formData.dueDate || undefined),
        isOngoing: formData.isOngoing,
      })
    }
  }

  const inherentScore = formData.inherentLikelihood * formData.inherentImpact
  const residualScore = formData.residualLikelihood * formData.residualImpact
  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Risk' : 'Add New Risk'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Register *</label>
              <select
                value={formData.registerId}
                onChange={(e) => setFormData({ ...formData, registerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isEditing}
                required
              >
                <option value="">Select register...</option>
                {registers?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Category *
                {aiSuggestion && !suggestionApplied && formData.category !== aiSuggestion.category && (
                  <span className="ml-2 text-xs text-teal-400">(AI suggests: {CATEGORIES.find(c => c.value === aiSuggestion.category)?.label})</span>
                )}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as RiskCategory })}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  aiSuggestion && !suggestionApplied && formData.category !== aiSuggestion.category
                    ? 'border-teal-500/50'
                    : 'border-slate-600'
                }`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description *</label>
            <textarea
              ref={descriptionRef}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onKeyDown={handleDescriptionKeyDown}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />

            {/* AI Suggestion Banner */}
            {!isEditing && formData.description.length >= 50 && (
              <div className="mt-2">
                {suggestMutation.isPending ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Sparkles className="w-4 h-4 animate-pulse text-teal-400" />
                    <span>AI analyzing...</span>
                  </div>
                ) : aiSuggestion && !suggestionApplied ? (
                  <div className="flex items-center justify-between p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span className="text-sm text-slate-300">
                        AI suggests:{' '}
                        <span className="text-teal-400 font-medium">
                          {CATEGORIES.find(c => c.value === aiSuggestion.category)?.label || aiSuggestion.category}
                        </span>
                        {' | '}
                        <span className="text-amber-400">
                          L:{aiSuggestion.likelihood} I:{aiSuggestion.impact}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500" title={aiSuggestion.reasoning}>
                        ({aiSuggestion.reasoning})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={applySuggestion}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Apply
                      </button>
                      <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-600 rounded text-slate-400">
                        Tab
                      </kbd>
                    </div>
                  </div>
                ) : suggestionApplied ? (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Check className="w-4 h-4" />
                    <span>AI suggestions applied</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Risk Scoring */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-900 rounded-lg">
            <div>
              <h3 className="font-medium text-white mb-3 flex items-center justify-between">
                Inherent Risk
                <RiskScoreBadge score={inherentScore} />
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Likelihood (1-5): {formData.inherentLikelihood}
                    {aiSuggestion && !suggestionApplied && formData.inherentLikelihood !== aiSuggestion.likelihood && (
                      <span className="ml-2 text-teal-400">(AI: {aiSuggestion.likelihood})</span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.inherentLikelihood}
                    onChange={(e) => setFormData({ ...formData, inherentLikelihood: parseInt(e.target.value) })}
                    className="w-full accent-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Impact (1-5): {formData.inherentImpact}
                    {aiSuggestion && !suggestionApplied && formData.inherentImpact !== aiSuggestion.impact && (
                      <span className="ml-2 text-teal-400">(AI: {aiSuggestion.impact})</span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.inherentImpact}
                    onChange={(e) => setFormData({ ...formData, inherentImpact: parseInt(e.target.value) })}
                    className="w-full accent-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-white mb-3 flex items-center justify-between">
                Residual Risk
                <RiskScoreBadge score={residualScore} />
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Likelihood (1-5): {formData.residualLikelihood}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.residualLikelihood}
                    onChange={(e) => setFormData({ ...formData, residualLikelihood: parseInt(e.target.value) })}
                    className="w-full accent-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Impact (1-5): {formData.residualImpact}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.residualImpact}
                    onChange={(e) => setFormData({ ...formData, residualImpact: parseInt(e.target.value) })}
                    className="w-full accent-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Response & Controls */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Risk Response *</label>
            <div className="grid grid-cols-2 gap-2">
              {RESPONSES.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.response === r.value
                      ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="response"
                    value={r.value}
                    checked={formData.response === r.value}
                    onChange={(e) => setFormData({ ...formData, response: e.target.value as RiskResponse })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{r.label}</div>
                    <div className="text-xs opacity-75">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Controls</label>
            <textarea
              value={formData.controls}
              onChange={(e) => setFormData({ ...formData, controls: e.target.value })}
              rows={2}
              placeholder="Describe mitigation controls..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Root Cause</label>
            <textarea
              value={formData.rootCause}
              onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
              rows={2}
              placeholder="Describe the underlying cause of this risk..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Assignment */}
          <div className="grid grid-cols-3 gap-4">
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as RiskStatus })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Owner</label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Unassigned</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  disabled={formData.isOngoing}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isOngoing}
                  onChange={(e) => setFormData({ ...formData, isOngoing: e.target.checked, dueDate: e.target.checked ? '' : formData.dueDate })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-400">Ongoing monitoring (no due date)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Risk' : 'Create Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
