// Capture Google Maps transit DETAIL view (after clicking "Details"/"Podrobnosti")
// to find the destination headsign ("Směr X" / "toward X"). See capture-maps.mjs for the overview.
// Usage: node extension/scripts/capture-detail.mjs   (HEADLESS=0 to watch)
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
await ctx.addCookies([
  { name: "SOCS", value: "CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg", domain: ".google.com", path: "/" },
  { name: "CONSENT", value: "YES+", domain: ".google.com", path: "/" },
]);
const page = await ctx.newPage();
await page.goto(MAPS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(8000);

// Click the first "Details"/"Podrobnosti" control to expand step-by-step view.
let clicked = false;
for (const label of ["Podrobnosti", "Details"]) {
  const el = page.getByText(label, { exact: false }).first();
  try { await el.click({ timeout: 4000 }); clicked = true; break; } catch {}
}
await page.waitForTimeout(4000);

const result = await page.evaluate(() => {
  const panel = document.querySelector('[role="main"]');
  const innerText = (panel?.innerText ?? document.body.innerText ?? "").replace(/\s+/g, " ");
  // Find headsign candidates in the expanded view.
  const headsigns = Array.from(document.querySelectorAll("span,div"))
    .map((n) => (n.textContent ?? "").trim())
    .filter((t) => /(^|\s)(toward|towards|směr|smer)\s+\S/i.test(t) && t.length < 80)
    .slice(0, 6);
  return { innerText: innerText.slice(0, 4000), headsigns };
});

writeFileSync(new URL("../fixtures/maps-detail.json", import.meta.url), JSON.stringify(result, null, 2));
console.log("clicked details:", clicked);
console.log("headsign candidates:", JSON.stringify(result.headsigns, null, 2));
console.log("text sample:", result.innerText.slice(0, 700));
await browser.close();
