import { describe, it, expect, vi } from "vitest";

vi.mock("../server/src/golemio.ts", () => ({
  fetchDepartureboards: vi.fn(async () => ({ departures: [
    { route: { short_name: "9" }, trip: { headsign: "Spojovací", is_air_conditioned: true }, departure_timestamp: { minutes: 3 } },
  ]})),
  fetchStops: vi.fn(async () => ({ features: [
    { properties: { stop_id: "U539Z1P", stop_name: "Národní třída", platform_code: "A", location_type: 0, distance: 5 }, geometry: { coordinates: [14.4196, 50.0812] } },
  ]})),
}));

import departures from "../api/departures.ts";
import stops from "../api/stops.ts";
import health from "../api/health.ts";

function mockRes() {
  const r: any = { _status: 0, _json: undefined };
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (b: any) => { r._json = b; return r; };
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

  it("stops returns normalized list", async () => {
    const res = mockRes();
    await stops({ query: { lat: "50.08", lon: "14.41" } } as any, res);
    expect(res._status).toBe(200);
    expect(res._json.stops[0].id).toBe("U539Z1P");
  });

  it("stops without coords → 400", async () => {
    const res = mockRes();
    await stops({ query: {} } as any, res);
    expect(res._status).toBe(400);
  });
});
