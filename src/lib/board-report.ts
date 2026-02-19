/**
 * Board Report PDF Generation
 * Pure function that builds a multi-page PDF for governance reporting
 */

import { jsPDF } from 'jspdf'

// ============================================
// TYPES
// ============================================

export interface BoardReportData {
  orgName: string
  generatedDate: Date
  vytlScore: {
    score: number
    grade: string
  } | null
  riskStats: {
    total: number
    byStatus: Record<string, number>
    byCategory: Record<string, number>
    highRisks: number
  }
  topRisks: {
    refCode: string
    title: string
    category: string
    residualScore: number
    varValue?: string | null
    status: string
    owner: { name: string | null } | null
  }[]
  heatmapData: {
    likelihood: number
    impact: number
  }[]
  categoryTrends: {
    category: string
    count: number
    avgScore: number
    direction: string
  }[]
  recommendations: {
    type: string
    message: string
    severity: string
  }[]
  kris: {
    name: string
    currentValue: number | string | null
    thresholdGreen: number | string
    thresholdAmber: number | string
    thresholdRed: number | string
    status: string
  }[]
}

// ============================================
// CONSTANTS
// ============================================

const COLORS = {
  primary: [15, 118, 110] as [number, number, number],    // teal-600
  dark: [30, 41, 59] as [number, number, number],         // slate-800
  medium: [100, 116, 139] as [number, number, number],    // slate-500
  light: [226, 232, 240] as [number, number, number],     // slate-200
  white: [255, 255, 255] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number],
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

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  MONITORING: 'Monitoring',
  CLOSED: 'Closed',
}

const HEATMAP_COLORS: Record<string, [number, number, number]> = {
  low: [34, 197, 94],
  medium: [245, 158, 11],
  high: [239, 68, 68],
  critical: [185, 28, 28],
}

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 20
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

// ============================================
// HELPERS
// ============================================

function addPageHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.primary)
  doc.text(title, MARGIN, y)
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2)
  return y + 10
}

function addPageFooter(doc: jsPDF, generatedDate: Date) {
  const pageCount = doc.getNumberOfPages()
  const dateStr = generatedDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.medium)
    doc.text(
      `Generated ${dateStr} | Page ${i} of ${pageCount}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 10,
      { align: 'center' }
    )
  }
}

function checkPageBreak(doc: jsPDF, currentY: number, needed: number): number {
  if (currentY + needed > PAGE_HEIGHT - 25) {
    doc.addPage()
    return MARGIN + 5
  }
  return currentY
}

function addTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths: number[]
): number {
  let y = startY

  // Header
  doc.setFillColor(...COLORS.dark)
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 8, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.white)
  let x = MARGIN + 2
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x, y)
    x += colWidths[i]
  }
  y += 8

  // Rows
  doc.setTextColor(...COLORS.dark)
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    y = checkPageBreak(doc, y, 10)

    if (rowIdx % 2 === 0) {
      doc.setFillColor(241, 245, 249) // slate-100
      doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 8, 'F')
    }

    x = MARGIN + 2
    doc.setFontSize(8)
    for (let i = 0; i < rows[rowIdx].length; i++) {
      const text = rows[rowIdx][i] || ''
      const truncated = text.length > 35 ? text.substring(0, 32) + '...' : text
      doc.text(truncated, x, y)
      x += colWidths[i]
    }
    y += 8
  }

  return y
}

function getRiskLevel(score: number): string {
  if (score >= 20) return 'critical'
  if (score >= 15) return 'high'
  if (score >= 8) return 'medium'
  return 'low'
}

// ============================================
// MAIN GENERATION
// ============================================

export function generateBoardReport(data: BoardReportData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')
  let y: number

  // ==============================
  // COVER PAGE
  // ==============================
  doc.setFillColor(...COLORS.dark)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  // Org name
  doc.setFontSize(16)
  doc.setTextColor(...COLORS.medium)
  doc.text(data.orgName, PAGE_WIDTH / 2, 100, { align: 'center' })

  // Title
  doc.setFontSize(32)
  doc.setTextColor(...COLORS.white)
  doc.text('Board Risk Report', PAGE_WIDTH / 2, 125, { align: 'center' })

  // Date
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.primary)
  const dateStr = data.generatedDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(dateStr, PAGE_WIDTH / 2, 145, { align: 'center' })

  // Branding
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.medium)
  doc.text('Powered by Vytl Risk Management', PAGE_WIDTH / 2, PAGE_HEIGHT - 30, {
    align: 'center',
  })

  // ==============================
  // EXECUTIVE SUMMARY
  // ==============================
  doc.addPage()
  y = MARGIN + 5
  y = addPageHeader(doc, 'Executive Summary', y)

  // Vytl Score box
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 30, 3, 3, 'F')

  doc.setFontSize(12)
  doc.setTextColor(...COLORS.dark)
  doc.text('Vytl Score', MARGIN + 10, y + 10)

  if (data.vytlScore) {
    doc.setFontSize(28)
    doc.setTextColor(...COLORS.primary)
    doc.text(`${data.vytlScore.score}`, MARGIN + 10, y + 24)

    doc.setFontSize(14)
    doc.text(`Grade: ${data.vytlScore.grade}`, MARGIN + 45, y + 24)
  } else {
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.medium)
    doc.text('Not yet calculated', MARGIN + 10, y + 24)
  }

  // Summary stats on right side
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.dark)
  doc.text(`Total Risks: ${data.riskStats.total}`, MARGIN + 110, y + 10)
  doc.text(`High Risk Items: ${data.riskStats.highRisks}`, MARGIN + 110, y + 18)

  const kriRedCount = data.kris.filter((k) => k.status === 'RED').length
  doc.text(`KRIs in Red: ${kriRedCount}`, MARGIN + 110, y + 26)

  y += 40

  // ==============================
  // RISK OVERVIEW
  // ==============================
  y = addPageHeader(doc, 'Risk Overview', y)

  // By Status table
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.dark)
  doc.text('By Status', MARGIN, y)
  y += 6

  const statusRows = Object.entries(data.riskStats.byStatus).map(([status, count]) => [
    STATUS_LABELS[status] || status,
    String(count),
    data.riskStats.total > 0
      ? `${Math.round((count / data.riskStats.total) * 100)}%`
      : '0%',
  ])

  y = addTable(doc, ['Status', 'Count', '%'], statusRows, y, [60, 40, 40])
  y += 8

  // By Category table
  y = checkPageBreak(doc, y, 80)
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.dark)
  doc.text('By Category', MARGIN, y)
  y += 6

  const categoryRows = Object.entries(data.riskStats.byCategory).map(([cat, count]) => [
    CATEGORY_LABELS[cat] || cat,
    String(count),
    data.riskStats.total > 0
      ? `${Math.round((count / data.riskStats.total) * 100)}%`
      : '0%',
  ])

  y = addTable(doc, ['Category', 'Count', '%'], categoryRows, y, [60, 40, 40])
  y += 10

  // ==============================
  // TOP 10 RISKS
  // ==============================
  y = checkPageBreak(doc, y, 60)
  y = addPageHeader(doc, 'Top 10 Risks', y)

  if (data.topRisks.length > 0) {
    const topRiskRows = data.topRisks.map((risk) => [
      risk.refCode,
      risk.title,
      CATEGORY_LABELS[risk.category] || risk.category,
      String(risk.residualScore),
      risk.varValue ? `R ${Number(risk.varValue).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` : '—',
      STATUS_LABELS[risk.status] || risk.status,
      risk.owner?.name || 'Unassigned',
    ])

    y = addTable(
      doc,
      ['Ref', 'Title', 'Category', 'Score', 'VaR', 'Status', 'Owner'],
      topRiskRows,
      y,
      [18, 40, 24, 16, 22, 22, 28]
    )
  } else {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.medium)
    doc.text('No risks recorded.', MARGIN, y)
    y += 8
  }

  y += 10

  // ==============================
  // HEATMAP
  // ==============================
  y = checkPageBreak(doc, y, 80)
  y = addPageHeader(doc, 'Risk Heatmap', y)

  // Build 5x5 grid
  const heatmapGrid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0))
  for (const item of data.heatmapData) {
    const li = Math.min(5, Math.max(1, item.likelihood)) - 1
    const im = Math.min(5, Math.max(1, item.impact)) - 1
    heatmapGrid[li][im]++
  }

  const cellSize = 20
  const gridX = MARGIN + 15
  const gridY = y + 5

  // Axis labels
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.dark)
  doc.text('Impact', gridX + (cellSize * 5) / 2, gridY + cellSize * 5 + 12, { align: 'center' })

  // Save state and rotate for vertical label
  doc.text('Likelihood', gridX - 12, gridY + (cellSize * 5) / 2, { angle: 90 })

  for (let li = 0; li < 5; li++) {
    // Row label
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.dark)
    doc.text(String(5 - li), gridX - 5, gridY + li * cellSize + cellSize / 2 + 1)

    for (let im = 0; im < 5; im++) {
      const count = heatmapGrid[4 - li][im] // flip so 5 is at top
      const riskScore = (5 - li) * (im + 1)
      const level = getRiskLevel(riskScore)
      const color = HEATMAP_COLORS[level]

      doc.setFillColor(color[0], color[1], color[2])
      doc.setDrawColor(255, 255, 255)
      doc.rect(gridX + im * cellSize, gridY + li * cellSize, cellSize, cellSize, 'FD')

      if (count > 0) {
        doc.setFontSize(10)
        doc.setTextColor(255, 255, 255)
        doc.text(
          String(count),
          gridX + im * cellSize + cellSize / 2,
          gridY + li * cellSize + cellSize / 2 + 2,
          { align: 'center' }
        )
      }
    }
  }

  // Column labels
  for (let im = 0; im < 5; im++) {
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.dark)
    doc.text(String(im + 1), gridX + im * cellSize + cellSize / 2, gridY + 5 * cellSize + 6, {
      align: 'center',
    })
  }

  y = gridY + 5 * cellSize + 18

  // ==============================
  // CATEGORY TRENDS
  // ==============================
  y = checkPageBreak(doc, y, 60)
  y = addPageHeader(doc, 'Category Trends', y)

  if (data.categoryTrends.length > 0) {
    const trendRows = data.categoryTrends.map((t) => [
      CATEGORY_LABELS[t.category] || t.category,
      String(t.count),
      String(t.avgScore),
      t.direction === 'improving'
        ? 'Improving'
        : t.direction === 'worsening'
        ? 'Worsening'
        : 'Stable',
    ])

    y = addTable(doc, ['Category', 'Count', 'Avg Score', 'Direction'], trendRows, y, [
      50, 30, 35, 40,
    ])
  } else {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.medium)
    doc.text('No trend data available.', MARGIN, y)
    y += 8
  }

  y += 10

  // ==============================
  // SCORING RECOMMENDATIONS
  // ==============================
  y = checkPageBreak(doc, y, 60)
  y = addPageHeader(doc, 'Scoring Recommendations', y)

  if (data.recommendations.length > 0) {
    const top5 = data.recommendations.slice(0, 5)
    const recRows = top5.map((r) => [
      r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
      r.message,
    ])

    y = addTable(doc, ['Severity', 'Recommendation'], recRows, y, [30, 140])
  } else {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.medium)
    doc.text('No recommendations at this time.', MARGIN, y)
    y += 8
  }

  y += 10

  // ==============================
  // KRI STATUS
  // ==============================
  y = checkPageBreak(doc, y, 60)
  y = addPageHeader(doc, 'KRI Status', y)

  if (data.kris.length > 0) {
    const kriRows = data.kris.map((kri) => [
      kri.name,
      kri.currentValue != null ? String(kri.currentValue) : 'N/A',
      String(kri.thresholdGreen),
      String(kri.thresholdAmber),
      String(kri.thresholdRed),
      kri.status,
    ])

    y = addTable(
      doc,
      ['KRI Name', 'Current', 'Green', 'Amber', 'Red', 'Status'],
      kriRows,
      y,
      [45, 22, 22, 22, 22, 22]
    )
  } else {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.medium)
    doc.text('No KRIs configured.', MARGIN, y)
    y += 8
  }

  // ==============================
  // FOOTERS
  // ==============================
  addPageFooter(doc, data.generatedDate)

  return doc
}
