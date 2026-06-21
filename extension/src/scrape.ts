import type { ScrapedLeg } from "./types.ts";

export function parseLeg(input: { lineText: string; stopText: string; towardText: string }): ScrapedLeg | null {
  const lineMatch = input.lineText.match(/\d+/);
  const stopName = input.stopText.trim();
  if (!lineMatch || !stopName) return null;
  const destination = input.towardText.replace(/^\s*(toward|towards|směr|smer)\s+/i, "").trim();
  return { line: lineMatch[0], stopName, destination };
}

// Parse the Google Maps transit-overview panel text for the first trip's line + boarding stop.
// Overview shows e.g. "38 min 9:11—9:49 22 9:14 z: Národní divadlo 50,00 Kč" (cs) /
// "... 22 9:14 from National Theatre ..." (en). Destination headsign isn't in the overview,
// so it is left empty; the panel falls back to the platform list for that stop+line.
export function parseOverview(text: string): ScrapedLeg | null {
  const t = text.replace(/ /g, " ").replace(/\s+/g, " ");
  const m = t.match(/\b(\d{1,3})\s+\d{1,2}:\d{2}\s+(?:z:|from)\s+([^\d]+?)\s+\d/i);
  if (!m) return null;
  const stopName = m[2].trim().replace(/[,:]+$/, "");
  if (!stopName) return null;
  return { line: m[1], stopName, destination: "" };
}
