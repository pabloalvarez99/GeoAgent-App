import { useMemo } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';

export function PlannedTrace({
  collar,
  direction,
  totalDepth,
  scale = 2,
  vScale = 1,
}: {
  collar: THREE.Vector3;
  direction: THREE.Vector3;
  totalDepth: number;
  scale?: number;
  vScale?: number;
}) {
  const dirEff = useMemo(
    () => new THREE.Vector3(direction.x, direction.y * vScale, direction.z),
    [direction, vScale],
  );

  const linePoints = useMemo<[number, number, number][]>(() => {
    const end = collar.clone().addScaledVector(dirEff, totalDepth);
    return [
      [collar.x, collar.y, collar.z],
      [end.x, end.y, end.z],
    ];
  }, [collar, dirEff, totalDepth]);

  const ticks = useMemo(() => {
    const labelStep = totalDepth > 400 ? 100 : totalDepth > 150 ? 50 : 25;
    const out: { pos: THREE.Vector3; depth: number; label: boolean }[] = [];
    for (let d = labelStep; d <= totalDepth + 0.1; d += labelStep) {
      out.push({
        pos: collar.clone().addScaledVector(dirEff, d),
        depth: d,
        label: true,
      });
    }
    return out;
  }, [collar, dirEff, totalDepth]);

  const tickSize = scale * 0.35;

  return (
    <group>
      <Line
        points={linePoints}
        color="#64748b"
        lineWidth={1.2}
        transparent
        opacity={0.55}
      />
      {ticks.map((t, i) => (
        <group key={i} position={t.pos}>
          <mesh>
            <sphereGeometry args={[tickSize, 8, 8]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.7} />
          </mesh>
          {t.label && (
            <Html distanceFactor={120} position={[tickSize * 1.5, 0, 0]} center>
              <span className="text-[9px] font-mono text-slate-400/90 whitespace-nowrap pointer-events-none select-none">
                {t.depth} m
              </span>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}
