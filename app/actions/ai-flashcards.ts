'use server'

import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { MAX_PDF_BYTES, aiUploadPathname, deleteBlobs } from '@/lib/blob'
import {
    AI_ITEM_TYPES,
    type AiItem,
    type AiItemType,
    MAX_ITEMS_PER_GENERATION,
    aiItemSchema,
    aiItemStrings,
    aiItemToInput,
    buildSystemPrompt,
    buildUserPrompt,
    dedupeAiItems,
    isAiItemType,
    itemInputSchema,
    parseDeckTags,
} from '@/lib/items'
import { checkAIRateLimitWithDetails } from '@/lib/rate-limit/ai-rate-limit'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { randomUUID } from 'crypto'
import { z } from 'zod'

import { Session, getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'

import { createItemsFromJson } from './flashcard'

// Constants
const MAX_PROMPT_LENGTH = 1000

// Gemini 3 Flash: good instruction following and item quality at a low price.
// GOOGLE_AI_MODEL can switch it, e.g. to gemini-3.1-flash-lite to save cost.
const AI_MODEL = process.env.GOOGLE_AI_MODEL?.trim() || 'gemini-3-flash-preview'
// Thinking tokens count against the output budget. 60 items need up to ~12k
// tokens, and a cut-off JSON fails the whole generation. Only used tokens are billed.
const AI_MAX_OUTPUT_TOKENS = 32768

// Schemas
const aiOutputSchema = z.object({
    items: z
        .array(aiItemSchema)
        .min(1)
        .max(MAX_ITEMS_PER_GENERATION + 5), // A few extra so the whole answer is not rejected
})

interface GenerateFlashcardsParams {
    deckId: string
    prompt: string
    /** Blob URL of a PDF the browser uploaded to the user's AI upload folder. */
    fileUrl?: string
    /** Item types to generate. Empty means all AI types. */
    types?: string[]
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
    /** Created items (type and prompt), for the result view. */
    items?: Array<{ type: string; front: string }>
}

type ProgressCallback = (
    step: string,
    percentage: number,
    message: string
) => void

// Security logging
function logSecurityEvent(event: {
    userId: string
    action: string
    details?: string
    severity: 'low' | 'medium' | 'high'
    requestId: string
}) {
    console.warn('Security Event:', {
        timestamp: new Date().toISOString(),
        userId: event.userId.substring(0, 8) + '...',
        action: event.action,
        severity: event.severity,
        requestId: event.requestId,
        details: event.details || 'No details',
    })
}

// Input sanitization
function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return ''

    return input
        .trim()
        .replace(/[<>'"]/g, '')
        .replace(/javascript:|data:|vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
        .substring(0, MAX_PROMPT_LENGTH)
}

/**
 * Reads the user's uploaded PDF from Blob. Only a validated pathname in the
 * user's own AI upload folder is read, through the Blob SDK and our own store,
 * with a size cap and a magic-byte check. The client URL is never fetched.
 */
async function loadPdf(
    fileUrl: string,
    userId: string
): Promise<{ data: Uint8Array } | { error: string }> {
    const pathname = aiUploadPathname(fileUrl, userId)
    if (!pathname) {
        return { error: 'invalid_url' }
    }
    const { get } = await import('@vercel/blob')
    const result = await get(pathname, { access: 'public', useCache: false })
    if (!result || result.statusCode !== 200 || !result.stream) {
        return { error: 'not_found' }
    }
    if (result.blob.size > MAX_PDF_BYTES) {
        return { error: 'too_large' }
    }

    // Read with a hard cap as well, in case the stored size is off.
    const reader = result.stream.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_PDF_BYTES) {
            await reader.cancel()
            return { error: 'too_large' }
        }
        chunks.push(value)
    }
    const data = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
        data.set(chunk, offset)
        offset += chunk.byteLength
    }

    // %PDF- at the start
    const header = new TextDecoder('ascii').decode(data.subarray(0, 5))
    if (header !== '%PDF-') {
        return { error: 'not_pdf' }
    }
    return { data }
}

// Validate AI response for security
function validateAIResponse(
    items: AiItem[],
    requestId: string,
    userId: string
): boolean {
    for (const item of items) {
        const strings = aiItemStrings(item)
        // Check for dangerous patterns
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
        ]

        for (const pattern of dangerousPatterns) {
            if (strings.some((text) => pattern.test(text))) {
                logSecurityEvent({
                    userId,
                    action: 'malicious_ai_response',
                    details: 'Dangerous pattern detected in AI response',
                    severity: 'high',
                    requestId,
                })
                return false
            }
        }
    }
    return true
}

// Error handling
function handleAIError(
    error: unknown,
    t: (key: string, params?: Record<string, string | number | Date>) => string,
    requestId: string
): AIGenerationResult {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()

        if (message.includes('rate limit') || message.includes('quota')) {
            return {
                success: false,
                error: t('aiRateLimitExceeded'),
                requestId,
            }
        }
        if (
            message.includes('api key') ||
            message.includes('authentication') ||
            // Unknown or retired model id, e.g. a wrong GOOGLE_AI_MODEL.
            (message.includes('model') &&
                (message.includes('not found') ||
                    message.includes('not supported')))
        ) {
            return { success: false, error: t('aiConfigError'), requestId }
        }
        if (message.includes('timeout')) {
            return { success: false, error: t('aiTimeoutError'), requestId }
        }
    }

    return { success: false, error: t('aiGenerationError'), requestId }
}

// Main unified function
async function runGeneration(
    params: GenerateFlashcardsParams,
    onProgress?: ProgressCallback
): Promise<AIGenerationResult> {
    const requestId = randomUUID()
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.ai')

    try {
        onProgress?.('initialization', 0, 'Starting AI flashcard generation...')

        // Authentication check
        const session: Session | null = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.email) {
            return {
                success: false,
                error: authT('notAuthenticated'),
                requestId,
            }
        }

        const userId = session.user.id

        // Check the deck before any paid AI call. Its title, description and
        // tags give the model the topic and level.
        const deck = await getDeckById(params.deckId, userId)
        if (!deck) {
            const deckT = await getTranslations('deck')
            return { success: false, error: deckT('notFound'), requestId }
        }

        onProgress?.('validation', 5, 'Validating input...')

        // Input validation
        const sanitizedPrompt = sanitizeInput(params.prompt)
        const requestedTypes = (params.types ?? []).filter(isAiItemType)
        const allowedTypes: readonly AiItemType[] = requestedTypes.length
            ? requestedTypes
            : AI_ITEM_TYPES
        if (!sanitizedPrompt) {
            return {
                success: false,
                error: 'Invalid prompt provided',
                requestId,
            }
        }

        // Rate limiting
        onProgress?.('rate_limit', 10, 'Checking rate limits...')
        const rateLimitResult = await checkAIRateLimitWithDetails(
            userId,
            session.user.email
        )
        if (!rateLimitResult.allowed) {
            logSecurityEvent({
                userId,
                action: 'rate_limit_exceeded',
                details: `Tier: ${rateLimitResult.tier}`,
                severity: 'medium',
                requestId,
            })
            return {
                success: false,
                error: rateLimitResult.message,
                requiresPro: rateLimitResult.upgradeRequired,
                paymentIssue: rateLimitResult.paymentIssue,
                tier: rateLimitResult.tier,
                resetTime: rateLimitResult.resetTime,
                requestId,
            }
        }

        let pdf: Uint8Array | undefined
        if (params.fileUrl) {
            onProgress?.('file_validation', 15, 'Checking PDF...')
            const loaded = await loadPdf(params.fileUrl, userId)
            if ('error' in loaded) {
                logSecurityEvent({
                    userId,
                    action: 'invalid_pdf_upload',
                    details: loaded.error,
                    severity: loaded.error === 'invalid_url' ? 'high' : 'low',
                    requestId,
                })
                return {
                    success: false,
                    error:
                        loaded.error === 'too_large'
                            ? t('fileTooLarge', { max: '20 MB' })
                            : t('fileParseError'),
                    requestId,
                }
            }
            pdf = loaded.data
        }

        // AI Generation
        onProgress?.('ai_generation', 60, 'Generating flashcards with AI...')

        try {
            const { object } = await generateObject({
                model: google(AI_MODEL),
                schema: aiOutputSchema,
                system: buildSystemPrompt(allowedTypes),
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: buildUserPrompt({
                                    prompt: sanitizedPrompt,
                                    deck: {
                                        title: deck.title,
                                        description: deck.description,
                                        tags: parseDeckTags(deck.category),
                                    },
                                    hasDocument: Boolean(pdf),
                                }),
                            },
                            // Gemini reads the PDF itself: text, tables,
                            // figures and scanned pages.
                            ...(pdf
                                ? [
                                      {
                                          type: 'file' as const,
                                          data: pdf,
                                          mimeType: 'application/pdf',
                                      },
                                  ]
                                : []),
                        ],
                    },
                ],
                // Gemini 3 models are tuned for their default temperature of 1;
                // lowering it degrades output, so it is intentionally not set.
                maxTokens: AI_MAX_OUTPUT_TOKENS,
            })

            onProgress?.(
                'validation_response',
                80,
                'Validating generated flashcards...'
            )

            if (!object.items || object.items.length === 0) {
                return {
                    success: false,
                    error: t('noFlashcardsGenerated'),
                    requestId,
                }
            }

            // Security validation
            if (!validateAIResponse(object.items, requestId, userId)) {
                return {
                    success: false,
                    error: 'Generated content failed security validation',
                    requestId,
                }
            }

            // Map to the strict item schema and drop items the model got wrong.
            const ofAllowedType = object.items.filter((item) =>
                allowedTypes.includes(item.type)
            )
            const deduped = dedupeAiItems(ofAllowedType)
            const dropped: string[] = []
            const uniqueCards = deduped
                .map(aiItemToInput)
                .flatMap((input) => {
                    const parsed = itemInputSchema.safeParse(input)
                    if (parsed.success) return [parsed.data]
                    dropped.push(
                        parsed.error.issues
                            .map((issue) => issue.path.join('.'))
                            .join(',')
                    )
                    return []
                })
                .slice(0, MAX_ITEMS_PER_GENERATION)

            console.info('AI generation counts:', {
                requestId,
                model: AI_MODEL,
                returned: object.items.length,
                afterTypeFilter: ofAllowedType.length,
                afterDedupe: deduped.length,
                valid: uniqueCards.length,
            })
            if (dropped.length) {
                console.warn('AI items failed validation:', {
                    requestId,
                    fields: dropped,
                })
            }
            if (uniqueCards.length === 0) {
                return {
                    success: false,
                    error: t('noDuplicateCards'),
                    requestId,
                }
            }

            // Save to database
            onProgress?.('saving', 90, 'Saving flashcards...')

            logSecurityEvent({
                userId,
                action: 'successful_ai_generation',
                details: `Generated ${uniqueCards.length} items`,
                severity: 'low',
                requestId,
            })

            // Create flashcards in database
            const result = await createItemsFromJson({
                deckId: params.deckId,
                json: JSON.stringify(uniqueCards),
            })

            if (result.success) {
                const successCount = result.created ?? 0
                onProgress?.(
                    'complete',
                    100,
                    'Flashcards generated successfully!'
                )

                return {
                    success: true,
                    message: t('flashcardsGenerated', { count: successCount }),
                    cardsCreated: successCount,
                    tier: rateLimitResult.tier,
                    remaining: rateLimitResult.remaining,
                    requestId,
                    items: uniqueCards.map((item) => ({
                        type: item.type,
                        front: item.front ?? '',
                    })),
                }
            } else {
                return {
                    success: false,
                    error: result.error || t('bulkCreateError'),
                    requestId,
                }
            }
        } catch (aiError) {
            console.error('AI generation error:', {
                requestId,
                userId: userId.substring(0, 8),
                error:
                    aiError instanceof Error
                        ? aiError.message
                        : 'Unknown AI error',
            })
            return handleAIError(aiError, t, requestId)
        }
    } catch (error) {
        console.error('AI flashcards unified error:', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        })

        return {
            success: false,
            error: t('unexpectedError'),
            requestId,
        }
    }
}

/**
 * Runs a generation and always deletes the uploaded PDF afterwards. The file
 * is single use, so it is removed on success, error and rejection alike.
 */
export async function generateAIFlashcardsUnified(
    params: GenerateFlashcardsParams,
    onProgress?: ProgressCallback
): Promise<AIGenerationResult> {
    try {
        return await runGeneration(params, onProgress)
    } finally {
        if (params.fileUrl) {
            const session = await getServerSession(authOptions)
            const pathname = session?.user?.id
                ? aiUploadPathname(params.fileUrl, session.user.id)
                : null
            if (pathname) {
                await deleteBlobs([pathname])
            }
        }
    }
}

// Convenience function for direct use (without progress callback)
export async function generateAIFlashcards(
    params: GenerateFlashcardsParams
): Promise<AIGenerationResult> {
    return generateAIFlashcardsUnified(params)
}

// Function for use with progress callback (SSE)
export async function generateAIFlashcardsWithProgress(
    params: GenerateFlashcardsParams,
    onProgress: ProgressCallback
): Promise<AIGenerationResult> {
    return generateAIFlashcardsUnified(params, onProgress)
}
