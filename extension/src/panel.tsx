import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <main style={{ fontFamily: "system-ui", padding: 12, color: "#eaf5f0", background: "#0b3d2e", minHeight: "100vh" }}>
    <h1 style={{ fontSize: 18 }}>Tram-AC ❄️</h1>
    <p>Side panel ready.</p>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
