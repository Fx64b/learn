import { relations } from "drizzle-orm/relations";
import { decks, flashcards, user, cardReviews, studySessions, userPreferences, reviewEvents } from "./schema";

export const flashcardsRelations = relations(flashcards, ({one, many}) => ({
	deck: one(decks, {
		fields: [flashcards.deckId],
		references: [decks.id]
	}),
	cardReviews: many(cardReviews),
	reviewEvents: many(reviewEvents),
}));

export const decksRelations = relations(decks, ({one, many}) => ({
	flashcards: many(flashcards),
	user: one(user, {
		fields: [decks.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	decks: many(decks),
	cardReviews: many(cardReviews),
	studySessions: many(studySessions),
	userPreferences: many(userPreferences),
	reviewEvents: many(reviewEvents),
}));

export const cardReviewsRelations = relations(cardReviews, ({one}) => ({
	user: one(user, {
		fields: [cardReviews.userId],
		references: [user.id]
	}),
	flashcard: one(flashcards, {
		fields: [cardReviews.flashcardId],
		references: [flashcards.id]
	}),
}));

export const studySessionsRelations = relations(studySessions, ({one}) => ({
	user: one(user, {
		fields: [studySessions.userId],
		references: [user.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(user, {
		fields: [userPreferences.userId],
		references: [user.id]
	}),
}));

export const reviewEventsRelations = relations(reviewEvents, ({one}) => ({
	user: one(user, {
		fields: [reviewEvents.userId],
		references: [user.id]
	}),
	flashcard: one(flashcards, {
		fields: [reviewEvents.flashcardId],
		references: [flashcards.id]
	}),
}));