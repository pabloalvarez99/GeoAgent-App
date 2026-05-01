import * as THREE from 'three';
import type { GeoDrillHole } from '@geoagent/geo-shared/types';

export const ROCK_GROUP_COLOR: Record<string, string> = {
  Ignea: '#ef4444',
  Sedimentaria: '#f59e0b',
  Metamorfica: '#6366f1',
};

export function rockColor(group: string): string {
  return ROCK_GROUP_COLOR[group] ?? '#64748b';
}

export function azimuthInclinationToVector(azimuthDeg: number, inclinationDeg: number): THREE.Vector3 {
  const az = THREE.MathUtils.degToRad(azimuthDeg);
  const inc = THREE.MathUtils.degToRad(inclinationDeg);
  const horiz = Math.cos(inc);
  return new THREE.Vector3(
    Math.sin(az) * horiz,
    Math.sin(inc),
    Math.cos(az) * horiz,
  ).normalize();
}

export function localCoords(
  point: { latitude: number; longitude: number; altitude?: number | null },
  origin: { lat: number; lng: number },
): THREE.Vector3 {
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos(THREE.MathUtils.degToRad(origin.lat));
  const x = (point.longitude - origin.lng) * metersPerDegLng;
  const z = -(point.latitude - origin.lat) * metersPerDegLat;
  const y = point.altitude ?? 0;
  return new THREE.Vector3(x, y, z);
}

export function holeOriginAndScenes(drillHoles: { drillHole: GeoDrillHole }[]) {
  if (drillHoles.length === 0) return { lat: 0, lng: 0 };
  return {
    lat: drillHoles[0].drillHole.latitude,
    lng: drillHoles[0].drillHole.longitude,
  };
}

export function rampColor(value: number | null | undefined): string {
  if (value == null) return '#64748b';
  const v = Math.max(0, Math.min(100, value)) / 100;
  const r = Math.round(239 * (1 - v) + 34 * v);
  const g = Math.round(68 * (1 - v) + 197 * v);
  const b = Math.round(68 * (1 - v) + 94 * v);
  return `rgb(${r},${g},${b})`;
}
