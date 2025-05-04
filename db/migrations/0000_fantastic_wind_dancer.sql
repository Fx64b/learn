CREATE TABLE `card_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`flashcard_id` text NOT NULL,
	`user_id` text NOT NULL,
	`bewertet_am` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`bewertung` integer NOT NULL,
	`ease_faktor` integer DEFAULT 250 NOT NULL,
	`intervall` integer DEFAULT 0 NOT NULL,
	`nächste_wiederholung` integer NOT NULL,
	FOREIGN KEY (`flashcard_id`) REFERENCES `flashcards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`titel` text NOT NULL,
	`beschreibung` text,
	`kategorie` text NOT NULL,
	`erstellt_am` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`deck_id` text NOT NULL,
	`vorderseite` text NOT NULL,
	`rückseite` text NOT NULL,
	`ist_prüfungsrelevant` integer DEFAULT false NOT NULL,
	`schwierigkeitsgrad` integer DEFAULT 0 NOT NULL,
	`erstellt_am` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`erstellt_am` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);