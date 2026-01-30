'use client'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  strokeWidth = 1.5,
  className = '',
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        className={`inline-flex items-center justify-center text-slate-500 text-xs ${className}`}
        style={{ width, height }}
      >
        —
      </div>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Normalize data to fit within the SVG
  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Calculate points for the polyline
  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y = padding + chartHeight - ((value - min) / range) * chartHeight
      return `${x},${y}`
    })
    .join(' ')

  // Determine color based on trend (last vs first)
  const trend = data[data.length - 1] - data[0]
  // For risk scores, lower is better, so decreasing trend is green
  const strokeColor = trend < 0 ? '#22c55e' : trend > 0 ? '#ef4444' : '#94a3b8'
  const fillColor = trend < 0 ? 'rgba(34, 197, 94, 0.1)' : trend > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)'

  // Create a filled area under the line
  const firstPoint = `${padding},${padding + chartHeight}`
  const lastPoint = `${padding + chartWidth},${padding + chartHeight}`
  const areaPoints = `${firstPoint} ${points} ${lastPoint}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* Filled area */}
      <polygon points={areaPoints} fill={fillColor} />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point dot */}
      {data.length > 0 && (
        <circle
          cx={padding + chartWidth}
          cy={padding + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  )
}

interface SparklineWithLabelProps extends SparklineProps {
  label?: string
  showChange?: boolean
}

export function SparklineWithLabel({
  data,
  label,
  showChange = true,
  ...props
}: SparklineWithLabelProps) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center gap-2">
        <Sparkline data={data} {...props} />
        {label && <span className="text-xs text-slate-500">{label}</span>}
      </div>
    )
  }

  const change = data[data.length - 1] - data[0]
  const changeText = change === 0 ? '—' : change > 0 ? `+${change}` : `${change}`
  // For risk scores, lower is better
  const changeColor = change < 0 ? 'text-green-400' : change > 0 ? 'text-red-400' : 'text-slate-400'

  return (
    <div className="flex items-center gap-2">
      <Sparkline data={data} {...props} />
      {showChange && (
        <span className={`text-xs font-medium ${changeColor}`}>{changeText}</span>
      )}
      {label && <span className="text-xs text-slate-500">{label}</span>}
    </div>
  )
}
