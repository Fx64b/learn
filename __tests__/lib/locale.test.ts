import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getLocale } from '@/lib/locale'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import * as preferencesActions from '@/app/actions/preferences'

// Mock dependencies
vi.mock('next-auth')
vi.mock('next/headers')
vi.mock('@/app/actions/preferences')

const mockGetServerSession = vi.mocked(getServerSession)
const mockCookies = vi.mocked(cookies)
const mockGetUserPreferences = vi.mocked(preferencesActions.getUserPreferences)

describe('Locale Library', () => {
  let mockCookieStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCookieStore = {
      get: vi.fn()
    }
    mockCookies.mockResolvedValue(mockCookieStore)
  })

  describe('getLocale', () => {
    test('should return user preference locale for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      
      const mockPreferences = {
        userId: 'user-1',
        locale: 'de',
        animationsEnabled: false,
        animationSpeed: 200,
        animationDirection: 'horizontal' as const,
        theme: 'dark' as const
      }
      mockGetUserPreferences.mockResolvedValue(mockPreferences)

      const result = await getLocale()

      expect(result).toBe('de')
      expect(mockGetUserPreferences).toHaveBeenCalled()
    })

    test('should return en for authenticated user with English preference', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      
      const mockPreferences = {
        userId: 'user-1',
        locale: 'en',
        animationsEnabled: false,
        animationSpeed: 200,
        animationDirection: 'horizontal' as const,
        theme: 'dark' as const
      }
      mockGetUserPreferences.mockResolvedValue(mockPreferences)

      const result = await getLocale()

      expect(result).toBe('en')
    })

    test('should fallback to cookie when user has no preferences', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      mockGetUserPreferences.mockResolvedValue(null)
      
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      const result = await getLocale()

      expect(result).toBe('de')
      expect(mockCookieStore.get).toHaveBeenCalledWith('preferred-locale')
    })

    test('should fallback to cookie when user preferences have invalid locale', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      
      const mockPreferences = {
        userId: 'user-1',
        locale: 'fr', // Invalid locale (not en or de)
        animationsEnabled: false,
        animationSpeed: 200,
        animationDirection: 'horizontal' as const,
        theme: 'dark' as const
      }
      mockGetUserPreferences.mockResolvedValue(mockPreferences)
      
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      const result = await getLocale()

      expect(result).toBe('de')
      expect(mockCookieStore.get).toHaveBeenCalledWith('preferred-locale')
    })

    test('should use cookie for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      const result = await getLocale()

      expect(result).toBe('de')
      expect(mockGetUserPreferences).not.toHaveBeenCalled()
      expect(mockCookieStore.get).toHaveBeenCalledWith('preferred-locale')
    })

    test('should use cookie for user without ID', async () => {
      const mockSession = {
        user: { email: 'test@example.com' } // No ID
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      mockCookieStore.get.mockReturnValue({ value: 'en' })

      const result = await getLocale()

      expect(result).toBe('en')
      expect(mockGetUserPreferences).not.toHaveBeenCalled()
      expect(mockCookieStore.get).toHaveBeenCalledWith('preferred-locale')
    })

    test('should return default en when no cookie is set', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await getLocale()

      expect(result).toBe('en')
    })

    test('should return default en when cookie has invalid value', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockCookieStore.get.mockReturnValue({ value: 'fr' }) // Invalid locale

      const result = await getLocale()

      expect(result).toBe('en')
    })

    test('should return default en when cookie has empty value', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockCookieStore.get.mockReturnValue({ value: '' })

      const result = await getLocale()

      expect(result).toBe('en')
    })

    test('should handle getUserPreferences throwing error', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      mockGetUserPreferences.mockRejectedValue(new Error('Database error'))
      
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      // The function should throw when getUserPreferences fails
      await expect(getLocale()).rejects.toThrow('Database error')
    })

    test('should handle getServerSession throwing error', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Session error'))
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      // The function should throw when getServerSession fails
      await expect(getLocale()).rejects.toThrow('Session error')
    })

    test('should handle cookies() throwing error', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockCookies.mockRejectedValue(new Error('Cookies error'))

      // The function should throw when cookies() fails
      await expect(getLocale()).rejects.toThrow('Cookies error')
    })

    test('should validate supported locales exactly', async () => {
      mockGetServerSession.mockResolvedValue(null)

      // Test valid locales
      const validLocales = ['en', 'de']
      for (const locale of validLocales) {
        mockCookieStore.get.mockReturnValue({ value: locale })
        const result = await getLocale()
        expect(result).toBe(locale)
      }

      // Test invalid locales
      const invalidLocales = ['EN', 'DE', 'es', 'fr', 'it', 'ja', 'zh', 'invalid', '123', '', null, undefined]
      for (const locale of invalidLocales) {
        mockCookieStore.get.mockReturnValue({ value: locale })
        const result = await getLocale()
        expect(result).toBe('en')
      }
    })

    test('should handle preferences with undefined locale', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      
      const mockPreferences = {
        userId: 'user-1',
        locale: undefined,
        animationsEnabled: false,
        animationSpeed: 200,
        animationDirection: 'horizontal' as const,
        theme: 'dark' as const
      }
      mockGetUserPreferences.mockResolvedValue(mockPreferences)
      
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      const result = await getLocale()

      expect(result).toBe('de')
    })

    test('should handle preferences with null locale', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      
      const mockPreferences = {
        userId: 'user-1',
        locale: null,
        animationsEnabled: false,
        animationSpeed: 200,
        animationDirection: 'horizontal' as const,
        theme: 'dark' as const
      }
      mockGetUserPreferences.mockResolvedValue(mockPreferences as any)
      
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      const result = await getLocale()

      expect(result).toBe('de')
    })

    test('should prioritize user preferences over cookies', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      
      const mockPreferences = {
        userId: 'user-1',
        locale: 'en',
        animationsEnabled: false,
        animationSpeed: 200,
        animationDirection: 'horizontal' as const,
        theme: 'dark' as const
      }
      mockGetUserPreferences.mockResolvedValue(mockPreferences)
      
      // Cookie has different value
      mockCookieStore.get.mockReturnValue({ value: 'de' })

      const result = await getLocale()

      // Should prioritize user preference (en) over cookie (de)
      expect(result).toBe('en')
    })

    test('should handle multiple fallback levels correctly', async () => {
      // Test case: authenticated user, no preferences, no cookie -> default 'en'
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      mockGetUserPreferences.mockResolvedValue(null)
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await getLocale()

      expect(result).toBe('en')
      expect(mockGetUserPreferences).toHaveBeenCalled()
      expect(mockCookieStore.get).toHaveBeenCalledWith('preferred-locale')
    })

    test('should handle concurrent calls correctly', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      
      const mockPreferences = {
        userId: 'user-1',
        locale: 'de',
        animationsEnabled: false,
        animationSpeed: 200,
        animationDirection: 'horizontal' as const,
        theme: 'dark' as const
      }
      mockGetUserPreferences.mockResolvedValue(mockPreferences)

      // Make multiple concurrent calls
      const promises = [
        getLocale(),
        getLocale(),
        getLocale()
      ]

      const results = await Promise.all(promises)

      expect(results).toEqual(['de', 'de', 'de'])
      expect(mockGetUserPreferences).toHaveBeenCalledTimes(3)
    })
  })
})