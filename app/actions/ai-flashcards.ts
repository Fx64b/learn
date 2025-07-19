'use server'

import { authOptions } from '@/lib/auth'
import { checkAIRateLimitWithDetails } from '@/lib/rate-limit/ai-rate-limit'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

import { Session, getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'

import { createFlashcardsFromJson } from './flashcard'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf']
const MAX_PROMPT_LENGTH = 1000
const MAX_CARDS_PER_GENERATION = 60
const MAX_DOCUMENT_LENGTH = 500000 // 500KB

const flashcardSchema = z.object({
    flashcards: z
        .array(
            z.object({
                front: z
                    .string()
                    .min(1)
                    .max(500)
                    .describe(
                        'The question or term on the front of the flashcard'
                    ),
                back: z
                    .string()
                    .min(1)
                    .max(2000)
                    .describe(
                        'The answer or explanation on the back of the flashcard'
                    ),
            })
        )
        .min(1)
        .max(MAX_CARDS_PER_GENERATION),
})

interface GenerateFlashcardsParams {
    deckId: string
    prompt: string
    fileContent?: string
    fileType?: string
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
}

// Improved PDF parsing with better error handling and fallbacks
async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        // Try to dynamically import pdf2json
        const module = await import('pdf2json')
        const PDFParser = module.default

        return new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, true)

            let timeoutId: NodeJS.Timeout | null = null

            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    timeoutId = null
                }
            }

            // Set timeout for PDF parsing (30 seconds max)
            timeoutId = setTimeout(() => {
                cleanup()
                reject(new Error('PDF parsing timeout'))
            }, 30000)

            pdfParser.on('pdfParser_dataError', (errData: any) => {
                cleanup()
                console.error('PDF parsing error:', errData.parserError)
                reject(
                    new Error('Failed to parse PDF - invalid or corrupted file')
                )
            })

            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                cleanup()
                try {
                    let fullText = ''

                    if (pdfData?.Pages) {
                        for (const page of pdfData.Pages) {
                            if (page.Texts) {
                                for (const text of page.Texts) {
                                    if (text.R) {
                                        for (const r of text.R) {
                                            if (r.T) {
                                                try {
                                                    const decodedText =
                                                        decodeURIComponent(r.T)
                                                    fullText +=
                                                        decodedText + ' '
                                                } catch (decodeError) {
                                                    // Skip malformed text
                                                    console.warn(
                                                        'Failed to decode text:',
                                                        r.T
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                                fullText += '\n'
                            }
                        }
                    }

                    const trimmedText = fullText.trim()

                    if (trimmedText.length < 10) {
                        reject(
                            new Error(
                                'PDF appears to be empty or contains no readable text'
                            )
                        )
                        return
                    }

                    resolve(trimmedText)
                } catch (error) {
                    console.error('Error processing PDF data:', error)
                    reject(new Error('Failed to extract text from PDF'))
                }
            })

            try {
                pdfParser.parseBuffer(buffer)
            } catch (parseError) {
                cleanup()
                reject(new Error('Failed to initiate PDF parsing'))
            }
        })
    } catch (importError) {
        console.error('Failed to import pdf2json:', importError)
        throw new Error(
            'PDF processing is not available - please contact support'
        )
    }
}

// Improved input validation
function validateInput(params: GenerateFlashcardsParams): {
    isValid: boolean
    error?: string
} {
    if (!params.deckId || typeof params.deckId !== 'string') {
        return { isValid: false, error: 'Invalid deck ID' }
    }

    if (!params.prompt || typeof params.prompt !== 'string') {
        return { isValid: false, error: 'Prompt is required' }
    }

    if (params.prompt.trim().length === 0) {
        return { isValid: false, error: 'Prompt cannot be empty' }
    }

    if (params.prompt.length > MAX_PROMPT_LENGTH) {
        return {
            isValid: false,
            error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`,
        }
    }

    // Validate file parameters if provided
    if (params.fileContent || params.fileType) {
        if (!params.fileContent || !params.fileType) {
            return {
                isValid: false,
                error: 'Both file content and type must be provided',
            }
        }

        if (!ALLOWED_FILE_TYPES.includes(params.fileType)) {
            return { isValid: false, error: 'Only PDF files are supported' }
        }
    }

    return { isValid: true }
}

export async function generateAIFlashcards(
    params: GenerateFlashcardsParams
): Promise<AIGenerationResult> {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.ai')

    try {
        // Input validation
        const validation = validateInput(params)
        if (!validation.isValid) {
            return { success: false, error: validation.error }
        }

        // Authentication check
        const session: Session | null = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.email) {
            return { success: false, error: authT('notAuthenticated') }
        }

        // Enhanced rate limiting check
        const rateLimitResult = await checkAIRateLimitWithDetails(
            session.user.id,
            session.user.email
        )

        if (!rateLimitResult.allowed) {
            return {
                success: false,
                error: rateLimitResult.message,
                requiresPro: rateLimitResult.upgradeRequired,
                paymentIssue: rateLimitResult.paymentIssue,
                tier: rateLimitResult.tier,
                resetTime: rateLimitResult.resetTime,
            }
        }

        // Sanitize prompt
        const sanitizedPrompt = params.prompt.trim().replace(/[<>]/g, '')

        let documentContent = ''

        // Handle file upload if provided
        if (params.fileContent && params.fileType) {
            try {
                // Decode base64 file content
                const buffer = Buffer.from(params.fileContent, 'base64')

                // Validate file size
                if (buffer.length > MAX_FILE_SIZE) {
                    return {
                        success: false,
                        error: t('fileTooLarge', { max: '10MB' }),
                    }
                }

                // Parse PDF content
                if (params.fileType === 'application/pdf') {
                    documentContent = await parsePDF(buffer)

                    // Content validation
                    if (documentContent.trim().length < 50) {
                        return {
                            success: false,
                            error: t('fileContentTooShort'),
                        }
                    }

                    // Truncate if too long
                    if (documentContent.length > MAX_DOCUMENT_LENGTH) {
                        documentContent =
                            documentContent.substring(0, MAX_DOCUMENT_LENGTH) +
                            '...'
                    }
                }
            } catch (parseError) {
                console.error('Error parsing file:', parseError)
                const errorMessage =
                    parseError instanceof Error
                        ? parseError.message
                        : 'Unknown parsing error'

                // Provide specific error messages for common issues
                if (errorMessage.includes('timeout')) {
                    return { success: false, error: t('fileProcessingTimeout') }
                } else if (errorMessage.includes('empty')) {
                    return { success: false, error: t('fileContentEmpty') }
                } else if (errorMessage.includes('corrupted')) {
                    return { success: false, error: t('fileCorrupted') }
                } else {
                    return { success: false, error: t('fileParseError') }
                }
            }
        }

        // Build AI prompts
        const systemPrompt = buildSystemPrompt()
        const userPrompt = buildUserPrompt(sanitizedPrompt, documentContent)

        try {
            const { object } = await generateObject({
                model: google('gemini-1.5-flash'),
                schema: flashcardSchema,
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.7,
                maxTokens: 4000,
            })

            // Validate generated content
            if (!object.flashcards || object.flashcards.length === 0) {
                return { success: false, error: t('noFlashcardsGenerated') }
            }

            // Remove duplicates and validate content
            const uniqueCards = removeDuplicateCards(object.flashcards)

            if (uniqueCards.length === 0) {
                return { success: false, error: t('noDuplicateCards') }
            }

            // Create flashcards in database
            const result = await createFlashcardsFromJson({
                deckId: params.deckId,
                cardsJson: JSON.stringify(uniqueCards),
            })

            if (result.success) {
                const successCount =
                    result.results?.filter((r) => r.success).length || 0
                return {
                    success: true,
                    message: t('flashcardsGenerated', { count: successCount }),
                    cardsCreated: successCount,
                    tier: rateLimitResult.tier,
                    remaining: rateLimitResult.remaining,
                }
            } else {
                return {
                    success: false,
                    error: result.error || t('bulkCreateError'),
                }
            }
        } catch (aiError) {
            console.error('AI generation error:', aiError)
            return handleAIError(aiError, t)
        }
    } catch (error) {
        console.error('Error generating AI flashcards:', error)
        return { success: false, error: t('unexpectedError') }
    }
}

function buildSystemPrompt(): string {
    return `You are an expert educational content creator specializing in creating effective flashcards for learning and memorization.

Your task is to generate high-quality flashcards based on the user's request. Follow these guidelines:

1. Create clear, concise questions on the front of each card
2. Provide comprehensive but digestible answers on the back
3. Focus on key concepts, definitions, and important facts
4. Use various question types: definitions, explanations, comparisons, examples
5. Ensure each flashcard tests a single concept or piece of information
6. Make questions specific enough to have a clear answer
7. Avoid yes/no questions unless absolutely necessary
8. Use active recall principles - questions should require thinking, not just recognition
9. For complex topics, break them down into multiple simpler cards
10. Maintain consistent difficulty appropriate to the topic

Generate between 5 and ${MAX_CARDS_PER_GENERATION - 5} flashcards based on the content provided. Quality over quantity - better to have fewer excellent cards than many poor ones.`
}

function buildUserPrompt(prompt: string, documentContent: string): string {
    let userPrompt = `Create flashcards for: ${prompt}`

    if (documentContent) {
        userPrompt += `\n\nBase the flashcards on the following document content:\n\n${documentContent}`
    }

    return userPrompt
}

function removeDuplicateCards(
    cards: Array<{ front: string; back: string }>
): Array<{ front: string; back: string }> {
    const seen = new Set<string>()
    return cards.filter((card) => {
        const key = card.front.toLowerCase().trim()
        if (seen.has(key)) {
            return false
        }
        seen.add(key)
        return true
    })
}

function handleAIError(error: unknown, t: any): AIGenerationResult {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()

        if (message.includes('rate limit') || message.includes('quota')) {
            return { success: false, error: t('aiRateLimitExceeded') }
        }

        if (message.includes('api key') || message.includes('authentication')) {
            return { success: false, error: t('aiConfigError') }
        }

        if (message.includes('model') || message.includes('not found')) {
            return { success: false, error: t('aiModelError') }
        }

        if (message.includes('timeout')) {
            return { success: false, error: t('aiTimeoutError') }
        }

        if (message.includes('content policy') || message.includes('safety')) {
            return { success: false, error: t('aiContentPolicyError') }
        }
    }

    return { success: false, error: t('aiGenerationError') }
}
