// Firestore Timestamp shape — avoids coupling geo-shared to firebase SDK
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

// Mirror of Android Room entities + Firebase DTOs
// Firestore path: users/{userId}/{collection}/{docId}
type Timestamp = FirestoreTimestamp | null | undefined;

export interface GeoProject {
  id: string;
  name: string;
  description: string;
  location: string;
  updatedAt?: Timestamp | null;
}

export interface GeoStation {
  id: string;
  projectId: string;
  code: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  date: string; // ISO 8601
  geologist: string;
  description: string;
  weatherConditions?: string | null;
  updatedAt?: Timestamp | null;
}

export interface GeoLithology {
  id: string;
  stationId: string;
  rockType: string;
  rockGroup: string;
  color: string;
  texture: string;
  grainSize: string;
  mineralogy: string;
  alteration?: string | null;
  alterationIntensity?: string | null;
  mineralization?: string | null;
  mineralizationPercent?: number | null;
  structure?: string | null;
  weathering?: string | null;
  notes?: string | null;
  updatedAt?: Timestamp | null;
}

export interface GeoStructural {
  id: string;
  stationId: string;
  type: string;
  strike: number;
  dip: number;
  dipDirection: string;
  movement?: string | null;
  thickness?: number | null;
  filling?: string | null;
  roughness?: string | null;
  continuity?: string | null;
  notes?: string | null;
  updatedAt?: Timestamp | null;
}

export interface GeoSample {
  id: string;
  stationId: string;
  code: string;
  type: string;
  weight?: number | null;
  length?: number | null;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  destination?: string | null;
  analysisRequested?: string | null;
  status: string;
  notes?: string | null;
  updatedAt?: Timestamp | null;
}

export interface GeoDrillHole {
  id: string;
  projectId: string;
  holeId: string;
  type: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  azimuth: number;
  inclination: number;
  plannedDepth: number;
  actualDepth?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  geologist: string;
  notes?: string | null;
  updatedAt?: Timestamp | null;
}

export interface GeoDrillInterval {
  id: string;
  drillHoleId: string;
  fromDepth: number;
  toDepth: number;
  rockType: string;
  rockGroup: string;
  color: string;
  texture: string;
  grainSize: string;
  mineralogy: string;
  alteration?: string | null;
  alterationIntensity?: string | null;
  mineralization?: string | null;
  mineralizationPercent?: number | null;
  rqd?: number | null;
  recovery?: number | null;
  structure?: string | null;
  weathering?: string | null;
  notes?: string | null;
  updatedAt?: Timestamp | null;
}

export interface GeoPhoto {
  id: string;
  projectId?: string | null;
  stationId?: string | null;
  drillHoleId?: string | null;
  fileName: string;
  storagePath?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  takenAt?: string | null;
  updatedAt?: Timestamp | null;
}

// Helpers
export type GeoMarker = {
  id: string;
  type: 'station' | 'drillhole';
  latitude: number;
  longitude: number;
  label: string;
  data: GeoStation | GeoDrillHole;
};

export type ExportFormat = 'pdf' | 'excel' | 'geojson' | 'csv';
