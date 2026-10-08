import { users } from '@/db/auth-schema'
import { sql } from 'drizzle-orm'
import {
    index,
    integer,
    primaryKey,
    sqliteTable,
    text,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export * from './auth-schema'

export const decks = sqliteTable(
    'decks',
    {
        id: text('id').primaryKey().notNull(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        title: text('title').notNull(),
        description: text('description'),
        category: text('category').notNull(),
        activeUntil: integer('active_until', { mode: 'timestamp' }),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        userIdIdx: index('decks_user_id_idx').on(table.userId),
        activeUntilIdx: index('decks_active_until_idx').on(table.activeUntil),
    })
)

export const flashcards = sqliteTable(
    'flashcards',
    {
        id: text('id').primaryKey().notNull(),
        deckId: text('deck_id')
            .notNull()
            .references(() => decks.id),
        // Item type, see lib/items/schema.ts. Legacy cards are 'basic'.
        type: text('type').notNull().default('basic'),
        // Type-specific JSON content. Null for legacy basic cards.
        content: text('content'),
        // Prompt shown for the item and a plain-text answer summary
        front: text('front').notNull(),
        back: text('back').notNull(),
        isExamRelevant: integer('is_exam_relevant', { mode: 'boolean' })
            .notNull()
            .default(sql`0`),
        difficultyLevel: integer('difficulty_level').notNull().default(0),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        deckIdIdx: index('flashcards_deck_id_idx').on(table.deckId),
        examRelevantIdx: index('flashcards_exam_relevant_idx').on(
            table.isExamRelevant
        ),
    })
)

export const cardReviews = sqliteTable(
    'card_reviews',
    {
        id: text('id').primaryKey().notNull(),
        flashcardId: text('flashcard_id')
            .notNull()
            .references(() => flashcards.id),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        reviewedAt: integer('reviewed_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        rating: integer('rating').notNull(), // 1-4 (again, hard, good, easy)
        easeFactor: integer('ease_factor').notNull().default(250), // Scaled x100 (2.5 = 250)
        interval: integer('interval').notNull().default(0), // In days
        nextReview: integer('next_review', {
            mode: 'timestamp',
        }).notNull(),
    },
    (table) => ({
        userIdIdx: index('card_reviews_user_id_idx').on(table.userId),
        flashcardIdIdx: index('card_reviews_flashcard_id_idx').on(
            table.flashcardId
        ),
        nextReviewIdx: index('card_reviews_next_review_idx').on(
            table.nextReview
        ),
        userFlashcardIdx: index('card_reviews_user_flashcard_idx').on(
            table.userId,
            table.flashcardId
        ),
    })
)

export const reviewEvents = sqliteTable(
    'review_events',
    {
        id: text('id').primaryKey().notNull(),
        flashcardId: text('flashcard_id')
            .notNull()
            .references(() => flashcards.id),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        reviewedAt: integer('reviewed_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        rating: integer('rating').notNull(),
        easeFactor: integer('ease_factor').notNull(),
        interval: integer('interval').notNull(),
        // Exercise kind that produced this review (null for legacy reviews)
        exerciseType: text('exercise_type'),
        createStamp: integer('create_stamp', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        userIdIdx: index('review_events_user_id_idx').on(table.userId),
        flashcardIdIdx: index('review_events_flashcard_id_idx').on(
            table.flashcardId
        ),
        reviewedAtIdx: index('review_events_reviewed_at_idx').on(
            table.reviewedAt
        ),
    })
)

export const studySessions = sqliteTable(
    'study_sessions',
    {
        id: text('id').primaryKey().notNull(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        deckId: text('deck_id').notNull(),
        startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
        endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
        duration: integer('duration').notNull(), // in milliseconds
        cardsReviewed: integer('cards_reviewed').notNull(),
        isCompleted: integer('is_completed', { mode: 'boolean' })
            .notNull()
            .default(false),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        userIdIdx: index('study_sessions_user_id_idx').on(table.userId),
        deckIdIdx: index('study_sessions_deck_id_idx').on(table.deckId),
        userDeckIdx: index('study_sessions_user_deck_idx').on(
            table.userId,
            table.deckId
        ),
    })
)

export const userPreferences = sqliteTable('user_preferences', {
    userId: text('user_id')
        .notNull()
        .references(() => users.id)
        .primaryKey(),
    animationsEnabled: integer('animations_enabled', { mode: 'boolean' })
        .notNull()
        .default(false),
    animationSpeed: integer('animation_speed').notNull().default(200),
    animationDirection: text('animation_direction')
        .notNull()
        .default('horizontal'),
    theme: text('theme').notNull().default('dark'),
    locale: text('locale').notNull().default('en'),
    soundEnabled: integer('sound_enabled', { mode: 'boolean' })
        .notNull()
        .default(true),
    dailyGoalXp: integer('daily_goal_xp').notNull().default(30),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
})

export const userStats = sqliteTable('user_stats', {
    userId: text('user_id')
        .notNull()
        .references(() => users.id)
        .primaryKey(),
    totalXp: integer('total_xp').notNull().default(0),
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    // Local calendar date (YYYY-MM-DD) of the last day with activity
    lastActiveDate: text('last_active_date'),
    streakFreezes: integer('streak_freezes').notNull().default(1),
    timezone: text('timezone').notNull().default('UTC'),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
})

export const dailyActivity = sqliteTable(
    'daily_activity',
    {
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        // Local calendar date (YYYY-MM-DD) in the user's timezone
        date: text('date').notNull(),
        xp: integer('xp').notNull().default(0),
        exercises: integer('exercises').notNull().default(0),
        correct: integer('correct').notNull().default(0),
        timeMs: integer('time_ms').notNull().default(0),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.userId, table.date] }),
    })
)

export const userAchievements = sqliteTable(
    'user_achievements',
    {
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        achievementId: text('achievement_id').notNull(),
        unlockedAt: integer('unlocked_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.userId, table.achievementId] }),
    })
)

export const deckRecords = sqliteTable(
    'deck_records',
    {
        id: text('id').primaryKey().notNull(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        deckId: text('deck_id')
            .notNull()
            .references(() => decks.id),
        bestMatchMs: integer('best_match_ms'),
        bestTestScore: integer('best_test_score'), // percent 0-100
        updatedAt: integer('updated_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        userDeckIdx: uniqueIndex('deck_records_user_deck_idx').on(
            table.userId,
            table.deckId
        ),
    })
)

export const subscriptions = sqliteTable(
    'subscriptions',
    {
        id: text('id').primaryKey().notNull(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id)
            .unique(),
        stripeCustomerId: text('stripe_customer_id').unique(),
        stripeSubscriptionId: text('stripe_subscription_id').unique(),
        stripePriceId: text('stripe_price_id'),
        stripeCurrentPeriodEnd: integer('stripe_current_period_end', {
            mode: 'timestamp',
        }),
        status: text('status'), // 'active', 'canceled', 'past_due', etc.
        cancelAtPeriodEnd: integer('cancel_at_period_end', {
            mode: 'boolean',
        }).default(false),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
        stripeCustomerIdIdx: index('subscriptions_stripe_customer_id_idx').on(
            table.stripeCustomerId
        ),
    })
)

export const webhookEvents = sqliteTable(
    'webhook_events',
    {
        id: text('id').primaryKey().notNull(), // Stripe event ID
        type: text('type').notNull(),
        processedAt: integer('processed_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        retryCount: integer('retry_count').default(0),
        status: text('status').notNull().default('processed'), // processed, failed, skipped
        error: text('error'),
    },
    (table) => ({
        typeIdx: index('webhook_events_type_idx').on(table.type),
        processedAtIdx: index('webhook_events_processed_at_idx').on(
            table.processedAt
        ),
    })
)

export const paymentRecoveryEvents = sqliteTable(
    'payment_recovery_events',
    {
        id: text('id').primaryKey().notNull(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),
        stripeInvoiceId: text('stripe_invoice_id').notNull(),
        stripeCustomerId: text('stripe_customer_id').notNull(),
        attemptCount: integer('attempt_count').notNull().default(0),
        status: text('status').notNull().default('grace'), // 'grace', 'warning', 'limited', 'recovered'
        gracePeriodEnd: integer('grace_period_end', { mode: 'timestamp' }),
        lastEmailSent: integer('last_email_sent', { mode: 'timestamp' }),
        recoveredAt: integer('recovered_at', { mode: 'timestamp' }),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: integer('updated_at', { mode: 'timestamp' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        userIdIdx: index('payment_recovery_user_id_idx').on(table.userId),
        invoiceIdIdx: index('payment_recovery_invoice_id_idx').on(
            table.stripeInvoiceId
        ),
        statusIdx: index('payment_recovery_status_idx').on(table.status),
        gracePeriodIdx: index('payment_recovery_grace_period_idx').on(
            table.gracePeriodEnd
        ),
    })
)
