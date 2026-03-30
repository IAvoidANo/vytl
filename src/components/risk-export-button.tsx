'use client'

import { useState } from 'react'
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'

interface RiskExportButtonProps {
  registerId?: string
}

const HEADERS = [
  'Ref', 'Title', 'Description', 'Category', 'Status', 'Workflow',
  'Response', 'Inherent L', 'Inherent I', 'Inherent Score',
  'Residual L', 'Residual I', 'Residual Score',
  'Control Effectiveness', 'Controls', 'Root Cause',
  'Financial Exposure (R)', 'VaR (R)', 'Owner', 'Register',
  'Due Date', 'Ongoing', 'Created',
]

function toRow(r: Record<string, unknown>): string[] {
  return [
    String(r.refCode ?? ''),
    String(r.title ?? ''),
    String(r.description ?? ''),
    String(r.category ?? ''),
    String(r.status ?? ''),
    String(r.workflowStatus ?? ''),
    String(r.response ?? ''),
    String(r.inherentLikelihood ?? ''),
    String(r.inherentImpact ?? ''),
    String(r.inherentScore ?? ''),
    String(r.residualLikelihood ?? ''),
    String(r.residualImpact ?? ''),
    String(r.residualScore ?? ''),
    String(r.controlEffectiveness ?? ''),
    String(r.controls ?? ''),
    String(r.rootCause ?? ''),
    String(r.financialExposure ?? ''),
    String(r.varValue ?? ''),
    String(r.ownerName ?? ''),
    String(r.registerName ?? ''),
    String(r.dueDate ?? ''),
    r.isOngoing ? 'Yes' : 'No',
    String(r.createdAt ?? ''),
  ]
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadXlsx(rows: string[][], filename: string) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Risk Register')
  XLSX.writeFile(wb, filename)
}

export function RiskExportButton({ registerId }: RiskExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data: risks } = trpc.risk.exportData.useQuery(
    registerId ? { registerId } : undefined,
    { staleTime: 30_000 }
  )

  const dateStr = new Date().toISOString().split('T')[0]

  async function handleExport(format: 'csv' | 'xlsx') {
    if (!risks) return
    setExporting(true)
    setOpen(false)
    try {
      const rows = [HEADERS, ...risks.map((r) => toRow(r as Record<string, unknown>))]
      const filename = `vytlrx-risk-register-${dateStr}.${format}`
      if (format === 'csv') {
        downloadCsv(rows, filename)
      } else {
        await downloadXlsx(rows, filename)
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {exporting ? 'Exporting…' : 'Export'}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-[160px] py-1">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              Export as Excel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
