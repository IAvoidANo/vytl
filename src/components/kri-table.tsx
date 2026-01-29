'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_STYLES = {
  GREEN: {
    dot: 'bg-green-500',
    text: 'text-green-400',
    label: 'Healthy',
  },
  AMBER: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-400',
    label: 'Warning',
  },
  RED: {
    dot: 'bg-red-500',
    text: 'text-red-400',
    label: 'Critical',
  },
}

type SortField = 'name' | 'currentValue' | 'status' | 'lastUpdated'
type SortDirection = 'asc' | 'desc'

interface KriData {
  id: string
  name: string
  description: string | null
  unit: string
  direction: 'HIGHER_IS_WORSE' | 'LOWER_IS_WORSE'
  currentValue: { toString: () => string } | null
  thresholdGreen: { toString: () => string }
  thresholdAmber: { toString: () => string }
  thresholdRed: { toString: () => string }
  status: 'GREEN' | 'AMBER' | 'RED'
  lastUpdated: string | Date | null
  owner?: { name: string | null; email: string } | null
}

interface KriTableProps {
  kris: KriData[]
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
  onUpdateValue: (id: string, currentValue: string) => void
  updatingValue: { id: string; value: string } | null
  setUpdatingValue: (val: { id: string; value: string } | null) => void
  onValueSubmit: (id: string) => void
}

const STATUS_ORDER = { GREEN: 0, AMBER: 1, RED: 2 }

export function KriTable({
  kris,
  onEdit,
  onDelete,
  updatingValue,
  setUpdatingValue,
  onValueSubmit,
}: KriTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedKris = [...kris].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'currentValue':
        const aVal = a.currentValue ? parseFloat(a.currentValue.toString()) : 0
        const bVal = b.currentValue ? parseFloat(b.currentValue.toString()) : 0
        comparison = aVal - bVal
        break
      case 'status':
        comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        break
      case 'lastUpdated':
        const aDate = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0
        const bDate = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0
        comparison = aDate - bDate
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-400 w-12">
              Status
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">
                Name
                <SortIcon field="name" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('currentValue')}
            >
              <div className="flex items-center gap-1">
                Current Value
                <SortIcon field="currentValue" />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
              Thresholds
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
              Direction
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
              Owner
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white"
              onClick={() => handleSort('lastUpdated')}
            >
              <div className="flex items-center gap-1">
                Last Updated
                <SortIcon field="lastUpdated" />
              </div>
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-slate-400 w-24">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedKris.map((kri) => {
            const style = STATUS_STYLES[kri.status]
            const isUpdating = updatingValue?.id === kri.id

            return (
              <tr
                key={kri.id}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${style.dot} animate-pulse`} />
                    <span className={`text-xs ${style.text}`}>{style.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{kri.name}</p>
                    {kri.description && (
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">
                        {kri.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {isUpdating ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        onValueSubmit(kri.id)
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="number"
                        step="any"
                        value={updatingValue.value}
                        onChange={(e) =>
                          setUpdatingValue({ id: kri.id, value: e.target.value })
                        }
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 bg-teal-500 text-white text-xs rounded"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpdatingValue(null)}
                        className="text-slate-400 text-xs"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span
                      className={`font-semibold ${style.text} cursor-pointer hover:opacity-80`}
                      onClick={() =>
                        setUpdatingValue({
                          id: kri.id,
                          value: kri.currentValue?.toString() ?? '',
                        })
                      }
                      title="Click to update value"
                    >
                      {kri.currentValue?.toString() ?? '—'}{' '}
                      <span className="text-slate-400 font-normal text-sm">{kri.unit}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">≤{kri.thresholdGreen.toString()}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-yellow-400">{kri.thresholdAmber.toString()}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-red-400">≥{kri.thresholdRed.toString()}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-slate-400">
                    {kri.direction === 'HIGHER_IS_WORSE' ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">Higher is worse</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs">Lower is worse</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {kri.owner?.name || kri.owner?.email || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {kri.lastUpdated
                    ? format(new Date(kri.lastUpdated), 'dd MMM yyyy')
                    : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(kri.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(kri.id, kri.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
