import type { CSSProperties } from "react";

export function StopRow({ name, platformCode, distanceM, onClick, style = {} }: {
  name: string; platformCode?: string; distanceM?: number; onClick?: () => void; style?: CSSProperties;
}) {
  return (
    <button onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cool-50)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-card)")}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "var(--surface-card)", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "16px", minHeight: "var(--target-min)", cursor: "pointer", fontFamily: "var(--font-ui)", transition: "background var(--dur-fast) var(--ease-out)", ...style }}>
      <span style={{ display: "flex", flex: "none", width: 36, height: 36, borderRadius: "var(--radius-pill)", background: "var(--surface-sunken)", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cool-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 17, fontWeight: 600, color: "var(--text-strong)" }}>
          {name}{platformCode && <span style={{ color: "var(--text-faint)", fontWeight: 500 }}> · {platformCode}</span>}
        </span>
      </span>
      {distanceM != null && <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-muted)" }}>{distanceM} m</span>}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M9 18l6-6-6-6" /></svg>
    </button>
  );
}
