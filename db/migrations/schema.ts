import { sqliteTable, AnySQLiteColumn, foreignKey, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const flashcards = sqliteTable("flashcards", {
	id: text().primaryKey().notNull(),
	deckId: text("deck_id").notNull().references(() => decks.id),
	vorderseite: text().notNull(),
	rueckseite: text().notNull(),
	istPruefungsrelevant: integer("ist_pruefungsrelevant").default(0).notNull(),
	schwierigkeitsgrad: integer().default(0).notNull(),
	erstelltAm: integer("erstellt_am").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const user = sqliteTable("user", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	emailVerified: integer(),
	name: text(),
	image: text(),
	erstelltAm: integer("erstellt_am").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	uniqueIndex("user_email_unique").on(table.email),
]);

export const account = sqliteTable("account", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
});

export const session = sqliteTable("session", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	sessionToken: text("session_token").notNull(),
	expires: integer().notNull(),
},
(table) => [
	uniqueIndex("session_session_token_unique").on(table.sessionToken),
]);

export const decks = sqliteTable("decks", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => user.id),
	titel: text().notNull(),
	beschreibung: text(),
	kategorie: text().notNull(),
	erstelltAm: integer("erstellt_am").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	aktivBis: integer("aktiv_bis"),
});

export const cardReviews = sqliteTable("card_reviews", {
	id: text().primaryKey().notNull(),
	flashcardId: text("flashcard_id").notNull().references(() => flashcards.id),
	userId: text("user_id").notNull().references(() => user.id),
	bewertetAm: integer("bewertet_am").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	bewertung: integer().notNull(),
	easeFaktor: integer("ease_faktor").default(250).notNull(),
	intervall: integer().default(0).notNull(),
	naechsteWiederholung: integer("naechste_wiederholung").notNull(),
});

export const studySessions = sqliteTable("study_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => user.id),
	deckId: text("deck_id").notNull(),
	startTime: integer("start_time").notNull(),
	endTime: integer("end_time").notNull(),
	duration: integer().notNull(),
	cardsReviewed: integer("cards_reviewed").notNull(),
	isCompleted: integer("is_completed").default(0).notNull(),
	erstelltAm: integer("erstellt_am").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const userPreferences = sqliteTable("user_preferences", {
	userId: text("user_id").primaryKey().notNull().references(() => user.id),
	animationsEnabled: integer("animations_enabled").default(0).notNull(),
	animationSpeed: integer("animation_speed").default(200).notNull(),
	animationDirection: text("animation_direction").default("horizontal").notNull(),
	theme: text().default("dark").notNull(),
	updatedAt: integer("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	locale: text().default("en").notNull(),
});

export const reviewEvents = sqliteTable("review_events", {
	id: text().primaryKey().notNull(),
	flashcardId: text("flashcard_id").notNull().references(() => flashcards.id),
	userId: text("user_id").notNull().references(() => user.id),
	bewertetAm: integer("bewertet_am").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	bewertung: integer().notNull(),
	easeFaktor: integer("ease_faktor").notNull(),
	intervall: integer().notNull(),
	createStamp: integer("create_stamp").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const verificationToken = sqliteTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: integer().notNull(),
});

