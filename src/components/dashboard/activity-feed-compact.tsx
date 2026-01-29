'use client'

import { trpc } from '@/lib/trpc-client'
import { Plus, Pencil, Trash2, Clock, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Explicit type to avoid TS2589 deep type inference error
interface ActivityItem {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
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

export function ActivityFeedCompact() {
  const { data: activities, isLoading } = trpc.audit.recent.useQuery({ limit: 5 })

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
        <div className="p-2 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="p-2 space-y-2 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-2 bg-slate-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
        <div className="p-2 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Clock className="w-6 h-6 text-slate-600 mx-auto mb-1" />
            <p className="text-slate-400 text-xs">No activity yet</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
      <div className="p-2 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
      </div>
      <div className="divide-y divide-slate-700/50 flex-1 overflow-auto">
        {(activities as unknown as ActivityItem[]).map((activity) => (
          <div key={activity.id} className="p-2 hover:bg-slate-700/30 transition-colors">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action)}`}>
                {getActionIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white truncate">
                  <span className="font-medium">{activity.user?.name?.split(' ')[0] || 'System'}</span>
                  {' '}
                  <span className="text-slate-400">
                    {activity.action.toLowerCase()}d {activity.entityType?.toLowerCase() || 'item'}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
