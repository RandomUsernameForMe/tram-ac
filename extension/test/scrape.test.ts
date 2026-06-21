import { describe, it, expect } from "vitest";
import { parseLeg, parseOverview, parseDetail } from "../src/scrape.ts";

describe("parseDetail", () => {
  it("extracts line, stop, headsign, platform from real captured detail text", () => {
    // Captured headlessly from the expanded Maps detail view (cs locale):
    const text = "9:13 - 9:49 (36 min) 22 9:16 z: Národní třída 50,00 Kč 3 min 9:13 Národní 110 00 Praha 1 Pěšky Přibližně 3 min, 240 m 9:16 Národní třída 22Nádraží Hostivař 33 min (zastávky: 24) · Nástupiště A · 9:49 Nádraží Hostivař";
    expect(parseDetail(text)).toEqual({ line: "22", stopName: "Národní třída", destination: "Nádraží Hostivař", platformCode: "A" });
  });
  it("returns null on overview-only text (no expanded step)", () => {
    expect(parseDetail("38 min 9:11—9:49 22 9:14 z: Národní divadlo 50,00 Kč 3 min Podrobnosti")).toBeNull();
  });
});

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
