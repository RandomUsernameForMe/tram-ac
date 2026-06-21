# Tram-AC

Is your next Prague tram air-conditioned? PWA + thin backend over Golemio open data.

In a heatwave, decide at the stop: take the tram now, or wait one for an air-conditioned car.

**Live:** https://tram-ac.vercel.app

## Architecture
- `web/` — Vite + React PWA (static).
- `api/` — Vercel serverless functions (`/api/health`, `/api/departures`, `/api/stops`).
- `server/src/` — shared Golemio logic (HTTP client + normalizers) imported by the functions; also unit-tested here.
- Same-origin: the PWA calls `/api/*` (no CORS).

## Dev
1. Get a free Golemio key: https://api.golemio.cz/api-keys
2. `export GOLEMIO_KEY=<key>`
3. `pnpm install`
4. `vercel dev` (serves PWA + `/api/*` together), or `pnpm --filter web dev` for UI-only.

## Test
`pnpm test`  (server + web + api-handler vitest)

## Deploy (Vercel)
- Connected to GitHub `RandomUsernameForMe/tram-ac`; pushes auto-deploy.
- Build: `pnpm --filter web build` → `web/dist` (static); `api/*.ts` become functions.
- Env: set `GOLEMIO_KEY` (production) in Vercel project settings.
- Manual: `vercel deploy --prod`.

## Status
Phase 1 (PWA + API) deployed and live-verified against real Golemio data.
Phase 2 (browser extension for Google Maps) is a separate plan — will need CORS
headers on the functions (currently same-origin only).
