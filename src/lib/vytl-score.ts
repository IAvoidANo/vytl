/**
 * Vytl Score Calculation Service
 *
 * Score breakdown (0-100):
 * - Risk Coverage (25 pts): Are all categories covered? Do risks have descriptions?
 * - Control Effectiveness (25 pts): Reduction ratio from inherent to residual scores
 * - Risk Maturity (25 pts): Owners assigned, due dates set, controls documented
 * - Trend Direction (25 pts): Are residual scores improving over time?
 */

import { db } from './db'

export interface ScoreBreakdown {
  coverage: {
    score: number
    maxScore: number
    details: {
      categoriesCovered: number
      totalCategories: number
      risksWithDescriptions: number
      totalRisks: number
    }
  }
  controlEffectiveness: {
    score: number
    maxScore: number
    details: {
      averageReduction: number
      risksWithControls: number
      totalRisks: number
    }
  }
  maturity: {
    score: number
    maxScore: number
    details: {
      risksWithOwners: number
      risksWithDueDates: number
      risksWithControls: number
      totalRisks: number
    }
  }
  trend: {
    score: number
    maxScore: number
    details: {
      improving: number
      stable: number
      worsening: number
      direction: 'improving' | 'stable' | 'worsening' | 'insufficient_data'
    }
  }
}

export interface VytlScoreResult {
  score: number
  grade: string
  gradeColor: string
  breakdown: ScoreBreakdown
  calculatedAt: Date
  riskCount: number
}

const ALL_CATEGORIES = [
  'STRATEGIC',
  'OPERATIONAL',
  'FINANCIAL',
  'COMPLIANCE',
  'TECHNOLOGY',
  'REPUTATIONAL',
  'ENVIRONMENTAL',
  'PEOPLE',
]

/**
 * Get letter grade from score
 */
export function getGrade(score: number): { grade: string; color: string } {
  if (score >= 80) return { grade: 'A', color: 'green' }
  if (score >= 60) return { grade: 'B', color: 'green' }
  if (score >= 40) return { grade: 'C', color: 'yellow' }
  if (score >= 20) return { grade: 'D', color: 'red' }
  return { grade: 'F', color: 'red' }
}

/**
 * Calculate Risk Coverage score (25 points max)
 * - Categories covered: up to 15 points
 * - Risks with meaningful descriptions: up to 10 points
 */
async function calculateCoverageScore(orgId: string): Promise<ScoreBreakdown['coverage']> {
  const risks = await db.risk.findMany({
    where: { register: { orgId } },
    select: { category: true, description: true },
  })

  const totalRisks = risks.length
  if (totalRisks === 0) {
    return {
      score: 0,
      maxScore: 25,
      details: {
        categoriesCovered: 0,
        totalCategories: ALL_CATEGORIES.length,
        risksWithDescriptions: 0,
        totalRisks: 0,
      },
    }
  }

  // Count unique categories covered
  const categoriesUsed = new Set(risks.map((r) => r.category))
  const categoriesCovered = categoriesUsed.size
  const categoryScore = Math.round((categoriesCovered / ALL_CATEGORIES.length) * 15)

  // Count risks with meaningful descriptions (>50 chars)
  const risksWithDescriptions = risks.filter((r) => r.description && r.description.length > 50).length
  const descriptionScore = Math.round((risksWithDescriptions / totalRisks) * 10)

  return {
    score: categoryScore + descriptionScore,
    maxScore: 25,
    details: {
      categoriesCovered,
      totalCategories: ALL_CATEGORIES.length,
      risksWithDescriptions,
      totalRisks,
    },
  }
}

/**
 * Calculate Control Effectiveness score (25 points max)
 * Measures the reduction from inherent to residual risk scores
 */
async function calculateControlEffectivenessScore(
  orgId: string
): Promise<ScoreBreakdown['controlEffectiveness']> {
  const risks = await db.risk.findMany({
    where: { register: { orgId } },
    select: {
      inherentScore: true,
      residualScore: true,
      controls: true,
    },
  })

  const totalRisks = risks.length
  if (totalRisks === 0) {
    return {
      score: 0,
      maxScore: 25,
      details: {
        averageReduction: 0,
        risksWithControls: 0,
        totalRisks: 0,
      },
    }
  }

  // Calculate average reduction percentage
  let totalReduction = 0
  let risksWithReduction = 0
  const risksWithControls = risks.filter((r) => r.controls && r.controls.length > 10).length

  for (const risk of risks) {
    if (risk.inherentScore > 0) {
      const reduction = ((risk.inherentScore - risk.residualScore) / risk.inherentScore) * 100
      if (reduction > 0) {
        totalReduction += reduction
        risksWithReduction++
      }
    }
  }

  const averageReduction = risksWithReduction > 0 ? totalReduction / risksWithReduction : 0

  // Score based on average reduction (0-50% reduction = 0-15 pts)
  // and having documented controls (0-10 pts)
  const reductionScore = Math.min(15, Math.round((averageReduction / 50) * 15))
  const controlsScore = Math.round((risksWithControls / totalRisks) * 10)

  return {
    score: reductionScore + controlsScore,
    maxScore: 25,
    details: {
      averageReduction: Math.round(averageReduction),
      risksWithControls,
      totalRisks,
    },
  }
}

/**
 * Calculate Risk Maturity score (25 points max)
 * - Risks with owners assigned: up to 10 points
 * - Risks with due dates: up to 8 points
 * - Risks with controls documented: up to 7 points
 */
async function calculateMaturityScore(orgId: string): Promise<ScoreBreakdown['maturity']> {
  const risks = await db.risk.findMany({
    where: { register: { orgId } },
    select: {
      ownerId: true,
      dueDate: true,
      controls: true,
    },
  })

  const totalRisks = risks.length
  if (totalRisks === 0) {
    return {
      score: 0,
      maxScore: 25,
      details: {
        risksWithOwners: 0,
        risksWithDueDates: 0,
        risksWithControls: 0,
        totalRisks: 0,
      },
    }
  }

  const risksWithOwners = risks.filter((r) => r.ownerId).length
  const risksWithDueDates = risks.filter((r) => r.dueDate).length
  const risksWithControls = risks.filter((r) => r.controls && r.controls.length > 10).length

  const ownerScore = Math.round((risksWithOwners / totalRisks) * 10)
  const dueDateScore = Math.round((risksWithDueDates / totalRisks) * 8)
  const controlsScore = Math.round((risksWithControls / totalRisks) * 7)

  return {
    score: ownerScore + dueDateScore + controlsScore,
    maxScore: 25,
    details: {
      risksWithOwners,
      risksWithDueDates,
      risksWithControls,
      totalRisks,
    },
  }
}

/**
 * Calculate Trend Direction score (25 points max)
 * Based on comparison with previous assessment
 */
async function calculateTrendScore(orgId: string): Promise<ScoreBreakdown['trend']> {
  // Get current average residual score
  const currentRisks = await db.risk.findMany({
    where: { register: { orgId } },
    select: { residualScore: true, updatedAt: true },
  })

  if (currentRisks.length === 0) {
    return {
      score: 12, // Neutral score for no data
      maxScore: 25,
      details: {
        improving: 0,
        stable: 0,
        worsening: 0,
        direction: 'insufficient_data',
      },
    }
  }

  // Get last assessment to compare
  const lastAssessment = await db.assessment.findFirst({
    where: { orgId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
  })

  if (!lastAssessment || !lastAssessment.scoreBreakdown) {
    // First assessment - give benefit of the doubt
    return {
      score: 15,
      maxScore: 25,
      details: {
        improving: 0,
        stable: currentRisks.length,
        worsening: 0,
        direction: 'stable',
      },
    }
  }

  // Compare with previous breakdown
  const prevBreakdown = lastAssessment.scoreBreakdown as unknown as ScoreBreakdown
  const prevControlScore = prevBreakdown.controlEffectiveness?.details?.averageReduction || 0

  // Determine trend direction
  // For simplicity, compare control effectiveness as a proxy for improvement
  const currentReduction = await db.risk.findMany({
    where: { register: { orgId } },
    select: { inherentScore: true, residualScore: true },
  })

  let totalCurrentReduction = 0
  for (const r of currentReduction) {
    if (r.inherentScore > 0) {
      totalCurrentReduction += ((r.inherentScore - r.residualScore) / r.inherentScore) * 100
    }
  }
  const avgCurrentReduction = currentReduction.length > 0 ? totalCurrentReduction / currentReduction.length : 0

  let direction: 'improving' | 'stable' | 'worsening' = 'stable'
  let score = 15

  if (avgCurrentReduction > prevControlScore + 5) {
    direction = 'improving'
    score = 25
  } else if (avgCurrentReduction < prevControlScore - 5) {
    direction = 'worsening'
    score = 5
  }

  return {
    score,
    maxScore: 25,
    details: {
      improving: direction === 'improving' ? currentRisks.length : 0,
      stable: direction === 'stable' ? currentRisks.length : 0,
      worsening: direction === 'worsening' ? currentRisks.length : 0,
      direction,
    },
  }
}

/**
 * Calculate complete Vytl Score for an organisation
 */
export async function calculateVytlScore(orgId: string): Promise<VytlScoreResult> {
  const [coverage, controlEffectiveness, maturity, trend] = await Promise.all([
    calculateCoverageScore(orgId),
    calculateControlEffectivenessScore(orgId),
    calculateMaturityScore(orgId),
    calculateTrendScore(orgId),
  ])

  const totalScore = coverage.score + controlEffectiveness.score + maturity.score + trend.score
  const { grade, color } = getGrade(totalScore)

  const riskCount = await db.risk.count({
    where: { register: { orgId } },
  })

  return {
    score: totalScore,
    grade,
    gradeColor: color,
    breakdown: {
      coverage,
      controlEffectiveness,
      maturity,
      trend,
    },
    calculatedAt: new Date(),
    riskCount,
  }
}

/**
 * Save assessment result to database
 */
export async function saveAssessment(
  orgId: string,
  result: VytlScoreResult,
  type: 'INITIAL' | 'QUARTERLY' | 'ANNUAL' | 'AD_HOC' = 'AD_HOC'
) {
  return db.assessment.create({
    data: {
      orgId,
      type,
      status: 'COMPLETED',
      completedAt: new Date(),
      vytlScore: result.score,
      vytlGrade: result.grade,
      scoreBreakdown: result.breakdown as object,
    },
  })
}

/**
 * Get latest assessment for an organisation
 */
export async function getLatestAssessment(orgId: string) {
  return db.assessment.findFirst({
    where: { orgId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
  })
}

/**
 * Get assessment history for trending
 */
export async function getAssessmentHistory(orgId: string, limit = 10) {
  return db.assessment.findMany({
    where: { orgId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: limit,
  })
}
