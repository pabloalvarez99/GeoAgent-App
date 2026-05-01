import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { FlatInstance, HoverInfo } from './types';

interface Props {
  flat: FlatInstance[];
  hiddenGroups: Set<string>;
  clippingPlanes?: THREE.Plane[];
  onHover: (info: HoverInfo | null) => void;
  onSelect?: (item: FlatInstance | null) => void;
  selectedKey?: string | null;
}

export function InstancedIntervals({ flat, hiddenGroups, clippingPlanes, onHover, onSelect, selectedKey }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const items = useMemo(
    () =>
      flat.map((it) => {
        const dirLen = it.direction.length() || 1;
        const depthSpan = it.toDepth - it.fromDepth;
        const length = depthSpan * dirLen;
        const center = it.collar.clone().addScaledVector(it.direction, it.fromDepth + depthSpan / 2);
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), it.direction.clone().normalize());
        const hidden = hiddenGroups.has(it.group);
        return {
          ...it,
          length,
          center,
          quaternion: q,
          hidden,
        };
      }),
    [flat, hiddenGroups],
  );

  if (items.length === 0) return null;

  return (
    <Instances
      limit={Math.max(items.length, 1)}
      range={items.length}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[1, 1, 1, 24]} />
      <meshPhysicalMaterial
        roughness={0.7}
        metalness={0.0}
        clearcoat={0.25}
        clearcoatRoughness={0.4}
        envMapIntensity={0.65}
        clippingPlanes={clippingPlanes}
        clipShadows
      />
      {items.map((it) => {
        const key = `${it.hole.id}-${it.interval.id}`;
        const isHovered = hoveredKey === key;
        const isSelected = selectedKey === key;
        const r = isSelected ? it.radius * 1.5 : isHovered ? it.radius * 1.35 : it.radius;
        return (
          <Instance
            key={key}
            position={it.center}
            quaternion={it.quaternion}
            scale={it.hidden ? [0, 0, 0] : [r, it.length, r]}
            color={it.color}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (it.hidden) return;
              e.stopPropagation();
              const idx = e.instanceId;
              if (idx == null || !onSelect) return;
              const target = items[idx];
              if (!target || target.hidden) return;
              const tk = `${target.hole.id}-${target.interval.id}`;
              if (selectedKey === tk) onSelect(null);
              else onSelect(target);
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              if (it.hidden) return;
              e.stopPropagation();
              const idx = e.instanceId;
              if (idx == null) return;
              const target = items[idx];
              if (!target || target.hidden) return;
              const tk = `${target.hole.id}-${target.interval.id}`;
              setHoveredKey(tk);
              onHover({
                holeId: target.hole.holeId,
                rockType: target.interval.rockType,
                rockGroup: target.interval.rockGroup,
                fromDepth: target.interval.fromDepth,
                toDepth: target.interval.toDepth,
                rqd: target.interval.rqd,
                recovery: target.interval.recovery,
                screenX: (e.nativeEvent as PointerEvent).clientX,
                screenY: (e.nativeEvent as PointerEvent).clientY,
              });
            }}
            onPointerMove={(e: ThreeEvent<PointerEvent>) => {
              if (it.hidden) return;
              const idx = e.instanceId;
              if (idx == null) return;
              const target = items[idx];
              if (!target || target.hidden) return;
              onHover({
                holeId: target.hole.holeId,
                rockType: target.interval.rockType,
                rockGroup: target.interval.rockGroup,
                fromDepth: target.interval.fromDepth,
                toDepth: target.interval.toDepth,
                rqd: target.interval.rqd,
                recovery: target.interval.recovery,
                screenX: (e.nativeEvent as PointerEvent).clientX,
                screenY: (e.nativeEvent as PointerEvent).clientY,
              });
            }}
            onPointerOut={() => {
              setHoveredKey(null);
              onHover(null);
            }}
          />
        );
      })}
    </Instances>
  );
}
