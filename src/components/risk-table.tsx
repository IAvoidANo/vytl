'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'
import { RiskScoreBadge } from './risk-score-badge'
import { RiskForm } from './risk-form'
import type { RiskCategory, RiskResponse, RiskStatus } from '@prisma/client'

type SortField = 'title' | 'category' | 'inherentScore' | 'residualScore' | 'status' | 'createdAt'
type SortOrder = 'asc' | 'desc'

interface RiskData {
  id: string
  title: string
  description: string
  category: RiskCategory
  inherentLikelihood: number
  inherentImpact: number
  inherentScore: number
  residualLikelihood: number
  residualImpact: number
  residualScore: number
  response: RiskResponse
  controls: string | null
  status: RiskStatus
  registerId: string
  ownerId: string | null
  dueDate: Date | null
  refCode: string
  createdAt: Date
  register: { name: string }
  owner: { id: string; name: string | null; email: string } | null
}

interface RiskTableProps {
  filters?: {
    category?: string
    status?: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400',
  MONITORING: 'bg-purple-500/20 text-purple-400',
  CLOSED: 'bg-green-500/20 text-green-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  STRATEGIC: 'Strategic',
  OPERATIONAL: 'Operational',
  FINANCIAL: 'Financial',
  COMPLIANCE: 'Compliance',
  TECHNOLOGY: 'Technology',
  REPUTATIONAL: 'Reputational',
  ENVIRONMENTAL: 'Environmental',
  PEOPLE: 'People',
}

export function RiskTable({ filters }: RiskTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [editingRisk, setEditingRisk] = useState<RiskData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const queryInput = filters?.category || filters?.status ? {
    category: filters.category as RiskCategory | undefined,
    status: filters.status as RiskStatus | undefined,
  } : undefined
  const risks = trpc.risk.list.useQuery(queryInput)

  const deleteMutation = trpc.risk.delete.useMutation({
    onSuccess: () => {
      utils.risk.list.invalidate()
      setDeletingId(null)
    },
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedRisks = [...(risks.data ?? [])].sort((a, b) => {
    let aVal: string | number | Date = ''
    let bVal: string | number | Date = ''

    switch (sortField) {
      case 'title':
        aVal = a.title.toLowerCase()
        bVal = b.title.toLowerCase()
        break
      case 'category':
        aVal = a.category
        bVal = b.category
        break
      case 'inherentScore':
        aVal = a.inherentScore
        bVal = b.inherentScore
        break
      case 'residualScore':
        aVal = a.residualScore
        bVal = b.residualScore
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'createdAt':
        aVal = new Date(a.createdAt)
        bVal = new Date(b.createdAt)
        break
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this risk?')) {
      setDeletingId(id)
      deleteMutation.mutate({ id })
    }
  }

  if (risks.isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading risks...</p>
      </div>
    )
  }

  if (risks.isError) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
        Error loading risks: {risks.error.message}
      </div>
    )
  }

  if (!sortedRisks.length) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
        <p className="text-slate-400 mb-2">No risks found</p>
        <p className="text-slate-500 text-sm">
          {filters?.category || filters?.status
            ? 'Try adjusting your filters'
            : 'Create your first risk to get started'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ref
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('title')}
                >
                  <span className="flex items-center gap-1">
                    Title <SortIcon field="title" />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('category')}
                >
                  <span className="flex items-center gap-1">
                    Category <SortIcon field="category" />
                  </span>
                </th>
                <th
                  className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('inherentScore')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Inherent <SortIcon field="inherentScore" />
                  </span>
                </th>
                <th
                  className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('residualScore')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Residual <SortIcon field="residualScore" />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('status')}
                >
                  <span className="flex items-center gap-1">
                    Status <SortIcon field="status" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-500">{risk.refCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/risks/${risk.id}`} className="block group">
                      <p className="text-white font-medium group-hover:text-teal-400 transition-colors">{risk.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{risk.description}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">{CATEGORY_LABELS[risk.category]}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RiskScoreBadge score={risk.inherentScore} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RiskScoreBadge score={risk.residualScore} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[risk.status]}`}>
                      {risk.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-400">
                      {risk.owner?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/risks/${risk.id}`}
                        className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-700 rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setEditingRisk(risk as unknown as RiskData)}
                        className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(risk.id)}
                        disabled={deletingId === risk.id}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingRisk && (
        <RiskForm
          risk={editingRisk}
          onClose={() => setEditingRisk(null)}
          onSuccess={() => setEditingRisk(null)}
        />
      )}
    </>
  )
}
