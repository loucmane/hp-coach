CREATE TABLE `lesson_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`section` text NOT NULL,
	`framework_id` text,
	`device` text,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lesson_progress_user_section` ON `lesson_progress` (`user_id`,`section`);--> statement-breakpoint
ALTER TABLE `sessions` ADD `plan` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `device` text;--> statement-breakpoint
-- xdevice: before enforcing ≤1 active session per (user, kind), collapse
-- any pre-existing duplicate active rows (left over from before this
-- invariant) to the freshest per group — otherwise the unique index below
-- fails on apply. Keeps the highest id (latest inserted) active, ends the rest.
UPDATE `sessions` SET `ended_at` = unixepoch() * 1000
WHERE `ended_at` IS NULL
  AND `id` NOT IN (
    SELECT MAX(`id`) FROM `sessions` WHERE `ended_at` IS NULL GROUP BY `user_id`, `kind`
  );
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_user_kind_active` ON `sessions` (`user_id`,`kind`) WHERE "sessions"."ended_at" is null;