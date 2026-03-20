'use client'

import { useState } from 'react'
import { Plus, Filter, Grid3X3, Upload } from 'lucide-react'
import { RiskTable } from '@/components/risk-table'
import { RiskForm } from '@/components/risk-form'
import { RiskHeatmap } from '@/components/risk-heatmap'
import { ExcelImportModal } from '@/components/excel-import-modal'
import { CreateRegisterModal } from '@/components/create-register-modal'
import { trpc } from '@/lib/trpc-client'
import type { RiskCategory, RiskStatus } from '@prisma/client'

type ViewMode = 'table' | 'heatmap'

export function RisksClient() {
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showCreateRegister, setShowCreateRegister] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [registerFilter, setRegisterFilter] = useState<string>('')

  const { data: registers } = trpc.risk.registers.useQuery()

  const filters = {
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
  }

  const queryInput = (categoryFilter || statusFilter || registerFilter) ? {
    category: categoryFilter ? categoryFilter as RiskCategory : undefined,
    status: statusFilter ? statusFilter as RiskStatus : undefined,
    registerId: registerFilter || undefined,
  } : undefined

  const { data: risks } = trpc.risk.list.useQuery(queryInput)

  const stats = {
    total: risks?.length ?? 0,
    open: risks?.filter((r) => r.status === 'OPEN').length ?? 0,
    high: risks?.filter((r) => r.residualScore >= 15).length ?? 0,
  }

  const clearFilters = () => {
    setCategoryFilter('')
    setStatusFilter('')
    setRegisterFilter('')
  }

  const hasFilters = categoryFilter || statusFilter || registerFilter

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Risk Register</h2>
          <p className="text-slate-400">Manage and monitor your organisation&apos;s risks</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'table' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 ${
                viewMode === 'heatmap' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Heatmap
            </button>
          </div>
          <button
            onClick={() => setShowCreateRegister(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Register
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Import
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Risk
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Risks</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Open Risks</p>
          <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">High/Critical</p>
          <p className="text-2xl font-bold text-red-400">{stats.high}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter:</span>
        </div>
        <select
          value={registerFilter}
          onChange={(e) => setRegisterFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Registers</option>
          {registers?.map((reg) => (
            <option key={reg.id} value={reg.id}>
              {reg.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Categories</option>
          <option value="STRATEGIC">Strategic</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="FINANCIAL">Financial</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="TECHNOLOGY">Technology</option>
          <option value="REPUTATIONAL">Reputational</option>
          <option value="ENVIRONMENTAL">Environmental</option>
          <option value="PEOPLE">People</option>
          <option value="HEALTH_SAFETY">Health &amp; Safety</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="MONITORING">Monitoring</option>
          <option value="CLOSED">Closed</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-slate-400 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <RiskTable filters={filters} />
      ) : (
        <RiskHeatmap />
      )}

      {/* Form Modal */}
      {showForm && (
        <RiskForm
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Create Register Modal */}
      {showCreateRegister && (
        <CreateRegisterModal
          onClose={() => setShowCreateRegister(false)}
          onSuccess={() => setShowCreateRegister(false)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ExcelImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
