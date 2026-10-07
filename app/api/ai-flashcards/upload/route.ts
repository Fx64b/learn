import { authOptions } from '@/lib/auth'
import { MAX_PDF_BYTES, aiUploadPrefix, isBlobConfigured } from '@/lib/blob'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { type HandleUploadBody, handleUpload } from '@vercel/blob/client'

/**
 * Issues short-lived client tokens so the browser can upload a PDF for AI
 * generation straight to Vercel Blob. Vercel Functions accept at most 4.5 MB
 * per request, so large PDFs cannot pass through our own routes.
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isBlobConfigured()) {
        return NextResponse.json(
            { error: 'Uploads are not configured' },
            { status: 503 }
        )
    }

    let body: HandleUploadBody
    try {
        body = (await request.json()) as HandleUploadBody
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    try {
        const result = await handleUpload({
            request,
            body,
            onBeforeGenerateToken: async (pathname) => {
                if (
                    !pathname.startsWith(aiUploadPrefix(userId)) ||
                    pathname.includes('..')
                ) {
                    throw new Error('Invalid upload path')
                }
                const rate = await checkRateLimit(
                    `user:${userId}:upload`,
                    'upload'
                )
                if (!rate.success) {
                    throw new Error('Too many uploads')
                }
                return {
                    allowedContentTypes: ['application/pdf'],
                    maximumSizeInBytes: MAX_PDF_BYTES,
                    addRandomSuffix: true,
                }
            },
        })
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : 'Upload refused',
            },
            { status: 400 }
        )
    }
}
