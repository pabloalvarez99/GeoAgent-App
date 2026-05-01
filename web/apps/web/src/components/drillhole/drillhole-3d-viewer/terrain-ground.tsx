import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface Props {
  origin: { lat: number; lng: number };
  center: THREE.Vector3;
  radius: number;
  opacity?: number;
  onDemReady?: (sampler: ((lat: number, lng: number) => number) | null) => void;
}

const SEGMENTS = 96;

interface TileCacheEntry {
  demCanvas: HTMLCanvasElement;
  satCanvas: HTMLCanvasElement;
  demData: Uint8ClampedArray;
  W: number;
  H: number;
  z: number;
  x0: number;
  y0: number;
}
const tileCache = new Map<string, TileCacheEntry>();
const cacheKey = (z: number, x0: number, y0: number, x1: number, y1: number) =>
  `${z}:${x0}:${y0}:${x1}:${y1}`;

const SESSION_PREFIX = 'geoagent-3d-tile:';
const SESSION_VERSION = 'v1';

function readSessionEntry(key: string): { demDataUrl: string; satDataUrl: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== SESSION_VERSION) return null;
    if (typeof parsed.demDataUrl !== 'string' || typeof parsed.satDataUrl !== 'string') return null;
    return { demDataUrl: parsed.demDataUrl, satDataUrl: parsed.satDataUrl };
  } catch {
    return null;
  }
}

function writeSessionEntry(key: string, demCanvas: HTMLCanvasElement, satCanvas: HTMLCanvasElement) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const demDataUrl = demCanvas.toDataURL('image/png');
    const satDataUrl = satCanvas.toDataURL('image/jpeg', 0.82);
    sessionStorage.setItem(
      SESSION_PREFIX + key,
      JSON.stringify({ v: SESSION_VERSION, demDataUrl, satDataUrl }),
    );
  } catch (err) {
    console.warn('[3d-viewer] sessionStorage DEM cache write failed:', err);
  }
}

async function hydrateFromSession(
  entry: { demDataUrl: string; satDataUrl: string },
  W: number,
  H: number,
): Promise<{ demCanvas: HTMLCanvasElement; satCanvas: HTMLCanvasElement; demData: Uint8ClampedArray } | null> {
  try {
    const [demImg, satImg] = await Promise.all([loadImage(entry.demDataUrl), loadImage(entry.satDataUrl)]);
    const demCanvas = document.createElement('canvas');
    demCanvas.width = W;
    demCanvas.height = H;
    const demCtx = demCanvas.getContext('2d', { willReadFrequently: true });
    if (!demCtx) return null;
    demCtx.drawImage(demImg, 0, 0);
    const demData = demCtx.getImageData(0, 0, W, H).data;

    const satCanvas = document.createElement('canvas');
    satCanvas.width = W;
    satCanvas.height = H;
    const satCtx = satCanvas.getContext('2d');
    if (!satCtx) return null;
    satCtx.drawImage(satImg, 0, 0);

    return { demCanvas, satCanvas, demData };
  } catch (err) {
    console.warn('[3d-viewer] sessionStorage DEM hydrate failed:', err);
    return null;
  }
}

function lonLatToTile(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latR = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n;
  return { x, y };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

export function TerrainGround({ origin, center, radius, opacity = 0.85, onDemReady }: Props) {
  const [data, setData] = useState<{
    tex: THREE.Texture;
    geom: THREE.PlaneGeometry;
    elevMean: number;
  } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const sizeMeters = Math.max(radius * 4, 600);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const halfLat = sizeMeters / 111_320;
    const cosLat = Math.cos((origin.lat * Math.PI) / 180);
    const halfLng = sizeMeters / (111_320 * cosLat);
    const minLng = origin.lng - halfLng;
    const maxLng = origin.lng + halfLng;
    const minLat = origin.lat - halfLat;
    const maxLat = origin.lat + halfLat;

    const targetTileM = sizeMeters * 1.5;
    const z = Math.max(
      8,
      Math.min(15, Math.floor(Math.log2((360 * 111_320 * cosLat) / targetTileM))),
    );

    const tNW = lonLatToTile(minLng, maxLat, z);
    const tSE = lonLatToTile(maxLng, minLat, z);
    const x0 = Math.floor(tNW.x);
    const x1 = Math.floor(tSE.x);
    const y0 = Math.floor(tNW.y);
    const y1 = Math.floor(tSE.y);
    const tilesX = x1 - x0 + 1;
    const tilesY = y1 - y0 + 1;
    const TS = 256;

    const key = cacheKey(z, x0, y0, x1, y1);
    const cached = tileCache.get(key);

    const buildFromCanvases = (
      _demCanvas: HTMLCanvasElement,
      satCanvas: HTMLCanvasElement,
      demData: Uint8ClampedArray,
      W: number,
      H: number,
    ) => {
      const stitchPx = (lng: number, lat: number) => {
        const t = lonLatToTile(lng, lat, z);
        return { px: (t.x - x0) * TS, py: (t.y - y0) * TS };
      };
      const tl = stitchPx(minLng, maxLat);
      const br = stitchPx(maxLng, minLat);

      const elevAt = (u: number, v: number): number => {
        const px = tl.px + u * (br.px - tl.px);
        const py = tl.py + v * (br.py - tl.py);
        const ix = Math.max(0, Math.min(W - 1, Math.round(px)));
        const iy = Math.max(0, Math.min(H - 1, Math.round(py)));
        const idx = (iy * W + ix) * 4;
        const r = demData[idx];
        const g = demData[idx + 1];
        const b = demData[idx + 2];
        return r * 256 + g + b / 256 - 32768;
      };

      const planeSize = sizeMeters * 2;
      const geom = new THREE.PlaneGeometry(planeSize, planeSize, SEGMENTS, SEGMENTS);
      const pos = geom.attributes.position;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const u = (px + planeSize / 2) / planeSize;
        const v = 1 - (py + planeSize / 2) / planeSize;
        const elev = elevAt(u, v);
        pos.setZ(i, elev);
        sum += elev;
        count++;
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();
      const elevMean = count > 0 ? sum / count : 0;

      const tex = new THREE.CanvasTexture(satCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.offset.set(tl.px / W, (H - br.py) / H);
      tex.repeat.set((br.px - tl.px) / W, (br.py - tl.py) / H);
      tex.needsUpdate = true;

      setData({ tex, geom, elevMean });
      setStatus('ready');

      if (onDemReady) {
        const sampler = (lat: number, lng: number): number => {
          const t = lonLatToTile(lng, lat, z);
          const px = (t.x - x0) * TS;
          const py = (t.y - y0) * TS;
          const ix = Math.max(0, Math.min(W - 1, Math.round(px)));
          const iy = Math.max(0, Math.min(H - 1, Math.round(py)));
          const idx = (iy * W + ix) * 4;
          const r = demData[idx];
          const g = demData[idx + 1];
          const b = demData[idx + 2];
          return r * 256 + g + b / 256 - 32768;
        };
        onDemReady(sampler);
      }
    };

    if (cached) {
      buildFromCanvases(cached.demCanvas, cached.satCanvas, cached.demData, cached.W, cached.H);
      return () => {
        cancelled = true;
        if (onDemReady) onDemReady(null);
      };
    }

    const W = TS * tilesX;
    const H = TS * tilesY;
    const session = readSessionEntry(key);
    if (session) {
      hydrateFromSession(session, W, H).then((res) => {
        if (cancelled) return;
        if (!res) {
          fetchTiles();
          return;
        }
        tileCache.set(key, { demCanvas: res.demCanvas, satCanvas: res.satCanvas, demData: res.demData, W, H, z, x0, y0 });
        buildFromCanvases(res.demCanvas, res.satCanvas, res.demData, W, H);
      });
      return () => {
        cancelled = true;
        if (onDemReady) onDemReady(null);
      };
    }

    fetchTiles();

    function fetchTiles() {
      const demCanvas = document.createElement('canvas');
      demCanvas.width = TS * tilesX;
      demCanvas.height = TS * tilesY;
      const demCtx = demCanvas.getContext('2d', { willReadFrequently: true });

      const satCanvas = document.createElement('canvas');
      satCanvas.width = TS * tilesX;
      satCanvas.height = TS * tilesY;
      const satCtx = satCanvas.getContext('2d');

      if (!demCtx || !satCtx) {
        setStatus('error');
        return;
      }

      const jobs: Promise<void>[] = [];
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const dx = (tx - x0) * TS;
          const dy = (ty - y0) * TS;
          jobs.push(
            loadImage(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${tx}/${ty}.png`).then((img) => {
              demCtx.drawImage(img, dx, dy);
            }),
          );
          jobs.push(
            loadImage(
              `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty}/${tx}`,
            ).then((img) => {
              satCtx.drawImage(img, dx, dy);
            }),
          );
        }
      }

      Promise.all(jobs)
        .then(() => {
          if (cancelled) return;
          const wPx = demCanvas.width;
          const hPx = demCanvas.height;
          const demData = demCtx.getImageData(0, 0, wPx, hPx).data;
          tileCache.set(key, { demCanvas, satCanvas, demData, W: wPx, H: hPx, z, x0, y0 });
          writeSessionEntry(key, demCanvas, satCanvas);
          buildFromCanvases(demCanvas, satCanvas, demData, wPx, hPx);
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn('[3d-viewer] terrain DEM load failed:', err);
          setStatus('error');
        });
    }

    return () => {
      cancelled = true;
      if (onDemReady) onDemReady(null);
    };
  }, [origin.lat, origin.lng, sizeMeters, onDemReady]);

  return (
    <group>
      {data && (
        <mesh
          position={[center.x, 0, center.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={data.geom}
          receiveShadow
        >
          <meshStandardMaterial
            map={data.tex}
            roughness={0.95}
            metalness={0}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {status !== 'ready' && (
        <Html position={[center.x, center.y, center.z]} center>
          <div className="px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-700/60 backdrop-blur text-[11px] font-mono text-slate-200 shadow-lg flex items-center gap-2 pointer-events-none">
            {status === 'loading' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Cargando terreno DEM…
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Terreno DEM no disponible
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
