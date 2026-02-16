/**
 * Score Trend Analysis
 *
 * Historical trend analysis for risk scores including:
 * - Moving averages (7-day, 30-day)
 * - Trend direction detection
 * - Anomaly detection (sudden changes)
 * - Simple linear forecast
 * - Category-level aggregation
 */

import { db } from './db'

export interface TrendDataPoint {
  date: Date
  score: number
}

export interface MovingAverage {
  period: number // days
  values: { date: Date; average: number }[]
}

export interface TrendAnalysis {
  riskId?: string
  orgId: string
  timeRange: { start: Date; end: Date }
  dataPoints: TrendDataPoint[]
  movingAverages: {
    sevenDay: MovingAverage
    thirtyDay: MovingAverage
  }
  direction: 'improving' | 'stable' | 'worsening'
  changeRate: number // average points per day
  anomalies: { date: Date; score: number; expectedScore: number; deviation: number }[]
  forecast: { date: Date; predictedScore: number }[]
}

export interface CategoryTrend {
  category: string
  riskCount: number
  averageScore: number
  direction: 'improving' | 'stable' | 'worsening'
  changeRate: number
}

/**
 * Analyze score trends for a specific risk
 */
export async function analyzeRiskTrend(
  riskId: string,
  orgId: string,
  daysBack: number = 90
): Promise<TrendAnalysis> {
  const start = new Date()
  start.setDate(start.getDate() - daysBack)
  const end = new Date()

  // Get score history
  const history = await db.scoreHistory.findMany({
    where: {
      riskId,
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, compositeScore: true },
  })

  const dataPoints = history.map(h => ({ date: h.createdAt, score: h.compositeScore }))

  return buildTrendAnalysis(dataPoints, orgId, { start, end }, riskId)
}

/**
 * Analyze org-wide score trends
 */
export async function analyzeOrgTrend(
  orgId: string,
  daysBack: number = 90
): Promise<TrendAnalysis> {
  const start = new Date()
  start.setDate(start.getDate() - daysBack)
  const end = new Date()

  // Get assessment history as org-level data points
  const assessments = await db.assessment.findMany({
    where: {
      orgId,
      status: 'COMPLETED',
      completedAt: { gte: start, lte: end },
    },
    orderBy: { completedAt: 'asc' },
    select: { completedAt: true, vytlScore: true },
  })

  const dataPoints = assessments
    .filter(a => a.completedAt && a.vytlScore !== null)
    .map(a => ({ date: a.completedAt!, score: a.vytlScore! }))

  return buildTrendAnalysis(dataPoints, orgId, { start, end })
}

/**
 * Get trends broken down by risk category
 */
export async function analyzeCategoryTrends(orgId: string): Promise<CategoryTrend[]> {
  const risks = await db.risk.findMany({
    where: { register: { orgId } },
    select: { id: true, category: true, residualScore: true },
  })

  // Group by category
  const categoryGroups = new Map<string, { scores: number[]; ids: string[] }>()
  for (const risk of risks) {
    const group = categoryGroups.get(risk.category) || { scores: [], ids: [] }
    group.scores.push(risk.residualScore)
    group.ids.push(risk.id)
    categoryGroups.set(risk.category, group)
  }

  const results: CategoryTrend[] = []

  for (const [category, group] of categoryGroups) {
    const avgScore = group.scores.length > 0
      ? Math.round(group.scores.reduce((a, b) => a + b, 0) / group.scores.length)
      : 0

    // Get recent score changes from audit logs for this category's risks
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentChanges = await db.auditLog.findMany({
      where: {
        entityType: 'RISK',
        entityId: { in: group.ids },
        action: 'UPDATE',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { oldValues: true, newValues: true },
    })

    let totalChange = 0
    let changeCount = 0
    for (const log of recentChanges) {
      const oldVals = log.oldValues as Record<string, unknown> | null
      const newVals = log.newValues as Record<string, unknown> | null
      if (!oldVals || !newVals) continue
      const oldScore = typeof oldVals.residualScore === 'number' ? oldVals.residualScore : null
      const newScore = typeof newVals.residualScore === 'number' ? newVals.residualScore : null
      if (oldScore !== null && newScore !== null) {
        totalChange += newScore - oldScore
        changeCount++
      }
    }

    const changeRate = changeCount > 0 ? totalChange / changeCount : 0
    const direction = changeRate > 0.5 ? 'worsening' as const
      : changeRate < -0.5 ? 'improving' as const
      : 'stable' as const

    results.push({
      category,
      riskCount: group.scores.length,
      averageScore: avgScore,
      direction,
      changeRate: Math.round(changeRate * 100) / 100,
    })
  }

  return results.sort((a, b) => b.averageScore - a.averageScore)
}

// ============================================
// INTERNAL HELPERS
// ============================================

function buildTrendAnalysis(
  dataPoints: TrendDataPoint[],
  orgId: string,
  timeRange: { start: Date; end: Date },
  riskId?: string,
): TrendAnalysis {
  const sevenDay = calculateMovingAverage(dataPoints, 7)
  const thirtyDay = calculateMovingAverage(dataPoints, 30)

  const { direction, changeRate } = detectTrendDirection(dataPoints)
  const anomalies = detectAnomalies(dataPoints)
  const forecast = generateForecast(dataPoints, 30)

  return {
    riskId,
    orgId,
    timeRange,
    dataPoints,
    movingAverages: { sevenDay, thirtyDay },
    direction,
    changeRate,
    anomalies,
    forecast,
  }
}

function calculateMovingAverage(data: TrendDataPoint[], windowDays: number): MovingAverage {
  if (data.length < 2) {
    return { period: windowDays, values: [] }
  }

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

function detectTrendDirection(data: TrendDataPoint[]): {
  direction: 'improving' | 'stable' | 'worsening'
  changeRate: number
} {
  if (data.length < 2) {
    return { direction: 'stable', changeRate: 0 }
  }

  // Simple linear regression
  const n = data.length
  const xValues = data.map((_, i) => i)
  const yValues = data.map(d => d.score)

  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

  // For risk scores: positive slope = worsening, negative = improving
  const direction = slope > 0.5 ? 'worsening' as const
    : slope < -0.5 ? 'improving' as const
    : 'stable' as const

  return { direction, changeRate: Math.round(slope * 100) / 100 }
}

function detectAnomalies(data: TrendDataPoint[]): {
  date: Date; score: number; expectedScore: number; deviation: number
}[] {
  if (data.length < 5) return []

  // Calculate mean and standard deviation
  const scores = data.map(d => d.score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return []

  // Flag points > 2 standard deviations from mean
  return data
    .filter(d => Math.abs(d.score - mean) > 2 * stdDev)
    .map(d => ({
      date: d.date,
      score: d.score,
      expectedScore: Math.round(mean),
      deviation: Math.round(((d.score - mean) / stdDev) * 100) / 100,
    }))
}

function generateForecast(
  data: TrendDataPoint[],
  forecastDays: number
): { date: Date; predictedScore: number }[] {
  if (data.length < 3) return []

  // Simple linear regression for forecasting
  const n = data.length
  const xValues = data.map((_, i) => i)
  const yValues = data.map(d => d.score)

  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return []

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  // Generate forecast points (weekly intervals)
  const lastDate = data[data.length - 1].date
  const forecast: { date: Date; predictedScore: number }[] = []

  for (let week = 1; week <= Math.ceil(forecastDays / 7); week++) {
    const futureDate = new Date(lastDate)
    futureDate.setDate(futureDate.getDate() + week * 7)

    const futureX = n - 1 + week
    const predicted = Math.round(intercept + slope * futureX)

    forecast.push({
      date: futureDate,
      predictedScore: Math.max(0, Math.min(100, predicted)),
    })
  }

  return forecast
}
