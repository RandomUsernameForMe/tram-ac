import { describe, it, expect, vi } from "vitest";
import { fetchDepartureboards, fetchStops, fetchStopsByName } from "../src/golemio.ts";

function fakeFetch(captured: { url?: string; headers?: any }) {
  return vi.fn(async (url: string, init: any) => {
    captured.url = url; captured.headers = init?.headers;
    return { ok: true, json: async () => ({ departures: [] }) } as any;
  });
}

describe("golemio client", () => {
  it("calls departureboards with ids and access token, no airCondition filter", async () => {
    const cap: any = {};
    await fetchDepartureboards("U539Z1P", { fetchImpl: fakeFetch(cap), key: "K" });
    expect(cap.url).toContain("/v2/pid/departureboards");
    expect(cap.url).toContain("ids=U539Z1P");
    expect(cap.url).not.toContain("airCondition");
    expect(cap.headers["x-access-token"]).toBe("K");
  });

  it("calls gtfs/stops with latlng", async () => {
    const cap: any = {};
    await fetchStops(50.09, 14.41, { fetchImpl: fakeFetch(cap), key: "K" });
    expect(cap.url).toContain("/v2/gtfs/stops");
    expect(decodeURIComponent(cap.url)).toContain("latlng=50.09,14.41");
  });

  it("throws on non-ok response", async () => {
    const bad = vi.fn(async () => ({ ok: false, status: 500 }) as any);
    await expect(fetchStops(0, 0, { fetchImpl: bad, key: "K" })).rejects.toThrow();
  });

  it("fetchStopsByName uses names[] param", async () => {
    const cap: any = {};
    await fetchStopsByName("Národní třída", { fetchImpl: fakeFetch(cap), key: "K" });
    const dec = decodeURIComponent(cap.url).replace(/\+/g, " ");
    expect(dec).toContain("/v2/gtfs/stops");
    expect(dec).toContain("names[]=Národní třída");
  });
});
