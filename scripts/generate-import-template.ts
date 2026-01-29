/**
 * Script to generate the risk import Excel template
 * Run with: npx tsx scripts/generate-import-template.ts
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

// README sheet content
const readmeData = [
  ['Risk Import Template - Instructions'],
  [''],
  ['This template helps you import risks into Vytl Risk Management.'],
  [''],
  ['COLUMN DESCRIPTIONS:'],
  [''],
  ['Column', 'Required', 'Description', 'Valid Values'],
  ['Risk Title', 'Yes', 'A concise name for the risk (max 200 chars)', 'Free text'],
  ['Description', 'Yes', 'Detailed description of the risk and its potential impact', 'Free text'],
  ['Category', 'Yes', 'Risk category for classification', 'Strategic, Operational, Financial, Compliance, Technology, Reputational, Environmental, People'],
  ['Inherent Likelihood', 'Yes', 'Likelihood before controls (1=Rare, 5=Almost Certain)', '1, 2, 3, 4, 5'],
  ['Inherent Impact', 'Yes', 'Impact before controls (1=Insignificant, 5=Catastrophic)', '1, 2, 3, 4, 5'],
  ['Residual Likelihood', 'Yes', 'Likelihood after controls applied', '1, 2, 3, 4, 5'],
  ['Residual Impact', 'Yes', 'Impact after controls applied', '1, 2, 3, 4, 5'],
  ['Risk Owner', 'No', 'Person responsible for managing the risk', 'Free text'],
  ['Controls', 'No', 'Existing controls or mitigations in place', 'Free text'],
  ['Status', 'No', 'Current status of the risk', 'Open, In Progress, Monitoring, Closed'],
  [''],
  ['SCORING GUIDE:'],
  [''],
  ['Likelihood Scale:', '', '', ''],
  ['1 - Rare', '', 'May occur only in exceptional circumstances', ''],
  ['2 - Unlikely', '', 'Could occur but not expected', ''],
  ['3 - Possible', '', 'Might occur at some time', ''],
  ['4 - Likely', '', 'Will probably occur in most circumstances', ''],
  ['5 - Almost Certain', '', 'Expected to occur in most circumstances', ''],
  [''],
  ['Impact Scale:', '', '', ''],
  ['1 - Insignificant', '', 'Minimal impact, easily absorbed', ''],
  ['2 - Minor', '', 'Some impact but manageable', ''],
  ['3 - Moderate', '', 'Significant impact requiring management attention', ''],
  ['4 - Major', '', 'Serious impact affecting objectives', ''],
  ['5 - Catastrophic', '', 'Critical impact threatening organisation viability', ''],
  [''],
  ['TIPS:'],
  ['- Residual scores should typically be lower than or equal to inherent scores'],
  ['- Use consistent category names from the list provided'],
  ['- Delete these instruction rows before importing (or use the Risks sheet only)'],
]

// Risk data sheet
const riskHeaders = [
  'Risk Title',
  'Risk Description',
  'Risk Category',
  'Inherent Likelihood',
  'Inherent Impact',
  'Residual Likelihood',
  'Residual Impact',
  'Risk Owner',
  'Controls',
  'Risk Status',
]

const riskData = [
  [
    'Market share erosion due to competitor pricing',
    'Competitors may undercut our pricing strategy, leading to loss of market share and reduced revenue. This could impact our ability to invest in product development and maintain competitive advantage.',
    'Strategic',
    4, 4, 3, 3,
    'Chief Strategy Officer',
    'Quarterly competitor analysis, flexible pricing policy, customer loyalty programme',
    'Monitoring',
  ],
  [
    'Key supplier dependency',
    'Over-reliance on a single supplier for critical components creates vulnerability to supply chain disruptions, price increases, or quality issues.',
    'Operational',
    3, 4, 2, 3,
    'Procurement Manager',
    'Secondary supplier agreements, 3-month inventory buffer, supplier performance monitoring',
    'In Progress',
  ],
  [
    'Cash flow volatility',
    'Seasonal revenue patterns and large project-based income create periods of cash flow stress, potentially impacting ability to meet operational expenses.',
    'Financial',
    4, 3, 2, 2,
    'Chief Financial Officer',
    'Rolling cash flow forecasts, credit facility arrangement, invoice factoring option',
    'Open',
  ],
  [
    'POPIA non-compliance',
    'Failure to comply with Protection of Personal Information Act requirements could result in regulatory penalties, reputational damage, and loss of customer trust.',
    'Compliance',
    3, 5, 2, 4,
    'Data Protection Officer',
    'POPIA compliance programme, staff training, data audit procedures, consent management system',
    'Monitoring',
  ],
  [
    'Cyber attack on customer data',
    'Malicious actors could breach our systems and access sensitive customer information, leading to data theft, regulatory fines, and severe reputational damage.',
    'Technology',
    4, 5, 2, 4,
    'IT Security Manager',
    'Firewall and intrusion detection, MFA enforcement, regular penetration testing, security awareness training, incident response plan',
    'Monitoring',
  ],
  [
    'Negative social media exposure',
    'Customer complaints or incidents going viral on social media could rapidly damage brand reputation and customer trust.',
    'Reputational',
    3, 4, 2, 3,
    'Marketing Director',
    'Social media monitoring tools, crisis communication plan, customer service escalation procedures',
    'Open',
  ],
  [
    'Carbon emission regulatory changes',
    'New environmental regulations may require significant capital investment in cleaner technologies or result in carbon taxes impacting profitability.',
    'Environmental',
    3, 3, 2, 2,
    'Operations Director',
    'Sustainability roadmap, energy efficiency programme, regulatory monitoring, carbon offset partnerships',
    'In Progress',
  ],
  [
    'Key person dependency',
    'Critical knowledge and relationships concentrated in a few key individuals creates risk if they leave or become unavailable.',
    'People',
    4, 4, 3, 3,
    'HR Director',
    'Succession planning, knowledge documentation, cross-training programme, retention incentives',
    'Open',
  ],
  [
    'Fraud by employees or third parties',
    'Internal or external fraud could result in financial losses, regulatory scrutiny, and reputational harm.',
    'Financial',
    3, 4, 2, 3,
    'Internal Audit Manager',
    'Segregation of duties, approval workflows, regular audits, whistleblower hotline, fraud awareness training',
    'Monitoring',
  ],
  [
    'System downtime during peak periods',
    'Critical systems failing during high-demand periods could result in lost sales, customer dissatisfaction, and competitive disadvantage.',
    'Technology',
    3, 4, 2, 2,
    'IT Operations Manager',
    'Redundant infrastructure, disaster recovery plan, load testing, 24/7 monitoring, SLA with hosting provider',
    'Monitoring',
  ],
]

// Create workbook
const workbook = XLSX.utils.book_new()

// Add README sheet
const readmeSheet = XLSX.utils.aoa_to_sheet(readmeData)
// Set column widths for README
readmeSheet['!cols'] = [
  { wch: 25 },  // Column A
  { wch: 12 },  // Column B
  { wch: 60 },  // Column C
  { wch: 40 },  // Column D
]
XLSX.utils.book_append_sheet(workbook, readmeSheet, 'Instructions')

// Add Risks sheet
const risksSheet = XLSX.utils.aoa_to_sheet([riskHeaders, ...riskData])
// Set column widths for Risks
risksSheet['!cols'] = [
  { wch: 45 },  // Risk Title
  { wch: 80 },  // Description
  { wch: 15 },  // Category
  { wch: 20 },  // Inherent Likelihood
  { wch: 15 },  // Inherent Impact
  { wch: 20 },  // Residual Likelihood
  { wch: 15 },  // Residual Impact
  { wch: 25 },  // Risk Owner
  { wch: 60 },  // Controls
  { wch: 15 },  // Status
]
XLSX.utils.book_append_sheet(workbook, risksSheet, 'Risks')

// Write file
const outputPath = path.join(__dirname, '..', 'public', 'templates', 'risk-import-template.xlsx')
XLSX.writeFile(workbook, outputPath)

console.log(`✅ Template created: ${outputPath}`)
console.log(`   - Instructions sheet with column descriptions`)
console.log(`   - Risks sheet with ${riskData.length} sample risks`)
