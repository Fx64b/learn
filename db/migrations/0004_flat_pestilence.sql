ALTER TABLE `users` RENAME TO `user`;--> statement-breakpoint
DROP INDEX `users_email_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`titel` text NOT NULL,
	`beschreibung` text,
	`kategorie` text NOT NULL,
	`erstellt_am` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_decks`("id", "user_id", "titel", "beschreibung", "kategorie", "erstellt_am") SELECT "id", "user_id", "titel", "beschreibung", "kategorie", "erstellt_am" FROM `decks`;--> statement-breakpoint
DROP TABLE `decks`;--> statement-breakpoint
ALTER TABLE `__new_decks` RENAME TO `decks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;