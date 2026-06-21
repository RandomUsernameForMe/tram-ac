// Normalized shapes returned by our backend (client-facing).
export interface Departure {
  line: string;                  // route.short_name
  headsign: string;              // trip.headsign
  minutes: number;               // departure_timestamp.minutes
  airConditioned: boolean | null; // trip.is_air_conditioned, null when unknown
}

export interface Stop {
  id: string;            // GTFS stop_id (e.g. "U539Z1P"), used as departureboards `ids`
  name: string;
  platformCode?: string; // disambiguates direction at multi-platform stops
  lat: number;
  lon: number;
  distanceM?: number;    // straight-line metres from query point (from Golemio)
}

// Minimal raw shapes we read from Golemio departureboards.
export interface GolemioRawDeparture {
  route?: { short_name?: string };
  trip?: { headsign?: string; is_air_conditioned?: boolean | null };
  departure_timestamp?: { minutes?: number | string };
}
export interface GolemioDepartureboards {
  departures?: GolemioRawDeparture[];
}

// Raw shapes we read from Golemio gtfs/stops (confirmed live 2026-06-21).
export interface GolemioStopFeature {
  properties?: {
    stop_id?: string;
    stop_name?: string | null;
    platform_code?: string | null;
    location_type?: number; // 0 = boardable platform; 1 station; 2 entrance; 3 node
    distance?: number;      // metres from query point
  };
  geometry?: { coordinates?: [number, number] }; // [lon, lat]
}
export interface GolemioStops {
  features?: GolemioStopFeature[];
}
