'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  User,
  CheckCircle,
  XCircle,
  ChevronDown,
  Mail,
  FileSpreadsheet,
  Pencil,
  Globe,
  Trash2,
  Archive,
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { RiskScoreBadge } from '@/components/risk-score-badge'
import { useAppetite } from '@/lib/use-appetite'

interface KanbanCardProps {
  risk: {
    id: string
    refCode: string
    title: string
    description: string
    category: string
    source: string
    workflowStatus: string
    createdAt: string | Date
    owner: { name: string | null } | null
    residualScore: number
  }
  sourceLabel: string
  isDragging?: boolean
  onEdit?: (riskId: string) => void
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  MANUAL: <Pencil className="w-3 h-3" />,
  EMAIL: <Mail className="w-3 h-3" />,
  EXCEL: <FileSpreadsheet className="w-3 h-3" />,
  API: <Globe className="w-3 h-3" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  STRATEGIC: 'bg-purple-500/20 text-purple-400',
  OPERATIONAL: 'bg-blue-500/20 text-blue-400',
  FINANCIAL: 'bg-green-500/20 text-green-400',
  COMPLIANCE: 'bg-amber-500/20 text-amber-400',
  TECHNOLOGY: 'bg-cyan-500/20 text-cyan-400',
  REPUTATIONAL: 'bg-pink-500/20 text-pink-400',
  ENVIRONMENTAL: 'bg-emerald-500/20 text-emerald-400',
  PEOPLE: 'bg-orange-500/20 text-orange-400',
}

export function KanbanCard({ risk, sourceLabel, isDragging, onEdit }: KanbanCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const appetite = useAppetite()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: risk.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const utils = trpc.useUtils()

  // Quick action mutations
  const updateWorkflow = trpc.risk.updateWorkflowStatus.useMutation({
    onSuccess: () => {
      utils.risk.listForWorkspace.invalidate()
    },
  })

  const deleteMutation = trpc.risk.delete.useMutation({
    onSuccess: () => {
      utils.risk.listForWorkspace.invalidate()
      utils.risk.list.invalidate()
    },
  })

  const archiveMutation = trpc.risk.update.useMutation({
    onSuccess: () => {
      utils.risk.listForWorkspace.invalidate()
      utils.risk.list.invalidate()
    },
  })

  const handleApprove = () => {
    updateWorkflow.mutate({ id: risk.id, workflowStatus: 'APPROVED' })
  }

  const handleReject = () => {
    updateWorkflow.mutate({ id: risk.id, workflowStatus: 'INBOX' })
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id: risk.id })
    setConfirmDelete(false)
  }

  const handleArchive = () => {
    archiveMutation.mutate({ id: risk.id, status: 'ARCHIVED' })
  }

  const formattedDate = new Date(risk.createdAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-slate-800 rounded-lg border border-slate-700 p-3 transition-all ${
        isDragging || isSortableDragging
          ? 'shadow-lg shadow-teal-500/20 border-teal-500 opacity-90'
          : 'hover:border-slate-600'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500">{risk.refCode}</span>
            <span
              className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                CATEGORY_COLORS[risk.category] || 'bg-slate-700 text-slate-300'
              }`}
            >
              {risk.category.toLowerCase()}
            </span>
          </div>
          <h4 className="text-sm font-medium text-white truncate">{risk.title}</h4>
        </div>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(risk.id) }}
              className="p-1 text-slate-500 hover:text-teal-400 transition-colors rounded hover:bg-slate-700"
              title="Edit risk"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <RiskScoreBadge
              score={risk.residualScore}
              size="sm"
              thresholds={appetite.thresholds}
              category={risk.category}
              categoryConfig={appetite.categoryConfig}
            />
        </div>
      </div>

      {/* Description Preview */}
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{risk.description}</p>

      {/* Card Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="flex items-center gap-1">
            {SOURCE_ICONS[risk.source]}
            {sourceLabel}
          </span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>

        {risk.owner ? (
          <span className="flex items-center gap-1 text-slate-400">
            <User className="w-3 h-3" />
            {risk.owner.name || 'Assigned'}
          </span>
        ) : (
          <span className="text-slate-500 italic">Unassigned</span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <button
          onClick={() => { setShowActions(!showActions); setConfirmDelete(false) }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Quick Actions
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showActions ? 'rotate-180' : ''}`}
          />
        </button>

        {showActions && (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(risk.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              )}
              {risk.workflowStatus !== 'APPROVED' && risk.workflowStatus !== 'ASSIGNED' && (
                <button
                  onClick={() =>
                    updateWorkflow.mutate({ id: risk.id, workflowStatus: 'ASSIGNED' })
                  }
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                >
                  <User className="w-3 h-3" />
                  Assign
                </button>
              )}
              {risk.workflowStatus !== 'APPROVED' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-500/20 text-slate-400 rounded hover:bg-slate-500/30 transition-colors disabled:opacity-50"
              >
                <Archive className="w-3 h-3" />
                Archive
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>

            {/* Delete confirmation */}
            {confirmDelete && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 mb-2">
                  Are you sure you want to delete this risk? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
