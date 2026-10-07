import type { Item } from '@/lib/items'

/** Host suffix of Vercel Blob URLs. Only these are ever deleted. */
const BLOB_HOST = '.blob.vercel-storage.com'

/**
 * True when Blob credentials exist: a read-write token (older stores, local
 * dev) or a connected store with Vercel OIDC (newer stores set only
 * BLOB_STORE_ID, the OIDC token comes from the Vercel runtime).
 */
export function isBlobConfigured() {
    return Boolean(
        process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
    )
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

/** File names the browser creates for AI uploads (random id plus safe name). */
const AI_FILE_NAME = /^[A-Za-z0-9._-]+\.pdf$/

/**
 * The Blob pathname of a PDF in the user's own AI upload folder, or null.
 * The server only ever reads uploads by this pathname through the Blob SDK,
 * which resolves it against our own store. It never fetches the given URL.
 */
export function aiUploadPathname(url: string, userId: string): string | null {
    if (!isBlobUrl(url) || !userId) return null
    let pathname: string
    try {
        pathname = new URL(url).pathname.slice(1)
    } catch {
        return null
    }
    return isOwnAiUploadPath(pathname, userId) ? pathname : null
}

/** True for a pathname like `ai-uploads/<userId>/<safe-name>.pdf`. */
export function isOwnAiUploadPath(pathname: string, userId: string) {
    const prefix = aiUploadPrefix(userId)
    if (!userId || !pathname.startsWith(prefix)) return false
    const name = pathname.slice(prefix.length)
    return AI_FILE_NAME.test(name) && !name.includes('..')
}

/** True only for a PDF inside the user's own AI upload folder. */
export function isOwnAiUpload(url: string, userId: string) {
    return aiUploadPathname(url, userId) !== null
}
