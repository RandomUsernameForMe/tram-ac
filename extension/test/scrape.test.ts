import { describe, it, expect } from "vitest";
import { parseLeg, parseOverview } from "../src/scrape.ts";

describe("parseOverview", () => {
  it("extracts line + boarding stop from real captured cs overview text", () => {
    // Captured headlessly from Google Maps (cs locale), first trip row:
    const text = "Nejbližší odjezd ne 21. 6. Možnosti 38 min 9:11—9:49 22 9:14 z: Národní divadlo 50,00 Kč 3 min Podrobnosti";
    expect(parseOverview(text)).toEqual({ line: "22", stopName: "Národní divadlo", destination: "" });
  });
  it("extracts from en 'from' variant", () => {
    const text = "38 min 9:11—9:49 9 9:14 from National Theatre 50 CZK";
    expect(parseOverview(text)).toEqual({ line: "9", stopName: "National Theatre", destination: "" });
  });
  it("returns null when no trip row present", () => {
    expect(parseOverview("Explore Prague restaurants and bars")).toBeNull();
  });
});

describe("parseLeg", () => {
  it("extracts line number, stop, destination (English 'toward')", () => {
    expect(parseLeg({ lineText: "Tram 22", stopText: "Národní třída", towardText: "toward Nádraží Hostivař" }))
      .toEqual({ line: "22", stopName: "Národní třída", destination: "Nádraží Hostivař" });
  });
  it("handles Czech 'směr' and bare line", () => {
    expect(parseLeg({ lineText: "9", stopText: "Anděl", towardText: "směr Spojovací" }))
      .toEqual({ line: "9", stopName: "Anděl", destination: "Spojovací" });
  });
  it("returns null when stop or line missing", () => {
    expect(parseLeg({ lineText: "", stopText: "Anděl", towardText: "toward X" })).toBeNull();
    expect(parseLeg({ lineText: "22", stopText: "", towardText: "toward X" })).toBeNull();
  });
  it("tolerates missing destination", () => {
    expect(parseLeg({ lineText: "Tram 3", stopText: "Brusnice", towardText: "" }))
      .toEqual({ line: "3", stopName: "Brusnice", destination: "" });
  });
});
