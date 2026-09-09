// North-up map: world +X is east/right; world -Z is north/up.
export function mapCoordinate(value: number, center: number) {
  return `${50 + (value - center) / 2}%`;
}

export function mapMarker(x: number, z: number, centerX: number, centerZ: number) {
  const dx = (x - centerX) / 2, dz = (z - centerZ) / 2;
  // Intersect the bearing with the map border instead of clamping each axis.
  const scale = Math.max(1, Math.abs(dx) / 47, Math.abs(dz) / 47);
  return { left: `${50 + dx / scale}%`, top: `${50 + dz / scale}%` };
}

export function mapHeadingDegrees(yaw: number) {
  // CSS rotates clockwise; Three's ambulance yaw rotates counterclockwise.
  return -yaw * 180 / Math.PI;
}
