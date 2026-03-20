/**
 * duplicate-detection.ts — INC-007: Excel import duplicate risk detection
 *
 * Pure functions (no DOM, no DB). Checks incoming import rows against a list
 * of existing risks to surface potential duplicates in the preview UI.
 */

export interface DuplicateCheckInput {
  title: string
  category: string
}

export interface ExistingRisk {
  id: string
  refCode: string
  title: string
  category: string
}

export type DuplicateMatchType = 'exact' | 'fuzzy-title' | 'none'

export interface DuplicateCheckResult {
  matchType: DuplicateMatchType
  matchedRisk?: ExistingRisk
  /** 0-1 confidence in the match */
  confidence: number
  /** Human-readable warning for the preview UI */
  warning?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Levenshtein edit distance (iterative, O(n*m)) */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
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

const MAX_FUZZY_DISTANCE = 5

/** Confidence based on Levenshtein distance: distance 0=1.0, 1=0.95, 5=0.75 */
function distanceToConfidence(distance: number): number {
  if (distance === 0) return 1.0
  if (distance >= MAX_FUZZY_DISTANCE) return 0.75
  return 1.0 - distance * 0.05
}

// ─── checkDuplicate ───────────────────────────────────────────────────────────

/**
 * Check a single import row against a list of existing risks.
 *
 * Resolution order:
 *  1. Exact: title matches case-insensitively AND category matches → confidence 1.0
 *  2. Fuzzy: Levenshtein distance ≤ MAX_FUZZY_DISTANCE AND category matches → graded confidence
 *  3. None: no match
 */
export function checkDuplicate(
  incoming: DuplicateCheckInput,
  existingRisks: ExistingRisk[],
): DuplicateCheckResult {
  if (existingRisks.length === 0) {
    return { matchType: 'none', confidence: 0 }
  }

  const incomingTitle = normalizeTitle(incoming.title)
  const incomingCategory = incoming.category.toUpperCase().trim()

  let bestFuzzy: { risk: ExistingRisk; distance: number } | null = null

  for (const existing of existingRisks) {
    const existingTitle = normalizeTitle(existing.title)
    const existingCategory = existing.category.toUpperCase().trim()

    // Categories must match for any duplicate signal
    if (existingCategory !== incomingCategory) continue

    // Exact match
    if (existingTitle === incomingTitle) {
      return {
        matchType: 'exact',
        matchedRisk: existing,
        confidence: 1.0,
        warning: `Possible duplicate of ${existing.refCode}: "${existing.title}"`,
      }
    }

    // Track best fuzzy candidate
    const dist = levenshtein(incomingTitle, existingTitle)
    if (dist <= MAX_FUZZY_DISTANCE) {
      if (bestFuzzy === null || dist < bestFuzzy.distance) {
        bestFuzzy = { risk: existing, distance: dist }
      }
    }
  }

  if (bestFuzzy) {
    const confidence = distanceToConfidence(bestFuzzy.distance)
    return {
      matchType: 'fuzzy-title',
      matchedRisk: bestFuzzy.risk,
      confidence,
      warning: `Similar to existing risk ${bestFuzzy.risk.refCode}: "${bestFuzzy.risk.title}"`,
    }
  }

  return { matchType: 'none', confidence: 0 }
}

/**
 * Check all import rows in batch. Returns results in the same order as incoming.
 */
export function checkDuplicates(
  incoming: DuplicateCheckInput[],
  existingRisks: ExistingRisk[],
): DuplicateCheckResult[] {
  return incoming.map(row => checkDuplicate(row, existingRisks))
}
