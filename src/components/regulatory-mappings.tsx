'use client'

import { useState } from 'react'
import {
  ClipboardCheck,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  MinusCircle,
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import {
  getAllFrameworks,
  getRequirementsByFramework,
  type FrameworkId,
  type RegulatoryRequirement,
} from '@/lib/regulatory-frameworks'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; style: string }> = {
  COMPLIANT: { label: 'Compliant', icon: CheckCircle, style: 'bg-green-500/20 text-green-400 border-green-500/30' },
  PARTIALLY_COMPLIANT: { label: 'Partial', icon: AlertTriangle, style: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  NON_COMPLIANT: { label: 'Non-Compliant', icon: XCircle, style: 'bg-red-500/20 text-red-400 border-red-500/30' },
  NOT_ASSESSED: { label: 'Not Assessed', icon: HelpCircle, style: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  NOT_APPLICABLE: { label: 'N/A', icon: MinusCircle, style: 'bg-slate-600/20 text-slate-500 border-slate-600/30' },
}

const STATUS_CYCLE = ['NOT_ASSESSED', 'COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE'] as const

interface RegulatoryMappingsProps {
  riskId: string
}

export function RegulatoryMappings({ riskId }: RegulatoryMappingsProps) {
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [expandedFrameworks, setExpandedFrameworks] = useState<Set<string>>(new Set(['KING_V', 'ISO_31000']))

  const utils = trpc.useUtils()
  const { data: mappings, isLoading } = trpc.regulatory.list.useQuery({ riskId })
  const { data: coverage } = trpc.regulatory.riskCoverage.useQuery({ riskId })

  const updateMutation = trpc.regulatory.update.useMutation({
    onSuccess: () => {
      utils.regulatory.list.invalidate({ riskId })
      utils.regulatory.riskCoverage.invalidate({ riskId })
    },
  })

  const deleteMutation = trpc.regulatory.delete.useMutation({
    onSuccess: () => {
      utils.regulatory.list.invalidate({ riskId })
      utils.regulatory.riskCoverage.invalidate({ riskId })
    },
  })

  const frameworks = getAllFrameworks()
  const mappingsByCode = new Map(
    (mappings || []).map((m) => [m.requirementCode, m])
  )

  const handleStatusCycle = (mappingId: string, currentStatus: string) => {
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus as typeof STATUS_CYCLE[number])
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
    updateMutation.mutate({ id: mappingId, complianceStatus: nextStatus })
  }

  const handleDelete = (mappingId: string) => {
    if (confirm('Remove this regulatory mapping?')) {
      deleteMutation.mutate({ id: mappingId })
    }
  }

  const toggleFramework = (fwId: string) => {
    setExpandedFrameworks((prev) => {
      const next = new Set(prev)
      if (next.has(fwId)) next.delete(fwId)
      else next.add(fwId)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-teal-400" />
          <h3 className="font-semibold text-white">Regulatory Compliance</h3>
          <span className="text-sm text-slate-400">
            ({mappings?.length || 0} mapping{mappings?.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className="flex items-center gap-2 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Mappings
        </button>
      </div>

      {/* Coverage Summary */}
      {coverage && 'frameworks' in coverage && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {coverage.frameworks.map((fw) => (
            <div key={fw.frameworkId} className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">{fw.frameworkName}</span>
                <span className="text-lg font-bold text-white">{fw.coveragePercent}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    fw.coveragePercent >= 80 ? 'bg-green-500' :
                    fw.coveragePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${fw.coveragePercent}%` }}
                />
              </div>
              <div className="flex gap-2 text-[10px] text-slate-500">
                <span>{fw.mappedRequirements}/{fw.totalRequirements} mapped</span>
                {fw.byStatus.COMPLIANT > 0 && (
                  <span className="text-green-400">{fw.byStatus.COMPLIANT} compliant</span>
                )}
                {fw.byStatus.NON_COMPLIANT > 0 && (
                  <span className="text-red-400">{fw.byStatus.NON_COMPLIANT} non-compliant</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Mappings Panel */}
      {showAddPanel && (
        <AddMappingsPanel
          riskId={riskId}
          existingCodes={new Set(mappingsByCode.keys())}
          onClose={() => setShowAddPanel(false)}
          onSuccess={() => {
            utils.regulatory.list.invalidate({ riskId })
            utils.regulatory.riskCoverage.invalidate({ riskId })
          }}
        />
      )}

      {/* Framework Sections */}
      {frameworks.map((fw) => {
        const fwMappings = (mappings || []).filter((m) =>
          m.requirementCode.startsWith(fw.id === 'KING_V' ? 'KING_V_' : 'ISO_31000_')
        )
        if (fwMappings.length === 0) return null

        const isExpanded = expandedFrameworks.has(fw.id)

        return (
          <div key={fw.id} className="mb-4">
            <button
              onClick={() => toggleFramework(fw.id)}
              className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {fw.name}
              <span className="text-slate-500">({fwMappings.length})</span>
            </button>

            {isExpanded && (
              <div className="space-y-1 ml-6">
                {fwMappings.map((mapping) => {
                  const status = STATUS_CONFIG[mapping.complianceStatus] || STATUS_CONFIG.NOT_ASSESSED
                  const StatusIcon = status.icon

                  return (
                    <div
                      key={mapping.id}
                      className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleStatusCycle(mapping.id, mapping.complianceStatus)}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border flex-shrink-0 transition-colors hover:opacity-80 ${status.style}`}
                          title="Click to cycle status"
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </button>
                        <div className="min-w-0">
                          <span className="text-xs font-mono text-slate-500 mr-2">{mapping.requirementCode}</span>
                          {mapping.notes && (
                            <span className="text-xs text-slate-400 truncate">{mapping.notes}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(mapping.id)}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Empty State */}
      {(!mappings || mappings.length === 0) && !showAddPanel && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No Regulatory Mappings</h3>
          <p className="text-slate-500 mb-4 max-w-md mx-auto">
            Map this risk to King V and ISO 31000 requirements to track regulatory compliance.
          </p>
          <button
            onClick={() => setShowAddPanel(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
          >
            Add Mappings
          </button>
        </div>
      )}
    </div>
  )
}

// Add Mappings Panel
function AddMappingsPanel({
  riskId,
  existingCodes,
  onClose,
  onSuccess,
}: {
  riskId: string
  existingCodes: Set<string>
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>('KING_V')
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())

  const bulkCreateMutation = trpc.regulatory.bulkCreate.useMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  const requirements = getRequirementsByFramework(selectedFramework)
  const groupedByPrinciple = requirements.reduce<Record<string, RegulatoryRequirement[]>>((acc, req) => {
    if (!acc[req.principle]) acc[req.principle] = []
    acc[req.principle].push(req)
    return acc
  }, {})

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const selectAllInPrinciple = (reqs: RegulatoryRequirement[]) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev)
      const available = reqs.filter((r) => !existingCodes.has(r.code))
      const allSelected = available.every((r) => next.has(r.code))
      if (allSelected) {
        available.forEach((r) => next.delete(r.code))
      } else {
        available.forEach((r) => next.add(r.code))
      }
      return next
    })
  }

  const handleSubmit = () => {
    if (selectedCodes.size === 0) return
    bulkCreateMutation.mutate({
      riskId,
      requirementCodes: Array.from(selectedCodes),
    })
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 mb-6">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white">Add Regulatory Mappings</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            Cancel
          </button>
        </div>

        {/* Framework Selector */}
        <div className="flex gap-2">
          {getAllFrameworks().map((fw) => (
            <button
              key={fw.id}
              onClick={() => { setSelectedFramework(fw.id); setSelectedCodes(new Set()) }}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                selectedFramework === fw.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {fw.name}
            </button>
          ))}
        </div>
      </div>

      {/* Requirements List */}
      <div className="max-h-64 overflow-auto p-4 space-y-4">
        {Object.entries(groupedByPrinciple).map(([principle, reqs]) => {
          const available = reqs.filter((r) => !existingCodes.has(r.code))
          if (available.length === 0) return null

          return (
            <div key={principle}>
              <button
                onClick={() => selectAllInPrinciple(reqs)}
                className="text-xs font-medium text-slate-400 hover:text-teal-400 mb-2 transition-colors"
              >
                {principle} ({available.length} available)
              </button>
              <div className="space-y-1">
                {available.map((req) => (
                  <label
                    key={req.code}
                    className="flex items-start gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCodes.has(req.code)}
                      onChange={() => toggleCode(req.code)}
                      className="mt-0.5 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-mono text-slate-500">{req.code}</span>
                      <p className="text-xs text-slate-300">{req.title}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {selectedCodes.size} selected
        </span>
        <button
          onClick={handleSubmit}
          disabled={selectedCodes.size === 0 || bulkCreateMutation.isPending}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {bulkCreateMutation.isPending ? 'Adding...' : `Add ${selectedCodes.size} Mapping${selectedCodes.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
