import { aiUploadPrefix } from '@/lib/blob'

import React, { useCallback, useRef, useState } from 'react'

import { uploadPresigned } from '@vercel/blob/client'

interface GenerateParams {
    prompt: string
    deckId: string
    /** PDF to read. It is uploaded to Blob first, only its URL is sent. */
    file?: File
    /** Owner of the upload folder. Required when a file is given. */
    userId?: string
    /** Item types to generate. Empty means all. */
    types?: string[]
}

interface Progress {
    step: string
    percentage: number
    message: string
}

interface AIGenerationResult {
    success: boolean
    error?: string
    message?: string
    cardsCreated?: number
    tier?: string
    remaining?: number
    requiresPro?: boolean
    paymentIssue?: boolean
    resetTime?: Date
    requestId: string
    items?: Array<{ type: string; front: string }>
    /** Set when the PDF upload failed before generation started. */
    errorCode?: 'upload_failed'
}

/** Keeps letters, digits, dot, dash and underscore in the file name. */
function safeFileName(name: string) {
    const base = name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]+/g, '-')
    return `${base.slice(0, 60) || 'document'}.pdf`
}

export function useAIFlashcards() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState<Progress | null>(null)
    const eventSourceRef = useRef<EventSource | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const cleanup = useCallback(() => {
        // Close SSE connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }

        // Abort any pending requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }

        setIsGenerating(false)
        setProgress(null)
    }, [])

    const generateFlashcards = useCallback(
        async (params: GenerateParams): Promise<AIGenerationResult> => {
            // Cleanup any existing operations
            cleanup()

            return new Promise<AIGenerationResult>((resolve) => {
                try {
                    setIsGenerating(true)
                    setProgress({
                        step: 'initializing',
                        percentage: 0,
                        message: 'Initializing AI generation...',
                    })

                    // Create abort controller
                    const abortController = new AbortController()
                    abortControllerRef.current = abortController

                    void (async () => {
                        // Large PDFs go straight from the browser to Blob,
                        // because Vercel Functions accept at most 4.5 MB.
                        let fileUrl: string | undefined
                        if (params.file) {
                            try {
                                if (!params.userId) {
                                    throw new Error('Not signed in')
                                }
                                setProgress({
                                    step: 'uploading',
                                    percentage: 0,
                                    message: 'Uploading PDF...',
                                })
                                const blob = await uploadPresigned(
                                    `${aiUploadPrefix(params.userId)}${crypto.randomUUID()}-${safeFileName(params.file.name)}`,
                                    params.file,
                                    {
                                        access: 'public',
                                        handleUploadUrl:
                                            '/api/ai-flashcards/upload',
                                        contentType: 'application/pdf',
                                        multipart:
                                            params.file.size > 5 * 1024 * 1024,
                                        abortSignal: abortController.signal,
                                        onUploadProgress: ({ percentage }) =>
                                            setProgress({
                                                step: 'uploading',
                                                percentage:
                                                    Math.round(percentage),
                                                message: `Uploading PDF... ${Math.round(percentage)}%`,
                                            }),
                                    }
                                )
                                fileUrl = blob.url
                            } catch (error) {
                                const cancelled = abortController.signal.aborted
                                cleanup()
                                if (cancelled) {
                                    resolve({
                                        success: false,
                                        error: 'Generation cancelled',
                                        requestId: crypto.randomUUID(),
                                    })
                                    return
                                }
                                resolve({
                                    success: false,
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : 'Upload failed',
                                    errorCode: 'upload_failed',
                                    requestId: crypto.randomUUID(),
                                })
                                return
                            }
                        }

                        const formData = new FormData()
                        formData.append('prompt', params.prompt)
                        formData.append('deckId', params.deckId)
                        if (params.types?.length) {
                            formData.append('types', params.types.join(','))
                        }
                        if (fileUrl) {
                            formData.append('fileUrl', fileUrl)
                        }

                        // Use SSE for real-time progress updates
                        const url = new URL(
                            '/api/ai-flashcards',
                            window.location.origin
                        )

                        // First, send the request to trigger processing
                        fetch(url, {
                            method: 'POST',
                            body: formData,
                            signal: abortController.signal,
                            headers: {
                                Accept: 'text/event-stream',
                            },
                        })
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error(`HTTP ${response.status}`)
                                }

                                if (!response.body) {
                                    throw new Error('No response body')
                                }

                                // Handle SSE stream
                                const reader = response.body.getReader()
                                const decoder = new TextDecoder()

                                function readStream(): Promise<void> {
                                    return reader
                                        .read()
                                        .then(({ done, value }) => {
                                            if (done) {
                                                cleanup()
                                                return
                                            }

                                            const chunk = decoder.decode(
                                                value,
                                                {
                                                    stream: true,
                                                }
                                            )
                                            const lines = chunk.split('\n')

                                            for (const line of lines) {
                                                if (line.startsWith('data: ')) {
                                                    try {
                                                        const data = JSON.parse(
                                                            line.slice(6)
                                                        )

                                                        if (
                                                            data.type ===
                                                            'progress'
                                                        ) {
                                                            setProgress({
                                                                step:
                                                                    data
                                                                        .progress
                                                                        ?.step ||
                                                                    'processing',
                                                                percentage:
                                                                    data
                                                                        .progress
                                                                        ?.percentage ||
                                                                    0,
                                                                message:
                                                                    data
                                                                        .progress
                                                                        ?.message ||
                                                                    'Processing...',
                                                            })
                                                        } else if (
                                                            data.type ===
                                                            'success'
                                                        ) {
                                                            cleanup()
                                                            resolve(data.data)
                                                            return
                                                        } else if (
                                                            data.type ===
                                                            'error'
                                                        ) {
                                                            cleanup()
                                                            resolve(
                                                                data.data || {
                                                                    success: false,
                                                                    error:
                                                                        data.error ||
                                                                        'Unknown error',
                                                                    requestId:
                                                                        crypto.randomUUID(),
                                                                }
                                                            )
                                                            return
                                                        } else if (
                                                            data.type ===
                                                            'rate_limit'
                                                        ) {
                                                            cleanup()
                                                            resolve(
                                                                data.data || {
                                                                    success: false,
                                                                    error:
                                                                        data.error ||
                                                                        'Rate limit exceeded',
                                                                    requiresPro: true,
                                                                    requestId:
                                                                        crypto.randomUUID(),
                                                                }
                                                            )
                                                            return
                                                        }
                                                    } catch (parseError) {
                                                        console.error(
                                                            'Failed to parse SSE message:',
                                                            parseError
                                                        )
                                                    }
                                                }
                                            }

                                            return readStream()
                                        })
                                }

                                return readStream()
                            })
                            .catch((error) => {
                                cleanup()

                                if (error.name === 'AbortError') {
                                    resolve({
                                        success: false,
                                        error: 'Generation cancelled',
                                        requestId: crypto.randomUUID(),
                                    })
                                } else {
                                    resolve({
                                        success: false,
                                        error: error.message || 'Network error',
                                        requestId: crypto.randomUUID(),
                                    })
                                }
                            })
                    })().catch((error: unknown) => {
                        // Errors outside the fetch chain must still settle.
                        cleanup()
                        resolve({
                            success: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error',
                            requestId: crypto.randomUUID(),
                        })
                    })
                } catch (error) {
                    cleanup()
                    resolve({
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error',
                        requestId: crypto.randomUUID(),
                    })
                }
            })
        },
        [cleanup]
    )

    const cancelGeneration = useCallback(() => {
        cleanup()
    }, [cleanup])

    // Cleanup on unmount
    React.useEffect(() => {
        return cleanup
    }, [cleanup])

    return {
        generateFlashcards,
        cancelGeneration,
        isGenerating,
        progress,
    }
}
