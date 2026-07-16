# Sentry error capture

Error capture is **wired but inert**. The code ships with no DSN, so nothing
is sent anywhere until you (the owner) create a Sentry account and add the
DSN in the two places below. No code change is needed to turn it on — just
the secrets.

Posture (already coded, don't re-decide): **errors only** (no performance
tracing, `tracesSampleRate: 0`), **no PII** (`sendDefaultPii: false` plus a
`beforeSend` that drops request headers/cookies, request bodies, URL query
strings, and breadcrumb data), release pinned to the deploy commit SHA.

## One-time setup (~10 minutes)

### 1. Create the account + project

1. Go to <https://sentry.io> and sign up (free tier — see limits below).
2. Create **one project**, platform **React** (`javascript-react`). Name it
   e.g. `hp-coach`. One project is enough — we separate signals by
   *environment* (`staging` vs `production`), which the app and worker set
   automatically. You do **not** need a second project for the worker; point
   both at the same DSN.
3. Copy the **DSN** — Settings → Projects → hp-coach → Client Keys (DSN).
   It looks like `https://<hash>@o<org>.ingest.sentry.io/<project>`.

> A DSN is public by design (it's baked into the client bundle). It only
> permits *sending* events, not reading them.

### 2. Put the DSN in the two places

**a) GitHub secret (frontend build).** Repo → Settings → Secrets and
variables → Actions → New repository secret:

- Name: `VITE_SENTRY_DSN`
- Value: the DSN

`deploy.yml` and `preview.yml` already read this into the Vite build. Absent
secret = empty string = the SPA ships inert, so this is safe. Re-run a deploy
after adding it.

**b) Wrangler secret (worker), once per environment:**

```bash
cd worker
pnpm secrets:put:sentry:staging     # wrangler secret put SENTRY_DSN --env staging
pnpm secrets:put:sentry:prod        # wrangler secret put SENTRY_DSN --env production
```

(Paste the same DSN at the prompt.) For local worker dev, optionally add
`SENTRY_DSN=...` to `worker/.dev.vars` — normally leave it out so local runs
stay inert.

### 3. Create the one alert rule that matters

So a broken signup night can't pass silently:

1. Sentry → Alerts → Create Alert → **Issues**.
2. Condition: **A new issue is created**.
3. Action: **Send a notification to email** (your address).
4. Save as e.g. "New issue → email".

That single rule is the point of this whole task: the first time a real user
hits an error you didn't, you get an email instead of finding out from a
churned user.

## Free-tier limits (sufficient)

The free plan covers **5,000 errors/month** and **1 seat** — comfortably
enough for a solo dogfood → early-launch product. `tracesSampleRate: 0` means
we send **zero** performance events, so there's no second quota to watch.

## Turning it off again

Delete the `VITE_SENTRY_DSN` GitHub secret and run
`wrangler secret delete SENTRY_DSN --env <staging|production>`. Both sides
fall back to inert with no code change.

## Where it lives in the code

- Frontend: `app/src/lib/sentry.ts` (init + scrub) and
  `app/src/components/AppErrorBoundary.tsx` (Swedish fallback UI). Init call
  in `app/src/main.tsx`.
- Worker: `worker/src/lib/sentry.ts` (options + scrub), wired via
  `Sentry.withSentry(...)` in `worker/src/index.ts`; `SENTRY_DSN` typed in
  `worker/src/types.ts`.
