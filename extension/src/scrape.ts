import type { ScrapedLeg } from "./types.ts";

// Keep letters/marks/spaces and basic name punctuation; drop Material-icon glyphs
// (private-use area), bullet separators, currency, etc. Then collapse whitespace.
function clean(s: string): string {
  return s.replace(/[^\p{L}\p{M} .'-]/gu, "").replace(/\s+/g, " ").trim();
}

export function parseLeg(input: { lineText: string; stopText: string; towardText: string }): ScrapedLeg | null {
  const lineMatch = input.lineText.match(/\d+/);
  const stopName = input.stopText.trim();
  if (!lineMatch || !stopName) return null;
  const destination = input.towardText.replace(/^\s*(toward|towards|směr|smer)\s+/i, "").trim();
  return { line: lineMatch[0], stopName, destination };
}

// Parse the Google Maps transit DETAIL view (after "Details"/"Podrobnosti" is expanded).
// Richest signal — line, boarding stop, headsign, AND platform — e.g.
// "9:16 Národní třída 22Nádraží Hostivař  33 min ... Nástupiště A" (cs).
// Verified headlessly via extension/scripts/capture-detail.mjs (2026-06-21).
export function parseDetail(text: string): ScrapedLeg | null {
  const t = text.replace(/\s+/g, " ");
  const m = t.match(/(\d{1,2}:\d{2})\s+([^\d·]+?)\s+(\d{1,3})([^·\d]{1,40}?)\s+\d+\s*min/);
  if (!m) return null;
  const stopName = clean(m[2]);
  const destination = clean(m[4]);
  if (!stopName || destination.length < 2) return null;
  const pm = t.match(/(?:Nástupiště|Nástupište|Platform)\s+([A-Za-z0-9]+)/i);
  return { line: m[3], stopName, destination, platformCode: pm ? pm[1] : undefined };
}

// Parse the Google Maps transit-overview panel text for the first trip's line + boarding stop.
// Overview shows e.g. "38 min 9:11—9:49 22 9:14 z: Národní divadlo 50,00 Kč" (cs) /
// "... 22 9:14 from National Theatre ..." (en). Destination headsign isn't in the overview,
// so it is left empty; the panel falls back to the platform list for that stop+line.
export function parseOverview(text: string): ScrapedLeg | null {
  const t = text.replace(/\s+/g, " ");
  const m = t.match(/\b(\d{1,3})\s+\d{1,2}:\d{2}\s+(?:z:|from)\s+([^\d]+?)\s+\d/i);
  if (!m) return null;
  const stopName = m[2].trim().replace(/[,:]+$/, "");
  if (!stopName) return null;
  return { line: m[1], stopName, destination: "" };
}
