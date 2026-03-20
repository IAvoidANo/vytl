/**
 * tests/excel-import/enum-normalization.test.ts
 * INC-005 — Enum Normalization Fix
 *
 * Pure-function tests — no DB, no DOM, no router imports.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  levenshteinDistance,
  normalizeCategory,
  normalizeStatus,
  normalizeWorkflowStatus,
  normalizeCategories,
  normalizeStatuses,
  CATEGORY_MAPPINGS,
  STATUS_MAPPINGS,
  WORKFLOW_STATUS_MAPPINGS,
  RISK_CATEGORIES,
  RISK_STATUSES,
  WORKFLOW_STATUSES,
} from '../../src/lib/excel-import/enum-mapping'

// ─── normalizeText ────────────────────────────────────────────────────────────

describe('normalizeText', () => {
  it('lowercases input', () => {
    expect(normalizeText('TECHNOLOGY')).toBe('technology')
  })

  it('trims leading/trailing whitespace', () => {
    expect(normalizeText('  financial  ')).toBe('financial')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeText('health  and  safety')).toBe('health and safety')
  })

  it('converts hyphens to spaces', () => {
    expect(normalizeText('health-safety')).toBe('health safety')
  })

  it('converts underscores to spaces', () => {
    expect(normalizeText('in_progress')).toBe('in progress')
  })

  it('strips non-alphanumeric chars (except space)', () => {
    expect(normalizeText('Health & Safety!')).toBe('health  safety')
  })
})

// ─── levenshteinDistance ──────────────────────────────────────────────────────

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('open', 'open')).toBe(0)
  })

  it('returns length for empty vs non-empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3)
    expect(levenshteinDistance('abc', '')).toBe(3)
  })

  it('computes single deletion', () => {
    expect(levenshteinDistance('closed', 'close')).toBe(1)
  })

  it('computes single insertion', () => {
    expect(levenshteinDistance('open', 'opens')).toBe(1)
  })

  it('computes single substitution', () => {
    expect(levenshteinDistance('open', 'open')).toBe(0)
    expect(levenshteinDistance('monitorig', 'monitoring')).toBe(1)
  })

  it('handles transposition', () => {
    // "archved" vs "archived" — 1 insert
    expect(levenshteinDistance('archved', 'archived')).toBe(1)
  })

  it('returns high value for completely different strings', () => {
    expect(levenshteinDistance('financial', 'xyz')).toBeGreaterThan(5)
  })
})

// ─── normalizeCategory ────────────────────────────────────────────────────────

describe('normalizeCategory — exact matches', () => {
  it('passes through uppercase enum values directly', () => {
    const result = normalizeCategory('TECHNOLOGY')
    expect(result.value).toBe('TECHNOLOGY')
    expect(result.confidence).toBe('exact')
    expect(result.mappedTo).toBe('TECHNOLOGY')
  })

  it('handles lowercase enum value', () => {
    const result = normalizeCategory('financial')
    expect(result.value).toBe('FINANCIAL')
    expect(result.confidence).toBe('exact')
  })

  it('handles HEALTH_SAFETY with underscore', () => {
    const result = normalizeCategory('HEALTH_SAFETY')
    expect(result.value).toBe('HEALTH_SAFETY')
    expect(result.confidence).toBe('exact')
  })

  it('maps "cyber security" to TECHNOLOGY', () => {
    const result = normalizeCategory('cyber security')
    expect(result.value).toBe('TECHNOLOGY')
    expect(result.confidence).toBe('exact')
  })

  it('maps "hr" to PEOPLE', () => {
    expect(normalizeCategory('hr').value).toBe('PEOPLE')
  })

  it('maps "ohs" to HEALTH_SAFETY', () => {
    expect(normalizeCategory('ohs').value).toBe('HEALTH_SAFETY')
  })

  it('maps "health and safety" to HEALTH_SAFETY', () => {
    expect(normalizeCategory('health and safety').value).toBe('HEALTH_SAFETY')
  })

  it('maps "esg" to ENVIRONMENTAL', () => {
    expect(normalizeCategory('esg').value).toBe('ENVIRONMENTAL')
  })

  it('maps "regulatory" to COMPLIANCE', () => {
    expect(normalizeCategory('regulatory').value).toBe('COMPLIANCE')
  })

  it('maps "workforce" to PEOPLE', () => {
    expect(normalizeCategory('workforce').value).toBe('PEOPLE')
  })

  it('maps "ops" abbreviation to OPERATIONAL', () => {
    expect(normalizeCategory('ops').value).toBe('OPERATIONAL')
  })

  it('maps "fin" abbreviation to FINANCIAL', () => {
    expect(normalizeCategory('fin').value).toBe('FINANCIAL')
  })
})

describe('normalizeCategory — fuzzy / fallback', () => {
  it('fuzzy-matches "tecnology" (typo) to TECHNOLOGY', () => {
    const result = normalizeCategory('tecnology')
    // After normalizeText: "tecnology"; Levenshtein distance to "technology" = 1
    expect(result.value).toBe('TECHNOLOGY')
    expect(result.confidence).toBe('fuzzy')
    expect(result.distance).toBeDefined()
  })

  it('fuzzy-matches "compiance" (typo) to COMPLIANCE', () => {
    const result = normalizeCategory('compiance')
    expect(result.value).toBe('COMPLIANCE')
    expect(result.confidence).toBe('fuzzy')
  })

  it('returns default OPERATIONAL for unknown value', () => {
    const result = normalizeCategory('xyzunknown123')
    expect(result.value).toBe('OPERATIONAL')
    expect(result.confidence).toBe('failed')
    expect(result.warning).toMatch(/Unknown category/)
  })

  it('returns default for empty string', () => {
    const result = normalizeCategory('')
    expect(result.value).toBe('OPERATIONAL')
    expect(result.confidence).toBe('failed')
    expect(result.warning).toBeUndefined()
  })

  it('returns default for null/undefined', () => {
    expect(normalizeCategory(null).value).toBe('OPERATIONAL')
    expect(normalizeCategory(undefined).value).toBe('OPERATIONAL')
  })

  it('accepts custom default value', () => {
    const result = normalizeCategory('', 'STRATEGIC')
    expect(result.value).toBe('STRATEGIC')
  })
})

// ─── normalizeStatus ──────────────────────────────────────────────────────────

describe('normalizeStatus — exact matches', () => {
  it('maps "open" to OPEN + INBOX', () => {
    const result = normalizeStatus('open')
    expect(result.status).toBe('OPEN')
    expect(result.workflowStatus).toBe('INBOX')
    expect(result.confidence).toBe('exact')
  })

  it('maps "OPEN" (uppercase) correctly', () => {
    const result = normalizeStatus('OPEN')
    expect(result.status).toBe('OPEN')
    expect(result.confidence).toBe('exact')
  })

  it('maps "active" to OPEN + APPROVED', () => {
    const result = normalizeStatus('active')
    expect(result.status).toBe('OPEN')
    expect(result.workflowStatus).toBe('APPROVED')
  })

  it('maps "in progress" to IN_PROGRESS + ASSIGNED', () => {
    const result = normalizeStatus('in progress')
    expect(result.status).toBe('IN_PROGRESS')
    expect(result.workflowStatus).toBe('ASSIGNED')
    expect(result.confidence).toBe('exact')
  })

  it('maps "monitoring" to MONITORING + APPROVED', () => {
    const result = normalizeStatus('monitoring')
    expect(result.status).toBe('MONITORING')
    expect(result.workflowStatus).toBe('APPROVED')
  })

  it('maps "closed" to CLOSED + APPROVED', () => {
    const result = normalizeStatus('closed')
    expect(result.status).toBe('CLOSED')
    expect(result.workflowStatus).toBe('APPROVED')
  })

  it('maps "archived" to ARCHIVED + APPROVED', () => {
    const result = normalizeStatus('archived')
    expect(result.status).toBe('ARCHIVED')
    expect(result.workflowStatus).toBe('APPROVED')
  })

  it('maps "completed" to CLOSED', () => {
    expect(normalizeStatus('completed').status).toBe('CLOSED')
  })

  it('maps "triage" to OPEN + TRIAGE', () => {
    const result = normalizeStatus('triage')
    expect(result.status).toBe('OPEN')
    expect(result.workflowStatus).toBe('TRIAGE')
  })

  it('maps "under review" to IN_PROGRESS + TRIAGE', () => {
    const result = normalizeStatus('under review')
    expect(result.status).toBe('IN_PROGRESS')
    expect(result.workflowStatus).toBe('TRIAGE')
  })

  it('maps "assigned" to IN_PROGRESS + ASSIGNED', () => {
    const result = normalizeStatus('assigned')
    expect(result.status).toBe('IN_PROGRESS')
    expect(result.workflowStatus).toBe('ASSIGNED')
  })
})

describe('normalizeStatus — fuzzy / keyword fallback', () => {
  it('keyword-matches "in-progress" (hyphenated) to IN_PROGRESS', () => {
    const result = normalizeStatus('in-progress')
    expect(result.status).toBe('IN_PROGRESS')
    expect(result.confidence).not.toBe('failed')
  })

  it('keyword-matches text containing "monitor" to MONITORING', () => {
    const result = normalizeStatus('needs monitoring')
    expect(result.status).toBe('MONITORING')
  })

  it('keyword-matches "risk closed" to CLOSED', () => {
    const result = normalizeStatus('risk closed')
    expect(result.status).toBe('CLOSED')
  })

  it('keyword-matches "historical" to ARCHIVED', () => {
    const result = normalizeStatus('historical')
    expect(result.status).toBe('ARCHIVED')
  })

  it('returns empty result for empty input', () => {
    const result = normalizeStatus('')
    expect(result.status).toBeUndefined()
    expect(result.workflowStatus).toBeUndefined()
    expect(result.confidence).toBe('failed')
  })

  it('returns undefined fields for completely unknown status', () => {
    const result = normalizeStatus('purple')
    expect(result.status).toBeUndefined()
    expect(result.confidence).toBe('failed')
    expect(result.warning).toMatch(/Unknown status/)
  })
})

// ─── normalizeWorkflowStatus ──────────────────────────────────────────────────

describe('normalizeWorkflowStatus', () => {
  it('passes through "INBOX" directly', () => {
    const result = normalizeWorkflowStatus('INBOX')
    expect(result.value).toBe('INBOX')
    expect(result.confidence).toBe('exact')
  })

  it('maps "triage" to TRIAGE', () => {
    expect(normalizeWorkflowStatus('triage').value).toBe('TRIAGE')
  })

  it('maps "assigned" to ASSIGNED', () => {
    expect(normalizeWorkflowStatus('assigned').value).toBe('ASSIGNED')
  })

  it('maps "approved" to APPROVED', () => {
    expect(normalizeWorkflowStatus('approved').value).toBe('APPROVED')
  })

  it('maps "under review" to TRIAGE', () => {
    expect(normalizeWorkflowStatus('under review').value).toBe('TRIAGE')
  })

  it('maps "monitoring" to APPROVED', () => {
    expect(normalizeWorkflowStatus('monitoring').value).toBe('APPROVED')
  })

  it('returns default INBOX for empty input', () => {
    const result = normalizeWorkflowStatus('')
    expect(result.value).toBe('INBOX')
    expect(result.confidence).toBe('failed')
  })

  it('returns custom default for unknown value', () => {
    const result = normalizeWorkflowStatus('unknown_xyz', 'TRIAGE')
    expect(result.confidence).toBe('failed')
    expect(result.value).toBe('TRIAGE')
  })
})

// ─── Batch functions ──────────────────────────────────────────────────────────

describe('normalizeCategories', () => {
  it('processes an array and returns results in order', () => {
    const results = normalizeCategories(['TECHNOLOGY', 'hr', 'fin', 'unknown'])
    expect(results).toHaveLength(4)
    expect(results[0].value).toBe('TECHNOLOGY')
    expect(results[1].value).toBe('PEOPLE')
    expect(results[2].value).toBe('FINANCIAL')
    expect(results[3].confidence).toBe('failed')
  })

  it('handles mixed undefined/null in batch', () => {
    const results = normalizeCategories([null, undefined, 'compliance'])
    expect(results[0].value).toBe('OPERATIONAL')
    expect(results[1].value).toBe('OPERATIONAL')
    expect(results[2].value).toBe('COMPLIANCE')
  })
})

describe('normalizeStatuses', () => {
  it('processes an array of statuses', () => {
    const results = normalizeStatuses(['open', 'monitoring', 'closed', ''])
    expect(results[0].status).toBe('OPEN')
    expect(results[1].status).toBe('MONITORING')
    expect(results[2].status).toBe('CLOSED')
    expect(results[3].status).toBeUndefined()
  })
})

// ─── Mapping table integrity ──────────────────────────────────────────────────

describe('mapping table integrity', () => {
  it('all CATEGORY_MAPPINGS values are valid RiskCategory enum values', () => {
    for (const [key, value] of Object.entries(CATEGORY_MAPPINGS)) {
      expect(RISK_CATEGORIES).toContain(value),
        `CATEGORY_MAPPINGS["${key}"] = "${value}" is not a valid RiskCategory`
    }
  })

  it('all STATUS_MAPPINGS.status values are valid RiskStatus enum values', () => {
    for (const [key, pair] of Object.entries(STATUS_MAPPINGS)) {
      expect(RISK_STATUSES).toContain(pair.status),
        `STATUS_MAPPINGS["${key}"].status = "${pair.status}" is not valid`
    }
  })

  it('all STATUS_MAPPINGS.workflowStatus values are valid WorkflowStatus enum values', () => {
    for (const [key, pair] of Object.entries(STATUS_MAPPINGS)) {
      expect(WORKFLOW_STATUSES).toContain(pair.workflowStatus),
        `STATUS_MAPPINGS["${key}"].workflowStatus = "${pair.workflowStatus}" is not valid`
    }
  })

  it('all WORKFLOW_STATUS_MAPPINGS values are valid WorkflowStatus enum values', () => {
    for (const [key, value] of Object.entries(WORKFLOW_STATUS_MAPPINGS)) {
      expect(WORKFLOW_STATUSES).toContain(value),
        `WORKFLOW_STATUS_MAPPINGS["${key}"] = "${value}" is not valid`
    }
  })

  it('CATEGORY_MAPPINGS has entries for all 9 canonical categories', () => {
    const coveredCategories = new Set(Object.values(CATEGORY_MAPPINGS))
    for (const cat of RISK_CATEGORIES) {
      expect(coveredCategories.has(cat)).toBe(true),
        `No mapping entries target category "${cat}"`
    }
  })

  it('STATUS_MAPPINGS has entries for all 5 canonical statuses', () => {
    const coveredStatuses = new Set(Object.values(STATUS_MAPPINGS).map(p => p.status))
    for (const status of RISK_STATUSES) {
      expect(coveredStatuses.has(status)).toBe(true),
        `No mapping entries target status "${status}"`
    }
  })
})
