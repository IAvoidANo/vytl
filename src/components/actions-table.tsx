'use client'

import { Trash2, Calendar, User, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { trpc } from '@/lib/trpc-client'
import { isOverdue } from '@/lib/treatment-validation'
import type { RouterOutputs } from '@/lib/trpc-client'

type Action = RouterOutputs['treatment']['listAll'][number]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const STATUS_CYCLE: Record<string, string> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'OPEN',
  CANCELLED: 'OPEN',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

interface ActionsTableProps {
  actions: Action[]
  userRole?: string
}

export function ActionsTable({ actions, userRole }: ActionsTableProps) {
  const utils = trpc.useUtils()

  const updateMutation = trpc.treatment.update.useMutation({
    onSuccess: () => {
      utils.treatment.listAll.invalidate()
      utils.treatment.overdueSummary.invalidate()
      utils.treatment.orgStats.invalidate()
    },
  })

  const deleteMutation = trpc.treatment.delete.useMutation({
    onSuccess: () => {
      utils.treatment.listAll.invalidate()
      utils.treatment.overdueSummary.invalidate()
      utils.treatment.orgStats.invalidate()
    },
  })

  const canDelete = userRole && ['OWNER', 'ADMIN', 'RISK_MANAGER'].includes(userRole)

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
          <Calendar className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-slate-400 font-medium">No actions found</p>
        <p className="text-slate-500 text-sm mt-1">
          Create treatment actions from individual risk detail pages
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Risk</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Priority</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Assignee</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Due Date</th>
            {canDelete && <th className="w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {actions.map((action) => {
            const overdue = isOverdue({ dueDate: action.dueDate, status: action.status })
            return (
              <tr
                key={action.id}
                className={`hover:bg-slate-700/20 transition-colors ${overdue ? 'border-l-2 border-red-500' : ''}`}
              >
                {/* Risk */}
                <td className="px-4 py-3">
                  <Link
                    href={`/risks/${action.risk.id}`}
                    className="flex items-start gap-1.5 group"
                  >
                    <span className="text-xs text-slate-500 font-mono mt-0.5 shrink-0">{action.risk.refCode}</span>
                    <span className="text-slate-300 group-hover:text-teal-400 transition-colors line-clamp-1">
                      {action.risk.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-teal-400 transition-colors shrink-0 mt-0.5" />
                  </Link>
                  <span className="text-xs text-slate-500 ml-0">{action.risk.register.name}</span>
                </td>

                {/* Action title */}
                <td className="px-4 py-3">
                  <p className="text-slate-300 line-clamp-1">{action.title}</p>
                  {action.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{action.description}</p>
                  )}
                </td>

                {/* Priority */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_COLORS[action.priority]}`}>
                    {action.priority}
                  </span>
                </td>

                {/* Status (clickable cycle) */}
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: action.id,
                        status: STATUS_CYCLE[action.status] as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
                      })
                    }
                    disabled={updateMutation.isPending}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 ${STATUS_COLORS[action.status]}`}
                  >
                    {STATUS_LABELS[action.status]}
                  </button>
                </td>

                {/* Assignee */}
                <td className="px-4 py-3">
                  {action.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-400 text-xs">{action.assignee.name ?? action.assignee.email}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-xs">Unassigned</span>
                  )}
                </td>

                {/* Due date */}
                <td className="px-4 py-3">
                  {action.dueDate ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs">
                        {format(new Date(action.dueDate), 'dd MMM yyyy')}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-600 text-xs">No date</span>
                  )}
                </td>

                {/* Delete */}
                {canDelete && (
                  <td className="px-3 py-3">
                    <button
                      onClick={() => deleteMutation.mutate({ id: action.id })}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
