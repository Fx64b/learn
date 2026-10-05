/** Accepted upload formats, detected from the file's first bytes. */
export type ImageType = 'image/png' | 'image/jpeg' | 'image/webp'

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export function detectImageType(bytes: Uint8Array): ImageType | null {
    const starts = (sig: number[], offset = 0) =>
        sig.every((b, i) => bytes[offset + i] === b)
    if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        return 'image/png'
    if (starts([0xff, 0xd8, 0xff])) return 'image/jpeg'
    // RIFF....WEBP
    if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8))
        return 'image/webp'
    return null
}

export const IMAGE_EXTENSIONS: Record<ImageType, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
}
