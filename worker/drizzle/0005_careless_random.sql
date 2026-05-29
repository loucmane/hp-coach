ALTER TABLE `users` ADD `attempts_total` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `drills_total` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- xdevice: seed the new lifetime counters from existing rows so the
-- all-time totals don't reset to 0 for current users. After this the
-- counters are maintained incrementally on each write (and survive the
-- retention prune of the underlying rows).
UPDATE `users` SET
  `attempts_total` = (SELECT count(*) FROM `attempts` WHERE `attempts`.`user_id` = `users`.`id`),
  `drills_total` = (SELECT count(*) FROM `sessions` WHERE `sessions`.`user_id` = `users`.`id` AND `sessions`.`kind` = 'drill');