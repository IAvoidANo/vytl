'use client'

import { trpc } from '@/lib/trpc-client'

interface KriSparklineProps {
  kriId: string
  currentStatus: 'GREEN' | 'AMBER' | 'RED'
}

const STATUS_COLOUR: Record<string, string> = {
  GREEN: '#22c55e',
  AMBER: '#f59e0b',
  RED: '#ef4444',
}

export function KriSparkline({ kriId, currentStatus }: KriSparklineProps) {
  const { data: history } = trpc.kri.getHistory.useQuery(
    { id: kriId, limit: 20 },
    { staleTime: 60_000 }
  )

  if (!history || history.length < 2) {
    return (
      <span className="text-xs text-slate-400 italic">No history</span>
    )
  }

  const values = history.map((h) => h.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const W = 80
  const H = 28
  const pad = 2

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x},${y}`
  })

  const lineColour = STATUS_COLOUR[currentStatus] ?? '#94a3b8'

  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={lineColour}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Last point dot */}
      {points.length > 0 && (() => {
        const last = points[points.length - 1].split(',')
        return (
          <circle cx={last[0]} cy={last[1]} r={2.5} fill={lineColour} />
        )
      })()}
    </svg>
  )
}
