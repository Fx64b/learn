import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NextRequest } from 'next/server'

import { GET } from '@/app/api/cron/cleanup-uploads/route'

const blobApi = vi.hoisted(() => ({ list: vi.fn(), del: vi.fn() }))
vi.mock('@vercel/blob', () => blobApi)

function request(secret?: string) {
    return new NextRequest('http://localhost/api/cron/cleanup-uploads', {
        headers: secret ? { authorization: `Bearer ${secret}` } : {},
    })
}

describe('cleanup-uploads cron', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('CRON_SECRET', 's3cret')
        vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token')
    })
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('rejects a wrong secret', async () => {
        expect((await GET(request('nope'))).status).toBe(401)
        expect((await GET(request())).status).toBe(401)
        expect(blobApi.list).not.toHaveBeenCalled()
    })

    it('deletes only uploads older than one hour, across pages', async () => {
        const old = new Date(Date.now() - 2 * 60 * 60 * 1000)
        const fresh = new Date()
        blobApi.list
            .mockResolvedValueOnce({
                blobs: [
                    { url: 'https://x/ai-uploads/u1/a.pdf', uploadedAt: old },
                    { url: 'https://x/ai-uploads/u1/b.pdf', uploadedAt: fresh },
                ],
                hasMore: true,
                cursor: 'c1',
            })
            .mockResolvedValueOnce({
                blobs: [
                    { url: 'https://x/ai-uploads/u2/c.pdf', uploadedAt: old },
                ],
                hasMore: false,
            })

        const res = await GET(request('s3cret'))

        expect(await res.json()).toEqual({ deleted: 2 })
        expect(blobApi.list).toHaveBeenCalledWith({
            prefix: 'ai-uploads/',
            cursor: undefined,
        })
        expect(blobApi.list).toHaveBeenLastCalledWith({
            prefix: 'ai-uploads/',
            cursor: 'c1',
        })
        expect(blobApi.del).toHaveBeenCalledWith([
            'https://x/ai-uploads/u1/a.pdf',
        ])
        expect(blobApi.del).toHaveBeenCalledWith([
            'https://x/ai-uploads/u2/c.pdf',
        ])
    })
})
