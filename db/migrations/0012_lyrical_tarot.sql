CREATE TABLE `review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`flashcard_id` text NOT NULL,
	`user_id` text NOT NULL,
	`bewertet_am` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`bewertung` integer NOT NULL,
	`ease_faktor` integer NOT NULL,
	`intervall` integer NOT NULL,
	`create_stamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`flashcard_id`) REFERENCES `flashcards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
