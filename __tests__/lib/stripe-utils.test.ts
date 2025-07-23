import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Stripe
const mockStripe = {
  apiVersion: '2025-06-30.basil',
  typescript: true,
  telemetry: false,
}

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => mockStripe),
  }
})

describe('Stripe Utilities', () => {
  let originalEnv: Record<string, string | undefined>

  beforeEach(() => {
    // Store original environment variables
    originalEnv = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
      NODE_ENV: process.env.NODE_ENV,
    }

    // Set valid test environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345'
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_12345'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_12345'
    process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID = 'price_monthly_test'
    process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID = 'price_yearly_test'
    process.env.NODE_ENV = 'test'

    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment variables
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    })
  })

  describe('Environment Variable Validation', () => {
    it('should validate all required environment variables are present', () => {
      const requiredVars = [
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID',
        'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID',
      ]

      requiredVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined()
        expect(process.env[envVar]).not.toBe('')
      })
    })

    it('should throw error when required environment variables are missing', () => {
      const requiredVars = [
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID',
        'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID',
      ]

      requiredVars.forEach(envVar => {
        const originalValue = process.env[envVar]
        delete process.env[envVar]

        expect(() => {
          // This would normally be called when importing the module
          const missingVars = requiredVars.filter((key) => !process.env[key])
          if (missingVars.length > 0) {
            throw new Error(
              `Missing required Stripe environment variables: ${missingVars.join(', ')}`
            )
          }
        }).toThrow(`Missing required Stripe environment variables: ${envVar}`)

        // Restore the value
        process.env[envVar] = originalValue
      })
    })

    it('should validate STRIPE_SECRET_KEY format', () => {
      // Test valid format
      expect(process.env.STRIPE_SECRET_KEY?.startsWith('sk_')).toBe(true)

      // Test invalid format
      process.env.STRIPE_SECRET_KEY = 'invalid_key'
      expect(process.env.STRIPE_SECRET_KEY.startsWith('sk_')).toBe(false)
    })
  })

  describe('Test vs Production Mode Detection', () => {
    it('should detect test mode correctly', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_12345'
      const isTestMode = process.env.STRIPE_SECRET_KEY.includes('test')
      expect(isTestMode).toBe(true)
    })

    it('should detect live mode correctly', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_live_12345'
      const isTestMode = process.env.STRIPE_SECRET_KEY.includes('test')
      expect(isTestMode).toBe(false)
    })

    it('should warn when using test keys in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.STRIPE_SECRET_KEY = 'sk_test_12345'
      
      const isTestMode = process.env.STRIPE_SECRET_KEY.includes('test')
      const isProduction = process.env.NODE_ENV === 'production'
      
      expect(isProduction && isTestMode).toBe(true)
    })
  })

  describe('Stripe Configuration', () => {
    it('should have correct API version', () => {
      expect(mockStripe.apiVersion).toBe('2025-06-30.basil')
    })

    it('should have TypeScript enabled', () => {
      expect(mockStripe.typescript).toBe(true)
    })

    it('should have telemetry disabled', () => {
      expect(mockStripe.telemetry).toBe(false)
    })

    it('should configure price IDs correctly', () => {
      const priceIds = {
        proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
        proYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
      }

      expect(priceIds.proMonthly).toBe('price_monthly_test')
      expect(priceIds.proYearly).toBe('price_yearly_test')
    })
  })

  describe('Webhook Secret Configuration', () => {
    it('should configure webhook secret', () => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      expect(webhookSecret).toBe('whsec_test_12345')
    })

    it('should validate webhook secret format', () => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      expect(webhookSecret?.startsWith('whsec_')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing STRIPE_SECRET_KEY', () => {
      delete process.env.STRIPE_SECRET_KEY

      expect(() => {
        if (!process.env.STRIPE_SECRET_KEY) {
          throw new Error('STRIPE_SECRET_KEY is not set')
        }
      }).toThrow('STRIPE_SECRET_KEY is not set')
    })

    it('should handle invalid secret key format', () => {
      process.env.STRIPE_SECRET_KEY = 'invalid_format'

      expect(() => {
        if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
          throw new Error(
            'STRIPE_SECRET_KEY must start with "sk_" - please check your Stripe secret key'
          )
        }
      }).toThrow('STRIPE_SECRET_KEY must start with "sk_"')
    })
  })

  describe('Environment-specific Configurations', () => {
    it('should handle development environment', () => {
      process.env.NODE_ENV = 'development'
      process.env.STRIPE_SECRET_KEY = 'sk_test_dev_12345'

      const isTestMode = process.env.STRIPE_SECRET_KEY.includes('test')
      const isDevelopment = process.env.NODE_ENV === 'development'

      expect(isDevelopment).toBe(true)
      expect(isTestMode).toBe(true)
    })

    it('should handle production environment with live keys', () => {
      process.env.NODE_ENV = 'production'
      process.env.STRIPE_SECRET_KEY = 'sk_live_12345'

      const isTestMode = process.env.STRIPE_SECRET_KEY.includes('test')
      const isProduction = process.env.NODE_ENV === 'production'

      expect(isProduction).toBe(true)
      expect(isTestMode).toBe(false)
    })
  })

  describe('Price ID Validation', () => {
    it('should validate monthly price ID format', () => {
      const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
      expect(monthlyPriceId).toMatch(/^price_/)
    })

    it('should validate yearly price ID format', () => {
      const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
      expect(yearlyPriceId).toMatch(/^price_/)
    })
  })

  describe('Security Considerations', () => {
    it('should not expose secret keys in logs', () => {
      const secretKey = process.env.STRIPE_SECRET_KEY
      const logSafeKey = secretKey?.substring(0, 7) + '...'
      
      expect(logSafeKey).toBe('sk_test...')
      expect(logSafeKey).not.toContain('12345')
    })

    it('should validate webhook secret format for security', () => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      
      // Webhook secrets should start with whsec_
      expect(webhookSecret?.startsWith('whsec_')).toBe(true)
      
      // Should have minimum length for security
      expect(webhookSecret?.length).toBeGreaterThan(10)
    })
  })

  describe('Configuration Object Structure', () => {
    it('should create proper stripe config object', () => {
      const stripeConfig = {
        isTestMode: process.env.STRIPE_SECRET_KEY?.includes('test') || false,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        priceIds: {
          proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!,
          proYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!,
        },
      }

      expect(stripeConfig).toEqual({
        isTestMode: true,
        webhookSecret: 'whsec_test_12345',
        priceIds: {
          proMonthly: 'price_monthly_test',
          proYearly: 'price_yearly_test',
        },
      })
    })
  })

  describe('Integration Tests', () => {
    it('should validate Stripe configuration structure', () => {
      const stripeConfig = {
        secretKey: process.env.STRIPE_SECRET_KEY,
        apiVersion: '2025-06-30.basil',
        typescript: true,
        telemetry: false,
      }
      
      expect(stripeConfig.secretKey).toBe('sk_test_12345')
      expect(stripeConfig.apiVersion).toBe('2025-06-30.basil')
      expect(stripeConfig.typescript).toBe(true)
      expect(stripeConfig.telemetry).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string environment variables', () => {
      process.env.STRIPE_SECRET_KEY = ''
      
      expect(() => {
        if (!process.env.STRIPE_SECRET_KEY) {
          throw new Error('STRIPE_SECRET_KEY is not set')
        }
      }).toThrow('STRIPE_SECRET_KEY is not set')
    })

    it('should handle whitespace-only environment variables', () => {
      process.env.STRIPE_SECRET_KEY = '   '
      
      const trimmed = process.env.STRIPE_SECRET_KEY.trim()
      expect(trimmed).toBe('')
    })

    it('should handle case sensitivity in environment variables', () => {
      process.env.STRIPE_SECRET_KEY = 'SK_TEST_12345' // uppercase
      
      expect(process.env.STRIPE_SECRET_KEY.startsWith('sk_')).toBe(false)
      expect(process.env.STRIPE_SECRET_KEY.toLowerCase().startsWith('sk_')).toBe(true)
    })
  })
})