import { describe, it, expect, vi } from "vitest";
import { buildApp } from "../src/app.ts";

vi.mock("../src/golemio.ts", () => ({
  fetchDepartureboards: vi.fn(async () => ({ departures: [
    { route: { short_name: "9" }, trip: { headsign: "Spojovací", is_air_conditioned: true }, departure_timestamp: { minutes: 3 } },
  ]})),
  fetchStops: vi.fn(async () => ({ features: [
    { properties: { stop_id: "U539Z1P", stop_name: "Národní třída", platform_code: "A", location_type: 0, distance: 5 }, geometry: { coordinates: [14.4196, 50.0812] } },
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
    expect(res.json().stops[0].id).toBe("U539Z1P");
  });
});
