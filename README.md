# Tram-AC

Is your next Prague tram air-conditioned? PWA + thin backend over Golemio open data.

In a heatwave, decide at the stop: take the tram now, or wait one for an air-conditioned car.

**Live:** https://tram-ac.vercel.app

## Architecture
- `shared/` — types + AC board UI (`Board`, `DepartureRow`), reused by web and extension.
- `web/` — Vite + React PWA (static).
- `api/` — Vercel serverless functions (`/api/health`, `/api/departures`, `/api/stops`, `/api/stops/by-name`, `/api/stops/search`). CORS-enabled.
- `server/src/` — shared Golemio logic (HTTP client + normalizers + stop index) imported by the functions; also unit-tested here.
- `extension/` — Chrome MV3 side-panel extension (Phase 2).

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

## Extension (Phase 2)
Chrome MV3 side panel showing tram AC beside Google Maps.
- Build: `pnpm --filter extension build` → load `extension/dist` unpacked at chrome://extensions.
- Click the toolbar icon to open the side panel beside Maps.
- Uses the deployed API (`/api/stops/search`, `/api/stops/by-name`, `/api/departures`) with CORS.
- Content script scrapes the active Maps route (best-effort); manual stop search is the fallback.

## Status
Phase 1 (PWA + API) deployed and live-verified against real Golemio data.
Phase 2 (extension) implemented; Maps DOM selectors in `extension/src/content.ts` are
best-effort and need confirming against a live capture (manual).
