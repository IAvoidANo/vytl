'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { Plus, Pencil, Trash2, Clock, FileText, ArrowRight, AlertTriangle, Activity, Users, BarChart2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  oldValues: unknown
  newValues: unknown
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
}

function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE': return <Plus className="w-3 h-3" />
    case 'UPDATE': return <Pencil className="w-3 h-3" />
    case 'DELETE': return <Trash2 className="w-3 h-3" />
    default:       return <FileText className="w-3 h-3" />
  }
}

const actionStyles: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-600',
  UPDATE: 'bg-blue-50 text-blue-600',
  DELETE: 'bg-red-50 text-red-600',
}

function getActionText(action: string, entityType?: string | null) {
  const entity = entityType?.toLowerCase() || 'item'
  switch (action) {
    case 'CREATE': return `created a ${entity}`
    case 'UPDATE': return `updated a ${entity}`
    case 'DELETE': return `deleted a ${entity}`
    default:       return `modified a ${entity}`
  }
}

function getChangeSummary(oldValues: unknown, newValues: unknown): string | null {
  if (!oldValues || !newValues) return null
  const old = oldValues as Record<string, unknown>
  const updated = newValues as Record<string, unknown>
  const changes: string[] = []
  if (old.status !== updated.status) changes.push(`status → ${updated.status}`)
  if (old.title !== updated.title) changes.push('title updated')
  if (old.residualScore !== updated.residualScore) changes.push(`score ${old.residualScore} → ${updated.residualScore}`)
  return changes.length > 0 ? changes.join(', ') : null
}

interface ActivityPanelProps {
  isAdmin: boolean
}

const QUICK_ACTIONS = [
  { label: 'Add Risk',      href: '/risks',    icon: AlertTriangle, color: 'text-teal-600 bg-teal-50 hover:bg-teal-100' },
  { label: 'Monitor',       href: '/kris',     icon: Activity,      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
  { label: 'Reports',       href: '/reports',  icon: BarChart2,     color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
]
const ADMIN_ACTION = { label: 'Team',  href: '/users', icon: Users, color: 'text-slate-600 bg-slate-50 hover:bg-slate-100' }

export function ActivityPanel({ isAdmin }: ActivityPanelProps) {
  const { data: activities, isLoading } = trpc.audit.recent.useQuery({ limit: 5 })

  const displayActivities = (activities as unknown as ActivityItem[] | undefined)?.slice(0, 5) ?? []

  const quickActions = isAdmin ? [...QUICK_ACTIONS, ADMIN_ACTION] : QUICK_ACTIONS

  return (
    <div className="space-y-4">
      {/* Activity Feed */}
      <div className="bg-white rounded-panel shadow-card border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
          {displayActivities.length > 0 && (
            <span className="text-[10px] text-slate-400">Last {displayActivities.length}</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayActivities.length === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">No activity yet</p>
            <p className="text-[10px] text-slate-300 mt-0.5">Actions will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {displayActivities.map((activity) => {
              const changeSummary = getChangeSummary(activity.oldValues, activity.newValues)
              const styleClass = actionStyles[activity.action] ?? 'bg-slate-50 text-slate-500'

              return (
                <div key={activity.id} className="px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', styleClass)}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700">
                        <span className="font-medium">{activity.user?.name?.split(' ')[0] || 'System'}</span>
                        {' '}
                        <span className="text-slate-400">{getActionText(activity.action, activity.entityType)}</span>
                      </p>
                      {changeSummary && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{changeSummary}</p>
                      )}
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-panel shadow-card border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {quickActions.map(({ label, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl text-xs font-medium transition-colors',
                color,
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
