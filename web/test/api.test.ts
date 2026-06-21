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
