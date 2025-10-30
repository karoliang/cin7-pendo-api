/// <reference types="vite/client" />

// Type-safe environment variables
interface ImportMetaEnv {
  readonly VITE_PENDO_API_KEY: string
  readonly VITE_PENDO_API_BASE_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
