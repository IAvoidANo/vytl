'use client'

import { useState } from 'react'
import { X, Mail, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { toast } from 'sonner'

interface EmailForwardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EmailForwardModal({ isOpen, onClose, onSuccess }: EmailForwardModalProps) {
  const [fromEmail, setFromEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const processEmailMutation = trpc.risk.createFromEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`Risk "${data.title}" created in Inbox`)
      setFromEmail('')
      setSubject('')
      setBody('')
      setIsProcessing(false)
      onSuccess()
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process email')
      setIsProcessing(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required')
      return
    }

    setIsProcessing(true)
    processEmailMutation.mutate({
      fromEmail: fromEmail.trim(),
      subject: subject.trim(),
      body: body.trim(),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-800 rounded-xl border border-slate-700 shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Forward Email to Inbox</h2>
              <p className="text-xs text-slate-400">Paste email content to create a risk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coming Soon Banner */}
        <div className="mx-6 mt-4 px-4 py-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-teal-400">Coming Soon: Direct Email Forwarding</p>
              <p className="text-xs text-slate-400 mt-1">
                Forward emails directly to <span className="font-mono text-teal-400">risks@acme.vytl.app</span> to auto-create risks
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              From Email <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="sender@example.com"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              required
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email Body <span className="text-red-400">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the email content here..."
              required
              rows={8}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* AI Processing Info */}
          <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              AI will analyze the email content to extract risk details including title, description,
              suggested category, and preliminary risk scores. Review the created risk in the Inbox column.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Risk from Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
