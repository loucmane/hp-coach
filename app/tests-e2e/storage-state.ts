// Path to the saved signed-in browser state, shared by playwright.config.ts
// (use.storageState) and auth.setup.ts (which writes it). Kept in its own
// module — importing it from auth.setup.ts would pull that file's top-level
// setup() call into config evaluation, which Playwright rejects.
//
// Relative to the runner cwd (app/), the base Playwright resolves
// `use.storageState` against. Gitignored — it holds a live Clerk session.
export const STORAGE_STATE = 'tests-e2e/.auth/user.json'
