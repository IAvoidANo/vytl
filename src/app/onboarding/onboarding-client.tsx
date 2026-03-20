'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import WelcomeScreen from './welcome-screen'
import IndustrySelector from './industry-selector'
import ConfirmationScreen from './confirmation-screen'
import { type IndustryCode } from '@/lib/industry-templates'

interface OnboardingClientProps {
  organisationName: string
}

type OnboardingStep = 'welcome' | 'industry' | 'confirmation'

interface TemplateResult {
  registerId: string
  riskCount: number
  vytlScore: number
  grade: string
}

export default function OnboardingClient({ organisationName }: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryCode | null>(null)
  const [templateResult, setTemplateResult] = useState<TemplateResult | null>(null)

  const applyMutation = trpc.template.applyTemplate.useMutation({
    onSuccess: (data) => {
      setTemplateResult(data)
      setStep('confirmation')
    },
    onError: (err) => {
      console.error('Template application error:', err)
      alert('Failed to apply template. Please try again.')
    },
  })

  const handleIndustrySelect = (industryCode: IndustryCode) => {
    setSelectedIndustry(industryCode)
    applyMutation.mutate({ industryCode })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {step === 'welcome' && (
        <WelcomeScreen
          organisationName={organisationName}
          onNext={() => setStep('industry')}
          onStartFresh={() => router.push('/dashboard')}
        />
      )}

      {step === 'industry' && (
        <IndustrySelector
          onSelect={handleIndustrySelect}
          onBack={() => setStep('welcome')}
          isApplying={applyMutation.isPending}
          selectedCode={selectedIndustry}
        />
      )}

      {step === 'confirmation' && templateResult && (
        <ConfirmationScreen
          industryCode={selectedIndustry!}
          riskCount={templateResult.riskCount}
          vytlScore={templateResult.vytlScore}
          grade={templateResult.grade}
          onViewDashboard={() => router.push('/dashboard')}
          onEditRisks={() => router.push('/risks')}
        />
      )}
    </div>
  )
}
