import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { CameraControls } from '@react-three/drei';
import type { Preset } from './types';

export interface CameraRigHandle {
  applyPreset: (preset: Preset) => void;
  flyTo: (target: THREE.Vector3) => void;
  controls: CameraControls | null;
}

interface Props {
  center: THREE.Vector3;
  radius: number;
}

export const CameraRig = forwardRef<CameraRigHandle, Props>(function CameraRig(
  { center, radius },
  ref,
) {
  const ccRef = useRef<CameraControls>(null);
  const introDone = useRef(false);

  useEffect(() => {
    const cc = ccRef.current;
    if (!cc || introDone.current) return;
    introDone.current = true;
    const farPos: [number, number, number] = [
      center.x + radius * 4,
      center.y + radius * 3,
      center.z + radius * 4,
    ];
    const finalPos: [number, number, number] = [
      center.x + radius * 1.5,
      center.y + radius * 1.2,
      center.z + radius * 1.5,
    ];
    cc.smoothTime = 1.2;
    cc.setLookAt(...farPos, center.x, center.y, center.z, false);
    requestAnimationFrame(() => {
      cc.setLookAt(...finalPos, center.x, center.y, center.z, true);
    });
  }, [center, radius]);

  useImperativeHandle(
    ref,
    () => ({
      controls: ccRef.current,
      applyPreset: (preset: Preset) => {
        const cc = ccRef.current;
        if (!cc) return;
        const r = Math.max(radius * 1.6, 60);
        switch (preset) {
          case 'top':
            cc.setLookAt(center.x, center.y + r * 2, center.z + 0.001, center.x, center.y, center.z, true);
            break;
          case 'north':
            cc.setLookAt(center.x, center.y, center.z + r * 2, center.x, center.y, center.z, true);
            break;
          case 'east':
            cc.setLookAt(center.x + r * 2, center.y, center.z, center.x, center.y, center.z, true);
            break;
          case 'persp':
            cc.setLookAt(
              center.x + r,
              center.y + r * 0.8,
              center.z + r,
              center.x,
              center.y,
              center.z,
              true,
            );
            break;
          case 'fit':
            cc.fitToSphere(new THREE.Sphere(center, r), true);
            break;
        }
      },
      flyTo: (target: THREE.Vector3) => {
        const cc = ccRef.current;
        if (!cc) return;
        const r = Math.max(radius * 0.4, 30);
        cc.setLookAt(target.x + r, target.y + r * 0.6, target.z + r, target.x, target.y, target.z, true);
      },
    }),
    [center, radius],
  );

  return (
    <CameraControls
      ref={ccRef}
      makeDefault
      smoothTime={0.4}
      minDistance={5}
      maxDistance={Math.max(radius * 12, 1500)}
    />
  );
});
