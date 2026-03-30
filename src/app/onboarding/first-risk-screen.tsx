'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

const CATEGORIES = [
  { value: 'STRATEGIC', label: 'Strategic' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'REPUTATIONAL', label: 'Reputational' },
  { value: 'ENVIRONMENTAL', label: 'Environmental' },
  { value: 'PEOPLE', label: 'People' },
  { value: 'HEALTH_SAFETY', label: 'Health & Safety' },
] as const

const SCORE_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
}

interface FirstRiskScreenProps {
  onBack: () => void
  onDone: () => void
}

export default function FirstRiskScreen({ onBack, onDone }: FirstRiskScreenProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OPERATIONAL' as string,
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
  })
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data: registers } = trpc.risk.registers.useQuery()
  const utils = trpc.useUtils()

  const createMutation = trpc.risk.create.useMutation({
    onSuccess: () => {
      utils.risk.list.invalidate()
      setSubmitted(true)
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const registerId = registers?.[0]?.id
    if (!registerId) { setError('No risk register found. Please go to dashboard and create one.'); return }
    createMutation.mutate({
      registerId,
      title: form.title,
      description: form.description || `Risk: ${form.title}`,
      category: form.category as never,
      inherentLikelihood: form.inherentLikelihood,
      inherentImpact: form.inherentImpact,
      residualLikelihood: form.residualLikelihood,
      residualImpact: form.residualImpact,
      response: 'MITIGATE',
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">First risk added!</h2>
          <p className="text-slate-500 text-sm mb-8">
            Your risk register is live. Head to the dashboard to score and monitor it, then add more risks as you go.
          </p>
          <button
            onClick={onDone}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-lg w-full">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add your first risk</h2>
            <p className="text-sm text-slate-500">You can always add more from the Risks page</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Risk Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Load shedding disrupts operations"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Inherent scoring */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">Before controls (Inherent Risk)</p>
            <div className="grid grid-cols-2 gap-4">
              {(['inherentLikelihood', 'inherentImpact'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-slate-500 mb-1.5">
                    {field === 'inherentLikelihood' ? 'Likelihood' : 'Impact'}{' '}
                    <span className="font-medium text-slate-700">{SCORE_LABELS[form[field]]}</span>
                  </label>
                  <input
                    type="range" min={1} max={5} step={1}
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                    className="w-full accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Residual scoring */}
          <div className="bg-teal-50 rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-teal-800">After controls (Residual Risk)</p>
            <div className="grid grid-cols-2 gap-4">
              {(['residualLikelihood', 'residualImpact'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-teal-600 mb-1.5">
                    {field === 'residualLikelihood' ? 'Likelihood' : 'Impact'}{' '}
                    <span className="font-medium text-teal-800">{SCORE_LABELS[form[field]]}</span>
                  </label>
                  <input
                    type="range" min={1} max={5} step={1}
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                    className="w-full accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-teal-400 mt-0.5">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding…' : (
                <><Plus className="w-4 h-4" /> Add Risk</>
              )}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="px-5 py-3 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              Skip <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
