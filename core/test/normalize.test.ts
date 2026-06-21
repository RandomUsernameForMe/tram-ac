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
