CREATE TABLE `fit_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_attempt_id` integer DEFAULT 0 NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `item_stats` (
	`question_id` text PRIMARY KEY NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `user_ability` (
	`user_id` integer NOT NULL,
	`section` text NOT NULL,
	`ability` real DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`user_id`, `section`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
