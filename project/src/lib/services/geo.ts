import * as turf from '@turf/turf';
import { supabase } from '../supabase';
import type { Road, Pathology } from '../types';

interface RouteOptimization {
  roads: Road[];
  totalDistance: number;
  estimatedTime: number;
  waypoints: [number, number][];
}

export async function optimizeInspectionRoute(roads: Road[]): Promise<RouteOptimization> {
  // Convert road coordinates to points for route optimization
  const points = roads.flatMap(road => 
    road.coordinates.map(coord => [coord.lng, coord.lat])
  );

  // Use Turf.js to find the optimal route
  const features = turf.featureCollection(
    points.map(point => turf.point(point))
  );
  
  // Calculate centroid for each road
  const centroids = roads.map(road => {
    const line = turf.lineString(road.coordinates.map(coord => [coord.lng, coord.lat]));
    return turf.centroid(line);
  });

  // Find optimal route using nearest neighbor algorithm
  const route: [number, number][] = [];
  let current = centroids[0];
  const unvisited = centroids.slice(1);

  while (unvisited.length > 0) {
    const nearest = unvisited.reduce((nearest, point, index) => {
      const distance = turf.distance(current, point);
      return distance < nearest.distance ? { point, index, distance } : nearest;
    }, { point: unvisited[0], index: 0, distance: Infinity });

    route.push(nearest.point.geometry.coordinates as [number, number]);
    current = nearest.point;
    unvisited.splice(nearest.index, 1);
  }

  // Calculate total distance and estimated time
  const totalDistance = route.reduce((total, point, i) => {
    if (i === 0) return 0;
    return total + turf.distance(
      turf.point(route[i - 1]),
      turf.point(point),
      { units: 'kilometers' }
    );
  }, 0);

  // Estimate time based on average speed of 30 km/h
  const estimatedTime = totalDistance / 30;

  return {
    roads: roads.sort((a, b) => {
      const aCoord = a.coordinates[0];
      const bCoord = b.coordinates[0];
      const aDistance = turf.distance(
        turf.point([aCoord.lng, aCoord.lat]),
        turf.point(route[0])
      );
      const bDistance = turf.distance(
        turf.point([bCoord.lng, bCoord.lat]),
        turf.point(route[0])
      );
      return aDistance - bDistance;
    }),
    totalDistance,
    estimatedTime,
    waypoints: route
  };
}

export async function findNearbyPathologies(
  lat: number,
  lng: number,
  radius: number
): Promise<Pathology[]> {
  const point = turf.point([lng, lat]);
  
  // Get all pathologies
  const { data: pathologies, error } = await supabase
    .from('pathologies')
    .select(`
      *,
      road:roads(*)
    `);

  if (error) throw error;

  // Filter pathologies within radius
  return pathologies.filter(pathology => {
    const pathologyPoint = turf.point([
      pathology.coordinates.lng,
      pathology.coordinates.lat
    ]);
    const distance = turf.distance(point, pathologyPoint, { units: 'kilometers' });
    return distance <= radius;
  });
}

export async function calculateRoadArea(roadId: string): Promise<{
  area: number;
  perimeter: number;
}> {
  const { data: road, error } = await supabase
    .from('roads')
    .select('coordinates')
    .eq('id', roadId)
    .single();

  if (error) throw error;

  const polygon = turf.polygon([[
    ...road.coordinates.map(coord => [coord.lng, coord.lat]),
    [road.coordinates[0].lng, road.coordinates[0].lat] // Close the polygon
  ]]);

  return {
    area: turf.area(polygon),
    perimeter: turf.length(turf.lineString(polygon.geometry.coordinates[0]), {
      units: 'kilometers'
    })
  };
}

export async function detectCriticalPoints(roadId: string): Promise<{
  intersections: [number, number][];
  sharpTurns: [number, number][];
  steepSlopes: [number, number][];
}> {
  const { data: road, error } = await supabase
    .from('roads')
    .select('coordinates')
    .eq('id', roadId)
    .single();

  if (error) throw error;

  const line = turf.lineString(
    road.coordinates.map(coord => [coord.lng, coord.lat])
  );

  // Find intersections
  const intersections = turf.lineIntersect(line, line).features
    .map(f => f.geometry.coordinates as [number, number]);

  // Find sharp turns (angles > 45 degrees)
  const sharpTurns = road.coordinates.reduce((turns: [number, number][], coord, i) => {
    if (i < 2) return turns;
    const angle = turf.bearing(
      turf.point([road.coordinates[i-2].lng, road.coordinates[i-2].lat]),
      turf.point([road.coordinates[i-1].lng, road.coordinates[i-1].lat]),
      turf.point([coord.lng, coord.lat])
    );
    if (Math.abs(angle) > 45) {
      turns.push([coord.lng, coord.lat]);
    }
    return turns;
  }, []);

  // Find steep slopes (elevation change > 10%)
  const steepSlopes = road.coordinates.reduce((slopes: [number, number][], coord, i) => {
    if (i === 0) return slopes;
    const elevation = coord.elevation || 0;
    const prevElevation = road.coordinates[i-1].elevation || 0;
    const distance = turf.distance(
      turf.point([road.coordinates[i-1].lng, road.coordinates[i-1].lat]),
      turf.point([coord.lng, coord.lat]),
      { units: 'kilometers' }
    );
    const slope = Math.abs(elevation - prevElevation) / (distance * 1000);
    if (slope > 0.1) {
      slopes.push([coord.lng, coord.lat]);
    }
    return slopes;
  }, []);

  return {
    intersections,
    sharpTurns,
    steepSlopes
  };
}