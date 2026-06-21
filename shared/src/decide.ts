import type { Departure } from "./types.ts";
import type { Decision } from "./components/DecisionBanner.tsx";

// PragAC go-now-vs-wait brain (Czech). Returns a DecisionBanner-shaped object.
export function decide(board: Departure[]): Decision | null {
  if (!board || board.length === 0) return null;
  const sorted = [...board].sort((a, b) => a.minutes - b.minutes);
  const next = sorted[0];
  const firstAC = sorted.find((d) => d.airConditioned === true);

  if (next.airConditioned === true) {
    return { tone: "cool", eyebrow: "Doporučení", title: "Jeď teď — má klimu", detail: `Linka ${next.line} přijede klimatizovaná za ${next.minutes} min.`, minutes: next.minutes, line: next.line };
  }
  if (firstAC) {
    const wait = firstAC.minutes - next.minutes;
    return { tone: "cool", eyebrow: "Doporučení", title: `Počkej ${wait} min na klimu`, detail: `Nejbližší (${next.line}) je bez klimy. Klimatizovaná ${firstAC.line} jede za ${firstAC.minutes} min.`, minutes: firstAC.minutes, line: firstAC.line };
  }
  if (next.airConditioned === false) {
    return { tone: "hot", eyebrow: "Pozor", title: "Žádná klima v dohledu", detail: "Nejbližší spoje jsou bez klimatizace. Vezmi nejbližší, nebo to riskni později.", minutes: next.minutes, line: next.line };
  }
  return { tone: "unknown", eyebrow: "Zatím nevíme", title: "Vozidlo nepřiřazeno", detail: "Pro nejbližší spoj ještě nejsou data o klimatizaci. Nehádáme.", minutes: next.minutes, line: next.line };
}
