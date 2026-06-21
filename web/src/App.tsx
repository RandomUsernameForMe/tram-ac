import { useEffect, useState } from "react";
import type { Stop, Departure } from "./types.ts";
import { getStops, getDepartures } from "./api.ts";
import { withDistanceSorted } from "./geo.ts";
import { StopList } from "./components/StopList.tsx";
import { Board } from "./components/Board.tsx";

type Screen =
  | { k: "locating" }
  | { k: "stops"; stops: Stop[] }
  | { k: "board"; stop: Stop; departures: Departure[] }
  | { k: "error"; msg: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ k: "locating" });

  useEffect(() => {
    if (!navigator.geolocation) { setScreen({ k: "error", msg: "Geolocation unavailable" }); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const raw = await getStops(pos.coords.latitude, pos.coords.longitude);
          setScreen({ k: "stops", stops: withDistanceSorted(raw, pos.coords.latitude, pos.coords.longitude) });
        } catch (e) { setScreen({ k: "error", msg: String(e) }); }
      },
      () => setScreen({ k: "error", msg: "Location permission denied" }),
    );
  }, []);

  async function pick(stop: Stop) {
    try {
      const departures = await getDepartures(stop.aswId);
      setScreen({ k: "board", stop, departures });
    } catch (e) { setScreen({ k: "error", msg: String(e) }); }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif", color: "#eaf5f0", background: "#0b3d2e", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20 }}>Tram-AC ❄️</h1>
      {screen.k === "locating" && <p>Finding nearby stops…</p>}
      {screen.k === "error" && <p style={{ color: "#ff9b9b" }}>{screen.msg}</p>}
      {screen.k === "stops" && <StopList stops={screen.stops} onPick={pick} />}
      {screen.k === "board" && <Board stopName={screen.stop.name} departures={screen.departures} onBack={() => setScreen({ k: "stops", stops: [screen.stop] })} />}
    </main>
  );
}
