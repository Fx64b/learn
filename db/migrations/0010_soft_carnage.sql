CREATE TABLE `payment_recovery_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_invoice_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'grace' NOT NULL,
	`grace_period_end` integer,
	`last_email_sent` integer,
	`recovered_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_recovery_user_id_idx` ON `payment_recovery_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_recovery_invoice_id_idx` ON `payment_recovery_events` (`stripe_invoice_id`);--> statement-breakpoint
CREATE INDEX `payment_recovery_status_idx` ON `payment_recovery_events` (`status`);--> statement-breakpoint
CREATE INDEX `payment_recovery_grace_period_idx` ON `payment_recovery_events` (`grace_period_end`);