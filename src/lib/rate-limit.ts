import { TRPCError } from '@trpc/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory rate limit store (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Default configs for different endpoint types
export const RATE_LIMITS = {
  ai: { windowMs: 60 * 1000, maxRequests: 10 },        // 10 req/min for AI
  import: { windowMs: 60 * 1000, maxRequests: 5 },     // 5 req/min for imports
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 req/15min for auth
} as const

/**
 * Check and update rate limit for a given key
 * @returns true if request is allowed, throws TRPCError if rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean expired entry
  if (entry && now > entry.resetAt) {
    rateLimitStore.delete(key)
  }

  const current = rateLimitStore.get(key)

  if (!current) {
    // First request - create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return true
  }

  if (current.count >= config.maxRequests) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000)
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    })
  }

  // Increment count
  current.count++
  return true
}

/**
 * Create a rate limit key from user/org ID and endpoint
 */
export function createRateLimitKey(
  userId: string,
  orgId: string,
  endpoint: string
): string {
  return `${orgId}:${userId}:${endpoint}`
}

/**
 * Periodically clean expired entries (call this on app startup)
 */
export function startRateLimitCleanup(intervalMs = 60000): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now()
    const entries = Array.from(rateLimitStore.entries())
    for (const [key, entry] of entries) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key)
      }
    }
  }, intervalMs)
}

// Clean up old entries every minute
if (typeof global !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startRateLimitCleanup()
}
