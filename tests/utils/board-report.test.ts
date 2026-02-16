import { describe, it, expect } from 'vitest'
import { generateBoardReport, type BoardReportData } from '@/lib/board-report'

function createMockData(overrides: Partial<BoardReportData> = {}): BoardReportData {
  return {
    orgName: 'Acme Corp',
    generatedDate: new Date('2025-06-15'),
    vytlScore: { score: 72, grade: 'B' },
    riskStats: {
      total: 25,
      byStatus: { OPEN: 10, IN_PROGRESS: 8, MONITORING: 5, CLOSED: 2 },
      byCategory: {
        STRATEGIC: 3,
        OPERATIONAL: 5,
        FINANCIAL: 4,
        COMPLIANCE: 3,
        TECHNOLOGY: 4,
        REPUTATIONAL: 2,
        ENVIRONMENTAL: 2,
        PEOPLE: 2,
      },
      highRisks: 6,
    },
    topRisks: [
      { refCode: 'STR-001', title: 'Market expansion risk', category: 'STRATEGIC', residualScore: 20, status: 'OPEN', owner: { name: 'John' } },
      { refCode: 'TEC-001', title: 'Cybersecurity threat', category: 'TECHNOLOGY', residualScore: 16, status: 'IN_PROGRESS', owner: { name: 'Jane' } },
      { refCode: 'FIN-001', title: 'Revenue decline', category: 'FINANCIAL', residualScore: 15, status: 'OPEN', owner: null },
    ],
    heatmapData: [
      { likelihood: 4, impact: 5 },
      { likelihood: 4, impact: 4 },
      { likelihood: 3, impact: 5 },
      { likelihood: 2, impact: 3 },
      { likelihood: 1, impact: 2 },
    ],
    categoryTrends: [
      { category: 'STRATEGIC', count: 3, avgScore: 12, direction: 'stable' },
      { category: 'TECHNOLOGY', count: 4, avgScore: 15, direction: 'worsening' },
    ],
    recommendations: [
      { type: 'under_scored', message: 'Risk STR-001 may be under-scored', severity: 'high' },
      { type: 'missing_category', message: 'No risks in ENVIRONMENTAL category', severity: 'medium' },
    ],
    kris: [
      { name: 'System Uptime', currentValue: '99.2', thresholdGreen: '99.5', thresholdAmber: '99.0', thresholdRed: '98.0', status: 'AMBER' },
      { name: 'Open Incidents', currentValue: '3', thresholdGreen: '2', thresholdAmber: '5', thresholdRed: '10', status: 'GREEN' },
    ],
    ...overrides,
  }
}

describe('Board Report PDF Generation', () => {
  it('should return a valid jsPDF instance', () => {
    const data = createMockData()
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
    expect(typeof doc.save).toBe('function')
    expect(typeof doc.output).toBe('function')
  })

  it('should generate a multi-page PDF', () => {
    const data = createMockData()
    const doc = generateBoardReport(data)
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2)
  })

  it('should handle empty data (zero risks)', () => {
    const data = createMockData({
      riskStats: {
        total: 0,
        byStatus: { OPEN: 0, IN_PROGRESS: 0, MONITORING: 0, CLOSED: 0 },
        byCategory: {},
        highRisks: 0,
      },
      topRisks: [],
      heatmapData: [],
      categoryTrends: [],
      recommendations: [],
      kris: [],
    })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2)
  })

  it('should handle null vytl score', () => {
    const data = createMockData({ vytlScore: null })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
  })

  it('should handle full mock data with correct page count', () => {
    const data = createMockData()
    const doc = generateBoardReport(data)
    // Cover + executive + overview/top10 + heatmap + trends/recommendations + KRI
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3)
  })

  it('should handle many risks in heatmap', () => {
    const heatmapData = []
    for (let l = 1; l <= 5; l++) {
      for (let i = 1; i <= 5; i++) {
        for (let n = 0; n < 3; n++) {
          heatmapData.push({ likelihood: l, impact: i })
        }
      }
    }
    const data = createMockData({ heatmapData })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
  })

  it('should handle org name with special characters', () => {
    const data = createMockData({ orgName: 'Org & Co. (Pty) Ltd' })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
  })

  it('should handle 10 top risks', () => {
    const topRisks = Array.from({ length: 10 }, (_, i) => ({
      refCode: `TST-${String(i + 1).padStart(3, '0')}`,
      title: `Test risk number ${i + 1}`,
      category: 'OPERATIONAL',
      residualScore: 25 - i,
      status: 'OPEN',
      owner: { name: `Owner ${i + 1}` },
    }))
    const data = createMockData({ topRisks })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
  })

  it('should handle many KRIs', () => {
    const kris = Array.from({ length: 15 }, (_, i) => ({
      name: `KRI ${i + 1}`,
      currentValue: String(Math.random() * 100),
      thresholdGreen: '80',
      thresholdAmber: '60',
      thresholdRed: '40',
      status: ['GREEN', 'AMBER', 'RED'][i % 3],
    }))
    const data = createMockData({ kris })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
  })

  it('should handle risks with no owner', () => {
    const data = createMockData({
      topRisks: [
        { refCode: 'TST-001', title: 'Unassigned risk', category: 'STRATEGIC', residualScore: 20, status: 'OPEN', owner: null },
      ],
    })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
  })

  it('should handle many recommendations', () => {
    const recommendations = Array.from({ length: 10 }, (_, i) => ({
      type: 'test',
      message: `Recommendation number ${i + 1} with some detail`,
      severity: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
    }))
    const data = createMockData({ recommendations })
    const doc = generateBoardReport(data)
    expect(doc).toBeDefined()
  })

  it('should output valid PDF binary', () => {
    const data = createMockData()
    const doc = generateBoardReport(data)
    const output = doc.output('arraybuffer')
    expect(output).toBeInstanceOf(ArrayBuffer)
    expect(output.byteLength).toBeGreaterThan(0)
  })
})
