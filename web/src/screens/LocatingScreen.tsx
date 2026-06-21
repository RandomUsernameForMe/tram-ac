const MARK = "/assets/pragac-mark.svg";
const STRIPES = "/assets/warming-stripes.svg";

export function LocatingScreen() {
  return (
    <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, color: "#fff", padding: 32, textAlign: "center", background: "radial-gradient(120% 90% at 0% 50%, rgba(245,56,10,0.34) 0%, transparent 42%), radial-gradient(120% 90% at 100% 50%, rgba(13,131,245,0.40) 0%, transparent 42%), var(--ink-900)", overflow: "hidden", minHeight: "100vh" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "var(--thermal-strip-h)", background: "var(--thermal-strip)", zIndex: 3 }} />
      <svg viewBox="0 0 24 24" fill="#ff7a36" style={{ position: "absolute", left: -10, top: "50%", width: 220, height: 220, transform: "translateY(-50%)", opacity: 0.22, animation: "pragFlicker 2.2s var(--ease-in-out) infinite" }}><path d="M13 1.6c.8 3.4-1.5 4.8-1.5 7.1 0 1.1.8 1.9 1.7 1.9 1 0 1.6-.7 1.7-1.8 1.8 1.5 3.1 3.7 3.1 6.2a6 6 0 0 1-12 0c0-2.4 1.2-4.3 2.4-5.9.2 1.1 1 1.8 1.9 1.8-1.4-2.7-.6-6 2.8-9.3Z" /></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="#7fe7ff" strokeWidth="1.3" strokeLinecap="round" style={{ position: "absolute", right: -8, top: "50%", width: 220, height: 220, transform: "translateY(-50%)", opacity: 0.26, animation: "pragSpin 22s linear infinite" }}><line x1="12" y1="2" x2="12" y2="22" /><line x1="3.3" y1="7" x2="20.7" y2="17" /><line x1="3.3" y1="17" x2="20.7" y2="7" /></svg>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", inset: -16, borderRadius: 28, border: "2px solid var(--cool-400)", opacity: 0.55, animation: "pragPing 1.8s var(--ease-out) infinite" }} />
        <img src={MARK} width="96" height="96" alt="PragAC" style={{ position: "relative", borderRadius: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.45)" }} />
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, letterSpacing: "-0.025em" }}>Prag<span style={{ color: "var(--cool-300)" }}>AC</span></div>
        <div style={{ marginTop: 8, fontSize: 15, color: "rgba(255,255,255,0.8)" }}>Hledám zastávky poblíž…</div>
      </div>
      <div style={{ position: "relative", display: "flex", gap: 7 }}>
        {[0, 1, 2].map((i) => (<span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cool-300)", animation: `pragBounce 1s var(--ease-in-out) ${i * 0.15}s infinite` }} />))}
      </div>
      <img src={STRIPES} alt="" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 56, objectFit: "fill", opacity: 0.9, maskImage: "linear-gradient(to top, #000 40%, transparent)", WebkitMaskImage: "linear-gradient(to top, #000 40%, transparent)" }} />
    </div>
  );
}
