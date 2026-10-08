CREATE TABLE `daily_activity` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`exercises` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`time_ms` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `date`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deck_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deck_id` text NOT NULL,
	`best_match_ms` integer,
	`best_test_score` integer,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deck_records_user_deck_idx` ON `deck_records` (`user_id`,`deck_id`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `achievement_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`user_id` text PRIMARY KEY NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`streak_freezes` integer DEFAULT 1 NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `flashcards` ADD `type` text DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE `flashcards` ADD `content` text;--> statement-breakpoint
ALTER TABLE `review_events` ADD `exercise_type` text;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `sound_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `daily_goal_xp` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
-- Backfill daily activity from the review history so existing streaks and
-- heatmaps survive. user_stats rows are created lazily from this table.
INSERT OR IGNORE INTO `daily_activity` (`user_id`, `date`, `xp`, `exercises`, `correct`, `time_ms`)
SELECT `user_id`, date(`reviewed_at`, 'unixepoch'), COUNT(*) * 10, COUNT(*), SUM(CASE WHEN `rating` >= 3 THEN 1 ELSE 0 END), 0
FROM `review_events`
GROUP BY `user_id`, date(`reviewed_at`, 'unixepoch');
