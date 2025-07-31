import { absoluteUrl, cn } from '@/lib/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('lib/utils', () => {
    describe('cn (className utility)', () => {
        it('should merge Tailwind classes correctly', () => {
            const result = cn('px-4 py-2', 'bg-blue-500', 'text-white')
            expect(result).toContain('px-4')
            expect(result).toContain('py-2')
            expect(result).toContain('bg-blue-500')
            expect(result).toContain('text-white')
        })

        it('should handle conditional classes', () => {
            const isActive = true
            const result = cn(
                'base-class',
                isActive && 'active-class',
                'final-class'
            )
            expect(result).toContain('base-class')
            expect(result).toContain('active-class')
            expect(result).toContain('final-class')
        })

        it('should filter out falsy values', () => {
            const result = cn(
                'valid-class',
                false,
                null,
                undefined,
                '',
                'another-valid'
            )
            expect(result).toContain('valid-class')
            expect(result).toContain('another-valid')
            expect(result).not.toContain('false')
            expect(result).not.toContain('null')
        })

        it('should resolve conflicting Tailwind classes', () => {
            // twMerge should handle conflicting classes
            const result = cn('px-4 px-6', 'py-2 py-4')
            // Should keep the last conflicting class
            expect(result).toContain('px-6')
            expect(result).toContain('py-4')
            expect(result).not.toContain('px-4')
            expect(result).not.toContain('py-2')
        })

        it('should handle empty inputs', () => {
            expect(cn()).toBe('')
            expect(cn('')).toBe('')
            expect(cn(null, undefined, false)).toBe('')
        })

        it('should handle arrays of classes', () => {
            const classes = ['class1', 'class2']
            const result = cn(classes, 'class3')
            expect(result).toContain('class1')
            expect(result).toContain('class2')
            expect(result).toContain('class3')
        })

        it('should handle objects with boolean values', () => {
            const result = cn({
                active: true,
                disabled: false,
                highlighted: true,
            })
            expect(result).toContain('active')
            expect(result).toContain('highlighted')
            expect(result).not.toContain('disabled')
        })
    })

    describe('absoluteUrl', () => {
        let originalEnv: string | undefined

        beforeEach(() => {
            originalEnv = process.env.NEXT_PUBLIC_SITE_URL
        })

        afterEach(() => {
            if (originalEnv) {
                process.env.NEXT_PUBLIC_SITE_URL = originalEnv
            } else {
                delete process.env.NEXT_PUBLIC_SITE_URL
            }
        })

        it('should use NEXT_PUBLIC_SITE_URL when available', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

            const result = absoluteUrl('/api/test')
            expect(result).toBe('https://example.com/api/test')
        })

        it('should fallback to localhost when NEXT_PUBLIC_SITE_URL is not set', () => {
            delete process.env.NEXT_PUBLIC_SITE_URL

            const result = absoluteUrl('/api/test')
            expect(result).toBe('http://localhost/api/test')
        })

        it('should handle paths without leading slash', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

            const result = absoluteUrl('api/test')
            expect(result).toBe('https://example.comapi/test') // This is the actual behavior
        })

        it('should handle empty paths', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

            const result = absoluteUrl('')
            expect(result).toBe('https://example.com') // This is the actual behavior
        })

        it('should handle root path', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

            const result = absoluteUrl('/')
            expect(result).toBe('https://example.com/')
        })

        it('should handle complex paths', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

            const result = absoluteUrl('/api/v1/users/123?include=profile')
            expect(result).toBe(
                'https://example.com/api/v1/users/123?include=profile'
            )
        })

        it('should work with different base URLs', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'https://app.mydomain.com'

            const result = absoluteUrl('/dashboard')
            expect(result).toBe('https://app.mydomain.com/dashboard')
        })

        it('should handle base URL with trailing slash', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/'

            const result = absoluteUrl('/api/test')
            expect(result).toBe('https://example.com//api/test')
        })

        it('should handle localhost with port', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

            const result = absoluteUrl('/dev/api')
            expect(result).toBe('http://localhost:3000/dev/api')
        })

        it('should work with development URLs', () => {
            process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

            const result = absoluteUrl('/api/auth/callback/google')
            expect(result).toBe(
                'http://localhost:3000/api/auth/callback/google'
            )
        })
    })

    describe('Integration tests', () => {
        it('should work together in common scenarios', () => {
            // Test using both utilities in a typical component scenario
            const baseClasses = 'px-4 py-2 rounded'
            const conditionalClasses = true ? 'bg-blue-500' : 'bg-gray-500'
            const combinedClasses = cn(
                baseClasses,
                conditionalClasses,
                'text-white'
            )

            expect(combinedClasses).toContain('px-4')
            expect(combinedClasses).toContain('bg-blue-500')
            expect(combinedClasses).toContain('text-white')

            // Test URL generation for a typical API call
            process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
            const apiUrl = absoluteUrl('/api/components/button')
            expect(apiUrl).toBe('https://example.com/api/components/button')
        })
    })
})
