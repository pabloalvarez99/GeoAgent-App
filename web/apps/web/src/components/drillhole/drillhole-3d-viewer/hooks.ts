import { useEffect, useState } from 'react';
import * as THREE from 'three';
import type { CameraControls } from '@react-three/drei';
import type { SceneItem } from './types';

type CCRef = React.RefObject<CameraControls | null>;

export function useSceneBounds(scenes: SceneItem[]) {
  const points: THREE.Vector3[] = [];
  scenes.forEach(({ collar, direction, dh }) => {
    points.push(collar);
    points.push(collar.clone().addScaledVector(direction, dh.actualDepth ?? dh.plannedDepth));
  });
  if (points.length === 0) {
    return { center: new THREE.Vector3(), radius: 50, box: new THREE.Box3() };
  }
  const box = new THREE.Box3().setFromPoints(points);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const radius = Math.max(size.length() / 2, 50);
  return { center, radius, box };
}

export function useHudCameraSync(controlsRef: CCRef, intervalMs = 80) {
  const [state, setState] = useState({ azimuth: 0, distance: 100 });
  useEffect(() => {
    const id = setInterval(() => {
      const cc = controlsRef.current;
      if (!cc) return;
      try {
        const az = (cc as unknown as { azimuthAngle: number }).azimuthAngle ?? 0;
        const dist = (cc as unknown as { distance: number }).distance ?? 100;
        setState({ azimuth: az, distance: dist });
      } catch {
        // noop
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [controlsRef, intervalMs]);
  return state;
}
