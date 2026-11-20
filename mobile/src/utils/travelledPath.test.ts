import { travelledPathSegments, travelledPathRegion } from './travelledPath';
const point = (latitude: number, seconds: number) => ({ latitude, longitude: -80.5, capturedAt: new Date(Date.UTC(2026, 10, 20, 0, 0, seconds)).toISOString() });
it('sorts GPS samples chronologically and removes stationary duplicates', () => {
 const first = point(35.4, 0), second = point(35.401, 30);
 expect(travelledPathSegments([second, first, { ...second, capturedAt: point(0, 45).capturedAt }])).toEqual([[first, second]]);
});
it('breaks the line at gaps, inaccurate coordinates and implausible jumps', () => {
 const a = point(35.4, 0), b = point(35.401, 30), c = point(35.402, 400), d = point(35.403, 430);
 expect(travelledPathSegments([a, b, c, d])).toEqual([[a, b], [c, d]]);
 expect(travelledPathSegments([a, b, { ...point(35.402, 60), accuracyMeters: 500 }, c, d])).toEqual([[a, b], [c, d]]);
 expect(travelledPathSegments([a, b, point(50, 60), c, d])).toEqual([[a, b], [c, d]]);
});
it('never fabricates a route from one or invalid points and frames all recorded coordinates', () => {
 expect(travelledPathSegments([point(35.4, 0)])).toEqual([]);
 expect(travelledPathSegments([point(91, 0), point(NaN, 30)])).toEqual([]);
 const region = travelledPathRegion([point(35.4, 0), point(35.5, 30)]);
 expect(region.latitude).toBeCloseTo(35.45);
 expect(region.latitudeDelta).toBeGreaterThan(0.1);
});

it('frames paths crossing the date line without zooming out to the whole world', () => {
 const region = travelledPathRegion([{ latitude: 0, longitude: 179.99 }, { latitude: 0, longitude: -179.99 }]);
 expect(Math.abs(region.longitude)).toBeCloseTo(180);
 expect(region.longitudeDelta).toBeLessThan(0.1);
});
