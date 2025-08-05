'use server'

import { authOptions } from '@/lib/auth'
import { checkAIRateLimitWithDetails } from '@/lib/rate-limit/ai-rate-limit'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { randomUUID } from 'crypto'
import { Output } from 'pdf2json'
import { z } from 'zod'

import { Session, getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'

import { createFlashcardsFromJson } from './flashcard'

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf']
const MAX_PROMPT_LENGTH = 1000
const MAX_CARDS_PER_GENERATION = 55
const MAX_DOCUMENT_LENGTH = 50000
const PDF_PARSING_TIMEOUT = 30000

// Schemas
const flashcardSchema = z.object({
    flashcards: z
        .array(
            z.object({
                front: z.string().min(1).max(500),
                back: z.string().min(1).max(2000),
            })
        )
        .min(1)
        .max(MAX_CARDS_PER_GENERATION + 5), // Allow a few extra for safety to avoid rejection
})

interface GenerateFlashcardsParams {
    deckId: string
    prompt: string
    file?: File
    documentContent?: string // For when content is already extracted
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
    flashcards?: Array<{ front: string; back: string }> // Add this for validation
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

// File validation using magic bytes
function validateFileType(
    buffer: Buffer,
    declaredType: string
): { isValid: boolean; error?: string } {
    if (declaredType !== 'application/pdf') {
        return { isValid: false, error: 'Only PDF files are supported' }
    }

    if (buffer.length < 4) {
        return { isValid: false, error: 'File too small to be valid' }
    }

    // Check PDF magic bytes (%PDF)
    const pdfHeader = buffer.subarray(0, 4)
    const expectedHeader = Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF

    if (!pdfHeader.equals(expectedHeader)) {
        return { isValid: false, error: 'File is not a valid PDF' }
    }

    // Additional PDF structure validation
    const fileString = buffer.toString(
        'ascii',
        0,
        Math.min(1024, buffer.length)
    )
    if (!fileString.includes('%PDF-')) {
        return { isValid: false, error: 'Invalid PDF format' }
    }

    return { isValid: true }
}

// Secure PDF parsing with timeout
async function parsePDFSecurely(
    buffer: Buffer,
    requestId: string,
    userId: string,
    onProgress?: ProgressCallback
): Promise<string> {
    return new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
            logSecurityEvent({
                userId,
                action: 'pdf_parsing_timeout',
                details: `File size: ${buffer.length} bytes`,
                severity: 'medium',
                requestId,
            })
            reject(
                new Error(
                    'PDF parsing timeout - file may be corrupted or too complex'
                )
            )
        }, PDF_PARSING_TIMEOUT)

        try {
            onProgress?.('file_parsing', 30, 'Parsing PDF content...')

            // Dynamic import to avoid loading heavy PDF library on every request
            const pdfModule = await import('pdf2json')
            const PDFParser = pdfModule.default

            const pdfParser = new PDFParser(null as never, true)

            pdfParser.on('pdfParser_dataError', (errData) => {
                clearTimeout(timeoutId)
                logSecurityEvent({
                    userId,
                    action: 'pdf_parsing_error',
                    details: 'Parser error: ' + errData.parserError,
                    severity: 'medium',
                    requestId,
                })
                reject(new Error('Invalid PDF format or corrupted file'))
            })

            pdfParser.on('pdfParser_dataReady', (pdfData) => {
                clearTimeout(timeoutId)
                onProgress?.('file_parsing', 50, 'Extracting text content...')

                try {
                    const text = extractTextSafely(pdfData)
                    if (text.length < 10) {
                        reject(
                            new Error('PDF contains insufficient readable text')
                        )
                        return
                    }
                    resolve(text)
                } catch (extractionError) {
                    logSecurityEvent({
                        userId,
                        action: 'pdf_text_extraction_error',
                        details:
                            extractionError instanceof Error
                                ? extractionError.message
                                : 'Unknown error',
                        severity: 'low',
                        requestId,
                    })
                    reject(new Error('Failed to extract text from PDF'))
                }
            })

            // Parse the buffer directly
            pdfParser.parseBuffer(buffer)
        } catch (error) {
            clearTimeout(timeoutId)
            reject(error)
        }
    })
}

// Safe text extraction from PDF data
function extractTextSafely(pdfData: Output): string {
    const pages = pdfData?.Pages || []
    let text = ''

    for (const page of pages) {
        const texts = page?.Texts || []
        for (const textObj of texts) {
            try {
                const decodedText = decodeURIComponent(textObj?.R?.[0]?.T || '')
                if (decodedText.trim()) {
                    text += decodedText + ' '
                }
            } catch {
                // Skip malformed text
                continue
            }
        }
        text += '\n'
    }

    return text.trim()
}

// Validate AI response for security
function validateAIResponse(
    flashcards: Array<{ front: string; back: string }>,
    requestId: string,
    userId: string
): boolean {
    for (const card of flashcards) {
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
            if (pattern.test(card.front) || pattern.test(card.back)) {
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

        // Validate length constraints
        if (card.front.length > 500 || card.back.length > 2000) {
            logSecurityEvent({
                userId,
                action: 'ai_response_length_violation',
                details: `Front: ${card.front.length}, Back: ${card.back.length}`,
                severity: 'low',
                requestId,
            })
            return false
        }
    }
    return true
}

// Remove duplicates
function removeDuplicateCards(
    cards: Array<{ front: string; back: string }>
): Array<{ front: string; back: string }> {
    const seen = new Set<string>()
    return cards.filter((card) => {
        const key = card.front.toLowerCase().trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

// AI prompts
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
11. Do not include any HTML, JavaScript, or other code in the responses
12. Generate 5-${MAX_CARDS_PER_GENERATION} flashcards. Quality over quantity.`
}

function buildUserPrompt(prompt: string, documentContent?: string): string {
    let userPrompt = `Create flashcards for: ${prompt}`

    if (documentContent) {
        userPrompt += `\n\nBase the flashcards on this document content:\n\n${documentContent}`
    }

    return userPrompt
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
        if (message.includes('api key') || message.includes('authentication')) {
            return { success: false, error: t('aiConfigError'), requestId }
        }
        if (message.includes('timeout')) {
            return { success: false, error: t('aiTimeoutError'), requestId }
        }
    }

    return { success: false, error: t('aiGenerationError'), requestId }
}

// Main unified function
export async function generateAIFlashcardsUnified(
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

        onProgress?.('validation', 5, 'Validating input...')

        // Input validation
        const sanitizedPrompt = sanitizeInput(params.prompt)
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

        let documentContent = params.documentContent || ''

        // Process file if provided and no content passed
        if (params.file && !documentContent) {
            onProgress?.('file_validation', 15, 'Validating file...')

            // Validate file size
            if (params.file.size > MAX_FILE_SIZE) {
                return {
                    success: false,
                    error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                    requestId,
                }
            }

            // Validate file type
            if (!ALLOWED_FILE_TYPES.includes(params.file.type)) {
                return {
                    success: false,
                    error: 'Only PDF files are supported',
                    requestId,
                }
            }

            // Convert file to buffer
            const arrayBuffer = await params.file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Validate file type using magic bytes
            const fileTypeValidation = validateFileType(
                buffer,
                params.file.type
            )
            if (!fileTypeValidation.isValid) {
                logSecurityEvent({
                    userId,
                    action: 'invalid_file_type',
                    details: fileTypeValidation.error,
                    severity: 'high',
                    requestId,
                })
                return {
                    success: false,
                    error: fileTypeValidation.error!,
                    requestId,
                }
            }

            // Parse PDF content
            try {
                documentContent = await parsePDFSecurely(
                    buffer,
                    requestId,
                    userId,
                    onProgress
                )

                if (documentContent.trim().length < 50) {
                    return {
                        success: false,
                        error: 'PDF contains insufficient readable content',
                        requestId,
                    }
                }

                // Truncate if too long
                if (documentContent.length > MAX_DOCUMENT_LENGTH) {
                    documentContent =
                        documentContent.substring(0, MAX_DOCUMENT_LENGTH) +
                        '...'
                }
            } catch (parseError) {
                console.error('PDF parsing error:', {
                    requestId,
                    userId: userId.substring(0, 8),
                    error:
                        parseError instanceof Error
                            ? parseError.message
                            : 'Unknown error',
                })

                const errorMessage =
                    parseError instanceof Error
                        ? parseError.message
                        : 'Failed to process PDF file'

                return {
                    success: false,
                    error: errorMessage,
                    requestId,
                }
            }
        }

        // AI Generation
        onProgress?.('ai_generation', 60, 'Generating flashcards with AI...')

        try {
            const { object } = await generateObject({
                model: google('gemini-1.5-flash'),
                schema: flashcardSchema,
                system: buildSystemPrompt(),
                prompt: buildUserPrompt(sanitizedPrompt, documentContent),
                temperature: 0.7,
                maxTokens: 4000,
            })

            onProgress?.(
                'validation_response',
                80,
                'Validating generated flashcards...'
            )

            if (!object.flashcards || object.flashcards.length === 0) {
                return {
                    success: false,
                    error: t('noFlashcardsGenerated'),
                    requestId,
                }
            }

            // Security validation
            if (!validateAIResponse(object.flashcards, requestId, userId)) {
                return {
                    success: false,
                    error: 'Generated content failed security validation',
                    requestId,
                }
            }

            // Remove duplicates
            const uniqueCards = removeDuplicateCards(object.flashcards)
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
                details: `Generated ${uniqueCards.length} cards`,
                severity: 'low',
                requestId,
            })

            // Create flashcards in database
            const result = await createFlashcardsFromJson({
                deckId: params.deckId,
                cardsJson: JSON.stringify(uniqueCards),
            })

            if (result.success) {
                const successCount =
                    result.results?.filter((r) => r.success).length || 0
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
                    flashcards: uniqueCards,
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
