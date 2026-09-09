import { isStreet } from "./sickCityWorld";

export type CityPoint = [number, number, number];
export type VehiclePose = { position: CityPoint; yaw: number; speed: number };
export const HOSPITAL_MEDIC_START: CityPoint = [19, 0, -59];
export const HOSPITAL_AMBULANCE_START: CityPoint = [22, 0, -62];
export const AMBULANCE_START_YAW = -Math.PI / 2;

// Hospital rear garage opens east onto a driveway to the north-south road.
export function isGarageWall(x: number, z: number) {
  return (x > 11.5 && x < 12.5 && z > -68.5 && z < -55.5)
    || (x > 11.5 && x < 32.5 && (Math.abs(z + 68) < .5 || Math.abs(z + 56) < .5));
}

// Roads, the front apron, garage interior, and rear driveway.
export function isDrivingSurface(x: number, z: number, margin = 0) {
  // The low curb can be mounted while maneuvering; buildings remain beyond it.
  return isStreet(x, z, margin - 1.25)
    || (x >= 12 + margin && x <= 32 - margin && z >= -40 + margin && z <= -29 - margin)
    || (x >= 12.6 + Math.max(0, margin) && x <= 40.5 - margin && z >= -67.4 + Math.max(0, margin) && z <= -56.6 - Math.max(0, margin));
}

export function canPlaceAmbulance(x: number, z: number, yaw: number) {
  // Check the complete vehicle footprint, including its front and rear corners.
  return [-1.5, 0, 1.5].every(side => [-3.3, 0, 3.3].every(along =>
    isDrivingSurface(x + Math.cos(yaw) * side - Math.sin(yaw) * along,
      z - Math.sin(yaw) * side - Math.cos(yaw) * along)));
}

export function isInsideAmbulance(x: number, z: number, pose: VehiclePose) {
  const dx = x - pose.position[0], dz = z - pose.position[2];
  return Math.abs(Math.cos(pose.yaw) * dx - Math.sin(pose.yaw) * dz) < 1.7
    && Math.abs(Math.sin(pose.yaw) * dx + Math.cos(pose.yaw) * dz) < 3.5;
}

export function ambulanceExitPosition(pose: VehiclePose): CityPoint | null {
  for (const side of [2.5, -2.5]) {
    const x = pose.position[0] + Math.cos(pose.yaw) * side;
    const z = pose.position[2] - Math.sin(pose.yaw) * side;
    // A small sidewalk allowance makes either side usable next to a curb.
    if (isDrivingSurface(x, z, -1) && !isGarageWall(x, z)) return [x, 0, z];
  }
  return null;
}

export function advanceAmbulance(pose: VehiclePose, input: {
  forward: boolean; backward: boolean; left: boolean; right: boolean; brake?: boolean;
}, elapsed: number): VehiclePose {
  const dt = Math.min(Math.max(elapsed, 0), .05);
  const throttle = Number(input.forward) - Number(input.backward);
  const steering = input.left !== input.right;
  // Slow into tight urban turns so the full ambulance can clear the junction.
  const target = input.brake ? 0 : throttle * (throttle < 0 ? 6 : steering ? 6.5 : 17);
  const damping = input.brake ? 12 : steering ? 5 : throttle === 0 ? 3 : 2;
  let speed = pose.speed + (target - pose.speed) * (1 - Math.exp(-damping * dt));
  if (Math.abs(speed) < .025) speed = 0;
  const turn = (Number(input.left) - Number(input.right))
    * Math.min(Math.abs(speed) / 4, 1) * 1.15 * dt * (speed < 0 ? -1 : 1);
  const yaw = pose.yaw + turn;
  const x = pose.position[0] - Math.sin(yaw) * speed * dt;
  const z = pose.position[2] - Math.cos(yaw) * speed * dt;
  if (!canPlaceAmbulance(x, z, yaw)) return { ...pose, speed: 0 };
  return { position: [x, 0, z], yaw, speed };
}
