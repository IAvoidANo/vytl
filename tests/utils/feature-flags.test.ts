import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Feature Flags', () => {
  const ORIGINAL_ENV = process.env.NEXT_PUBLIC_USE_TOP_NAV

  afterEach(() => {
    // Restore original env after each test
    if (ORIGINAL_ENV === undefined) {
      delete process.env.NEXT_PUBLIC_USE_TOP_NAV
    } else {
      process.env.NEXT_PUBLIC_USE_TOP_NAV = ORIGINAL_ENV
    }
    // Clear module cache so re-import picks up new env
    vi.resetModules()
  })

  it('returns false for USE_TOP_NAV when env var is not set', async () => {
    delete process.env.NEXT_PUBLIC_USE_TOP_NAV
    vi.resetModules()
    const { FEATURE_FLAGS } = await import('@/lib/feature-flags')
    expect(FEATURE_FLAGS.USE_TOP_NAV).toBe(false)
  })

  it('returns false for USE_TOP_NAV when env var is "false"', async () => {
    process.env.NEXT_PUBLIC_USE_TOP_NAV = 'false'
    vi.resetModules()
    const { FEATURE_FLAGS } = await import('@/lib/feature-flags')
    expect(FEATURE_FLAGS.USE_TOP_NAV).toBe(false)
  })

  it('returns true for USE_TOP_NAV when env var is "true"', async () => {
    process.env.NEXT_PUBLIC_USE_TOP_NAV = 'true'
    vi.resetModules()
    const { FEATURE_FLAGS } = await import('@/lib/feature-flags')
    expect(FEATURE_FLAGS.USE_TOP_NAV).toBe(true)
  })

  it('useFeatureFlag returns correct value for USE_TOP_NAV', async () => {
    process.env.NEXT_PUBLIC_USE_TOP_NAV = 'true'
    vi.resetModules()
    const { useFeatureFlag } = await import('@/lib/feature-flags')
    expect(useFeatureFlag('USE_TOP_NAV')).toBe(true)
  })

  it('USE_TOP_NAV named export matches FEATURE_FLAGS.USE_TOP_NAV', async () => {
    process.env.NEXT_PUBLIC_USE_TOP_NAV = 'true'
    vi.resetModules()
    const { FEATURE_FLAGS, USE_TOP_NAV } = await import('@/lib/feature-flags')
    expect(USE_TOP_NAV).toBe(FEATURE_FLAGS.USE_TOP_NAV)
  })
})
