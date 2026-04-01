'use client'

import { trpc } from '@/lib/trpc-client'
import { useState, useEffect, useMemo } from 'react'
import { Activity } from 'lucide-react'

interface RiskPulseProps {
  className?: string
}

export function RiskPulse({ className = '' }: RiskPulseProps) {
  const { data: scoreData, isLoading } = trpc.assessment.current.useQuery()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const score = scoreData?.score ?? 0

  // Determine status based on VytlRx Score
  const status = useMemo(() => {
    if (score >= 70) {
      return {
        label: 'Healthy',
        color: 'text-green-400',
        bgColor: 'bg-green-500',
        badgeBg: 'bg-green-500/20',
        barColor: 'bg-green-500',
        gradient: 'from-green-500/20 via-green-500/5 to-transparent',
        glow: 'shadow-green-500/20',
      }
    } else if (score >= 40) {
      return {
        label: 'Elevated',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500',
        badgeBg: 'bg-amber-500/20',
        barColor: 'bg-amber-500',
        gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
        glow: 'shadow-amber-500/20',
      }
    } else {
      return {
        label: 'Critical',
        color: 'text-red-400',
        bgColor: 'bg-red-500',
        badgeBg: 'bg-red-500/20',
        barColor: 'bg-red-500',
        gradient: 'from-red-500/20 via-red-500/5 to-transparent',
        glow: 'shadow-red-500/20',
      }
    }
  }, [score])

  // Generate bar heights based on score - creates audio equalizer effect
  const barHeights = useMemo(() => {
    const numBars = 20
    const bars: number[] = []

    // Base height influenced by score (higher score = more variance, lower = more uniform/spiky)
    const baseHeight = score >= 70 ? 0.4 : score >= 40 ? 0.5 : 0.3
    const variance = score >= 70 ? 0.5 : score >= 40 ? 0.4 : 0.6

    for (let i = 0; i < numBars; i++) {
      // Create a wave pattern with some randomness
      const wave = Math.sin((i / numBars) * Math.PI * 2) * 0.3
      const random = (Math.random() - 0.5) * variance
      const height = Math.max(0.15, Math.min(1, baseHeight + wave + random))
      bars.push(height)
    }

    return bars
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, mounted]) // Re-generate on mount for animation effect

  // Animation speeds based on health
  const animationDuration = score >= 70 ? '3s' : score >= 40 ? '2s' : '1.2s'

  if (isLoading) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 h-full ${className}`}>
        <div className="animate-pulse h-full flex flex-col">
          <div className="px-4 py-2.5 border-b border-slate-700">
            <div className="h-4 bg-slate-700 rounded w-1/3"></div>
          </div>
          <div className="flex-1 p-4">
            <div className="h-full bg-slate-700 rounded"></div>
          </div>
          <div className="px-4 py-2 border-t border-slate-700">
            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br ${status.gradient} bg-slate-800 rounded-xl border border-slate-700 h-full flex flex-col overflow-hidden shadow-lg ${status.glow} ${className}`}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/30">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${status.color}`} />
          <h3 className="text-sm font-semibold text-white">Risk Pulse</h3>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.badgeBg} ${status.color}`}>
          {status.label}
        </div>
      </div>

      {/* Bar Visualization */}
      <div className="flex-1 p-4 flex items-end justify-center gap-1">
        {barHeights.map((height, index) => (
          <div
            key={index}
            className={`flex-1 max-w-3 rounded-t ${status.barColor} transition-all`}
            style={{
              height: `${height * 100}%`,
              opacity: 0.4 + (height * 0.6),
              animation: mounted ? `pulse-bar ${animationDuration} ease-in-out infinite` : 'none',
              animationDelay: `${index * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-700/50 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Based on VytlRx Score</span>
          <span className={`text-sm font-mono font-medium ${status.color}`}>
            {score}/100
          </span>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes pulse-bar {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(${score >= 70 ? 0.7 : score >= 40 ? 0.5 : 0.3});
          }
        }
      `}</style>
    </div>
  )
}
