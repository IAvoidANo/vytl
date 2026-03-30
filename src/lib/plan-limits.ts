/**
 * Plan limits for VytlRx billing tiers.
 * Free tier enforces usage caps; Pro/Enterprise are unlimited.
 */

export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE'

export interface PlanLimits {
  maxRisks: number           // -1 = unlimited
  maxUsers: number           // -1 = unlimited
  boardReportPdf: boolean
  aiAnalysis: boolean
  movementTrends: boolean
  apiAccess: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxRisks: 25,
    maxUsers: 3,
    boardReportPdf: false,
    aiAnalysis: false,
    movementTrends: false,
    apiAccess: false,
  },
  PRO: {
    maxRisks: -1,
    maxUsers: -1,
    boardReportPdf: true,
    aiAnalysis: true,
    movementTrends: true,
    apiAccess: true,
  },
  ENTERPRISE: {
    maxRisks: -1,
    maxUsers: -1,
    boardReportPdf: true,
    aiAnalysis: true,
    movementTrends: true,
    apiAccess: true,
  },
}

export const PLAN_LABELS: Record<PlanType, string> = {
  FREE: 'Free',
  PRO: 'Professional',
  ENTERPRISE: 'Enterprise',
}

export function getLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function isAtRiskLimit(plan: PlanType, currentCount: number): boolean {
  const limits = getLimits(plan)
  return limits.maxRisks !== -1 && currentCount >= limits.maxRisks
}

export function isAtUserLimit(plan: PlanType, currentCount: number): boolean {
  const limits = getLimits(plan)
  return limits.maxUsers !== -1 && currentCount >= limits.maxUsers
}

export function canUseFeature(plan: PlanType, feature: keyof Omit<PlanLimits, 'maxRisks' | 'maxUsers'>): boolean {
  return getLimits(plan)[feature]
}
