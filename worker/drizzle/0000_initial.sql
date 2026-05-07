CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`session_id` integer NOT NULL,
	`question_id` text NOT NULL,
	`selected_answer` text,
	`correct` integer,
	`time_taken_ms` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `framework_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`layer1_id` text NOT NULL,
	`status` text DEFAULT 'untaught' NOT NULL,
	`last_transition_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mastery` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`section` text NOT NULL,
	`layer1_id` text NOT NULL,
	`score` real DEFAULT 0,
	`last_updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mistakes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`question_id` text NOT NULL,
	`layer1_ids` text,
	`status` text DEFAULT 'active',
	`error_count_7d` integer DEFAULT 1,
	`last_error_at` integer,
	`next_review_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	`kind` text NOT NULL,
	`sections` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `srs_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`item_id` text NOT NULL,
	`item_kind` text NOT NULL,
	`direction` text DEFAULT 'primary',
	`interval_days` integer DEFAULT 1,
	`ease` real DEFAULT 2.5,
	`due_at` integer,
	`last_reviewed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_user_id` text NOT NULL,
	`days_to_exam` integer,
	`daily_minutes` integer DEFAULT 20,
	`target_sitting_id` text,
	`coach` text DEFAULT 'taktiker',
	`palette` text DEFAULT 'sand',
	`mode` text DEFAULT 'light',
	`font` text DEFAULT 'literary',
	`density` text DEFAULT 'regular',
	`show_streak` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_user_id_unique` ON `users` (`clerk_user_id`);