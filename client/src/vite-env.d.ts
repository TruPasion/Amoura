/// <reference types="vite/client" />


interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  // add other env vars you use here, e.g.
  // readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}