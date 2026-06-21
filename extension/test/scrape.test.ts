import { describe, it, expect } from "vitest";
import { parseLeg } from "../src/scrape.ts";

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
