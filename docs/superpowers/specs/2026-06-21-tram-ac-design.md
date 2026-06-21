# Tram-AC — Design Spec

**Date:** 2026-06-21
**Status:** Design approved, plan not yet written
**Working title:** Tram-AC (Prague "is my tram air-conditioned?" helper)

## Problem

Prague summers hit dangerous heat. Only part of the tram fleet is air-conditioned.
Riding a non-AC tram in extreme heat is a comfort and a health risk. Riders have no
easy way to know whether an incoming or planned tram has AC.

## Core user scenario (the one we optimize for)

> "I'm in an air-conditioned place (cafe, coworking, home). I want to travel to another
> AC place. Should I head into the heat NOW for the next tram, or wait ~5 minutes for the
> following one that has AC — trading 5 min of waiting for avoiding 20 min of suffering?"

This is a **go-now-vs-wait** decision at, or just before, the stop. It lives entirely
inside the **live dispatch window** (vehicles get assigned ~15–30 min before they reach a
stop), which is exactly when per-vehicle AC data exists. That makes it the solvable,
reliable core — not the speculative "color my whole future trip" case.

Two physical contexts for the same decision:
1. **Phone, at/near the stop** — standing outside, deciding which tram to board.
2. **Laptop, at a cafe, planning in Google Maps** — about to leave, checking before
   stepping into the heat.

## Key facts (verified 2026-06-21)

- Prague open-transport data is served by **Golemio** (api.golemio.cz), the city data
  platform behind PID. ([docs](https://api.golemio.cz/pid/docs/openapi/),
  [opendata](https://pid.cz/en/opendata/))
- The **PID Departure Boards** endpoint (Golemio v2) returns upcoming departures per stop
  and **includes air-conditioning info per departure** — the same data the official
  digital stop-boards use to show an AC symbol. No need to deduce AC from vehicle series
  numbers.
- A **free API key** is required (register at api.golemio.cz/api-keys, JWT/api-key auth).
  The key must stay server-side — it cannot ship inside a public web client or extension.
- A **GTFS stops** endpoint exists for resolving stops, including geographic lookup
  (find stops near lat/lon) for the phone scenario.

## Non-goals (YAGNI)

- Not building a map/journey-planning app. We augment the moment of decision, not routing.
- Not coloring whole future itineraries. Vehicle assignment far ahead doesn't exist, so
  that would be a guess. Out of scope for v1.
- No accounts, no login, no persistence of user history in v1.
- No deducing AC from series numbers — Golemio gives the flag directly. (Series→type table
  kept only as a possible future fallback for null values; not in v1.)

## Architecture — one brain, two faces

```
            Golemio API  (PID Departure Boards, GTFS stops)
                  ▲   (API key, server-side only)
                  │
            Thin backend (Node + Fastify + TypeScript)
              - holds API key
              - caches responses (protect rate limits, faster)
              - normalizes AC into a stable shape
                  ▲
                  │  simple JSON over HTTPS
        ┌─────────┴───────────┐
        │                     │
   PWA (Vite+React)      Browser extension panel
   phone, at the stop    laptop, Google Maps (desktop)
```

**Why a backend exists:** the API key cannot be exposed in a public client. The backend is
also the single home for caching and AC-normalization logic, and it decouples the clients
from Golemio so the data source can change without touching either client.

### Backend

Node + Fastify + TypeScript. Effectively one real endpoint, both clients consume the same
shape:

- `GET /departures?stop=<id|query>&line=<optional>`
  → `{ stop: {...}, departures: [ { line, minutes, air_conditioned: true | false | null } ] }`
- `GET /stops?lat=<>&lon=<>` (phone geolocation → nearby stops) — thin proxy over GTFS stops.

Concerns:
- **Caching:** short TTL (a few seconds) per stop to avoid hammering Golemio while
  refreshing often enough to stay live.
- **AC normalization:** map Golemio's field(s) to a strict `true | false | null`. `null` =
  genuinely unknown vehicle; never coerce to a green light.
- **CORS:** allow the PWA origin and the extension.

### Client 1 — PWA (phone, at the stop) — built first

Vite + React, installable PWA (`vite-plugin-pwa` for offline shell + add-to-home-screen).

Flow: geolocate → `GET /stops` → list nearby stops → tap stop → live board showing next
departures with **🟢 AC / 🔴 no-AC / ❓ unknown** and minutes-to-arrival. Auto-refresh.
Manual stop search as fallback when geolocation denied/unavailable.

Why Vite (not Next.js): purely client-side, no SSR/SEO need, separate Fastify backend makes
Next's API routes redundant, smallest bundle and simplest model for a ~2-screen tool.

### Client 2 — Browser extension (laptop, Google Maps) — built second

Chrome/Firefox extension. **Light panel approach** (chosen over inline DOM badges):
- Read only the **boarding stop name + line** of the active Maps transit route (minimal,
  durable DOM read — not per-row injection into Google's obfuscated, churning markup).
- A button opens a side panel that calls the same `/departures` and shows live AC for the
  imminent departures of that stop+line.
- **Honesty banner:** if the planned departure is outside the live dispatch window, show a
  line-level note ("no per-vehicle data yet for departures this far ahead"), never a fake
  green light.

## AC determination + edge cases

- Primary source: Golemio per-departure air-conditioning flag. No series-number deduction.
- `null` / unknown vehicle → show ❓ and say so; do not guess.
- Departure outside live dispatch window → no per-vehicle data → line-level note only.
- **Stop-name → Golemio stop-ID matching** (extension reads a display name from Maps; we
  need the canonical stop ID) is **fuzzy and a real risk**. Flagged for an early spike
  before committing to the extension build.

## Tech stack

- Backend: Node + Fastify + TypeScript.
- PWA: Vite + React + `vite-plugin-pwa`.
- Extension: vanilla TypeScript + minimal bundler, same backend.
- Hosting: Railway.

## Phasing

1. **Backend + PWA** — full at-the-stop scenario, end to end. The clean, reliable win.
2. **Extension** — reuses the backend; new work is limited to the Maps DOM read and the
   stop-name → stop-ID matching spike.

## Open risks to resolve during planning

- Exact Golemio field name(s) and value semantics for air conditioning, and how often
  `null` appears in practice.
- Golemio rate limits on the free key → sets cache TTL.
- Stop-name matching reliability for the extension (spike before building Client 2).
- Geolocation accuracy near clustered stops on the phone (may need a manual disambiguation
  list).
