CREATE INDEX `idx_attempts_user_created` ON `attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_attempts_session` ON `attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_mistakes_user_status` ON `mistakes` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_mistakes_user_question` ON `mistakes` (`user_id`,`question_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_kind` ON `sessions` (`user_id`,`kind`);