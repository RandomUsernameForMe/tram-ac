const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function matchNames(names: string[], q: string, limit: number): string[] {
  const nq = norm(q);
  const out: string[] = [];
  for (const n of names) {
    if (norm(n).includes(nq)) { out.push(n); if (out.length >= limit) break; }
  }
  return out;
}

let cache: { names: string[]; at: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

export function _resetIndex(): void { cache = null; }

export async function getStopNames(fetchAll: () => Promise<string[]>): Promise<string[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.names;
  const names = await fetchAll();
  cache = { names, at: Date.now() };
  return names;
}
