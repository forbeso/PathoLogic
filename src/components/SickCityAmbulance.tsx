import { isCityBuilding } from "@/lib/sickCityWorld";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import SickCityAmbulanceBody from "./SickCityAmbulanceBody";
import type { SickCityMovement } from "@/components/SickCityScene";
import { isGarageWall, advanceAmbulance, AMBULANCE_START_YAW, HOSPITAL_AMBULANCE_START, type VehiclePose } from "@/lib/sickCityVehicle";

type Props = {
  doorOpen?: number;
  occupied: boolean;
  initialPose?: VehiclePose;
  inputEnabled: boolean;
  movementRef: React.MutableRefObject<SickCityMovement>;
  resetToken: number;
  showMarker: boolean;
  onEnter: () => void;
  onMove: (pose: VehiclePose) => void;
};

export default function SickCityAmbulance({ doorOpen=0, initialPose, occupied, inputEnabled, movementRef, resetToken, showMarker, onEnter, onMove }: Props) {
  const root = useRef<THREE.Group>(null);
  const blue = useRef<THREE.PointLight>(null);
  const red = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  const pose = useRef<VehiclePose>({ position: [...HOSPITAL_AMBULANCE_START], yaw: AMBULANCE_START_YAW, speed: 0 });
  const goal = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const lastReport = useRef(0);
  useEffect(() => {
    pose.current = initialPose ? { ...initialPose, position: [...initialPose.position], speed: 0 } : { position: [...HOSPITAL_AMBULANCE_START], yaw: AMBULANCE_START_YAW, speed: 0 };
    if (root.current) {
      root.current.position.set(...pose.current.position);
      root.current.rotation.y = pose.current.yaw;
    }
    onMove(pose.current);
  // Restore the parked pose on mount/reset, not on every telemetry update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    if (occupied && inputEnabled) pose.current = advanceAmbulance(pose.current, movementRef.current, delta);
    else pose.current = { ...pose.current, speed: 0 };
    const { position, yaw } = pose.current;
    root.current.position.set(...position);
    root.current.rotation.y = yaw;
    const pulse = (Math.sin(clock.elapsedTime * Math.PI) + 1) / 2;
    if (blue.current) blue.current.intensity = 1 + pulse * 5;
    if (red.current) red.current.intensity = 1 + (1 - pulse) * 5;
    if (occupied) {
      // Trace back from the vehicle so nearby buildings cannot hide the camera.
      let cameraDistance = 1;
      for (let distance = 1; distance <= 11; distance += .4) {
        const x = position[0] + Math.sin(yaw) * distance;
        const z = position[2] + Math.cos(yaw) * distance;
        if (isGarageWall(x, z) || isCityBuilding(x, z)) break;
        cameraDistance = distance;
      }
      goal.current.set(position[0] + Math.sin(yaw) * cameraDistance, 3.3 + cameraDistance * .29, position[2] + Math.cos(yaw) * cameraDistance);
      if (goal.current.x > 12 && goal.current.x < 32.5 && goal.current.z > -68.5 && goal.current.z < -55.5) goal.current.y = Math.min(4.5, goal.current.y);
      look.current.set(position[0] - Math.sin(yaw) * 5, 1.6, position[2] - Math.cos(yaw) * 5);
      camera.position.lerp(goal.current, 1 - Math.exp(-Math.min(delta, .05) * 5));
      camera.lookAt(look.current);
    }
    if (clock.elapsedTime - lastReport.current > .08) {
      lastReport.current = clock.elapsedTime;
      onMove(pose.current);
    }
  });
  return <group ref={root} userData={{careFade:true}} position={HOSPITAL_AMBULANCE_START} rotation={[0, AMBULANCE_START_YAW, 0]}>
    <SickCityAmbulanceBody doorOpen={doorOpen}/>
    <pointLight ref={blue} position={[-.73, 2.6, -1.79]} color="#56aaff" distance={9} decay={2} />
    <pointLight ref={red} position={[.73, 2.6, -1.79]} color="#ff735d" distance={9} decay={2} />
    {showMarker && <Html position={[0, 3.8, 0]} center zIndexRange={[18, 4]}>
      <button type="button" onClick={onEnter} className="min-w-36 rounded-lg border border-lime-300/70 bg-slate-950/95 px-4 py-3 text-left text-white shadow-xl">
        <span className="block text-xs font-bold text-lime-200">UNIT 07 · AMBULANCE</span>
        <span className="mt-1 block text-sm">Enter vehicle · E</span>
      </button>
    </Html>}
  </group>;
}
