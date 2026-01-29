'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Activity, Pencil, Trash2, Grid3X3, List } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { KriForm } from '@/components/kri-form'
import { KriTable } from '@/components/kri-table'
import { format } from 'date-fns'

const STATUS_STYLES = {
  GREEN: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    dot: 'bg-green-500',
    label: 'Healthy',
  },
  AMBER: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    label: 'Warning',
  },
  RED: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    dot: 'bg-red-500',
    label: 'Critical',
  },
}

export function KrisClient() {
  const [showForm, setShowForm] = useState(false)
  const [editingKri, setEditingKri] = useState<string | null>(null)
  const [updatingValue, setUpdatingValue] = useState<{ id: string; value: string } | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const utils = trpc.useUtils()
  const { data: kris, isLoading } = trpc.kri.list.useQuery({ activeOnly: true })
  const { data: stats } = trpc.kri.stats.useQuery()

  const updateValueMutation = trpc.kri.updateValue.useMutation({
    onSuccess: () => {
      utils.kri.list.invalidate()
      utils.kri.stats.invalidate()
      setUpdatingValue(null)
    },
  })

  const deleteMutation = trpc.kri.delete.useMutation({
    onSuccess: () => {
      utils.kri.list.invalidate()
      utils.kri.stats.invalidate()
    },
  })

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete KRI "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate({ id })
    }
  }

  const handleValueSubmit = (id: string) => {
    if (updatingValue && updatingValue.id === id) {
      const value = parseFloat(updatingValue.value)
      if (!isNaN(value)) {
        updateValueMutation.mutate({ id, value })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Key Risk Indicators</h2>
          <p className="text-slate-400">Monitor and track key metrics for risk management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'cards'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add KRI
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-sm">Total KRIs</span>
          </div>
          <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-slate-400 text-sm">Healthy</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats?.green ?? 0}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-slate-400 text-sm">Warning</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats?.amber ?? 0}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-slate-400 text-sm">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats?.red ?? 0}</p>
        </div>
      </div>

      {/* KRI List */}
      {!kris?.length ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No KRIs defined</p>
          <p className="text-slate-500 text-sm">Add key risk indicators to monitor your organisation&apos;s risk metrics</p>
        </div>
      ) : viewMode === 'table' ? (
        <KriTable
          kris={kris}
          onEdit={(id) => setEditingKri(id)}
          onDelete={handleDelete}
          onUpdateValue={(id, value) => setUpdatingValue({ id, value })}
          updatingValue={updatingValue}
          setUpdatingValue={setUpdatingValue}
          onValueSubmit={handleValueSubmit}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kris.map((kri) => {
            const style = STATUS_STYLES[kri.status]
            const isUpdating = updatingValue?.id === kri.id

            return (
              <div
                key={kri.id}
                className={`rounded-lg p-4 border ${style.bg} ${style.border}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{kri.name}</h3>
                    {kri.description && (
                      <p className="text-sm text-slate-400 mt-1">{kri.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setEditingKri(kri.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(kri.id, kri.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Current Value */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    {isUpdating ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleValueSubmit(kri.id)
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="number"
                          step="any"
                          value={updatingValue.value}
                          onChange={(e) => setUpdatingValue({ id: kri.id, value: e.target.value })}
                          className="w-24 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-xl font-bold"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-teal-500 text-white text-sm rounded"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpdatingValue(null)}
                          className="px-2 py-1 text-slate-400 text-sm"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <span
                          className={`text-3xl font-bold ${style.text} cursor-pointer hover:opacity-80`}
                          onClick={() =>
                            setUpdatingValue({
                              id: kri.id,
                              value: kri.currentValue?.toString() ?? '',
                            })
                          }
                          title="Click to update value"
                        >
                          {kri.currentValue?.toString() ?? '—'}
                        </span>
                        <span className="text-slate-400">{kri.unit}</span>
                        {kri.direction === 'HIGHER_IS_WORSE' ? (
                          <TrendingUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-slate-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Threshold Bar */}
                <div className="mb-3">
                  <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
                    <div className="flex-1 bg-green-500/50"></div>
                    <div className="flex-1 bg-yellow-500/50"></div>
                    <div className="flex-1 bg-red-500/50"></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-500">
                    <span>≤{kri.thresholdGreen.toString()}</span>
                    <span>{kri.thresholdAmber.toString()}</span>
                    <span>≥{kri.thresholdRed.toString()}</span>
                  </div>
                </div>

                {/* Status & Meta */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`}></span>
                    <span className={style.text}>{style.label}</span>
                  </div>
                  <span className="text-slate-500">
                    {kri.lastUpdated
                      ? `Updated ${format(new Date(kri.lastUpdated), 'dd MMM')}`
                      : 'Never updated'}
                  </span>
                </div>

                {/* Owner */}
                {kri.owner && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-500">
                    Owner: {kri.owner.name || kri.owner.email}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {(showForm || editingKri) && (
        <KriForm
          kriId={editingKri || undefined}
          onClose={() => {
            setShowForm(false)
            setEditingKri(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingKri(null)
            utils.kri.list.invalidate()
            utils.kri.stats.invalidate()
          }}
        />
      )}
    </div>
  )
}
