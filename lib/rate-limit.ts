import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type RateLimitResult = {
    success: boolean
    limit?: number
    reset?: number
    remaining?: number
}

const redis = process.env.REDIS_URL ? Redis.fromEnv() : null

export const limits = redis
    ? {
          email: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(5, '15m'), // 5 emails per 15 minutes
              analytics: true,
          }),
          bulkCreate: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(10, '1h'), // 10 bulk operations per hour
              analytics: true,
          }),
          general: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(100, '1h'), // 100 general requests per hour
              analytics: true,
          }),
      }
    : {
          email: null,
          bulkCreate: null,
          general: null,
      }

export async function checkRateLimit(
    identifier: string,
    type: keyof typeof limits = 'general'
): Promise<RateLimitResult> {
    const ratelimit = limits[type]

    if (!ratelimit) {
        return {
            success: true,
            limit: undefined,
            reset: undefined,
            remaining: undefined,
        }
    }

    const result = await ratelimit.limit(identifier)

    return result
}
