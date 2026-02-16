'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { trpc } from '@/lib/trpc-client'
import { KanbanColumn } from '@/components/workspace/kanban-column'
import { KanbanCard } from '@/components/workspace/kanban-card'
import { EmailForwardModal } from '@/components/workspace/email-forward-modal'
import { Filter, Inbox, ClipboardList, UserCheck, CheckCircle, Mail, Sparkles } from 'lucide-react'

type WorkflowStatus = 'INBOX' | 'TRIAGE' | 'ASSIGNED' | 'APPROVED'
type RiskSource = 'MANUAL' | 'EMAIL' | 'EXCEL' | 'API'

interface WorkspaceRisk {
  id: string
  refCode: string
  title: string
  description: string
  category: string
  source: RiskSource
  workflowStatus: WorkflowStatus
  createdAt: string | Date
  owner: { name: string | null } | null
  residualScore: number
}

const COLUMNS: { id: WorkflowStatus; title: string; icon: React.ReactNode; color: string }[] = [
  { id: 'INBOX', title: 'Inbox', icon: <Inbox className="w-4 h-4" />, color: 'text-blue-400' },
  { id: 'TRIAGE', title: 'Triage', icon: <ClipboardList className="w-4 h-4" />, color: 'text-amber-400' },
  { id: 'ASSIGNED', title: 'Assigned', icon: <UserCheck className="w-4 h-4" />, color: 'text-purple-400' },
  { id: 'APPROVED', title: 'Approved', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400' },
]

const SOURCE_LABELS: Record<RiskSource, string> = {
  MANUAL: 'Manual',
  EMAIL: 'Email',
  EXCEL: 'Import',
  API: 'API',
}

export function WorkspaceClient() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<RiskSource | 'ALL'>('ALL')
  const [registerFilter, setRegisterFilter] = useState<string>('')
  const [showEmailModal, setShowEmailModal] = useState(false)

  const utils = trpc.useUtils()

  const { data: registers } = trpc.risk.registers.useQuery()

  // Fetch all risks (workspace shows all, not just non-approved)
  const { data: risks, isLoading } = trpc.risk.listForWorkspace.useQuery(
    registerFilter ? { registerId: registerFilter } : undefined
  )

  // Update workflow status mutation
  const updateWorkflow = trpc.risk.updateWorkflowStatus.useMutation({
    onSuccess: () => {
      utils.risk.listForWorkspace.invalidate()
    },
  })

  // Filter risks by source
  const filteredRisks = useMemo(() => {
    if (!risks) return []
    if (sourceFilter === 'ALL') return risks
    return risks.filter((r) => r.source === sourceFilter)
  }, [risks, sourceFilter])

  // Group risks by workflow status
  const risksByColumn = useMemo(() => {
    const grouped: Record<WorkflowStatus, WorkspaceRisk[]> = {
      INBOX: [],
      TRIAGE: [],
      ASSIGNED: [],
      APPROVED: [],
    }

    for (const risk of filteredRisks) {
      grouped[risk.workflowStatus as WorkflowStatus].push(risk as WorkspaceRisk)
    }

    return grouped
  }, [filteredRisks])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const riskId = active.id as string
    const overId = over.id as string

    // Determine target column
    let targetColumn: WorkflowStatus | null = null

    // Check if dropped on a column directly
    if (['INBOX', 'TRIAGE', 'ASSIGNED', 'APPROVED'].includes(overId)) {
      targetColumn = overId as WorkflowStatus
    } else {
      // Dropped on another card - find which column that card is in
      const targetRisk = filteredRisks.find((r) => r.id === overId)
      if (targetRisk) {
        targetColumn = targetRisk.workflowStatus as WorkflowStatus
      }
    }

    if (!targetColumn) return

    // Find current risk
    const currentRisk = filteredRisks.find((r) => r.id === riskId)
    if (!currentRisk || currentRisk.workflowStatus === targetColumn) return

    // Update workflow status
    updateWorkflow.mutate({ id: riskId, workflowStatus: targetColumn })
  }

  const activeRisk = activeId ? filteredRisks.find((r) => r.id === activeId) : null

  const handleEmailSuccess = () => {
    utils.risk.listForWorkspace.invalidate()
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Risk Workspace</h1>
          <p className="text-sm text-slate-400">
            Process and triage incoming risks from emails and imports
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Forward Email Button */}
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
          >
            <Mail className="w-4 h-4" />
            Forward Email
          </button>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={registerFilter}
              onChange={(e) => setRegisterFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Registers</option>
              {registers?.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as RiskSource | 'ALL')}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Sources</option>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="mb-4 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-slate-400">
            <span className="text-teal-400 font-medium">Coming soon:</span> Forward emails directly to{' '}
            <code className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono text-teal-400">
              risks@acme.vytl.app
            </code>
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              icon={column.icon}
              color={column.color}
              count={risksByColumn[column.id].length}
            >
              <SortableContext
                items={risksByColumn[column.id].map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                {risksByColumn[column.id].map((risk) => (
                  <KanbanCard
                    key={risk.id}
                    risk={risk}
                    sourceLabel={SOURCE_LABELS[risk.source]}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeRisk ? (
            <KanbanCard
              risk={activeRisk as WorkspaceRisk}
              sourceLabel={SOURCE_LABELS[activeRisk.source as RiskSource]}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Email Forward Modal */}
      <EmailForwardModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />
    </div>
  )
}
