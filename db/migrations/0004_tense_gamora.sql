CREATE INDEX `card_reviews_user_id_idx` ON `card_reviews` (`user_id`);--> statement-breakpoint
CREATE INDEX `card_reviews_flashcard_id_idx` ON `card_reviews` (`flashcard_id`);--> statement-breakpoint
CREATE INDEX `card_reviews_next_review_idx` ON `card_reviews` (`next_review`);--> statement-breakpoint
CREATE INDEX `card_reviews_user_flashcard_idx` ON `card_reviews` (`user_id`,`flashcard_id`);--> statement-breakpoint
CREATE INDEX `decks_user_id_idx` ON `decks` (`user_id`);--> statement-breakpoint
CREATE INDEX `decks_active_until_idx` ON `decks` (`active_until`);--> statement-breakpoint
CREATE INDEX `flashcards_deck_id_idx` ON `flashcards` (`deck_id`);--> statement-breakpoint
CREATE INDEX `flashcards_exam_relevant_idx` ON `flashcards` (`is_exam_relevant`);--> statement-breakpoint
CREATE INDEX `review_events_user_id_idx` ON `review_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `review_events_flashcard_id_idx` ON `review_events` (`flashcard_id`);--> statement-breakpoint
CREATE INDEX `review_events_reviewed_at_idx` ON `review_events` (`reviewed_at`);--> statement-breakpoint
CREATE INDEX `study_sessions_user_id_idx` ON `study_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `study_sessions_deck_id_idx` ON `study_sessions` (`deck_id`);--> statement-breakpoint
CREATE INDEX `study_sessions_user_deck_idx` ON `study_sessions` (`user_id`,`deck_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `user` (`email`);