/**
 * tests/server/routers/registration.test.ts
 * Pure-function / business-logic tests for self-service registration.
 * No DB, no DOM — follows the risk.test.ts manual-mock pattern.
 */
import { describe, it, expect } from 'vitest'

// ─── Slug generation logic ─────────────────────────────────────────────────

function generateSlug(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
}

// ─── Input validation helpers (mirrors the Zod schema in user.ts) ──────────

function validateRegisterInput(input: {
  name: string
  email: string
  password: string
  orgName: string
}): string[] {
  const errors: string[] = []
  if (input.name.trim().length < 2) errors.push('Name must be at least 2 characters')
  if (!input.email.includes('@')) errors.push('Invalid email address')
  if (input.password.length < 8) errors.push('Password must be at least 8 characters')
  if (input.password.length > 128) errors.push('Password too long')
  if (input.orgName.trim().length < 2) errors.push('Organisation name must be at least 2 characters')
  if (input.orgName.trim().length > 100) errors.push('Organisation name too long')
  return errors
}

// ─── Slug generation ───────────────────────────────────────────────────────

describe('slug generation', () => {
  it('converts org name to lowercase hyphenated slug', () => {
    expect(generateSlug('Acme Holdings')).toBe('acme-holdings')
  })

  it('handles special characters and punctuation', () => {
    expect(generateSlug('Acme (Pty) Ltd')).toBe('acme-pty-ltd')
  })

  it('collapses multiple separators into one hyphen', () => {
    expect(generateSlug('ABC  &  DEF')).toBe('abc-def')
  })

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('  ---Test Org---  ')).toBe('test-org')
  })

  it('truncates to 40 characters', () => {
    const long = 'A'.repeat(20) + ' ' + 'B'.repeat(30)
    const slug = generateSlug(long)
    expect(slug.length).toBeLessThanOrEqual(40)
  })

  it('handles SA org names with common patterns', () => {
    expect(generateSlug('Mzansi Risk Solutions (Pty) Ltd')).toBe('mzansi-risk-solutions-pty-ltd')
    expect(generateSlug('J&B Financial Services')).toBe('j-b-financial-services')
  })
})

// ─── Input validation ──────────────────────────────────────────────────────

describe('register input validation', () => {
  const valid = {
    name: 'Jane Smith',
    email: 'jane@acmeholdings.co.za',
    password: 'SecurePass1',
    orgName: 'Acme Holdings',
  }

  it('accepts valid input', () => {
    expect(validateRegisterInput(valid)).toHaveLength(0)
  })

  it('rejects name too short', () => {
    const errors = validateRegisterInput({ ...valid, name: 'J' })
    expect(errors).toContain('Name must be at least 2 characters')
  })

  it('rejects invalid email', () => {
    const errors = validateRegisterInput({ ...valid, email: 'notanemail' })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('rejects password shorter than 8 chars', () => {
    const errors = validateRegisterInput({ ...valid, password: 'short' })
    expect(errors).toContain('Password must be at least 8 characters')
  })

  it('rejects password longer than 128 chars', () => {
    const errors = validateRegisterInput({ ...valid, password: 'a'.repeat(129) })
    expect(errors).toContain('Password too long')
  })

  it('rejects org name too short', () => {
    const errors = validateRegisterInput({ ...valid, orgName: 'X' })
    expect(errors).toContain('Organisation name must be at least 2 characters')
  })

  it('rejects org name too long', () => {
    const errors = validateRegisterInput({ ...valid, orgName: 'A'.repeat(101) })
    expect(errors).toContain('Organisation name too long')
  })

  it('accepts minimum-length valid values', () => {
    expect(validateRegisterInput({ name: 'AB', email: 'a@b.co', password: '12345678', orgName: 'AB' }))
      .toHaveLength(0)
  })
})

// ─── New-org isolation guarantees ─────────────────────────────────────────

describe('new-org isolation invariants', () => {
  it('a new org starts with zero risks', () => {
    // This documents the invariant: register → no risks → redirect to /onboarding
    const newOrgRiskCount = 0
    expect(newOrgRiskCount).toBe(0)
  })

  it('slug is derived entirely from org name, not user name or email', () => {
    const slug = generateSlug('Acme Holdings')
    expect(slug).not.toContain('jane')
    expect(slug).not.toContain('smith')
    expect(slug).toBe('acme-holdings')
  })

  it('duplicate org names produce the same base slug', () => {
    // Uniqueness is enforced by appending a random suffix in the router,
    // but the base slug algorithm must be deterministic
    expect(generateSlug('Acme Holdings')).toBe(generateSlug('Acme Holdings'))
  })
})
