import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSession } from 'next-auth'

import { issueSignedToken } from '@vercel/blob'
import { handleUploadPresigned } from '@vercel/blob/client'

import { POST } from '@/app/api/ai-flashcards/upload/route'

vi.mock('@vercel/blob', () => ({ issueSignedToken: vi.fn() }))
vi.mock('@vercel/blob/client', () => ({ handleUploadPresigned: vi.fn() }))

type GetSignedToken = (
    pathname: string
) => Promise<{ token: unknown; urlOptions?: Record<string, unknown> }>

function request() {
    return new Request('http://localhost/api/ai-flashcards/upload', {
        method: 'POST',
        body: JSON.stringify({ type: 'blob.generate-presigned-url' }),
    })
}

/** Runs the route and returns the getSignedToken it registered. */
async function captureGetSignedToken(): Promise<GetSignedToken> {
    let captured: GetSignedToken | undefined
    vi.mocked(handleUploadPresigned).mockImplementation(async (options) => {
        captured = options.getSignedToken as unknown as GetSignedToken
        return { type: 'blob.upload-completed', response: 'ok' }
    })
    const res = await POST(request())
    expect(res.status).toBe(200)
    return captured!
}

describe('AI upload route', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('BLOB_READ_WRITE_TOKEN', '')
        vi.stubEnv('BLOB_STORE_ID', 'store_abc')
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: 'u1' },
        } as never)
        vi.mocked(issueSignedToken).mockResolvedValue({
            delegationToken: 'd',
            clientSigningToken: 'c',
            validUntil: Date.now() + 60_000,
        })
    })
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('needs a session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await POST(request())
        expect(res.status).toBe(401)
        expect(handleUploadPresigned).not.toHaveBeenCalled()
    })

    it('returns 503 without any Blob credentials', async () => {
        vi.stubEnv('BLOB_STORE_ID', '')
        const res = await POST(request())
        expect(res.status).toBe(503)
    })

    it('works with a read-write token instead of OIDC', async () => {
        vi.stubEnv('BLOB_STORE_ID', '')
        vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_x')
        await captureGetSignedToken()
    })

    it('signs only PDF puts up to 20 MB for the exact own path', async () => {
        const getSignedToken = await captureGetSignedToken()
        const path = 'ai-uploads/u1/1f0e-notes.pdf'
        const result = await getSignedToken(path)

        expect(issueSignedToken).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: path,
                operations: ['put'],
                allowedContentTypes: ['application/pdf'],
                maximumSizeInBytes: 20 * 1024 * 1024,
            })
        )
        expect(result.urlOptions).toMatchObject({
            allowedContentTypes: ['application/pdf'],
            maximumSizeInBytes: 20 * 1024 * 1024,
        })
    })

    it('rejects other folders and unsafe names', async () => {
        const getSignedToken = await captureGetSignedToken()
        for (const path of [
            'ai-uploads/u2/notes.pdf',
            'diagrams/u1/notes.pdf',
            'ai-uploads/u1/../u2/notes.pdf',
            'ai-uploads/u1/notes.html',
            'ai-uploads/u1/sub/notes.pdf',
        ]) {
            await expect(getSignedToken(path)).rejects.toThrow()
        }
        expect(issueSignedToken).not.toHaveBeenCalled()
    })
})
