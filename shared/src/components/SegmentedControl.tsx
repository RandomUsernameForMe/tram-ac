import type { CSSProperties } from "react";

export function SegmentedControl({ options, value, onChange, style = {} }: {
  options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; style?: CSSProperties;
}) {
  return (
    <div role="tablist" style={{ display: "inline-flex", background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", padding: 4, gap: 2, ...style }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button key={opt.value} role="tab" aria-selected={active} onClick={() => onChange(opt.value)}
            style={{ border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 14, padding: "8px 16px", borderRadius: "var(--radius-pill)", background: active ? "var(--surface-card)" : "transparent", color: active ? "var(--accent-press)" : "var(--text-muted)", boxShadow: active ? "var(--shadow-sm)" : "none", transition: "all var(--dur-base) var(--ease-out)", whiteSpace: "nowrap" }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
