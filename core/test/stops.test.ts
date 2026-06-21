import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeStops } from "../src/normalize.ts";

describe("normalizeStops", () => {
  it("keeps boardable platforms, reads stop_id + coords [lon,lat] + distance", () => {
    const raw = { features: [
      { properties: { stop_id: "U539Z1P", stop_name: "Národní třída", platform_code: "A", location_type: 0, distance: 4.7 },
        geometry: { coordinates: [14.4196, 50.0812] } },
    ]};
    expect(normalizeStops(raw)).toEqual([
      { id: "U539Z1P", name: "Národní třída", platformCode: "A", lat: 50.0812, lon: 14.4196, distanceM: 5 },
    ]);
  });

  it("skips non-boardable features (entrances/nodes/stations)", () => {
    const raw = { features: [
      { properties: { stop_id: "U539S1E1", stop_name: "E1", location_type: 2 }, geometry: { coordinates: [14, 50] } },
      { properties: { stop_id: "U539N1", stop_name: null, location_type: 3 }, geometry: { coordinates: [14, 50] } },
    ]};
    expect(normalizeStops(raw)).toEqual([]);
  });

  it("parses the captured real fixture", () => {
    const raw = JSON.parse(readFileSync(new URL("./fixtures/stops.json", import.meta.url), "utf8"));
    const out = normalizeStops(raw);
    expect(Array.isArray(out)).toBe(true);
    for (const s of out) {
      expect(typeof s.id).toBe("string");
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.lat).toBe("number");
      expect(typeof s.lon).toBe("number");
    }
  });
});
