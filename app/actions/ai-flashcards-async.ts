'use server'

import { authOptions } from '@/lib/auth'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { randomUUID } from 'crypto'
import { Output } from 'pdf2json'
import { z } from 'zod'

import { Session, getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'

import { createFlashcardsFromJson } from './flashcard'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf']
const MAX_PROMPT_LENGTH = 1000
const MAX_CARDS_PER_GENERATION = 60
const MAX_DOCUMENT_LENGTH = 500000 // 500KB
const PDF_PARSING_TIMEOUT = 10000 // 10 seconds
const MAX_TEXT_EXTRACTION_LENGTH = 600000 // 600KB

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
    requestId?: string
}

interface SecurityEvent {
    userId: string
    action: string
    details: string | undefined
    severity: 'low' | 'medium' | 'high'
    requestId: string
}

// Progress callback type
type ProgressCallback = (step: string, percentage: number, message: string) => void

// Security logging function
function logSecurityEvent(event: SecurityEvent): void {
    console.warn('Security Event:', {
        timestamp: new Date().toISOString(),
        userId: event.userId.substring(0, 8) + '...',
        action: event.action,
        severity: event.severity,
        requestId: event.requestId,
        details:
            typeof event.details === 'string'
                ? event.details
                : '[SANITIZED_OBJECT]',
    })
}

function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return ''
    }

    return input
        .trim()
        .replace(/[<>'"]/g, '') // Remove HTML/XML dangerous chars only
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/data:text\/html/gi, '') // Remove data URLs
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters only
        .substring(0, MAX_PROMPT_LENGTH) // Ensure length limit
}

function validatePrompt(
    prompt: string,
    requestId: string,
    userId: string
): { isValid: boolean; error?: string } {
    const dangerousPatterns = [
        { pattern: /javascript:/i, name: 'javascript_protocol' },
        { pattern: /<script/i, name: 'script_tag' },
        { pattern: /on\w+\s*=/i, name: 'event_handler' },
        { pattern: /data:text\/html/i, name: 'data_url' },
        { pattern: /vbscript:/i, name: 'vbscript_protocol' },
        { pattern: /file:\/\//i, name: 'file_protocol' },
        { pattern: /@import/i, name: 'css_import' },
        { pattern: /expression\s*\(/i, name: 'css_expression' },
    ]

    for (const { pattern, name } of dangerousPatterns) {
        if (pattern.test(prompt)) {
            logSecurityEvent({
                userId,
                action: 'dangerous_prompt_pattern',
                details: `Pattern detected: ${name}`,
                severity: 'high',
                requestId,
            })
            return {
                isValid: false,
                error: 'Invalid characters detected in prompt',
            }
        }
    }

    // Check for excessive repetition (potential spam/DoS)
    const words = prompt.split(/\s+/)
    const uniqueWords = new Set(words)
    if (words.length > 50 && uniqueWords.size / words.length < 0.3) {
        logSecurityEvent({
            userId,
            action: 'suspicious_prompt_repetition',
            details: `Repetition ratio: ${uniqueWords.size / words.length}`,
            severity: 'medium',
            requestId,
        })
        return { isValid: false, error: 'Prompt contains excessive repetition' }
    }

    return { isValid: true }
}

// File type validation using magic bytes
function validateFileType(
    buffer: Buffer,
    declaredType: string
): { isValid: boolean; error?: string } {
    if (declaredType !== 'application/pdf') {
        return { isValid: false, error: 'Only PDF files are supported' }
    }

    // Check PDF magic bytes (%PDF)
    if (buffer.length < 4) {
        return { isValid: false, error: 'File too small to be valid' }
    }

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

    // Check for PDF version (should be 1.0 to 2.0)
    const versionMatch = fileString.match(/%PDF-(\d+\.\d+)/)
    if (versionMatch) {
        const version = parseFloat(versionMatch[1])
        if (version < 1.0 || version > 2.0) {
            return { isValid: false, error: 'Unsupported PDF version' }
        }
    }

    return { isValid: true }
}

// Enhanced base64 validation
function validateBase64(base64String: string): {
    isValid: boolean
    error?: string
} {
    // Check basic base64 format
    if (!base64String.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        return { isValid: false, error: 'Invalid file encoding format' }
    }

    // Check length is multiple of 4 (proper base64 padding)
    if (base64String.length % 4 !== 0) {
        return { isValid: false, error: 'Invalid file encoding length' }
    }

    // Basic length check (prevent extremely large payloads)
    const estimatedSize = (base64String.length * 3) / 4
    if (estimatedSize > MAX_FILE_SIZE * 1.5) {
        // Account for base64 overhead
        return { isValid: false, error: 'File too large' }
    }

    return { isValid: true }
}

// Secure PDF parsing with enhanced protection
async function parsePDFSecurely(
    buffer: Buffer,
    requestId: string,
    userId: string,
    onProgress: ProgressCallback
): Promise<string> {
    try {
        onProgress('pdf_parsing', 20, 'Parsing PDF document...')
        
        const pdfModule = await import('pdf2json')
        const PDFParser = pdfModule.default

        return new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, true)
            let isResolved = false

            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                }
            }

            // Strict timeout protection
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true
                    cleanup()
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
                }
            }, PDF_PARSING_TIMEOUT)

            pdfParser.on('pdfParser_dataError', (errData) => {
                if (!isResolved) {
                    isResolved = true
                    cleanup()
                    logSecurityEvent({
                        userId,
                        action: 'pdf_parsing_error',
                        details:
                            'Parser error occurred: ' + errData.parserError,
                        severity: 'medium',
                        requestId,
                    })
                    reject(new Error('Invalid PDF format or corrupted file'))
                }
            })

            pdfParser.on('pdfParser_dataReady', (pdfData: Output) => {
                if (!isResolved) {
                    isResolved = true
                    cleanup()

                    try {
                        onProgress('text_extraction', 40, 'Extracting text from PDF...')
                        const text = extractTextSafely(pdfData)
                        if (text.length < 10) {
                            reject(
                                new Error(
                                    'PDF contains insufficient readable text'
                                )
                            )
                            return
                        }
                        resolve(text)
                    } catch (extractionError) {
                        logSecurityEvent({
                            userId,
                            action: 'pdf_text_extraction_error',
                            details:
                                'Text extraction failed: ' + extractionError,
                            severity: 'low',
                            requestId,
                        })
                        reject(new Error('Failed to extract text from PDF'))
                    }
                }
            })

            try {
                pdfParser.parseBuffer(buffer)
            } catch (parseError) {
                if (!isResolved) {
                    isResolved = true
                    cleanup()
                    console.log('PDF parsing error:', parseError)
                    reject(new Error('Failed to initiate PDF parsing'))
                }
            }
        })
    } catch (importError) {
        console.error('Failed to import pdf2json:', importError)
        throw new Error(
            'PDF processing is not available - please contact support'
        )
    }
}

// Safe text extraction with content filtering
function extractTextSafely(pdfData: Output): string {
    let fullText = ''

    if (!pdfData?.Pages) {
        return ''
    }

    for (const page of pdfData.Pages) {
        if (!page.Texts) continue

        for (const text of page.Texts) {
            if (!text.R) continue

            for (const r of text.R) {
                if (!r.T) continue

                try {
                    const decodedText = decodeURIComponent(r.T)
                    // Remove only dangerous characters while preserving international characters like ä, ö, ü, é, etc.
                    const cleanText = decodedText
                        .replace(/[<>{}[\]\\\/\x00-\x1f\x7f-\x9f]/g, ' ') // Remove dangerous chars and control chars
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim()

                    if (cleanText.length > 0) {
                        fullText += cleanText + ' '
                    }

                    // Prevent memory exhaustion
                    if (fullText.length > MAX_TEXT_EXTRACTION_LENGTH) {
                        return (
                            fullText.substring(0, MAX_TEXT_EXTRACTION_LENGTH) +
                            '...'
                        )
                    }
                } catch (decodeError) {
                    console.log(
                        'Decode error: ' +
                            decodeError?.toString().substring(0, 10) +
                            '...'
                    )
                    // Skip malformed text without logging sensitive data
                    continue
                }
            }
        }
        fullText += '\n'
    }

    return fullText.trim()
}

// Enhanced input validation
function validateInputEnhanced(
    params: GenerateFlashcardsParams,
    requestId: string,
    userId: string
): {
    isValid: boolean
    error?: string
} {
    // Validate deck ID format (alphanumeric, hyphens, underscores only)
    if (!params.deckId || !params.deckId.match(/^[a-zA-Z0-9_-]+$/)) {
        logSecurityEvent({
            userId,
            action: 'invalid_deck_id',
            details: 'Invalid deck ID format',
            severity: 'low',
            requestId,
        })
        return { isValid: false, error: 'Invalid deck ID format' }
    }

    if (!params.prompt || typeof params.prompt !== 'string') {
        return { isValid: false, error: 'Prompt is required' }
    }

    if (params.prompt.trim().length === 0) {
        return { isValid: false, error: 'Prompt cannot be empty' }
    }

    if (params.prompt.length > MAX_PROMPT_LENGTH) {
        logSecurityEvent({
            userId,
            action: 'prompt_too_long',
            details: `Length: ${params.prompt.length}`,
            severity: 'low',
            requestId,
        })
        return {
            isValid: false,
            error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`,
        }
    }

    // Enhanced prompt validation
    const promptValidation = validatePrompt(params.prompt, requestId, userId)
    if (!promptValidation.isValid) {
        return promptValidation
    }

    // File validation if provided
    if (params.fileContent || params.fileType) {
        if (!params.fileContent || !params.fileType) {
            return {
                isValid: false,
                error: 'Both file content and type must be provided',
            }
        }

        if (!ALLOWED_FILE_TYPES.includes(params.fileType)) {
            logSecurityEvent({
                userId,
                action: 'unsupported_file_type',
                details: params.fileType,
                severity: 'medium',
                requestId,
            })
            return { isValid: false, error: 'Only PDF files are supported' }
        }

        // Validate base64 encoding
        const base64Validation = validateBase64(params.fileContent)
        if (!base64Validation.isValid) {
            logSecurityEvent({
                userId,
                action: 'invalid_file_encoding',
                details: base64Validation.error?.toString(),
                severity: 'medium',
                requestId,
            })
            return base64Validation
        }
    }

    return { isValid: true }
}

// Validate AI response content for security
function validateAIResponse(
    flashcards: Array<{ front: string; back: string }>,
    requestId: string,
    userId: string
): boolean {
    for (const card of flashcards) {
        // Check for potentially malicious content
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
12. Keep content educational and appropriate

Generate between 5 and ${MAX_CARDS_PER_GENERATION - 5} flashcards based on the content provided. Quality over quantity - better to have fewer excellent cards than many poor ones.`
    // INFO: The - 5 was added after the ai tended to generate 1-3 cards over the limit.
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

function handleAIError(
    error: unknown,
    t: Awaited<ReturnType<typeof getTranslations>>,
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
            return {
                success: false,
                error: t('aiConfigError'),
                requestId,
            }
        }

        if (message.includes('model') || message.includes('not found')) {
            return {
                success: false,
                error: t('aiModelError'),
                requestId,
            }
        }

        if (message.includes('timeout')) {
            return {
                success: false,
                error: t('aiTimeoutError'),
                requestId,
            }
        }

        if (message.includes('content policy') || message.includes('safety')) {
            return {
                success: false,
                error: t('aiContentPolicyError'),
                requestId,
            }
        }
    }

    return {
        success: false,
        error: t('aiGenerationError'),
        requestId,
    }
}

export async function generateAIFlashcardsAsync(
    params: GenerateFlashcardsParams,
    onProgress: ProgressCallback
): Promise<AIGenerationResult> {
    const requestId = randomUUID()
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.ai')

    try {
        onProgress('initialization', 0, 'Starting AI flashcard generation...')

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

        onProgress('validation', 5, 'Validating input parameters...')

        // Enhanced input validation
        const validation = validateInputEnhanced(params, requestId, userId)
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error,
                requestId,
            }
        }

        onProgress('sanitization', 10, 'Sanitizing input...')

        // Sanitize prompt
        const sanitizedPrompt = sanitizeInput(params.prompt)

        let documentContent = ''

        // Handle file upload if provided
        if (params.fileContent && params.fileType) {
            try {
                onProgress('file_processing', 15, 'Processing uploaded file...')

                // Decode base64 file content
                const buffer = Buffer.from(params.fileContent, 'base64')

                // Validate file size
                if (buffer.length > MAX_FILE_SIZE) {
                    logSecurityEvent({
                        userId,
                        action: 'file_too_large',
                        details: `Size: ${buffer.length} bytes`,
                        severity: 'low',
                        requestId,
                    })
                    return {
                        success: false,
                        error: t('fileTooLarge', { max: '10MB' }),
                        requestId,
                    }
                }

                // Validate file type using magic bytes
                const fileTypeValidation = validateFileType(
                    buffer,
                    params.fileType
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
                        error: fileTypeValidation.error,
                        requestId,
                    }
                }

                // Parse PDF content securely
                if (params.fileType === 'application/pdf') {
                    documentContent = await parsePDFSecurely(
                        buffer,
                        requestId,
                        userId,
                        onProgress
                    )

                    // Content validation
                    if (documentContent.trim().length < 50) {
                        return {
                            success: false,
                            error: t('fileContentTooShort'),
                            requestId,
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
                console.error('Error parsing file:', {
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
                        : 'Unknown parsing error'

                // Provide specific error messages for common issues
                if (errorMessage.includes('timeout')) {
                    return {
                        success: false,
                        error: t('fileProcessingTimeout'),
                        requestId,
                    }
                } else if (
                    errorMessage.includes('insufficient readable text')
                ) {
                    return {
                        success: false,
                        error: t('fileContentEmpty'),
                        requestId,
                    }
                } else if (
                    errorMessage.includes('corrupted') ||
                    errorMessage.includes('Invalid PDF')
                ) {
                    return {
                        success: false,
                        error: t('fileCorrupted'),
                        requestId,
                    }
                } else {
                    return {
                        success: false,
                        error: t('fileParseError'),
                        requestId,
                    }
                }
            }
        }

        onProgress('ai_generation', 50, 'Generating flashcards with AI...')

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

            onProgress('validation_response', 80, 'Validating generated flashcards...')

            // Validate generated content
            if (!object.flashcards || object.flashcards.length === 0) {
                return {
                    success: false,
                    error: t('noFlashcardsGenerated'),
                    requestId,
                }
            }

            // Security validation of AI response
            const typedFlashcards = object.flashcards as Array<{ front: string; back: string }>
            if (!validateAIResponse(typedFlashcards, requestId, userId)) {
                return {
                    success: false,
                    error: 'Generated content failed security validation',
                    requestId,
                }
            }

            // Remove duplicates and validate content
            const uniqueCards = removeDuplicateCards(typedFlashcards)

            if (uniqueCards.length === 0) {
                return {
                    success: false,
                    error: t('noDuplicateCards'),
                    requestId,
                }
            }

            onProgress('saving', 90, 'Saving flashcards to database...')

            // Log successful generation
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
                
                onProgress('complete', 100, `Successfully generated ${successCount} flashcards!`)
                
                return {
                    success: true,
                    message: t('flashcardsGenerated', { count: successCount }),
                    cardsCreated: successCount,
                    requestId,
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
        console.error('Error generating AI flashcards:', {
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