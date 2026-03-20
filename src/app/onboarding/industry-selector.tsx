'use client'

import { ArrowLeft, Factory, Landmark, ShoppingCart, Loader2, Check } from 'lucide-react'
import { type IndustryCode } from '@/lib/industry-templates'
import { cn } from '@/lib/utils'

interface IndustrySelectorProps {
  onSelect: (industryCode: IndustryCode) => void
  onBack: () => void
  isApplying: boolean
  selectedCode: IndustryCode | null
}

const INDUSTRIES = [
  {
    code: 'MANUFACTURING' as IndustryCode,
    name: 'Manufacturing & Production',
    description: 'Production facilities, assembly operations, manufacturing',
    icon: Factory,
    riskCount: 15,
    benchmarkScore: 58,
    sampleRisks: [
      'Load shedding production downtime',
      'OHS Act non-compliance',
      'B-BBEE scorecard deterioration',
    ],
  },
  {
    code: 'FINANCIAL_SERVICES' as IndustryCode,
    name: 'Financial Services',
    description: 'Banks, insurance, investment management, advisory',
    icon: Landmark,
    riskCount: 15,
    benchmarkScore: 62,
    sampleRisks: [
      'FICA/AML programme deficiencies',
      'Cyber fraud and banking malware',
      'Credit risk — NPL deterioration',
    ],
  },
  {
    code: 'RETAIL' as IndustryCode,
    name: 'Retail & Consumer',
    description: 'Retail stores, e-commerce, wholesale, consumer goods',
    icon: ShoppingCart,
    riskCount: 15,
    benchmarkScore: 54,
    sampleRisks: [
      'E-commerce competition',
      'Shrinkage and theft',
      'Load shedding — trading hours loss',
    ],
  },
]

export default function IndustrySelector({
  onSelect,
  onBack,
  isApplying,
  selectedCode,
}: IndustrySelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative">
      {/* Back button */}
      {!isApplying && (
        <button
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-12 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Choose Your Industry
        </h2>
        <p className="text-lg text-slate-600">
          We&rsquo;ll populate your dashboard with 15 relevant risks. You can customise
          everything afterwards.
        </p>
      </div>

      {/* Industry cards */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mb-8">
        {INDUSTRIES.map((industry) => {
          const Icon = industry.icon
          const isSelected = selectedCode === industry.code
          const isProcessing = isApplying && isSelected

          return (
            <button
              key={industry.code}
              onClick={() => !isApplying && onSelect(industry.code)}
              disabled={isApplying}
              className={cn(
                'relative overflow-hidden bg-white rounded-xl p-6 shadow-md text-left border-2 transition-all duration-200',
                isSelected
                  ? 'border-emerald-500 shadow-emerald-100 shadow-xl'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xl',
                isApplying && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                  ) : (
                    <div className="bg-emerald-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              )}

              {/* Icon */}
              <div className="mb-4">
                <div
                  className={cn(
                    'inline-flex p-3 rounded-lg',
                    isSelected ? 'bg-emerald-100' : 'bg-slate-100',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-8 w-8',
                      isSelected ? 'text-emerald-600' : 'text-slate-700',
                    )}
                  />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{industry.name}</h3>
              <p className="text-sm text-slate-600 mb-4">{industry.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div>
                  <span className="text-slate-500">Risks:</span>{' '}
                  <span className="font-semibold text-slate-900">{industry.riskCount}</span>
                </div>
                <div>
                  <span className="text-slate-500">Benchmark:</span>{' '}
                  <span className="font-semibold text-slate-900">{industry.benchmarkScore}</span>
                </div>
              </div>

              {/* Sample risks */}
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Sample Risks:
                </p>
                <ul className="space-y-1">
                  {industry.sampleRisks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900">
                      Populating your dashboard...
                    </p>
                    <p className="text-xs text-slate-600 mt-1">This takes a few seconds</p>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Help text */}
      <p className="text-center text-sm text-slate-500 max-w-xl">
        Don&rsquo;t see your industry? Choose the closest match — you can customise all risks
        afterwards.
      </p>
    </div>
  )
}
