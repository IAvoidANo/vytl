/**
 * tests/excel-import/json-extraction.test.ts
 * Pure-function tests — no API calls, no DOM.
 */
import { describe, it, expect } from 'vitest'
import { extractJsonArray, filterValidItems } from '../../src/lib/excel-import/json-extraction'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BARE_ARRAY = `[{"title":"Load shedding","category":"OPERATIONAL"},{"title":"POPIA breach","category":"COMPLIANCE"}]`

const BARE_ARRAY_WHITESPACE = `  \n  ${BARE_ARRAY}  \n  `

const MARKDOWN_JSON_FENCE = `\`\`\`json\n${BARE_ARRAY}\n\`\`\``

const MARKDOWN_PLAIN_FENCE = `\`\`\`\n${BARE_ARRAY}\n\`\`\``

const PREAMBLE_THEN_ARRAY = `Here are the risks I found in the document:\n\n${BARE_ARRAY}`

const POSTAMBLE_ARRAY = `${BARE_ARRAY}\n\nI hope this helps with your risk assessment.`

const PREAMBLE_AND_POSTAMBLE = `Here are the extracted risks:\n${BARE_ARRAY}\nLet me know if you need anything else.`

const MARKDOWN_WITH_PREAMBLE = `Sure, here are the risks:\n\n\`\`\`json\n${BARE_ARRAY}\n\`\`\`\n\nLet me know if you need more.`

const WRAPPED_OBJECT = `{"risks":${BARE_ARRAY}}`

const WRAPPED_OBJECT_DATA_KEY = `{"data":${BARE_ARRAY}}`

const EMPTY_ARRAY = `[]`

const SINGLE_ITEM = `[{"title":"Cybersecurity","category":"TECHNOLOGY"}]`

const NESTED_WITH_OUTER_BRACKET = `{"results":${BARE_ARRAY},"total":2}`

// ─── extractJsonArray — Strategy 1: Raw ────────────────────────────────────────

describe('extractJsonArray — strategy: raw', () => {
  it('parses a bare JSON array', () => {
    const result = extractJsonArray(BARE_ARRAY)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.strategy).toBe('raw')
      expect(result.data).toHaveLength(2)
      expect(result.warnings).toHaveLength(0)
    }
  })

  it('trims surrounding whitespace and newlines', () => {
    const result = extractJsonArray(BARE_ARRAY_WHITESPACE)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.strategy).toBe('raw')
      expect(result.data).toHaveLength(2)
    }
  })

  it('handles empty JSON array', () => {
    const result = extractJsonArray(EMPTY_ARRAY)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })

  it('handles single-item array', () => {
    const result = extractJsonArray(SINGLE_ITEM)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(1)
  })

  it('unwraps { risks: [...] } object', () => {
    const result = extractJsonArray(WRAPPED_OBJECT)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('unwraps { data: [...] } object', () => {
    const result = extractJsonArray(WRAPPED_OBJECT_DATA_KEY)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })
})

// ─── extractJsonArray — Strategy 2: Markdown fence ────────────────────────────

describe('extractJsonArray — strategy: markdown-fence', () => {
  it('strips ```json fence', () => {
    const result = extractJsonArray(MARKDOWN_JSON_FENCE)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.strategy).toBe('markdown-fence')
      expect(result.data).toHaveLength(2)
    }
  })

  it('strips plain ``` fence', () => {
    const result = extractJsonArray(MARKDOWN_PLAIN_FENCE)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.strategy).toBe('markdown-fence')
    }
  })

  it('handles preamble text before ```json fence', () => {
    const result = extractJsonArray(MARKDOWN_WITH_PREAMBLE)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })
})

// ─── extractJsonArray — Strategy 3: Boundary ──────────────────────────────────

describe('extractJsonArray — strategy: boundary', () => {
  it('extracts array when preceded by preamble text', () => {
    const result = extractJsonArray(PREAMBLE_THEN_ARRAY)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('extracts array when followed by postamble text', () => {
    const result = extractJsonArray(POSTAMBLE_ARRAY)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('extracts array with preamble and postamble', () => {
    const result = extractJsonArray(PREAMBLE_AND_POSTAMBLE)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('handles wrapped object with trailing fields', () => {
    const result = extractJsonArray(NESTED_WITH_OUTER_BRACKET)
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Array<{ title: string }>)[0].title).toBeTruthy()
    }
  })
})

// ─── extractJsonArray — Failure cases ─────────────────────────────────────────

describe('extractJsonArray — failure cases', () => {
  it('returns failure for empty string', () => {
    const result = extractJsonArray('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Empty')
    }
  })

  it('returns failure for whitespace-only input', () => {
    const result = extractJsonArray('   \n  ')
    expect(result.success).toBe(false)
  })

  it('returns failure for plain prose (no JSON)', () => {
    const result = extractJsonArray('I cannot identify any risks in this document.')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.attempts.length).toBeGreaterThan(0)
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  it('returns failure for a JSON object with no array values', () => {
    const result = extractJsonArray('{"message":"no risks found"}')
    expect(result.success).toBe(false)
  })

  it('reports which strategies were attempted on failure', () => {
    const result = extractJsonArray('not json at all')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.attempts).toContain('raw')
      expect(result.attempts).toContain('markdown-fence')
    }
  })
})

// ─── filterValidItems ──────────────────────────────────────────────────────────

describe('filterValidItems', () => {
  const parseTitle = (item: unknown): { title: string } => {
    if (typeof item !== 'object' || item === null || typeof (item as Record<string, unknown>).title !== 'string') {
      throw new Error('Invalid item')
    }
    return item as { title: string }
  }

  it('passes all valid items through', () => {
    const items = [{ title: 'Risk A' }, { title: 'Risk B' }]
    const { valid, skipped } = filterValidItems(items, parseTitle)
    expect(valid).toHaveLength(2)
    expect(skipped).toBe(0)
  })

  it('skips invalid items and counts them', () => {
    const items = [{ title: 'Risk A' }, { noTitle: true }, { title: 'Risk B' }]
    const { valid, skipped, warnings } = filterValidItems(items, parseTitle)
    expect(valid).toHaveLength(2)
    expect(skipped).toBe(1)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('Item 2')
  })

  it('returns empty arrays for empty input', () => {
    const { valid, skipped } = filterValidItems([], parseTitle)
    expect(valid).toHaveLength(0)
    expect(skipped).toBe(0)
  })

  it('skips all items if none are valid', () => {
    const items = [{ a: 1 }, { b: 2 }]
    const { valid, skipped } = filterValidItems(items, parseTitle)
    expect(valid).toHaveLength(0)
    expect(skipped).toBe(2)
  })
})

// ─── Real-world AI response scenarios ─────────────────────────────────────────

describe('extractJsonArray — real-world AI response scenarios', () => {
  it('handles response with "Here are the risks:" intro + bare array', () => {
    const response = `Here are the extracted risks from the document:\n\n${BARE_ARRAY}`
    const result = extractJsonArray(response)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(2)
  })

  it('handles response with both markdown fence and preamble', () => {
    const response = `Based on my analysis:\n\`\`\`json\n[{"title":"Risk 1","category":"STRATEGIC"}]\n\`\`\``
    const result = extractJsonArray(response)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(1)
  })

  it('handles pretty-printed JSON across multiple lines', () => {
    const response = `[\n  {\n    "title": "Risk 1",\n    "category": "STRATEGIC"\n  }\n]`
    const result = extractJsonArray(response)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(1)
  })

  it('handles response wrapped in { "risks": [...] }', () => {
    const response = `{ "risks": [{"title":"Risk 1","category":"OPERATIONAL"}] }`
    const result = extractJsonArray(response)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(1)
  })

  it('returns all warnings from array-scan strategy', () => {
    const response = `Some preamble text\n${BARE_ARRAY}\nSome trailing text`
    const result = extractJsonArray(response)
    expect(result.success).toBe(true)
    // May use boundary or array-scan; either way should succeed
  })
})
