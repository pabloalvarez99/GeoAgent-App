import type { FlatInstance } from './types';
import type { SectionAxis } from './section-plane';

export interface SectionSegment {
  u1: number;
  v1: number;
  u2: number;
  v2: number;
  color: string;
  holeId: string;
  holeLabel: string;
  intervalId: string;
  rockType?: string;
  rockGroup?: string;
  fromDepth: number;
  toDepth: number;
  rqd?: number | null;
  recovery?: number | null;
  inSlab: boolean;
}

export interface SectionCollar {
  u: number;
  v: number;
  label: string;
}

export interface SectionBounds {
  umin: number;
  umax: number;
  vmin: number;
  vmax: number;
}

export interface SectionData {
  segments: SectionSegment[];
  visible: SectionSegment[];
  collars: SectionCollar[];
  bounds: SectionBounds;
  vIsElev: boolean;
}

/** Project (x,y,z) into [u, v, perp] for given section axis. */
export function projectAxis(
  axis: SectionAxis,
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  if (axis === 'ns') return [z, y, x];
  if (axis === 'ew') return [x, y, z];
  return [x, z, y];
}

/**
 * Build a 2D section from drillhole intervals.
 * thickness <= 0 → no slab filter (all in slab).
 */
export function buildSection(
  flat: FlatInstance[],
  axis: SectionAxis,
  depth: number,
  thickness: number,
): SectionData {
  const half = thickness > 0 ? thickness / 2 : Infinity;
  const useSlab = thickness > 0;

  const segments: SectionSegment[] = flat.map((f) => {
    const sx = f.collar.x + f.direction.x * f.fromDepth;
    const sy = f.collar.y + f.direction.y * f.fromDepth;
    const sz = f.collar.z + f.direction.z * f.fromDepth;
    const ex = f.collar.x + f.direction.x * f.toDepth;
    const ey = f.collar.y + f.direction.y * f.toDepth;
    const ez = f.collar.z + f.direction.z * f.toDepth;
    const [u1, v1, perp1] = projectAxis(axis, sx, sy, sz);
    const [u2, v2, perp2] = projectAxis(axis, ex, ey, ez);
    const d1 = perp1 - depth;
    const d2 = perp2 - depth;
    const inSlab = useSlab ? Math.min(Math.abs(d1), Math.abs(d2)) <= half : true;
    return {
      u1, v1, u2, v2,
      color: f.color,
      holeId: f.hole.id,
      holeLabel: f.hole.holeId,
      intervalId: f.interval.id,
      rockType: f.interval.rockType,
      rockGroup: f.interval.rockGroup,
      fromDepth: f.fromDepth,
      toDepth: f.toDepth,
      rqd: f.interval.rqd ?? null,
      recovery: f.interval.recovery ?? null,
      inSlab,
    };
  });

  const collarsMap = new Map<string, SectionCollar>();
  flat.forEach((f) => {
    if (collarsMap.has(f.hole.id)) return;
    const [u, v] = projectAxis(axis, f.collar.x, f.collar.y, f.collar.z);
    collarsMap.set(f.hole.id, { u, v, label: f.hole.holeId });
  });

  const visible = segments.filter((s) => s.inSlab);
  const src = visible.length > 0 ? visible : segments;
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
  src.forEach((s) => {
    umin = Math.min(umin, s.u1, s.u2);
    umax = Math.max(umax, s.u1, s.u2);
    vmin = Math.min(vmin, s.v1, s.v2);
    vmax = Math.max(vmax, s.v1, s.v2);
  });
  if (!Number.isFinite(umin)) {
    umin = -100; umax = 100; vmin = -100; vmax = 100;
  }
  const padU = (umax - umin) * 0.08 + 5;
  const padV = (vmax - vmin) * 0.08 + 5;
  const bounds: SectionBounds = {
    umin: umin - padU,
    umax: umax + padU,
    vmin: vmin - padV,
    vmax: vmax + padV,
  };

  return {
    segments,
    visible,
    collars: [...collarsMap.values()],
    bounds,
    vIsElev: axis !== 'horizontal',
  };
}
