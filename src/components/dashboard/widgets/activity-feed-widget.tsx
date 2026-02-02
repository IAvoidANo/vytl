'use client'

import { trpc } from '@/lib/trpc-client'
import { Plus, Pencil, Trash2, Clock, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useVisibleRows, useWidgetSize } from '../widget-wrapper'

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
    case 'CREATE':
      return <Plus className="w-3 h-3" />
    case 'UPDATE':
      return <Pencil className="w-3 h-3" />
    case 'DELETE':
      return <Trash2 className="w-3 h-3" />
    default:
      return <FileText className="w-3 h-3" />
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE':
      return 'bg-green-500/20 text-green-400'
    case 'UPDATE':
      return 'bg-blue-500/20 text-blue-400'
    case 'DELETE':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-slate-500/20 text-slate-400'
  }
}

function getActionText(action: string, entityType?: string | null) {
  const entity = entityType?.toLowerCase() || 'item'
  switch (action) {
    case 'CREATE':
      return `created a ${entity}`
    case 'UPDATE':
      return `updated a ${entity}`
    case 'DELETE':
      return `deleted a ${entity}`
    default:
      return `modified a ${entity}`
  }
}

function getChangeSummary(oldValues: unknown, newValues: unknown): string | null {
  if (!oldValues || !newValues) return null

  const old = oldValues as Record<string, unknown>
  const updated = newValues as Record<string, unknown>

  const changes: string[] = []

  if (old.status !== updated.status) {
    changes.push(`status → ${updated.status}`)
  }
  if (old.title !== updated.title) {
    changes.push('title updated')
  }
  if (old.residualScore !== updated.residualScore) {
    changes.push(`score ${old.residualScore} → ${updated.residualScore}`)
  }

  return changes.length > 0 ? changes.join(', ') : null
}

export function ActivityFeedWidget() {
  const visibleRows = useVisibleRows(50, 3)
  const { size } = useWidgetSize()
  const isCompact = size === 'xs' || size === 'sm'

  const { data: activities, isLoading } = trpc.audit.recent.useQuery({ limit: Math.max(visibleRows, 10) })

  const displayActivities = (activities as unknown as ActivityItem[] | undefined)?.slice(0, visibleRows) || []

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="flex-1 p-2 space-y-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-2 px-2">
              <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-slate-700 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No recent activity</p>
            <p className="text-slate-500 text-[10px] mt-1">Actions will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        <span className="text-[10px] text-slate-500">Last {displayActivities.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto divide-y divide-slate-700/50">
        {displayActivities.map((activity) => {
          const changeSummary = !isCompact ? getChangeSummary(activity.oldValues, activity.newValues) : null

          return (
            <div key={activity.id} className="px-3 py-1.5 hover:bg-slate-700/30 transition-colors">
              <div className="flex items-start gap-2">
                {/* Action Icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white">
                    <span className="font-medium">{activity.user?.name?.split(' ')[0] || 'System'}</span>
                    {' '}
                    <span className="text-slate-400">{getActionText(activity.action, activity.entityType)}</span>
                  </p>

                  {/* Change summary for updates */}
                  {changeSummary && (
                    <p className="text-[10px] text-slate-500 truncate">
                      {changeSummary}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
