import { describe, it, expect, vi } from "vitest";
import { matchNames, getStopNames, _resetIndex } from "../core/src/stopIndex";

describe("matchNames", () => {
  it("substring match, diacritics-insensitive, capped", () => {
    const names = ["Národní třída", "Náměstí Míru", "Anděl", "Nádraží Hostivař"];
    const out = matchNames(names, "narod", 10);
    expect(out).toContain("Národní třída");
    expect(out).not.toContain("Anděl");
  });
  it("caps results", () => {
    const names = Array.from({ length: 50 }, (_, i) => `Stop ${i}`);
    expect(matchNames(names, "stop", 5)).toHaveLength(5);
  });
});

describe("getStopNames cache", () => {
  it("fetches once then serves cached", async () => {
    _resetIndex();
    const fetchAll = vi.fn(async () => ["A", "B"]);
    expect(await getStopNames(fetchAll)).toEqual(["A", "B"]);
    await getStopNames(fetchAll);
    expect(fetchAll).toHaveBeenCalledTimes(1);
  });
});
