DROP INDEX "session_session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `flashcards` ALTER COLUMN "is_exam_relevant" TO "is_exam_relevant" integer NOT NULL DEFAULT 0;--> statement-breakpoint
CREATE UNIQUE INDEX `session_session_token_unique` ON `session` (`session_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);