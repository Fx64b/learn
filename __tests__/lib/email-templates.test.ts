import { escapeHtml, generateAuthEmail } from '@/lib/email-templates'
import { describe, expect, it } from 'vitest'

const base = {
    url: 'https://learn.fx64b.dev/api/auth/callback/email?token=a&email=b',
    siteName: 'Learn',
    siteUrl: 'https://learn.fx64b.dev',
    logoUrl: 'https://learn.fx64b.dev/logo-light.png',
    lang: 'en',
    title: 'Sign in',
    heading: 'Welcome back!',
    message: 'Click the button.',
    buttonText: 'Sign in',
    linkHint: 'Copy this link:',
    footerText: 'Ignore this if it was not you.',
    contactEmail: 'contact@fx64b.dev',
}

describe('generateAuthEmail', () => {
    it('contains the escaped link twice and the texts', () => {
        const html = generateAuthEmail(base)
        const link = escapeHtml(base.url)
        expect(html.split(link)).toHaveLength(4) // button, text, href
        expect(html).toContain('Welcome back!')
        expect(html).toContain('contact@fx64b.dev')
        expect(html).toContain('lang="en"')
    })

    it('escapes HTML in texts', () => {
        const html = generateAuthEmail({
            ...base,
            heading: '<script>x</script>',
        })
        expect(html).not.toContain('<script>x')
        expect(html).toContain('&lt;script&gt;')
    })

    it('shows highlights only when given', () => {
        expect(generateAuthEmail(base)).not.toContain('&#10003;')
        expect(
            generateAuthEmail({ ...base, highlights: ['One', 'Two'] })
        ).toContain('Two')
    })
})
