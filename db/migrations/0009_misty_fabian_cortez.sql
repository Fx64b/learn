CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`animations_enabled` integer DEFAULT false NOT NULL,
	`animation_speed` integer DEFAULT 200 NOT NULL,
	`animation_direction` text DEFAULT 'horizontal' NOT NULL,
	`theme` text DEFAULT 'dark' NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
