export function acGlyph(v: boolean | null): string {
  return v === true ? "🟢" : v === false ? "🔴" : "❓";
}
