import { authOptions } from '@/lib/auth'
import { isBlobConfigured } from '@/lib/blob'
import {
    IMAGE_EXTENSIONS,
    MAX_IMAGE_BYTES,
    detectImageType,
} from '@/lib/image-type'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { nanoid } from 'nanoid'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { NextResponse } from 'next/server'

/** Uploads a diagram image to Vercel Blob. PNG, JPEG and WebP only. */
export async function POST(request: Request) {
    const t = await getTranslations('items.diagram')
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isBlobConfigured()) {
        return NextResponse.json({ error: t('notConfigured') }, { status: 503 })
    }
    const rate = await checkRateLimit(
        `user:${session.user.id}:upload`,
        'upload'
    )
    if (!rate.success) {
        return NextResponse.json({ error: t('rateLimited') }, { status: 429 })
    }

    let file: FormDataEntryValue | null
    try {
        file = (await request.formData()).get('file')
    } catch {
        return NextResponse.json({ error: t('invalidFile') }, { status: 400 })
    }
    if (!(file instanceof File)) {
        return NextResponse.json({ error: t('invalidFile') }, { status: 400 })
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: t('tooLarge') }, { status: 413 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = detectImageType(bytes)
    if (!type) {
        return NextResponse.json({ error: t('invalidFile') }, { status: 415 })
    }

    try {
        const { put } = await import('@vercel/blob')
        const blob = await put(
            `diagrams/${session.user.id}/${nanoid()}.${IMAGE_EXTENSIONS[type]}`,
            Buffer.from(bytes),
            { access: 'public', contentType: type }
        )
        return NextResponse.json({ url: blob.url })
    } catch (error) {
        console.error('Image upload failed:', error)
        return NextResponse.json({ error: t('failed') }, { status: 500 })
    }
}
