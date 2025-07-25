import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
// @ts-ignore
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:test.db'
process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io'
process.env.TURSO_AUTH_TOKEN = 'test-token'
process.env.RESEND_API_KEY = 'fake_resend_api_key_123456789'
process.env.EMAIL_FROM = 'noreply@example.com'
process.env.NEXTAUTH_SECRET = 'fake_nextauth_secret_test_12345678901234567890'
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_stripe_secret_key_123456789'
process.env.STRIPE_PUBLISHABLE_KEY =
    'pk_test_fake_stripe_publishable_key_123456789'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake_webhook_secret_123456789'
process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID =
    'price_fake_monthly_123456789'
process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID =
    'price_fake_yearly_123456789'
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'fake_google_ai_key_123456789'
process.env.KV_URL = 'redis://localhost:6379'
process.env.KV_REST_API_TOKEN = 'fake_kv_token_123456789'
process.env.KV_REST_API_URL = 'https://fake-redis.upstash.io'
process.env.REDIS_URL = 'redis://localhost:6379'

// Mock Resend
vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => ({
        emails: {
            send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' } }),
        },
    })),
}))

// Mock database
vi.mock('@/db', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}))

// Mock database schema
vi.mock('@/db/schema', () => ({
    userPreferences: {
        userId: 'userId',
        animationsEnabled: 'animationsEnabled',
        animationSpeed: 'animationSpeed',
        animationDirection: 'animationDirection',
        theme: 'theme',
        locale: 'locale',
        updatedAt: 'updatedAt',
    },
    users: 'users',
    subscriptions: 'subscriptions',
    flashcards: 'flashcards',
    decks: 'decks',
    cardReviews: 'cardReviews',
    reviewEvents: 'reviewEvents',
    studySessions: 'studySessions',
}))

// Mock auth options
vi.mock('@/lib/auth', () => ({
    authOptions: {
        providers: [],
        adapter: {},
        session: { strategy: 'jwt' },
        pages: {},
        callbacks: {},
    },
}))

// Mock next-intl
vi.mock('next-intl/server', () => ({
    getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
    getLocale: vi.fn(() => Promise.resolve('en')),
}))

// Mock next-auth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((fn) => fn),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
    headers: vi.fn(),
    cookies: vi.fn(),
}))

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: vi.fn(),
    and: vi.fn(),
    or: vi.fn(),
    desc: vi.fn(),
    asc: vi.fn(),
    isNull: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    sql: vi.fn(),
}))

// Mock crypto module for nanoid
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'test-uuid-12345',
    },
})
