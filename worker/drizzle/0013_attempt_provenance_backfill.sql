-- Custom SQL migration file, put your code below! --
-- One-off backfill of attempts.source and item_stats.source (P5 infold PR 3,
-- bead hpf-94i5; docs/p5-infold-design.md Amendment 1 E). Rows that predate
-- the columns took their fail-closed default, 'unknown'. A row becomes
-- 'authentic' exactly when worker/src/lib/provenance.ts isAuthenticQid accepts
-- its qid: a sitting of the bank (AUTHENTIC_EXAM_IDS, the exams of
-- app/public/data/_index.json), then verb1/verb2 with ORD, LÄS (or the legacy
-- LAS), MEK or ELF, or kvant1/kvant2 with XYZ, KVA, NOG or DTK, then three
-- ASCII digits. The verbal suffix "-verb1-ORD-001" is 14 characters and the
-- quant suffix "-kvant1-XYZ-001" 15 (length() counts characters, so LÄS is 3).
-- Everything else stays 'unknown': no P5 question was served before this
-- column existed, so nothing is backfilled 'synthetic'. attempts.item_revision
-- stays null on every backfilled row (it is a P5 revision).
--
-- Only 'unknown' rows are touched, so the statements can be re-run safely, e.g.
-- once after the worker deploy, for rows the pre-migration worker wrote between
-- `migrations apply` and the deploy.
UPDATE `attempts` SET `source` = 'authentic'
WHERE `source` = 'unknown'
  AND (
    (
      (
        `question_id` GLOB '*-verb[12]-ORD-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-LÄS-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-LAS-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-MEK-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-ELF-[0-9][0-9][0-9]'
      )
      AND substr(`question_id`, 1, length(`question_id`) - 14) IN (
        'host-2013', 'host-2014', 'host-2015', 'host-2016', 'host-2017', 'host-2018',
        'host-ver1-2019', 'host-ver2-2019', 'host-2020', 'host-2021', 'host-2022',
        'host-2023', 'host-2024', 'host-2025',
        'var-2013', 'var-2014', 'var-2015', 'var-2016', 'var-2017', 'var-2018-1',
        'var-2019', 'var-2022-1', 'var-2022-2', 'var-2023', 'var-2024', 'var-2025',
        'var-2026'
      )
    )
    OR (
      (
        `question_id` GLOB '*-kvant[12]-XYZ-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-kvant[12]-KVA-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-kvant[12]-NOG-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-kvant[12]-DTK-[0-9][0-9][0-9]'
      )
      AND substr(`question_id`, 1, length(`question_id`) - 15) IN (
        'host-2013', 'host-2014', 'host-2015', 'host-2016', 'host-2017', 'host-2018',
        'host-ver1-2019', 'host-ver2-2019', 'host-2020', 'host-2021', 'host-2022',
        'host-2023', 'host-2024', 'host-2025',
        'var-2013', 'var-2014', 'var-2015', 'var-2016', 'var-2017', 'var-2018-1',
        'var-2019', 'var-2022-1', 'var-2022-2', 'var-2023', 'var-2024', 'var-2025',
        'var-2026'
      )
    )
  );
--> statement-breakpoint
UPDATE `item_stats` SET `source` = 'authentic'
WHERE `source` = 'unknown'
  AND (
    (
      (
        `question_id` GLOB '*-verb[12]-ORD-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-LÄS-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-LAS-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-MEK-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-verb[12]-ELF-[0-9][0-9][0-9]'
      )
      AND substr(`question_id`, 1, length(`question_id`) - 14) IN (
        'host-2013', 'host-2014', 'host-2015', 'host-2016', 'host-2017', 'host-2018',
        'host-ver1-2019', 'host-ver2-2019', 'host-2020', 'host-2021', 'host-2022',
        'host-2023', 'host-2024', 'host-2025',
        'var-2013', 'var-2014', 'var-2015', 'var-2016', 'var-2017', 'var-2018-1',
        'var-2019', 'var-2022-1', 'var-2022-2', 'var-2023', 'var-2024', 'var-2025',
        'var-2026'
      )
    )
    OR (
      (
        `question_id` GLOB '*-kvant[12]-XYZ-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-kvant[12]-KVA-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-kvant[12]-NOG-[0-9][0-9][0-9]'
        OR `question_id` GLOB '*-kvant[12]-DTK-[0-9][0-9][0-9]'
      )
      AND substr(`question_id`, 1, length(`question_id`) - 15) IN (
        'host-2013', 'host-2014', 'host-2015', 'host-2016', 'host-2017', 'host-2018',
        'host-ver1-2019', 'host-ver2-2019', 'host-2020', 'host-2021', 'host-2022',
        'host-2023', 'host-2024', 'host-2025',
        'var-2013', 'var-2014', 'var-2015', 'var-2016', 'var-2017', 'var-2018-1',
        'var-2019', 'var-2022-1', 'var-2022-2', 'var-2023', 'var-2024', 'var-2025',
        'var-2026'
      )
    )
  );
