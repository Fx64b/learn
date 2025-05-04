PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "user_id", "type", "provider", "provider_account_id", "refresh_token", "access_token", "expires_at", "token_type", "scope", "id_token", "session_state") SELECT "id", "user_id", "type", "provider", "provider_account_id", "refresh_token", "access_token", "expires_at", "token_type", "scope", "id_token", "session_state" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_card_reviews`("id", "flashcard_id", "user_id", "bewertet_am", "bewertung", "ease_faktor", "intervall", "nächste_wiederholung") SELECT "id", "flashcard_id", "user_id", "bewertet_am", "bewertung", "ease_faktor", "intervall", "nächste_wiederholung" FROM `card_reviews`;--> statement-breakpoint
DROP TABLE `card_reviews`;--> statement-breakpoint
ALTER TABLE `__new_card_reviews` RENAME TO `card_reviews`;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "user_id", "session_token", "expires") SELECT "id", "user_id", "session_token", "expires" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);