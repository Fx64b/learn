import {
    aiUploadPathname,
    aiUploadPrefix,
    isBlobConfigured,
    isOwnAiUpload,
    isOwnAiUploadPath,
} from '@/lib/blob'
import { afterEach, describe, expect, it, vi } from 'vitest'

const host = 'https://abc123.public.blob.vercel-storage.com'

describe('isOwnAiUpload', () => {
    it('accepts a file in the own upload folder', () => {
        expect(
            isOwnAiUpload(`${host}/ai-uploads/u1/notes-x7Yz.pdf`, 'u1')
        ).toBe(true)
    })

    it('rejects another user, another folder and other hosts', () => {
        expect(isOwnAiUpload(`${host}/ai-uploads/u2/a.pdf`, 'u1')).toBe(false)
        expect(isOwnAiUpload(`${host}/ai-uploads/u10/a.pdf`, 'u1')).toBe(false)
        expect(isOwnAiUpload(`${host}/diagrams/u1/a.pdf`, 'u1')).toBe(false)
        expect(
            isOwnAiUpload('https://evil.example.com/ai-uploads/u1/a.pdf', 'u1')
        ).toBe(false)
        expect(
            isOwnAiUpload(
                `http://abc.blob.vercel-storage.com/ai-uploads/u1/a.pdf`,
                'u1'
            )
        ).toBe(false)
        expect(isOwnAiUpload('not a url', 'u1')).toBe(false)
        expect(isOwnAiUpload(`${host}/ai-uploads//a.pdf`, '')).toBe(false)
    })

    it('rejects path traversal', () => {
        expect(
            isOwnAiUpload(`${host}/ai-uploads/u1/%2e%2e/u2/a.pdf`, 'u1')
        ).toBe(false)
    })

    it('builds the folder prefix', () => {
        expect(aiUploadPrefix('u1')).toBe('ai-uploads/u1/')
    })

    it('returns the pathname only for safe PDF file names', () => {
        expect(
            aiUploadPathname(`${host}/ai-uploads/u1/notes-x7Yz.pdf`, 'u1')
        ).toBe('ai-uploads/u1/notes-x7Yz.pdf')
        for (const name of ['a.txt', 'sub/a.pdf', 'a%20b.pdf', '.pdf']) {
            expect(
                aiUploadPathname(`${host}/ai-uploads/u1/${name}`, 'u1')
            ).toBeNull()
        }
    })
})

describe('isOwnAiUploadPath', () => {
    it('checks folder and file name', () => {
        expect(isOwnAiUploadPath('ai-uploads/u1/1f-notes.pdf', 'u1')).toBe(true)
        expect(isOwnAiUploadPath('ai-uploads/u2/a.pdf', 'u1')).toBe(false)
        expect(isOwnAiUploadPath('ai-uploads/u1/a.exe', 'u1')).toBe(false)
        expect(isOwnAiUploadPath('ai-uploads//a.pdf', '')).toBe(false)
    })
})

describe('isBlobConfigured', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('accepts a read-write token or an OIDC store id', () => {
        vi.stubEnv('BLOB_READ_WRITE_TOKEN', '')
        vi.stubEnv('BLOB_STORE_ID', '')
        expect(isBlobConfigured()).toBe(false)
        vi.stubEnv('BLOB_STORE_ID', 'store_abc')
        expect(isBlobConfigured()).toBe(true)
        vi.stubEnv('BLOB_STORE_ID', '')
        vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_x')
        expect(isBlobConfigured()).toBe(true)
    })
})
