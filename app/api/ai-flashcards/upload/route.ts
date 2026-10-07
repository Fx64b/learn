import { authOptions } from '@/lib/auth'
import { MAX_PDF_BYTES, isBlobConfigured, isOwnAiUploadPath } from '@/lib/blob'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { issueSignedToken } from '@vercel/blob'
import {
    type HandleUploadPresignedBody,
    handleUploadPresigned,
} from '@vercel/blob/client'

/** How long a presigned upload URL stays valid. */
const UPLOAD_WINDOW_MS = 15 * 60 * 1000

/**
 * Issues presigned upload URLs so the browser can upload a PDF for AI
 * generation straight to Vercel Blob. Vercel Functions accept at most 4.5 MB
 * per request, so large PDFs cannot pass through our own routes. The
 * presigned flow works with Vercel OIDC (newer stores) and with a
 * read-write token (older stores, local dev).
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

    let body: HandleUploadPresignedBody
    try {
        body = (await request.json()) as HandleUploadPresignedBody
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    try {
        const result = await handleUploadPresigned({
            request,
            body,
            getSignedToken: async (pathname) => {
                // Only the user's own folder and safe PDF names.
                if (!isOwnAiUploadPath(pathname, userId)) {
                    throw new Error('Invalid upload path')
                }
                const rate = await checkRateLimit(
                    `user:${userId}:upload`,
                    'upload'
                )
                if (!rate.success) {
                    throw new Error('Too many uploads')
                }
                const validUntil = Date.now() + UPLOAD_WINDOW_MS
                const token = await issueSignedToken({
                    pathname,
                    operations: ['put'],
                    allowedContentTypes: ['application/pdf'],
                    maximumSizeInBytes: MAX_PDF_BYTES,
                    validUntil,
                })
                return {
                    token,
                    urlOptions: {
                        allowedContentTypes: ['application/pdf'],
                        maximumSizeInBytes: MAX_PDF_BYTES,
                        validUntil,
                    },
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
