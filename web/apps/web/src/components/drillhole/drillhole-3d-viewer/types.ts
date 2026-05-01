import type * as THREE from 'three';
import type { GeoDrillHole, GeoDrillInterval, GeoStation } from '@geoagent/geo-shared/types';

export interface HoverInfo {
  holeId: string;
  rockType: string;
  rockGroup: string;
  fromDepth: number;
  toDepth: number;
  rqd?: number | null;
  recovery?: number | null;
  screenX: number;
  screenY: number;
}

export interface DrillHole3DViewerProps {
  drillHoles: { drillHole: GeoDrillHole; intervals: GeoDrillInterval[] }[];
  highlightId?: string;
  fillParent?: boolean;
  stations?: GeoStation[];
  projectId?: string;
}

export interface SceneItem {
  dh: GeoDrillHole;
  collar: THREE.Vector3;
  direction: THREE.Vector3;
  intervals: GeoDrillInterval[];
}

export interface FlatInstance {
  hole: GeoDrillHole;
  interval: GeoDrillInterval;
  collar: THREE.Vector3;
  direction: THREE.Vector3;
  fromDepth: number;
  toDepth: number;
  radius: number;
  color: string;
  group: string;
}

export type Preset = 'top' | 'north' | 'east' | 'persp' | 'fit';
