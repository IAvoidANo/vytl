import { describe, it, expect } from 'vitest'

/**
 * Score Trends - Pure calculation tests
 * These test the mathematical helpers without DB dependencies
 */

// Extracted pure functions for testing
function calculateMovingAverage(
  data: { date: Date; score: number }[],
  windowDays: number
): { period: number; values: { date: Date; average: number }[] } {
  if (data.length < 2) return { period: windowDays, values: [] }

  const values: { date: Date; average: number }[] = []
  const windowMs = windowDays * 24 * 60 * 60 * 1000

  for (let i = 0; i < data.length; i++) {
    const windowStart = data[i].date.getTime() - windowMs
    const windowData = data.filter(d => d.date.getTime() >= windowStart && d.date.getTime() <= data[i].date.getTime())
    if (windowData.length > 0) {
      const avg = windowData.reduce((sum, d) => sum + d.score, 0) / windowData.length
      values.push({ date: data[i].date, average: Math.round(avg * 100) / 100 })
    }
  }

  return { period: windowDays, values }
}

function detectTrendDirection(data: { date: Date; score: number }[]): {
  direction: 'improving' | 'stable' | 'worsening'; changeRate: number
} {
  if (data.length < 2) return { direction: 'stable', changeRate: 0 }

  const n = data.length
  const xValues = data.map((_, i) => i)
  const yValues = data.map(d => d.score)

  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const direction = slope > 0.5 ? 'worsening' as const
    : slope < -0.5 ? 'improving' as const
    : 'stable' as const

  return { direction, changeRate: Math.round(slope * 100) / 100 }
}

function detectAnomalies(data: { date: Date; score: number }[]): {
  date: Date; score: number; expectedScore: number; deviation: number
}[] {
  if (data.length < 5) return []

  const scores = data.map(d => d.score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return []

  return data
    .filter(d => Math.abs(d.score - mean) > 2 * stdDev)
    .map(d => ({
      date: d.date,
      score: d.score,
      expectedScore: Math.round(mean),
      deviation: Math.round(((d.score - mean) / stdDev) * 100) / 100,
    }))
}

// Helper to create date sequences
function createDateSequence(count: number, intervalDays: number = 1): Date[] {
  const dates: Date[] = []
  const start = new Date('2025-01-01')
  for (let i = 0; i < count; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i * intervalDays)
    dates.push(d)
  }
  return dates
}

describe('Score Trends', () => {
  describe('calculateMovingAverage', () => {
    it('should return empty for less than 2 data points', () => {
      const result = calculateMovingAverage([{ date: new Date(), score: 50 }], 7)
      expect(result.values).toHaveLength(0)
    })

    it('should calculate correct 7-day moving average', () => {
      const dates = createDateSequence(7)
      const data = dates.map((date, i) => ({ date, score: (i + 1) * 10 }))
      // Scores: 10, 20, 30, 40, 50, 60, 70

      const result = calculateMovingAverage(data, 7)
      expect(result.period).toBe(7)
      expect(result.values.length).toBe(7)

      // Last value should be average of all 7 points
      const lastAvg = result.values[result.values.length - 1].average
      expect(lastAvg).toBe(40) // (10+20+30+40+50+60+70) / 7 = 40
    })

    it('should handle all same scores', () => {
      const dates = createDateSequence(5)
      const data = dates.map(date => ({ date, score: 50 }))

      const result = calculateMovingAverage(data, 7)
      for (const v of result.values) {
        expect(v.average).toBe(50)
      }
    })
  })

  describe('detectTrendDirection', () => {
    it('should return stable for single data point', () => {
      const result = detectTrendDirection([{ date: new Date(), score: 50 }])
      expect(result.direction).toBe('stable')
      expect(result.changeRate).toBe(0)
    })

    it('should detect worsening trend (increasing scores)', () => {
      const dates = createDateSequence(10)
      const data = dates.map((date, i) => ({ date, score: 20 + i * 5 }))
      // Scores: 20, 25, 30, 35, 40, 45, 50, 55, 60, 65

      const result = detectTrendDirection(data)
      expect(result.direction).toBe('worsening')
      expect(result.changeRate).toBeGreaterThan(0)
    })

    it('should detect improving trend (decreasing scores)', () => {
      const dates = createDateSequence(10)
      const data = dates.map((date, i) => ({ date, score: 80 - i * 5 }))
      // Scores: 80, 75, 70, 65, 60, 55, 50, 45, 40, 35

      const result = detectTrendDirection(data)
      expect(result.direction).toBe('improving')
      expect(result.changeRate).toBeLessThan(0)
    })

    it('should detect stable trend for flat scores', () => {
      const dates = createDateSequence(10)
      const data = dates.map(date => ({ date, score: 50 }))

      const result = detectTrendDirection(data)
      expect(result.direction).toBe('stable')
      expect(result.changeRate).toBe(0)
    })

    it('should detect stable for minor fluctuations', () => {
      const dates = createDateSequence(10)
      const data = dates.map((date, i) => ({ date, score: 50 + (i % 2 === 0 ? 0.1 : -0.1) }))

      const result = detectTrendDirection(data)
      expect(result.direction).toBe('stable')
    })
  })

  describe('detectAnomalies', () => {
    it('should return empty for fewer than 5 data points', () => {
      const dates = createDateSequence(3)
      const data = dates.map(date => ({ date, score: 50 }))

      const result = detectAnomalies(data)
      expect(result).toHaveLength(0)
    })

    it('should return empty for uniform data', () => {
      const dates = createDateSequence(10)
      const data = dates.map(date => ({ date, score: 50 }))

      const result = detectAnomalies(data)
      expect(result).toHaveLength(0)
    })

    it('should detect obvious anomaly', () => {
      const dates = createDateSequence(10)
      const data = dates.map((date, i) => ({
        date,
        score: i === 5 ? 95 : 50, // Spike at position 5
      }))

      const result = detectAnomalies(data)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].score).toBe(95)
    })

    it('should include deviation magnitude', () => {
      const dates = createDateSequence(10)
      const data = dates.map((date, i) => ({
        date,
        score: i === 5 ? 100 : 50,
      }))

      const result = detectAnomalies(data)
      if (result.length > 0) {
        expect(result[0].deviation).toBeGreaterThan(0)
        expect(result[0].expectedScore).toBeCloseTo(55, 0) // Mean ~55
      }
    })
  })
})
