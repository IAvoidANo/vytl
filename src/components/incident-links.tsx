'use client'

import { useState } from 'react'
import { Plus, Trash2, Calendar, User, X, AlertOctagon } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { format } from 'date-fns'
import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  STATUS_CYCLE,
  INCIDENT_SEVERITIES,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/lib/incident-validation'

interface IncidentLinksProps {
  riskId: string
}

export function IncidentLinks({ riskId }: IncidentLinksProps) {
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newSeverity, setNewSeverity] = useState<string>('MEDIUM')
  const [newOccurredAt, setNewOccurredAt] = useState('')
  const [newAssigneeId, setNewAssigneeId] = useState('')

  const utils = trpc.useUtils()

  const { data: incidents, isLoading } = trpc.incident.list.useQuery({ riskId })
  const { data: stats } = trpc.incident.stats.useQuery({ riskId })
  const { data: users } = trpc.risk.users.useQuery()

  const createMutation = trpc.incident.create.useMutation({
    onSuccess: () => {
      utils.incident.list.invalidate({ riskId })
      utils.incident.stats.invalidate({ riskId })
      resetForm()
    },
  })

  const updateMutation = trpc.incident.update.useMutation({
    onSuccess: () => {
      utils.incident.list.invalidate({ riskId })
      utils.incident.stats.invalidate({ riskId })
    },
  })

  const deleteMutation = trpc.incident.delete.useMutation({
    onSuccess: () => {
      utils.incident.list.invalidate({ riskId })
      utils.incident.stats.invalidate({ riskId })
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setNewTitle('')
    setNewDescription('')
    setNewSeverity('MEDIUM')
    setNewOccurredAt('')
    setNewAssigneeId('')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newOccurredAt) return

    createMutation.mutate({
      riskId,
      title: newTitle,
      description: newDescription || undefined,
      severity: newSeverity as IncidentSeverity,
      occurredAt: new Date(newOccurredAt),
      assigneeId: newAssigneeId || undefined,
    })
  }

  const handleStatusCycle = (incidentId: string, currentStatus: string) => {
    const nextStatus = STATUS_CYCLE[currentStatus as IncidentStatus] || 'OPEN'
    updateMutation.mutate({
      id: incidentId,
      status: nextStatus as IncidentStatus,
    })
  }

  const handleDelete = (incidentId: string) => {
    if (confirm('Delete this incident?')) {
      deleteMutation.mutate({ id: incidentId })
    }
  }

  const total = stats?.total || 0
  const resolved = stats?.resolved || 0
  const byStatus = stats?.byStatus || {}

  return (
    <div>
      {/* Stats Bar */}
      {total > 0 && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-400">
            {total} incident{total !== 1 ? 's' : ''} — {resolved} resolved
          </span>
          <div className="flex items-center gap-1.5">
            {Object.entries(byStatus).map(([status, count]) =>
              (count as number) > 0 ? (
                <span
                  key={status}
                  className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[status as IncidentStatus] || ''}`}
                >
                  {STATUS_LABELS[status as IncidentStatus] || status}: {count as number}
                </span>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Add Incident Button */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-slate-400">Incidents</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg transition-colors"
        >
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? 'Cancel' : 'Log Incident'}
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
              placeholder="Incident title..."
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
              <label className="block text-xs text-slate-500 mb-1">Severity</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {INCIDENT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {SEVERITY_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Occurred At</label>
              <input
                type="datetime-local"
                value={newOccurredAt}
                onChange={(e) => setNewOccurredAt(e.target.value)}
                required
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
              disabled={createMutation.isPending || !newTitle.trim() || !newOccurredAt}
              className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Logging...' : 'Log Incident'}
            </button>
          </div>
        </form>
      )}

      {/* Incident Cards */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : incidents && incidents.length > 0 ? (
        <div className="space-y-2">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className={`p-3 bg-slate-900 rounded-lg border border-slate-700 ${
                incident.status === 'CLOSED' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertOctagon className={`w-3.5 h-3.5 flex-shrink-0 ${
                      incident.severity === 'CRITICAL' ? 'text-red-400' :
                      incident.severity === 'HIGH' ? 'text-orange-400' :
                      incident.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                    }`} />
                    <h5 className={`text-sm font-medium ${
                      incident.status === 'CLOSED' ? 'text-slate-400 line-through' : 'text-white'
                    }`}>
                      {incident.title}
                    </h5>
                  </div>
                  {incident.description && (
                    <p className="text-xs text-slate-500 mb-2 ml-5.5">{incident.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Severity Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_COLORS[incident.severity as IncidentSeverity]}`}>
                      {SEVERITY_LABELS[incident.severity as IncidentSeverity]}
                    </span>

                    {/* Status Badge (clickable) */}
                    <button
                      onClick={() => handleStatusCycle(incident.id, incident.status)}
                      disabled={updateMutation.isPending}
                      className={`text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[incident.status as IncidentStatus]}`}
                    >
                      {STATUS_LABELS[incident.status as IncidentStatus]}
                    </button>

                    {/* Occurred At */}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(incident.occurredAt), 'dd MMM yyyy HH:mm')}
                    </span>

                    {/* Assignee */}
                    {incident.assignee && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {incident.assignee.name || incident.assignee.email}
                      </span>
                    )}

                    {/* Reporter */}
                    {incident.reportedBy && (
                      <span className="text-xs text-slate-500">
                        by {incident.reportedBy.name || incident.reportedBy.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(incident.id)}
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
          No incidents recorded yet. Log one to start tracking events.
        </div>
      )}
    </div>
  )
}
