// Support routing (P2.4) — the ONE place the support address lives.
//
// Every surface that mentions support (the /hjalp page, the /mer row,
// the landing colophon, the ⌘K command) imports from here, so flipping
// the address is a one-line change.

// TODO(owner): presumptive address — the hp-coach.se domain purchase is
// pending; configure the mailbox and confirm this line when it lands.
export const SUPPORT_EMAIL = 'support@hp-coach.se'

/** Owner-ratified reply-time promise — verbatim, do not rephrase. */
export const SUPPORT_REPLY_LINE = 'Vi svarar inom en dag — det är en person, inte ett team.'

/** Deploy SHA stamped by CI (same source as Sentry's release tag);
 *  'dev' when running locally without one. */
export const APP_VERSION = ((import.meta.env.VITE_GIT_SHA as string | undefined) ?? 'dev').slice(
  0,
  12,
)

// The mailto door. Subject + a prefilled version line mean a bug report
// carries the deploy SHA without the user knowing to ask — the one thing
// support always needs and users never think to include.
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  'HP-Coach — fråga eller fel',
)}&body=${encodeURIComponent(`\n\n—\nApp-version: ${APP_VERSION}`)}`
