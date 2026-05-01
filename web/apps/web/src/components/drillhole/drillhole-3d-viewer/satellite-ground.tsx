import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface Props {
  origin: { lat: number; lng: number };
  center: THREE.Vector3;
  radius: number;
  opacity?: number;
}

export function SatelliteGround({ origin, center, radius, opacity = 0.65 }: Props) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const sizeMeters = Math.max(radius * 4, 600);

  useEffect(() => {
    const halfLat = sizeMeters / 111_320;
    const halfLng = sizeMeters / (111_320 * Math.cos((origin.lat * Math.PI) / 180));
    const bbox = [
      origin.lng - halfLng,
      origin.lat - halfLat,
      origin.lng + halfLng,
      origin.lat + halfLat,
    ].join(',');
    const url =
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export` +
      `?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=1024,1024&format=png&transparent=false&f=image`;

    let cancelled = false;
    setStatus('loading');
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        setTexture(tex);
        setStatus('ready');
      },
      undefined,
      (err) => {
        if (cancelled) return;
        console.warn('[3d-viewer] satellite tile load failed:', err);
        setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [origin.lat, origin.lng, sizeMeters]);

  return (
    <group>
      {texture && (
        <mesh
          position={[center.x, center.y - 0.05, center.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[sizeMeters * 2, sizeMeters * 2]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.95}
            metalness={0}
            side={THREE.DoubleSide}
            transparent
            opacity={opacity}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}
      {status !== 'ready' && (
        <Html position={[center.x, center.y, center.z]} center>
          <div className="px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-700/60 backdrop-blur text-[11px] font-mono text-slate-200 shadow-lg flex items-center gap-2 pointer-events-none">
            {status === 'loading' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Cargando imagen satélite…
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Tile satélite no disponible
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
