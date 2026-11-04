CREATE TABLE `explanation_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`qid` text NOT NULL,
	`verdict` text NOT NULL,
	`note` text,
	`model` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_explanation_feedback_user_qid` ON `explanation_feedback` (`user_id`,`qid`);--> statement-breakpoint
ALTER TABLE `attempts` ADD `confidence` text;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD `step` integer;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD `guess` text;--> statement-breakpoint
ALTER TABLE `mistakes` ADD `reason` text DEFAULT 'wrong';--> statement-breakpoint
ALTER TABLE `mistakes` ADD `last_confidence` text;--> statement-breakpoint
ALTER TABLE `mock_results` ADD `half_run_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `marks` text;--> statement-breakpoint
ALTER TABLE `users` ADD `answer_confidence` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `facit_timing` text DEFAULT 'each';--> statement-breakpoint
ALTER TABLE `users` ADD `show_my_time` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `mock_clock_visible` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `mock_reminder` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `text_size` text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE `users` ADD `motion` text DEFAULT 'system';--> statement-breakpoint
ALTER TABLE `users` ADD `shortcuts` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `mode_follow_system` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `target_score` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `quant_repeat` text DEFAULT 'new';