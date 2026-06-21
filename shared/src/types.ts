export interface Departure { line: string; headsign: string; minutes: number; airConditioned: boolean | null; }
export interface Stop { id: string; name: string; platformCode?: string; lat: number; lon: number; distanceM?: number; }
