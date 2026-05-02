import * as THREE from 'three';

export type SectionAxis = 'horizontal' | 'ns' | 'ew';

export interface SectionRibbon {
  id: string;
  axis: SectionAxis;
  depth: number;
  color: string;
}

export function SectionPlaneVisual({
  center,
  size,
  depth,
  axis,
  color = '#06b6d4',
  opacity = 0.1,
}: {
  center: THREE.Vector3;
  size: number;
  depth: number;
  axis: SectionAxis;
  color?: string;
  opacity?: number;
}) {
  let position: [number, number, number] = [center.x, depth, center.z];
  let rotation: [number, number, number] = [-Math.PI / 2, 0, 0];

  if (axis === 'ns') {
    position = [depth, center.y, center.z];
    rotation = [0, Math.PI / 2, 0];
  } else if (axis === 'ew') {
    position = [center.x, center.y, depth];
    rotation = [0, 0, 0];
  }

  return (
    <mesh position={position} rotation={rotation} renderOrder={2}>
      <planeGeometry args={[size * 4, size * 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
