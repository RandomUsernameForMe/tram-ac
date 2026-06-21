// Capture Google Maps transit-route DOM to derive content-script selectors.
// Usage: node extension/scripts/capture-maps.mjs
// Uses the installed Google Chrome (Playwright channel "chrome"). Set HEADLESS=0 to watch.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const MAPS_URL =
  "https://www.google.com/maps/dir/?api=1" +
  "&origin=" + encodeURIComponent("Národní třída, Praha") +
  "&destination=" + encodeURIComponent("Nádraží Hostivař, Praha") +
  "&travelmode=transit";

const headless = process.env.HEADLESS !== "0";

const browser = await chromium.launch({ channel: "chrome", headless });
const ctx = await browser.newContext({ locale: "en-US" });
// Pre-set Google consent cookie to skip the EU cookie wall when possible.
await ctx.addCookies([
  { name: "SOCS", value: "CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg", domain: ".google.com", path: "/" },
  { name: "CONSENT", value: "YES+", domain: ".google.com", path: "/" },
]);
const page = await ctx.newPage();
await page.goto(MAPS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(8000);

// Try to wait for the directions/transit panel.
try { await page.waitForSelector('[role="main"]', { timeout: 20000 }); } catch {}

const result = await page.evaluate(() => {
  const text = (el) => (el?.textContent ?? "").trim();
  // First transit option: first tram icon (alt localized e.g. "Tram"/"Tramvaj").
  const tramImg = Array.from(document.querySelectorAll("img[alt]"))
    .find((i) => /tram/i.test(i.getAttribute("alt") ?? ""));
  // Line number: nearest small integer in an ancestor container of the icon.
  let line = "";
  let cont = tramImg;
  for (let i = 0; i < 4 && cont; i++) cont = cont.parentElement;
  const lm = (cont?.textContent ?? "").match(/\b(\d{1,3})\b/);
  if (lm) line = lm[1];
  // Boarding stop: node whose text starts with "z:" (cs) or "from " (en).
  const fromEl = Array.from(document.querySelectorAll("span,div"))
    .find((n) => /^\s*(z:|from\b)/i.test(n.textContent ?? "") && (n.textContent ?? "").trim().length < 60);
  const stopName = (fromEl ? text(fromEl) : "").replace(/^\s*(z:|from)\s*/i, "").trim();
  // Destination headsign: appears only in expanded detail view; best-effort here.
  const towardEl = Array.from(document.querySelectorAll("span,div"))
    .find((n) => /(^|\s)(toward|towards|směr|smer)\s+/i.test(n.textContent ?? ""));
  const destination = (towardEl ? text(towardEl) : "").replace(/.*\b(toward|towards|směr|smer)\s+/i, "").trim();
  const panel = document.querySelector('[role="main"]');
  // Exact replica of scrape.ts parseOverview, run on live innerText for end-to-end confirmation.
  const it = (panel?.innerText ?? document.body.innerText ?? "").replace(/\s+/g, " ");
  const om = it.match(/\b(\d{1,3})\s+\d{1,2}:\d{2}\s+(?:z:|from)\s+([^\d]+?)\s+\d/i);
  const overview = om ? { line: om[1], stopName: om[2].trim().replace(/[,:]+$/, ""), destination: "" } : null;
  return {
    title: document.title,
    overview,
    computed: { line, stopName, destination },
    panelHtmlLen: (panel?.innerHTML ?? "").length,
    panelHtml: (panel?.innerHTML ?? "").slice(0, 200000),
  };
});

writeFileSync(new URL("../fixtures/maps-capture.json", import.meta.url),
  JSON.stringify({ ...result, panelHtml: undefined }, null, 2));
writeFileSync(new URL("../fixtures/maps-panel.html", import.meta.url), result.panelHtml ?? "");
console.log("title:", result.title);


console.log("panelHtmlLen:", result.panelHtmlLen);
console.log("saved fixtures/maps-capture.json + maps-panel.html");

await browser.close();
