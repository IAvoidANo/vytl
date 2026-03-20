/**
 * json-extraction.ts — Resilient JSON array extraction from Claude API responses.
 *
 * Claude sometimes wraps JSON in markdown code fences, adds preamble text, or
 * returns a wrapped object instead of a bare array. This module tries four
 * progressively more permissive strategies before giving up.
 *
 * Pure functions — no API calls, no DOM, fully testable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExtractionStrategy = 'raw' | 'markdown-fence' | 'boundary' | 'array-scan'

export type ExtractionSuccess = {
  success: true
  data: unknown[]
  strategy: ExtractionStrategy
  warnings: string[]
}

export type ExtractionFailure = {
  success: false
  error: string
  attempts: ExtractionStrategy[]
}

export type ExtractionResult = ExtractionSuccess | ExtractionFailure

// ─── Strategy implementations ─────────────────────────────────────────────────

/**
 * Strategy 1 — Raw: parse the trimmed text directly.
 * Works when Claude returns a bare JSON array as instructed.
 */
function tryRaw(text: string): unknown[] | null {
  try {
    const parsed = JSON.parse(text.trim())
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Strategy 2 — Markdown fence: strip ``` or ```json fences.
 * Handles both inline fences and fences with preamble text before them.
 */
function tryMarkdownFence(text: string): unknown[] | null {
  // Match ``` or ```json fences anywhere in the text (greedy to last ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim())
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  // Fallback: strip leading ```json or ``` and trailing ```
  if (text.trimStart().startsWith('```')) {
    const stripped = text
      .replace(/^```(?:json)?\r?\n?/, '')
      .replace(/\r?\n?```$/, '')
      .trim()
    try {
      const parsed = JSON.parse(stripped)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Strategy 3 — Boundary: find the first '[' and last ']' and parse the substring.
 * Handles preamble/postamble text wrapping a valid JSON array.
 */
function tryBoundary(text: string): unknown[] | null {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return null

  try {
    const candidate = text.substring(start, end + 1)
    const parsed = JSON.parse(candidate)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Strategy 4 — Array scan: scan all '[' positions and try each as an array start.
 * Handles cases where there is preceding JSON content that causes boundary detection
 * to grab too much. Tries the longest match first (most permissive).
 */
function tryArrayScan(text: string): { data: unknown[]; warnings: string[] } | null {
  const candidates: Array<{ start: number; end: number }> = []

  let pos = 0
  while (pos < text.length) {
    const idx = text.indexOf('[', pos)
    if (idx === -1) break
    const lastClose = text.lastIndexOf(']')
    if (lastClose > idx) {
      candidates.push({ start: idx, end: lastClose })
    }
    pos = idx + 1
  }

  // Try from longest candidate to shortest
  candidates.sort((a, b) => (b.end - b.start) - (a.end - a.start))

  for (const { start, end } of candidates) {
    try {
      const candidate = text.substring(start, end + 1)
      const parsed = JSON.parse(candidate)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const warnings: string[] = []
        if (start > 0) {
          warnings.push(`Skipped ${start} leading characters before JSON array`)
        }
        if (end < text.length - 1) {
          warnings.push(`Ignored ${text.length - end - 1} trailing characters after JSON array`)
        }
        return { data: parsed, warnings }
      }
    } catch {
      continue
    }
  }

  return null
}

// ─── Wrapped object unwrap ─────────────────────────────────────────────────────

/**
 * Some models return { "risks": [...] } instead of a bare array.
 * Try to unwrap common wrapper keys.
 */
function tryUnwrapObject(text: string): unknown[] | null {
  try {
    const parsed = JSON.parse(text.trim())
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>
      // Common wrapper keys: risks, items, data, results, output
      for (const key of ['risks', 'items', 'data', 'results', 'output', 'list']) {
        if (Array.isArray(obj[key])) {
          return obj[key] as unknown[]
        }
      }
      // Last resort: take first array value
      for (const val of Object.values(obj)) {
        if (Array.isArray(val)) return val as unknown[]
      }
    }
  } catch {
    // not JSON at all
  }
  return null
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Extract a JSON array from a raw string using 4 escalating strategies.
 *
 * Strategy order:
 *   1. raw          — bare JSON array
 *   2. markdown-fence — ``` or ```json fences
 *   3. boundary      — first `[` to last `]`
 *   4. array-scan    — try all `[` positions
 *
 * Also attempts wrapped-object unwrapping before boundary/array-scan.
 *
 * Returns ExtractionSuccess (with data + which strategy worked) or
 * ExtractionFailure (with error message and list of tried strategies).
 */
export function extractJsonArray(rawText: string): ExtractionResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      success: false,
      error: 'Empty response from AI',
      attempts: [],
    }
  }

  const text = rawText.trim()
  const attempted: ExtractionStrategy[] = []

  // Strategy 1: Raw
  attempted.push('raw')
  const raw = tryRaw(text)
  if (raw !== null) {
    return { success: true, data: raw, strategy: 'raw', warnings: [] }
  }

  // Check for wrapped object (between strategies — uses raw parse)
  const unwrapped = tryUnwrapObject(text)
  if (unwrapped !== null) {
    return { success: true, data: unwrapped, strategy: 'raw', warnings: ['Unwrapped object wrapper key'] }
  }

  // Strategy 2: Markdown fence
  attempted.push('markdown-fence')
  const fenced = tryMarkdownFence(text)
  if (fenced !== null) {
    return { success: true, data: fenced, strategy: 'markdown-fence', warnings: [] }
  }

  // Strategy 3: Boundary
  attempted.push('boundary')
  const boundary = tryBoundary(text)
  if (boundary !== null) {
    return { success: true, data: boundary, strategy: 'boundary', warnings: ['Extracted JSON from surrounding text'] }
  }

  // Strategy 4: Array scan
  attempted.push('array-scan')
  const scanned = tryArrayScan(text)
  if (scanned !== null) {
    return { success: true, data: scanned.data, strategy: 'array-scan', warnings: scanned.warnings }
  }

  return {
    success: false,
    error: 'Could not extract a JSON array from the AI response. The response may not contain structured risk data.',
    attempts: attempted,
  }
}

/**
 * Validate that every item in an extracted array satisfies a Zod-like parse function.
 * Returns valid items and skips (with warnings) any that fail.
 */
export function filterValidItems<T>(
  items: unknown[],
  parse: (item: unknown) => T,
): { valid: T[]; skipped: number; warnings: string[] } {
  const valid: T[] = []
  let skipped = 0
  const warnings: string[] = []

  for (let i = 0; i < items.length; i++) {
    try {
      valid.push(parse(items[i]))
    } catch {
      skipped++
      warnings.push(`Item ${i + 1} skipped: failed schema validation`)
    }
  }

  return { valid, skipped, warnings }
}
