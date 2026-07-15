/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Boot veil remover, defined by the inline boot script in index.html.
// Optional because it's absent under SSR/vitest where index.html never runs.
interface Window {
  __hpcBootVeil?: { remove: () => void }
  // Synchronous mirror of the `hpc:first-content` one-shot signal (see
  // lib/motion.ts `dispatchFirstContent`) — lets a late subscriber check
  // "has this already fired?" instead of only listening for the event.
  __hpcFirstContentFired?: boolean
}
