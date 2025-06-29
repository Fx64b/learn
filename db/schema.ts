import { users } from '@/db/auth-schema'
import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
})
