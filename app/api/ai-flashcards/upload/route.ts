import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { NextRequest } from 'next/server'
import { join } from 'path'
import { tmpdir } from 'os'

import { getServerSession } from 'next-auth'

// Configure the route for larger payloads and streaming
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf']

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

export async function POST(request: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Parse multipart form data
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return Response.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 413 }
            )
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return Response.json(
                { error: 'Invalid file type. Only PDF files are supported' },
                { status: 400 }
            )
        }

        // Convert file to buffer using streaming
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Validate file type using magic bytes
        const fileTypeValidation = validateFileType(buffer, file.type)
        if (!fileTypeValidation.isValid) {
            return Response.json(
                { error: fileTypeValidation.error },
                { status: 400 }
            )
        }

        // Create temporary file
        const fileId = randomUUID()
        const tempDir = join(tmpdir(), 'ai-flashcards')
        const tempFilePath = join(tempDir, `${fileId}.pdf`)

        // Ensure temp directory exists
        await mkdir(tempDir, { recursive: true })

        // Write file to temporary location
        await writeFile(tempFilePath, buffer)

        // Return file reference
        return Response.json({
            success: true,
            fileId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        })
    } catch (error) {
        console.error('File upload error:', error)
        
        // Handle specific errors
        if (error instanceof Error) {
            if (error.message.includes('payload')) {
                return Response.json(
                    { error: 'File too large for upload' },
                    { status: 413 }
                )
            }
        }
        
        return Response.json(
            { error: 'Internal server error during file upload' },
            { status: 500 }
        )
    }
}