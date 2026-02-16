/**
 * Risk Scoring Engine
 *
 * Enhanced scoring with 5 weighted dimensions (0-100 composite):
 * - Base Score (default 40%): Traditional likelihood × impact, normalized
 * - Control Quality (default 20%): Depth and specificity of documented controls
 * - Velocity (default 15%): Rate of score change over time
 * - Correlation (default 15%): Connectedness to other high-scoring risks
 * - KRI Alignment (default 10%): Whether linked KRIs trend in concerning directions
 */

import { db } from './db'

// ============================================
// TYPES
// ============================================

export interface ScoringWeights {
  base: number
  controlQuality: number
  velocity: number
  correlation: number
  kriAlignment: number
}

export interface DimensionScore {
  score: number    // 0-100 normalized
  maxScore: number // always 100
  details: Record<string, unknown>
}

export interface CompositeScoreResult {
  compositeScore: number // 0-100 weighted
  grade: string
  gradeColor: string
  dimensions: {
    base: DimensionScore
    controlQuality: DimensionScore
    velocity: DimensionScore
    correlation: DimensionScore
    kriAlignment: DimensionScore
  }
  rulesApplied: { ruleName: string; modifier: number }[]
  profileId: string | null
  calculatedAt: Date
}

export interface BatchScoreResult {
  scores: { riskId: string; refCode: string; title: string; score: CompositeScoreResult }[]
  aggregate: {
    averageScore: number
    medianScore: number
    highestScore: { riskId: string; score: number }
    lowestScore: { riskId: string; score: number }
    distribution: { low: number; medium: number; high: number; critical: number }
  }
  calculatedAt: Date
}

interface ScoringProfile {
  id: string
  weightBase: number
  weightControlQuality: number
  weightVelocity: number
  weightCorrelation: number
  weightKriAlignment: number
  categoryMultipliers: Record<string, number> | null
  thresholdLow: number
  thresholdMedium: number
  thresholdHigh: number
  rules: ScoringRule[]
}

interface ScoringRule {
  id: string
  name: string
  isActive: boolean
  priority: number
  conditionField: string
  conditionOperator: string
  conditionValue: string
  scoreModifier: number
  modifierType: string
}

interface RiskData {
  id: string
  refCode: string
  title: string
  description: string
  category: string
  inherentLikelihood: number
  inherentImpact: number
  inherentScore: number
  residualLikelihood: number
  residualImpact: number
  residualScore: number
  controls: string | null
  rootCause: string | null
  status: string
  ownerId: string | null
  dueDate: Date | null
  updatedAt: Date
}

// ============================================
// DIMENSION CALCULATIONS
// ============================================

/**
 * Base Score: Traditional L×I normalized to 0-100
 */
export function calculateBaseScore(risk: RiskData): DimensionScore {
  // Residual score ranges 1-25, normalize to 0-100
  // Score of 1 = 0 risk (best), score of 25 = 100 risk (worst)
  const normalized = Math.round(((risk.residualScore - 1) / 24) * 100)

  return {
    score: Math.max(0, Math.min(100, normalized)),
    maxScore: 100,
    details: {
      residualLikelihood: risk.residualLikelihood,
      residualImpact: risk.residualImpact,
      residualScore: risk.residualScore,
      inherentScore: risk.inherentScore,
      reductionPercent: risk.inherentScore > 0
        ? Math.round(((risk.inherentScore - risk.residualScore) / risk.inherentScore) * 100)
        : 0,
    },
  }
}

/**
 * Control Quality Score: Evaluates depth and specificity of controls
 */
export function calculateControlQualityScore(risk: RiskData): DimensionScore {
  const controls = risk.controls || ''
  let score = 0
  const details: Record<string, unknown> = {}

  if (controls.length === 0) {
    // No controls documented = high risk score (100 = worst)
    return { score: 100, maxScore: 100, details: { hasControls: false, reason: 'No controls documented' } }
  }

  // Length scoring (longer = more detailed = better = lower risk)
  const lengthScore = controls.length > 500 ? 0 : controls.length > 200 ? 20 : controls.length > 50 ? 50 : 80
  details.lengthScore = lengthScore
  details.controlLength = controls.length

  // Specificity scoring: check for actionable keywords
  const actionablePatterns = [
    /implement/i, /monitor/i, /review/i, /audit/i, /train/i,
    /encrypt/i, /backup/i, /restrict/i, /segregat/i, /automat/i,
    /policy/i, /procedure/i, /checklist/i, /approval/i, /escalat/i,
  ]
  const matchCount = actionablePatterns.filter(p => p.test(controls)).length
  const specificityScore = matchCount >= 5 ? 0 : matchCount >= 3 ? 20 : matchCount >= 1 ? 50 : 80
  details.specificityScore = specificityScore
  details.actionableTerms = matchCount

  // Numbered items suggest structured controls
  const numberedItems = (controls.match(/^\d+[\.\)]/gm) || []).length
  const bulletItems = (controls.match(/^[-•*]/gm) || []).length
  const structureBonus = (numberedItems + bulletItems) >= 3 ? -15 : 0
  details.structuredItems = numberedItems + bulletItems

  // Root cause documented reduces risk
  const rootCauseBonus = risk.rootCause && risk.rootCause.length > 20 ? -10 : 0
  details.hasRootCause = !!risk.rootCause

  // Average and invert (lower risk = better controls)
  score = Math.round((lengthScore + specificityScore) / 2) + structureBonus + rootCauseBonus
  score = Math.max(0, Math.min(100, score))

  return { score, maxScore: 100, details }
}

/**
 * Velocity Score: Rate of score change over time
 * Higher velocity of worsening = higher risk score
 */
export async function calculateVelocityScore(riskId: string): Promise<DimensionScore> {
  // Get score history from audit logs (residualScore changes)
  const recentLogs = await db.auditLog.findMany({
    where: {
      entityType: 'RISK',
      entityId: riskId,
      action: 'UPDATE',
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { oldValues: true, newValues: true, createdAt: true },
  })

  if (recentLogs.length < 2) {
    return {
      score: 50, // Neutral - insufficient data
      maxScore: 100,
      details: { dataPoints: recentLogs.length, direction: 'insufficient_data' },
    }
  }

  // Extract score changes
  const scoreChanges: { change: number; daysAgo: number }[] = []
  const now = Date.now()

  for (const log of recentLogs) {
    const oldVals = log.oldValues as Record<string, unknown> | null
    const newVals = log.newValues as Record<string, unknown> | null
    if (!oldVals || !newVals) continue

    const oldScore = typeof oldVals.residualScore === 'number' ? oldVals.residualScore : null
    const newScore = typeof newVals.residualScore === 'number' ? newVals.residualScore : null
    if (oldScore === null || newScore === null) continue

    const daysAgo = (now - log.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    scoreChanges.push({ change: newScore - oldScore, daysAgo })
  }

  if (scoreChanges.length === 0) {
    return { score: 50, maxScore: 100, details: { dataPoints: 0, direction: 'stable' } }
  }

  // Calculate weighted average change (recent changes weighted more heavily)
  let weightedChange = 0
  let totalWeight = 0
  for (const sc of scoreChanges) {
    const weight = Math.max(0.1, 1 - (sc.daysAgo / 90)) // Decay over 90 days
    weightedChange += sc.change * weight
    totalWeight += weight
  }
  const avgChange = totalWeight > 0 ? weightedChange / totalWeight : 0

  // Map change to score: worsening (+change) = high score, improving (-change) = low score
  // avgChange range is roughly -24 to +24 (max possible score change)
  const normalized = Math.round(50 + (avgChange / 24) * 50)
  const score = Math.max(0, Math.min(100, normalized))

  const direction = avgChange > 1 ? 'worsening' : avgChange < -1 ? 'improving' : 'stable'

  return {
    score,
    maxScore: 100,
    details: {
      dataPoints: scoreChanges.length,
      averageChange: Math.round(avgChange * 100) / 100,
      direction,
    },
  }
}

/**
 * Correlation Score: How connected this risk is to other high-scoring risks
 * More correlated high-risk items = higher composite risk
 */
export async function calculateCorrelationScore(
  risk: RiskData,
  orgId: string
): Promise<DimensionScore> {
  // Get all risks in the same org
  const orgRisks = await db.risk.findMany({
    where: {
      register: { orgId },
      id: { not: risk.id },
    },
    select: {
      category: true,
      residualScore: true,
      status: true,
    },
  })

  if (orgRisks.length === 0) {
    return { score: 50, maxScore: 100, details: { totalOrgRisks: 0, reason: 'Only risk in org' } }
  }

  // Same-category risks with high scores amplify risk
  const sameCategoryRisks = orgRisks.filter(r => r.category === risk.category)
  const highSameCategoryCount = sameCategoryRisks.filter(r => r.residualScore >= 15).length
  const totalHighRisks = orgRisks.filter(r => r.residualScore >= 15).length

  // Category concentration: if many risks in same category, correlation is higher
  const categoryConcentration = orgRisks.length > 0
    ? sameCategoryRisks.length / orgRisks.length
    : 0

  // High-risk density across org
  const highRiskDensity = orgRisks.length > 0
    ? totalHighRisks / orgRisks.length
    : 0

  // Score: weighted combination of category concentration and high-risk co-occurrence
  const concentrationScore = Math.round(categoryConcentration * 60)
  const densityScore = Math.round(highRiskDensity * 40)
  const coOccurrenceBonus = highSameCategoryCount >= 3 ? 15 : highSameCategoryCount >= 1 ? 5 : 0

  const score = Math.max(0, Math.min(100, concentrationScore + densityScore + coOccurrenceBonus))

  return {
    score,
    maxScore: 100,
    details: {
      sameCategoryRisks: sameCategoryRisks.length,
      highSameCategoryRisks: highSameCategoryCount,
      totalHighRisks,
      categoryConcentration: Math.round(categoryConcentration * 100),
      highRiskDensity: Math.round(highRiskDensity * 100),
    },
  }
}

/**
 * KRI Alignment Score: Whether org KRIs are trending in concerning directions
 */
export async function calculateKriAlignmentScore(orgId: string): Promise<DimensionScore> {
  const kris = await db.kri.findMany({
    where: { orgId, isActive: true },
    select: { status: true, name: true },
  })

  if (kris.length === 0) {
    return {
      score: 70, // No KRIs = lack of monitoring = moderate-high risk
      maxScore: 100,
      details: { totalKris: 0, reason: 'No active KRIs configured' },
    }
  }

  const statusCounts = { GREEN: 0, AMBER: 0, RED: 0 }
  for (const kri of kris) {
    statusCounts[kri.status as keyof typeof statusCounts]++
  }

  // More RED/AMBER KRIs = higher risk score
  const redRatio = statusCounts.RED / kris.length
  const amberRatio = statusCounts.AMBER / kris.length
  const greenRatio = statusCounts.GREEN / kris.length

  const score = Math.round(redRatio * 100 + amberRatio * 50 + greenRatio * 10)

  return {
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    details: {
      totalKris: kris.length,
      green: statusCounts.GREEN,
      amber: statusCounts.AMBER,
      red: statusCounts.RED,
    },
  }
}

// ============================================
// RULE ENGINE
// ============================================

function evaluateRule(rule: ScoringRule, risk: RiskData): boolean {
  const fieldValue = getRiskFieldValue(risk, rule.conditionField)

  switch (rule.conditionOperator) {
    case 'equals':
      return String(fieldValue) === rule.conditionValue
    case 'notEquals':
      return String(fieldValue) !== rule.conditionValue
    case 'greaterThan':
      return Number(fieldValue) > Number(rule.conditionValue)
    case 'lessThan':
      return Number(fieldValue) < Number(rule.conditionValue)
    case 'contains':
      return String(fieldValue).toLowerCase().includes(rule.conditionValue.toLowerCase())
    case 'isEmpty':
      return !fieldValue || String(fieldValue).trim() === ''
    case 'isNotEmpty':
      return !!fieldValue && String(fieldValue).trim() !== ''
    default:
      return false
  }
}

function getRiskFieldValue(risk: RiskData, field: string): unknown {
  const fieldMap: Record<string, unknown> = {
    category: risk.category,
    status: risk.status,
    residualScore: risk.residualScore,
    inherentScore: risk.inherentScore,
    residualLikelihood: risk.residualLikelihood,
    residualImpact: risk.residualImpact,
    controls: risk.controls,
    rootCause: risk.rootCause,
    ownerId: risk.ownerId,
    dueDate: risk.dueDate,
  }
  return fieldMap[field]
}

function applyRules(
  score: number,
  risk: RiskData,
  rules: ScoringRule[]
): { adjustedScore: number; applied: { ruleName: string; modifier: number }[] } {
  const activeRules = rules
    .filter(r => r.isActive)
    .sort((a, b) => a.priority - b.priority)

  let adjustedScore = score
  const applied: { ruleName: string; modifier: number }[] = []

  for (const rule of activeRules) {
    if (evaluateRule(rule, risk)) {
      const modifier = rule.modifierType === 'percentage'
        ? Math.round(adjustedScore * (rule.scoreModifier / 100))
        : rule.scoreModifier

      adjustedScore += modifier
      applied.push({ ruleName: rule.name, modifier })
    }
  }

  return { adjustedScore: Math.max(0, Math.min(100, adjustedScore)), applied }
}

// ============================================
// MAIN ENGINE
// ============================================

/**
 * Get or create the default scoring profile for an org
 */
export async function getDefaultProfile(orgId: string): Promise<ScoringProfile> {
  const existing = await db.scoringProfile.findFirst({
    where: { orgId, isDefault: true },
    include: { rules: true },
  })

  if (existing) {
    return {
      ...existing,
      categoryMultipliers: existing.categoryMultipliers as Record<string, number> | null,
    }
  }

  // Create default profile
  const created = await db.scoringProfile.create({
    data: {
      name: 'Default Profile',
      description: 'Standard risk scoring profile',
      isDefault: true,
      orgId,
    },
    include: { rules: true },
  })

  return {
    ...created,
    categoryMultipliers: null,
  }
}

/**
 * Calculate composite score for a single risk
 */
export async function calculateRiskScore(
  riskId: string,
  orgId: string,
  profileOverride?: ScoringProfile | null
): Promise<CompositeScoreResult> {
  // Fetch the risk
  const risk = await db.risk.findFirst({
    where: { id: riskId, register: { orgId } },
  })

  if (!risk) {
    throw new Error(`Risk ${riskId} not found in org ${orgId}`)
  }

  // Get scoring profile
  const profile = profileOverride || await getDefaultProfile(orgId)

  // Calculate all dimensions in parallel
  const [base, controlQuality, velocity, correlation, kriAlignment] = await Promise.all([
    calculateBaseScore(risk),
    calculateControlQualityScore(risk),
    calculateVelocityScore(risk.id),
    calculateCorrelationScore(risk, orgId),
    calculateKriAlignmentScore(orgId),
  ])

  // Apply category multiplier if configured
  let categoryMultiplier = 1.0
  if (profile.categoryMultipliers && profile.categoryMultipliers[risk.category]) {
    categoryMultiplier = profile.categoryMultipliers[risk.category]
  }

  // Calculate weighted composite
  const weights: ScoringWeights = {
    base: profile.weightBase,
    controlQuality: profile.weightControlQuality,
    velocity: profile.weightVelocity,
    correlation: profile.weightCorrelation,
    kriAlignment: profile.weightKriAlignment,
  }

  const totalWeight = weights.base + weights.controlQuality + weights.velocity + weights.correlation + weights.kriAlignment

  let rawComposite = (
    (base.score * weights.base) +
    (controlQuality.score * weights.controlQuality) +
    (velocity.score * weights.velocity) +
    (correlation.score * weights.correlation) +
    (kriAlignment.score * weights.kriAlignment)
  ) / totalWeight

  // Apply category multiplier
  rawComposite = rawComposite * categoryMultiplier

  // Apply custom rules
  const { adjustedScore, applied } = applyRules(Math.round(rawComposite), risk, profile.rules)

  // Determine grade
  const grade = getScoreGrade(adjustedScore, profile)

  return {
    compositeScore: adjustedScore,
    grade: grade.grade,
    gradeColor: grade.color,
    dimensions: { base, controlQuality, velocity, correlation, kriAlignment },
    rulesApplied: applied,
    profileId: profile.id,
    calculatedAt: new Date(),
  }
}

/**
 * Calculate scores for all risks in a register (batch)
 */
export async function calculateBatchScores(
  registerId: string,
  orgId: string,
  profileOverride?: ScoringProfile | null
): Promise<BatchScoreResult> {
  // Verify register belongs to org
  const register = await db.riskRegister.findFirst({
    where: { id: registerId, orgId },
  })

  if (!register) {
    throw new Error(`Register ${registerId} not found in org ${orgId}`)
  }

  const risks = await db.risk.findMany({
    where: { registerId },
    select: { id: true, refCode: true, title: true },
  })

  // Calculate scores for all risks
  const scores = await Promise.all(
    risks.map(async (risk) => {
      const score = await calculateRiskScore(risk.id, orgId, profileOverride)
      return { riskId: risk.id, refCode: risk.refCode, title: risk.title, score }
    })
  )

  // Calculate aggregates
  const compositeScores = scores.map(s => s.score.compositeScore)
  const sorted = [...compositeScores].sort((a, b) => a - b)

  const profile = profileOverride || await getDefaultProfile(orgId)

  const aggregate = {
    averageScore: compositeScores.length > 0
      ? Math.round(compositeScores.reduce((a, b) => a + b, 0) / compositeScores.length)
      : 0,
    medianScore: compositeScores.length > 0
      ? sorted[Math.floor(sorted.length / 2)]
      : 0,
    highestScore: scores.length > 0
      ? scores.reduce((max, s) => s.score.compositeScore > max.score ? { riskId: s.riskId, score: s.score.compositeScore } : max, { riskId: '', score: -1 })
      : { riskId: '', score: 0 },
    lowestScore: scores.length > 0
      ? scores.reduce((min, s) => s.score.compositeScore < min.score ? { riskId: s.riskId, score: s.score.compositeScore } : min, { riskId: '', score: 101 })
      : { riskId: '', score: 0 },
    distribution: {
      low: compositeScores.filter(s => s < profile.thresholdLow).length,
      medium: compositeScores.filter(s => s >= profile.thresholdLow && s < profile.thresholdMedium).length,
      high: compositeScores.filter(s => s >= profile.thresholdMedium && s < profile.thresholdHigh).length,
      critical: compositeScores.filter(s => s >= profile.thresholdHigh).length,
    },
  }

  return { scores, aggregate, calculatedAt: new Date() }
}

/**
 * Save score snapshot to history
 */
export async function saveScoreHistory(
  riskId: string,
  result: CompositeScoreResult
): Promise<void> {
  await db.scoreHistory.create({
    data: {
      riskId,
      compositeScore: result.compositeScore,
      baseScore: result.dimensions.base.score,
      controlQualityScore: result.dimensions.controlQuality.score,
      velocityScore: result.dimensions.velocity.score,
      correlationScore: result.dimensions.correlation.score,
      kriAlignmentScore: result.dimensions.kriAlignment.score,
      breakdown: result.dimensions as object,
      profileId: result.profileId,
    },
  })
}

/**
 * Get score grade based on profile thresholds
 */
function getScoreGrade(
  score: number,
  profile: ScoringProfile
): { grade: string; color: string } {
  if (score < profile.thresholdLow) return { grade: 'Low', color: 'green' }
  if (score < profile.thresholdMedium) return { grade: 'Medium', color: 'yellow' }
  if (score < profile.thresholdHigh) return { grade: 'High', color: 'orange' }
  return { grade: 'Critical', color: 'red' }
}

/**
 * Get engine status / health info
 */
export async function getEngineStatus(orgId: string) {
  const [profile, riskCount, historyCount, kriCount] = await Promise.all([
    db.scoringProfile.findFirst({ where: { orgId, isDefault: true }, include: { _count: { select: { rules: true } } } }),
    db.risk.count({ where: { register: { orgId } } }),
    db.scoreHistory.count({ where: { profile: { orgId } } }),
    db.kri.count({ where: { orgId, isActive: true } }),
  ])

  return {
    hasProfile: !!profile,
    profileName: profile?.name || null,
    activeRules: profile?._count.rules || 0,
    totalRisks: riskCount,
    scoreSnapshots: historyCount,
    activeKris: kriCount,
    engineVersion: '1.0.0',
  }
}
