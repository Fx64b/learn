import { describe, expect, it } from 'vitest'

import sitemap from '../app/sitemap'

describe('Sitemap', () => {
    it('should return all expected public routes', () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://learn.fx64b.dev'

        const sitemapData = sitemap()

        expect(sitemapData).toHaveLength(5)

        const urls = sitemapData.map((entry) => entry.url)

        // Check that all expected public routes are included
        expect(urls).toContain('https://learn.fx64b.dev')
        expect(urls).toContain('https://learn.fx64b.dev/pricing')
        expect(urls).toContain('https://learn.fx64b.dev/terms')
        expect(urls).toContain('https://learn.fx64b.dev/privacy')
        expect(urls).toContain('https://learn.fx64b.dev/imprint')
    })

    it('should not include deck or auth-required routes', () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://learn.fx64b.dev'

        const sitemapData = sitemap()
        const urls = sitemapData.map((entry) => entry.url)

        // Verify that deck routes are excluded
        expect(urls).not.toContain('https://learn.fx64b.dev/deck/create')
        expect(urls.some((url) => url.includes('/deck/'))).toBe(false)

        // Verify that auth-required routes are excluded
        expect(urls).not.toContain('https://learn.fx64b.dev/profile')
        expect(urls).not.toContain('https://learn.fx64b.dev/login')
        expect(urls).not.toContain('https://learn.fx64b.dev/verify-request')
        expect(urls.some((url) => url.includes('/learn/'))).toBe(false)
    })

    it('should have correct metadata for each route', () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://learn.fx64b.dev'

        const sitemapData = sitemap()

        // Check home page priority and frequency
        const homePage = sitemapData.find(
            (entry) => entry.url === 'https://learn.fx64b.dev'
        )
        expect(homePage?.priority).toBe(1)
        expect(homePage?.changeFrequency).toBe('daily')

        // Check pricing page
        const pricingPage = sitemapData.find(
            (entry) => entry.url === 'https://learn.fx64b.dev/pricing'
        )
        expect(pricingPage?.priority).toBe(0.8)
        expect(pricingPage?.changeFrequency).toBe('weekly')

        // Check legal pages have lower priority
        const termsPage = sitemapData.find(
            (entry) => entry.url === 'https://learn.fx64b.dev/terms'
        )
        expect(termsPage?.priority).toBe(0.3)
        expect(termsPage?.changeFrequency).toBe('monthly')

        // All entries should have lastModified dates
        sitemapData.forEach((entry) => {
            expect(entry.lastModified).toBeInstanceOf(Date)
        })
    })

    it('should use fallback URL when environment variable is not set', () => {
        delete process.env.NEXT_PUBLIC_SITE_URL

        const sitemapData = sitemap()
        const urls = sitemapData.map((entry) => entry.url)

        // Should use fallback URL
        expect(urls[0]).toBe('https://learn.fx64b.dev')
    })
})
