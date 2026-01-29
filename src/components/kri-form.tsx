'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

interface KriFormProps {
  kriId?: string
  onClose: () => void
  onSuccess: () => void
}

export function KriForm({ kriId, onClose, onSuccess }: KriFormProps) {
  const isEditing = !!kriId

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    direction: 'HIGHER_IS_WORSE' as 'HIGHER_IS_WORSE' | 'LOWER_IS_WORSE',
    currentValue: '',
    thresholdGreen: '',
    thresholdAmber: '',
    thresholdRed: '',
    ownerId: '',
  })

  const [error, setError] = useState('')

  const { data: existingKri } = trpc.kri.get.useQuery(
    { id: kriId! },
    { enabled: !!kriId }
  )

  const { data: users } = trpc.risk.users.useQuery()

  const createMutation = trpc.kri.create.useMutation({
    onSuccess,
    onError: (err) => setError(err.message),
  })

  const updateMutation = trpc.kri.update.useMutation({
    onSuccess,
    onError: (err) => setError(err.message),
  })

  // Load existing data
  useEffect(() => {
    if (existingKri) {
      setFormData({
        name: existingKri.name,
        description: existingKri.description || '',
        unit: existingKri.unit,
        direction: existingKri.direction,
        currentValue: existingKri.currentValue?.toString() || '',
        thresholdGreen: existingKri.thresholdGreen.toString(),
        thresholdAmber: existingKri.thresholdAmber.toString(),
        thresholdRed: existingKri.thresholdRed.toString(),
        ownerId: existingKri.ownerId || '',
      })
    }
  }, [existingKri])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      unit: formData.unit,
      direction: formData.direction,
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
      thresholdGreen: parseFloat(formData.thresholdGreen),
      thresholdAmber: parseFloat(formData.thresholdAmber),
      thresholdRed: parseFloat(formData.thresholdRed),
      ownerId: formData.ownerId || undefined,
    }

    if (isEditing) {
      updateMutation.mutate({ id: kriId, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit KRI' : 'Add New KRI'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Customer Complaints Rate"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="What does this KRI measure?"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Unit *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., %, days, count"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Direction *</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value as typeof formData.direction })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="HIGHER_IS_WORSE">Higher is worse ↑</option>
                <option value="LOWER_IS_WORSE">Lower is worse ↓</option>
              </select>
            </div>
          </div>

          {/* Thresholds */}
          <div className="p-4 bg-slate-900 rounded-lg">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Thresholds *</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-green-400 mb-1">Green (Healthy)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.thresholdGreen}
                  onChange={(e) => setFormData({ ...formData, thresholdGreen: e.target.value })}
                  placeholder="≤"
                  className="w-full px-3 py-2 bg-slate-700 border border-green-500/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-yellow-400 mb-1">Amber (Warning)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.thresholdAmber}
                  onChange={(e) => setFormData({ ...formData, thresholdAmber: e.target.value })}
                  placeholder="≤"
                  className="w-full px-3 py-2 bg-slate-700 border border-yellow-500/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-red-400 mb-1">Red (Critical)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.thresholdRed}
                  onChange={(e) => setFormData({ ...formData, thresholdRed: e.target.value })}
                  placeholder="≥"
                  className="w-full px-3 py-2 bg-slate-700 border border-red-500/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {formData.direction === 'HIGHER_IS_WORSE'
                ? 'Status will be Red when value ≥ Red threshold'
                : 'Status will be Red when value ≤ Red threshold'}
            </p>
          </div>

          {/* Current Value */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Current Value</label>
            <input
              type="number"
              step="any"
              value={formData.currentValue}
              onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
              placeholder="Leave empty if unknown"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Owner</label>
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Unassigned</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update KRI' : 'Create KRI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
