import React, { useCallback, useRef, useState } from 'react'

interface GenerateParams {
    prompt: string
    deckId: string
    file?: File
}

interface Progress {
    step: string
    percentage: number
    message: string
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
        async (params: GenerateParams) => {
            // Cleanup any existing operations
            cleanup()

            return new Promise((resolve, reject) => {
                try {
                    setIsGenerating(true)
                    setProgress({
                        step: 'initializing',
                        percentage: 0,
                        message: 'Initializing AI generation...',
                    })

                    // Create FormData for file upload
                    const formData = new FormData()
                    formData.append('prompt', params.prompt)
                    formData.append('deckId', params.deckId)
                    if (params.file) {
                        formData.append('file', params.file)
                    }

                    // Create abort controller
                    const abortController = new AbortController()
                    abortControllerRef.current = abortController

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
                                return reader.read().then(({ done, value }) => {
                                    if (done) {
                                        cleanup()
                                        return
                                    }

                                    const chunk = decoder.decode(value, {
                                        stream: true,
                                    })
                                    const lines = chunk.split('\n')

                                    for (const line of lines) {
                                        if (line.startsWith('data: ')) {
                                            try {
                                                const data = JSON.parse(
                                                    line.slice(6)
                                                )

                                                if (data.type === 'progress') {
                                                    setProgress({
                                                        step:
                                                            data.progress
                                                                ?.step ||
                                                            'processing',
                                                        percentage:
                                                            data.progress
                                                                ?.percentage ||
                                                            0,
                                                        message:
                                                            data.progress
                                                                ?.message ||
                                                            'Processing...',
                                                    })
                                                } else if (
                                                    data.type === 'success'
                                                ) {
                                                    cleanup()
                                                    resolve(data.data)
                                                    return
                                                } else if (
                                                    data.type === 'error'
                                                ) {
                                                    cleanup()
                                                    reject({
                                                        type: 'error',
                                                        error: data.error,
                                                        data: data.data,
                                                    })
                                                    return
                                                } else if (
                                                    data.type === 'rate_limit'
                                                ) {
                                                    cleanup()
                                                    reject({
                                                        type: 'rate_limit',
                                                        error: data.error,
                                                        data: data.data,
                                                    })
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
                                reject({
                                    type: 'error',
                                    error: 'Generation cancelled',
                                })
                            } else {
                                reject({
                                    type: 'error',
                                    error: error.message || 'Network error',
                                })
                            }
                        })
                } catch (error) {
                    cleanup()
                    reject({
                        type: 'error',
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error',
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
