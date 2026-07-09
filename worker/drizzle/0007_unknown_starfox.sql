CREATE TABLE `mock_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`session_id` integer NOT NULL,
	`mode` text NOT NULL,
	`half` text NOT NULL,
	`exam_id` text,
	`provpass` text,
	`presented` integer NOT NULL,
	`answered` integer NOT NULL,
	`correct` integer NOT NULL,
	`seen_before` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`breakdown` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mock_results_session_id_unique` ON `mock_results` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_mock_results_user_created` ON `mock_results` (`user_id`,`created_at`);