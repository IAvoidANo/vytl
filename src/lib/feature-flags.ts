// Feature flags for design refresh rollout.
// Set NEXT_PUBLIC_USE_TOP_NAV=true in .env.local to enable the new top navigation.
export const FEATURE_FLAGS = {
  USE_TOP_NAV: process.env.NEXT_PUBLIC_USE_TOP_NAV === 'true',
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag]
}

// Convenience re-exports for direct import
export const USE_TOP_NAV = FEATURE_FLAGS.USE_TOP_NAV
