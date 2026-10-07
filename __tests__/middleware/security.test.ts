import { buildCsp } from '@/middleware/security'
import { describe, expect, it } from 'vitest'

/** Sources of one directive, or undefined when it is missing. */
function directive(csp: string, name: string) {
    const part = csp
        .split(';')
        .map((d) => d.trim())
        .find((d) => d.startsWith(`${name} `))
    return part?.split(' ').slice(1)
}

describe('buildCsp', () => {
    it('allows browser uploads to Vercel Blob', () => {
        const connect = directive(buildCsp({ preview: false }), 'connect-src')
        expect(connect).toEqual(
            expect.arrayContaining([
                "'self'",
                'https://vercel.com/api/blob/',
                'https://*.blob.vercel-storage.com',
            ])
        )
    })

    it('keeps the existing directives', () => {
        const csp = buildCsp({ preview: false })
        expect(directive(csp, 'default-src')).toEqual(["'self'"])
        expect(directive(csp, 'img-src')).toEqual(["'self'", 'data:', 'https:'])
        expect(directive(csp, 'script-src')).toEqual([
            "'self'",
            "'unsafe-eval'",
            "'unsafe-inline'",
        ])
        expect(directive(csp, 'style-src')).toEqual([
            "'self'",
            "'unsafe-inline'",
        ])
    })

    it('never allows the Vercel toolbar in production', () => {
        const csp = buildCsp({ preview: false })
        expect(csp).not.toContain('vercel.live')
        expect(directive(csp, 'frame-src')).toBeUndefined()
    })

    it('allows the Vercel toolbar on previews', () => {
        const csp = buildCsp({ preview: true })
        expect(directive(csp, 'script-src')).toContain('https://vercel.live')
        expect(directive(csp, 'frame-src')).toEqual(['https://vercel.live'])
        expect(directive(csp, 'connect-src')).toContain(
            'wss://ws-us3.pusher.com'
        )
    })
})
