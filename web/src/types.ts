export interface Departure { line: string; headsign: string; minutes: number; airConditioned: boolean | null; }
export interface Stop { aswId: string; name: string; lat: number; lon: number; distanceM?: number; }
