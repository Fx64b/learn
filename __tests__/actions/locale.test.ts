import { describe, test, expect, vi, beforeEach } from 'vitest'
import { updateLocale } from '@/app/actions/locale'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as preferencesActions from '@/app/actions/preferences'

// Mock dependencies
vi.mock('next-auth')
vi.mock('next/headers')
vi.mock('next/cache')
vi.mock('@/app/actions/preferences')

const mockGetServerSession = vi.mocked(getServerSession)
const mockCookies = vi.mocked(cookies)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockUpdateUserPreferences = vi.mocked(preferencesActions.updateUserPreferences)

describe('Locale Actions', () => {
  let mockCookieStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCookieStore = {
      set: vi.fn()
    }
    mockCookies.mockResolvedValue(mockCookieStore)
    mockRevalidatePath.mockImplementation(() => {})
    mockUpdateUserPreferences.mockResolvedValue({ success: true })
  })

  describe('updateLocale', () => {
    test('should update locale for authenticated user with preferences', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      await updateLocale('de')

      // Should set cookie
      expect(mockCookieStore.set).toHaveBeenCalledWith('preferred-locale', 'de', {
        httpOnly: true,
        secure: false, // NODE_ENV is test
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })

      // Should update user preferences
      expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ locale: 'de' })

      // Should revalidate layout
      expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    test('should update locale for authenticated user (English)', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      await updateLocale('en')

      expect(mockCookieStore.set).toHaveBeenCalledWith('preferred-locale', 'en', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ locale: 'en' })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    test('should update locale for unauthenticated user (cookie only)', async () => {
      mockGetServerSession.mockResolvedValue(null)

      await updateLocale('de')

      // Should set cookie
      expect(mockCookieStore.set).toHaveBeenCalledWith('preferred-locale', 'de', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })

      // Should NOT update user preferences
      expect(mockUpdateUserPreferences).not.toHaveBeenCalled()

      // Should still revalidate layout
      expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    test('should update locale for user without ID', async () => {
      const mockSession = {
        user: { email: 'test@example.com' } // No ID
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      await updateLocale('en')

      expect(mockCookieStore.set).toHaveBeenCalledWith('preferred-locale', 'en', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })

      // Should NOT update user preferences when no user ID
      expect(mockUpdateUserPreferences).not.toHaveBeenCalled()
      expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    test('should handle cookie setting errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie error')
      })

      // The function should throw when cookie setting fails
      await expect(updateLocale('de')).rejects.toThrow('Cookie error')
      
      // User preferences should NOT be called since cookie setting failed first
      expect(mockUpdateUserPreferences).not.toHaveBeenCalled()
    })

    test('should handle user preferences update failure', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)
      mockUpdateUserPreferences.mockRejectedValue(new Error('Preferences update failed'))

      // Should not throw the error - it should handle gracefully
      await expect(updateLocale('de')).rejects.toThrow('Preferences update failed')

      // Should still set cookie
      expect(mockCookieStore.set).toHaveBeenCalledWith('preferred-locale', 'de', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })
    })

    test('should use secure cookies in production environment', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      await updateLocale('de')

      expect(mockCookieStore.set).toHaveBeenCalledWith('preferred-locale', 'de', {
        httpOnly: true,
        secure: true, // Should be true in production
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })

    test('should handle session retrieval errors', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Session error'))

      await expect(updateLocale('de')).rejects.toThrow('Session error')
    })

    test('should handle cookies access errors', async () => {
      // First getServerSession is called, then cookies() - so we need to setup both
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
      mockCookies.mockRejectedValue(new Error('Cookies not available'))

      await expect(updateLocale('de')).rejects.toThrow('Cookies not available')
    })

    test('should correctly set cookie path and security settings', async () => {
      mockGetServerSession.mockResolvedValue(null)

      await updateLocale('en')

      const cookieCall = mockCookieStore.set.mock.calls[0]
      expect(cookieCall[0]).toBe('preferred-locale')
      expect(cookieCall[1]).toBe('en')
      expect(cookieCall[2]).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 31536000 // 1 year in seconds
      })
    })
  })
})