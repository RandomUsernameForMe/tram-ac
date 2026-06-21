// Normalized shapes returned by our backend (client-facing).
export interface Departure {
  line: string;                  // route.short_name
  headsign: string;              // trip.headsign
  minutes: number;               // departure_timestamp.minutes
  airConditioned: boolean | null; // trip.is_air_conditioned, null when unknown
}

export interface Stop {
  aswId: string;   // value for departureboards `aswIds`, e.g. "539_1"
  name: string;
  lat: number;
  lon: number;
  distanceM?: number;
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

// Raw shapes we read from Golemio gtfs/stops (confirm field names via Task 2 probe).
export interface GolemioStopFeature {
  properties?: { stop_name?: string; asw_node_id?: number | string; asw_stop_id?: number | string };
  geometry?: { coordinates?: [number, number] }; // [lon, lat]
}
export interface GolemioStops {
  features?: GolemioStopFeature[];
}
