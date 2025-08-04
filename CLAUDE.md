# CLAUDE.md - Developer Guide for Claude Code

This document provides essential context for Claude Code instances working on this flashcard learning application. Read this before making any code changes.

## Project Overview

**Learn** is a modern flashcard application built with Next.js 15 that implements spaced repetition learning (SuperMemo-2 algorithm). It features:
- AI-powered flashcard generation from text/PDFs (using Google AI/Gemini)
- Stripe-based Pro subscription system with automatic payment recovery
- Multi-language support (English/German) via next-intl
- Comprehensive spaced repetition system with progress tracking
- Email authentication via Resend

## Tech Stack

- **Framework**: Next.js 15 with App Router, TypeScript (strict mode)
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Authentication**: NextAuth.js with email provider (Resend)
- **UI**: shadcn/ui components with Tailwind CSS v4
- **AI**: Google AI (Gemini) for flashcard generation
- **Payments**: Stripe with webhook security
- **State**: Zustand for client state, server actions for mutations
- **Testing**: Vitest with @testing-library/react
- **Deployment**: Vercel with cron jobs for payment recovery

## Key Architecture Patterns

### File Organization
```
/app                 # Next.js App Router pages and API routes
  /actions          # Server actions (mutations)
  /api             # API routes (REST endpoints)
  /[route]         # Page components
/components         # React components
  /ui              # shadcn/ui components (DO NOT EDIT MANUALLY)
  /flashcards      # Flashcard-specific components
  /subscription    # Stripe/billing components
/lib               # Utility functions and configurations
  /subscription    # Stripe and payment logic
  /rate-limit      # Rate limiting with Upstash Redis
/db                # Database schema and migrations
/middleware        # Security and rate limiting middleware
/types             # TypeScript type definitions
/messages          # i18n translation files (en.json, de.json)
```

### Database Schema (Key Tables)
- `users` - NextAuth.js user accounts
- `decks` - Flashcard collections with user ownership
- `flashcards` - Individual cards with difficulty tracking
- `cardReviews` - Latest SRS state per user/card
- `reviewEvents` - Historical review data for analytics
- `studySessions` - Learning session tracking
- `subscriptions` - Stripe subscription management
- `paymentRecoveryEvents` - Automated payment recovery system

### Authentication & Authorization
- Email-only auth via NextAuth.js (no OAuth providers)
- Protected routes: `/learn/*`, `/profile`, `/deck/*`
- AI API endpoints require authentication
- Middleware handles route protection and redirects

### Spaced Repetition System
- Implementation in `/lib/srs.ts` based on SuperMemo-2
- Grades: 1=Again, 2=Hard, 3=Good, 4=Easy
- Intervals capped at 365 days
- Reviews tracked in `cardReviews` (current state) and `reviewEvents` (history)

## Development Commands

### Setup (only if .env.local is missing)
```bash
pnpm install                    # Install dependencies
cp .env.local.example .env.local  # Create environment file
pnpm db:migrate                 # Run database migrations
```

### Development
```bash
pnpm dev              # Start dev server with Turbopack
pnpm build            # Production build
pnpm test             # Run tests with Vitest
pnpm test:coverage    # Run tests with coverage
pnpm format && pnpm lint  # Format and lint (REQUIRED before commits)
```

### Database
```bash
pnpm db:generate      # Generate new migration
pnpm db:migrate       # Apply migrations
pnpm db:push         # Push schema changes (dev only)
```

## Environment Variables (Required)

### Core
```env
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
DATABASE_URL="your-turso-url"
DATABASE_AUTH_TOKEN="your-turso-token"
RESEND_API_KEY="your-resend-key"
EMAIL_FROM="learn@yourdomain.com"
```

### Optional Features
```env
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"  # For AI features
STRIPE_SECRET_KEY="your-stripe-secret"             # For subscriptions
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-pub"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"
REDIS_URL="your-redis-url"                         # For rate limiting
```

## Code Standards & Guidelines

### Before Each Commit
1. **ALWAYS** run `pnpm format && pnpm lint`
2. **ALWAYS** run `pnpm test` and ensure tests pass
3. Review changes for security issues, especially around auth/payments

### Component Guidelines
- Use shadcn/ui components instead of custom ones when possible
- Add new shadcn components via: `pnpm dlx shadcn@latest add <component>`
- **NEVER** manually edit files in `/components/ui/`
- Use server actions for mutations, not API routes when possible
- Implement proper TypeScript types for all new features

### Database Guidelines
- Use Drizzle ORM for all database operations
- Create migrations for schema changes: `pnpm db:generate`
- Always use transactions for multi-table operations
- Index frequently queried columns (user_id, deck_id, etc.)

### Security Guidelines
- All AI API endpoints require authentication (enforced in middleware)
- Rate limiting implemented via Upstash Redis
- Stripe webhook signature verification required
- SQL injection protection via Drizzle parameterized queries
- Security headers configured in `next.config.ts`

## Key Business Logic

### AI Flashcard Generation
- Located in `/app/actions/ai-flashcards.ts` and `/app/api/ai-flashcards/route.ts`
- Supports text prompts and PDF file upload
- Streaming responses with progress tracking
- Rate limited for free users, unlimited for Pro subscribers
- Validates generated content before saving

### Subscription System
- Stripe integration with automatic payment recovery
- Daily cron job (`/api/cron/payment-recovery`) handles failed payments
- Grace period system with email notifications
- Subscription status affects AI feature access

### Internationalization
- next-intl configuration in `/lib/i18n.ts`
- Translation files in `/messages/` (en.json, de.json)
- User locale stored in preferences and cookies
- Server-side locale detection with fallbacks

## Testing Strategy

- Unit tests for business logic (SRS algorithm, utilities)
- Integration tests for server actions
- Component tests with @testing-library/react
- Happy DOM for fast test environment
- Coverage reports available via `pnpm test:coverage`

## Deployment & Monitoring

- **Primary**: Vercel with automatic deployments
- **Database**: Turso (edge-distributed SQLite)
- **Email**: Resend for transactional emails
- **Monitoring**: Vercel Analytics enabled
- **Cron Jobs**: Payment recovery runs daily at 12:00 UTC

## Common Development Tasks

### Adding a New shadcn Component
```bash
pnpm dlx shadcn@latest add button  # Example: adding button component
```

### Creating a New Server Action
1. Add to appropriate file in `/app/actions/`
2. Use proper error handling and validation
3. Return serializable data only
4. Add tests in `/__tests__/actions/`

### Adding Database Schema Changes
1. Modify `/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL in `/db/migrations/`
4. Apply: `pnpm db:migrate`

### Implementing New AI Features
1. Check subscription status in server action
2. Implement rate limiting for free users
3. Add proper error handling for API failures
4. Consider streaming for long-running operations

## Troubleshooting Common Issues

### Build Failures
- Ensure all TypeScript errors are resolved
- Check for missing environment variables
- Verify database connection and schema

### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Check Resend API key and email configuration
- Ensure proper session handling in middleware

### Stripe Integration
- Verify webhook endpoint configuration
- Check webhook signature validation
- Test with Stripe CLI for local development

### AI Features Not Working
- Verify Google AI API key is valid
- Check rate limiting configuration
- Ensure proper subscription status checks

## Important Notes

- **Never commit sensitive environment variables**
- **Always test subscription-related changes carefully**
- **Rate limiting is critical for AI features**
- **Database migrations are irreversible in production**
- **Follow the existing error handling patterns**
- **Maintain test coverage for critical paths**

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Stripe API Docs](https://stripe.com/docs/api)
- [SuperMemo-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)

---

Built with ❤️ by [Fx64b](https://fx64b.dev) | Last updated: 2025-08-04