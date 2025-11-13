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
          studyReview: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(300, '1h'), // 300 reviews per hour (~5 per minute)
              analytics: true,
          }),
          studySession: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(100, '1h'), // 100 study session saves per hour
              analytics: true,
          }),
          deckMutation: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(50, '1h'), // 50 deck mutations per hour
              analytics: true,
          }),
          cardMutation: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(100, '1h'), // 100 card mutations per hour
              analytics: true,
          }),
          dataRetrieval: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(500, '1h'), // 500 data retrievals per hour (anti-scraping)
              analytics: true,
          }),
          export: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(20, '1h'), // 20 exports per hour (resource intensive)
              analytics: true,
          }),
          preferences: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(50, '1h'), // 50 preference updates per hour
              analytics: true,
          }),
          paymentStatus: new Ratelimit({
              redis: redis,
              limiter: Ratelimit.slidingWindow(100, '1h'), // 100 payment status checks per hour
              analytics: true,
          }),
      }
    : {
          email: null,
          bulkCreate: null,
          general: null,
          studyReview: null,
          studySession: null,
          deckMutation: null,
          cardMutation: null,
          dataRetrieval: null,
          export: null,
          preferences: null,
          paymentStatus: null,
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
