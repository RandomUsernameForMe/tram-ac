# Tram-AC Phase 1 (Backend + PWA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the at-the-stop experience end to end: a Fastify backend that serves normalized Prague tram departures with per-vehicle air-conditioning, and an installable Vite+React PWA that geolocates the nearest stops and shows next departures as 🟢/🔴/❓.

**Architecture:** Thin Fastify backend holds the Golemio API key, calls Golemio's `departureboards` and `gtfs/stops` endpoints, and normalizes responses into a stable JSON shape (`Departure`, `Stop`). A Vite+React PWA consumes that JSON only — it never touches Golemio directly. Tests run against captured real fixtures so they are deterministic and offline.

**Tech Stack:** Node 20+, Fastify, TypeScript, Vitest (both packages), Vite + React, `vite-plugin-pwa`, pnpm workspaces, Railway for hosting.

**Scope note:** The browser extension (Phase 2) and its stop-name→stop-ID matching spike are a SEPARATE plan. Do not build the extension here.

**Data facts (verified 2026-06-21, from official `prazska-integrovana-doprava/led-board` source):**
- Departures: `GET https://api.golemio.cz/v2/pid/departureboards`, header `x-access-token: <key>`.
- Response: `{ departures: [ { route: { short_name }, trip: { headsign, is_air_conditioned, is_wheelchair_accessible }, departure_timestamp: { minutes } } ] }`.
- AC flag = `trip.is_air_conditioned` (boolean, may be missing/null). DO NOT pass `airCondition=true` — that filters to AC-only; we need every departure carrying its own flag.
- Stop selector for departureboards = `aswIds` query param (e.g. `539_1`), or `ids` for GTFS stop ids.
- `gtfs/stops` endpoint exact shape is confirmed live in Task 2 (probe) before adapter code is written.

---

## File Structure

```
tram-ac/
  pnpm-workspace.yaml          # packages: server, web
  package.json                 # root scripts
  server/
    package.json
    tsconfig.json
    vitest.config.ts
    .env.example               # GOLEMIO_KEY=
    test/fixtures/             # captured real Golemio JSON (from Task 2)
      departureboards.json
      stops.json
    src/
      config.ts                # env loading, base URL, key
      golemio.ts               # HTTP client: addsx-access-token, raw calls
      normalize.ts             # raw Golemio -> Departure[] / Stop[]  (pure, core logic)
      types.ts                 # Departure, Stop, GolemioRaw types
      routes.ts                # GET /health, /departures, /stops
      app.ts                   # buildApp(): Fastify instance (exported for tests)
      index.ts                 # start app on PORT
  web/
    package.json
    tsconfig.json
    vite.config.ts             # + vite-plugin-pwa
    index.html
    vitest.config.ts
    src/
      types.ts                 # Departure, Stop (client copy)
      api.ts                   # fetch wrappers to backend
      geo.ts                   # haversine sort helper (pure)
      main.tsx
      App.tsx                  # screen state: locating -> stops -> board
      components/
        StopList.tsx
        Board.tsx
        DepartureRow.tsx       # 🟢/🔴/❓ + line + headsign + minutes
    test/
      geo.test.ts
      api.test.ts
```

Responsibility split: `normalize.ts` is pure transform logic (unit-tested hardest). `golemio.ts` is the only place that knows Golemio's URL/header. `routes.ts` wires HTTP. The web side keeps pure logic (`geo.ts`, `api.ts`) testable away from React.

---

## Task 1: Workspace scaffold

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `server/package.json`, `server/tsconfig.json`, `web/package.json`, `web/tsconfig.json`

- [ ] **Step 1: Create workspace file**

`pnpm-workspace.yaml`:
```yaml
packages:
  - server
  - web
```

- [ ] **Step 2: Create root package.json**

`package.json`:
```json
{
  "name": "tram-ac",
  "private": true,
  "scripts": {
    "dev:server": "pnpm --filter server dev",
    "dev:web": "pnpm --filter web dev",
    "test": "pnpm -r test"
  }
}
```

- [ ] **Step 3: Create server package.json**

`server/package.json`:
```json
{
  "name": "server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch --experimental-strip-types src/index.ts",
    "start": "node --experimental-strip-types src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "fastify": "^5.2.0",
    "@fastify/cors": "^10.0.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 4: Create server tsconfig.json**

`server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "types": ["node"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 5: Create web package.json**

`web/package.json`:
```json
{
  "name": "web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^2.1.0",
    "typescript": "^5.7.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

- [ ] **Step 6: Create web tsconfig.json**

`web/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 7: Install**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm install`
Expected: lockfile created, both packages linked, no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold pnpm workspace with server and web packages"
```

---

## Task 2: Live Golemio probe → capture fixtures

Purpose: confirm the `gtfs/stops` response shape and freeze real JSON for deterministic tests. This is the one task that hits the live API.

**Files:**
- Create: `server/.env.example`, `server/test/fixtures/departureboards.json`, `server/test/fixtures/stops.json`

**Prerequisite:** a Golemio API key. If absent, get one free at https://api.golemio.cz/api-keys (register, verify email, generate key). Export it: `export GOLEMIO_KEY=<key>`.

- [ ] **Step 1: Create env example**

`server/.env.example`:
```
GOLEMIO_KEY=your_golemio_api_key_here
PORT=3000
```

- [ ] **Step 2: Capture a departureboards sample (stop 539_1 = a Prague tram stop)**

Run:
```bash
curl -s -H "x-access-token: $GOLEMIO_KEY" \
  "https://api.golemio.cz/v2/pid/departureboards?aswIds=539_1&minutesAfter=99&limit=8&order=real&mode=departures&preferredTimezone=Europe/Prague" \
  -o "server/test/fixtures/departureboards.json"
cat server/test/fixtures/departureboards.json | head -c 600
```
Expected: JSON containing a `departures` array; each item has `route.short_name`, `trip.headsign`, `trip.is_air_conditioned`, `departure_timestamp.minutes`. CONFIRM these paths exist; if a field name differs, record the real name and update `normalize.ts` paths in Task 4 accordingly.

- [ ] **Step 3: Capture a nearby-stops sample (coords near Malostranská, Prague)**

Run:
```bash
curl -s -H "x-access-token: $GOLEMIO_KEY" \
  "https://api.golemio.cz/v2/gtfs/stops?lat=50.0900&lng=14.4128&range=700&limit=20" \
  -o "server/test/fixtures/stops.json"
cat server/test/fixtures/stops.json | head -c 800
```
Expected: a GeoJSON-style result (likely `{ "features": [ { "properties": { ... }, "geometry": { "coordinates": [lon, lat] } } ] }`). RECORD the exact property names that give: stop display name, the ASW node id, and the ASW stop id (the `aswIds` value for departureboards is `"<asw_node_id>_<asw_stop_id>"`). These recorded names drive Task 5. If `range`/`lat`/`lng` are rejected, try `latlng=50.0900,14.4128` and `limit`; record what works.

- [ ] **Step 4: Commit fixtures**

```bash
git add server/.env.example server/test/fixtures
git commit -m "test: capture real Golemio departureboards and stops fixtures"
```

---

## Task 3: Shared types

**Files:**
- Create: `server/src/types.ts`

- [ ] **Step 1: Write the types**

`server/src/types.ts`:
```ts
// Normalized shapes returned by our backend (client-facing).
export interface Departure {
  line: string;                  // route.short_name
  headsign: string;              // trip.headsign
  minutes: number;               // departure_timestamp.minutes
  airConditioned: boolean | null; // trip.is_air_conditioned, null when unknown
}

export interface Stop {
  aswId: string;   // value for departureboards `aswIds`, e.g. "539_1"
  name: string;
  lat: number;
  lon: number;
  distanceM?: number;
}

// Minimal raw shapes we read from Golemio departureboards.
export interface GolemioRawDeparture {
  route?: { short_name?: string };
  trip?: { headsign?: string; is_air_conditioned?: boolean | null };
  departure_timestamp?: { minutes?: number | string };
}
export interface GolemioDepartureboards {
  departures?: GolemioRawDeparture[];
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/types.ts
git commit -m "feat: add normalized Departure/Stop types"
```

---

## Task 4: Normalize departures (core logic, TDD)

**Files:**
- Create: `server/src/normalize.ts`, `server/test/normalize.test.ts`, `server/vitest.config.ts`

- [ ] **Step 1: Add vitest config**

`server/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 2: Write the failing test**

`server/test/normalize.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeDepartures } from "../src/normalize.ts";

describe("normalizeDepartures", () => {
  it("maps fields and preserves AC flag", () => {
    const raw = {
      departures: [
        { route: { short_name: "9" }, trip: { headsign: "Spojovací", is_air_conditioned: true }, departure_timestamp: { minutes: 3 } },
        { route: { short_name: "22" }, trip: { headsign: "Bílá Hora", is_air_conditioned: false }, departure_timestamp: { minutes: 7 } },
      ],
    };
    const out = normalizeDepartures(raw);
    expect(out).toEqual([
      { line: "9", headsign: "Spojovací", minutes: 3, airConditioned: true },
      { line: "22", headsign: "Bílá Hora", minutes: 7, airConditioned: false },
    ]);
  });

  it("uses null when AC flag is missing", () => {
    const out = normalizeDepartures({ departures: [
      { route: { short_name: "5" }, trip: { headsign: "X" }, departure_timestamp: { minutes: 1 } },
    ]});
    expect(out[0].airConditioned).toBeNull();
  });

  it("coerces string minutes to number and sorts ascending", () => {
    const out = normalizeDepartures({ departures: [
      { route: { short_name: "5" }, trip: { headsign: "X" }, departure_timestamp: { minutes: "10" } },
      { route: { short_name: "5" }, trip: { headsign: "X" }, departure_timestamp: { minutes: "2" } },
    ]});
    expect(out.map(d => d.minutes)).toEqual([2, 10]);
  });

  it("handles missing departures array", () => {
    expect(normalizeDepartures({})).toEqual([]);
  });

  it("parses the captured real fixture without throwing", () => {
    const raw = JSON.parse(readFileSync(new URL("./fixtures/departureboards.json", import.meta.url), "utf8"));
    const out = normalizeDepartures(raw);
    expect(Array.isArray(out)).toBe(true);
    for (const d of out) {
      expect(typeof d.line).toBe("string");
      expect(typeof d.minutes).toBe("number");
      expect([true, false, null]).toContain(d.airConditioned);
    }
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd server && pnpm vitest run test/normalize.test.ts`
Expected: FAIL — `normalizeDepartures` not exported / module missing.

- [ ] **Step 4: Implement**

`server/src/normalize.ts`:
```ts
import type { Departure, GolemioDepartureboards } from "./types.ts";

export function normalizeDepartures(raw: GolemioDepartureboards): Departure[] {
  const list = raw?.departures ?? [];
  return list
    .map((d): Departure => {
      const acRaw = d.trip?.is_air_conditioned;
      return {
        line: String(d.route?.short_name ?? ""),
        headsign: String(d.trip?.headsign ?? ""),
        minutes: Number(d.departure_timestamp?.minutes ?? 0),
        airConditioned: acRaw === true ? true : acRaw === false ? false : null,
      };
    })
    .sort((a, b) => a.minutes - b.minutes);
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd server && pnpm vitest run test/normalize.test.ts`
Expected: PASS (5 tests). If the fixture test fails on a field path, fix the path here using the real names recorded in Task 2.

- [ ] **Step 6: Commit**

```bash
git add server/src/normalize.ts server/test/normalize.test.ts server/vitest.config.ts
git commit -m "feat: normalize Golemio departures with AC flag"
```

---

## Task 5: Normalize stops (TDD, against recorded shape)

**Files:**
- Modify: `server/src/normalize.ts`, `server/src/types.ts`
- Create: `server/test/stops.test.ts`

> Use the EXACT property names you recorded in Task 2, Step 3. The code below assumes the common Golemio GeoJSON shape (`features[].properties.stop_name`, `.asw_node_id`, `.asw_stop_id`, `geometry.coordinates = [lon, lat]`). If your fixture differs, substitute the real names in both the type and the function.

- [ ] **Step 1: Add raw stops types to `server/src/types.ts`**

Append:
```ts
export interface GolemioStopFeature {
  properties?: { stop_name?: string; asw_node_id?: number | string; asw_stop_id?: number | string };
  geometry?: { coordinates?: [number, number] }; // [lon, lat]
}
export interface GolemioStops { features?: GolemioStopFeature[] }
```

- [ ] **Step 2: Write the failing test**

`server/test/stops.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeStops } from "../src/normalize.ts";

describe("normalizeStops", () => {
  it("builds aswId from node and stop ids and reads coords [lon,lat]", () => {
    const raw = { features: [
      { properties: { stop_name: "Malostranská", asw_node_id: 539, asw_stop_id: 1 },
        geometry: { coordinates: [14.4128, 50.09] } },
    ]};
    expect(normalizeStops(raw)).toEqual([
      { aswId: "539_1", name: "Malostranská", lat: 50.09, lon: 14.4128 },
    ]);
  });

  it("skips features missing ASW ids", () => {
    const raw = { features: [ { properties: { stop_name: "X" }, geometry: { coordinates: [14, 50] } } ] };
    expect(normalizeStops(raw)).toEqual([]);
  });

  it("parses the captured real fixture", () => {
    const raw = JSON.parse(readFileSync(new URL("./fixtures/stops.json", import.meta.url), "utf8"));
    const out = normalizeStops(raw);
    expect(Array.isArray(out)).toBe(true);
    for (const s of out) {
      expect(s.aswId).toMatch(/^\d+_\d+$/);
      expect(typeof s.lat).toBe("number");
      expect(typeof s.lon).toBe("number");
    }
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd server && pnpm vitest run test/stops.test.ts`
Expected: FAIL — `normalizeStops` not exported.

- [ ] **Step 4: Implement (append to `server/src/normalize.ts`)**

```ts
import type { Stop, GolemioStops } from "./types.ts";

export function normalizeStops(raw: GolemioStops): Stop[] {
  const features = raw?.features ?? [];
  const out: Stop[] = [];
  for (const f of features) {
    const node = f.properties?.asw_node_id;
    const stop = f.properties?.asw_stop_id;
    const coords = f.geometry?.coordinates;
    if (node == null || stop == null || !coords) continue;
    out.push({
      aswId: `${node}_${stop}`,
      name: String(f.properties?.stop_name ?? ""),
      lat: coords[1],
      lon: coords[0],
    });
  }
  return out;
}
```
(Add the `Stop, GolemioStops` names to the existing import line from `./types.ts`.)

- [ ] **Step 5: Run to verify it passes**

Run: `cd server && pnpm vitest run test/stops.test.ts`
Expected: PASS. If the real fixture test fails, correct the property names to match what you recorded in Task 2.

- [ ] **Step 6: Commit**

```bash
git add server/src/normalize.ts server/src/types.ts server/test/stops.test.ts
git commit -m "feat: normalize Golemio stops into aswId + coords"
```

---

## Task 6: Golemio HTTP client

**Files:**
- Create: `server/src/config.ts`, `server/src/golemio.ts`, `server/test/golemio.test.ts`

- [ ] **Step 1: Write config**

`server/src/config.ts`:
```ts
export const config = {
  golemioKey: process.env.GOLEMIO_KEY ?? "",
  golemioBase: "https://api.golemio.cz/v2",
  port: Number(process.env.PORT ?? 3000),
};
```

- [ ] **Step 2: Write the failing test (injectable fetch)**

`server/test/golemio.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { fetchDepartureboards, fetchStops } from "../src/golemio.ts";

function fakeFetch(captured: { url?: string; headers?: any }) {
  return vi.fn(async (url: string, init: any) => {
    captured.url = url; captured.headers = init?.headers;
    return { ok: true, json: async () => ({ departures: [] }) } as any;
  });
}

describe("golemio client", () => {
  it("calls departureboards with aswIds and access token, no airCondition filter", async () => {
    const cap: any = {};
    await fetchDepartureboards("539_1", { fetchImpl: fakeFetch(cap), key: "K" });
    expect(cap.url).toContain("/v2/pid/departureboards");
    expect(cap.url).toContain("aswIds=539_1");
    expect(cap.url).not.toContain("airCondition");
    expect(cap.headers["x-access-token"]).toBe("K");
  });

  it("calls gtfs/stops with coordinates", async () => {
    const cap: any = {};
    await fetchStops(50.09, 14.41, { fetchImpl: fakeFetch(cap), key: "K" });
    expect(cap.url).toContain("/v2/gtfs/stops");
    expect(cap.url).toContain("lat=50.09");
    expect(cap.url).toContain("lng=14.41");
  });

  it("throws on non-ok response", async () => {
    const bad = vi.fn(async () => ({ ok: false, status: 500 }) as any);
    await expect(fetchStops(0, 0, { fetchImpl: bad, key: "K" })).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd server && pnpm vitest run test/golemio.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

`server/src/golemio.ts`:
```ts
import { config } from "./config.ts";
import type { GolemioDepartureboards, GolemioStops } from "./types.ts";

interface Opts { fetchImpl?: typeof fetch; key?: string }

async function get<T>(url: string, opts: Opts): Promise<T> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url, { headers: { "x-access-token": opts.key ?? config.golemioKey } });
  if (!res.ok) throw new Error(`Golemio ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

export function fetchDepartureboards(aswId: string, opts: Opts = {}): Promise<GolemioDepartureboards> {
  const u = new URL(`${config.golemioBase}/pid/departureboards`);
  u.searchParams.set("aswIds", aswId);
  u.searchParams.set("minutesAfter", "99");
  u.searchParams.set("limit", "8");
  u.searchParams.set("order", "real");
  u.searchParams.set("mode", "departures");
  u.searchParams.set("preferredTimezone", "Europe/Prague");
  return get<GolemioDepartureboards>(u.toString(), opts);
}

export function fetchStops(lat: number, lng: number, opts: Opts = {}): Promise<GolemioStops> {
  const u = new URL(`${config.golemioBase}/gtfs/stops`);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lng", String(lng));
  u.searchParams.set("range", "700");
  u.searchParams.set("limit", "20");
  return get<GolemioStops>(u.toString(), opts);
}
```
(If Task 2 showed `gtfs/stops` wants `latlng=lat,lng` instead of `lat`/`lng`, set that param here and update the test accordingly.)

- [ ] **Step 5: Run to verify it passes**

Run: `cd server && pnpm vitest run test/golemio.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/config.ts server/src/golemio.ts server/test/golemio.test.ts
git commit -m "feat: add Golemio HTTP client for departures and stops"
```

---

## Task 7: HTTP routes (TDD via app.inject)

**Files:**
- Create: `server/src/app.ts`, `server/src/routes.ts`, `server/src/index.ts`, `server/test/routes.test.ts`

- [ ] **Step 1: Write the failing test**

`server/test/routes.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { buildApp } from "../src/app.ts";

vi.mock("../src/golemio.ts", () => ({
  fetchDepartureboards: vi.fn(async () => ({ departures: [
    { route: { short_name: "9" }, trip: { headsign: "Spojovací", is_air_conditioned: true }, departure_timestamp: { minutes: 3 } },
  ]})),
  fetchStops: vi.fn(async () => ({ features: [
    { properties: { stop_name: "Malostranská", asw_node_id: 539, asw_stop_id: 1 }, geometry: { coordinates: [14.41, 50.09] } },
  ]})),
}));

describe("routes", () => {
  it("GET /health returns ok", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("GET /departures?stop= returns normalized departures", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/departures?stop=539_1" });
    expect(res.statusCode).toBe(200);
    expect(res.json().departures[0]).toEqual({ line: "9", headsign: "Spojovací", minutes: 3, airConditioned: true });
  });

  it("GET /departures without stop returns 400", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/departures" });
    expect(res.statusCode).toBe(400);
  });

  it("GET /stops?lat=&lon= returns normalized stops", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/stops?lat=50.09&lon=14.41" });
    expect(res.statusCode).toBe(200);
    expect(res.json().stops[0].aswId).toBe("539_1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && pnpm vitest run test/routes.test.ts`
Expected: FAIL — `buildApp` missing.

- [ ] **Step 3: Implement routes**

`server/src/routes.ts`:
```ts
import type { FastifyInstance } from "fastify";
import { fetchDepartureboards, fetchStops } from "./golemio.ts";
import { normalizeDepartures, normalizeStops } from "./normalize.ts";

export async function routes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/departures", async (req, reply) => {
    const stop = (req.query as any)?.stop;
    if (!stop || typeof stop !== "string") {
      return reply.code(400).send({ error: "stop query param required" });
    }
    const raw = await fetchDepartureboards(stop);
    return { departures: normalizeDepartures(raw) };
  });

  app.get("/stops", async (req, reply) => {
    const q = req.query as any;
    const lat = Number(q?.lat), lon = Number(q?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return reply.code(400).send({ error: "lat and lon query params required" });
    }
    const raw = await fetchStops(lat, lon);
    return { stops: normalizeStops(raw) };
  });
}
```

- [ ] **Step 4: Implement app builder**

`server/src/app.ts`:
```ts
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { routes } from "./routes.ts";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });
  app.register(routes);
  return app;
}
```

- [ ] **Step 5: Implement entrypoint**

`server/src/index.ts`:
```ts
import { buildApp } from "./app.ts";
import { config } from "./config.ts";

const app = buildApp();
app.listen({ port: config.port, host: "0.0.0.0" })
  .then(() => console.log(`tram-ac server on :${config.port}`))
  .catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd server && pnpm vitest run test/routes.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Smoke-test live (requires GOLEMIO_KEY)**

Run:
```bash
cd server && GOLEMIO_KEY=$GOLEMIO_KEY node --experimental-strip-types src/index.ts &
sleep 2
curl -s "http://localhost:3000/departures?stop=539_1" | head -c 400
curl -s "http://localhost:3000/stops?lat=50.09&lon=14.4128" | head -c 400
kill %1
```
Expected: JSON with `departures` (each having `airConditioned`) and `stops` (each with `aswId`).

- [ ] **Step 8: Commit**

```bash
git add server/src/app.ts server/src/routes.ts server/src/index.ts server/test/routes.test.ts
git commit -m "feat: add /health, /departures, /stops routes"
```

---

## Task 8: Web — pure helpers (geo sort + api), TDD

**Files:**
- Create: `web/src/types.ts`, `web/src/geo.ts`, `web/src/api.ts`, `web/vitest.config.ts`, `web/test/geo.test.ts`, `web/test/api.test.ts`

- [ ] **Step 1: Web types**

`web/src/types.ts`:
```ts
export interface Departure { line: string; headsign: string; minutes: number; airConditioned: boolean | null; }
export interface Stop { aswId: string; name: string; lat: number; lon: number; distanceM?: number; }
```

- [ ] **Step 2: vitest config (node env for pure helpers)**

`web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 3: Failing test for geo sort**

`web/test/geo.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { withDistanceSorted } from "../src/geo.ts";
import type { Stop } from "../src/types.ts";

const stops: Stop[] = [
  { aswId: "1_1", name: "Far", lat: 50.10, lon: 14.50 },
  { aswId: "2_1", name: "Near", lat: 50.0901, lon: 14.4129 },
];

describe("withDistanceSorted", () => {
  it("annotates distanceM and sorts nearest first", () => {
    const out = withDistanceSorted(stops, 50.09, 14.4128);
    expect(out[0].name).toBe("Near");
    expect(out[0].distanceM!).toBeLessThan(out[1].distanceM!);
    expect(out[0].distanceM!).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `cd web && pnpm vitest run test/geo.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 5: Implement geo**

`web/src/geo.ts`:
```ts
import type { Stop } from "./types.ts";

function haversineM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function withDistanceSorted(stops: Stop[], lat: number, lon: number): Stop[] {
  return stops
    .map((s) => ({ ...s, distanceM: Math.round(haversineM(lat, lon, s.lat, s.lon)) }))
    .sort((a, b) => a.distanceM! - b.distanceM!);
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd web && pnpm vitest run test/geo.test.ts`
Expected: PASS.

- [ ] **Step 7: Failing test for api client**

`web/test/api.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { getStops, getDepartures } from "../src/api.ts";

describe("api", () => {
  it("getDepartures requests backend and returns list", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ departures: [
      { line: "9", headsign: "X", minutes: 3, airConditioned: true },
    ]})}) as any);
    const out = await getDepartures("539_1", { base: "http://api", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith("http://api/departures?stop=539_1");
    expect(out[0].line).toBe("9");
  });

  it("getStops passes coordinates", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ stops: [] }) }) as any);
    await getStops(50.09, 14.41, { base: "http://api", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith("http://api/stops?lat=50.09&lon=14.41");
  });
});
```

- [ ] **Step 8: Run to verify it fails**

Run: `cd web && pnpm vitest run test/api.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 9: Implement api**

`web/src/api.ts`:
```ts
import type { Departure, Stop } from "./types.ts";

interface Opts { base?: string; fetchImpl?: typeof fetch }
const BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:3000";

async function jget<T>(url: string, opts: Opts): Promise<T> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getDepartures(aswId: string, opts: Opts = {}): Promise<Departure[]> {
  const base = opts.base ?? BASE;
  const data = await jget<{ departures: Departure[] }>(`${base}/departures?stop=${encodeURIComponent(aswId)}`, opts);
  return data.departures;
}

export async function getStops(lat: number, lon: number, opts: Opts = {}): Promise<Stop[]> {
  const base = opts.base ?? BASE;
  const data = await jget<{ stops: Stop[] }>(`${base}/stops?lat=${lat}&lon=${lon}`, opts);
  return data.stops;
}
```

- [ ] **Step 10: Run to verify it passes**

Run: `cd web && pnpm vitest run test/api.test.ts`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add web/src/types.ts web/src/geo.ts web/src/api.ts web/vitest.config.ts web/test
git commit -m "feat: web geo sort and api client with tests"
```

---

## Task 9: Web — UI (Vite + React + PWA)

**Files:**
- Create: `web/index.html`, `web/vite.config.ts`, `web/src/main.tsx`, `web/src/App.tsx`, `web/src/components/StopList.tsx`, `web/src/components/Board.tsx`, `web/src/components/DepartureRow.tsx`

- [ ] **Step 1: index.html**

`web/index.html`:
```html
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0b3d2e" />
    <title>Tram-AC — má tramvaj klimu?</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: vite.config.ts with PWA**

`web/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tram-AC",
        short_name: "Tram-AC",
        description: "Is the next Prague tram air-conditioned?",
        theme_color: "#0b3d2e",
        background_color: "#0b3d2e",
        display: "standalone",
        icons: [],
      },
    }),
  ],
});
```

- [ ] **Step 3: DepartureRow component**

`web/src/components/DepartureRow.tsx`:
```tsx
import type { Departure } from "../types.ts";

const ac = (v: boolean | null) => (v === true ? "🟢" : v === false ? "🔴" : "❓");

export function DepartureRow({ d }: { d: Departure }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1f4f3f" }}>
      <span style={{ fontSize: 22 }}>{ac(d.airConditioned)}</span>
      <strong style={{ minWidth: 32 }}>{d.line}</strong>
      <span style={{ flex: 1, opacity: 0.8 }}>{d.headsign}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{d.minutes} min</span>
    </div>
  );
}
```

- [ ] **Step 4: Board component**

`web/src/components/Board.tsx`:
```tsx
import type { Departure } from "../types.ts";
import { DepartureRow } from "./DepartureRow.tsx";

export function Board({ stopName, departures, onBack }: { stopName: string; departures: Departure[]; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: 12 }}>← stops</button>
      <h2>{stopName}</h2>
      {departures.length === 0 ? <p>No upcoming departures.</p>
        : departures.map((d, i) => <DepartureRow key={i} d={d} />)}
    </div>
  );
}
```

- [ ] **Step 5: StopList component**

`web/src/components/StopList.tsx`:
```tsx
import type { Stop } from "../types.ts";

export function StopList({ stops, onPick }: { stops: Stop[]; onPick: (s: Stop) => void }) {
  return (
    <div>
      <h2>Nearby stops</h2>
      {stops.map((s) => (
        <button key={s.aswId} onClick={() => onPick(s)}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 0", background: "none", color: "inherit", border: "none", borderBottom: "1px solid #1f4f3f" }}>
          {s.name} {s.distanceM != null && <span style={{ opacity: 0.6 }}>· {s.distanceM} m</span>}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: App with screen state machine**

`web/src/App.tsx`:
```tsx
import { useEffect, useState } from "react";
import type { Stop, Departure } from "./types.ts";
import { getStops, getDepartures } from "./api.ts";
import { withDistanceSorted } from "./geo.ts";
import { StopList } from "./components/StopList.tsx";
import { Board } from "./components/Board.tsx";

type Screen =
  | { k: "locating" }
  | { k: "stops"; stops: Stop[] }
  | { k: "board"; stop: Stop; departures: Departure[] }
  | { k: "error"; msg: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ k: "locating" });

  useEffect(() => {
    if (!navigator.geolocation) { setScreen({ k: "error", msg: "Geolocation unavailable" }); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const raw = await getStops(pos.coords.latitude, pos.coords.longitude);
          setScreen({ k: "stops", stops: withDistanceSorted(raw, pos.coords.latitude, pos.coords.longitude) });
        } catch (e) { setScreen({ k: "error", msg: String(e) }); }
      },
      () => setScreen({ k: "error", msg: "Location permission denied" }),
    );
  }, []);

  async function pick(stop: Stop) {
    try {
      const departures = await getDepartures(stop.aswId);
      setScreen({ k: "board", stop, departures });
    } catch (e) { setScreen({ k: "error", msg: String(e) }); }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif", color: "#eaf5f0", background: "#0b3d2e", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20 }}>Tram-AC ❄️</h1>
      {screen.k === "locating" && <p>Finding nearby stops…</p>}
      {screen.k === "error" && <p style={{ color: "#ff9b9b" }}>{screen.msg}</p>}
      {screen.k === "stops" && <StopList stops={screen.stops} onPick={pick} />}
      {screen.k === "board" && <Board stopName={screen.stop.name} departures={screen.departures} onBack={() => setScreen({ k: "stops", stops: [screen.stop] })} />}
    </main>
  );
}
```
(Note: the back action keeps it simple by returning to a one-item list; acceptable for v1. A later task can cache the full stop list in state.)

- [ ] **Step 7: main.tsx**

`web/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
```

- [ ] **Step 8: Build check**

Run: `cd web && pnpm build`
Expected: Vite build succeeds, `dist/` produced, PWA service worker generated, no TS errors.

- [ ] **Step 9: Manual run check (two terminals)**

Run backend: `cd server && GOLEMIO_KEY=$GOLEMIO_KEY pnpm dev`
Run web: `cd web && pnpm dev`
Open the printed localhost URL, allow location. Expected: nearby stops list; tapping one shows departures with 🟢/🔴/❓. (If testing outside Prague, location won't return Prague stops — temporarily hardcode `getStops(50.09, 14.4128)` in `App.tsx` to verify, then revert.)

- [ ] **Step 10: Commit**

```bash
git add web/index.html web/vite.config.ts web/src
git commit -m "feat: PWA UI — nearby stops and AC departure board"
```

---

## Task 10: README + deploy notes

**Files:**
- Create: `README.md`, `server/Procfile` (or Railway note)

- [ ] **Step 1: Write README**

`README.md`:
```markdown
# Tram-AC

Is your next Prague tram air-conditioned? PWA + thin backend over Golemio open data.

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
```

- [ ] **Step 2: Full test run**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm -r test`
Expected: all server + web tests PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with dev, test, deploy notes"
```

---

## Self-Review (completed)

- **Spec coverage:** backend proxy holding key (Tasks 6–7) ✓; `/departures` with AC flag (Tasks 4,7) ✓; nearby-stops geolocation (Tasks 5,8,9) ✓; 🟢/🔴/❓ incl. null=unknown (Tasks 4,9) ✓; PWA install (Task 9) ✓; Vite not Next (Task 1,9) ✓; Railway (Task 10) ✓; caching — NOTE: deferred (see below). Extension + live-window banner = Phase 2 plan, intentionally out of scope.
- **Deferred from spec:** response caching is NOT implemented in this plan. Rationale: correctness first; Golemio's 10k-row limit and low personal traffic make it non-blocking for MVP. Add as first task of a hardening pass if rate limits bite.
- **Placeholder scan:** no TBD/TODO; every code step has full code. The only runtime-confirmed values (gtfs/stops field names + lat/lng vs latlng) are explicitly resolved in Task 2 and referenced where used.
- **Type consistency:** `Departure`/`Stop` identical across server and web; `aswId`, `airConditioned`, `distanceM`, `withDistanceSorted`, `getStops`, `getDepartures`, `fetchDepartureboards`, `fetchStops`, `normalizeDepartures`, `normalizeStops`, `buildApp` used consistently throughout.
```
