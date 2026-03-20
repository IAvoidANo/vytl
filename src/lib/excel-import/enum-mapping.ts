/**
 * enum-mapping.ts — INC-005: Excel import enum normalization
 *
 * Pure functions (no DOM, no DB, no XLSX).
 * Converts free-text category/status values from Excel files into canonical
 * Prisma enum strings with confidence levels.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskCategory =
  | 'TECHNOLOGY'
  | 'COMPLIANCE'
  | 'PEOPLE'
  | 'STRATEGIC'
  | 'OPERATIONAL'
  | 'FINANCIAL'
  | 'REPUTATIONAL'
  | 'ENVIRONMENTAL'
  | 'HEALTH_SAFETY'

export type RiskStatus = 'OPEN' | 'IN_PROGRESS' | 'MONITORING' | 'CLOSED' | 'ARCHIVED'

export type WorkflowStatus = 'INBOX' | 'TRIAGE' | 'ASSIGNED' | 'APPROVED'

export type MappingConfidence = 'exact' | 'fuzzy' | 'failed'

export interface MappingResult<T extends string> {
  /** Canonical enum value (or default on failure) */
  value: T
  /** Raw string from the source file */
  originalValue: string
  /** Which canonical value was matched */
  mappedTo: T | null
  /** How the match was made */
  confidence: MappingConfidence
  /** Levenshtein distance (only set for fuzzy matches) */
  distance?: number
  /** Human-readable warning for the preview UI */
  warning?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise to lowercase, trim, collapse whitespace, strip common punctuation */
export function normalizeText(raw: string): string {
  return raw
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\-_]+/g, ' ')   // hyphens / underscores → space
    .replace(/\s+/g, ' ')       // collapse multiple spaces
    .replace(/[^a-z0-9 ]/g, '') // strip any other non-alphanumeric (except space)
}

/** Standard Levenshtein edit distance (pure iterative, O(n*m)) */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  // Build a (m+1) × (n+1) matrix using only two rows to save memory
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

// ─── Category mappings ────────────────────────────────────────────────────────

/**
 * Maps normalised free-text → canonical RiskCategory enum.
 * Keys must already be normalised via normalizeText().
 */
export const CATEGORY_MAPPINGS: Record<string, RiskCategory> = {
  // TECHNOLOGY ─────────────────────────────────────────────
  'technology':                      'TECHNOLOGY',
  'tech':                            'TECHNOLOGY',
  'it':                              'TECHNOLOGY',
  'information technology':          'TECHNOLOGY',
  'information systems':             'TECHNOLOGY',
  'cyber':                           'TECHNOLOGY',
  'cybersecurity':                   'TECHNOLOGY',
  'cyber security':                  'TECHNOLOGY',
  'cyb':                             'TECHNOLOGY',
  'data':                            'TECHNOLOGY',
  'data security':                   'TECHNOLOGY',
  'digital':                         'TECHNOLOGY',
  'digital risk':                    'TECHNOLOGY',
  'systems':                         'TECHNOLOGY',
  'software':                        'TECHNOLOGY',
  'infrastructure':                  'TECHNOLOGY',
  'it risk':                         'TECHNOLOGY',
  'ict':                             'TECHNOLOGY',
  'tech risk':                       'TECHNOLOGY',
  'technical':                       'TECHNOLOGY',

  // COMPLIANCE ─────────────────────────────────────────────
  'compliance':                      'COMPLIANCE',
  'com':                             'COMPLIANCE',
  'regulatory':                      'COMPLIANCE',
  'regulation':                      'COMPLIANCE',
  'legal':                           'COMPLIANCE',
  'legal and compliance':            'COMPLIANCE',
  'legal compliance':                'COMPLIANCE',
  'regulatory compliance':           'COMPLIANCE',
  'governance':                      'COMPLIANCE',
  'audit':                           'COMPLIANCE',
  'audit and compliance':            'COMPLIANCE',
  'statutory':                       'COMPLIANCE',
  'licensing':                       'COMPLIANCE',
  'popia':                           'COMPLIANCE',
  'fica':                            'COMPLIANCE',
  'gdpr':                            'COMPLIANCE',
  'risk and compliance':             'COMPLIANCE',
  'policy':                          'COMPLIANCE',

  // PEOPLE ──────────────────────────────────────────────────
  'people':                          'PEOPLE',
  'human resources':                 'PEOPLE',
  'hr':                              'PEOPLE',
  'hrm':                             'PEOPLE',
  'human capital':                   'PEOPLE',
  'workforce':                       'PEOPLE',
  'staff':                           'PEOPLE',
  'talent':                          'PEOPLE',
  'talent management':               'PEOPLE',
  'employee':                        'PEOPLE',
  'employees':                       'PEOPLE',
  'personnel':                       'PEOPLE',
  'labor':                           'PEOPLE',
  'labour':                          'PEOPLE',
  'people risk':                     'PEOPLE',
  'culture':                         'PEOPLE',
  'conduct':                         'PEOPLE',
  'skills':                          'PEOPLE',

  // STRATEGIC ───────────────────────────────────────────────
  'strategic':                       'STRATEGIC',
  'strategy':                        'STRATEGIC',
  'str':                             'STRATEGIC',
  'strategic risk':                  'STRATEGIC',
  'business strategy':               'STRATEGIC',
  'market':                          'STRATEGIC',
  'competitive':                     'STRATEGIC',
  'competition':                     'STRATEGIC',
  'macro':                           'STRATEGIC',
  'macroeconomic':                   'STRATEGIC',
  'geopolitical':                    'STRATEGIC',
  'political':                       'STRATEGIC',
  'innovation':                      'STRATEGIC',
  'change':                          'STRATEGIC',
  'change management':               'STRATEGIC',

  // OPERATIONAL ─────────────────────────────────────────────
  'operational':                     'OPERATIONAL',
  'operations':                      'OPERATIONAL',
  'ops':                             'OPERATIONAL',
  'process':                         'OPERATIONAL',
  'processes':                       'OPERATIONAL',
  'business operations':             'OPERATIONAL',
  'operational risk':                'OPERATIONAL',
  'supply chain':                    'OPERATIONAL',
  'logistics':                       'OPERATIONAL',
  'vendor':                          'OPERATIONAL',
  'third party':                     'OPERATIONAL',
  'third party risk':                'OPERATIONAL',
  'business continuity':             'OPERATIONAL',
  'continuity':                      'OPERATIONAL',
  'bcp':                             'OPERATIONAL',
  'fraud':                           'OPERATIONAL',
  'operational fraud':               'OPERATIONAL',

  // FINANCIAL ───────────────────────────────────────────────
  'financial':                       'FINANCIAL',
  'finance':                         'FINANCIAL',
  'fin':                             'FINANCIAL',
  'financial risk':                  'FINANCIAL',
  'credit':                          'FINANCIAL',
  'credit risk':                     'FINANCIAL',
  'liquidity':                       'FINANCIAL',
  'liquidity risk':                  'FINANCIAL',
  'market risk':                     'FINANCIAL',  // overloaded — financial context wins
  'currency':                        'FINANCIAL',
  'fx':                              'FINANCIAL',
  'forex':                           'FINANCIAL',
  'foreign exchange':                'FINANCIAL',
  'interest rate':                   'FINANCIAL',
  'capital':                         'FINANCIAL',
  'treasury':                        'FINANCIAL',
  'tax':                             'FINANCIAL',
  'taxation':                        'FINANCIAL',
  'financial reporting':             'FINANCIAL',
  'reporting':                       'FINANCIAL',

  // REPUTATIONAL ────────────────────────────────────────────
  'reputational':                    'REPUTATIONAL',
  'reputation':                      'REPUTATIONAL',
  'rep':                             'REPUTATIONAL',
  'brand':                           'REPUTATIONAL',
  'brand risk':                      'REPUTATIONAL',
  'reputational risk':               'REPUTATIONAL',
  'public relations':                'REPUTATIONAL',
  'pr':                              'REPUTATIONAL',
  'media':                           'REPUTATIONAL',
  'social media':                    'REPUTATIONAL',
  'stakeholder':                     'REPUTATIONAL',
  'customer':                        'REPUTATIONAL',
  'trust':                           'REPUTATIONAL',
  'image':                           'REPUTATIONAL',

  // ENVIRONMENTAL ───────────────────────────────────────────
  'environmental':                   'ENVIRONMENTAL',
  'environment':                     'ENVIRONMENTAL',
  'env':                             'ENVIRONMENTAL',
  'esg':                             'ENVIRONMENTAL',
  'climate':                         'ENVIRONMENTAL',
  'climate change':                  'ENVIRONMENTAL',
  'sustainability':                  'ENVIRONMENTAL',
  'natural disaster':                'ENVIRONMENTAL',
  'natural':                         'ENVIRONMENTAL',
  'weather':                         'ENVIRONMENTAL',
  'carbon':                          'ENVIRONMENTAL',
  'emissions':                       'ENVIRONMENTAL',
  'waste':                           'ENVIRONMENTAL',
  'pollution':                       'ENVIRONMENTAL',
  'water':                           'ENVIRONMENTAL',
  'energy':                          'ENVIRONMENTAL',

  // HEALTH_SAFETY ───────────────────────────────────────────
  'health safety':                   'HEALTH_SAFETY',
  'health and safety':               'HEALTH_SAFETY',
  'health & safety':                 'HEALTH_SAFETY',
  'safety':                          'HEALTH_SAFETY',
  'ohs':                             'HEALTH_SAFETY',
  'ohs act':                         'HEALTH_SAFETY',
  'occupational health':             'HEALTH_SAFETY',
  'occupational health and safety':  'HEALTH_SAFETY',
  'occupational safety':             'HEALTH_SAFETY',
  'hse':                             'HEALTH_SAFETY',
  'workplace safety':                'HEALTH_SAFETY',
  'safety risk':                     'HEALTH_SAFETY',
  'health risk':                     'HEALTH_SAFETY',
  'injury':                          'HEALTH_SAFETY',
  'accident':                        'HEALTH_SAFETY',
  'wellness':                        'HEALTH_SAFETY',
}

// Canonical enum values for direct-match detection
export const RISK_CATEGORIES: RiskCategory[] = [
  'TECHNOLOGY', 'COMPLIANCE', 'PEOPLE', 'STRATEGIC',
  'OPERATIONAL', 'FINANCIAL', 'REPUTATIONAL', 'ENVIRONMENTAL', 'HEALTH_SAFETY',
]

// ─── Status mappings ──────────────────────────────────────────────────────────

/**
 * Maps normalised free-text → RiskStatus + WorkflowStatus pair.
 * Either field may be undefined (caller uses its own default for that field).
 */
export interface StatusPair {
  status: RiskStatus
  workflowStatus: WorkflowStatus
}

export const STATUS_MAPPINGS: Record<string, StatusPair> = {
  // OPEN ───────────────────────────────────────────────────
  'open':                { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'new':                 { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'pending':             { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'identified':          { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'raised':              { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'logged':              { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'active':              { status: 'OPEN',        workflowStatus: 'APPROVED'  },
  'live':                { status: 'OPEN',        workflowStatus: 'APPROVED'  },
  'current':             { status: 'OPEN',        workflowStatus: 'APPROVED'  },
  'draft':               { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'open risk':           { status: 'OPEN',        workflowStatus: 'INBOX'     },
  'inbox':               { status: 'OPEN',        workflowStatus: 'INBOX'     },

  // IN_PROGRESS ────────────────────────────────────────────
  'in progress':         { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'in progression':      { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'in treatment':        { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'being treated':       { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'treating':            { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'treatment':           { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'in action':           { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'remediation':         { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'remediating':         { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'assigned':            { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'working':             { status: 'IN_PROGRESS', workflowStatus: 'ASSIGNED'  },
  'in review':           { status: 'IN_PROGRESS', workflowStatus: 'TRIAGE'    },
  'under review':        { status: 'IN_PROGRESS', workflowStatus: 'TRIAGE'    },
  'review':              { status: 'IN_PROGRESS', workflowStatus: 'TRIAGE'    },
  'triage':              { status: 'OPEN',        workflowStatus: 'TRIAGE'    },
  'triaging':            { status: 'OPEN',        workflowStatus: 'TRIAGE'    },

  // MONITORING ─────────────────────────────────────────────
  'monitoring':          { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'monitor':             { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'watch':               { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'on watch':            { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'tracked':             { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'tracking':            { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'under monitoring':    { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'accepted':            { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'residual':            { status: 'MONITORING',  workflowStatus: 'APPROVED'  },
  'approved':            { status: 'OPEN',        workflowStatus: 'APPROVED'  },

  // CLOSED ─────────────────────────────────────────────────
  'closed':              { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'close':               { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'complete':            { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'completed':           { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'done':                { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'finished':            { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'resolved':            { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'remediated':          { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'mitigated':           { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'treated':             { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'risk closed':         { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'not applicable':      { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'na':                  { status: 'CLOSED',      workflowStatus: 'APPROVED'  },
  'n a':                 { status: 'CLOSED',      workflowStatus: 'APPROVED'  },

  // ARCHIVED ───────────────────────────────────────────────
  'archived':            { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
  'archive':             { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
  'historical':          { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
  'history':             { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
  'retired':             { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
  'superseded':          { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
  'obsolete':            { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
  'inactive':            { status: 'ARCHIVED',    workflowStatus: 'APPROVED'  },
}

export const RISK_STATUSES: RiskStatus[] = ['OPEN', 'IN_PROGRESS', 'MONITORING', 'CLOSED', 'ARCHIVED']

// ─── Workflow status standalone mappings ──────────────────────────────────────

export const WORKFLOW_STATUS_MAPPINGS: Record<string, WorkflowStatus> = {
  'inbox':          'INBOX',
  'new':            'INBOX',
  'received':       'INBOX',
  'unassigned':     'INBOX',
  'triage':         'TRIAGE',
  'triaging':       'TRIAGE',
  'under review':   'TRIAGE',
  'in review':      'TRIAGE',
  'review':         'TRIAGE',
  'pending review': 'TRIAGE',
  'assigned':       'ASSIGNED',
  'in progress':    'ASSIGNED',
  'in treatment':   'ASSIGNED',
  'working':        'ASSIGNED',
  'approved':       'APPROVED',
  'complete':       'APPROVED',
  'completed':      'APPROVED',
  'closed':         'APPROVED',
  'live':           'APPROVED',
  'active':         'APPROVED',
  'monitoring':     'APPROVED',
}

export const WORKFLOW_STATUSES: WorkflowStatus[] = ['INBOX', 'TRIAGE', 'ASSIGNED', 'APPROVED']

// ─── Fuzzy matching helpers ───────────────────────────────────────────────────

const MAX_FUZZY_DISTANCE = 3

/**
 * Find the closest key in a lookup map using Levenshtein distance.
 * Returns null if no key is within MAX_FUZZY_DISTANCE.
 */
function findFuzzyKey<T extends string>(
  normalized: string,
  map: Record<string, T>,
): { key: string; value: T; distance: number } | null {
  let best: { key: string; value: T; distance: number } | null = null
  for (const key of Object.keys(map)) {
    const d = levenshteinDistance(normalized, key)
    if (d <= MAX_FUZZY_DISTANCE && (best === null || d < best.distance)) {
      best = { key, value: map[key], distance: d }
    }
  }
  return best
}

// ─── normalizeCategory ───────────────────────────────────────────────────────

/**
 * Convert a free-text category string to a canonical RiskCategory.
 *
 * Resolution order:
 *   1. Empty / blank → default (OPERATIONAL) with no warning
 *   2. Direct enum match (case-insensitive, ignores spaces/underscores)
 *   3. Exact alias table lookup after normalizeText()
 *   4. Fuzzy alias lookup (Levenshtein ≤ 3)
 *   5. 3-char prefix match against canonical enum list
 *   6. Fallback: OPERATIONAL with warning
 */
export function normalizeCategory(
  raw: string | undefined | null,
  defaultValue: RiskCategory = 'OPERATIONAL',
): MappingResult<RiskCategory> {
  const original = raw?.toString() ?? ''
  if (!original.trim()) {
    return { value: defaultValue, originalValue: original, mappedTo: null, confidence: 'failed' }
  }

  const normalized = normalizeText(original)
  const upper = normalized.toUpperCase().replace(/ /g, '_') as RiskCategory

  // 1. Direct enum match (e.g. "TECHNOLOGY" or "health_safety")
  if (RISK_CATEGORIES.includes(upper)) {
    return { value: upper, originalValue: original, mappedTo: upper, confidence: 'exact' }
  }

  // 2. Exact alias table
  const aliasMatch = CATEGORY_MAPPINGS[normalized]
  if (aliasMatch) {
    return { value: aliasMatch, originalValue: original, mappedTo: aliasMatch, confidence: 'exact' }
  }

  // 3. Fuzzy alias lookup
  const fuzzy = findFuzzyKey(normalized, CATEGORY_MAPPINGS)
  if (fuzzy) {
    return {
      value: fuzzy.value,
      originalValue: original,
      mappedTo: fuzzy.value,
      confidence: 'fuzzy',
      distance: fuzzy.distance,
      warning: `Category "${original}" fuzzy-matched to ${fuzzy.value} (distance ${fuzzy.distance})`,
    }
  }

  // 4. 3-char prefix fallback against canonical list
  const prefix = upper.substring(0, 3)
  const prefixMatch = RISK_CATEGORIES.find(c => c.startsWith(prefix))
  if (prefixMatch) {
    return {
      value: prefixMatch,
      originalValue: original,
      mappedTo: prefixMatch,
      confidence: 'fuzzy',
      warning: `Category "${original}" prefix-matched to ${prefixMatch}`,
    }
  }

  return {
    value: defaultValue,
    originalValue: original,
    mappedTo: null,
    confidence: 'failed',
    warning: `Unknown category "${original}" — defaulted to ${defaultValue}`,
  }
}

// ─── normalizeStatus ─────────────────────────────────────────────────────────

/**
 * Convert a free-text status string to a RiskStatus + WorkflowStatus pair.
 *
 * Resolution order:
 *   1. Empty / blank → empty result (caller applies own defaults)
 *   2. Direct enum match for RiskStatus (upper-cased after normalizeText)
 *   3. Exact alias table lookup
 *   4. Fuzzy alias lookup (Levenshtein ≤ 3)
 *   5. Substring keywords (progress, monitor, clos, archiv, open)
 *   6. Fallback: undefined fields with warning
 */
export function normalizeStatus(raw: string | undefined | null): {
  status?: RiskStatus
  workflowStatus?: WorkflowStatus
  confidence: MappingConfidence
  originalValue: string
  warning?: string
} {
  const original = raw?.toString() ?? ''
  if (!original.trim()) {
    return { originalValue: original, confidence: 'failed' }
  }

  const normalized = normalizeText(original)
  const upper = normalized.toUpperCase().replace(/ /g, '_') as RiskStatus

  // 1. Direct enum match
  if (RISK_STATUSES.includes(upper)) {
    const pair = STATUS_MAPPINGS[normalized] ?? STATUS_MAPPINGS[upper.toLowerCase()] ?? null
    return {
      status: upper,
      workflowStatus: pair?.workflowStatus,
      originalValue: original,
      confidence: 'exact',
    }
  }

  // 2. Exact alias table
  const aliasMatch = STATUS_MAPPINGS[normalized]
  if (aliasMatch) {
    return { ...aliasMatch, originalValue: original, confidence: 'exact' }
  }

  // 3. Fuzzy alias lookup
  const fuzzy = findFuzzyKey(normalized, STATUS_MAPPINGS as unknown as Record<string, RiskStatus>)
  if (fuzzy) {
    const fuzzyPair = STATUS_MAPPINGS[fuzzy.key]
    return {
      ...fuzzyPair,
      originalValue: original,
      confidence: 'fuzzy',
      warning: `Status "${original}" fuzzy-matched to ${fuzzyPair.status} (distance ${fuzzy.distance})`,
    }
  }

  // 4. Substring keyword fallback
  if (normalized.includes('progress') || normalized.includes('treat') || normalized.includes('remediat')) {
    return { status: 'IN_PROGRESS', originalValue: original, confidence: 'fuzzy',
      warning: `Status "${original}" keyword-matched to IN_PROGRESS` }
  }
  if (normalized.includes('monitor') || normalized.includes('watch')) {
    return { status: 'MONITORING', originalValue: original, confidence: 'fuzzy',
      warning: `Status "${original}" keyword-matched to MONITORING` }
  }
  if (normalized.includes('clos') || normalized.includes('done') || normalized.includes('complet')) {
    return { status: 'CLOSED', originalValue: original, confidence: 'fuzzy',
      warning: `Status "${original}" keyword-matched to CLOSED` }
  }
  if (normalized.includes('archiv') || normalized.includes('histor') || normalized.includes('retir')) {
    return { status: 'ARCHIVED', originalValue: original, confidence: 'fuzzy',
      warning: `Status "${original}" keyword-matched to ARCHIVED` }
  }
  if (normalized.includes('open') || normalized.includes('new') || normalized.includes('identif')) {
    return { status: 'OPEN', originalValue: original, confidence: 'fuzzy',
      warning: `Status "${original}" keyword-matched to OPEN` }
  }

  return {
    originalValue: original,
    confidence: 'failed',
    warning: `Unknown status "${original}" — will use defaults`,
  }
}

// ─── normalizeWorkflowStatus ──────────────────────────────────────────────────

export function normalizeWorkflowStatus(
  raw: string | undefined | null,
  defaultValue: WorkflowStatus = 'INBOX',
): MappingResult<WorkflowStatus> {
  const original = raw?.toString() ?? ''
  if (!original.trim()) {
    return { value: defaultValue, originalValue: original, mappedTo: null, confidence: 'failed' }
  }

  const normalized = normalizeText(original)
  const upper = normalized.toUpperCase().replace(/ /g, '_') as WorkflowStatus

  // Direct enum match
  if (WORKFLOW_STATUSES.includes(upper)) {
    return { value: upper, originalValue: original, mappedTo: upper, confidence: 'exact' }
  }

  // Exact alias table
  const aliasMatch = WORKFLOW_STATUS_MAPPINGS[normalized]
  if (aliasMatch) {
    return { value: aliasMatch, originalValue: original, mappedTo: aliasMatch, confidence: 'exact' }
  }

  // Fuzzy alias lookup
  const fuzzy = findFuzzyKey(normalized, WORKFLOW_STATUS_MAPPINGS)
  if (fuzzy) {
    return {
      value: fuzzy.value,
      originalValue: original,
      mappedTo: fuzzy.value,
      confidence: 'fuzzy',
      distance: fuzzy.distance,
      warning: `Workflow status "${original}" fuzzy-matched to ${fuzzy.value} (distance ${fuzzy.distance})`,
    }
  }

  return {
    value: defaultValue,
    originalValue: original,
    mappedTo: null,
    confidence: 'failed',
    warning: `Unknown workflow status "${original}" — defaulted to ${defaultValue}`,
  }
}

// ─── Batch functions ──────────────────────────────────────────────────────────

/**
 * Normalize an array of raw category strings, returning a results array in the
 * same order. Useful for processing a whole column at once.
 */
export function normalizeCategories(
  raws: (string | undefined | null)[],
  defaultValue: RiskCategory = 'OPERATIONAL',
): MappingResult<RiskCategory>[] {
  return raws.map(r => normalizeCategory(r, defaultValue))
}

/**
 * Normalize an array of raw status strings.
 */
export function normalizeStatuses(raws: (string | undefined | null)[]): ReturnType<typeof normalizeStatus>[] {
  return raws.map(r => normalizeStatus(r))
}
