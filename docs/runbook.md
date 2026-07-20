# HP-Coach operations runbook

Living document. One section per operational concern; each section says
what to do, exactly, when it's 23:00 and something is broken.

## Restore a database

**First line — D1 Time Travel** (native point-in-time recovery, ~30
days, to the minute). Use for "a bad migration / bad deploy / bad
import just damaged data":

```bash
# Find the point to restore to (bookmark or timestamp):
npx wrangler d1 time-travel info hpc-prod --env production
# Restore (STOP: this rewinds the LIVE database — confirm the timestamp):
npx wrangler d1 time-travel restore hpc-prod --env production --timestamp=<unix-or-ISO>
```

**Second line — nightly SQL export from R2** (survives database
deletion / account-level mishaps; taken 03:00 UTC by
`.github/workflows/backup.yml`, retained 30 days by the bucket
lifecycle rule):

```bash
# List available backups:
npx wrangler r2 object get hpc-backups --remote  # or browse in dashboard
# Download + restore into a SCRATCH database first — never straight to prod:
npx wrangler r2 object get "hpc-backups/production/<stamp>.sql.gz" --file backup.sql.gz --remote
gunzip backup.sql.gz
npx wrangler d1 create hpc-restore-drill
npx wrangler d1 execute hpc-restore-drill --file backup.sql --remote
# Sanity: row counts vs expectations
npx wrangler d1 execute hpc-restore-drill --remote \
  --command "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'sessions', COUNT(*) FROM sessions UNION ALL SELECT 'attempts', COUNT(*) FROM attempts;"
# If replacing prod: export scratch verification first, then apply the
# same file to the real DB. Delete the scratch DB after.
npx wrangler d1 delete hpc-restore-drill
```

## Monthly restore drill

A backup that has never been restored is a hope, not a backup. Once a
month (calendar reminder), run the second-line procedure end-to-end
into a scratch DB, check the row counts, delete the scratch. While in
there, verify the lifecycle rule works: the oldest object in
`hpc-backups` must be < 31 days old — an older object means the rule is
off, and the privacy-page claim ("deleted data persists in backups at
most 30 days") is false.

## Deploys

- Staging: automatic on every green main (`.github/workflows/deploy.yml`).
- Production: `gh workflow run deploy.yml -f promote_prod=true`, then
  approve the `production` environment gate in the Actions UI.
- Every deploy stamps the git SHA into `GET /health` (`version` field).
  A misbehaving environment's first diagnostic is: does /health show
  the SHA you think is deployed?
- Rollback: worker — redeploy the previous SHA (dispatch deploy from
  the old commit, or `wrangler rollback` for quick worker-only cases);
  data — Time Travel (above). Migrations are expand/contract: additive
  first, destructive only after the code that needed the old shape is
  gone. Never edit an applied migration.

## Migration discipline (expand/contract)

Schema changes ship in two phases so a rollback never strands data:
1. EXPAND: add new tables/columns (nullable/defaulted), deploy code
   that writes both shapes if needed.
2. CONTRACT: only after the expanded code has been live and stable,
   ship a later migration removing the old shape.
A migration that would drop or rewrite data in one step needs an
explicit backup taken immediately before (`workflow_dispatch` the
Backup workflow) and a written reason.

## Incidents

**What counts as an incident** (vs. an ordinary bug): auth is down
(users can't sign in), data loss or data damage (wrong answers/history
shown, rows gone), or a broken deploy that stays broken for more than
30 minutes. Everything else is a bug — fix it in normal course.

**The three steps, in order:**

1. **Verify.** Reproduce on staging and check `GET /health` on the
   affected environment (does the `version` SHA match what you think
   is deployed?). Rule out "it's just my machine" before anything else.
2. **Check status pages.** Cloudflare (cloudflarestatus.com), Clerk
   (status.clerk.com), Sentry (status.sentry.io), GitHub
   (githubstatus.com). If an upstream is down, the fix is patience —
   note it and go straight to step 3.
3. **Communicate.** Fix or roll back (see the deploy/rollback notes
   above), then reply.

**Communication convention:** honest, one pinned line, via reply from
the support address to every affected user who wrote in. No status
theater — say what broke, that it was ours, and when it was fixed.
House-voice template (Swedish, adapt the specifics):

> Det var ett fel hos oss, inte hos dig. Det är åtgärdat sedan
> \<tid\> — säg till om något fortfarande ser konstigt ut.

Future (>100 users): add a status note on the landing page per the
service plan. Until then the mailbox reply IS the status page.

Every incident gets a line in the log below with date/cause/fix.

### Incident log

- (none yet)
