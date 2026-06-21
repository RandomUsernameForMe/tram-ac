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
