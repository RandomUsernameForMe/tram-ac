import type { ScrapedLeg } from "./types.ts";

export function parseLeg(input: { lineText: string; stopText: string; towardText: string }): ScrapedLeg | null {
  const lineMatch = input.lineText.match(/\d+/);
  const stopName = input.stopText.trim();
  if (!lineMatch || !stopName) return null;
  const destination = input.towardText.replace(/^\s*(toward|towards|směr|smer)\s+/i, "").trim();
  return { line: lineMatch[0], stopName, destination };
}
