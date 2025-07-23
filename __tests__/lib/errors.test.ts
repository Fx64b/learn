import { describe, test, expect } from 'vitest'
import { AppError, AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    test('should create AppError with default values', () => {
      const error = new AppError('Something went wrong')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Something went wrong')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.name).toBe('AppError')
    })

    test('should create AppError with custom status code', () => {
      const error = new AppError('Bad request', 400)

      expect(error.message).toBe('Bad request')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.name).toBe('AppError')
    })

    test('should create AppError with custom status code and error code', () => {
      const error = new AppError('Validation failed', 422, 'VALIDATION_ERROR')

      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.name).toBe('AppError')
    })

    test('should maintain Error prototype chain', () => {
      const error = new AppError('Test error')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof AppError).toBe(true)
      expect(typeof error.stack).toBe('string')
      expect(error.stack).toContain('AppError')
    })

    test('should handle empty message', () => {
      const error = new AppError('')

      expect(error.message).toBe('')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
    })

    test('should handle various status codes', () => {
      const testCases = [
        { statusCode: 200, expected: 200 },
        { statusCode: 400, expected: 400 },
        { statusCode: 401, expected: 401 },
        { statusCode: 403, expected: 403 },
        { statusCode: 404, expected: 404 },
        { statusCode: 500, expected: 500 },
        { statusCode: 503, expected: 503 }
      ]

      testCases.forEach(({ statusCode, expected }) => {
        const error = new AppError('Test message', statusCode)
        expect(error.statusCode).toBe(expected)
      })
    })

    test('should handle various error codes', () => {
      const testCodes = [
        'VALIDATION_ERROR',
        'DATABASE_ERROR',
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'CUSTOM_ERROR_123'
      ]

      testCodes.forEach(code => {
        const error = new AppError('Test message', 500, code)
        expect(error.code).toBe(code)
      })
    })
  })

  describe('AuthenticationError', () => {
    test('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe('Authentication required')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_REQUIRED')
      expect(error.name).toBe('AppError')
    })

    test('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Invalid credentials')

      expect(error.message).toBe('Invalid credentials')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    test('should handle empty message', () => {
      const error = new AuthenticationError('')

      expect(error.message).toBe('')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    test('should handle various authentication error messages', () => {
      const messages = [
        'Token expired',
        'Invalid token',
        'Missing authentication header',
        'Session expired',
        'Login required'
      ]

      messages.forEach(message => {
        const error = new AuthenticationError(message)
        expect(error.message).toBe(message)
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe('AUTHENTICATION_REQUIRED')
      })
    })

    test('should maintain correct prototype chain', () => {
      const error = new AuthenticationError()

      expect(error instanceof Error).toBe(true)
      expect(error instanceof AppError).toBe(true)
      expect(error instanceof AuthenticationError).toBe(true)
    })
  })

  describe('AuthorizationError', () => {
    test('should create AuthorizationError with default message', () => {
      const error = new AuthorizationError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe('Not authorized to perform this action')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.name).toBe('AppError')
    })

    test('should create AuthorizationError with custom message', () => {
      const error = new AuthorizationError('Insufficient permissions')

      expect(error.message).toBe('Insufficient permissions')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('UNAUTHORIZED')
    })

    test('should handle empty message', () => {
      const error = new AuthorizationError('')

      expect(error.message).toBe('')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('UNAUTHORIZED')
    })

    test('should handle various authorization error messages', () => {
      const messages = [
        'Access denied',
        'Admin privileges required',
        'Resource access forbidden',
        'Operation not permitted',
        'Role-based access denied'
      ]

      messages.forEach(message => {
        const error = new AuthorizationError(message)
        expect(error.message).toBe(message)
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe('UNAUTHORIZED')
      })
    })

    test('should maintain correct prototype chain', () => {
      const error = new AuthorizationError()

      expect(error instanceof Error).toBe(true)
      expect(error instanceof AppError).toBe(true)
      expect(error instanceof AuthorizationError).toBe(true)
    })
  })

  describe('NotFoundError', () => {
    test('should create NotFoundError with default message', () => {
      const error = new NotFoundError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.name).toBe('AppError')
    })

    test('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found')

      expect(error.message).toBe('User not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })

    test('should handle empty message', () => {
      const error = new NotFoundError('')

      expect(error.message).toBe('')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })

    test('should handle various not found error messages', () => {
      const messages = [
        'Page not found',
        'Document not found',
        'File not found',
        'Endpoint not found',
        'Record not found'
      ]

      messages.forEach(message => {
        const error = new NotFoundError(message)
        expect(error.message).toBe(message)
        expect(error.statusCode).toBe(404)
        expect(error.code).toBe('NOT_FOUND')
      })
    })

    test('should maintain correct prototype chain', () => {
      const error = new NotFoundError()

      expect(error instanceof Error).toBe(true)
      expect(error instanceof AppError).toBe(true)
      expect(error instanceof NotFoundError).toBe(true)
    })
  })

  describe('Error inheritance and polymorphism', () => {
    test('should properly handle polymorphic error handling', () => {
      const errors: AppError[] = [
        new AppError('Generic error'),
        new AuthenticationError('Auth error'),
        new AuthorizationError('Authz error'),
        new NotFoundError('Not found error')
      ]

      errors.forEach(error => {
        expect(error instanceof AppError).toBe(true)
        expect(error instanceof Error).toBe(true)
        expect(typeof error.message).toBe('string')
        expect(typeof error.statusCode).toBe('number')
        expect(typeof error.code).toBe('string')
      })
    })

    test('should allow type discrimination', () => {
      const handleError = (error: AppError) => {
        if (error instanceof AuthenticationError) {
          return 'authentication'
        } else if (error instanceof AuthorizationError) {
          return 'authorization'
        } else if (error instanceof NotFoundError) {
          return 'not_found'
        } else {
          return 'generic'
        }
      }

      expect(handleError(new AuthenticationError())).toBe('authentication')
      expect(handleError(new AuthorizationError())).toBe('authorization')
      expect(handleError(new NotFoundError())).toBe('not_found')
      expect(handleError(new AppError('test'))).toBe('generic')
    })

    test('should work with JSON.stringify', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR')
      const serialized = JSON.stringify(error)
      const parsed = JSON.parse(serialized)

      // Note: JSON.stringify on Error objects doesn't include inherited properties by default
      // This test ensures the error can be serialized without throwing
      expect(typeof serialized).toBe('string')
      expect(typeof parsed).toBe('object')
    })

    test('should work with try-catch blocks', () => {
      const throwAuthError = () => {
        throw new AuthenticationError('Test auth error')
      }

      const throwNotFoundError = () => {
        throw new NotFoundError('Test not found error')
      }

      // Test authentication error
      try {
        throwAuthError()
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error instanceof AuthenticationError).toBe(true)
        expect(error instanceof AppError).toBe(true)
        expect((error as AuthenticationError).statusCode).toBe(401)
      }

      // Test not found error
      try {
        throwNotFoundError()
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error instanceof NotFoundError).toBe(true)
        expect(error instanceof AppError).toBe(true)
        expect((error as NotFoundError).statusCode).toBe(404)
      }
    })

    test('should handle stack traces correctly', () => {
      const error = new AuthenticationError('Test error')
      
      expect(typeof error.stack).toBe('string')
      expect(error.stack).toContain('Test error')
      // Stack trace might contain 'AppError' since it's the base class name
      expect(error.stack).toContain('Error')
    })
  })

  describe('edge cases and error conditions', () => {
    test('should handle null and undefined messages', () => {
      // TypeScript would normally prevent this, but testing runtime behavior
      const error1 = new AppError(null as any)
      const error2 = new AppError(undefined as any)

      // JavaScript converts null/undefined to string when used as message
      expect(error1.message).toBe(null)
      expect(error2.message).toBe(undefined)
    })

    test('should handle non-string messages', () => {
      const error1 = new AppError(123 as any)
      const error2 = new AppError({} as any)
      const error3 = new AppError([] as any)

      // JavaScript keeps the type as-is since Error constructor accepts any type
      expect(error1.message).toBe(123)
      expect(error2.message).toEqual({})
      expect(error3.message).toEqual([])
    })

    test('should handle extreme status codes', () => {
      const error1 = new AppError('Test', 0)
      const error2 = new AppError('Test', 999)
      const error3 = new AppError('Test', -1)

      expect(error1.statusCode).toBe(0)
      expect(error2.statusCode).toBe(999)
      expect(error3.statusCode).toBe(-1)
    })

    test('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000)
      const error = new AppError(longMessage)

      expect(error.message).toBe(longMessage)
      expect(error.message.length).toBe(10000)
    })

    test('should handle special characters in messages', () => {
      const specialMessage = 'Test üöä 🎯 <script>alert("test")</script> \n\t\r'
      const error = new AppError(specialMessage)

      expect(error.message).toBe(specialMessage)
    })
  })
})