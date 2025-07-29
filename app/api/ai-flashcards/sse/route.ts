import { authOptions } from '@/lib/auth'
import { checkAIRateLimitWithDetails } from '@/lib/rate-limit/ai-rate-limit'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { generateAIFlashcardsAsync } from '../../../actions/ai-flashcards-async'

// Type definitions for SSE messages
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
    progress?: {
        step: string
        percentage: number
        message: string
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Parse request body
        const body = await request.json()
        
        // Rate limit check
        const rateLimitResult = await checkAIRateLimitWithDetails(
            session.user.id,
            session.user.email!
        )
        
        if (!rateLimitResult.allowed) {
            return Response.json({
                type: 'rate_limit',
                error: rateLimitResult.message,
                data: {
                    requiresPro: rateLimitResult.upgradeRequired,
                    paymentIssue: rateLimitResult.paymentIssue,
                    tier: rateLimitResult.tier,
                    resetTime: rateLimitResult.resetTime
                }
            }, { status: 429 })
        }

        // Create a readable stream for Server-Sent Events
        const stream = new ReadableStream({
            start(controller) {
                // Progress callback function
                const onProgress = (step: string, percentage: number, message: string) => {
                    const progressMessage: SSEMessage = {
                        type: 'progress',
                        progress: { step, percentage, message }
                    }
                    const data = `data: ${JSON.stringify(progressMessage)}\n\n`
                    controller.enqueue(new TextEncoder().encode(data))
                }
                
                // Start async processing
                generateAIFlashcardsAsync(body, onProgress)
                    .then((result) => {
                        if (result.success) {
                            const successMessage: SSEMessage = {
                                type: 'success',
                                data: result
                            }
                            const data = `data: ${JSON.stringify(successMessage)}\n\n`
                            controller.enqueue(new TextEncoder().encode(data))
                        } else {
                            const errorMessage: SSEMessage = {
                                type: 'error',
                                error: result.error,
                                data: result
                            }
                            const data = `data: ${JSON.stringify(errorMessage)}\n\n`
                            controller.enqueue(new TextEncoder().encode(data))
                        }
                        controller.close()
                    })
                    .catch((error) => {
                        console.error('Error in flashcard generation:', error)
                        const errorMessage: SSEMessage = {
                            type: 'error',
                            error: 'An unexpected error occurred during generation'
                        }
                        const data = `data: ${JSON.stringify(errorMessage)}\n\n`
                        controller.enqueue(new TextEncoder().encode(data))
                        controller.close()
                    })
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        })
        
    } catch (error) {
        console.error('SSE endpoint error:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}