import { AI_UPLOAD_PREFIX, isBlobConfigured } from '@/lib/blob'

import { NextRequest, NextResponse } from 'next/server'

/** Uploads older than this are left over from a cancelled or failed run. */
const MAX_AGE_MS = 60 * 60 * 1000

/**
 * Deletes leftover PDFs from the AI upload folder. A generation deletes its
 * own PDF, this only catches uploads whose generation never ran.
 */
export async function GET(request: NextRequest) {
    if (
        !process.env.CRON_SECRET ||
        request.headers.get('authorization') !==
            `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isBlobConfigured()) {
        return NextResponse.json({ deleted: 0, skipped: 'not configured' })
    }

    try {
        const { list, del } = await import('@vercel/blob')
        const cutoff = Date.now() - MAX_AGE_MS
        let cursor: string | undefined
        let deleted = 0
        do {
            const page = await list({ prefix: AI_UPLOAD_PREFIX, cursor })
            const old = page.blobs
                .filter((blob) => new Date(blob.uploadedAt).getTime() < cutoff)
                .map((blob) => blob.url)
            if (old.length) {
                await del(old)
                deleted += old.length
            }
            cursor = page.hasMore ? page.cursor : undefined
        } while (cursor)

        return NextResponse.json({ deleted })
    } catch (error) {
        console.error('Upload cleanup failed:', error)
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }
}
