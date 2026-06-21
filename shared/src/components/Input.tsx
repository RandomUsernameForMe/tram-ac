import { useState } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export function Input({ iconLeft = null, style = {}, wrapStyle = {}, ...rest }: {
  iconLeft?: ReactNode; wrapStyle?: CSSProperties;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-card)", border: `1.5px solid ${focus ? "var(--cool-400)" : "var(--border-strong)"}`, borderRadius: "var(--radius-md)", padding: "0 14px", minHeight: "var(--target-min)", boxShadow: focus ? "var(--focus-ring)" : "none", transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)", ...wrapStyle }}>
      {iconLeft && <span style={{ display: "flex", color: "var(--text-faint)" }}>{iconLeft}</span>}
      <input {...rest}
        onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-ui)", fontSize: 16, color: "var(--text-strong)", padding: "12px 0", ...style }} />
    </div>
  );
}
