/**
 * Static regulatory framework data for King V and ISO 31000:2018
 * Frameworks are seed data — only risk-to-requirement mappings are persisted in DB.
 */

// ============================================
// TYPES
// ============================================

export const COMPLIANCE_STATUSES = [
  'COMPLIANT',
  'PARTIALLY_COMPLIANT',
  'NON_COMPLIANT',
  'NOT_ASSESSED',
  'NOT_APPLICABLE',
] as const
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number]

export const FRAMEWORK_IDS = ['KING_V', 'ISO_31000'] as const
export type FrameworkId = (typeof FRAMEWORK_IDS)[number]

export interface RegulatoryRequirement {
  code: string
  frameworkId: FrameworkId
  principle: string
  title: string
  riskCategories: string[]
}

export interface RegulatoryFramework {
  id: FrameworkId
  name: string
  description: string
  version: string
  requirements: RegulatoryRequirement[]
}

// ============================================
// KING V FRAMEWORK (13 Principles)
// ============================================

const KING_V_REQUIREMENTS: RegulatoryRequirement[] = [
  // Principle 1: Leadership
  { code: 'KING_V_P1_1', frameworkId: 'KING_V', principle: 'Principle 1: Leadership', title: 'The governing body leads ethically and effectively', riskCategories: ['STRATEGIC', 'REPUTATIONAL', 'COMPLIANCE'] },
  { code: 'KING_V_P1_2', frameworkId: 'KING_V', principle: 'Principle 1: Leadership', title: 'Ethical leadership demonstrated through integrity, competence, responsibility, and fairness', riskCategories: ['STRATEGIC', 'REPUTATIONAL', 'PEOPLE'] },
  { code: 'KING_V_P1_3', frameworkId: 'KING_V', principle: 'Principle 1: Leadership', title: 'Governing body sets the tone for ethical culture in the organisation', riskCategories: ['REPUTATIONAL', 'PEOPLE', 'COMPLIANCE'] },

  // Principle 2: Ethics & Culture
  { code: 'KING_V_P2_1', frameworkId: 'KING_V', principle: 'Principle 2: Ethics & Culture', title: 'Code of ethics established and enforced', riskCategories: ['COMPLIANCE', 'REPUTATIONAL', 'PEOPLE'] },
  { code: 'KING_V_P2_2', frameworkId: 'KING_V', principle: 'Principle 2: Ethics & Culture', title: 'Responsible corporate citizenship practices in place', riskCategories: ['REPUTATIONAL', 'ENVIRONMENTAL', 'COMPLIANCE'] },
  { code: 'KING_V_P2_3', frameworkId: 'KING_V', principle: 'Principle 2: Ethics & Culture', title: 'Whistleblower mechanism operational and independent', riskCategories: ['COMPLIANCE', 'PEOPLE', 'REPUTATIONAL'] },

  // Principle 3: Strategy & Value
  { code: 'KING_V_P3_1', frameworkId: 'KING_V', principle: 'Principle 3: Strategy & Value', title: 'Purpose, strategy, and business model aligned for sustainable value creation', riskCategories: ['STRATEGIC', 'FINANCIAL'] },
  { code: 'KING_V_P3_2', frameworkId: 'KING_V', principle: 'Principle 3: Strategy & Value', title: 'Short, medium, and long-term strategy considers social, environmental, and economic context', riskCategories: ['STRATEGIC', 'ENVIRONMENTAL', 'FINANCIAL'] },
  { code: 'KING_V_P3_3', frameworkId: 'KING_V', principle: 'Principle 3: Strategy & Value', title: 'Business model resilience assessed and documented', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'FINANCIAL'] },

  // Principle 4: Reporting
  { code: 'KING_V_P4_1', frameworkId: 'KING_V', principle: 'Principle 4: Reporting', title: 'Accurate, fair, and transparent financial and non-financial reporting', riskCategories: ['FINANCIAL', 'COMPLIANCE', 'REPUTATIONAL'] },
  { code: 'KING_V_P4_2', frameworkId: 'KING_V', principle: 'Principle 4: Reporting', title: 'Apply and Explain disclosure framework adopted', riskCategories: ['COMPLIANCE', 'FINANCIAL'] },

  // Principle 5: Governing Body Composition
  { code: 'KING_V_P5_1', frameworkId: 'KING_V', principle: 'Principle 5: Governing Body Composition', title: 'Appropriate composition, diversity, and competence of governing body', riskCategories: ['STRATEGIC', 'COMPLIANCE', 'PEOPLE'] },
  { code: 'KING_V_P5_2', frameworkId: 'KING_V', principle: 'Principle 5: Governing Body Composition', title: 'Majority of governing body members are non-executive', riskCategories: ['COMPLIANCE', 'STRATEGIC'] },
  { code: 'KING_V_P5_3', frameworkId: 'KING_V', principle: 'Principle 5: Governing Body Composition', title: 'Independent chairperson appointed', riskCategories: ['COMPLIANCE', 'STRATEGIC'] },

  // Principle 6: Governing Body Committees
  { code: 'KING_V_P6_1', frameworkId: 'KING_V', principle: 'Principle 6: Governing Body Committees', title: 'Effective committees established to support governing body functions', riskCategories: ['STRATEGIC', 'COMPLIANCE', 'OPERATIONAL'] },
  { code: 'KING_V_P6_2', frameworkId: 'KING_V', principle: 'Principle 6: Governing Body Committees', title: 'Audit committee, risk committee, and remuneration committee in place', riskCategories: ['FINANCIAL', 'COMPLIANCE', 'STRATEGIC'] },

  // Principle 7: Management Delegation
  { code: 'KING_V_P7_1', frameworkId: 'KING_V', principle: 'Principle 7: Management Delegation', title: 'Appropriate appointment and delegation to management', riskCategories: ['OPERATIONAL', 'PEOPLE', 'STRATEGIC'] },
  { code: 'KING_V_P7_2', frameworkId: 'KING_V', principle: 'Principle 7: Management Delegation', title: 'Clear delegation of authority framework with accountability', riskCategories: ['OPERATIONAL', 'COMPLIANCE'] },

  // Principle 8: Risk Management
  { code: 'KING_V_P8_1', frameworkId: 'KING_V', principle: 'Principle 8: Risk Management', title: 'Risk management embedded in day-to-day operations and decision-making', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE', 'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE'] },
  { code: 'KING_V_P8_2', frameworkId: 'KING_V', principle: 'Principle 8: Risk Management', title: 'Risk register established and regularly reviewed', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'COMPLIANCE'] },
  { code: 'KING_V_P8_3', frameworkId: 'KING_V', principle: 'Principle 8: Risk Management', title: 'Risk appetite defined and communicated organisation-wide', riskCategories: ['STRATEGIC', 'FINANCIAL', 'COMPLIANCE'] },
  { code: 'KING_V_P8_4', frameworkId: 'KING_V', principle: 'Principle 8: Risk Management', title: 'Board risk committee with majority non-executive members', riskCategories: ['COMPLIANCE', 'STRATEGIC'] },

  // Principle 9: Compliance & Control
  { code: 'KING_V_P9_1', frameworkId: 'KING_V', principle: 'Principle 9: Compliance & Control', title: 'Compliance framework established and board-approved', riskCategories: ['COMPLIANCE', 'OPERATIONAL'] },
  { code: 'KING_V_P9_2', frameworkId: 'KING_V', principle: 'Principle 9: Compliance & Control', title: 'Regulatory universe mapped (all applicable legislation identified)', riskCategories: ['COMPLIANCE'] },
  { code: 'KING_V_P9_3', frameworkId: 'KING_V', principle: 'Principle 9: Compliance & Control', title: 'Non-compliance reporting and remediation process established', riskCategories: ['COMPLIANCE', 'OPERATIONAL', 'REPUTATIONAL'] },

  // Principle 10: Data, Information & Technology
  { code: 'KING_V_P10_1', frameworkId: 'KING_V', principle: 'Principle 10: Data, Information & Technology', title: 'Data and technology governance aligned with organisational objectives', riskCategories: ['TECHNOLOGY', 'STRATEGIC', 'COMPLIANCE'] },
  { code: 'KING_V_P10_2', frameworkId: 'KING_V', principle: 'Principle 10: Data, Information & Technology', title: 'Cyber risk management programme in place', riskCategories: ['TECHNOLOGY', 'OPERATIONAL'] },
  { code: 'KING_V_P10_3', frameworkId: 'KING_V', principle: 'Principle 10: Data, Information & Technology', title: 'Personal data protection aligned with POPIA', riskCategories: ['TECHNOLOGY', 'COMPLIANCE', 'REPUTATIONAL'] },

  // Principle 11: Remuneration
  { code: 'KING_V_P11_1', frameworkId: 'KING_V', principle: 'Principle 11: Remuneration', title: 'Fair, responsible, and transparent remuneration practices', riskCategories: ['PEOPLE', 'FINANCIAL', 'REPUTATIONAL'] },
  { code: 'KING_V_P11_2', frameworkId: 'KING_V', principle: 'Principle 11: Remuneration', title: 'Remuneration policy linked to strategy and value creation', riskCategories: ['PEOPLE', 'STRATEGIC', 'FINANCIAL'] },

  // Principle 12: Assurance & Internal Control
  { code: 'KING_V_P12_1', frameworkId: 'KING_V', principle: 'Principle 12: Assurance & Internal Control', title: 'Effective assurance and internal control for accurate reporting', riskCategories: ['FINANCIAL', 'COMPLIANCE', 'OPERATIONAL'] },
  { code: 'KING_V_P12_2', frameworkId: 'KING_V', principle: 'Principle 12: Assurance & Internal Control', title: 'Internal audit function operates independently from management', riskCategories: ['FINANCIAL', 'COMPLIANCE'] },
  { code: 'KING_V_P12_3', frameworkId: 'KING_V', principle: 'Principle 12: Assurance & Internal Control', title: 'Periodic third-party assurance on risk management effectiveness', riskCategories: ['COMPLIANCE', 'OPERATIONAL'] },

  // Principle 13: Stakeholder Engagement
  { code: 'KING_V_P13_1', frameworkId: 'KING_V', principle: 'Principle 13: Stakeholder Engagement', title: 'Stakeholder-inclusive approach for long-term interests', riskCategories: ['REPUTATIONAL', 'STRATEGIC', 'ENVIRONMENTAL'] },
  { code: 'KING_V_P13_2', frameworkId: 'KING_V', principle: 'Principle 13: Stakeholder Engagement', title: 'Material stakeholder concerns identified, prioritised, and addressed', riskCategories: ['REPUTATIONAL', 'STRATEGIC', 'PEOPLE'] },
]

// ============================================
// ISO 31000:2018 FRAMEWORK
// ============================================

const ISO_31000_REQUIREMENTS: RegulatoryRequirement[] = [
  // 8 Principles (Clause 4)
  { code: 'ISO_31000_PR1', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Integrated: Risk management integral to all organisational activities', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE', 'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE'] },
  { code: 'ISO_31000_PR2', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Customised: Framework tailored to external and internal context', riskCategories: ['STRATEGIC', 'OPERATIONAL'] },
  { code: 'ISO_31000_PR3', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Inclusive: Appropriate engagement of stakeholders throughout', riskCategories: ['REPUTATIONAL', 'PEOPLE', 'STRATEGIC'] },
  { code: 'ISO_31000_PR4', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Dynamic: Anticipates, detects, acknowledges, and responds to change', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'TECHNOLOGY'] },
  { code: 'ISO_31000_PR5', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Structured and comprehensive: Systematic approach with comprehensive risk strategy', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'COMPLIANCE'] },
  { code: 'ISO_31000_PR6', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Best available information: Decisions based on historical/current data', riskCategories: ['FINANCIAL', 'STRATEGIC', 'TECHNOLOGY'] },
  { code: 'ISO_31000_PR7', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Human and cultural factors: Considers behaviour and organisational culture', riskCategories: ['PEOPLE', 'OPERATIONAL', 'REPUTATIONAL'] },
  { code: 'ISO_31000_PR8', frameworkId: 'ISO_31000', principle: 'Principles', title: 'Continual improvement: Regular review and enhancement of practices', riskCategories: ['OPERATIONAL', 'STRATEGIC', 'COMPLIANCE'] },

  // Process Steps (Clause 6)
  { code: 'ISO_31000_PS1', frameworkId: 'ISO_31000', principle: 'Process', title: 'Communication and consultation with stakeholders at all levels', riskCategories: ['REPUTATIONAL', 'PEOPLE', 'STRATEGIC'] },
  { code: 'ISO_31000_PS2', frameworkId: 'ISO_31000', principle: 'Process', title: 'Scope, context, and criteria established for risk management', riskCategories: ['STRATEGIC', 'COMPLIANCE', 'OPERATIONAL'] },
  { code: 'ISO_31000_PS3', frameworkId: 'ISO_31000', principle: 'Process', title: 'Risk identification: Recognising what could happen and why', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE', 'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE'] },
  { code: 'ISO_31000_PS4', frameworkId: 'ISO_31000', principle: 'Process', title: 'Risk analysis: Determining likelihood, impact, and velocity', riskCategories: ['STRATEGIC', 'OPERATIONAL', 'FINANCIAL'] },
  { code: 'ISO_31000_PS5', frameworkId: 'ISO_31000', principle: 'Process', title: 'Risk evaluation: Comparing against risk appetite to determine action', riskCategories: ['STRATEGIC', 'FINANCIAL', 'COMPLIANCE'] },
  { code: 'ISO_31000_PS6', frameworkId: 'ISO_31000', principle: 'Process', title: 'Risk treatment: Modifying risk through mitigation strategies', riskCategories: ['OPERATIONAL', 'FINANCIAL', 'TECHNOLOGY'] },
  { code: 'ISO_31000_PS7', frameworkId: 'ISO_31000', principle: 'Process', title: 'Monitoring and review: Ongoing assessment of process effectiveness', riskCategories: ['OPERATIONAL', 'COMPLIANCE', 'STRATEGIC'] },
  { code: 'ISO_31000_PS8', frameworkId: 'ISO_31000', principle: 'Process', title: 'Recording and reporting: Documentation and communication of results', riskCategories: ['COMPLIANCE', 'FINANCIAL', 'OPERATIONAL'] },
]

// ============================================
// FRAMEWORKS
// ============================================

const FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: 'KING_V',
    name: 'King V Code',
    description: 'King V Report on Corporate Governance for South Africa (2025)',
    version: '2025',
    requirements: KING_V_REQUIREMENTS,
  },
  {
    id: 'ISO_31000',
    name: 'ISO 31000:2018',
    description: 'Risk Management Guidelines',
    version: '2018',
    requirements: ISO_31000_REQUIREMENTS,
  },
]

// Build lookup maps for fast access
const frameworkMap = new Map(FRAMEWORKS.map((f) => [f.id, f]))
const requirementMap = new Map<string, RegulatoryRequirement>()
for (const fw of FRAMEWORKS) {
  for (const req of fw.requirements) {
    requirementMap.set(req.code, req)
  }
}

// ============================================
// ACCESSOR FUNCTIONS
// ============================================

export function getAllFrameworks(): RegulatoryFramework[] {
  return FRAMEWORKS
}

export function getFramework(id: string): RegulatoryFramework | null {
  return frameworkMap.get(id as FrameworkId) ?? null
}

export function getRequirement(code: string): RegulatoryRequirement | null {
  return requirementMap.get(code) ?? null
}

export function getRequirementsByFramework(id: FrameworkId): RegulatoryRequirement[] {
  return frameworkMap.get(id)?.requirements ?? []
}

export function getRequirementsForCategory(category: string): RegulatoryRequirement[] {
  const results: RegulatoryRequirement[] = []
  for (const req of Array.from(requirementMap.values())) {
    if (req.riskCategories.includes(category)) {
      results.push(req)
    }
  }
  return results
}

export function getAllRequirementCodes(): string[] {
  return Array.from(requirementMap.keys())
}

export function isValidRequirementCode(code: string): boolean {
  return requirementMap.has(code)
}
