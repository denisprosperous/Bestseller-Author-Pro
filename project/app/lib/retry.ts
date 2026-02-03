export interface RetryOptions {
  retries?: number
  minDelayMs?: number
  maxDelayMs?: number
  factor?: number
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}) {
  const {
    retries = 3,
    minDelayMs = 200,
    maxDelayMs = 2000,
    factor = 2,
  } = opts

  let attempt = 0
  let delay = minDelayMs

  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt += 1
      if (attempt > retries) throw err
      await new Promise(res => setTimeout(res, Math.min(delay, maxDelayMs)))
      delay *= factor
    }
  }
}
