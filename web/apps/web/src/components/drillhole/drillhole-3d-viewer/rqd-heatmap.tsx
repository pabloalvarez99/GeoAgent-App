import { useMemo } from 'react';
import * as THREE from 'three';
import type { FlatInstance } from './types';
import { rampColor } from './utils';

interface Props {
  flat: FlatInstance[];
  opacity: number;
  minRqd: number;
  voxelSize: number | 'auto';
  searchRadius: number | 'auto';
}

interface Sample {
  pos: THREE.Vector3;
  rqd: number;
}

const tmpMatrix = new THREE.Matrix4();
const tmpColor = new THREE.Color();

function buildSamples(flat: FlatInstance[]): Sample[] {
  const out: Sample[] = [];
  flat.forEach((f) => {
    const rqd = f.interval.rqd;
    if (rqd == null || !Number.isFinite(rqd)) return;
    const mid = (f.fromDepth + f.toDepth) / 2;
    const pos = f.collar.clone().addScaledVector(f.direction, mid);
    out.push({ pos, rqd });
  });
  return out;
}

function autoVoxelSize(samples: Sample[]): number {
  if (samples.length < 2) return 10;
  const bbox = new THREE.Box3();
  samples.forEach((s) => bbox.expandByPoint(s.pos));
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const diag = Math.max(size.x, size.y, size.z);
  // target ~25 cells along longest axis
  return Math.max(2, Math.min(40, diag / 25));
}

export function RqdHeatmap({ flat, opacity, minRqd, voxelSize, searchRadius }: Props) {
  const data = useMemo(() => {
    const samples = buildSamples(flat);
    if (samples.length < 2) return null;

    const bbox = new THREE.Box3();
    samples.forEach((s) => bbox.expandByPoint(s.pos));
    bbox.expandByScalar(5);

    const vs = voxelSize === 'auto' ? autoVoxelSize(samples) : voxelSize;
    const sr = searchRadius === 'auto' ? Math.max(vs * 4, 30) : searchRadius;
    const sr2 = sr * sr;

    const size = new THREE.Vector3();
    bbox.getSize(size);
    const nx = Math.max(1, Math.ceil(size.x / vs));
    const ny = Math.max(1, Math.ceil(size.y / vs));
    const nz = Math.max(1, Math.ceil(size.z / vs));
    const total = nx * ny * nz;
    // hard cap to avoid runaway
    if (total > 60000) return null;

    const min = bbox.min;
    const positions: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];

    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let iz = 0; iz < nz; iz++) {
          const cx = min.x + (ix + 0.5) * vs;
          const cy = min.y + (iy + 0.5) * vs;
          const cz = min.z + (iz + 0.5) * vs;

          let wSum = 0;
          let vSum = 0;
          let any = false;
          for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            const dx = s.pos.x - cx;
            const dy = s.pos.y - cy;
            const dz = s.pos.z - cz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > sr2) continue;
            any = true;
            const w = 1 / (d2 + 0.5);
            wSum += w;
            vSum += w * s.rqd;
          }
          if (!any || wSum === 0) continue;
          const v = vSum / wSum;
          if (v < minRqd) continue;
          positions.push(new THREE.Vector3(cx, cy, cz));
          colors.push(new THREE.Color(rampColor(v)));
        }
      }
    }

    return { positions, colors, voxelSize: vs };
  }, [flat, voxelSize, searchRadius, minRqd]);

  if (!data || data.positions.length === 0) return null;

  return (
    <instancedMesh
      args={[undefined, undefined, data.positions.length]}
      ref={(mesh) => {
        if (!mesh) return;
        const m = mesh as THREE.InstancedMesh;
        const half = data.voxelSize;
        for (let i = 0; i < data.positions.length; i++) {
          tmpMatrix.makeTranslation(data.positions[i].x, data.positions[i].y, data.positions[i].z);
          m.setMatrixAt(i, tmpMatrix);
          tmpColor.copy(data.colors[i]);
          m.setColorAt(i, tmpColor);
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        m.frustumCulled = false;
        // scale via geometry size — set via boxGeometry args below
        void half;
      }}
    >
      <boxGeometry args={[data.voxelSize * 0.92, data.voxelSize * 0.92, data.voxelSize * 0.92]} />
      <meshStandardMaterial
        transparent
        opacity={opacity}
        depthWrite={opacity > 0.85}
        roughness={0.6}
        metalness={0}
      />
    </instancedMesh>
  );
}
