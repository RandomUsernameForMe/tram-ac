# Tram-AC Phase 2 (Browser Extension) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Chrome MV3 side-panel extension that, beside Google Maps, shows whether the next trams for your planned leg are air-conditioned — auto-detected from the route, with a manual fuzzy stop search fallback.

**Architecture:** A new `shared/` workspace package holds the Departure/Stop types and the AC board UI, imported by both `web/` and a new `extension/`. The extension's content script scrapes the Maps route (best-effort) and a React side panel resolves stop name → platform → live AC departures via the existing Vercel API, which gains CORS plus name lookup/search endpoints. Pure logic (`scrape.ts`, `resolver.ts`, search matching) is TDD'd against fixtures; DOM selectors are captured live.

**Tech Stack:** TypeScript, React, Vite, @crxjs/vite-plugin (MV3), Vitest, pnpm workspaces, existing Fastify-free Vercel functions over Golemio.

**Depends on:** Phase 1 (deployed at https://tram-ac.vercel.app). Spec: `docs/superpowers/specs/2026-06-21-tram-ac-extension-design.md`.

**Verified data facts (2026-06-21):**
- `GET /v2/gtfs/stops?names[]=<exact>` → features incl. `location_type 0` platforms (`stop_id`, `platform_code`, coords). `normalizeStops` already filters to platforms.
- No fuzzy `search` param on Golemio (`?search=` → 400). Fuzzy autocomplete built from a cached full-stop list (`gtfs/stops?limit=10000`).
- Departures per platform via `GET /v2/pid/departureboards?ids=<stop_id>`; each has `route.short_name`, `trip.headsign`, `trip.is_air_conditioned`.

---

## File Structure

```
tram-ac/
  shared/                         # NEW workspace package (DRY UI + types)
    package.json
    tsconfig.json
    src/
      types.ts                    # Departure, Stop (single source of truth)
      ac.ts                       # acGlyph(value) -> "🟢"|"🔴"|"❓"
      DepartureRow.tsx
      Board.tsx
      index.ts                    # re-exports
    test/ac.test.ts
  web/
    src/types.ts                  # becomes re-export of shared
    src/api.ts                    # import types from shared
    src/components/*              # deleted; App imports from shared
    src/App.tsx                   # import { Board } from "shared"
  server/src/
    golemio.ts                    # + fetchStopsByName, fetchAllStops
    stopIndex.ts                  # NEW: cached name index + search matcher
    cors.ts                       # NEW: setCors(headerSink)
  api/
    stops/by-name.ts              # NEW endpoint
    stops/search.ts               # NEW endpoint
    departures.ts, stops.ts, health.ts   # + CORS
  test/
    api.test.ts                   # + by-name, search, CORS, OPTIONS
    stopIndex.test.ts             # NEW
  extension/                      # NEW
    package.json
    tsconfig.json
    manifest.json                 # MV3: sidePanel, content script, host perms
    vite.config.ts                # @crxjs/vite-plugin
    index.html ( = panel )        # panel.html
    src/
      types.ts                    # re-export shared
      api.ts                      # calls Vercel API (absolute base)
      scrape.ts                   # PURE parser: parseLeg(strings) -> ScrapedLeg|null
      content.ts                  # DOM query on Maps -> parseLeg -> respond to panel
      background.ts               # open side panel on toolbar click
      resolver.ts                 # PURE: pickPlatform(platformsWithDeps, leg) -> Stop|null
      panel.tsx                   # side panel root: search -> resolve -> Board
    test/
      scrape.test.ts
      resolver.test.ts
    fixtures/maps-leg.json        # captured Maps strings (Task 7)
```

---

## Task 1: Create `shared` package (types + AC glyph), TDD

**Files:**
- Create: `shared/package.json`, `shared/tsconfig.json`, `shared/src/types.ts`, `shared/src/ac.ts`, `shared/test/ac.test.ts`, `shared/vitest.config.ts`

- [ ] **Step 1: shared/package.json**

```json
{
  "name": "shared",
  "private": true,
  "version": "0.0.0",
  "main": "src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run" },
  "peerDependencies": { "react": "^18.3.0" },
  "devDependencies": {
    "vitest": "^2.1.0",
    "typescript": "^5.7.0",
    "@types/react": "^18.3.0",
    "react": "^18.3.0"
  }
}
```

- [ ] **Step 2: shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: shared/vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 4: types**

`shared/src/types.ts`:
```ts
export interface Departure { line: string; headsign: string; minutes: number; airConditioned: boolean | null; }
export interface Stop { id: string; name: string; platformCode?: string; lat: number; lon: number; distanceM?: number; }
```

- [ ] **Step 5: Write failing test for AC glyph**

`shared/test/ac.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { acGlyph } from "../src/ac.ts";

describe("acGlyph", () => {
  it("maps true/false/null", () => {
    expect(acGlyph(true)).toBe("🟢");
    expect(acGlyph(false)).toBe("🔴");
    expect(acGlyph(null)).toBe("❓");
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd shared && pnpm vitest run`
Expected: FAIL — `acGlyph` missing.

- [ ] **Step 7: Implement ac.ts**

`shared/src/ac.ts`:
```ts
export function acGlyph(v: boolean | null): string {
  return v === true ? "🟢" : v === false ? "🔴" : "❓";
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd shared && pnpm vitest run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add shared
git commit -m "feat(shared): types + AC glyph package"
```

---

## Task 2: Move Board/DepartureRow into `shared`

**Files:**
- Create: `shared/src/DepartureRow.tsx`, `shared/src/Board.tsx`, `shared/src/index.ts`

- [ ] **Step 1: DepartureRow**

`shared/src/DepartureRow.tsx`:
```tsx
import type { Departure } from "./types.ts";
import { acGlyph } from "./ac.ts";

export function DepartureRow({ d }: { d: Departure }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1f4f3f" }}>
      <span style={{ fontSize: 22 }}>{acGlyph(d.airConditioned)}</span>
      <strong style={{ minWidth: 32 }}>{d.line}</strong>
      <span style={{ flex: 1, opacity: 0.8 }}>{d.headsign}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{d.minutes} min</span>
    </div>
  );
}
```

- [ ] **Step 2: Board**

`shared/src/Board.tsx`:
```tsx
import type { Departure } from "./types.ts";
import { DepartureRow } from "./DepartureRow.tsx";

export function Board({ stopName, platformCode, departures }: { stopName: string; platformCode?: string; departures: Departure[] }) {
  return (
    <div>
      <h2>{stopName}{platformCode && <span style={{ opacity: 0.6, fontWeight: 400 }}> · {platformCode}</span>}</h2>
      {departures.length === 0 ? <p>No upcoming departures.</p>
        : departures.map((d, i) => <DepartureRow key={i} d={d} />)}
    </div>
  );
}
```

- [ ] **Step 3: Barrel index**

`shared/src/index.ts`:
```ts
export * from "./types.ts";
export { acGlyph } from "./ac.ts";
export { DepartureRow } from "./DepartureRow.tsx";
export { Board } from "./Board.tsx";
```

- [ ] **Step 4: Typecheck builds (no test yet)**

Run: `cd shared && pnpm vitest run`
Expected: PASS (ac test still passes; new files compiled on import are unused — no failure).

- [ ] **Step 5: Commit**

```bash
git add shared/src
git commit -m "feat(shared): Board + DepartureRow components"
```

---

## Task 3: Point `web` at `shared` (remove duplicates)

**Files:**
- Modify: `web/package.json`, `web/src/types.ts`, `web/src/App.tsx`
- Delete: `web/src/components/Board.tsx`, `web/src/components/DepartureRow.tsx`

- [ ] **Step 1: Add shared dep to web**

In `web/package.json` add to `dependencies`:
```json
    "shared": "workspace:*",
```

- [ ] **Step 2: Replace web types with re-export**

`web/src/types.ts`:
```ts
export type { Departure, Stop } from "shared";
```

- [ ] **Step 3: Delete web's local components**

```bash
rm web/src/components/Board.tsx web/src/components/DepartureRow.tsx
```
(StopList stays in `web/src/components/StopList.tsx`.)

- [ ] **Step 4: Update App imports**

In `web/src/App.tsx`, replace the Board import line:
```tsx
import { Board } from "shared";
```
(Delete the old `import { Board } from "./components/Board.tsx";`. The `StopList` import stays. `Board` now needs no `onBack` prop — keep App's own back button by wrapping. Replace the board branch:)
```tsx
      {screen.k === "board" && (
        <div>
          <button onClick={() => setScreen({ k: "stops", stops })} style={{ marginBottom: 12 }}>← stops</button>
          <Board stopName={screen.stop.name} platformCode={screen.stop.platformCode} departures={screen.departures} />
        </div>
      )}
```

- [ ] **Step 5: Install + test + build web**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm install && pnpm --filter web test && pnpm --filter web build`
Expected: install links `shared`; web's 2 api tests PASS; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add web pnpm-lock.yaml
git commit -m "refactor(web): consume shared package, drop duplicate board UI"
```

---

## Task 4: Backend CORS helper, TDD

**Files:**
- Create: `server/src/cors.ts`
- Modify: `api/health.ts`, `api/departures.ts`, `api/stops.ts`
- Modify: `test/api.test.ts`

- [ ] **Step 1: Write failing test (CORS header + OPTIONS)**

Append to `test/api.test.ts`:
```ts
import { setCors } from "../server/src/cors";

describe("cors", () => {
  it("sets permissive headers on a sink", () => {
    const headers: Record<string, string> = {};
    setCors({ setHeader: (k, v) => { headers[k] = v; } });
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
  });

  it("health responds 204 to OPTIONS preflight", () => {
    const res = mockRes();
    health({ method: "OPTIONS" } as any, res);
    expect(res._status).toBe(204);
  });
});
```
Also extend `mockRes()` in this file to support `.end()` and `.setHeader()`:
```ts
function mockRes() {
  const r: any = { _status: 0, _json: undefined, _ended: false, _headers: {} };
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (b: any) => { r._json = b; return r; };
  r.setHeader = (k: string, v: string) => { r._headers[k] = v; return r; };
  r.end = () => { r._ended = true; return r; };
  return r;
}
```
(Replace the existing `mockRes` definition with this one.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run`
Expected: FAIL — `setCors` missing and health has no OPTIONS handling.

- [ ] **Step 3: Implement cors helper**

`server/src/cors.ts`:
```ts
export interface HeaderSink { setHeader(name: string, value: string): void }

export function setCors(res: HeaderSink): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
```

- [ ] **Step 4: Apply to health.ts**

`api/health.ts`:
```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../server/src/cors";

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  res.status(200).json({ status: "ok" });
}
```

- [ ] **Step 5: Apply to departures.ts and stops.ts**

At the top of each handler body in `api/departures.ts` and `api/stops.ts`, add after the function opens:
```ts
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
```
and add the import to each:
```ts
import { setCors } from "../server/src/cors";
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run`
Expected: PASS (existing api tests + 2 new cors tests).

- [ ] **Step 7: Commit**

```bash
git add server/src/cors.ts api test/api.test.ts
git commit -m "feat(api): permissive CORS + OPTIONS preflight on all endpoints"
```

---

## Task 5: Golemio `fetchStopsByName` + `/api/stops/by-name`, TDD

**Files:**
- Modify: `server/src/golemio.ts`
- Create: `api/stops/by-name.ts`
- Modify: `server/test/golemio.test.ts`, `test/api.test.ts`

- [ ] **Step 1: Write failing client test**

Append to `server/test/golemio.test.ts`:
```ts
import { fetchStopsByName } from "../src/golemio";

it("fetchStopsByName uses names[] param", async () => {
  const cap: any = {};
  await fetchStopsByName("Národní třída", { fetchImpl: (url: any, init: any) => { cap.url = url; cap.headers = init?.headers; return Promise.resolve({ ok: true, json: async () => ({ features: [] }) } as any); }, key: "K" });
  expect(decodeURIComponent(cap.url)).toContain("/v2/gtfs/stops");
  expect(decodeURIComponent(cap.url)).toContain("names[]=Národní třída");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && pnpm vitest run test/golemio.test.ts`
Expected: FAIL — `fetchStopsByName` missing.

- [ ] **Step 3: Implement fetchStopsByName**

Append to `server/src/golemio.ts`:
```ts
export function fetchStopsByName(name: string, opts: Opts = {}): Promise<GolemioStops> {
  const u = new URL(`${config.golemioBase}/gtfs/stops`);
  u.searchParams.append("names[]", name);
  u.searchParams.set("limit", "50");
  return get<GolemioStops>(u.toString(), opts);
}
```

- [ ] **Step 4: Run client test**

Run: `cd server && pnpm vitest run test/golemio.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing endpoint test**

Append to `test/api.test.ts` (extend the existing `vi.mock("../server/src/golemio.ts", ...)` factory to also export `fetchStopsByName`):
```ts
// In the existing vi.mock factory object, add:
//   fetchStopsByName: vi.fn(async () => ({ features: [
//     { properties: { stop_id: "U539Z1P", stop_name: "Národní třída", platform_code: "A", location_type: 0, distance: 0 }, geometry: { coordinates: [14.4196, 50.0812] } },
//   ]})),
import byName from "../api/stops/by-name.ts";

describe("by-name endpoint", () => {
  it("returns platforms for a name", async () => {
    const res = mockRes();
    await byName({ query: { name: "Národní třída" } } as any, res);
    expect(res._status).toBe(200);
    expect(res._json.stops[0].id).toBe("U539Z1P");
  });
  it("400 without name", async () => {
    const res = mockRes();
    await byName({ query: {} } as any, res);
    expect(res._status).toBe(400);
  });
});
```
Update the existing `vi.mock("../server/src/golemio.ts", () => ({ ... }))` factory at the top of the file to include the `fetchStopsByName` mock shown in the comment above (add it alongside `fetchDepartureboards` and `fetchStops`).

- [ ] **Step 6: Run to verify it fails**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run`
Expected: FAIL — `api/stops/by-name.ts` missing.

- [ ] **Step 7: Implement endpoint**

`api/stops/by-name.ts`:
```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../../server/src/cors";
import { fetchStopsByName } from "../../server/src/golemio";
import { normalizeStops } from "../../server/src/normalize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const name = req.query.name;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name query param required" });
    return;
  }
  try {
    const raw = await fetchStopsByName(name);
    res.status(200).json({ stops: normalizeStops(raw) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add server/src/golemio.ts server/test/golemio.test.ts api/stops/by-name.ts test/api.test.ts
git commit -m "feat(api): /api/stops/by-name exact name lookup"
```

---

## Task 6: Stop-name index + `/api/stops/search`, TDD

**Files:**
- Modify: `server/src/golemio.ts`
- Create: `server/src/stopIndex.ts`, `test/stopIndex.test.ts`, `api/stops/search.ts`
- Modify: `test/api.test.ts`

- [ ] **Step 1: Write failing test for the matcher + cache**

`test/stopIndex.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { matchNames, getStopNames, _resetIndex } from "../server/src/stopIndex";

describe("matchNames", () => {
  it("substring match, diacritics-insensitive, capped", () => {
    const names = ["Národní třída", "Náměstí Míru", "Anděl", "Nádraží Hostivař"];
    const out = matchNames(names, "narod", 10);
    expect(out).toContain("Národní třída");
    expect(out).not.toContain("Anděl");
  });
  it("caps results", () => {
    const names = Array.from({ length: 50 }, (_, i) => `Stop ${i}`);
    expect(matchNames(names, "stop", 5)).toHaveLength(5);
  });
});

describe("getStopNames cache", () => {
  it("fetches once then serves cached", async () => {
    _resetIndex();
    const fetchAll = vi.fn(async () => ["A", "B"]);
    expect(await getStopNames(fetchAll)).toEqual(["A", "B"]);
    await getStopNames(fetchAll);
    expect(fetchAll).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run test/stopIndex.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement stopIndex.ts**

`server/src/stopIndex.ts`:
```ts
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function matchNames(names: string[], q: string, limit: number): string[] {
  const nq = norm(q);
  const out: string[] = [];
  for (const n of names) {
    if (norm(n).includes(nq)) { out.push(n); if (out.length >= limit) break; }
  }
  return out;
}

let cache: { names: string[]; at: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

export function _resetIndex(): void { cache = null; }

export async function getStopNames(fetchAll: () => Promise<string[]>): Promise<string[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.names;
  const names = await fetchAll();
  cache = { names, at: Date.now() };
  return names;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run test/stopIndex.test.ts`
Expected: PASS.

- [ ] **Step 5: Add fetchAllStopNames to golemio.ts**

Append to `server/src/golemio.ts`:
```ts
export async function fetchAllStopNames(opts: Opts = {}): Promise<string[]> {
  const u = new URL(`${config.golemioBase}/gtfs/stops`);
  u.searchParams.set("limit", "10000");
  const raw = await get<GolemioStops>(u.toString(), opts);
  const seen = new Set<string>();
  for (const f of raw.features ?? []) {
    const n = f.properties?.stop_name;
    if (f.properties?.location_type === 0 && n) seen.add(n);
  }
  return [...seen].sort();
}
```

- [ ] **Step 6: Write failing endpoint test**

Append to `test/api.test.ts`:
```ts
import search from "../api/stops/search.ts";

describe("search endpoint", () => {
  it("returns matching names", async () => {
    const res = mockRes();
    await search({ query: { q: "nar" } } as any, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._json.names)).toBe(true);
  });
  it("400 for short query", async () => {
    const res = mockRes();
    await search({ query: { q: "a" } } as any, res);
    expect(res._status).toBe(400);
  });
});
```
Extend the `vi.mock("../server/src/golemio.ts", ...)` factory to also export:
```ts
//   fetchAllStopNames: vi.fn(async () => ["Národní třída", "Náměstí Míru", "Anděl"]),
```

- [ ] **Step 7: Run to verify it fails**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run`
Expected: FAIL — `api/stops/search.ts` missing.

- [ ] **Step 8: Implement endpoint**

`api/stops/search.ts`:
```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../../server/src/cors";
import { fetchAllStopNames } from "../../server/src/golemio";
import { getStopNames, matchNames } from "../../server/src/stopIndex";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const q = req.query.q;
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    res.status(400).json({ error: "q must be at least 2 chars" });
    return;
  }
  try {
    const names = await getStopNames(() => fetchAllStopNames());
    res.status(200).json({ names: matchNames(names, q, 10) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
```

- [ ] **Step 9: Run to verify it passes**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm vitest run`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add server/src/golemio.ts server/src/stopIndex.ts test/stopIndex.test.ts api/stops/search.ts test/api.test.ts
git commit -m "feat(api): /api/stops/search fuzzy autocomplete with cached index"
```

---

## Task 7: Extension scaffold + manifest (loads unpacked)

**Files:**
- Create: `extension/package.json`, `extension/tsconfig.json`, `extension/manifest.json`, `extension/vite.config.ts`, `extension/index.html`, `extension/src/panel.tsx`, `extension/src/types.ts`

- [ ] **Step 1: package.json**

`extension/package.json`:
```json
{
  "name": "extension",
  "private": true,
  "type": "module",
  "scripts": { "build": "vite build", "dev": "vite build --watch" },
  "dependencies": { "react": "^18.3.0", "react-dom": "^18.3.0", "shared": "workspace:*" },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta.28",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0",
    "typescript": "^5.7.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/chrome": "^0.0.270"
  }
}
```

- [ ] **Step 2: tsconfig.json**

`extension/tsconfig.json`:
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
    "types": ["chrome", "node"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: manifest.json**

`extension/manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "Tram-AC",
  "version": "0.1.0",
  "description": "Is your next Prague tram air-conditioned? Shows AC beside Google Maps.",
  "permissions": ["sidePanel", "tabs"],
  "host_permissions": ["https://www.google.com/maps/*", "https://tram-ac.vercel.app/*"],
  "background": { "service_worker": "src/background.ts", "type": "module" },
  "side_panel": { "default_path": "index.html" },
  "content_scripts": [
    { "matches": ["https://www.google.com/maps/*"], "js": ["src/content.ts"], "run_at": "document_idle" }
  ],
  "action": { "default_title": "Tram-AC ❄️" }
}
```

- [ ] **Step 4: vite.config.ts**

`extension/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: { rollupOptions: { input: { panel: "index.html" } } },
});
```

- [ ] **Step 5: panel html + minimal root + types**

`extension/index.html`:
```html
<!doctype html>
<html lang="cs"><head><meta charset="UTF-8" /><title>Tram-AC</title></head>
<body><div id="root"></div><script type="module" src="/src/panel.tsx"></script></body></html>
```

`extension/src/types.ts`:
```ts
export type { Departure, Stop } from "shared";
export interface ScrapedLeg { stopName: string; line: string; destination: string; }
```

`extension/src/panel.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <main style={{ fontFamily: "system-ui", padding: 12, color: "#eaf5f0", background: "#0b3d2e", minHeight: "100vh" }}>
    <h1 style={{ fontSize: 18 }}>Tram-AC ❄️</h1>
    <p>Side panel ready.</p>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
```

- [ ] **Step 6: background.ts (open panel on icon click)**

`extension/src/background.ts`:
```ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});
```

- [ ] **Step 7: Install + build**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm install && pnpm --filter extension build`
Expected: `extension/dist/` produced with `manifest.json`, `index.html`, bundled `content`/`background`.

- [ ] **Step 8: Manual load**

In Chrome → `chrome://extensions` → enable Developer mode → Load unpacked → select `extension/dist`. Click the toolbar icon: the side panel opens showing "Side panel ready." Expected: panel renders.

- [ ] **Step 9: Commit**

```bash
git add extension pnpm-lock.yaml
git commit -m "feat(extension): MV3 scaffold with side panel"
```

---

## Task 8: `scrape.ts` pure parser, TDD

**Files:**
- Create: `extension/src/scrape.ts`, `extension/test/scrape.test.ts`, `extension/vitest.config.ts`

- [ ] **Step 1: vitest config**

`extension/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 2: Write failing test**

`extension/test/scrape.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseLeg } from "../src/scrape.ts";

describe("parseLeg", () => {
  it("extracts line number, stop, destination (English 'toward')", () => {
    expect(parseLeg({ lineText: "Tram 22", stopText: "Národní třída", towardText: "toward Nádraží Hostivař" }))
      .toEqual({ line: "22", stopName: "Národní třída", destination: "Nádraží Hostivař" });
  });
  it("handles Czech 'směr' and bare line", () => {
    expect(parseLeg({ lineText: "9", stopText: "Anděl", towardText: "směr Spojovací" }))
      .toEqual({ line: "9", stopName: "Anděl", destination: "Spojovací" });
  });
  it("returns null when stop or line missing", () => {
    expect(parseLeg({ lineText: "", stopText: "Anděl", towardText: "toward X" })).toBeNull();
    expect(parseLeg({ lineText: "22", stopText: "", towardText: "toward X" })).toBeNull();
  });
  it("tolerates missing destination", () => {
    expect(parseLeg({ lineText: "Tram 3", stopText: "Brusnice", towardText: "" }))
      .toEqual({ line: "3", stopName: "Brusnice", destination: "" });
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd extension && pnpm vitest run`
Expected: FAIL — `parseLeg` missing.

- [ ] **Step 4: Implement scrape.ts**

`extension/src/scrape.ts`:
```ts
import type { ScrapedLeg } from "./types.ts";

export function parseLeg(input: { lineText: string; stopText: string; towardText: string }): ScrapedLeg | null {
  const lineMatch = input.lineText.match(/\d+/);
  const stopName = input.stopText.trim();
  if (!lineMatch || !stopName) return null;
  const destination = input.towardText.replace(/^\s*(toward|towards|směr|smer)\s+/i, "").trim();
  return { line: lineMatch[0], stopName, destination };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd extension && pnpm vitest run`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add extension/src/scrape.ts extension/test/scrape.test.ts extension/vitest.config.ts
git commit -m "feat(extension): pure parseLeg scraper parser"
```

---

## Task 9: `content.ts` — capture Maps DOM + wire selectors

This is the one environment-derived task (like Phase 1's Golemio probe): the Google Maps DOM is undocumented, so selectors are confirmed live and a fixture captured.

**Files:**
- Create: `extension/src/content.ts`, `extension/fixtures/maps-leg.json`

- [ ] **Step 1: Capture a real Maps transit route's leg strings**

In Chrome, open a Prague transit route in Google Maps (e.g. directions from "Národní třída" to "Nádraží Hostivař" by transit). Open DevTools console on the Maps tab and run, adjusting until it returns the boarding stop, line, and "toward" text for the first tram step:
```js
// Explore: find the transit step nodes. Try these, note which yields the data:
document.querySelectorAll('[class*="directions-mode"], [aria-label*="Tram"], [aria-label*="Tramvaj"]');
```
Record the three strings you can read for the first tram leg into `extension/fixtures/maps-leg.json`:
```json
{ "lineText": "Tram 22", "stopText": "Národní třída", "towardText": "toward Nádraží Hostivař" }
```
And note the exact selectors/attributes that produced each (used in Step 2).

- [ ] **Step 2: Implement content.ts using the confirmed selectors**

`extension/src/content.ts` (replace the selector bodies with what Step 1 confirmed; the structure below is the contract — it reads three strings, parses, and answers the panel):
```ts
import { parseLeg } from "./scrape.ts";
import type { ScrapedLeg } from "./types.ts";

function readLeg(): ScrapedLeg | null {
  // Selectors confirmed via Task 9 Step 1 capture. Fallbacks scan for "toward"/"směr".
  const lineEl = document.querySelector('[aria-label*="Tram"], [aria-label*="Tramvaj"]');
  const lineText = lineEl?.getAttribute("aria-label") ?? lineEl?.textContent ?? "";
  const towardEl = Array.from(document.querySelectorAll("span, div"))
    .find((n) => /(^|\s)(toward|towards|směr|smer)\s+/i.test(n.textContent ?? ""));
  const towardText = towardEl?.textContent ?? "";
  // Boarding stop: first stop name in the transit step. Confirmed selector from capture:
  const stopEl = document.querySelector('[class*="transit-stop"], [data-stop-name]');
  const stopText = stopEl?.getAttribute("data-stop-name") ?? stopEl?.textContent ?? "";
  return parseLeg({ lineText, stopText, towardText });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "getRoute") {
    try { sendResponse({ leg: readLeg() }); } catch { sendResponse({ leg: null }); }
  }
  return true;
});
```

- [ ] **Step 3: Build**

Run: `cd extension && pnpm build`
Expected: build succeeds, `content` bundled.

- [ ] **Step 4: Commit**

```bash
git add extension/src/content.ts extension/fixtures/maps-leg.json
git commit -m "feat(extension): Maps content script reading boarding leg"
```

---

## Task 10: `resolver.ts` pure platform picker, TDD

**Files:**
- Create: `extension/src/resolver.ts`, `extension/test/resolver.test.ts`

- [ ] **Step 1: Write failing test**

`extension/test/resolver.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { pickPlatform } from "../src/resolver.ts";
import type { Stop, Departure } from "../src/types.ts";

const stopA: Stop = { id: "U539Z1P", name: "Národní třída", platformCode: "A", lat: 0, lon: 0 };
const stopB: Stop = { id: "U539Z2P", name: "Národní třída", platformCode: "B", lat: 0, lon: 0 };
const depA: Departure[] = [{ line: "22", headsign: "Nádraží Hostivař", minutes: 3, airConditioned: true }];
const depB: Departure[] = [{ line: "22", headsign: "Bílá Hora", minutes: 4, airConditioned: false }];

describe("pickPlatform", () => {
  it("picks the platform whose departure heads toward the destination", () => {
    const out = pickPlatform([{ stop: stopA, departures: depA }, { stop: stopB, departures: depB }],
      { line: "22", destination: "Nádraží Hostivař" });
    expect(out?.id).toBe("U539Z1P");
  });
  it("returns null when no platform matches", () => {
    const out = pickPlatform([{ stop: stopA, departures: depA }],
      { line: "22", destination: "Nowhere" });
    expect(out).toBeNull();
  });
  it("returns null when destination is empty (ambiguous)", () => {
    const out = pickPlatform([{ stop: stopA, departures: depA }], { line: "22", destination: "" });
    expect(out).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd extension && pnpm vitest run test/resolver.test.ts`
Expected: FAIL — `pickPlatform` missing.

- [ ] **Step 3: Implement resolver.ts**

`extension/src/resolver.ts`:
```ts
import type { Stop, Departure } from "./types.ts";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function pickPlatform(
  platforms: { stop: Stop; departures: Departure[] }[],
  leg: { line: string; destination: string },
): Stop | null {
  const dest = norm(leg.destination);
  if (!dest) return null;
  for (const p of platforms) {
    const hit = p.departures.some((d) => d.line === leg.line && norm(d.headsign).includes(dest));
    if (hit) return p.stop;
  }
  return null;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd extension && pnpm vitest run test/resolver.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extension/src/resolver.ts extension/test/resolver.test.ts
git commit -m "feat(extension): pure pickPlatform resolver"
```

---

## Task 11: `api.ts` + panel wiring (search → resolve → board)

**Files:**
- Create: `extension/src/api.ts`
- Modify: `extension/src/panel.tsx`

- [ ] **Step 1: api client**

`extension/src/api.ts`:
```ts
import type { Departure, Stop } from "./types.ts";

const BASE = "https://tram-ac.vercel.app";

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const searchStops = (q: string) =>
  jget<{ names: string[] }>(`/api/stops/search?q=${encodeURIComponent(q)}`).then((d) => d.names);
export const stopsByName = (name: string) =>
  jget<{ stops: Stop[] }>(`/api/stops/by-name?name=${encodeURIComponent(name)}`).then((d) => d.stops);
export const departures = (stopId: string) =>
  jget<{ departures: Departure[] }>(`/api/departures?stop=${encodeURIComponent(stopId)}`).then((d) => d.departures);
```

- [ ] **Step 2: panel wiring**

`extension/src/panel.tsx`:
```tsx
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Board } from "shared";
import type { Stop, Departure } from "./types.ts";
import type { ScrapedLeg } from "./types.ts";
import { searchStops, stopsByName, departures } from "./api.ts";
import { pickPlatform } from "./resolver.ts";

async function resolveLeg(leg: ScrapedLeg): Promise<{ stop: Stop; deps: Departure[] } | null> {
  const platforms = await stopsByName(leg.stopName);
  const withDeps = await Promise.all(platforms.map(async (stop) => ({ stop, departures: await departures(stop.id) })));
  const chosen = pickPlatform(withDeps, leg);
  const hit = chosen ? withDeps.find((w) => w.stop.id === chosen.id)! : null;
  return hit ? { stop: hit.stop, deps: hit.departures } : null;
}

function App() {
  const [board, setBoard] = useState<{ stop: Stop; deps: Departure[] } | null>(null);
  const [q, setQ] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [note, setNote] = useState("Searching the route…");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) { setNote("Search a stop below."); return; }
      chrome.tabs.sendMessage(tab.id, { type: "getRoute" }, async (resp) => {
        const leg: ScrapedLeg | null = chrome.runtime.lastError ? null : resp?.leg ?? null;
        if (!leg) { setNote("No tram leg detected — search a stop below."); return; }
        try {
          const r = await resolveLeg(leg);
          if (r) { setBoard(r); setNote(""); }
          else { setNote(`Couldn't pinpoint the platform for line ${leg.line} → ${leg.destination}. Search below.`); setQ(leg.stopName); }
        } catch { setNote("Lookup failed — search a stop below."); }
      });
    });
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setNames([]); return; }
    let active = true;
    searchStops(q).then((n) => active && setNames(n)).catch(() => {});
    return () => { active = false; };
  }, [q]);

  async function choose(name: string) {
    setNames([]); setQ(name);
    const platforms = await stopsByName(name);
    const withDeps = await Promise.all(platforms.map(async (stop) => ({ stop, deps: await departures(stop.id) })));
    if (withDeps[0]) { setBoard(withDeps[0]); setNote(withDeps.length > 1 ? "Multiple platforms — showing one; pick another below." : ""); }
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 12, color: "#eaf5f0", background: "#0b3d2e", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 18 }}>Tram-AC ❄️</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a stop…"
        style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />
      {names.map((n) => (
        <button key={n} onClick={() => choose(n)} style={{ display: "block", width: "100%", textAlign: "left", padding: 6, background: "none", color: "inherit", border: "none", borderBottom: "1px solid #1f4f3f" }}>{n}</button>
      ))}
      {note && <p style={{ opacity: 0.8 }}>{note}</p>}
      {board && <Board stopName={board.stop.name} platformCode={board.stop.platformCode} departures={board.deps} />}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
```

- [ ] **Step 3: Build**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm --filter extension build`
Expected: build succeeds.

- [ ] **Step 4: Run extension unit tests**

Run: `cd extension && pnpm vitest run`
Expected: PASS (scrape + resolver tests).

- [ ] **Step 5: Commit**

```bash
git add extension/src/api.ts extension/src/panel.tsx
git commit -m "feat(extension): panel wiring — search, resolve, AC board"
```

---

## Task 12: Deploy backend, manual smoke, docs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Full test suite**

Run: `cd "/Users/tomasjarkovsky/Documents/Claude Projects/tram-ac" && pnpm test`
Expected: all packages PASS (shared, web, server, root api, extension).

- [ ] **Step 2: Deploy the new endpoints**

Run: `git push origin main` (Vercel auto-deploys), then verify:
```bash
sleep 30
curl -s "https://tram-ac.vercel.app/api/stops/by-name?name=N%C3%A1rodn%C3%AD%20t%C5%99%C3%ADda" | head -c 200
curl -s "https://tram-ac.vercel.app/api/stops/search?q=nar" | head -c 200
curl -s -i -X OPTIONS "https://tram-ac.vercel.app/api/departures" | grep -i access-control
```
Expected: by-name returns platforms; search returns names; OPTIONS shows `Access-Control-Allow-Origin: *`.

- [ ] **Step 3: Manual extension smoke**

Rebuild (`pnpm --filter extension build`), reload unpacked in Chrome. Open a Prague transit route in Google Maps, click the Tram-AC icon. Expected: side panel auto-detects the leg and shows AC departures, OR shows a graceful "search a stop" message. Type a stop name → autocomplete → board with 🟢/🔴/❓.

- [ ] **Step 4: README**

Add to `README.md` under a new "## Extension (Phase 2)" section:
```markdown
## Extension (Phase 2)
Chrome MV3 side panel showing tram AC beside Google Maps.
- Build: `pnpm --filter extension build` → load `extension/dist` unpacked at chrome://extensions.
- Uses the deployed API (`/api/stops/search`, `/api/stops/by-name`, `/api/departures`) with CORS.
- Content script scrapes the active Maps route (best-effort); manual stop search is the fallback.
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: extension build + usage"
git push origin main
```

---

## Self-Review (completed)

- **Spec coverage:** side panel (Tasks 7,9,11) ✓; content-script scrape isolated from pure parser (Tasks 8,9) ✓; auto-pick by destination headsign (Task 10) ✓; manual fuzzy search spine (Tasks 6,11) ✓; reused Board UI via `shared` (Tasks 1–3) ✓; CORS (Task 4) ✓; `/by-name` + `/search` endpoints (Tasks 5,6) ✓; AC null → ❓ (Task 1 `acGlyph`) ✓; testing against fixtures + pure units (Tasks 8,10) ✓; non-goals (badge/Firefox/inline) untouched ✓.
- **Environment-derived risk:** Maps selectors live in Task 9 only, captured before coding (mirrors Phase 1's probe); the rest is deterministic.
- **Placeholder scan:** no TBD/TODO; every code step has full code. Task 9's selectors are explicitly captured-then-filled, not hand-waved.
- **Type consistency:** `Departure`/`Stop` single source in `shared`; `ScrapedLeg {stopName,line,destination}`, `parseLeg`, `pickPlatform`, `setCors`, `fetchStopsByName`, `fetchAllStopNames`, `getStopNames`, `matchNames`, `searchStops`, `stopsByName`, `departures` used consistently across tasks.
- **Deferred:** in-panel auto-refresh interval (Phase 1 PWA had ~20s; here the panel fetches on open/selection — add an interval in a follow-up if needed; not blocking the core decision).
```
