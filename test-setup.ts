import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:test.db'
process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io'
process.env.TURSO_AUTH_TOKEN = 'test-token'

// Mock next-intl
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
  getLocale: vi.fn(() => Promise.resolve('en')),
}))

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock crypto module for nanoid
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-12345',
  },
})