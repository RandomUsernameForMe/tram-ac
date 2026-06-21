import { parseLeg } from "./scrape.ts";
import type { ScrapedLeg } from "./types.ts";

// NOTE: Google Maps DOM is undocumented and changes. Selectors below are best-effort
// with text-scan fallbacks; confirm/refine against a live capture (plan Task 9 Step 1).
function readLeg(): ScrapedLeg | null {
  const lineEl = document.querySelector('[aria-label*="Tram"], [aria-label*="Tramvaj"]');
  const lineText = lineEl?.getAttribute("aria-label") ?? lineEl?.textContent ?? "";

  const towardEl = Array.from(document.querySelectorAll("span, div"))
    .find((n) => /(^|\s)(toward|towards|směr|smer)\s+/i.test(n.textContent ?? ""));
  const towardText = towardEl?.textContent ?? "";

  const stopEl = document.querySelector('[data-stop-name], [class*="transit-stop"]');
  const stopText = stopEl?.getAttribute("data-stop-name") ?? stopEl?.textContent ?? "";

  return parseLeg({ lineText, stopText, towardText });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "getRoute") {
    try { sendResponse({ leg: readLeg() }); } catch { sendResponse({ leg: null }); }
  }
  return true;
});
