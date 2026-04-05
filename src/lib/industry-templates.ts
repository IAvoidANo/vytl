/**
 * Industry Templates — Sprint A Day 1-2
 *
 * Pre-built risk libraries for SA industry verticals. Each template contains
 * 15 pre-scored, SA-contextual risks covering common regulatory (POPIA, FICA,
 * B-BBEE, OHS Act, NCA) and operational exposures.
 *
 * Usage:
 *   const t = getTemplateByCode('MANUFACTURING')
 *   const scored = calculateTemplateRiskScores(t.risks)
 */

import { RISK_CATEGORIES, type RiskCategory } from './appetite-validation'

// ============================================
// TYPES
// ============================================

export type IndustryCode =
  | 'MANUFACTURING'
  | 'FINANCIAL_SERVICES'
  | 'RETAIL'
  | 'MINING_RESOURCES'
  | 'HEALTHCARE'
  | 'PROFESSIONAL_SERVICES'

export interface TemplateRisk {
  title: string
  description: string
  category: RiskCategory
  inherentLikelihood: number   // 1-5
  inherentImpact: number       // 1-5
  residualLikelihood: number   // 1-5, ≤ inherentLikelihood in most cases
  residualImpact: number       // 1-5
  controls: string
  rootCause: string
  isOngoing: boolean
}

export interface IndustryTemplate {
  code: IndustryCode
  name: string
  description: string
  benchmarkScore: number       // Typical org-level VytlRx Score for this industry
  risks: TemplateRisk[]
}

// ============================================
// MANUFACTURING TEMPLATE  (benchmarkScore 58)
// ============================================

const MANUFACTURING_RISKS: TemplateRisk[] = [
  {
    title: 'Load Shedding — Production Line Downtime',
    description:
      'Eskom load-shedding schedules interrupt production lines, damage sensitive equipment and reduce output. Stage 4–6 shedding can halt continuous-process manufacturing entirely.',
    category: 'OPERATIONAL',
    inherentLikelihood: 5,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 4,
    controls:
      'Generator backup capacity for critical lines; UPS for PLC/SCADA systems; load-shedding schedule integrated into production planning; battery energy storage system (BESS) feasibility study in progress.',
    rootCause: 'Structural Eskom generation deficit and ageing coal fleet; no short-term national resolution expected.',
    isOngoing: true,
  },
  {
    title: 'OHS Act Non-Compliance and Workplace Injury',
    description:
      'Failure to comply with the Occupational Health and Safety Act 85 of 1993 exposes the organisation to DoL enforcement action, shutdown orders, and civil liability following workplace injuries.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Annual OHS compliance audit by accredited consultant; mandatory SHE representative training; near-miss reporting system; PPE issuance register; DoL inspection readiness checklist.',
    rootCause: 'Complex machinery environment, high staff turnover reducing institutional safety knowledge.',
    isOngoing: true,
  },
  {
    title: 'B-BBEE Scorecard Deterioration',
    description:
      'Declining B-BBEE level impacts eligibility for government procurement contracts and preferred-supplier status with major retailers. Loss of Level 2 to Level 4 could reduce revenue by up to 30%.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Quarterly B-BBEE scorecard tracking by transformation manager; ESD spend allocation to qualifying suppliers; skills development budget ≥1% of payroll; board-level transformation committee.',
    rootCause: 'Ownership dilution following BEE transaction unwind; insufficient management control representivity.',
    isOngoing: true,
  },
  {
    title: 'POPIA Compliance — Employee and Customer Data',
    description:
      'Processing of employee biometric data (access control) and customer order data without adequate POPIA safeguards exposes the organisation to Information Regulator enforcement and reputational harm.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      'POPIA compliance officer appointed; data processing agreements with all third-party processors; biometric data operator consent forms; annual data impact assessment; breach notification procedure.',
    rootCause: 'Legacy ERP and HR systems not designed for POPIA; data-minimisation principles not embedded.',
    isOngoing: false,
  },
  {
    title: 'Supply Chain Disruption — Port Congestion and Transnet Delays',
    description:
      'Transnet port and rail inefficiencies, including Durban harbour congestion and rail network vandalism, delay imported raw material shipments, creating production stoppages and inventory shortfalls.',
    category: 'OPERATIONAL',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      'Strategic buffer stock (6-week minimum for critical inputs); alternative port routing via Ngqura; dual-source supplier policy for top-10 materials; weekly supply chain risk dashboard.',
    rootCause: 'Systemic Transnet infrastructure under-investment, cable theft, and logistics operator capacity constraints.',
    isOngoing: true,
  },
  {
    title: 'Critical Skills Shortage and Labour Turnover',
    description:
      'Emigration and cross-industry competition drive shortage of artisans, millwrights and process engineers. High turnover in production supervisors degrades quality consistency and OHS compliance.',
    category: 'PEOPLE',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      'Learnership and apprenticeship programmes funded via MERSETA; above-market retention packages for critical roles; succession planning for top 20 posts; internal talent pipeline reviewed quarterly.',
    rootCause: 'National artisan shortage; South African emigration wave; competition from mining and energy sectors.',
    isOngoing: true,
  },
  {
    title: 'ZAR Volatility on Imported Raw Materials',
    description:
      'Rand depreciation increases landed cost of USD- and EUR-denominated raw materials, compressing margins when local selling prices cannot be passed through to customers on fixed contracts.',
    category: 'FINANCIAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Forward exchange contracts covering 60% of next-quarter import exposure; natural hedge via USD export revenue; quarterly FX exposure reviewed by CFO; price-escalation clauses in long-term supply agreements.',
    rootCause: 'EM currency volatility; SA fiscal deficit; global risk-off sentiment impacting ZAR disproportionately.',
    isOngoing: true,
  },
  {
    title: 'Trade Union Action and Protected Strikes',
    description:
      'Annual wage negotiations with recognised unions carry risk of protected strikes during peak production periods, resulting in lost output, customer penalty clauses, and reputational harm.',
    category: 'PEOPLE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'CCMA-trained HR team; multi-year wage agreements where possible; monthly engagement sessions with shop stewards; contingency production plan for 4-week strike scenario; legal retainer for labour matters.',
    rootCause: 'Cost-of-living pressure on workers; adversarial labour relations history; NUMSA centralised bargaining dynamics.',
    isOngoing: true,
  },
  {
    title: 'Critical Plant Equipment Failure',
    description:
      'Unplanned breakdown of primary production machinery (presses, furnaces, conveyors) causes output loss, customer order delays, and high emergency maintenance costs.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Preventative maintenance schedule per OEM specifications; condition-based monitoring (vibration, thermography); critical spare-parts inventory maintained on site; OEM breakdown response SLA ≤48 hrs.',
    rootCause: 'Ageing equipment beyond economic life; deferred capex due to cash flow constraints.',
    isOngoing: false,
  },
  {
    title: 'Environmental Regulation — Waste and Emissions Compliance',
    description:
      'NEMA and Air Quality Act obligations require permitted emissions and waste disposal. Regulatory non-compliance or community complaints can result in operational shutdown notices.',
    category: 'ENVIRONMENTAL',
    inherentLikelihood: 2,
    inherentImpact: 4,
    residualLikelihood: 1,
    residualImpact: 3,
    controls:
      'Annual environmental legal compliance audit; stack emissions testing bi-annually; ISO 14001 certification maintained; environmental officer appointed; community liaison forum quarterly.',
    rootCause: 'Tightening DFFE regulations; legacy pollution from older facility sections not yet remediated.',
    isOngoing: true,
  },
  {
    title: 'Water Scarcity and Municipal Service Disruption',
    description:
      'Water-intensive manufacturing processes are vulnerable to municipal water-supply interruptions and drought-related restrictions, which can force partial or full production stoppages.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      'On-site water storage tanks (72-hour buffer); borehole as supplementary source; water recycling system reducing draw by 40%; municipal relations maintained; drought contingency plan in place.',
    rootCause: 'National water infrastructure deterioration; climate-change-driven rainfall variability in key catchments.',
    isOngoing: true,
  },
  {
    title: 'Raw Material Price Volatility',
    description:
      'Commodity price spikes (steel, copper, plastics) driven by global supply shocks, Chinese demand, or sanctions compress margins and can render fixed-price customer contracts loss-making.',
    category: 'FINANCIAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Price-escalation clauses in customer contracts; 3-month commodity forward purchases for steel and copper; alternative material specifications approved for key products; monthly cost review with purchasing team.',
    rootCause: 'Global commodity cycle volatility; SA import dependency for specialty inputs; Rand weakness amplifying USD-priced materials.',
    isOngoing: true,
  },
  {
    title: 'Product Liability and Quality Non-Conformance',
    description:
      'Manufacturing defects reaching customers trigger product recall costs, warranty claims, SABS certification suspension, and potential third-party liability under the Consumer Protection Act.',
    category: 'OPERATIONAL',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 1,
    residualImpact: 4,
    controls:
      'ISO 9001 QMS with documented inspection checkpoints; statistical process control (SPC) on critical dimensions; SABS type-approval maintained; product liability insurance R50m; recall procedure tested annually.',
    rootCause: 'Process variability in high-speed production; inadequate operator training on defect recognition.',
    isOngoing: false,
  },
  {
    title: 'Cybersecurity Threat to OT/SCADA Systems',
    description:
      'Industrial control systems (ICS/SCADA/PLC) increasingly connected to corporate IT networks are vulnerable to ransomware and targeted attacks that can halt production or cause safety incidents.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      'IT/OT network segmentation (DMZ architecture); no remote internet access to SCADA without VPN+MFA; patching schedule for OT systems; annual ICS penetration test; OT security awareness for engineering staff.',
    rootCause: 'Legacy OT systems designed for air-gapped operation now connected to business networks for efficiency; limited OT security expertise in SA market.',
    isOngoing: true,
  },
  {
    title: 'Export Market Access and Trade Restriction Risk',
    description:
      'Changes to AGOA eligibility, EU sustainability import requirements, and bilateral trade policy can restrict access to export markets, reducing revenue and creating inventory surpluses.',
    category: 'STRATEGIC',
    inherentLikelihood: 2,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Export market diversification across 5+ regions; trade lawyer engaged for AGOA renewal monitoring; EU Carbon Border Adjustment Mechanism compliance project initiated; SEDA export development support leveraged.',
    rootCause: 'SA geopolitical positioning; global trade protectionism trend; EU ESG import standards raising compliance bar.',
    isOngoing: true,
  },
]

export const MANUFACTURING_TEMPLATE: IndustryTemplate = {
  code: 'MANUFACTURING',
  name: 'Manufacturing',
  description:
    'Risk template for South African manufacturers covering load shedding, OHS Act, B-BBEE, supply chain, labour, environmental, and export market risks.',
  benchmarkScore: 58,
  risks: MANUFACTURING_RISKS,
}

// ============================================
// FINANCIAL SERVICES TEMPLATE  (benchmarkScore 62)
// ============================================

const FINANCIAL_SERVICES_RISKS: TemplateRisk[] = [
  {
    title: 'FICA Non-Compliance — AML/CFT Programme Deficiencies',
    description:
      'Failure to maintain an effective FICA-compliant Anti-Money Laundering and Combating the Financing of Terrorism programme exposes the institution to SARB/FIC administrative sanctions, deregistration risk, and criminal liability for responsible persons.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      'Dedicated FICA compliance officer; automated transaction monitoring system with SARB-aligned thresholds; annual independent AML audit; suspicious transaction report (STR) workflow reviewed monthly; staff training and certification programme.',
    rootCause: 'Rapid onboarding volumes straining manual KYC processes; evolving FIC guidance on beneficial ownership disclosure.',
    isOngoing: true,
  },
  {
    title: 'POPIA Data Breach — Customer Financial Data',
    description:
      'Unauthorised disclosure of customer account details, credit records, or transaction data triggers Information Regulator investigation, mandatory breach notification, potential R10m administrative penalty, and class-action exposure.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      'ISO 27001 certified information security management; data encryption at rest and in transit; data loss prevention (DLP) tools on endpoints; POPIA breach response playbook; 72-hour regulator notification procedure tested annually.',
    rootCause: 'Large volumes of sensitive personal information attracting sophisticated threat actors; legacy systems with limited access controls.',
    isOngoing: true,
  },
  {
    title: 'FSCA Regulatory Enforcement Action',
    description:
      'FSCA inspection findings of market conduct failures (FAIS, TCF, Conduct Standard obligations) can result in licence suspension, administrative penalties, and remediation requirements that disrupt business operations.',
    category: 'COMPLIANCE',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 1,
    residualImpact: 4,
    controls:
      'Dedicated market conduct compliance function; quarterly Treating Customers Fairly (TCF) outcomes monitoring; FAIS representative register maintained; pre-inspection mock audit annually; regulatory change management process.',
    rootCause: 'Evolving FSCA conduct standards; pressure to grow sales potentially compromising advice quality.',
    isOngoing: true,
  },
  {
    title: 'Credit Risk — Non-Performing Loan Deterioration',
    description:
      'Economic downturn, rising unemployment, and cost-of-living pressure drive NPL ratio increases, requiring higher impairment provisioning under IFRS 9 ECL models, reducing profitability and capital adequacy.',
    category: 'FINANCIAL',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      'Monthly ECL model recalibration; early warning system (EWS) flags accounts at Stage 2 migration; stress testing against 2% GDP contraction scenario; collections strategy reviewed quarterly; individual impairment sign-off at ExCo level.',
    rootCause: 'SA unemployment rate above 32%; household debt-to-income elevated; load-shedding-driven business failures cascading to consumer defaults.',
    isOngoing: true,
  },
  {
    title: 'Cyber Fraud — Banking Malware and Social Engineering',
    description:
      'Sophisticated banking Trojans, SIM-swap fraud, and CEO impersonation attacks cause direct financial loss, customer remediation costs, and SARB reporting obligations.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Real-time fraud scoring engine on all transactions; out-of-band transaction authentication; SIM-swap detection via CIPC integration; customer fraud awareness campaigns; dedicated cyber fraud response team (24/7).',
    rootCause: 'Organised criminal syndicates targeting SA financial institutions; social engineering exploiting lower digital literacy in mass-market segments.',
    isOngoing: true,
  },
  {
    title: 'NCA Compliance — Reckless Lending Exposure',
    description:
      'Granting credit without adequate affordability assessments or to over-indebted consumers constitutes reckless lending under the National Credit Act, exposing the institution to NCR enforcement, court-set-aside of agreements, and reputational damage.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Automated affordability assessment using credit bureau + payroll data; reckless lending training mandatory for all credit originators; NCR compliance audit bi-annually; complaints analysis for reckless lending patterns.',
    rootCause: 'Incentive structures rewarding volume over quality; inadequate affordability data for informal-sector applicants.',
    isOngoing: true,
  },
  {
    title: 'SARB Prudential Requirements — Capital Adequacy Breach',
    description:
      'Failure to maintain SARB Regulation 17 minimum capital ratios (CET1, Tier 1, Total Capital) triggers supervisory intervention, public disclosure obligations, and potential restrictions on dividend payments.',
    category: 'FINANCIAL',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 1,
    residualImpact: 4,
    controls:
      'Monthly internal capital adequacy assessment; ICAAP reviewed annually with Board approval; capital buffer maintained 200bps above regulatory minimum; SARB early warning metrics tracked daily by treasury.',
    rootCause: 'Unexpected credit loss events consuming regulatory capital; rapid balance sheet growth outpacing internal capital generation.',
    isOngoing: true,
  },
  {
    title: 'Exchange Control Violations',
    description:
      'Inadvertent or deliberate breaches of SARB Exchange Control Regulations in cross-border transactions expose the institution to administrative penalties, transaction unwinding, and reputational harm.',
    category: 'COMPLIANCE',
    inherentLikelihood: 2,
    inherentImpact: 4,
    residualLikelihood: 1,
    residualImpact: 3,
    controls:
      'Authorised Dealer compliance framework; exchange control training for treasury and trade finance staff; pre-deal review for complex cross-border structures; SARB excon reporting automated; annual excon independent audit.',
    rootCause: 'Complexity of cross-border structured products; staff unfamiliarity with updated SARB currency and exchanges manual.',
    isOngoing: false,
  },
  {
    title: 'Key Person Dependency — Senior Executive Concentration',
    description:
      'Concentration of institutional knowledge, client relationships, and regulatory relationships in a small number of senior executives creates operational and strategic risk in the event of unplanned departure.',
    category: 'PEOPLE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Succession plans documented for all EXCO and C-suite positions; key-man insurance for CEO and CFO; structured knowledge transfer programme; REMCO monitors retention of critical roles quarterly.',
    rootCause: 'Competitive executive talent market; SA emigration trend reducing available successor pool.',
    isOngoing: true,
  },
  {
    title: 'Interest Rate Risk — Net Interest Margin Compression',
    description:
      'SARB rate cycle (cuts or hikes) compresses NIM when asset repricing lags liability repricing, reducing profitability on fixed-rate loan books or variable-rate funding structures.',
    category: 'FINANCIAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Interest rate risk in banking book (IRRBB) framework approved by ALCO; duration gap managed within Board-approved limits; interest rate swap programme; NIM sensitivity analysis in quarterly ALCO pack.',
    rootCause: 'SARB rate decisions driven by inflation and global central bank moves rather than domestic credit cycle.',
    isOngoing: true,
  },
  {
    title: 'Reputational Risk — Negative Media and Social Exposure',
    description:
      'Adverse mainstream and social media coverage (service complaints, fraud incidents, executive misconduct) erodes customer trust, accelerates deposit outflows, and triggers increased regulatory scrutiny.',
    category: 'REPUTATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Social media monitoring (24/7 alerts); media crisis communication plan; executive conduct policy; National Consumer Commission complaint escalation protocol; customer satisfaction NPS tracked monthly.',
    rootCause: 'Amplified impact of social media; heightened public scrutiny of financial institutions following Steinhoff/VBS scandals.',
    isOngoing: true,
  },
  {
    title: 'Third-Party and Vendor Risk — Outsourced Critical Functions',
    description:
      'Reliance on third-party technology vendors, cloud providers, and outsourced operations centres introduces concentration risk, data sovereignty concerns, and potential for service disruption or security incidents at vendor.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Vendor risk assessment before onboarding (SOC 2 / ISAE 3402 review); contractual right-to-audit; annual vendor performance scorecard; exit strategy and business continuity plan for critical vendors; SARB Guidance Note 3/2021 compliance programme.',
    rootCause: 'Cost pressures driving outsourcing without proportionate risk management; limited vendor alternatives in SA market for niche systems.',
    isOngoing: true,
  },
  {
    title: 'Liquidity Risk — Funding Concentration and Withdrawal Pressure',
    description:
      'Concentration of funding in wholesale deposits or large corporate clients creates liquidity risk if depositors withdraw simultaneously, requiring emergency SARB standing facility usage.',
    category: 'FINANCIAL',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 1,
    residualImpact: 4,
    controls:
      'Liquidity Coverage Ratio (LCR) maintained above 110%; High-Quality Liquid Asset (HQLA) buffer; Net Stable Funding Ratio (NSFR) >100%; intraday liquidity monitoring; deposit concentration limits by single depositor (max 5% of liabilities).',
    rootCause: 'Limited retail deposit base; reliance on interbank funding; SA banking sector deposit competition reducing stability of wholesale funding.',
    isOngoing: true,
  },
  {
    title: 'Financial Crime — Bribery and Corruption Exposure',
    description:
      'Internal fraud, facilitation of bribery, or involvement in state-capture-linked transactions exposes the institution to Prevention and Combating of Corrupt Activities Act (PRECCA) prosecutions and reputational collapse.',
    category: 'COMPLIANCE',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 1,
    residualImpact: 4,
    controls:
      'Anti-bribery and corruption policy with zero-tolerance statement; employee whistleblower hotline (independent); annual fraud risk assessment; PRECCA training for staff handling public-sector transactions; enhanced due diligence on PEP-linked clients.',
    rootCause: 'Legacy of weak ethics culture in SA private and public sector; pressure on origination teams to win public-sector business at any cost.',
    isOngoing: true,
  },
  {
    title: 'Business Continuity — Load Shedding Impact on Operations',
    description:
      'Extended Stage 6 load shedding disrupts branch operations, ATM availability, and digital channel infrastructure, resulting in customer dissatisfaction, transaction failures, and potential SLA breaches with SARB.',
    category: 'OPERATIONAL',
    inherentLikelihood: 5,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Generator and UPS backup for all branches and data centres; load-shedding schedule integrated into operations planning; ATM cash and connectivity redundancy programme; SARB operational resilience reporting in place; BCP tested semi-annually.',
    rootCause: 'Chronic Eskom capacity constraints; no short-term resolution to national energy crisis.',
    isOngoing: true,
  },
]

export const FINANCIAL_SERVICES_TEMPLATE: IndustryTemplate = {
  code: 'FINANCIAL_SERVICES',
  name: 'Financial Services',
  description:
    'Risk template for South African financial institutions covering FICA, POPIA, FSCA, NCA, SARB prudential, credit, fraud, and liquidity risks.',
  benchmarkScore: 62,
  risks: FINANCIAL_SERVICES_RISKS,
}

// ============================================
// RETAIL TEMPLATE  (benchmarkScore 54)
// ============================================

const RETAIL_RISKS: TemplateRisk[] = [
  {
    title: 'E-Commerce Competition Threatening In-Store Revenue',
    description:
      'Rapid growth of online retail platforms (Takealot, Checkers Sixty60, Amazon SA) accelerates brick-and-mortar revenue decline, rendering existing store footprint uneconomical and requiring costly digital transformation investment.',
    category: 'STRATEGIC',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      'Omnichannel strategy with click-and-collect capability; loyalty programme driving in-store engagement; own-brand e-commerce platform investment; annual competitor analysis and store-rationalisation review.',
    rootCause: 'Structural consumer shift to online convenience; SA smartphone penetration above 50% enabling mobile commerce growth.',
    isOngoing: true,
  },
  {
    title: 'Shrinkage — Theft, Internal Fraud, and Administrative Losses',
    description:
      'Retail shrinkage (shoplifting, employee theft, supplier fraud, and administrative errors) exceeding 2% of revenue materially erodes trading margins and contributes to pricing uncompetitiveness.',
    category: 'OPERATIONAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'CCTV coverage with analytics; electronic article surveillance (EAS) tags on high-risk categories; stock-count reconciliation monthly; employee background screening; plainclothes loss-prevention team; supplier goods-in audit process.',
    rootCause: 'High unemployment driving opportunistic shoplifting; inadequate staffing on trading floor; organised retail crime syndicates targeting high-value categories.',
    isOngoing: true,
  },
  {
    title: 'Supply Chain Disruption — Stock Availability and Lead Times',
    description:
      'Transnet logistics delays, SA port congestion, and supplier production issues create out-of-stock situations in key categories, driving customers to competitors and triggering missed sales targets.',
    category: 'OPERATIONAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Minimum 4-week safety stock on A-category lines; dual-supplier policy for top-50 SKUs; weekly supply chain risk review; automated reorder triggers in ERP; alternative import routes via Ngqura pre-qualified.',
    rootCause: 'Transnet infrastructure deterioration; ZAR weakness increasing import landed costs and incentivising order reduction; SA supplier base consolidation reducing alternatives.',
    isOngoing: true,
  },
  {
    title: 'Cash Handling and Cash-in-Transit Risk',
    description:
      'High cash-handling volumes at till points and during CIT collections create exposure to armed robbery, internal theft, counting errors, and SAPS-reportable incidents that affect staff safety and insurance premiums.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Cash-minimisation strategy (card/EFT incentives); smart safes with time-delay access; CIT provider SLA and PSIRA-accreditation verified; dual-custodian cash-up procedure; staff safety training for robbery scenarios; CIT incident reporting protocol.',
    rootCause: 'High crime rate in SA retail environments; cash-intensive customer base in township and rural stores; organised CIT robbery syndicates.',
    isOngoing: true,
  },
  {
    title: 'Consumer Protection Act Non-Compliance',
    description:
      'Failure to comply with the Consumer Protection Act 68 of 2008 — including right-of-return obligations, prohibited pricing practices, and product safety requirements — exposes the organisation to NCT complaints, NCC investigations, and class action liability.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      'CPA compliance policy and training for store managers; return and refund procedure aligned to CPA Section 56; product recall procedure with NCC notification template; shelf-labelling audit quarterly; consumer complaints tracked and reported monthly.',
    rootCause: 'CPA complexity and evolving NCT case law; high volume of transactions increasing exposure; inadequate frontline staff training on statutory obligations.',
    isOngoing: false,
  },
  {
    title: 'Seasonal Revenue Concentration and Demand Volatility',
    description:
      'Disproportionate revenue concentration in November–December and school holidays creates financial strain during low-traffic periods, increases forecasting risk for inventory purchasing, and amplifies cash flow volatility.',
    category: 'FINANCIAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Off-peak promotional calendar to smooth demand; flexible staffing contracts reducing fixed cost during low season; category management diversification into counter-seasonal lines; 12-month rolling cash-flow forecast updated monthly.',
    rootCause: 'South African retail calendar driven by December bonus culture and school term cycles; limited domestic alternative demand stimuli.',
    isOngoing: true,
  },
  {
    title: 'Commercial Lease Obligations and Rental Escalation',
    description:
      'Fixed long-term lease obligations with annual escalation clauses above CPI expose the organisation to occupancy-cost creep that cannot be offset by revenue growth, particularly in underperforming stores.',
    category: 'FINANCIAL',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      'Portfolio lease review annually with property committee; negotiate CPI-linked escalation caps on renewals; break clauses included in new leases; store-level profitability model reviewed quarterly with lease cost as line item; landlord relationships maintained.',
    rootCause: 'SA mall lease structures historically favourable to landlords; commercial property REITs maintaining high rental demands despite reduced footfall.',
    isOngoing: true,
  },
  {
    title: 'POS System Failure and Payment Processing Outages',
    description:
      'Point-of-sale system downtime or payment gateway failures during peak trading periods (Black Friday, month-end) results in lost sales, customer dissatisfaction, and reputational harm on social media.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'Redundant POS infrastructure with failover to backup system; offline trading mode for card transactions; load-shedding UPS on POS terminals; payment gateway SLA (99.9% uptime) with penalty clauses; peak-period change freeze policy (48-hr prior).',
    rootCause: 'Ageing POS hardware in older stores; single-payment-gateway dependency; load shedding causing power surge damage to hardware.',
    isOngoing: true,
  },
  {
    title: 'Food Safety — Perishable Goods Management and DAFF Compliance',
    description:
      'Inadequate cold chain management, mislabelling, or sell-by date violations expose the organisation to DAFF (Department of Agriculture) enforcement, customer illness claims, product recalls, and social media reputational damage.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      'HACCP-certified food safety management system; automated temperature monitoring on refrigeration units; daily sell-by date checks with documented sign-off; supplier food safety audit programme; product traceability system to batch level; recall plan tested annually.',
    rootCause: 'Load shedding disrupting cold chain integrity; high SKU count creating date-management complexity; seasonal supplier quality variability.',
    isOngoing: true,
  },
  {
    title: 'Supplier Dependency and Single-Sourcing Concentration',
    description:
      'Concentration of purchasing volume in a small number of key suppliers creates supply continuity risk in the event of supplier insolvency, production failure, or relationship breakdown.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      'Top-10 supplier concentration monitored (max 15% of category spend per supplier); annual supplier financial health review; approved substitute supplier list for all A-category products; dual-source policy enforced for own-brand manufacturing.',
    rootCause: 'SA FMCG market dominated by few large manufacturers reducing buyer leverage; cost efficiencies achieved through volume concentration.',
    isOngoing: true,
  },
  {
    title: 'Staff Turnover and Retail Talent Shortage',
    description:
      'High frontline staff turnover (above 25% annually in sector) increases recruitment and training costs, degrades customer service consistency, and reduces product knowledge at till and floor level.',
    category: 'PEOPLE',
    inherentLikelihood: 4,
    inherentImpact: 2,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Competitive entry-level salary benchmarking; structured onboarding and 90-day retention programme; store-manager incentive scheme; employee recognition programme; exit interview analysis to identify root causes; SETA learnership pipeline.',
    rootCause: 'Retail wages below CPI; high opportunity cost of frontline retail roles compared to informal sector; emotional labour and crime exposure reducing job attractiveness.',
    isOngoing: true,
  },
  {
    title: 'Load Shedding — Trading Hours Loss and Refrigeration Damage',
    description:
      'Scheduled and unscheduled Eskom load shedding during trading hours reduces effective trading time, damages perishable food stock in unfitted stores, and increases generator fuel operating costs.',
    category: 'OPERATIONAL',
    inherentLikelihood: 5,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      'Generator fitted in all stores above 500m² trading area; solar PV with battery backup at pilot sites; refrigeration door seals and insulation upgrade programme; load-shedding impact tracked as KPI monthly; energy rebate tariff applied for diesel costs.',
    rootCause: 'Persistent Eskom capacity deficit; no near-term resolution expected; SA retail built on assumption of uninterrupted electricity supply.',
    isOngoing: true,
  },
  {
    title: 'Credit Risk — Lay-bye and In-House Debtors Exposure',
    description:
      'Lay-bye cancellation rates and in-house debtors book default rates increase during economic downturns, resulting in write-offs, working capital strain, and NCA compliance obligations if consumer credit is extended.',
    category: 'FINANCIAL',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      'Lay-bye cancellation tracking monthly with 90-day trigger for re-merchandising; debtors book aging analysis weekly; credit limit policy reviewed against NCRC affordability data; provisions aligned to IFRS 9 ECL model; bad debt collection agency contracted.',
    rootCause: 'Consumer over-indebtedness at record levels; retrenchment and salary reduction waves impacting ability to complete lay-bye commitments.',
    isOngoing: true,
  },
  {
    title: 'Online Fraud — Card-Not-Present and Account Takeover',
    description:
      'Growth in e-commerce channel increases exposure to card-not-present fraud, account takeover attacks, and chargeback losses that reduce net revenue and increase bank processing costs.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      '3DS2 authentication enforced on all online transactions; real-time fraud scoring at checkout; account takeover detection (velocity checks, device fingerprinting); chargeback ratio monitored against acquiring bank thresholds; fraud operations team reviews high-value orders manually.',
    rootCause: 'Rapid online channel growth outpacing fraud control maturity; SA card fraud syndicates migrating from physical to card-not-present environments.',
    isOngoing: true,
  },
  {
    title: 'Reputational Damage — Social Media Campaigns and Public Complaints',
    description:
      'Viral social media complaints about pricing, food safety, discrimination, or service failures can trigger consumer boycotts, regulatory investigation, and advertiser pressure disproportionate to the underlying incident.',
    category: 'REPUTATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '24/7 social media monitoring with escalation protocol; 2-hour response SLA for viral complaints; communications team trained on crisis response; boycott scenario tested in annual BCP; NPS tracking and store-level satisfaction data fed to operations monthly.',
    rootCause: 'SA consumers highly engaged on social media; historical incidents of perceived racism or unfair pricing receiving national coverage; mainstream media amplifying social media sentiment.',
    isOngoing: true,
  },
]

export const RETAIL_TEMPLATE: IndustryTemplate = {
  code: 'RETAIL',
  name: 'Retail',
  description:
    'Risk template for South African retailers covering e-commerce disruption, shrinkage, supply chain, CPA compliance, load shedding, food safety, and digital fraud risks.',
  benchmarkScore: 54,
  risks: RETAIL_RISKS,
}

// ============================================
// MINING AND RESOURCES TEMPLATE  (benchmarkScore 42)
// ============================================

const MINING_RESOURCES_RISKS: TemplateRisk[] = [
  {
    title: 'Seismic event or rockfall causing injury or fatality',
    description:
      'Underground operations expose workers to seismic risk and rockfall events. A serious incident would trigger MHSA Section 54 stoppage, halting production and triggering an Inspector investigation.',
    category: 'HEALTH_SAFETY',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• Daily workplace inspections by responsible persons\n• Support design reviewed by rock mechanics engineer\n• Seismic monitoring system installed on Level 3+',
    rootCause: 'Geological variability and aging underground infrastructure',
    isOngoing: true,
  },
  {
    title: 'Mine Health and Safety Act (MHSA) non-compliance',
    description:
      'MHSA compliance obligations are extensive and inspected regularly by the DMRE. Non-compliance can result in Section 54 stoppages, fines, and personal liability for the Mine Manager.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Designated Safety Officer conducts monthly compliance audits\n• Legal register maintained and reviewed quarterly\n• Mine Manager holds valid Certificate of Competency',
    rootCause: 'Regulatory complexity and high staff turnover in safety roles',
    isOngoing: true,
  },
  {
    title: 'Water use licence breach or DWS enforcement action',
    description:
      'Operations require a valid Water Use Licence (WUL) under the National Water Act. Licence conditions are frequently breached due to seasonal variation and process water management gaps.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Monthly water balance reports submitted to DWS\n• Environmental Control Officer monitors licence conditions\n• Slimes dam inspected quarterly by appointed engineer',
    rootCause: 'Ageing water management infrastructure and seasonal rainfall variability',
    isOngoing: true,
  },
  {
    title: 'Loss of social licence to operate due to community conflict',
    description:
      'Host communities have escalating expectations around employment, procurement, and environmental impact. Unresolved grievances have previously resulted in road blockades and operational disruption.',
    category: 'REPUTATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      '• Community Liaison Forum meets bi-monthly\n• Local procurement target: 40% of consumables\n• Community relations officer based in host community',
    rootCause: 'Historical under-investment in community development commitments',
    isOngoing: true,
  },
  {
    title: 'Commodity price collapse reducing project viability',
    description:
      'Revenue is directly exposed to global commodity prices (gold, platinum, iron ore). A sustained 20% price decline materially impacts the project\'s net present value and debt serviceability.',
    category: 'FINANCIAL',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 3,
    residualImpact: 4,
    controls:
      '• Hedging programme covers 30% of production for 12 months\n• Quarterly sensitivity analysis reviewed by CFO\n• Variable cost structure maintained where possible',
    rootCause: 'Dependence on single commodity with no beneficiation',
    isOngoing: true,
  },
  {
    title: 'Load shedding causing hoisting and ventilation failures',
    description:
      'Stage 4-6 load shedding disrupts underground hoisting, ventilation, and dewatering systems. Power interruptions below surface create immediate safety risks and extend shift cycles.',
    category: 'OPERATIONAL',
    inherentLikelihood: 5,
    inherentImpact: 4,
    residualLikelihood: 4,
    residualImpact: 3,
    controls:
      '• Diesel generators provide backup for critical services (ventilation, refuge bays)\n• Load shedding schedule integrated into shift planning\n• Surface operations scheduled around available power windows',
    rootCause: 'National energy infrastructure crisis; no viable short-term alternative',
    isOngoing: true,
  },
  {
    title: 'Tailings storage facility (TSF) structural failure',
    description:
      'A TSF failure would be catastrophic, causing loss of life, environmental damage, and permanent reputational damage. DMRE requires mandatory annual engineer certification under the MHSA.',
    category: 'ENVIRONMENTAL',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 1,
    residualImpact: 5,
    controls:
      '• Annual Engineer of Record inspection and certification\n• Piezometer readings monitored monthly\n• Raise construction reviewed by independent geotechnical engineer',
    rootCause: 'Ageing infrastructure and high capital cost of decommissioning',
    isOngoing: true,
  },
  {
    title: 'Illegal mining (zama-zamas) causing operational and safety disruption',
    description:
      'Illegal miners operating in old workings create security incidents, steal ore and equipment, and create fatal accident liability exposure when they breach into active areas.',
    category: 'OPERATIONAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      '• SAPS partnership and regular joint operations\n• All old access shafts sealed and monitored\n• Private security patrols perimeter fencing',
    rootCause: 'High local unemployment and porous perimeter fencing',
    isOngoing: true,
  },
  {
    title: 'MPRDA ownership and BEE compliance failure',
    description:
      'The Mineral and Petroleum Resources Development Act requires ongoing BEE ownership compliance. A compliance failure risks mining right suspension or non-renewal.',
    category: 'COMPLIANCE',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• BEE ownership structure reviewed annually by attorneys\n• BEE partner shareholder register maintained current\n• Social and Labour Plan (SLP) progress reported annually to DMRE',
    rootCause: 'Complexity of BEE trust structures and ownership verification requirements',
    isOngoing: true,
  },
  {
    title: 'Loss of key technical personnel (rock engineers, metallurgists)',
    description:
      'Registered rock mechanics engineers and metallurgists are in short supply nationally. A single resignation can trigger regulatory non-compliance and halt production until a replacement is appointed.',
    category: 'PEOPLE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      '• Retention bonuses in place for critical technical roles\n• Succession candidate identified for Mine Manager role\n• Graduate bursary programme in place (2 recipients)',
    rootCause: 'National shortage of registered mine technical professionals',
    isOngoing: true,
  },
  {
    title: 'Environmental liability from acid mine drainage (AMD)',
    description:
      'Decant from old workings is creating AMD affecting downstream water quality. NEMA enforcement action is possible. Remediation costs are significant and liability is long-tail.',
    category: 'ENVIRONMENTAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Water treatment plant operational on eastern boundary\n• Monthly water quality samples submitted to DWS\n• AMD extent assessed in annual environmental report',
    rootCause: 'Legacy of historical mining without rehabilitation obligation enforcement',
    isOngoing: true,
  },
  {
    title: 'Cybersecurity attack on SCADA and operational technology systems',
    description:
      'Underground control systems and surface plant automation (SCADA/OT) are increasingly networked. A ransomware attack on OT systems could halt hoisting and create immediate safety risks.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• IT/OT network segmentation partially implemented\n• SCADA systems on isolated network (no internet access)\n• Incident response plan exists but not tested in 18 months',
    rootCause: 'Legacy OT systems not designed with cybersecurity in mind',
    isOngoing: true,
  },
  {
    title: 'Foreign exchange exposure on USD-denominated commodity sales',
    description:
      'Revenue is USD-denominated while costs are ZAR. A ZAR appreciation of 10% directly compresses operating margins. Current hedge cover is insufficient for a sustained move.',
    category: 'FINANCIAL',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      '• CFO monitors ZAR/USD daily and activates forward cover at pre-agreed levels\n• 3-month rolling hedge in place\n• Board FX policy reviewed annually',
    rootCause: 'Revenue and cost base in different currencies',
    isOngoing: true,
  },
  {
    title: 'Regulatory change from DMR/DMRE increasing compliance costs',
    description:
      'Proposed amendments to the MHSA and MPRDA, and new DWS water licensing requirements, are in draft. Compliance with new requirements may require capital expenditure and increased headcount.',
    category: 'STRATEGIC',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      '• Mining industry association membership provides early warning of regulatory change\n• Legal register updated bi-annually\n• Legal counsel retained for regulatory tracking',
    rootCause: 'Evolving SA regulatory environment for extractives',
    isOngoing: true,
  },
  {
    title: 'Rehabilitation fund shortfall creating closure liability',
    description:
      'The Environmental Rehabilitation Guarantee (ERG) lodged with DMRE may not cover actual rehabilitation costs due to escalating costs and increased scope. Shortfall creates personal liability for directors.',
    category: 'FINANCIAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• ERG reviewed and increased annually\n• Rehabilitation cost estimate updated every 3 years by specialist consultant\n• Board approves closure liability disclosure in AFS',
    rootCause: 'Rehabilitation cost escalation outpacing annual ERG contributions',
    isOngoing: true,
  },
]

export const MINING_RESOURCES_TEMPLATE: IndustryTemplate = {
  code: 'MINING_RESOURCES',
  name: 'Mining & Resources',
  description:
    'Risk template for South African mining and resource extraction companies covering MHSA, MPRDA, DWS, BEE, community relations, commodity price, and environmental rehabilitation risks.',
  benchmarkScore: 42,
  risks: MINING_RESOURCES_RISKS,
}

// ============================================
// HEALTHCARE TEMPLATE  (benchmarkScore 38)
// ============================================

const HEALTHCARE_RISKS: TemplateRisk[] = [
  {
    title: 'Clinical negligence claim from adverse patient outcome',
    description:
      'A patient death or serious adverse event triggers a Medical Protection Society claim and potential HPCSA hearing. Award amounts are escalating; a single uninsured claim can exceed R10 million.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• Professional indemnity insurance in place (review sum insured annually)\n• Incident reporting protocol and root cause analysis for all adverse events\n• Clinical protocols reviewed quarterly by Medical Advisory Committee',
    rootCause: 'High patient volumes and staff fatigue increasing clinical error risk',
    isOngoing: true,
  },
  {
    title: 'HPCSA regulatory investigation or sanction',
    description:
      'A complaint to the Health Professions Council of South Africa can result in a formal hearing, suspension, or removal from the register. Even an unsubstantiated complaint disrupts practice.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• All practitioners maintain current HPCSA registration\n• Complaints log reviewed monthly by Practice Manager\n• Patient communication protocols reduce complaint escalation',
    rootCause: 'Increasing patient awareness of HPCSA complaint mechanisms',
    isOngoing: true,
  },
  {
    title: 'POPIA breach exposing patient health records',
    description:
      'Patient health records are Special Personal Information under POPIA. A breach — whether through cyberattack, staff error, or inadequate access controls — triggers mandatory notification to the Information Regulator and affected patients.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• EMR system access controlled by role (view/edit/admin)\n• Staff POPIA awareness training completed annually\n• Information Officer appointed and registered with Information Regulator',
    rootCause: 'Legacy paper records not yet fully digitised; staff sharing login credentials',
    isOngoing: true,
  },
  {
    title: 'Medication error causing patient harm',
    description:
      'Dispensing or prescribing errors create patient harm risk and professional liability. High-risk medications (anticoagulants, insulin, chemotherapy agents) require dual verification protocols not consistently applied.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• Dual check protocol for high-risk medications\n• Electronic dispensing system with dose range alerts\n• Pharmacist review of all hospital inpatient prescriptions',
    rootCause: 'Staff fatigue during extended shifts and high patient-to-nurse ratios',
    isOngoing: true,
  },
  {
    title: 'Needlestick or sharps injury exposing staff to bloodborne pathogens',
    description:
      'Needlestick injuries are a persistent occupational risk. Potential exposure to HIV, Hepatitis B, and Hepatitis C carries significant post-exposure prophylaxis costs and staff welfare obligations.',
    category: 'HEALTH_SAFETY',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      '• Safety-engineered devices (retractable needles) in use across all wards\n• Incident reporting mandatory; post-exposure protocol posted in all wards\n• Annual OHS Act compliance audit',
    rootCause: 'High patient throughput and time pressure during procedures',
    isOngoing: true,
  },
  {
    title: 'Load shedding disrupting clinical operations and life support systems',
    description:
      'Stage 4+ load shedding creates risk for ICU patients on life support, operating theatre continuity, and cold chain integrity for medications and blood products.',
    category: 'OPERATIONAL',
    inherentLikelihood: 4,
    inherentImpact: 5,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      '• Generator provides backup to ICU, theatres, and emergency department\n• UPS covers ventilators and monitoring equipment for 30 minutes\n• Cold chain monitoring with temperature alarms',
    rootCause: 'National energy crisis; generator capacity not rated for full facility load',
    isOngoing: true,
  },
  {
    title: 'Nursing shortage causing unsafe patient-to-nurse ratios',
    description:
      'South Africa faces a critical nursing shortage driven by emigration (UK, Australia, Canada) and insufficient training capacity. Unsafe ratios increase adverse event rates and drive staff burnout.',
    category: 'PEOPLE',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      '• Agency nursing pool contracted for emergency cover\n• Daily staffing dashboard reviewed by Nursing Manager\n• Retention programme includes housing allowance and study funding',
    rootCause: 'National healthcare workforce shortage accelerated by international migration',
    isOngoing: true,
  },
  {
    title: 'Medical waste management non-compliance (NEMWA/NDoH)',
    description:
      'Inadequate segregation, storage, or disposal of medical waste (sharps, anatomical waste, cytotoxic waste) creates regulatory risk under NEMWA and the National Health Act.',
    category: 'COMPLIANCE',
    inherentLikelihood: 2,
    inherentImpact: 3,
    residualLikelihood: 1,
    residualImpact: 2,
    controls:
      '• Licensed waste contractor collects weekly\n• Waste manifests retained for 3 years\n• Annual waste management training for clinical staff',
    rootCause: 'Staff turnover creating gaps in waste segregation compliance',
    isOngoing: false,
  },
  {
    title: 'Medical aid fraud and upcoding exposure',
    description:
      'Fraudulent claims or upcoding (billing for higher procedure codes than performed) by staff or providers exposes the practice to SAFPS registration, criminal prosecution, and scheme recovery claims.',
    category: 'FINANCIAL',
    inherentLikelihood: 2,
    inherentImpact: 4,
    residualLikelihood: 1,
    residualImpact: 3,
    controls:
      '• Billing reviewed by Practice Manager before submission\n• Scheme audit requests responded to within SLA\n• Internal whistleblower channel available to staff',
    rootCause: 'Complex tariff codes creating unintentional upcoding risk',
    isOngoing: true,
  },
  {
    title: 'Critical drug or consumable supply chain disruption',
    description:
      'South Africa has experienced recurring drug shortages (antiretrovirals, anaesthetic agents, contrast media). A shortage of critical consumables can force theatre cancellations and patient harm.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• 30-day buffer stock maintained for top 20 critical items\n• Secondary supplier identified for all Schedule 5+ drugs\n• Weekly pharmacy stock review with escalation protocol',
    rootCause: 'Reliance on single distributors and global supply chain fragility',
    isOngoing: true,
  },
  {
    title: 'Ransomware attack on electronic medical records system',
    description:
      'Healthcare organisations are a primary target for ransomware. An attack on the EMR system would halt clinical operations, destroy audit trails, and trigger POPIA notification obligations.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• Daily offline backup of EMR database\n• Staff phishing simulation training quarterly\n• Firewall and endpoint protection on all clinical devices',
    rootCause: 'Underfunded IT security relative to the value of data held',
    isOngoing: true,
  },
  {
    title: 'Patient complaint escalating to CMS or media',
    description:
      'An unresolved patient complaint can be escalated to the Council for Medical Schemes (CMS), the HPCSA, or directly to social and mainstream media. Reputational damage can affect referral patterns significantly.',
    category: 'REPUTATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      '• Patient relations officer responds to all complaints within 48 hours\n• Complaint log reviewed monthly by Medical Director\n• Google Reviews monitored weekly',
    rootCause: 'Elevated patient expectations and increased awareness of complaint channels',
    isOngoing: true,
  },
  {
    title: 'Medical malpractice insurance premium increase or withdrawal',
    description:
      'Rising claim frequency and severity in SA has caused several underwriters to exit the medical malpractice market. A significant premium increase or inability to renew cover would be a practice-threatening event.',
    category: 'FINANCIAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Insurance broker reviews market annually at renewal\n• Claims history maintained to support underwriter negotiations\n• Risk management programme documented for insurer submission',
    rootCause: 'Hardening global medical malpractice insurance market',
    isOngoing: true,
  },
  {
    title: 'National Health Insurance (NHI) implementation disrupting private practice revenue',
    description:
      'The NHI Act (2023) creates structural uncertainty for private healthcare funding. If fully implemented, it may redirect patients to public facilities and reduce medical scheme membership, directly impacting private practice revenue.',
    category: 'STRATEGIC',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 3,
    residualImpact: 4,
    controls:
      '• Practice modelling includes NHI scenario (30% revenue reduction)\n• Revenue diversification into wellness and occupational health services\n• Industry body membership for NHI policy engagement',
    rootCause: 'Fundamental structural reform of South African healthcare funding',
    isOngoing: true,
  },
  {
    title: 'Infection control failure causing healthcare-associated infection (HAI) outbreak',
    description:
      'An HAI outbreak (MRSA, C. difficile, Acinetobacter) in a ward causes patient harm, extended length of stay, reputational damage, and potential DOH investigation.',
    category: 'OPERATIONAL',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Infection Control Practitioner conducts weekly ward rounds\n• Hand hygiene compliance audited monthly (target >80%)\n• Environmental cleaning protocols reviewed against ICPSA guidelines',
    rootCause: 'High patient throughput and inadequate environmental cleaning resources',
    isOngoing: true,
  },
]

export const HEALTHCARE_TEMPLATE: IndustryTemplate = {
  code: 'HEALTHCARE',
  name: 'Healthcare',
  description:
    'Risk template for South African private hospitals, clinics, and healthcare providers covering HPCSA, POPIA, NHI, clinical negligence, medical waste, nursing shortages, and malpractice insurance risks.',
  benchmarkScore: 38,
  risks: HEALTHCARE_RISKS,
}

// ============================================
// PROFESSIONAL SERVICES TEMPLATE  (benchmarkScore 44)
// ============================================

const PROFESSIONAL_SERVICES_RISKS: TemplateRisk[] = [
  {
    title: 'POPIA breach exposing confidential client data',
    description:
      'Professional service firms hold highly sensitive client financial, legal, and personal data. A breach triggers mandatory notification to the Information Regulator, reputational damage, and potential civil claims from affected clients.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Information Officer appointed and registered with Information Regulator\n• Client data access restricted by role in practice management system\n• Annual POPIA compliance review by external advisor',
    rootCause: 'Inadequate access controls on shared drives and email attachments',
    isOngoing: true,
  },
  {
    title: 'Professional indemnity claim from client engagement error',
    description:
      'An error or omission in professional advice (audit, tax, legal) can result in a significant PI claim. A single uninsured or under-insured claim can threaten firm viability.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• Professional indemnity insurance reviewed at renewal (adequate sum insured)\n• Engagement quality control review for all high-risk engagements\n• Second partner review required for opinions above R1m in consequence',
    rootCause: 'Time pressure, staff turnover, and increasing technical complexity of work',
    isOngoing: true,
  },
  {
    title: 'Key partner departure triggering client attrition',
    description:
      'Client relationships in professional services are often personal. A key partner\'s resignation and move to a competitor can result in loss of the associated client book, which may represent 20-40% of revenue.',
    category: 'STRATEGIC',
    inherentLikelihood: 3,
    inherentImpact: 5,
    residualLikelihood: 2,
    residualImpact: 4,
    controls:
      '• Dual-partner relationship model on all clients above R200k annual fee\n• Employment contracts include 6-month restraint of trade\n• Annual partner retention review at compensation committee',
    rootCause: 'Concentration of client relationships in individual partners',
    isOngoing: true,
  },
  {
    title: 'IRBA or SAICA regulatory sanction affecting audit registration',
    description:
      'An IRBA inspection finding or SAICA disciplinary matter can result in practice restriction, public censure, or deregistration. The reputational and commercial consequences are severe and difficult to reverse.',
    category: 'COMPLIANCE',
    inherentLikelihood: 2,
    inherentImpact: 5,
    residualLikelihood: 1,
    residualImpact: 5,
    controls:
      '• Internal quality control system (ISQM 1) implemented and documented\n• Pre-issuance engagement quality review for all listed company audits\n• Annual IRBA readiness self-assessment against inspection focus areas',
    rootCause: 'Increasing IRBA inspection intensity and expanding scope of review',
    isOngoing: true,
  },
  {
    title: 'Ransomware or cyberattack on practice management system',
    description:
      'Accounting and legal firms are targeted for client financial data. A successful ransomware attack would halt billable work, destroy records, and trigger POPIA notification obligations.',
    category: 'TECHNOLOGY',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Daily cloud backup of all practice management data\n• Multi-factor authentication on all remote access\n• Annual phishing simulation and staff cybersecurity training',
    rootCause: 'High-value client data and typically under-resourced IT security',
    isOngoing: true,
  },
  {
    title: 'Fee collection failure and bad debt write-off',
    description:
      'Professional service fees are often billed in arrears. Client insolvency, fee disputes, and poor collections discipline can result in significant bad debt write-offs eroding profitability.',
    category: 'FINANCIAL',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      '• 30-day payment terms enforced; work in progress reviewed monthly\n• Retainer agreements required for all clients above R50k pa\n• Debtors days reviewed at monthly management meeting',
    rootCause: 'Reluctance to enforce collections with long-standing clients',
    isOngoing: true,
  },
  {
    title: 'Conflict of interest not identified before engagement acceptance',
    description:
      'Accepting an engagement with a conflicted party (competitor, adverse party in litigation, related audit client) creates professional and legal risk. Failure to identify a conflict at intake can require disengagement mid-engagement.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Conflict check mandatory in engagement acceptance procedure\n• Firm-wide client register accessible to all partners\n• Independence confirmation signed annually by all professional staff',
    rootCause: 'Growing client network increasing frequency of undiscovered conflicts',
    isOngoing: true,
  },
  {
    title: 'Talent retention failure in a competitive professional services market',
    description:
      'Experienced CA(SA)s and attorneys are in high demand. A competitor firm offering a 20% salary premium can strip an entire team. Loss of qualified staff directly impacts billable capacity and client service quality.',
    category: 'PEOPLE',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      '• Annual salary benchmarking against competitor firms\n• Accelerated partnership track for high performers\n• Flexible working arrangements implemented post-COVID',
    rootCause: 'Structural shortage of qualified professionals in South Africa',
    isOngoing: true,
  },
  {
    title: 'Reputational damage from social media or media coverage',
    description:
      'A disgruntled client or former employee posting publicly can cause rapid reputational damage. Professional services firms are particularly vulnerable as reputation is the primary commercial asset.',
    category: 'REPUTATIONAL',
    inherentLikelihood: 2,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Social media monitoring tool in place\n• Response protocol for negative reviews defined and tested\n• Separation agreements include non-disparagement clauses',
    rootCause: 'Unavoidable client and staff dissatisfaction in high-pressure engagements',
    isOngoing: true,
  },
  {
    title: 'B-BBEE compliance failure affecting client tender eligibility',
    description:
      'Many public sector and large corporate clients require a minimum B-BBEE level from their professional service providers. A downgrade to Level 4 or below may disqualify the firm from tender processes.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controls:
      '• Annual B-BBEE verification with accredited agency\n• B-BBEE improvement plan targets reviewed quarterly\n• ESD spend tracked monthly against target',
    rootCause: 'Difficulty meeting ownership and management control elements',
    isOngoing: true,
  },
  {
    title: 'Scope creep eroding engagement profitability',
    description:
      'Engagements regularly expand beyond the agreed scope without corresponding fee increases. Cumulative scope creep on a portfolio of engagements can erode firm profitability by 10-15% annually.',
    category: 'FINANCIAL',
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 2,
    controls:
      '• Engagement letters include explicit scope definition and variation clause\n• Work in progress reviewed by partner at 80% budget consumption\n• Variation orders required for scope changes above 10% of budget',
    rootCause: 'Partner reluctance to have scope conversations with established clients',
    isOngoing: true,
  },
  {
    title: 'Third-party vendor failure affecting client delivery',
    description:
      'Reliance on subcontractors, specialist consultants, or technology vendors creates delivery risk. A vendor failure mid-engagement creates reputational risk and potential PI exposure.',
    category: 'OPERATIONAL',
    inherentLikelihood: 2,
    inherentImpact: 3,
    residualLikelihood: 1,
    residualImpact: 2,
    controls:
      '• Key vendor list maintained with alternative suppliers identified\n• Subcontractor agreements include liability and confidentiality clauses\n• Vendor performance reviewed annually',
    rootCause: 'Over-reliance on specialist vendors without documented alternatives',
    isOngoing: false,
  },
  {
    title: 'Succession planning failure creating practice continuity risk',
    description:
      'Founding partners approaching retirement without succession plans create a valuation cliff and client continuity risk. A firm with no next-generation partners is difficult to sell or transition.',
    category: 'STRATEGIC',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Succession plan documented for each founding partner\n• Next-generation partners introduced to key clients over 3-year horizon\n• Partnership buy-in model creates financial incentive for junior partners',
    rootCause: 'Founding generation approaching retirement without formalised transition',
    isOngoing: true,
  },
  {
    title: 'FICA and AML non-compliance for accountable institutions',
    description:
      'Accounting and legal firms are Accountable Institutions under FICA. Failure to conduct adequate Client Due Diligence (CDD), maintain records, or file Suspicious Transaction Reports (STRs) exposes partners to criminal liability.',
    category: 'COMPLIANCE',
    inherentLikelihood: 3,
    inherentImpact: 4,
    residualLikelihood: 2,
    residualImpact: 3,
    controls:
      '• Risk-based CDD conducted on all new clients before engagement acceptance\n• FICA Compliance Officer appointed; annual FICA training for all staff\n• STR filing procedure documented and tested',
    rootCause: 'Complexity of FICA requirements and frequent regulatory updates',
    isOngoing: true,
  },
  {
    title: 'AI disrupting core service lines (tax, audit, legal drafting)',
    description:
      'Generative AI tools are automating tasks that previously required qualified professionals. Failure to adapt service delivery models and pricing risks margin compression and client loss to lower-cost AI-enabled competitors.',
    category: 'STRATEGIC',
    inherentLikelihood: 4,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 3,
    controls:
      '• Technology adoption strategy reviewed annually at partners\' meeting\n• AI tools piloted on lower-risk engagements before rollout\n• Service pricing model reviewed to reflect AI-driven efficiency',
    rootCause: 'Rapid advancement of AI capability relative to firm technology adoption speed',
    isOngoing: true,
  },
]

export const PROFESSIONAL_SERVICES_TEMPLATE: IndustryTemplate = {
  code: 'PROFESSIONAL_SERVICES',
  name: 'Professional Services',
  description:
    'Risk template for South African accounting, legal, consulting, and advisory firms covering POPIA, FICA, IRBA, SAICA, PI claims, B-BBEE, talent retention, and AI disruption risks.',
  benchmarkScore: 44,
  risks: PROFESSIONAL_SERVICES_RISKS,
}

// ============================================
// REGISTRY
// ============================================

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  MANUFACTURING_TEMPLATE,
  FINANCIAL_SERVICES_TEMPLATE,
  RETAIL_TEMPLATE,
  MINING_RESOURCES_TEMPLATE,
  HEALTHCARE_TEMPLATE,
  PROFESSIONAL_SERVICES_TEMPLATE,
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Returns the template for the given industry code, or undefined if not found.
 */
export function getTemplateByCode(code: IndustryCode): IndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES.find((t) => t.code === code)
}

/**
 * Returns all registered industry templates.
 */
export function getAllTemplates(): IndustryTemplate[] {
  return INDUSTRY_TEMPLATES
}

/**
 * Calculates derived score fields for a list of template risks.
 * Returns each risk with inherentScore, residualScore, and a risk category
 * validated against the known RiskCategory list.
 */
export function calculateTemplateRiskScores(
  risks: TemplateRisk[]
): Array<TemplateRisk & { inherentScore: number; residualScore: number }> {
  return risks.map((r) => ({
    ...r,
    inherentScore: r.inherentLikelihood * r.inherentImpact,
    residualScore: r.residualLikelihood * r.residualImpact,
  }))
}

/**
 * Validates a template's risks for common data integrity issues.
 * Returns an array of human-readable error strings. Empty array = valid.
 */
export function validateTemplate(template: IndustryTemplate): string[] {
  const errors: string[] = []

  if (template.risks.length === 0) {
    errors.push('Template must contain at least one risk')
  }

  template.risks.forEach((r, idx) => {
    const label = `Risk[${idx}] "${r.title}"`

    // Likelihood/impact range checks
    for (const [field, val] of [
      ['inherentLikelihood', r.inherentLikelihood],
      ['inherentImpact', r.inherentImpact],
      ['residualLikelihood', r.residualLikelihood],
      ['residualImpact', r.residualImpact],
    ] as const) {
      if (val < 1 || val > 5 || !Number.isInteger(val)) {
        errors.push(`${label}: ${field} must be an integer 1–5 (got ${val})`)
      }
    }

    // Residual score should not exceed inherent score
    const inherentScore = r.inherentLikelihood * r.inherentImpact
    const residualScore = r.residualLikelihood * r.residualImpact
    if (residualScore > inherentScore) {
      errors.push(
        `${label}: residualScore (${residualScore}) exceeds inherentScore (${inherentScore})`
      )
    }

    // Category must be a known RiskCategory
    if (!RISK_CATEGORIES.includes(r.category as RiskCategory)) {
      errors.push(`${label}: unknown category "${r.category}"`)
    }

    // Required text fields
    if (!r.title.trim()) errors.push(`${label}: title is required`)
    if (!r.description.trim()) errors.push(`${label}: description is required`)
    if (!r.controls.trim()) errors.push(`${label}: controls is required`)
    if (!r.rootCause.trim()) errors.push(`${label}: rootCause is required`)
  })

  if (template.benchmarkScore < 0 || template.benchmarkScore > 100) {
    errors.push(`benchmarkScore must be 0–100 (got ${template.benchmarkScore})`)
  }

  return errors
}
