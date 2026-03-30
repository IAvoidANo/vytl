import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ============================================
  // ORGANISATION
  // ============================================
  const org = await prisma.organisation.upsert({
    where: { slug: 'redefine-properties-demo' },
    update: {},
    create: {
      name: 'Redefine Properties (Demo)',
      slug: 'redefine-properties-demo',
      industry: 'Real Estate',
      employeeCount: 350,
      consentGiven: true,
      consentDate: new Date(),
      appetiteStatement:
        'Redefine Properties maintains a moderate risk appetite aligned with our growth strategy, accepting calculated risks in property acquisition and development while maintaining zero tolerance for regulatory non-compliance, health and safety failures, and reputational damage to tenant relationships.',
      appetiteLow: 4,
      appetiteMedium: 9,
      appetiteHigh: 14,
    },
  })

  console.log('Organisation ready:', org.name)

  // ============================================
  // ADMIN USER
  // ============================================
  const passwordHash = await bcrypt.hash('Demo2026!', 12)

  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.vytlrx.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'admin@demo.vytlrx.com',
      name: 'Avi Kriel',
      passwordHash,
      role: 'OWNER',
      orgId: org.id,
      emailVerified: new Date(),
    },
  })

  console.log('User ready:', user.email)

  // ============================================
  // RISK REGISTER
  // ============================================
  const existingRegister = await prisma.riskRegister.findFirst({
    where: { orgId: org.id, name: 'Enterprise Risk Register' },
  })

  const register =
    existingRegister ??
    (await prisma.riskRegister.create({
      data: {
        name: 'Enterprise Risk Register',
        description: 'Primary enterprise risk register for Redefine Properties (Demo)',
        status: 'ACTIVE',
        orgId: org.id,
      },
    }))

  console.log('Risk register ready:', register.name)

  // ============================================
  // RISKS
  // ============================================
  type SeedRisk = {
    refCode: string
    title: string
    description: string
    category:
      | 'STRATEGIC'
      | 'OPERATIONAL'
      | 'FINANCIAL'
      | 'COMPLIANCE'
      | 'REPUTATIONAL'
      | 'TECHNOLOGY'
      | 'ENVIRONMENTAL'
      | 'HEALTH_SAFETY'
    inherentLikelihood: number
    inherentImpact: number
    residualLikelihood: number
    residualImpact: number
    controls: string
    rootCause: string
    isOngoing: boolean
  }

  const SEED_RISKS: SeedRisk[] = [
    // === STRATEGIC (3 risks) ===
    {
      refCode: 'STR-001',
      title: 'Tenant concentration risk',
      description:
        'Over-reliance on top 5 tenants representing >40% of gross lettable area. Loss of anchor tenant would significantly impact revenue and property valuations across the portfolio.',
      category: 'STRATEGIC',
      inherentLikelihood: 3,
      inherentImpact: 5,
      residualLikelihood: 2,
      residualImpact: 4,
      controls:
        'Diversification policy limiting single-tenant exposure to 15% of GLA.\nQuarterly tenant credit assessments by finance team.\nEarly renewal engagement programme starting 18 months before lease expiry.',
      rootCause: 'Historical acquisition strategy favoured large single-tenant industrial assets',
      isOngoing: true,
    },
    {
      refCode: 'STR-002',
      title: 'Interest rate exposure on variable-rate debt',
      description:
        'R2.1bn variable-rate debt facility exposed to SARB repo rate increases. Each 25bps increase reduces distributable income by approximately R5.2m per annum.',
      category: 'STRATEGIC',
      inherentLikelihood: 4,
      inherentImpact: 4,
      residualLikelihood: 3,
      residualImpact: 3,
      controls:
        'Interest rate swap programme covering 65% of variable exposure.\nTreasury policy requiring minimum 50% hedging ratio.\nMonthly mark-to-market reporting to CFO.',
      rootCause: 'Aggressive debt-funded acquisition strategy during low-rate cycle',
      isOngoing: true,
    },
    {
      refCode: 'STR-003',
      title: 'B-BBEE scorecard deterioration',
      description:
        'Current Level 4 B-BBEE rating at risk of downgrade due to management control and skills development shortfalls. Downgrade would impact public sector lease renewals and new tender eligibility.',
      category: 'STRATEGIC',
      inherentLikelihood: 3,
      inherentImpact: 4,
      residualLikelihood: 2,
      residualImpact: 3,
      controls:
        'Dedicated B-BBEE committee meeting quarterly.\nPreferential procurement programme targeting 80% B-BBEE compliant suppliers.\nLearnership and bursary programme for 20 candidates annually.',
      rootCause: 'Slow progress on management control element under amended codes',
      isOngoing: true,
    },

    // === OPERATIONAL (3 risks) ===
    {
      refCode: 'OPS-001',
      title: 'Load shedding impact on tenant operations',
      description:
        'Eskom load shedding disrupts tenant business continuity across 42 commercial properties. Backup generator capacity insufficient for Stage 6+ scenarios, leading to tenant complaints and potential lease breaks.',
      category: 'OPERATIONAL',
      inherentLikelihood: 5,
      inherentImpact: 4,
      residualLikelihood: 3,
      residualImpact: 3,
      controls:
        'R85m capital programme for generator and solar PV installations across top 20 assets.\nLoad shedding communication protocol with 2-hour advance tenant notification.\nUPS systems installed for all common area and security infrastructure.',
      rootCause: 'Insufficient national grid capacity and aging Eskom infrastructure',
      isOngoing: true,
    },
    {
      refCode: 'OPS-002',
      title: 'Property maintenance backlog',
      description:
        'Deferred maintenance across 12 aging properties (15+ years) creating safety hazards, tenant dissatisfaction, and accelerated asset value depreciation. Current backlog estimated at R120m.',
      category: 'OPERATIONAL',
      inherentLikelihood: 4,
      inherentImpact: 3,
      residualLikelihood: 3,
      residualImpact: 2,
      controls:
        'Condition assessment programme with annual property inspections.\n3-year rolling capex plan approved by investment committee.\nTenant satisfaction survey triggering priority maintenance for scores below 6/10.',
      rootCause: 'Capex deferrals during 2020-2022 COVID period to preserve distributions',
      isOngoing: true,
    },
    {
      refCode: 'OPS-003',
      title: 'Water supply disruption — municipal infrastructure failure',
      description:
        'Municipal water supply interruptions affecting Gauteng and KZN properties. Borehole and JoJo tank capacity covers only 48 hours of normal consumption at affected sites.',
      category: 'OPERATIONAL',
      inherentLikelihood: 4,
      inherentImpact: 3,
      residualLikelihood: 3,
      residualImpact: 2,
      controls:
        'Borehole installation at 8 high-risk properties.\nWater storage tanks providing 48-hour emergency supply.\nWater recycling systems installed at 3 largest office parks.',
      rootCause: 'Deteriorating municipal water infrastructure and intermittent supply',
      isOngoing: true,
    },

    // === FINANCIAL (2 risks) ===
    {
      refCode: 'FIN-001',
      title: 'Vacancy rate exceeding budget',
      description:
        'Portfolio vacancy rate at 11.2% against 8% budget. Office segment particularly affected at 16.3% as hybrid work reduces demand for traditional office space in Sandton and Rosebank nodes.',
      category: 'FINANCIAL',
      inherentLikelihood: 4,
      inherentImpact: 4,
      residualLikelihood: 3,
      residualImpact: 3,
      controls:
        'Active leasing team with broker incentive programme.\nFlexible lease terms (3-year options) to attract SME tenants.\nR45m office-to-flex conversion programme for underperforming assets.',
      rootCause: 'Structural shift to hybrid work reducing traditional office demand',
      isOngoing: true,
    },
    {
      refCode: 'FIN-002',
      title: 'Rand depreciation increasing imported cost base',
      description:
        'Weakening ZAR increases cost of imported HVAC, elevator, and fire safety equipment. 15% depreciation over 12 months added R18m to capital programme budget.',
      category: 'FINANCIAL',
      inherentLikelihood: 3,
      inherentImpact: 3,
      residualLikelihood: 2,
      residualImpact: 2,
      controls:
        'Forward cover on confirmed equipment orders exceeding R500k.\nLocal supplier development programme for commodity items.\nQuarterly forex exposure reporting to treasury committee.',
      rootCause: 'SA macroeconomic environment and reliance on imported building systems',
      isOngoing: true,
    },

    // === COMPLIANCE (2 risks) ===
    {
      refCode: 'COM-001',
      title: 'POPIA non-compliance in tenant data handling',
      description:
        'Tenant personal information processed across 6 different systems without unified consent management. Information Officer role assigned but PAIA manual not updated since 2022.',
      category: 'COMPLIANCE',
      inherentLikelihood: 3,
      inherentImpact: 5,
      residualLikelihood: 2,
      residualImpact: 4,
      controls:
        'POPIA compliance project with dedicated budget of R1.2m.\nPrivacy impact assessments completed for 4 of 6 systems.\nStaff awareness training completed for 85% of employees.',
      rootCause: 'Fragmented IT landscape from acquisitions with no unified data governance',
      isOngoing: true,
    },
    {
      refCode: 'COM-002',
      title: 'OHS Act non-compliance across construction sites',
      description:
        'Active construction and refurbishment at 4 sites creates Occupational Health and Safety Act exposure. Two Section 24 notices received in past 12 months from Department of Employment and Labour.',
      category: 'COMPLIANCE',
      inherentLikelihood: 3,
      inherentImpact: 5,
      residualLikelihood: 2,
      residualImpact: 3,
      controls:
        'Dedicated OHS manager with CR 17(1) appointment.\nMonthly site safety audits with corrective action tracking.\nContractor pre-qualification requiring COID and safety file compliance.',
      rootCause: 'Multiple concurrent construction projects stretching safety oversight capacity',
      isOngoing: false,
    },

    // === REPUTATIONAL (1 risk) ===
    {
      refCode: 'REP-001',
      title: 'Community protest and land invasion risk',
      description:
        'Three properties adjacent to informal settlements face ongoing land invasion attempts and community protests demanding employment opportunities. One property required private security intervention in Q3.',
      category: 'REPUTATIONAL',
      inherentLikelihood: 4,
      inherentImpact: 4,
      residualLikelihood: 3,
      residualImpact: 3,
      controls:
        'Community liaison officer engaging with local ward councillors.\nLocal employment policy requiring 30% local hiring on maintenance contracts.\nCommunity development fund contributing R2m annually to adjacent communities.',
      rootCause: 'High unemployment in surrounding communities and visible wealth disparity',
      isOngoing: true,
    },

    // === TECHNOLOGY (2 risks) ===
    {
      refCode: 'TEC-001',
      title: 'Cybersecurity — building management system vulnerabilities',
      description:
        'Legacy BMS and HVAC control systems at 8 properties running unpatched firmware. IoT-connected building systems create attack surface for ransomware targeting operational technology.',
      category: 'TECHNOLOGY',
      inherentLikelihood: 3,
      inherentImpact: 4,
      residualLikelihood: 2,
      residualImpact: 3,
      controls:
        'Network segmentation isolating BMS from corporate IT.\nQuarterly vulnerability assessments by external cybersecurity firm.\nIncident response plan with 4-hour RTO for critical building systems.',
      rootCause: 'BMS vendors slow to issue security patches for legacy hardware',
      isOngoing: true,
    },
    {
      refCode: 'TEC-002',
      title: 'ERP system end-of-life — SAP migration risk',
      description:
        'Current SAP ECC 6.0 system reaching end of mainstream support. Migration to S/4HANA estimated at R25m with 12-month implementation timeline. Delay risks losing vendor support and security patches.',
      category: 'TECHNOLOGY',
      inherentLikelihood: 3,
      inherentImpact: 3,
      residualLikelihood: 2,
      residualImpact: 2,
      controls:
        'SAP migration project approved with R25m budget and dedicated PMO.\nExtended support contract secured through December 2026.\nParallel run planned for 3 months before cutover.',
      rootCause: 'Deferred ERP modernisation during COVID cost-cutting period',
      isOngoing: false,
    },

    // === ENVIRONMENTAL (1 risk) ===
    {
      refCode: 'ENV-001',
      title: 'Climate transition risk — carbon tax and green building compliance',
      description:
        'Increasing carbon tax liability (currently R190/tCO2e) and tenant demand for Green Star-rated buildings. 60% of portfolio below 4-Star Green Star rating, risking tenant attrition to competitors.',
      category: 'ENVIRONMENTAL',
      inherentLikelihood: 3,
      inherentImpact: 3,
      residualLikelihood: 2,
      residualImpact: 2,
      controls:
        'ESG committee with board-level oversight.\nR60m green retrofit programme targeting 4-Star minimum across portfolio.\nScope 1 and 2 emissions tracking with annual CDP disclosure.',
      rootCause: 'Legacy building stock predating green building standards',
      isOngoing: true,
    },

    // === HEALTH_SAFETY (1 risk) ===
    {
      refCode: 'HS-001',
      title: 'Fire safety compliance in mixed-use developments',
      description:
        'Three mixed-use developments with residential components require enhanced fire safety compliance. Recent fire at competitor property heightened regulatory scrutiny and insurance requirements.',
      category: 'HEALTH_SAFETY',
      inherentLikelihood: 2,
      inherentImpact: 5,
      residualLikelihood: 1,
      residualImpact: 4,
      controls:
        'Annual fire risk assessments by registered fire engineer.\nFire detection and suppression systems maintained quarterly.\nEvacuation drills conducted bi-annually with tenant participation tracking.',
      rootCause: 'Mixed-use occupancy creating complex fire safety requirements',
      isOngoing: true,
    },
  ]

  let risksCreated = 0
  for (const r of SEED_RISKS) {
    const existing = await prisma.risk.findFirst({
      where: { refCode: r.refCode, register: { orgId: org.id } },
    })

    if (!existing) {
      await prisma.risk.create({
        data: {
          refCode: r.refCode,
          title: r.title,
          description: r.description,
          category: r.category,
          inherentLikelihood: r.inherentLikelihood,
          inherentImpact: r.inherentImpact,
          inherentScore: r.inherentLikelihood * r.inherentImpact,
          residualLikelihood: r.residualLikelihood,
          residualImpact: r.residualImpact,
          residualScore: r.residualLikelihood * r.residualImpact,
          controls: r.controls,
          rootCause: r.rootCause,
          isOngoing: r.isOngoing,
          response: 'MITIGATE',
          status: 'OPEN',
          workflowStatus: 'APPROVED',
          source: 'MANUAL',
          registerId: register.id,
          createdById: user.id,
        },
      })
      risksCreated++
    }
  }

  console.log(`Risks ready: ${SEED_RISKS.length} total (${risksCreated} created)`)

  // ============================================
  // KRIs
  // ============================================
  type SeedKri = {
    name: string
    description: string
    unit: string
    direction: 'HIGHER_IS_WORSE' | 'LOWER_IS_WORSE'
    currentValue: number
    thresholdGreen: number
    thresholdAmber: number
    thresholdRed: number
    status: 'GREEN' | 'AMBER' | 'RED'
  }

  const SEED_KRIS: SeedKri[] = [
    {
      name: 'Portfolio vacancy rate',
      description: 'Percentage of gross lettable area unoccupied across portfolio',
      unit: '%',
      direction: 'HIGHER_IS_WORSE',
      currentValue: 11.2,
      thresholdGreen: 8.0,
      thresholdAmber: 10.0,
      thresholdRed: 11.0,
      status: 'RED', // 11.2 >= 11.0 red threshold
    },
    {
      name: 'Weighted average lease expiry (WALE)',
      description: 'Weighted average remaining lease term across portfolio in years',
      unit: 'years',
      direction: 'LOWER_IS_WORSE',
      currentValue: 3.8,
      thresholdGreen: 4.5,
      thresholdAmber: 4.0,
      thresholdRed: 3.5,
      status: 'AMBER', // 3.8 between amber and green thresholds
    },
    {
      name: 'Debt-to-equity ratio',
      description: 'Total interest-bearing debt as percentage of total equity',
      unit: '%',
      direction: 'HIGHER_IS_WORSE',
      currentValue: 42,
      thresholdGreen: 35,
      thresholdAmber: 40,
      thresholdRed: 50,
      status: 'AMBER', // 42 >= 40 amber, < 50 red
    },
    {
      name: 'Tenant satisfaction score',
      description: 'Average tenant satisfaction from bi-annual survey (1-10 scale)',
      unit: '/10',
      direction: 'LOWER_IS_WORSE',
      currentValue: 6.8,
      thresholdGreen: 7.0,
      thresholdAmber: 6.5,
      thresholdRed: 5.5,
      status: 'AMBER', // 6.8 between amber and green
    },
    {
      name: 'OHS incident rate',
      description: 'Lost-time injuries per 200,000 hours worked across all sites',
      unit: 'LTIFR',
      direction: 'HIGHER_IS_WORSE',
      currentValue: 1.2,
      thresholdGreen: 0.5,
      thresholdAmber: 1.0,
      thresholdRed: 1.1,
      status: 'RED', // 1.2 >= 1.1 red threshold
    },
  ]

  let krisCreated = 0
  for (const k of SEED_KRIS) {
    const existing = await prisma.kri.findFirst({
      where: { name: k.name, orgId: org.id },
    })

    if (!existing) {
      await prisma.kri.create({
        data: {
          name: k.name,
          description: k.description,
          unit: k.unit,
          direction: k.direction,
          currentValue: k.currentValue,
          thresholdGreen: k.thresholdGreen,
          thresholdAmber: k.thresholdAmber,
          thresholdRed: k.thresholdRed,
          status: k.status,
          lastUpdated: new Date(),
          isActive: true,
          orgId: org.id,
        },
      })
      krisCreated++
    }
  }

  console.log(`KRIs ready: ${SEED_KRIS.length} total (${krisCreated} created)`)

  console.log('\n✅ Seed completed successfully!')
  console.log('\nYou can now log in with:')
  console.log('Email:    admin@demo.vytlrx.com')
  console.log('Password: Demo2026!')
  console.log('\nExpected dashboard state:')
  console.log('- 15 SA commercial property risks across 8 categories')
  console.log('- 5 KRIs (2 RED: vacancy, OHS; 2 AMBER: WALE, debt; 1 AMBER: satisfaction)')
  console.log('- Run "VytlRx Score" from dashboard to see initial score (~55-70 range)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
