export type CoordFormat = 'DD' | 'DMS';

function toDMS(decimal: number, posDir: string, negDir: string): string {
  const dir = decimal >= 0 ? posDir : negDir;
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = ((minFull - min) * 60).toFixed(2);
  return `${deg}°${min}'${sec}"${dir}`;
}

export function formatCoord(value: number, axis: 'lat' | 'lng', format: CoordFormat): string {
  if (format === 'DD') return value.toFixed(6);
  return axis === 'lat' ? toDMS(value, 'N', 'S') : toDMS(value, 'E', 'W');
}

export function formatLatLng(lat: number, lng: number, format: CoordFormat): string {
  return `${formatCoord(lat, 'lat', format)}, ${formatCoord(lng, 'lng', format)}`;
}
