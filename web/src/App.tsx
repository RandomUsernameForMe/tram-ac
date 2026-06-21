import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Stop, Departure } from "shared";
import { getStops, getDepartures } from "./api.ts";
import { LocatingScreen } from "./screens/LocatingScreen.tsx";
import { StopsScreen } from "./screens/StopsScreen.tsx";
import { BoardScreen } from "./screens/BoardScreen.tsx";

type Screen =
  | { k: "locating" }
  | { k: "stops"; stops: Stop[] }
  | { k: "board"; stop: Stop; board: Departure[] }
  | { k: "error"; msg: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ k: "locating" });
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) { setScreen({ k: "error", msg: "Geolokace není dostupná" }); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const near = await getStops(pos.coords.latitude, pos.coords.longitude);
          setStops(near);
          setScreen({ k: "stops", stops: near });
        } catch (e) { setScreen({ k: "error", msg: String(e) }); }
      },
      () => setScreen({ k: "error", msg: "Přístup k poloze zamítnut" }),
    );
  }, []);

  async function pick(stop: Stop) {
    try {
      const board = await getDepartures(stop.id);
      setScreen({ k: "board", stop, board });
    } catch (e) { setScreen({ k: "error", msg: String(e) }); }
  }

  if (screen.k === "locating") return <LocatingScreen />;
  if (screen.k === "stops") return <Wrap><StopsScreen stops={screen.stops} onPick={pick} /></Wrap>;
  if (screen.k === "board") return <Wrap><BoardScreen stop={screen.stop} board={screen.board} onBack={() => setScreen({ k: "stops", stops })} /></Wrap>;
  return <Wrap><div style={{ padding: 24, color: "var(--status-noac-ink)", fontFamily: "var(--font-ui)" }}>{screen.msg}</div></Wrap>;
}

function Wrap({ children }: { children: ReactNode }) {
  return <main style={{ maxWidth: "var(--app-max-width)", margin: "0 auto", background: "var(--surface-page)", minHeight: "100vh", fontFamily: "var(--font-ui)" }}>{children}</main>;
}
