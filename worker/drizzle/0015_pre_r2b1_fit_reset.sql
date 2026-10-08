-- Custom SQL migration file, put your code below! --
-- One-off reset of fitted state left by the fit from before the authentic-only
-- rating (P5 infold PR 3, review findings R2-B1 and R3-B1 of PR #378, beads
-- hpf-94i5, hpf-bojw and hpf-h38b, docs/p5-infold-design.md Amendment 1 E).
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
-- The evidence is a user_ability row with synthetic answers and no authentic
-- rating. Only the old fit wrote such a row. The current fit stores an
-- authentic rating with every synthetic answer it fits, and refuses to
-- continue from such a row. Elo ratings are path-dependent, so the old
-- contribution cannot be subtracted. When the evidence is found, every
-- user_ability and item_stats row is deleted and the fit watermark goes back
-- to 0. The next fit run (the nightly cron, or POST /api/fit/run) then refits
-- every retained attempt. Attempts that retention has already pruned (older
-- than 120 days) cannot be refitted. Otherwise nothing changes. The condition
-- is evaluated once, into a helper table that is dropped at the end, so the
-- deletes cannot change it midway.
--
-- Not evidence: a synthetic item_stats row while no user_ability row holds an
-- authentic rating. The current fit leaves exactly that once every user it
-- fitted a synthetic answer for has deleted the account (review finding
-- R3-B1). A reset there would delete every other user's ratings, and what
-- attempts already pruned by retention had contributed would be lost for
-- good. The old fit can leave the same state, but that fit was only ever on
-- the branch of PR #378 before R2-B1 was fixed, and it never ran against
-- staging or production (staging deploys only from main). This file was
-- edited before it was first applied anywhere. So that state cannot exist in
-- a real database, and this file does not look for it.
--
-- Re-running is safe. Once the current fit has run, the evidence cannot hold,
-- whatever happens next: account deletion removes a user's rows whole, and
-- retention removes attempts only. A re-run then changes nothing.
DROP TABLE IF EXISTS `tmp_0015_refit`;
--> statement-breakpoint
CREATE TABLE `tmp_0015_refit` (`found` integer NOT NULL);
--> statement-breakpoint
INSERT INTO `tmp_0015_refit` (`found`)
SELECT 1
WHERE EXISTS (
  SELECT 1 FROM `user_ability`
  WHERE `synthetic_attempts` > 0 AND `authentic_ability` IS NULL
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
