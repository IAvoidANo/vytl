'use client'

import { ArrowRight, Sparkles, FileSpreadsheet, PenTool } from 'lucide-react'

interface WelcomeScreenProps {
  organisationName: string
  onNext: () => void
  onStartFresh: () => void
}

export default function WelcomeScreen({
  organisationName,
  onNext,
  onStartFresh,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">VYTL</h1>
        <p className="text-sm text-slate-600 mt-1 tracking-wide">
          Active Strategic Risk Intelligence
        </p>
      </div>

      {/* Heading */}
      <div className="text-center mb-12 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Know Your Business Health Score
          <br />
          <span className="text-emerald-600">in 5 Minutes</span>
        </h2>
        <p className="text-lg text-slate-600">
          Welcome, <span className="font-semibold">{organisationName}</span>. Let&rsquo;s set up
          your risk intelligence dashboard.
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6 mb-12 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-600">Preview</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            What you&rsquo;ll get
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-bold text-slate-900">58</span>
          <span className="text-2xl font-semibold text-amber-600">C</span>
        </div>
        <p className="text-sm text-slate-600 mb-4">Your Vytl Score</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded p-2">
            <div className="text-slate-600">Risks</div>
            <div className="font-semibold text-slate-900">15 pre-scored</div>
          </div>
          <div className="bg-slate-50 rounded p-2">
            <div className="text-slate-600">Top Risk</div>
            <div className="font-semibold text-slate-900">Load Shedding</div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4 w-full max-w-2xl">
        <h3 className="text-lg font-semibold text-slate-900 text-center mb-6">
          Three ways to get started:
        </h3>

        {/* Option 1: Template (Primary) */}
        <button
          onClick={onNext}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold text-lg">Choose Your Industry Template</span>
              </div>
              <p className="text-emerald-50 text-sm">
                See 15 relevant risks instantly. Perfect for getting started quickly.
              </p>
              <p className="text-emerald-100 text-xs mt-2 font-medium">
                ⚡ Recommended &bull; 60 seconds to dashboard
              </p>
            </div>
            <ArrowRight className="h-6 w-6 ml-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Option 2: Import (Secondary) */}
        <button
          onClick={() => { window.location.href = '/risks?import=true' }}
          className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-lg p-6 shadow-sm hover:shadow transition-all duration-200 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-slate-700" />
                <span className="font-semibold text-lg text-slate-900">
                  Import Your Spreadsheet
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                Already have risks documented? We&rsquo;ll structure your existing data.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                📊 Supports Excel, CSV, PDF, Word
              </p>
            </div>
            <ArrowRight className="h-6 w-6 ml-4 text-slate-400" />
          </div>
        </button>

        {/* Option 3: Start Fresh (Tertiary) */}
        <button
          onClick={onStartFresh}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-6 shadow-sm hover:shadow transition-all duration-200 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <PenTool className="h-5 w-5 text-slate-700" />
                <span className="font-semibold text-lg text-slate-900">Start Fresh</span>
              </div>
              <p className="text-slate-600 text-sm">
                Build your risk register from scratch with guided workflows.
              </p>
              <p className="text-slate-500 text-xs mt-2">✍️ Full control &bull; Takes longer</p>
            </div>
            <ArrowRight className="h-6 w-6 ml-4 text-slate-400" />
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-slate-500">
        <p>Your data is encrypted and stored securely in South Africa</p>
        <p className="mt-1">POPIA compliant &bull; ISO 31000 aligned &bull; King V ready</p>
      </div>
    </div>
  )
}
