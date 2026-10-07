import { aiUploadPrefix, isOwnAiUpload } from '@/lib/blob'
import { describe, expect, it } from 'vitest'

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
})
