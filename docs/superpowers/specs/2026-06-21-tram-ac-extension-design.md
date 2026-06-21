# Tram-AC Phase 2 — Browser Extension Design Spec

**Date:** 2026-06-21
**Status:** Design approved, plan not yet written
**Depends on:** Phase 1 (deployed PWA + Vercel API at https://tram-ac.vercel.app)

## Problem

You're at a cafe on a laptop, planning your route home in Google Maps during a heatwave.
You want to know whether the tram you'd catch is air-conditioned — so you can decide to
leave now or wait one — without leaving Maps or pulling out your phone.

Google Maps shows a route leg as text ("Tram 22, board at Národní třída, toward X"). It
exposes neither a GTFS `stop_id` nor reliable coordinates. So the extension must resolve a
**stop name → stop_id**, pick the right **platform/direction**, and show live AC departures.

## Core scenario

> On a Maps transit result, a side panel docked beside Maps shows the air-conditioning
> status of the next trams for the leg I'm about to board — auto-detected from the route,
> with a manual stop search as the always-available fallback.

## Approach (decided)

Standalone Chrome MV3 extension with a **side panel** docked beside Google Maps. Hybrid
resolution: a content script scrapes the route (best-effort) to pre-fill and auto-select;
a manual fuzzy stop search is the robust spine that works even when scraping fails or you
aren't on a Maps page. The board UI is reused from Phase 1.

Rejected alternatives: thin shim that just deep-links the hosted PWA (less UX headroom — no
side panel/badge); inline badge injection into Maps rows (fragile DOM scraping).

## Key facts (verified 2026-06-21)

- `GET /v2/gtfs/stops?names[]=<exact name>` returns all matching stops incl. each boardable
  platform (`location_type 0`), with `stop_id`, `platform_code`, coords. Used for the auto
  path (scrape gives the exact Maps stop name).
- Golemio has **no fuzzy `search` param** (`?search=` → 400). Fuzzy autocomplete must be
  built from a cached full stop list.
- Departures per platform: `GET /v2/pid/departureboards?ids=<stop_id>` → each departure has
  `route.short_name`, `trip.headsign`, `trip.is_air_conditioned`. Headsign enables matching
  a scraped destination to the correct platform.
- Existing Vercel API: `/api/health`, `/api/departures?stop=<id>`, `/api/stops?lat=&lon=`.

## Architecture

```
Google Maps tab
  ├─ content script (content.ts)
  │     - scrapes the active transit route's first tram leg
  │     - extracts { stopName, line, destination } (best-effort)
  │     - sends to the side panel via runtime messaging
  │     - scrape failure is non-fatal: panel just shows an empty search box
  └─ side panel (React, panel.html + panel.tsx)
        ├─ StopSearch     — fuzzy stop-name autocomplete (manual spine)
        ├─ resolver       — exact name → platforms → auto-pick by destination
        ├─ Board          — reused 🟢/🔴/❓ departures view
        └─ api client      — calls the Vercel API (CORS-enabled)

Vercel API (extended)
  ├─ /api/departures?stop=<id>     (existing)
  ├─ /api/stops?lat=&lon=          (existing)
  ├─ /api/stops/by-name?name=<n>   (new — exact names[] → platforms)
  └─ /api/stops/search?q=<q>       (new — fuzzy autocomplete over cached index)

shared/  (new workspace package)
  - Departure / Stop types
  - Board, DepartureRow components + AC glyph logic
  - imported by both web/ and extension/
```

### Repository structure

```
tram-ac/
  shared/                    # NEW — DRY UI + types for web and extension
    package.json
    src/
      types.ts               # Departure, Stop (single source of truth)
      ac.ts                  # airConditioned -> glyph
      Board.tsx
      DepartureRow.tsx
  web/                       # imports shared (replaces its local copies)
  extension/                 # NEW
    package.json
    manifest.json            # MV3: sidePanel, content script for maps, host perms
    vite.config.ts           # builds panel + content + background
    src/
      content.ts             # Maps scraper
      scrape.ts              # pure parser: HTML/text -> {stopName,line,destination}
      background.ts          # opens side panel on Maps tabs
      panel.html
      panel.tsx              # side panel root
      resolver.ts            # pure: platforms + scrape -> chosen platform
      api.ts                 # calls Vercel API
  api/                       # + by-name, search endpoints; + CORS
  server/src/                # + name lookups in golemio.ts / normalize.ts
```

## Components & responsibilities

- **scrape.ts** (pure): given the route DOM/text, return `{ stopName, line, destination } |
  null`. No DOM access itself — takes already-extracted strings or a parsed node — so it is
  unit-testable against saved fixtures. `content.ts` does the DOM querying and calls it.
- **content.ts**: queries Maps DOM for the first tram leg, calls `scrape.ts`, messages the
  panel. Tolerant: any failure → sends nothing.
- **resolver.ts** (pure): given platforms (from by-name) and the scraped
  `{line, destination}`, return the platform whose departures head toward `destination`;
  if none/ambiguous, return `null` (panel shows the platform list).
- **panel.tsx**: orchestrates search → resolve → board; auto-refresh ~20s; manual search
  always present.
- **shared/Board + DepartureRow**: unchanged AC board, reused.

## Backend changes

- **CORS:** add permissive CORS headers (`Access-Control-Allow-Origin: *`,
  allow `GET, OPTIONS`) to all `/api/*` responses; handle preflight `OPTIONS`. These are
  public read-only GETs over open data, so `*` is acceptable.
- **`/api/stops/by-name?name=`:** server calls `gtfs/stops?names[]=<name>`, returns
  normalized boardable platforms (reuse `normalizeStops`).
- **`/api/stops/search?q=`:** fuzzy autocomplete. Server keeps an in-memory index of unique
  stop names → platforms, populated by one Golemio `gtfs/stops` fetch per cold start with a
  TTL; substring/normalized match on `q`. **Risk:** the full fetch can be ~10k rows; if too
  slow or large, replace with a build-time static index file. The search is for manual
  fallback only — the primary auto path uses `by-name`, so this is not on the hot path.

## Data flow

1. User opens a transit route in Google Maps; background opens the side panel.
2. `content.ts` scrapes the first tram leg → `{stopName, line, destination}` → panel.
3. Panel calls `/api/stops/by-name?name=stopName` → platforms.
4. `resolver.ts` picks the platform whose `/api/departures` headsigns match `destination`.
5. Board renders that platform's departures with AC; auto-refreshes.
6. If scrape failed or ambiguous: panel shows the search box / platform list; user picks.

## Error handling

- Scrape failure, not-on-Maps, name miss, API error → never blocks: fall back to manual
  search; show a plain message, not a fake result.
- AC `null` → ❓ (unchanged from Phase 1).
- Departures far ahead (outside live dispatch window) carry no reliable per-vehicle AC →
  shown as ❓; the panel notes the board is most accurate for imminent departures.

## Testing

- **scrape.ts:** unit tests against a saved Google Maps route HTML/text fixture (captured
  once, committed) — deterministic and offline. Covers the happy path and a malformed page.
- **resolver.ts:** pure unit tests (destination matches a platform; ambiguous → null).
- **search/by-name normalization:** unit tests reusing `normalizeStops`.
- **Backend endpoints:** vitest handler tests with mocked Golemio (as in Phase 1).
- **Manual smoke:** load unpacked in Chrome, open a Prague Maps route, confirm the side
  panel auto-resolves and shows AC; confirm manual search works off-Maps.

## Non-goals (YAGNI)

- Toolbar badge showing next-tram AC (nice, but later).
- Firefox port (structure MV3 to ease it; don't build it now).
- Inline AC badges injected into Maps rows.
- Map sites other than Google Maps.
- Bus/metro (trams are the AC-variance problem); the data supports them later.

## Open risks

- Google Maps DOM selectors for the boarding stop/line/destination are undocumented and
  change; mitigated by keeping scraping best-effort with a manual fallback, and isolating
  selectors in `content.ts` with the parser in testable `scrape.ts`.
- Mapping a scraped destination string to a platform via headsign may not always match
  (Maps' destination wording vs PID headsign); `resolver.ts` returns null → platform list.
- The fuzzy-search full-stop fetch size/perf (see backend note).
