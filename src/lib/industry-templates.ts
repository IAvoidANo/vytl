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
// REGISTRY
// ============================================

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  MANUFACTURING_TEMPLATE,
  FINANCIAL_SERVICES_TEMPLATE,
  RETAIL_TEMPLATE,
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
