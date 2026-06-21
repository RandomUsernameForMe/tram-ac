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
