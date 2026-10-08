ALTER TABLE `attempts` ADD `source` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` ADD `item_revision` integer;--> statement-breakpoint
ALTER TABLE `item_stats` ADD `source` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `mock_results` ADD `estimate_basis` text;--> statement-breakpoint
ALTER TABLE `user_ability` ADD `synthetic_attempts` integer DEFAULT 0 NOT NULL;