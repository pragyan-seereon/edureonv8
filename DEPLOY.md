# Deploying Edureon (UI-only SPA)

The app is fully client-side: all data lives in `localStorage` via
`src/lib/store.ts`. There is no backend and no server code to deploy —
`bun run build` produces a static `dist/client/` folder that any static
host can serve.

## What the build does

1. `vite build` compiles the client bundle to `dist/client/assets/`.
2. `scripts/make-spa-html.mjs` reads the Vite manifest and writes
   `dist/client/index.html` referencing the entry chunk + styles.
3. The script also deletes `dist/server/` (Cloudflare Worker leftovers)
   so only the static SPA payload remains.

## Vercel
1. Import the repo in Vercel.
2. Framework preset: **Other**. `vercel.json` already sets
   `buildCommand`, `outputDirectory: dist/client`, and the SPA rewrite.

## Netlify
1. New site from Git → pick this repo.
2. `netlify.toml` sets `command = "bun run build"`,
   `publish = "dist/client"`, and the SPA fallback.

## Any static host
Upload the contents of `dist/client/` and configure a fallback so unknown
paths serve `index.html` (needed for TanStack Router deep links).
