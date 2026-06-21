import { describe, it, expect, vi } from "vitest";

vi.mock("../core/src/golemio.ts", () => ({
  // U539Z1P serves a tram; U900Z1P (bus-only) returns no tram departures.
  fetchDepartureboards: vi.fn(async (id: string) => ({ departures: id === "U539Z1P" ? [
    { route: { short_name: "9", type: 0 }, trip: { headsign: "Spojovací", is_air_conditioned: true }, departure_timestamp: { minutes: 3 } },
  ] : [
    { route: { short_name: "177", type: 3 }, trip: { headsign: "Bus" }, departure_timestamp: { minutes: 2 } },
  ]})),
  fetchStops: vi.fn(async () => ({ features: [
    { properties: { stop_id: "U539Z1P", stop_name: "Národní třída", platform_code: "A", location_type: 0, distance: 5 }, geometry: { coordinates: [14.4196, 50.0812] } },
    { properties: { stop_id: "U539Z1Pdup", stop_name: "Národní třída", platform_code: "A", location_type: 0, distance: 6 }, geometry: { coordinates: [14.4196, 50.0812] } },
    { properties: { stop_id: "U900Z1P", stop_name: "Laurová", platform_code: "A", location_type: 0, distance: 30 }, geometry: { coordinates: [14.40, 50.07] } },
  ]})),
  fetchStopsByName: vi.fn(async () => ({ features: [
    { properties: { stop_id: "U539Z1P", stop_name: "Národní třída", platform_code: "A", location_type: 0, distance: 0 }, geometry: { coordinates: [14.4196, 50.0812] } },
  ]})),
  fetchAllStopNames: vi.fn(async () => ["Národní třída", "Náměstí Míru", "Anděl"]),
}));

import departures from "../api/departures.ts";
import stops from "../api/stops.ts";
import health from "../api/health.ts";
import byName from "../api/stops/by-name.ts";
import search from "../api/stops/search.ts";
import { setCors } from "../core/src/cors";
import { _resetIndex } from "../core/src/stopIndex";

function mockRes() {
  const r: any = { _status: 0, _json: undefined, _ended: false, _headers: {} };
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (b: any) => { r._json = b; return r; };
  r.setHeader = (k: string, v: string) => { r._headers[k] = v; return r; };
  r.end = () => { r._ended = true; return r; };
  return r;
}

describe("api handlers", () => {
  it("health → ok", () => {
    const res = mockRes();
    health({} as any, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ status: "ok" });
  });

  it("departures returns normalized list", async () => {
    const res = mockRes();
    await departures({ query: { stop: "U539Z1P" } } as any, res);
    expect(res._status).toBe(200);
    expect(res._json.departures[0]).toEqual({ line: "9", headsign: "Spojovací", minutes: 3, airConditioned: true });
  });

  it("departures without stop → 400", async () => {
    const res = mockRes();
    await departures({ query: {} } as any, res);
    expect(res._status).toBe(400);
  });

  it("stops returns only tram-serving stops, deduped", async () => {
    const res = mockRes();
    await stops({ query: { lat: "50.08", lon: "14.41" } } as any, res);
    expect(res._status).toBe(200);
    // dup platform collapsed, bus-only Laurová dropped → only the tram stop remains
    expect(res._json.stops.map((s: any) => s.id)).toEqual(["U539Z1P"]);
  });

  it("stops without coords → 400", async () => {
    const res = mockRes();
    await stops({ query: {} } as any, res);
    expect(res._status).toBe(400);
  });
});

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

describe("search endpoint", () => {
  it("returns matching names", async () => {
    _resetIndex();
    const res = mockRes();
    await search({ query: { q: "nar" } } as any, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._json.names)).toBe(true);
    expect(res._json.names).toContain("Národní třída");
  });
  it("400 for short query", async () => {
    const res = mockRes();
    await search({ query: { q: "a" } } as any, res);
    expect(res._status).toBe(400);
  });
});
