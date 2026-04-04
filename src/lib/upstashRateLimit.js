import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function consumeUserRateLimit(
    userId,
    maxRequests = 60,
    windowSeconds = 3600
) {
    const safeLimit = Math.max(Number(maxRequests) || 1, 1)
    const safeWindowSeconds = Math.max(Number(windowSeconds) || 1, 1)

    const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(safeLimit, `${safeWindowSeconds} s`),
        analytics: true,
        prefix: '@upstash/ratelimit:validate-wallet'
    })

    const identifier = `validate-wallet:${String(userId || 'unknown')}`
    const result = await ratelimit.limit(identifier)

    const limit = typeof result?.limit === 'number' ? result.limit : safeLimit
    const remaining = typeof result?.remaining === 'number'
        ? result.remaining
        : Math.max(limit - 1, 0)
    const resetAt = typeof result?.reset === 'number'
        ? result.reset
        : Date.now() + (safeWindowSeconds * 1000)

    return {
        allowed: Boolean(result?.success),
        limit,
        remaining,
        count: limit - remaining,
        resetAt
    }
}

