CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`processed_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`retry_count` integer DEFAULT 0,
	`status` text DEFAULT 'processed' NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `webhook_events_type_idx` ON `webhook_events` (`type`);--> statement-breakpoint
CREATE INDEX `webhook_events_processed_at_idx` ON `webhook_events` (`processed_at`);