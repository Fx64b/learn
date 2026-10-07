import type { Item } from '@/lib/items'

/** Host suffix of Vercel Blob URLs. Only these are ever deleted. */
const BLOB_HOST = '.blob.vercel-storage.com'

export function isBlobConfigured() {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function isBlobUrl(url: string) {
    try {
        const { protocol, hostname } = new URL(url)
        return protocol === 'https:' && hostname.endsWith(BLOB_HOST)
    } catch {
        return false
    }
}

/** Uploaded images an item references. */
export function imagesOf(item: Item): string[] {
    return item.type === 'diagram' && isBlobUrl(item.content.image)
        ? [item.content.image]
        : []
}

/** Deletes blobs. Failures are logged, never thrown. */
export async function deleteBlobs(urls: string[]) {
    if (!urls.length || !isBlobConfigured()) return
    try {
        const { del } = await import('@vercel/blob')
        await del(urls)
    } catch (error) {
        console.error('Error deleting blobs:', error)
    }
}

/** Deletes uploaded images. Failures are logged, never thrown. */
export const deleteImages = deleteBlobs

/** Largest PDF the AI generation accepts. */
export const MAX_PDF_BYTES = 20 * 1024 * 1024
/** Folder for PDFs uploaded for AI generation. They are deleted after use. */
export const AI_UPLOAD_PREFIX = 'ai-uploads/'

/** Path prefix a user's AI uploads must use. */
export function aiUploadPrefix(userId: string) {
    return `${AI_UPLOAD_PREFIX}${userId}/`
}

/**
 * True only for a Blob URL inside the user's own AI upload folder. This
 * keeps the server from fetching other hosts or other users' files.
 */
export function isOwnAiUpload(url: string, userId: string) {
    if (!isBlobUrl(url) || !userId) return false
    try {
        const { pathname } = new URL(url)
        return (
            pathname.startsWith(`/${aiUploadPrefix(userId)}`) &&
            !pathname.includes('..')
        )
    } catch {
        return false
    }
}
