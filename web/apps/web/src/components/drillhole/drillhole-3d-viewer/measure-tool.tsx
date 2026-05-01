import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';

interface Props {
  points: THREE.Vector3[];
  hover: THREE.Vector3 | null;
  active: boolean;
}

function fmtDist(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(1)} m`;
}

export function MeasureTool({ points, hover, active }: Props) {
  if (!active && points.length === 0) return null;

  const segments: { a: THREE.Vector3; b: THREE.Vector3; dist: number; preview: boolean }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      a: points[i],
      b: points[i + 1],
      dist: points[i].distanceTo(points[i + 1]),
      preview: false,
    });
  }
  if (active && points.length > 0 && hover) {
    const last = points[points.length - 1];
    segments.push({ a: last, b: hover, dist: last.distanceTo(hover), preview: true });
  }

  const totalSofar = segments.reduce((s, sg) => (sg.preview ? s : s + sg.dist), 0);

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {segments.map((sg, i) => {
        const mid = sg.a.clone().add(sg.b).multiplyScalar(0.5);
        return (
          <group key={i}>
            <Line
              points={[sg.a, sg.b]}
              color={sg.preview ? '#fde68a' : '#fbbf24'}
              lineWidth={sg.preview ? 1.5 : 2.5}
              dashed={sg.preview}
              dashSize={2}
              gapSize={2}
              transparent
              opacity={sg.preview ? 0.65 : 1}
            />
            <Html position={[mid.x, mid.y, mid.z]} center distanceFactor={120}>
              <div
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border whitespace-nowrap pointer-events-none ${
                  sg.preview
                    ? 'bg-amber-950/70 border-amber-500/40 text-amber-200/80'
                    : 'bg-amber-950/95 border-amber-400/70 text-amber-100 shadow-md'
                }`}
              >
                {fmtDist(sg.dist)}
              </div>
            </Html>
          </group>
        );
      })}

      {points.length >= 2 && (
        <Html position={[points[0].x, points[0].y + 6, points[0].z]} center>
          <div className="px-2 py-1 text-[11px] font-mono bg-amber-950/95 border border-amber-400 rounded text-amber-100 shadow-lg whitespace-nowrap pointer-events-none">
            Total: {fmtDist(totalSofar)} · {points.length - 1} {points.length - 1 === 1 ? 'tramo' : 'tramos'}
          </div>
        </Html>
      )}
    </group>
  );
}
