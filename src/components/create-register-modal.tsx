'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

interface CreateRegisterModalProps {
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'form' | 'creating' | 'success' | 'error'

export function CreateRegisterModal({ onClose, onSuccess }: CreateRegisterModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')

  const router = useRouter()
  const createRegister = trpc.register.create.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Register name is required')
      return
    }

    setStep('creating')

    try {
      const result = await createRegister.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })

      setStep('success')

      // Navigate after a brief delay
      setTimeout(() => {
        router.push(`/risks/${result.id}`)
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create register')
      setStep('error')
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setStep('form')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Create Risk Register</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Form Step */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-2">
                  Register Name *
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g., Strategic Risks, Operational Risks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">
                  Give your register a meaningful name
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  placeholder="e.g., Strategic risks related to market position and growth..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Add context or scope for this register
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </form>
          )}

          {/* Creating Step */}
          {step === 'creating' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-300">Creating register...</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Register Created</h3>
              <p className="text-slate-400 text-sm">Redirecting...</p>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Something went wrong</h3>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
          {step === 'form' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Register
              </button>
            </>
          )}

          {step === 'error' && (
            <>
              <button
                onClick={() => setStep('form')}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
            </>
          )}

          {(step === 'creating' || step === 'success') && (
            <div className="text-slate-500 text-sm">
              {step === 'creating' ? 'Processing...' : 'Redirecting...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
