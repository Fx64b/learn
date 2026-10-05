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

/** Deletes uploaded images. Failures are logged, never thrown. */
export async function deleteImages(urls: string[]) {
    if (!urls.length || !isBlobConfigured()) return
    try {
        const { del } = await import('@vercel/blob')
        await del(urls)
    } catch (error) {
        console.error('Error deleting images:', error)
    }
}
