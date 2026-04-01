'use client'

import { X, Zap } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'

interface UpgradePromptProps {
  type: 'risks' | 'users' | 'feature'
  featureName?: string
  onClose: () => void
}

export function UpgradePrompt({ type, featureName, onClose }: UpgradePromptProps) {
  const messages = {
    risks: {
      title: 'Risk limit reached',
      body: `Your Free plan includes up to ${PLAN_LIMITS.FREE.maxRisks} risks. Upgrade to Professional for unlimited risks.`,
    },
    users: {
      title: 'User limit reached',
      body: `Your Free plan includes up to ${PLAN_LIMITS.FREE.maxUsers} users. Upgrade to Professional for unlimited team members.`,
    },
    feature: {
      title: `${featureName ?? 'This feature'} requires Professional`,
      body: 'Upgrade to unlock board report PDF export, AI analysis, movement & trend reporting, and more.',
    },
  }

  const { title, body } = messages[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-900/30 mx-auto mb-6">
          <Zap className="w-7 h-7 text-teal-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">{body}</p>

        <div className="space-y-3">
          <a
            href="mailto:hello@vytlrx.app?subject=Upgrade%20to%20Professional"
            className="block w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg text-sm text-center transition-colors"
          >
            Upgrade to Professional
          </a>
          <button
            onClick={onClose}
            className="block w-full py-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm text-center transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
