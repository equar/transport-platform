export interface TravelledPoint {
  latitude: number;
  longitude: number;
  capturedAt: string;
  accuracyMeters?: number | null;
  id?: number;
}

export function isValidMapPoint(point: { latitude: number; longitude: number }) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
}

/** GPS samples, not inferred roads: break lines at missing/poor fixes or long gaps. */
export function travelledPathSegments(history: TravelledPoint[]): TravelledPoint[][] {
  const ordered = history.filter(point => Number.isFinite(Date.parse(point.capturedAt)))
    .slice().sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt) || (a.id ?? 0) - (b.id ?? 0));
  const segments: TravelledPoint[][] = [];
  let segment: TravelledPoint[] = [];
  const flush = () => { if (segment.length > 1) segments.push(segment); segment = []; };
  for (const point of ordered) {
    if (!isValidMapPoint(point) || (point.accuracyMeters != null && (!Number.isFinite(point.accuracyMeters) || point.accuracyMeters > 100))) {
      flush(); continue;
    }
    const previous = segment[segment.length - 1];
    if (previous) {
      const seconds = (Date.parse(point.capturedAt) - Date.parse(previous.capturedAt)) / 1000;
      // Conservative distance estimate for rejecting GPS jumps, not route calculation.
      const dy = (point.latitude - previous.latitude) * 111320;
      const longitudeDelta = ((point.longitude - previous.longitude + 540) % 360) - 180;
      const dx = longitudeDelta * 111320 * Math.cos((point.latitude + previous.latitude) * Math.PI / 360);
      const distance = Math.hypot(dx, dy);
      if (seconds <= 0) continue;
      if (seconds > 300 || distance / seconds > 85) flush();
      else if (distance < 1) continue;
    }
    segment.push(point);
  }
  flush();
  return segments;
}

export function travelledPathRegion(points: { latitude: number; longitude: number }[]) {
  const valid = points.filter(isValidMapPoint);
  if (!valid.length) return { latitude: 0, longitude: 0, latitudeDelta: 120, longitudeDelta: 180 };
  const latitudes = valid.map(point => point.latitude);
  const longitudes = valid.map(point => point.longitude);
  const minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes);
  // Use the shortest longitude span, including paths crossing the date line.
  const sorted = longitudes.map(value => (value + 360) % 360).sort((a, b) => a - b);
  let largestGap = -1, start = sorted[0];
  for (let i = 0; i < sorted.length; i++) {
    const next = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360;
    if (next - sorted[i] > largestGap) { largestGap = next - sorted[i]; start = next % 360; }
  }
  const span = 360 - largestGap;
  return { latitude: (minLat + maxLat) / 2, longitude: ((start + span / 2 + 180) % 360) - 180,
    latitudeDelta: Math.min(180, Math.max(0.012, (maxLat - minLat) * 1.3)), longitudeDelta: Math.min(360, Math.max(0.012, span * 1.3)) };
}
