import { accounts, users } from '@/db/auth-schema'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export * from './auth-schema'

export const decks = sqliteTable('decks', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    titel: text('titel').notNull(),
    beschreibung: text('beschreibung'),
    kategorie: text('kategorie').notNull(),
    aktivBis: integer('aktiv_bis', { mode: 'timestamp' }),
    erstelltAm: integer('erstellt_am', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
})

export const flashcards = sqliteTable('flashcards', {
    id: text('id').primaryKey().notNull(),
    deckId: text('deck_id')
        .notNull()
        .references(() => decks.id),
    vorderseite: text('vorderseite').notNull(),
    rueckseite: text('rueckseite').notNull(),
    istPruefungsrelevant: integer('ist_pruefungsrelevant', { mode: 'boolean' })
        .notNull()
        .default(false),
    schwierigkeitsgrad: integer('schwierigkeitsgrad').notNull().default(0),
    erstelltAm: integer('erstellt_am', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
})

export const cardReviews = sqliteTable('card_reviews', {
    id: text('id').primaryKey().notNull(),
    flashcardId: text('flashcard_id')
        .notNull()
        .references(() => flashcards.id),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    bewertetAm: integer('bewertet_am', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    bewertung: integer('bewertung').notNull(), // 1-4 (wieder, schwer, gut, einfach)
    easeFaktor: integer('ease_faktor').notNull().default(250), // Skaliert x100 (2.5 = 250)
    intervall: integer('intervall').notNull().default(0), // In Tagen
    naechsteWiederholung: integer('naechste_wiederholung', {
        mode: 'timestamp',
    }).notNull(),
})

export const reviewEvents = sqliteTable('review_events', {
    id: text('id').primaryKey().notNull(),
    flashcardId: text('flashcard_id')
        .notNull()
        .references(() => flashcards.id),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    bewertetAm: integer('bewertet_am', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    bewertung: integer('bewertung').notNull(),
    easeFaktor: integer('ease_faktor').notNull(),
    intervall: integer('intervall').notNull(),
    createStamp: integer('create_stamp', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
})

export const studySessions = sqliteTable('study_sessions', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    deckId: text('deck_id').notNull(),
    startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
    endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
    duration: integer('duration').notNull(), // in Millisekunden
    cardsReviewed: integer('cards_reviewed').notNull(),
    isCompleted: integer('is_completed', { mode: 'boolean' })
        .notNull()
        .default(false),
    erstelltAm: integer('erstellt_am', { mode: 'timestamp' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
})

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