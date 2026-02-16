'use client'

import { useState } from 'react'
import { Plus, Trash2, Calendar, User, X } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { format } from 'date-fns'

interface TreatmentActionsProps {
  riskId: string
}

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

export function TreatmentActions({ riskId }: TreatmentActionsProps) {
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<string>('MEDIUM')
  const [newDueDate, setNewDueDate] = useState('')
  const [newAssigneeId, setNewAssigneeId] = useState('')

  const utils = trpc.useUtils()

  const { data: actions, isLoading } = trpc.treatment.list.useQuery({ riskId })
  const { data: stats } = trpc.treatment.stats.useQuery({ riskId })
  const { data: users } = trpc.risk.users.useQuery()

  const createMutation = trpc.treatment.create.useMutation({
    onSuccess: () => {
      utils.treatment.list.invalidate({ riskId })
      utils.treatment.stats.invalidate({ riskId })
      resetForm()
    },
  })

  const updateMutation = trpc.treatment.update.useMutation({
    onSuccess: () => {
      utils.treatment.list.invalidate({ riskId })
      utils.treatment.stats.invalidate({ riskId })
    },
  })

  const deleteMutation = trpc.treatment.delete.useMutation({
    onSuccess: () => {
      utils.treatment.list.invalidate({ riskId })
      utils.treatment.stats.invalidate({ riskId })
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setNewTitle('')
    setNewDescription('')
    setNewPriority('MEDIUM')
    setNewDueDate('')
    setNewAssigneeId('')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    createMutation.mutate({
      riskId,
      title: newTitle,
      description: newDescription || undefined,
      priority: newPriority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      dueDate: newDueDate || undefined,
      assigneeId: newAssigneeId || undefined,
    })
  }

  const handleStatusCycle = (actionId: string, currentStatus: string) => {
    const nextStatus = STATUS_CYCLE[currentStatus] || 'OPEN'
    updateMutation.mutate({
      id: actionId,
      status: nextStatus as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    })
  }

  const handleDelete = (actionId: string) => {
    if (confirm('Delete this action?')) {
      deleteMutation.mutate({ id: actionId })
    }
  }

  const completedCount = stats?.completed || 0
  const totalCount = stats?.total || 0
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div>
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-400">Treatment Progress</span>
            <span className="text-sm text-white">
              {completedCount} of {totalCount} actions complete
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Action Button */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-slate-400">Treatment Actions</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg transition-colors"
        >
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? 'Cancel' : 'Add Action'}
        </button>
      </div>

      {/* Inline Add Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
          <div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Action title..."
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          <div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Assignee</label>
              <select
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Unassigned</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !newTitle.trim()}
              className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Action'}
            </button>
          </div>
        </form>
      )}

      {/* Action Cards */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : actions && actions.length > 0 ? (
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`p-3 bg-slate-900 rounded-lg border border-slate-700 ${
                action.status === 'COMPLETED' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className={`text-sm font-medium ${
                      action.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-white'
                    }`}>
                      {action.title}
                    </h5>
                  </div>
                  {action.description && (
                    <p className="text-xs text-slate-500 mb-2">{action.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[action.priority]}`}>
                      {action.priority}
                    </span>

                    {/* Status Badge (clickable) */}
                    <button
                      onClick={() => handleStatusCycle(action.id, action.status)}
                      disabled={updateMutation.isPending}
                      className={`text-xs px-2 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[action.status]}`}
                    >
                      {action.status.replace('_', ' ')}
                    </button>

                    {/* Assignee */}
                    {action.assignee && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {action.assignee.name || action.assignee.email}
                      </span>
                    )}

                    {/* Due Date */}
                    {action.dueDate && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(action.dueDate), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(action.id)}
                  disabled={deleteMutation.isPending}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-sm">
          No treatment actions yet. Add one to start tracking mitigations.
        </div>
      )}
    </div>
  )
}
