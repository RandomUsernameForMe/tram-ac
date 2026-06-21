# Tram-AC

Is your next Prague tram air-conditioned? PWA + thin backend over Golemio open data.

In a heatwave, decide at the stop: take the tram now, or wait one for an air-conditioned car.

## Dev
1. Get a free Golemio key: https://api.golemio.cz/api-keys
2. `export GOLEMIO_KEY=<key>`
3. `pnpm install`
4. `pnpm dev:server` and `pnpm dev:web` (separate terminals)

## Test
`pnpm test`  (runs server + web vitest)

## Deploy (Railway)
- Service `server`: start `node --experimental-strip-types src/index.ts`, env `GOLEMIO_KEY`, `PORT`.
- Web: `pnpm --filter web build`, serve `web/dist` as static (Railway static or Netlify). Set `VITE_API_BASE` to the deployed server URL at build time.

## Status
Phase 1 (backend + PWA) implemented. Tests run against captured fixtures.
Pending a Golemio key: real fixture capture (server probe) and live smoke tests.
Phase 2 (browser extension for Google Maps) is a separate plan.
