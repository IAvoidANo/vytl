import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export const INCIDENT_STATUSES = ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'] as const

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number]
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]

export const incidentSeverityEnum = z.enum(INCIDENT_SEVERITIES)
export const incidentStatusEnum = z.enum(INCIDENT_STATUSES)

// ============================================
// LABELS & COLORS
// ============================================

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  CONTAINED: 'Contained',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  LOW: 'bg-green-500/20 text-green-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  CRITICAL: 'bg-red-500/20 text-red-400',
}

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400',
  INVESTIGATING: 'bg-purple-500/20 text-purple-400',
  CONTAINED: 'bg-yellow-500/20 text-yellow-400',
  RESOLVED: 'bg-green-500/20 text-green-400',
  CLOSED: 'bg-slate-500/20 text-slate-400',
}

// Status cycle for clickable status badges
export const STATUS_CYCLE: Record<IncidentStatus, IncidentStatus> = {
  OPEN: 'INVESTIGATING',
  INVESTIGATING: 'CONTAINED',
  CONTAINED: 'RESOLVED',
  RESOLVED: 'CLOSED',
  CLOSED: 'OPEN',
}

// ============================================
// ZOD SCHEMAS
// ============================================

export const createIncidentSchema = z.object({
  riskId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  severity: incidentSeverityEnum.default('MEDIUM'),
  occurredAt: z.coerce.date(),
  assigneeId: z.string().optional(),
})

export const updateIncidentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  severity: incidentSeverityEnum.optional(),
  status: incidentStatusEnum.optional(),
  occurredAt: z.coerce.date().optional(),
  assigneeId: z.string().nullable().optional(),
})

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>

// ============================================
// PURE FUNCTIONS
// ============================================

const SEVERITY_ORDER: Record<IncidentSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

export function getResolvedAtForStatus(status: IncidentStatus): Date | null {
  if (status === 'RESOLVED' || status === 'CLOSED') {
    return new Date()
  }
  return null
}

export function sortBySeverity<T extends { severity: string }>(incidents: T[]): T[] {
  return [...incidents].sort((a, b) => {
    const aOrder = SEVERITY_ORDER[a.severity as IncidentSeverity] ?? 0
    const bOrder = SEVERITY_ORDER[b.severity as IncidentSeverity] ?? 0
    return bOrder - aOrder
  })
}

export function getNextStatus(current: IncidentStatus): IncidentStatus {
  return STATUS_CYCLE[current]
}
