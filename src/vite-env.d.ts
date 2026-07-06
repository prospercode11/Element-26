/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional override for where the frontend sends AI requests. When unset,
  // the app posts to the same-origin "/api/generate-program" proxy.
  readonly VITE_AI_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
