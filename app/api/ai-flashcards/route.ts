import { authOptions } from '@/lib/auth'
import { checkAIRateLimitWithDetails } from '@/lib/rate-limit/ai-rate-limit'
import { z } from 'zod'

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

import {
    generateAIFlashcards,
    generateAIFlashcardsWithProgress,
} from '@/app/actions/ai-flashcards'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Request validation schema
const aiFlashcardsSchema = z.object({
    prompt: z.string().min(1).max(1000),
    deckId: z.string().nanoid(),
    file: z.instanceof(File).optional(),
})

interface SSEMessage {
    type: 'progress' | 'success' | 'error' | 'rate_limit'
    data?: any
    error?: string
    progress?: {
        step: string
        percentage: number
        message: string
    }
}

export async function POST(request: NextRequest) {
    const requestId = crypto.randomUUID()

    try {
        // Authentication check
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Rate limiting check
        const rateLimitResult = await checkAIRateLimitWithDetails(
            session.user.id,
            session.user.email!
        )
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    type: 'rate_limit',
                    error: rateLimitResult.message,
                    data: {
                        requiresPro: rateLimitResult.upgradeRequired,
                        paymentIssue: rateLimitResult.paymentIssue,
                        tier: rateLimitResult.tier,
                        resetTime: rateLimitResult.resetTime,
                        requestId,
                    },
                },
                { status: 429 }
            )
        }

        // Parse multipart form data
        const formData = await request.formData()
        const prompt = formData.get('prompt') as string
        const deckId = formData.get('deckId') as string
        const file = formData.get('file') as File | null

        // Validate input
        const validation = aiFlashcardsSchema.safeParse({
            prompt,
            deckId,
            file: file || undefined,
        })

        if (!validation.success) {
            return NextResponse.json(
                {
                    type: 'error',
                    error: 'Invalid request data',
                    requestId,
                },
                { status: 400 }
            )
        }

        // Check if request wants SSE
        const acceptHeader = request.headers.get('accept')
        const wantsSSE = acceptHeader?.includes('text/event-stream')

        if (wantsSSE) {
            // Return SSE stream
            return createSSEResponse(validation.data, requestId)
        } else {
            // Return regular JSON response
            const result = await generateAIFlashcards({
                prompt: validation.data.prompt,
                deckId: validation.data.deckId,
                file: validation.data.file,
            })

            return NextResponse.json(result)
        }
    } catch (error) {
        console.error('AI flashcards API error:', { requestId, error })
        return NextResponse.json(
            {
                type: 'error',
                error: 'Internal server error',
                requestId,
            },
            { status: 500 }
        )
    }
}

function createSSEResponse(
    data: z.infer<typeof aiFlashcardsSchema>,
    requestId: string
) {
    const encoder = new TextEncoder()
    let controller: ReadableStreamDefaultController<Uint8Array>

    const stream = new ReadableStream({
        start(ctrl) {
            controller = ctrl

            // Send initial connection message
            const initialMessage: SSEMessage = {
                type: 'progress',
                progress: {
                    step: 'connected',
                    percentage: 0,
                    message: 'Connected to AI service...',
                },
            }
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`)
            )

            // Start processing
            processAIRequest(data, requestId, controller, encoder).finally(
                () => {
                    try {
                        controller.close()
                    } catch (e) {
                        // Stream might already be closed
                    }
                }
            )
        },
        cancel() {
            // Cleanup when client disconnects
            try {
                controller?.close()
            } catch (e) {
                // Stream might already be closed
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'X-Request-ID': requestId,
        },
    })
}

async function processAIRequest(
    data: z.infer<typeof aiFlashcardsSchema>,
    requestId: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
    encoder: TextEncoder
) {
    try {
        const sendProgress = (
            step: string,
            percentage: number,
            message: string
        ) => {
            const progressMessage: SSEMessage = {
                type: 'progress',
                progress: { step, percentage, message },
            }
            try {
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify(progressMessage)}\n\n`
                    )
                )
            } catch (e) {
                // Client might have disconnected
            }
        }

        const result = await generateAIFlashcardsWithProgress(
            {
                prompt: data.prompt,
                deckId: data.deckId,
                file: data.file,
            },
            sendProgress
        )

        // Send final result
        const finalMessage: SSEMessage = result.success
            ? {
                  type: 'success',
                  data: result,
              }
            : {
                  type: 'error',
                  error: result.error,
                  data: result,
              }

        controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalMessage)}\n\n`)
        )
    } catch (error) {
        console.error('AI processing error:', { requestId, error })
        const errorMessage: SSEMessage = {
            type: 'error',
            error: 'Processing failed',
            data: { requestId },
        }
        try {
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`)
            )
        } catch (e) {
            // Client might have disconnected
        }
    }
}
