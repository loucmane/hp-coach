-- Custom SQL migration file, put your code below! --
-- One-off reset of fitted state left by the fit from before the authentic-only
-- rating (P5 infold PR 3, review finding R2-B1 of PR #378, beads hpf-94i5 and
-- hpf-bojw, docs/p5-infold-design.md Amendment 1 E).
--
-- That fit learned an authentic item's difficulty against the answering
-- user's section ability, which counts synthetic (P5) answers. After a
-- synthetic answer, the user's next authentic answer moved that authentic item
-- with a P5-influenced rating. Every user who answered the item later
-- inherited it, while their ability still read calibrated. The fit now plays
-- an authentic item against user_ability.authentic_ability (0014): the user's
-- rating over their authentic answers alone, which it sets at their first
-- synthetic answer in a section.
--
-- State from the old fit exists only where it fitted a synthetic answer. Its
-- evidence is either of these:
--   a. a user_ability row with synthetic answers and no authentic rating. The
--      fit refuses to continue from such a row.
--   b. a synthetic item_stats row while no user_ability row holds an authentic
--      rating. Its users may have been deleted since, but the authentic items
--      they moved remain.
-- Elo ratings are path-dependent, so that contribution cannot be subtracted.
-- When the evidence is found, every user_ability and item_stats row is
-- deleted and the fit watermark goes back to 0. The next fit run (the nightly
-- cron, or POST /api/fit/run) then refits every retained attempt. Attempts
-- that retention has already pruned (older than 120 days) cannot be refitted.
-- Otherwise nothing changes. The condition is evaluated once, into a helper
-- table that is dropped at the end, so the deletes cannot change it midway.
--
-- The old fit was only ever on the branch that adds this file (PR #378), so
-- this finds nothing in a database that never ran that branch's worker.
-- Re-running is safe. The new fit stores an authentic rating with every
-- synthetic answer it fits, so after it has run, (a) cannot hold and (b) can
-- hold only when every user it fitted a synthetic answer for has since been
-- deleted. Then the reset only forces a refit.
DROP TABLE IF EXISTS `tmp_0015_refit`;
--> statement-breakpoint
CREATE TABLE `tmp_0015_refit` (`found` integer NOT NULL);
--> statement-breakpoint
INSERT INTO `tmp_0015_refit` (`found`)
SELECT 1
WHERE EXISTS (
    SELECT 1 FROM `user_ability`
    WHERE `synthetic_attempts` > 0 AND `authentic_ability` IS NULL
  )
  OR (
    EXISTS (SELECT 1 FROM `item_stats` WHERE `source` = 'synthetic')
    AND NOT EXISTS (SELECT 1 FROM `user_ability` WHERE `authentic_ability` IS NOT NULL)
  );
--> statement-breakpoint
DELETE FROM `user_ability`
WHERE EXISTS (SELECT 1 FROM `tmp_0015_refit`);
--> statement-breakpoint
UPDATE `fit_state` SET `last_attempt_id` = 0
WHERE EXISTS (SELECT 1 FROM `tmp_0015_refit`);
--> statement-breakpoint
DELETE FROM `item_stats`
WHERE EXISTS (SELECT 1 FROM `tmp_0015_refit`);
--> statement-breakpoint
DROP TABLE IF EXISTS `tmp_0015_refit`;
