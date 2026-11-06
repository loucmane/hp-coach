CREATE TABLE `first_tries` (
	`user_id` integer NOT NULL,
	`question_id` text NOT NULL,
	`session_id` integer NOT NULL,
	`attempt_id` integer NOT NULL,
	`created_at` integer,
	`correct` integer,
	`source` text NOT NULL,
	`kind` text,
	`mock_answers` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`user_id`, `question_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Only retained history can be backfilled; already pruned answers are unrecoverable.
-- Selection matches lib/firstTries.ts, including mock picks and LAS aliases.
INSERT INTO first_tries (user_id, question_id, session_id, attempt_id, created_at, correct, source, kind, mock_answers)
WITH stored AS (SELECT * FROM first_tries ),
    candidates AS (
      SELECT user_id, question_id, session_id, attempt_id, created_at, correct, source, kind, 0 AS priority FROM stored
      UNION ALL
      SELECT s.user_id, s.question_id, s.session_id,
        json_extract(j.value, '$.id'), json_extract(j.value, '$.createdAt'),
        json_extract(j.value, '$.correct'), json_extract(j.value, '$.source'), s.kind, 0
      FROM stored s, json_each(s.mock_answers) j
      UNION ALL
      SELECT a.user_id, replace(a.question_id, '-LAS-', '-LÄS-'), a.session_id,
        a.id, a.created_at, a.correct, a.source, s.kind, 1
      FROM attempts a LEFT JOIN sessions s ON s.id = a.session_id 
    ), ordered AS (
      SELECT *, row_number() OVER (PARTITION BY user_id, question_id ORDER BY created_at, attempt_id, priority) AS position
      FROM candidates
    ), firsts AS (SELECT * FROM ordered WHERE position = 1), mock_picks AS (
      SELECT c.*, row_number() OVER (PARTITION BY c.user_id, c.question_id,
        date(c.created_at, 'unixepoch', 'weekday 0', '-6 days')
        ORDER BY c.created_at DESC, c.attempt_id DESC, c.priority) AS week_position
      FROM candidates c JOIN firsts f ON c.user_id = f.user_id AND c.question_id = f.question_id
        AND c.session_id = f.session_id WHERE f.kind = 'mock'
    )
    SELECT f.user_id, f.question_id, f.session_id, f.attempt_id, f.created_at, f.correct, f.source, f.kind,
      (SELECT json_group_array(json_object('id', p.attempt_id, 'createdAt', p.created_at,
        'correct', json(CASE p.correct WHEN 1 THEN 'true' WHEN 0 THEN 'false' ELSE 'null' END), 'source', p.source))
       FROM (SELECT * FROM mock_picks m WHERE m.user_id = f.user_id AND m.question_id = f.question_id
         AND week_position = 1 ORDER BY created_at DESC, attempt_id DESC LIMIT 40) p) AS mock_answers
    FROM firsts f WHERE true;
