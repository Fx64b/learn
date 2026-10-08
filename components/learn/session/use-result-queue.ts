'use client'

import { useCallback, useRef } from 'react'

/**
 * Runs server calls one after another in the background, with one retry.
 * Keeps the session snappy while results are saved in order.
 */
export function useResultQueue(onError: (error: string) => void) {
    const chain = useRef<Promise<unknown>>(Promise.resolve())

    const enqueue = useCallback(
        <T extends { success: boolean; error?: string }>(
            task: () => Promise<T>
        ): Promise<Extract<T, { success: true }> | null> => {
            const run = async (): Promise<Extract<
                T,
                { success: true }
            > | null> => {
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        const result = await task()
                        if (result.success)
                            return result as Extract<T, { success: true }>
                        if (attempt === 1) onError(result.error ?? '')
                    } catch (error) {
                        if (attempt === 1) onError(String(error))
                    }
                    if (attempt === 0)
                        await new Promise((r) => setTimeout(r, 1500))
                }
                return null
            }
            const next = chain.current.then(run, run)
            chain.current = next
            return next
        },
        [onError]
    )

    /** Resolves when every queued call has finished. */
    const flush = useCallback(() => chain.current.then(() => undefined), [])

    return { enqueue, flush }
}
