'use client'

import { useEffect, useState } from 'react'

interface RateLimitStatus {
    limit: number
    remaining: number
    reset: number
}

export function RateLimitStatus() {
    const [status, setStatus] = useState<RateLimitStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkStatus = async () => {
            try {
                setIsLoading(true)
                const response = await fetch('/api/health')
                const data = await response.json()

                // Check if the response contains rate limit data
                if (data.rateLimit && data.rateLimit.limit !== undefined) {
                    setStatus({
                        limit: data.rateLimit.limit,
                        remaining: data.rateLimit.remaining,
                        reset: data.rateLimit.reset,
                    })
                } else {
                    setError('Rate limiting not configured')
                }
            } catch (error) {
                setError('Failed to fetch rate limit status')
                console.error('Failed to fetch rate limit status', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkStatus()
        // Check every minute
        const interval = setInterval(checkStatus, 60000)

        return () => clearInterval(interval)
    }, [])

    if (isLoading) {
        return (
            <div className="text-muted-foreground text-sm">
                Loading rate limit...
            </div>
        )
    }

    if (error) {
        return null
    }

    if (!status) return null

    const resetTime = new Date(status.reset * 1000).toLocaleTimeString()

    return (
        <div className="text-muted-foreground text-sm">
            API Requests: {status.remaining}/{status.limit} (resets at{' '}
            {resetTime})
        </div>
    )
}
