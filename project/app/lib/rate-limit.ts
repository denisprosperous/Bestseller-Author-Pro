type Key = string

const buckets: Map<Key, { tokens: number; lastRefill: number }> = new Map()

interface RateLimitOptions {
  capacity: number
  refillPerMs: number
}

const DEFAULT: RateLimitOptions = {
  capacity: 60, // 60 ops
  refillPerMs: 60 / (60 * 1000), // 1 token per second
}

function now() { return Date.now() }

function refill(state: { tokens: number; lastRefill: number }, opts: RateLimitOptions) {
  const elapsed = now() - state.lastRefill
  const add = elapsed * opts.refillPerMs
  state.tokens = Math.min(opts.capacity, state.tokens + add)
  state.lastRefill = now()
}

export function assertRateLimit(userId: string, action: string, opts: RateLimitOptions = DEFAULT) {
  const key: Key = `${userId}:${action}`
  const state = buckets.get(key) || { tokens: opts.capacity, lastRefill: now() }
  refill(state, opts)
  if (state.tokens < 1) {
    buckets.set(key, state)
    throw new Error('Rate limit exceeded')
  }
  state.tokens -= 1
  buckets.set(key, state)
}

export async function withRateLimit<T>(userId: string, action: string, fn: () => Promise<T>) {
  assertRateLimit(userId, action)
  return fn()
}
