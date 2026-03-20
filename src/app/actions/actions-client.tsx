'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckSquare, Filter, X } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { ActionsTable } from '@/components/actions-table'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'createdAt', label: 'Created' },
  { value: 'riskTitle', label: 'Risk Title' },
]

export function ActionsClient() {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string })?.role

  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [sortBy, setSortBy] = useState('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const hasFilters = !!(statusFilter || priorityFilter || assigneeFilter || overdueOnly)

  const { data: actions = [], isLoading } = trpc.treatment.listAll.useQuery({
    status: statusFilter as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | undefined || undefined,
    priority: priorityFilter as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined || undefined,
    assigneeId: assigneeFilter || undefined,
    overdueOnly: overdueOnly || undefined,
    sortBy: sortBy as 'dueDate' | 'priority' | 'createdAt' | 'riskTitle',
    sortDir,
  })

  const { data: users = [] } = trpc.risk.users.useQuery()

  function clearFilters() {
    setStatusFilter('')
    setPriorityFilter('')
    setAssigneeFilter('')
    setOverdueOnly(false)
  }

  const selectClass =
    'bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-teal-400" />
            Actions Register
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            All treatment actions across all risks
          </p>
        </div>
        {!isLoading && (
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-400 text-sm font-medium">
            {actions.length} action{actions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setOverdueOnly(false) }}
            className={selectClass}
            disabled={overdueOnly}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={selectClass}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>

          <button
            onClick={() => { setOverdueOnly(!overdueOnly); setStatusFilter('') }}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              overdueOnly
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-700/50 text-slate-400 border-slate-600/50 hover:text-white'
            }`}
          >
            Overdue only
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>

            <button
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 rounded-lg text-sm bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-white transition-colors"
            >
              {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white bg-slate-700/50 border border-slate-600/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <ActionsTable actions={actions} userRole={userRole} />
        )}
      </div>
    </div>
  )
}
