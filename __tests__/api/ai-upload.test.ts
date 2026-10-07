import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSession } from 'next-auth'

import { handleUpload } from '@vercel/blob/client'

import { POST } from '@/app/api/ai-flashcards/upload/route'

vi.mock('@vercel/blob/client', () => ({ handleUpload: vi.fn() }))

type BeforeToken = (pathname: string) => Promise<Record<string, unknown>>

function request() {
    return new Request('http://localhost/api/ai-flashcards/upload', {
        method: 'POST',
        body: JSON.stringify({ type: 'blob.generate-client-token' }),
    })
}

/** Runs the route and returns the onBeforeGenerateToken it registered. */
async function captureBeforeToken(): Promise<BeforeToken> {
    let captured: BeforeToken | undefined
    vi.mocked(handleUpload).mockImplementation(async (options) => {
        captured = options.onBeforeGenerateToken as BeforeToken
        return { type: 'blob.generate-client-token', clientToken: 't' }
    })
    const res = await POST(request())
    expect(res.status).toBe(200)
    return captured!
}

describe('AI upload token route', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token')
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: 'u1' },
        } as never)
    })
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('needs a session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await POST(request())
        expect(res.status).toBe(401)
        expect(handleUpload).not.toHaveBeenCalled()
    })

    it('returns 503 without a Blob token', async () => {
        vi.stubEnv('BLOB_READ_WRITE_TOKEN', '')
        const res = await POST(request())
        expect(res.status).toBe(503)
    })

    it('allows only PDFs up to 20 MB in the own folder', async () => {
        const before = await captureBeforeToken()
        await expect(before('ai-uploads/u1/notes.pdf')).resolves.toEqual({
            allowedContentTypes: ['application/pdf'],
            maximumSizeInBytes: 20 * 1024 * 1024,
            addRandomSuffix: true,
        })
    })

    it('rejects other folders', async () => {
        const before = await captureBeforeToken()
        for (const path of [
            'ai-uploads/u2/notes.pdf',
            'diagrams/u1/notes.pdf',
            'ai-uploads/u1/../u2/notes.pdf',
        ]) {
            await expect(before(path)).rejects.toThrow()
        }
    })
})
