import { parseOverview, parseLeg } from "./scrape.ts";
import type { ScrapedLeg } from "./types.ts";

// Google Maps transit DOM is obfuscated and localized, so we parse the directions
// panel's visible TEXT rather than brittle class selectors. parseOverview pulls the
// first trip's line + boarding stop from the overview ("… 22 9:14 z: Národní divadlo …").
// Verified headlessly via extension/scripts/capture-maps.mjs (cs locale, 2026-06-21).
function readLeg(): ScrapedLeg | null {
  const panel = document.querySelector('[role="main"]') as HTMLElement | null;
  const text = panel?.innerText ?? document.body.innerText ?? "";
  const overview = parseOverview(text);
  if (overview) return overview;

  // Fallback: detail view sometimes exposes a tram badge + "toward/směr" headsign.
  const lineEl = document.querySelector('img[alt*="Tram" i], [aria-label*="Tram" i]');
  const lineText = lineEl?.getAttribute("aria-label") ?? lineEl?.getAttribute("alt") ?? lineEl?.textContent ?? "";
  const towardEl = Array.from(document.querySelectorAll("span,div"))
    .find((n) => /(^|\s)(toward|towards|směr|smer)\s+/i.test(n.textContent ?? ""));
  const towardText = towardEl?.textContent ?? "";
  return parseLeg({ lineText, stopText: "", towardText });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "getRoute") {
    try { sendResponse({ leg: readLeg() }); } catch { sendResponse({ leg: null }); }
  }
  return true;
});
