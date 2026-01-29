'use client'

import { trpc } from '@/lib/trpc-client'
import { Activity } from 'lucide-react'

interface RiskPulseProps {
  className?: string
}

export function RiskPulse({ className = '' }: RiskPulseProps) {
  const { data: scoreData, isLoading } = trpc.assessment.current.useQuery()

  if (isLoading) {
    return (
      <div className={`bg-slate-800 rounded-lg p-3 border border-slate-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-3 bg-slate-700 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const score = scoreData?.score ?? 0

  // Determine pulse state based on Vytl Score
  let pulseState: 'healthy' | 'elevated' | 'critical'
  let pulseColor: string
  let pulseSpeed: string
  let statusText: string
  let bgColor: string

  if (score >= 70) {
    pulseState = 'healthy'
    pulseColor = 'bg-green-500'
    pulseSpeed = 'animate-pulse-slow'
    statusText = 'Healthy'
    bgColor = 'bg-green-500/20'
  } else if (score >= 40) {
    pulseState = 'elevated'
    pulseColor = 'bg-amber-500'
    pulseSpeed = 'animate-pulse'
    statusText = 'Elevated'
    bgColor = 'bg-amber-500/20'
  } else {
    pulseState = 'critical'
    pulseColor = 'bg-red-500'
    pulseSpeed = 'animate-pulse-fast'
    statusText = 'Critical'
    bgColor = 'bg-red-500/20'
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-3 border border-slate-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Risk Pulse</p>
          <div className="flex items-center gap-2">
            {/* Animated pulse rings */}
            <div className="relative">
              <div className={`w-3 h-3 ${pulseColor} rounded-full ${pulseSpeed}`}></div>
              <div className={`absolute inset-0 w-3 h-3 ${pulseColor} rounded-full ${pulseSpeed} opacity-75`} style={{ animationDelay: '0.5s' }}></div>
            </div>
            <span className={`text-sm font-semibold ${
              pulseState === 'healthy' ? 'text-green-400' :
              pulseState === 'elevated' ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {statusText}
            </span>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Activity className={`w-4 h-4 ${
            pulseState === 'healthy' ? 'text-green-400' :
            pulseState === 'elevated' ? 'text-amber-400' :
            'text-red-400'
          }`} />
        </div>
      </div>

      {/* Pulse visualization - compact */}
      <div className="mt-2">
        <div className="flex items-center gap-0.5">
          {[...Array(12)].map((_, i) => {
            const height = Math.sin((i / 12) * Math.PI * 2) * 0.5 + 0.5
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${pulseColor} ${pulseSpeed}`}
                style={{
                  height: `${6 + height * 10}px`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0.4 + height * 0.6,
                }}
              />
            )
          })}
        </div>
      </div>

      <p className="text-[10px] text-slate-500 mt-1.5">
        Vytl Score: {score}/100
      </p>
    </div>
  )
}
