'use client'

import { format } from 'date-fns'
import { Clock, Plus, Pencil, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

interface AuditTimelineProps {
  entityType: string
  entityId: string
}

const ACTION_ICONS = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
}

const ACTION_COLORS = {
  CREATE: 'bg-green-500/20 text-green-400 border-green-500/30',
  UPDATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const ACTION_LABELS = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
}

export function AuditTimeline({ entityType, entityId }: AuditTimelineProps) {
  const { data: logs, isLoading, error } = trpc.audit.listByEntity.useQuery({
    entityType,
    entityId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load history</p>
      </div>
    )
  }

  if (!logs?.length) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">No History Yet</h3>
        <p className="text-slate-500">Changes to this item will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {logs.map((log, idx) => {
        const Icon = ACTION_ICONS[log.action as keyof typeof ACTION_ICONS] || Clock
        const colors = ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        const label = ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action

        return (
          <div key={log.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${colors}`}>
                <Icon className="w-4 h-4" />
              </div>
              {idx < logs.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 min-h-[24px]" />}
            </div>

            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white">{label}</span>
                <span className="text-slate-400">by</span>
                <span className="text-teal-400">{log.user?.name || log.user?.email || 'System'}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">
                {format(new Date(log.createdAt), 'dd MMM yyyy \'at\' HH:mm')}
              </div>

              {log.action === 'UPDATE' && log.oldValues && log.newValues && (
                <div className="bg-slate-900 rounded-lg p-3 text-sm">
                  <ChangesList
                    oldValues={log.oldValues as Record<string, unknown>}
                    newValues={log.newValues as Record<string, unknown>}
                  />
                </div>
              )}

              {log.action === 'CREATE' && log.newValues && (
                <div className="bg-slate-900 rounded-lg p-3 text-sm">
                  <CreatedValuesList values={log.newValues as Record<string, unknown>} />
                </div>
              )}

              {log.action === 'DELETE' && log.oldValues && (
                <div className="bg-slate-900 rounded-lg p-3 text-sm text-slate-400">
                  <DeletedValuesList values={log.oldValues as Record<string, unknown>} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChangesList({
  oldValues,
  newValues,
}: {
  oldValues: Record<string, unknown>
  newValues: Record<string, unknown>
}) {
  const changes = Object.keys(newValues).filter((k) => {
    const oldVal = oldValues[k]
    const newVal = newValues[k]
    return String(oldVal) !== String(newVal)
  })

  if (changes.length === 0) {
    return <p className="text-slate-500">No field changes recorded</p>
  }

  return (
    <ul className="space-y-1">
      {changes.map((key) => (
        <li key={key} className="flex flex-wrap gap-2">
          <span className="text-slate-400 capitalize">{formatFieldName(key)}:</span>
          <span className="text-red-400 line-through">{formatValue(oldValues[key])}</span>
          <span className="text-slate-500">→</span>
          <span className="text-green-400">{formatValue(newValues[key])}</span>
        </li>
      ))}
    </ul>
  )
}

function CreatedValuesList({ values }: { values: Record<string, unknown> }) {
  const entries = Object.entries(values).filter(([, v]) => v !== null && v !== undefined)

  return (
    <ul className="space-y-1">
      {entries.map(([key, value]) => (
        <li key={key} className="flex gap-2">
          <span className="text-slate-400 capitalize">{formatFieldName(key)}:</span>
          <span className="text-green-400">{formatValue(value)}</span>
        </li>
      ))}
    </ul>
  )
}

function DeletedValuesList({ values }: { values: Record<string, unknown> }) {
  const entries = Object.entries(values).filter(([, v]) => v !== null && v !== undefined)

  return (
    <ul className="space-y-1">
      {entries.map(([key, value]) => (
        <li key={key} className="flex gap-2">
          <span className="text-slate-500 capitalize">{formatFieldName(key)}:</span>
          <span className="text-slate-400">{formatValue(value)}</span>
        </li>
      ))}
    </ul>
  )
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
