ALTER TABLE `accounts` RENAME TO `account`;--> statement-breakpoint
ALTER TABLE `sessions` RENAME TO `session`;--> statement-breakpoint
ALTER TABLE `verification_tokens` RENAME TO `verificationToken`;--> statement-breakpoint
DROP INDEX `sessions_session_token_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `session_session_token_unique` ON `session` (`session_token`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_card_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`flashcard_id` text NOT NULL,
	`user_id` text NOT NULL,
	`bewertet_am` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`bewertung` integer NOT NULL,
	`ease_faktor` integer DEFAULT 250 NOT NULL,
	`intervall` integer DEFAULT 0 NOT NULL,
	`nächste_wiederholung` integer NOT NULL,
	FOREIGN KEY (`flashcard_id`) REFERENCES `flashcards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_card_reviews`("id", "flashcard_id", "user_id", "bewertet_am", "bewertung", "ease_faktor", "intervall", "nächste_wiederholung") SELECT "id", "flashcard_id", "user_id", "bewertet_am", "bewertung", "ease_faktor", "intervall", "nächste_wiederholung" FROM `card_reviews`;--> statement-breakpoint
DROP TABLE `card_reviews`;--> statement-breakpoint
ALTER TABLE `__new_card_reviews` RENAME TO `card_reviews`;--> statement-breakpoint
PRAGMA foreign_keys=ON;