/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Boot veil remover, defined by the inline boot script in index.html.
// Optional because it's absent under SSR/vitest where index.html never runs.
interface Window {
  __hpcBootVeil?: { remove: () => void }
}
