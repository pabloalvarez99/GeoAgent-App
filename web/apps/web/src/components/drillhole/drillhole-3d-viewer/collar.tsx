import * as THREE from 'three';
import { Html } from '@react-three/drei';

export function CollarMarker({
  collar,
  label,
  onClick,
  scale = 1.5,
  showLabel = true,
}: {
  collar: THREE.Vector3;
  label: string;
  onClick?: () => void;
  scale?: number;
  showLabel?: boolean;
}) {
  return (
    <group position={collar}>
      {/* Subtle ground ring for spatial anchoring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scale * 1.4, scale * 1.7, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Brushed-steel sphere */}
      <mesh
        onClick={(e) => {
          if (!onClick) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          if (onClick) (e.object as unknown as { cursor?: string }).cursor = 'pointer';
        }}
      >
        <sphereGeometry args={[scale, 24, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Inner accent core */}
      <mesh>
        <sphereGeometry args={[scale * 0.45, 16, 16]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.25} />
      </mesh>
      {showLabel && (
        <Html distanceFactor={100} position={[0, scale * 2.6, 0]} center>
          <div className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-slate-900/85 border border-slate-700/60 backdrop-blur rounded-sm text-slate-200 whitespace-nowrap pointer-events-none shadow-md">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
