DROP INDEX "session_session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `flashcards` ALTER COLUMN "erstellt_am" TO "erstellt_am" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE UNIQUE INDEX `session_session_token_unique` ON `session` (`session_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "erstellt_am" TO "erstellt_am" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `decks` ALTER COLUMN "erstellt_am" TO "erstellt_am" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `card_reviews` ALTER COLUMN "bewertet_am" TO "bewertet_am" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `study_sessions` ALTER COLUMN "erstellt_am" TO "erstellt_am" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_preferences` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `review_events` ALTER COLUMN "bewertet_am" TO "bewertet_am" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `review_events` ALTER COLUMN "create_stamp" TO "create_stamp" integer NOT NULL DEFAULT CURRENT_TIMESTAMP;