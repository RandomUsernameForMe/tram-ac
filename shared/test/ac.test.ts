import { describe, it, expect } from "vitest";
import { acGlyph } from "../src/ac.ts";

describe("acGlyph", () => {
  it("maps true/false/null", () => {
    expect(acGlyph(true)).toBe("🟢");
    expect(acGlyph(false)).toBe("🔴");
    expect(acGlyph(null)).toBe("❓");
  });
});
