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
