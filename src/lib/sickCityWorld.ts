// The original medical district sits inside an unbounded, connected street grid.
// Rendering, driving, pedestrian collision and navigation share this layout.
export type StreetAxis = "x" | "z";
export const STREAM_RADIUS = 300;
export const STREAM_STEP = 60;

export function streetCoordinates(axis: StreetAxis, min: number, max: number) {
  const central = axis === "x" ? [-36, 0, 36] : [-34, 0, 34];
  const streets = central.filter(value => value >= min && value <= max);
  for (const sign of [-1, 1]) {
    const low = sign === 1 ? min : -max;
    const high = sign === 1 ? max : -min;
    const first = Math.max(0, Math.ceil((low - 90) / 60));
    const last = Math.floor((high - 90) / 60);
    for (let index = first; index <= last; index++) streets.push(sign * (90 + index * 60));
  }
  return streets.sort((a, b) => a - b);
}

export function streetWidth(coordinate: number) {
  return Math.abs(coordinate) < 90 ? 9 : 12;
}

export function isStreet(x: number, z: number, margin = 0) {
  const reach = 7 + Math.max(0, -margin);
  return streetCoordinates("x", x - reach, x + reach).some(road => Math.abs(x - road) <= streetWidth(road) / 2 - margin)
    || streetCoordinates("z", z - reach, z + reach).some(road => Math.abs(z - road) <= streetWidth(road) / 2 - margin);
}

export type CityBlock = { left: number; right: number; north: number; south: number };
export type NeighborhoodBuilding = { x: number; z: number; width: number; depth: number; height: number; style: number };

export function cityBlocks(centerX: number, centerZ: number, radius: number): CityBlock[] {
  const xs = streetCoordinates("x", centerX - radius - 60, centerX + radius + 60);
  const zs = streetCoordinates("z", centerZ - radius - 60, centerZ + radius + 60);
  return xs.slice(0, -1).flatMap((left, ix) => zs.slice(0, -1).map((north, iz) => ({
    left, right: xs[ix + 1], north, south: zs[iz + 1],
  })));
}

export function blockBuildings(block: CityBlock): NeighborhoodBuilding[] {
  const { left, right, north, south } = block;
  const xs = right - left >= 48 ? [left + 17, right - 17] : [(left + right) / 2];
  const zs = south - north >= 48 ? [north + 17, south - 17] : [(north + south) / 2];
  return xs.flatMap(x => zs.flatMap(z => {
    // Retain the hand-built hospital, park, market and fire station district.
    if (Math.abs(x) < 70 && Math.abs(z) < 70) return [];
    const seed = Math.abs(Math.imul(Math.round(x), 73856093) ^ Math.imul(Math.round(z), 19349663));
    return [{ x, z, width: 10 + seed % 4, depth: 10 + (seed >>> 3) % 4,
      height: 7 + (seed % 5) * 3, style: (seed >>> 5) % 5 }];
  }));
}

export function isNeighborhoodBuilding(x: number, z: number) {
  const xs = streetCoordinates("x", x - 61, x + 61);
  const zs = streetCoordinates("z", z - 61, z + 61);
  const left = xs.filter(value => value <= x).at(-1);
  const right = xs.find(value => value > x);
  const north = zs.filter(value => value <= z).at(-1);
  const south = zs.find(value => value > z);
  if (left === undefined || right === undefined || north === undefined || south === undefined) return false;
  return blockBuildings({ left, right, north, south }).some(building =>
    Math.abs(x - building.x) < building.width / 2 + .4 && Math.abs(z - building.z) < building.depth / 2 + .4);
}


const CENTRAL_BUILDINGS = [
  ...[-54, -18, 54].map(x => [x, -51]),
  ...[-18, 18, 54].map(x => [x, 51]),
  ...[-54, -18, 18, 54].flatMap(x => [-17, 17].map(z => [x, z])),
];

export function isCityBuilding(x: number, z: number) {
  return CENTRAL_BUILDINGS.some(([cx, cz]) => Math.abs(x - cx) < 5.7 && Math.abs(z - cz) < 5.7)
    || (Math.abs(x - 22) < 9.5 && Math.abs(z + 47) < 6.7)
    || (Math.abs(x + 52) < 9.2 && Math.abs(z - 49) < 6.8)
    || isNeighborhoodBuilding(x, z);
}
