/**
 * Industry-specific scoring profiles for South African businesses
 *
 * Each profile defines dimension weights, category importance multipliers,
 * and risk tolerance thresholds tailored to the industry.
 */

export interface IndustryProfile {
  id: string
  name: string
  description: string
  weights: {
    base: number
    controlQuality: number
    velocity: number
    correlation: number
    kriAlignment: number
  }
  categoryMultipliers: Record<string, number>
  thresholds: { low: number; medium: number; high: number }
  regulatoryFactors: string[]
}

/**
 * South African regulatory frameworks that apply across industries
 */
export const SA_REGULATORY_FRAMEWORKS = {
  KING_V: {
    name: 'King V Code',
    description: 'King V Report on Corporate Governance for South Africa',
    riskCategories: ['STRATEGIC', 'COMPLIANCE', 'OPERATIONAL'],
    weight: 1.15,
  },
  POPIA: {
    name: 'POPIA',
    description: 'Protection of Personal Information Act',
    riskCategories: ['COMPLIANCE', 'TECHNOLOGY'],
    weight: 1.2,
  },
  BBBEE: {
    name: 'B-BBEE',
    description: 'Broad-Based Black Economic Empowerment',
    riskCategories: ['COMPLIANCE', 'STRATEGIC', 'PEOPLE'],
    weight: 1.1,
  },
  NCA: {
    name: 'NCA',
    description: 'National Credit Act',
    riskCategories: ['COMPLIANCE', 'FINANCIAL'],
    weight: 1.15,
  },
  FICA: {
    name: 'FICA',
    description: 'Financial Intelligence Centre Act',
    riskCategories: ['COMPLIANCE', 'FINANCIAL'],
    weight: 1.2,
  },
} as const

const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  financial_services: {
    id: 'financial_services',
    name: 'Financial Services',
    description: 'Banks, insurers, asset managers, and fintech companies',
    weights: {
      base: 35,
      controlQuality: 25, // Higher: strict regulatory controls required
      velocity: 15,
      correlation: 10,
      kriAlignment: 15,   // Higher: KRI monitoring critical in finance
    },
    categoryMultipliers: {
      COMPLIANCE: 1.4,     // Heavily regulated sector
      FINANCIAL: 1.3,
      TECHNOLOGY: 1.2,     // Cybersecurity critical
      OPERATIONAL: 1.1,
      STRATEGIC: 1.0,
      REPUTATIONAL: 1.1,
      ENVIRONMENTAL: 0.8,
      PEOPLE: 0.9,
    },
    thresholds: { low: 20, medium: 45, high: 70 }, // Lower thresholds: less risk tolerance
    regulatoryFactors: ['KING_V', 'POPIA', 'FICA', 'NCA'],
  },

  mining_resources: {
    id: 'mining_resources',
    name: 'Mining & Resources',
    description: 'Mining, extraction, and natural resources companies',
    weights: {
      base: 40,
      controlQuality: 20,
      velocity: 10,
      correlation: 15,    // Higher: systemic safety risks
      kriAlignment: 15,
    },
    categoryMultipliers: {
      ENVIRONMENTAL: 1.5,  // Environmental impact paramount
      OPERATIONAL: 1.3,    // Safety-critical operations
      PEOPLE: 1.3,         // Worker safety
      COMPLIANCE: 1.2,     // Mining charter, MHSA
      STRATEGIC: 1.0,
      FINANCIAL: 1.0,
      TECHNOLOGY: 0.9,
      REPUTATIONAL: 1.1,
    },
    thresholds: { low: 20, medium: 45, high: 65 }, // Low tolerance for safety
    regulatoryFactors: ['KING_V', 'BBBEE'],
  },

  technology: {
    id: 'technology',
    name: 'Technology',
    description: 'Software, IT services, telecoms, and digital businesses',
    weights: {
      base: 35,
      controlQuality: 20,
      velocity: 20,       // Higher: fast-moving tech landscape
      correlation: 15,
      kriAlignment: 10,
    },
    categoryMultipliers: {
      TECHNOLOGY: 1.4,     // Core business risk
      COMPLIANCE: 1.2,     // POPIA, data protection
      REPUTATIONAL: 1.2,   // Data breaches, downtime
      STRATEGIC: 1.1,
      OPERATIONAL: 1.0,
      FINANCIAL: 0.9,
      PEOPLE: 1.1,         // Talent retention
      ENVIRONMENTAL: 0.7,
    },
    thresholds: { low: 25, medium: 50, high: 75 },
    regulatoryFactors: ['POPIA', 'KING_V'],
  },

  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Hospitals, clinics, pharma, and medical device companies',
    weights: {
      base: 40,
      controlQuality: 25, // Higher: patient safety requires rigorous controls
      velocity: 10,
      correlation: 10,
      kriAlignment: 15,
    },
    categoryMultipliers: {
      COMPLIANCE: 1.4,     // HPCSA, NHA, Medicines Act
      OPERATIONAL: 1.3,    // Patient safety
      PEOPLE: 1.2,         // Staff qualifications, ratios
      TECHNOLOGY: 1.1,     // Medical systems
      REPUTATIONAL: 1.2,
      FINANCIAL: 1.0,
      STRATEGIC: 0.9,
      ENVIRONMENTAL: 0.8,
    },
    thresholds: { low: 20, medium: 40, high: 65 }, // Low tolerance
    regulatoryFactors: ['POPIA', 'KING_V'],
  },

  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Industrial, automotive, FMCG, and production companies',
    weights: {
      base: 45,            // Higher: operational risk is primary
      controlQuality: 20,
      velocity: 10,
      correlation: 15,     // Supply chain interdependencies
      kriAlignment: 10,
    },
    categoryMultipliers: {
      OPERATIONAL: 1.4,    // Production, quality, safety
      FINANCIAL: 1.2,      // Input costs, forex
      STRATEGIC: 1.1,      // Supply chain
      ENVIRONMENTAL: 1.2,  // Emissions, waste
      PEOPLE: 1.1,         // Labour relations
      COMPLIANCE: 1.0,
      TECHNOLOGY: 0.9,
      REPUTATIONAL: 0.9,
    },
    thresholds: { low: 25, medium: 50, high: 70 },
    regulatoryFactors: ['KING_V', 'BBBEE'],
  },

  retail: {
    id: 'retail',
    name: 'Retail & Consumer',
    description: 'Retail chains, e-commerce, and consumer goods companies',
    weights: {
      base: 40,
      controlQuality: 15,
      velocity: 20,       // Higher: fast-moving consumer trends
      correlation: 15,
      kriAlignment: 10,
    },
    categoryMultipliers: {
      REPUTATIONAL: 1.4,   // Brand critical
      FINANCIAL: 1.3,      // Margins, cash flow
      OPERATIONAL: 1.2,    // Supply chain, logistics
      TECHNOLOGY: 1.1,     // E-commerce, POS systems
      STRATEGIC: 1.0,
      COMPLIANCE: 1.0,     // Consumer protection
      PEOPLE: 0.9,
      ENVIRONMENTAL: 0.8,
    },
    thresholds: { low: 25, medium: 50, high: 75 },
    regulatoryFactors: ['POPIA', 'KING_V', 'BBBEE'],
  },
}

/**
 * Get industry profile by ID
 */
export function getIndustryProfile(industryId: string): IndustryProfile | null {
  return INDUSTRY_PROFILES[industryId] || null
}

/**
 * Get all available industry profiles
 */
export function getAllIndustryProfiles(): IndustryProfile[] {
  return Object.values(INDUSTRY_PROFILES)
}

/**
 * Get applicable SA regulatory factors for an industry
 */
export function getRegulatorFactors(industryId: string) {
  const profile = INDUSTRY_PROFILES[industryId]
  if (!profile) return []

  return profile.regulatoryFactors.map(key => {
    const framework = SA_REGULATORY_FRAMEWORKS[key as keyof typeof SA_REGULATORY_FRAMEWORKS]
    return framework || null
  }).filter(Boolean)
}
