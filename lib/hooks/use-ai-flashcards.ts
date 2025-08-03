import { useCallback, useRef, useState } from 'react'

interface ProgressData {
    step: string
    percentage: number
    message: string
}

interface SSEMessage {
    type: 'progress' | 'success' | 'error' | 'rate_limit'
    data?: {
        success?: boolean
        message?: string
        cardsCreated?: number
        tier?: string
        remaining?: number
        requiresPro?: boolean
        paymentIssue?: boolean
        resetTime?: Date
        requestId?: string
        error?: string
    }
    error?: string
    progress?: ProgressData
}

interface UseAIFlashcardsResult {
    isGenerating: boolean
    progress: ProgressData | null
    generateFlashcards: (params: {
        deckId: string
        prompt: string
        file?: File
    }) => Promise<{
        success?: boolean
        message?: string
        cardsCreated?: number
        tier?: string
        remaining?: number
        requiresPro?: boolean
        paymentIssue?: boolean
        resetTime?: Date
        requestId?: string
        error?: string
    }>
    cancelGeneration: () => void
}

export function useAIFlashcards(): UseAIFlashcardsResult {
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState<ProgressData | null>(null)
    const eventSourceRef = useRef<EventSource | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const cancelGeneration = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsGenerating(false)
        setProgress(null)
    }, [])

    const generateFlashcards = useCallback(
        async (params: {
            deckId: string
            prompt: string
            file?: File
        }): Promise<{
            success?: boolean
            message?: string
            cardsCreated?: number
            tier?: string
            remaining?: number
            requiresPro?: boolean
            paymentIssue?: boolean
            resetTime?: Date
            requestId?: string
            error?: string
        }> => {
            return new Promise((resolve, reject) => {
                const processGeneration = async () => {
                    try {
                        // Cancel any existing generation
                        cancelGeneration()

                        setIsGenerating(true)
                        setProgress({
                            step: 'starting',
                            percentage: 0,
                            message: 'Initializing AI flashcard generation...',
                        })

                        let fileId: string | undefined
                        let fileType: string | undefined

                        // Handle file upload if provided
                        if (params.file) {
                            setProgress({
                                step: 'file_upload',
                                percentage: 5,
                                message: 'Uploading file...',
                            })

                            try {
                                const formData = new FormData()
                                formData.append('file', params.file)

                                const uploadResponse = await fetch('/api/ai-flashcards/upload', {
                                    method: 'POST',
                                    body: formData,
                                })

                                if (!uploadResponse.ok) {
                                    const errorData = await uploadResponse.json()
                                    throw new Error(errorData.error || 'File upload failed')
                                }

                                const uploadResult = await uploadResponse.json()
                                fileId = uploadResult.fileId
                                fileType = uploadResult.fileType
                            } catch (uploadError) {
                                setIsGenerating(false)
                                setProgress(null)
                                reject({
                                    type: 'error',
                                    error: uploadError instanceof Error 
                                        ? uploadError.message 
                                        : 'File upload failed',
                                })
                                return
                            }
                        }

                        // Create abort controller for the fetch request
                        abortControllerRef.current = new AbortController()

                        // Prepare SSE request body
                        const sseBody = {
                            deckId: params.deckId,
                            prompt: params.prompt,
                            ...(fileId && fileType ? { fileId, fileType } : {}),
                        }

                        // Start the SSE request
                        fetch('/api/ai-flashcards/sse', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(sseBody),
                            signal: abortControllerRef.current.signal,
                        })
                            .then((response) => {
                                if (!response.ok) {
                                    if (response.status === 429) {
                                        // Handle rate limiting
                                        return response.json().then((data) => {
                                            setIsGenerating(false)
                                            setProgress(null)
                                            reject({
                                                type: 'rate_limit',
                                                ...data,
                                            })
                                        })
                                    }
                                    throw new Error(
                                        `HTTP ${response.status}: ${response.statusText}`
                                    )
                                }

                                if (!response.body) {
                                    throw new Error('No response body')
                                }

                                const reader = response.body.getReader()
                                const decoder = new TextDecoder()

                                const readStream = () => {
                                    reader
                                        .read()
                                        .then(({ done, value }) => {
                                            if (done) {
                                                setIsGenerating(false)
                                                setProgress(null)
                                                return
                                            }

                                            const chunk = decoder.decode(value)
                                            const lines = chunk.split('\n')

                                            for (const line of lines) {
                                                if (line.startsWith('data: ')) {
                                                    try {
                                                        const messageData =
                                                            line.slice(6)
                                                        if (messageData.trim()) {
                                                            const message: SSEMessage =
                                                                JSON.parse(
                                                                    messageData
                                                                )

                                                            switch (message.type) {
                                                                case 'progress':
                                                                    if (
                                                                        message.progress
                                                                    ) {
                                                                        setProgress(
                                                                            message.progress
                                                                        )
                                                                    }
                                                                    break

                                                                case 'success':
                                                                    setIsGenerating(
                                                                        false
                                                                    )
                                                                    setProgress({
                                                                        step: 'complete',
                                                                        percentage: 100,
                                                                        message:
                                                                            'Flashcards generated successfully!',
                                                                    })
                                                                    resolve(
                                                                        message.data ||
                                                                            {}
                                                                    )
                                                                    return

                                                                case 'error':
                                                                    setIsGenerating(
                                                                        false
                                                                    )
                                                                    setProgress(
                                                                        null
                                                                    )
                                                                    reject({
                                                                        type: 'error',
                                                                        error: message.error,
                                                                        data: message.data,
                                                                    })
                                                                    return

                                                                case 'rate_limit':
                                                                    setIsGenerating(
                                                                        false
                                                                    )
                                                                    setProgress(
                                                                        null
                                                                    )
                                                                    reject({
                                                                        type: 'rate_limit',
                                                                        error: message.error,
                                                                        data: message.data,
                                                                    })
                                                                    return
                                                            }
                                                        }
                                                    } catch (parseError) {
                                                        console.error(
                                                            'Error parsing SSE message:',
                                                            parseError
                                                        )
                                                    }
                                                }
                                            }

                                            readStream()
                                        })
                                        .catch((error) => {
                                            if (
                                                !abortControllerRef.current?.signal
                                                    .aborted
                                            ) {
                                                setIsGenerating(false)
                                                setProgress(null)
                                                reject({
                                                    type: 'error',
                                                    error:
                                                        'Stream reading error: ' +
                                                        error.message,
                                                })
                                            }
                                        })
                                }

                                readStream()
                            })
                            .catch((error) => {
                                if (!abortControllerRef.current?.signal.aborted) {
                                    setIsGenerating(false)
                                    setProgress(null)
                                    reject({
                                        type: 'error',
                                        error: 'Network error: ' + error.message,
                                    })
                                }
                            })
                    } catch (error) {
                        setIsGenerating(false)
                        setProgress(null)
                        reject({
                            type: 'error',
                            error:
                                'Unexpected error: ' +
                                (error instanceof Error
                                    ? error.message
                                    : 'Unknown error'),
                        })
                    }
                }

                processGeneration()
            })
        },
        [cancelGeneration]
    )

    return {
        isGenerating,
        progress,
        generateFlashcards,
        cancelGeneration,
    }
}
