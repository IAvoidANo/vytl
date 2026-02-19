/**
 * Scoring Recommendations
 *
 * Analyzes the risk register and returns actionable insights:
 * - Under-scored risks (description severity vs assigned score)
 * - Over-scored risks (strong controls but high score)
 * - Missing risk categories for the industry
 * - KRI gaps (risks without monitoring indicators)
 * - Scoring consistency (similar risks with different scores)
 */

import { db } from './db'
import { getIndustryProfile } from './industry-profiles'

export interface ScoringRecommendation {
  type: 'under_scored' | 'over_scored' | 'missing_category' | 'kri_gap' | 'inconsistency' | 'stale_assessment'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  riskId?: string
  riskRefCode?: string
  actionable: string // Suggested next step
}

const HIGH_SEVERITY_KEYWORDS = [
  /critical/i, /catastroph/i, /fatal/i, /breach/i, /fraud/i,
  /bankrupt/i, /shutdown/i, /regulatory action/i, /prosecution/i,
  /data loss/i, /security incident/i, /non.?compliance/i,
]

const LOW_SEVERITY_KEYWORDS = [
  /minor/i, /slight/i, /low.?impact/i, /minimal/i,
  /unlikely/i, /negligible/i, /routine/i, /standard/i,
]

/**
 * Generate all recommendations for an organisation
 */
export async function generateScoringRecommendations(
  orgId: string
): Promise<ScoringRecommendation[]> {
  const recommendations: ScoringRecommendation[] = []

  const [risks, kris, org, lastAssessment] = await Promise.all([
    db.risk.findMany({
      where: { register: { orgId } },
      select: {
        id: true,
        refCode: true,
        title: true,
        description: true,
        category: true,
        residualLikelihood: true,
        residualImpact: true,
        residualScore: true,
        controls: true,
        status: true,
        ownerId: true,
        updatedAt: true,
      },
    }),
    db.kri.findMany({
      where: { orgId, isActive: true },
      select: { name: true, status: true },
    }),
    db.organisation.findFirst({
      where: { id: orgId },
      select: { industry: true },
    }),
    db.assessment.findFirst({
      where: { orgId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
  ])

  if (risks.length === 0) {
    recommendations.push({
      type: 'missing_category',
      severity: 'warning',
      title: 'No risks registered',
      description: 'Your risk register is empty. Begin by documenting your key business risks.',
      actionable: 'Create your first risk entry in the risk register.',
    })
    return recommendations
  }

  // Check for under-scored risks
  recommendations.push(...detectUnderScoredRisks(risks))

  // Check for over-scored risks
  recommendations.push(...detectOverScoredRisks(risks))

  // Check for missing categories
  recommendations.push(...detectMissingCategories(risks, org?.industry || null))

  // Check for KRI gaps
  recommendations.push(...detectKriGaps(risks, kris))

  // Check for scoring inconsistencies
  recommendations.push(...detectInconsistencies(risks))

  // Check for stale assessments
  if (lastAssessment?.completedAt) {
    const daysSinceAssessment = Math.floor(
      (Date.now() - lastAssessment.completedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceAssessment > 90) {
      recommendations.push({
        type: 'stale_assessment',
        severity: 'warning',
        title: 'Assessment overdue',
        description: `Last assessment was ${daysSinceAssessment} days ago. Quarterly assessments are recommended.`,
        actionable: 'Run a new Vytl Score assessment to capture current risk posture.',
      })
    }
  }

  return recommendations.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

function detectUnderScoredRisks(risks: RiskItem[]): ScoringRecommendation[] {
  const results: ScoringRecommendation[] = []

  for (const risk of risks) {
    const highSeverityMatches = HIGH_SEVERITY_KEYWORDS.filter(p => p.test(risk.description)).length
    const isLowScored = risk.residualScore <= 6 // L×I ≤ 6

    if (highSeverityMatches >= 2 && isLowScored) {
      results.push({
        type: 'under_scored',
        severity: 'warning',
        title: `Potentially under-scored: ${risk.refCode}`,
        description: `"${risk.title}" contains high-severity language but has a low residual score (${risk.residualScore}/25). Review scoring.`,
        riskId: risk.id,
        riskRefCode: risk.refCode,
        actionable: 'Review and re-assess the likelihood and impact scores for this risk.',
      })
    }
  }

  return results
}

function detectOverScoredRisks(risks: RiskItem[]): ScoringRecommendation[] {
  const results: ScoringRecommendation[] = []

  for (const risk of risks) {
    const lowSeverityMatches = LOW_SEVERITY_KEYWORDS.filter(p => p.test(risk.description)).length
    const hasStrongControls = risk.controls && risk.controls.length > 200
    const isHighScored = risk.residualScore >= 15

    if ((lowSeverityMatches >= 2 || hasStrongControls) && isHighScored) {
      const reason = hasStrongControls
        ? 'has extensive controls documented but still carries a high residual score'
        : 'uses low-severity language but has a high residual score'

      results.push({
        type: 'over_scored',
        severity: 'info',
        title: `Potentially over-scored: ${risk.refCode}`,
        description: `"${risk.title}" ${reason} (${risk.residualScore}/25). Controls may warrant a score reduction.`,
        riskId: risk.id,
        riskRefCode: risk.refCode,
        actionable: 'Review whether residual scores reflect current control effectiveness.',
      })
    }
  }

  return results
}

function detectMissingCategories(
  risks: RiskItem[],
  industry: string | null
): ScoringRecommendation[] {
  const results: ScoringRecommendation[] = []
  const coveredCategories = new Set(risks.map(r => r.category))

  const allCategories = [
    'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
    'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
  ]

  // Get industry-important categories
  let importantCategories: string[] = allCategories
  if (industry) {
    const profile = getIndustryProfile(industry)
    if (profile) {
      importantCategories = Object.entries(profile.categoryMultipliers)
        .filter(([, weight]) => weight >= 1.2)
        .map(([cat]) => cat)
    }
  }

  for (const category of importantCategories) {
    if (!coveredCategories.has(category)) {
      const isIndustryImportant = industry ? true : false
      results.push({
        type: 'missing_category',
        severity: isIndustryImportant ? 'warning' : 'info',
        title: `Missing risk category: ${category}`,
        description: `No risks documented in the ${category} category.${isIndustryImportant ? ` This category is particularly important for your industry.` : ''}`,
        actionable: `Consider whether your organisation faces ${category.toLowerCase()} risks that should be documented.`,
      })
    }
  }

  return results
}

function detectKriGaps(
  risks: RiskItem[],
  kris: { name: string; status: string }[]
): ScoringRecommendation[] {
  const results: ScoringRecommendation[] = []

  const highRisks = risks.filter(r => r.residualScore >= 15)

  if (highRisks.length > 0 && kris.length === 0) {
    results.push({
      type: 'kri_gap',
      severity: 'critical',
      title: 'No KRIs monitoring high risks',
      description: `You have ${highRisks.length} high-scored risk(s) but no Key Risk Indicators configured for monitoring.`,
      actionable: 'Create KRIs to monitor your highest-priority risks.',
    })
  } else if (highRisks.length > kris.length * 2) {
    results.push({
      type: 'kri_gap',
      severity: 'warning',
      title: 'Insufficient KRI coverage',
      description: `${highRisks.length} high risks but only ${kris.length} KRI(s). Consider adding more monitoring indicators.`,
      actionable: 'Add KRIs for risk categories that lack monitoring coverage.',
    })
  }

  return results
}

function detectInconsistencies(risks: RiskItem[]): ScoringRecommendation[] {
  const results: ScoringRecommendation[] = []

  // Group by category and check for large score variances
  const categoryGroups = new Map<string, RiskItem[]>()
  for (const risk of risks) {
    const group = categoryGroups.get(risk.category) || []
    group.push(risk)
    categoryGroups.set(risk.category, group)
  }

  for (const [category, group] of Array.from(categoryGroups)) {
    if (group.length < 3) continue

    const scores = group.map(r => r.residualScore)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)

    // High variance in same category suggests inconsistent scoring
    if (stdDev > 7) {
      const lowest = group.reduce((min, r) => r.residualScore < min.residualScore ? r : min)
      const highest = group.reduce((max, r) => r.residualScore > max.residualScore ? r : max)

      results.push({
        type: 'inconsistency',
        severity: 'info',
        title: `Scoring variance in ${category}`,
        description: `${category} risks range from ${lowest.residualScore}/25 (${lowest.refCode}) to ${highest.residualScore}/25 (${highest.refCode}). Large variance may indicate inconsistent scoring criteria.`,
        actionable: 'Review scoring consistency across risks in this category.',
      })
    }
  }

  return results
}

type RiskItem = {
  id: string
  refCode: string
  title: string
  description: string
  category: string
  residualLikelihood: number
  residualImpact: number
  residualScore: number
  controls: string | null
  status: string
  ownerId: string | null
  updatedAt: Date
}
