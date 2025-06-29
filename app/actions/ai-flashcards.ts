'use server'

import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

import { getServerSession, Session } from 'next-auth'
import { getTranslations } from 'next-intl/server'

import { createFlashcardsFromJson } from './flashcard'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf']
const MAX_PROMPT_LENGTH = 1000
const MAX_CARDS_PER_GENERATION = 60

const flashcardSchema= z.object({
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

// Helper function to parse PDF with pdf2json
async function parsePDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        import('pdf2json')
            .then((module) => {
                const PDFParser = module.default
                const pdfParser = new PDFParser(null, true)

                pdfParser.on('pdfParser_dataError', (errData) => {
                    console.error('PDF parsing error:', errData.parserError)
                    reject(new Error('Failed to parse PDF'))
                })

                pdfParser.on('pdfParser_dataReady', (pdfData) => {
                    try {
                        let fullText = ''

                        // Extract text from all pages
                        if (pdfData && pdfData.Pages) {
                            pdfData.Pages.forEach((page) => {
                                if (page.Texts) {
                                    page.Texts.forEach((text) => {
                                        if (text.R) {
                                            text.R.forEach((r) => {
                                                if (r.T) {
                                                    // Decode URI component to handle special characters
                                                    const decodedText =
                                                        decodeURIComponent(r.T)
                                                    fullText +=
                                                        decodedText + ' '
                                                }
                                            })
                                        }
                                    })
                                    fullText += '\n'
                                }
                            })
                        }

                        resolve(fullText.trim())
                    } catch (error) {
                        console.error('Error processing PDF data:', error)
                        reject(error)
                    }
                })

                // Parse the buffer
                pdfParser.parseBuffer(buffer)
            })
            .catch((error) => {
                console.error('Error importing pdf2json:', error)
                reject(error)
            })
    })
}

export async function generateAIFlashcards({
    deckId,
    prompt,
    fileContent,
    fileType,
}: GenerateFlashcardsParams) {
    const authT = await getTranslations('auth')
    const t = await getTranslations('deck.ai')

    try {
        // Authentication check
        const session: Session | null = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { success: false, error: authT('notAuthenticated') }
        }

        // TODO: implement pro subscription check

        // Rate limiting - 5 per hour for AI generation
        const rateLimitResult = await checkRateLimit(
            `user:${session.user.email}:ai-generate`,
            'bulkCreate'
        )

        if (!rateLimitResult.success) {
            return {
                success: false,
                error: authT('bulkRatelimitExceeded'),
                rateLimitReset: rateLimitResult.reset,
            }
        }

        if (!prompt || prompt.trim().length === 0) {
            return { success: false, error: t('promptRequired') }
        }

        if (prompt.length > MAX_PROMPT_LENGTH) {
            return {
                success: false,
                error: t('promptTooLong', { max: MAX_PROMPT_LENGTH }),
            }
        }

        // Sanitize prompt to prevent injection
        const sanitizedPrompt = prompt.trim().replace(/[<>]/g, '')

        let documentContent = ''

        // Handle file upload if provided
        if (fileContent && fileType) {
            // Validate file type
            if (!ALLOWED_FILE_TYPES.includes(fileType)) {
                return { success: false, error: t('invalidFileType') }
            }

            // Decode base64 file content
            const buffer = Buffer.from(fileContent, 'base64')

            // Validate file size
            if (buffer.length > MAX_FILE_SIZE) {
                return {
                    success: false,
                    error: t('fileTooLarge', { max: '10MB' }),
                }
            }

            // Parse PDF content
            try {
                if (fileType === 'application/pdf') {
                    documentContent = await parsePDF(buffer)

                    // Basic content validation
                    if (
                        !documentContent ||
                        documentContent.trim().length < 50
                    ) {
                        return {
                            success: false,
                            error: t('fileContentTooShort'),
                        }
                    }

                    // Truncate document content if too long (keep under token limits)
                    const maxDocumentLength = 5000000
                    if (documentContent.length > maxDocumentLength) {
                        documentContent =
                            documentContent.substring(0, maxDocumentLength) +
                            '...'
                    }
                }
            } catch (parseError) {
                console.error('Error parsing file:', parseError)
                return { success: false, error: t('fileParseError') }
            }
        }

        // Build the system prompt
        const systemPrompt = `You are an expert educational content creator specializing in creating effective flashcards for learning and memorization.

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

Generate between 5 and ${MAX_CARDS_PER_GENERATION - 5} flashcards based on the content provided. Make sure to never exceed this limit under any circumstances.`

        // Build the user prompt
        let userPrompt = `Create flashcards for: ${sanitizedPrompt}`

        if (documentContent) {
            userPrompt += `\n\nBase the flashcards on the following document content:\n\n${documentContent}`
        }

        try {
            const { object } = await generateObject({
                model: google('gemini-1.5-flash'),
                schema: flashcardSchema,
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.7,
                maxTokens: 4000,
            })

            // Validate the generated flashcards
            if (!object.flashcards || object.flashcards.length === 0) {
                return { success: false, error: t('noFlashcardsGenerated') }
            }

            // Additional validation - ensure no duplicate questions
            const uniqueFronts = new Set(
                object.flashcards.map((card) => card.front.toLowerCase())
            )
            if (uniqueFronts.size < object.flashcards.length) {
                // Remove duplicates
                const seen = new Set<string>()
                object.flashcards = object.flashcards.filter((card) => {
                    const key = card.front.toLowerCase()
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
            }

            // Convert to JSON string for bulk creation
            const cardsJson = JSON.stringify(object.flashcards)

            const result = await createFlashcardsFromJson({
                deckId,
                cardsJson,
            })

            if (result.success) {
                const successCount =
                    result.results?.filter((r) => r.success).length || 0
                return {
                    success: true,
                    message: t('flashcardsGenerated', { count: successCount }),
                    cardsCreated: successCount,
                }
            } else {
                return {
                    success: false,
                    error: result.error || t('bulkCreateError'),
                }
            }
        } catch (aiError) {
            console.error('AI generation error:', aiError)

            // Check if it's a specific AI error
            if (aiError instanceof Error) {
                if (aiError.message.includes('rate limit')) {
                    return { success: false, error: t('aiRateLimitExceeded') }
                }
                if (aiError.message.includes('invalid API key')) {
                    return { success: false, error: t('aiConfigError') }
                }
                if (aiError.message.includes('No object generated')) {
                    return { success: false, error: t('noCardsGenerated') }
                }
            }

            return { success: false, error: t('aiGenerationError') }
        }
    } catch (error) {
        console.error('Error generating AI flashcards:', error)
        return { success: false, error: t('unexpectedError') }
    }
}
