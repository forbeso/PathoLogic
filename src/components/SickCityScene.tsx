import SickCityStreets from "@/components/SickCityStreets";
import { isCityBuilding } from "@/lib/sickCityWorld";
import SickCityAmbulance from "@/components/SickCityAmbulance";
import { HOSPITAL_MEDIC_START, isGarageWall, isInsideAmbulance, type VehiclePose } from "@/lib/sickCityVehicle";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import SickCityEnvironment from "@/components/SickCityEnvironment";
import SickCityMedic from "@/components/SickCityMedic";
import SickCityPedestrian from "@/components/SickCityPedestrian";
import type { SickCityCall, SickCityPose } from "@/lib/sickCity";

export type SickCityMovement = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake?: boolean;
};

type Point = [number, number, number];

export const SICK_CITY_START_POSITION: Point = HOSPITAL_MEDIC_START;

const LAYING_PATIENT_URL = "/models/sickcity/patients/laying-moaning.glb";

function isBuildingCollision(x: number, z: number) {
  return isGarageWall(x, z) || isCityBuilding(x, z);
}

type SceneProps = {
  inAmbulance: boolean;
  ambulancePose: VehiclePose;
  vehicleResetToken: number;
  onAmbulanceEnter: () => void;
  onAmbulanceMove: (pose: VehiclePose) => void;
  activeCall: SickCityCall;
  movementRef: React.MutableRefObject<SickCityMovement>;
  playerSpawn: Point;
  playerFacing: number;
  playerResetToken: number;
  movementEnabled: boolean;
  showDestinationMarker: boolean;
  showPatientMarker: boolean;
  patientMarkerInteractive: boolean;
  onPlayerMove: (position: Point) => void;
  onPatientSelect: () => void;
};

function ClickMarker({
  label,
  detail,
  tone = "teal",
  disabled = false,
  onClick,
}: {
  label: string;
  detail: string;
  tone?: "teal" | "amber";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Html center distanceFactor={9} zIndexRange={[18, 4]} style={{ pointerEvents: "auto" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          onClick();
        }}
        className={`group relative min-w-[132px] rounded-md border px-3 py-2 text-left text-white shadow-xl backdrop-blur-md transition focus:outline-none focus:ring-2 focus:ring-white/80 ${disabled ? "cursor-default" : "hover:-translate-y-0.5"} ${
          tone === "amber"
            ? "border-amber-300/80 bg-amber-950/90"
            : "border-teal-300/80 bg-[#082129]/92"
        }`}
      >
        <span className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 motion-safe:animate-ping ${tone === "amber" ? "border-amber-300" : "border-teal-300"}`} />
        <span className={`block text-[10px] font-black uppercase tracking-[0.18em] ${tone === "amber" ? "text-amber-300" : "text-teal-300"}`}>
          {label}
        </span>
        <span className="mt-0.5 block text-xs font-semibold leading-snug text-white">{detail}</span>
      </button>
    </Html>
  );
}

function PatientInteractionMarker({
  label,
  detail,
  height,
  interactive,
  onClick,
}: {
  label: string;
  detail: string;
  height: number;
  interactive: boolean;
  onClick: () => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3.4) * 0.1;
    if (ring.current) ring.current.scale.set(pulse, pulse * 1.35, 1);
    if (glow.current) {
      const glowPulse = 0.96 + Math.sin(state.clock.elapsedTime * 3.4) * 0.08;
      glow.current.scale.set(glowPulse, glowPulse * 1.35, 1);
    }
    if (light.current) light.current.intensity = 1.15 + Math.sin(state.clock.elapsedTime * 3.4) * 0.28;
  });

  return (
    <group>
      <mesh ref={glow} position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[1.45, 40]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <ringGeometry args={[1.18, 1.42, 40]} />
        <meshBasicMaterial color="#fcd34d" transparent opacity={0.94} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={light} position={[0, 0.7, 0]} color="#fbbf24" distance={5.5} intensity={1.15} />
      <group position={[0, height, 0]}>
        <ClickMarker label={label} detail={detail} tone="amber" disabled={!interactive} onClick={onClick} />
      </group>
    </group>
  );
}

function Patient({ pose, color }: { pose: SickCityPose; color: string }) {
  const upperBody = (
    <>
      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.9, 5, 12]} />
        <meshStandardMaterial color={color} roughness={0.84} />
      </mesh>
      <mesh position={[0, 2.24, 0]} castShadow>
        <sphereGeometry args={[0.39, 16, 12]} />
        <meshStandardMaterial color="#bd815c" roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.43, -0.04]} scale={[1.03, 0.55, 1.02]} castShadow>
        <sphereGeometry args={[0.39, 12, 8]} />
        <meshStandardMaterial color="#31251f" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`arm-${side}`} position={[side * 0.48, 1.28, 0]} rotation={[0, 0, side * 0.08]} castShadow>
          <capsuleGeometry args={[0.1, 0.78, 4, 8]} />
          <meshStandardMaterial color="#bd815c" roughness={0.82} />
        </mesh>
      ))}
    </>
  );
  const straightLegs = (
    <>
      {[-1, 1].map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.19, 0.44, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.7, 4, 8]} />
          <meshStandardMaterial color="#273750" roughness={0.86} />
        </mesh>
      ))}
    </>
  );
  const standingBody = <>{upperBody}{straightLegs}</>;

  if (pose === "supine") {
    return <group position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>{standingBody}</group>;
  }
  if (pose === "seated") {
    return (
      <group>
        <group position={[0, 0.2, 0]}>{upperBody}</group>
        {[-1, 1].map((side) => (
          <group key={`seated-leg-${side}`}>
            <mesh position={[side * 0.2, 0.62, 0.42]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <capsuleGeometry args={[0.13, 0.54, 4, 8]} />
              <meshStandardMaterial color="#273750" roughness={0.86} />
            </mesh>
            <mesh position={[side * 0.2, 0.24, 0.92]} rotation={[0.16, 0, 0]} castShadow>
              <capsuleGeometry args={[0.13, 0.52, 4, 8]} />
              <meshStandardMaterial color="#273750" roughness={0.86} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  return <group>{standingBody}</group>;
}

function LayingMoaningPatient() {
  const source = useGLTF(LAYING_PATIENT_URL);
  const model = useMemo(() => clone(source.scene), [source.scene]);
  const animations = useMemo(
    () =>
      source.animations.map((sourceClip) => {
        const clip = sourceClip.clone();
        clip.tracks.forEach((track) => {
          if (!(track instanceof THREE.VectorKeyframeTrack) || !track.name.endsWith("Hips.position")) return;
          const startX = track.values[0];
          // Blender armature: local Z is vertical; X/Y carry planar root motion.
          const startY = track.values[1];
          for (let index = 0; index < track.values.length; index += 3) {
            track.values[index] = startX;
            track.values[index + 1] = startY;
          }
        });
        return clip;
      }),
    [source.animations]
  );
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const action = names.length > 0 ? actions[names[0]] : undefined;

  useLayoutEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if ("map" in material && material.map instanceof THREE.Texture) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.map.needsUpdate = true;
        }
      });
    });
  }, [model]);

  useEffect(() => {
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    return () => {
      action.stop();
    };
  }, [action]);

  return (
    <group ref={root} position={[0, -0.87, 0]} scale={0.5} rotation={[0, Math.PI * 0.12, 0]}>
      <primitive object={model} />
    </group>
  );
}

function DestinationBeacon({ position, label }: { position: Point; label: string }) {
  const ring = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.16;
    if (ring.current) ring.current.scale.setScalar(pulse);
    if (light.current) light.current.intensity = 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.35;
  });
  return (
    <group position={position}>
      <mesh ref={ring} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.7, 32]} />
        <meshBasicMaterial color="#f6c84f" transparent opacity={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.045, 0.18, 6, 10]} />
        <meshBasicMaterial color="#f6c84f" transparent opacity={0.28} />
      </mesh>
      <pointLight ref={light} position={[0, 1, 0]} color="#ffc94c" distance={9} intensity={1.2} />
      <Html position={[0, 4.7, 0]} center distanceFactor={16} zIndexRange={[2, 0]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded border border-amber-300/70 bg-amber-950/88 px-3 py-2 text-center text-white shadow-xl backdrop-blur-md">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">Dispatch waypoint</p>
          <p className="mt-0.5 text-xs font-bold">{label}</p>
        </div>
      </Html>
    </group>
  );
}

function Player({
  spawnFacing,
  ambulancePose,
  active,
  movementEnabled,
  movementRef,
  spawnPosition,
  resetToken,
  onPlayerMove,
}: {
  spawnFacing: number;
  ambulancePose: VehiclePose;
  active: boolean;
  movementEnabled: boolean;
  movementRef: React.MutableRefObject<SickCityMovement>;
  spawnPosition: Point;
  resetToken: number;
  onPlayerMove: (position: Point) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const cameraGoal = useRef(new THREE.Vector3());
  const lookGoal = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const dragging = useRef(false);
  const previousPointerX = useRef(0);
  const lastReported = useRef(0);

  useEffect(() => {
    if (!group.current) return;
    yaw.current = spawnFacing;
    group.current.position.set(...spawnPosition);
    camera.position.set(spawnPosition[0] - Math.sin(spawnFacing) * 5.6, 3.05, spawnPosition[2] + Math.cos(spawnFacing) * 5.6);
  }, [camera, resetToken, spawnPosition, spawnFacing]);

  useEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    const originalCursor = canvas.style.cursor;
    const originalTouchAction = canvas.style.touchAction;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging.current = true;
      previousPointerX.current = event.clientX;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture?.(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      const deltaX = event.clientX - previousPointerX.current;
      previousPointerX.current = event.clientX;
      yaw.current += deltaX * 0.0055;
    };
    const handlePointerUp = (event: PointerEvent) => {
      dragging.current = false;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture?.(event.pointerId);
    };
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    return () => {
      canvas.style.cursor = originalCursor;
      canvas.style.touchAction = originalTouchAction;
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [active, gl]);

  useFrame((state, delta) => {
    const player = group.current;
    if (!player || !active) return;
    const input = movementEnabled ? movementRef.current : { forward: false, backward: false, left: false, right: false };
    delta = Math.min(delta, 0.05);
    const forwardAmount = Number(input.forward) - Number(input.backward);
    const rightAmount = Number(input.right) - Number(input.left);
    forward.current.set(Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    right.current.set(Math.cos(yaw.current), 0, Math.sin(yaw.current));
    velocity.current.set(0, 0, 0).addScaledVector(forward.current, forwardAmount).addScaledVector(right.current, rightAmount);

    const isMoving = velocity.current.lengthSq() > 0;
    if (isMoving) {
      velocity.current.normalize();
      const nextX = player.position.x + velocity.current.x * delta * 6.2;
      const nextZ = player.position.z + velocity.current.z * delta * 6.2;
      if (!isBuildingCollision(nextX, player.position.z) && !isInsideAmbulance(nextX, player.position.z, ambulancePose)) player.position.x = nextX;
      if (!isBuildingCollision(player.position.x, nextZ) && !isInsideAmbulance(player.position.x, nextZ, ambulancePose)) player.position.z = nextZ;

      player.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.045;
    } else {
      player.position.y = THREE.MathUtils.lerp(player.position.y, 0, Math.min(1, delta * 8));
    }

    const desiredRotation = isMoving ? Math.atan2(-velocity.current.x, -velocity.current.z) : -yaw.current;
    const rotationDelta = Math.atan2(Math.sin(desiredRotation - player.rotation.y), Math.cos(desiredRotation - player.rotation.y));
    player.rotation.y += rotationDelta * (1 - Math.exp(-delta * 13));
    cameraGoal.current.copy(player.position).addScaledVector(forward.current, -5.3).addScaledVector(right.current, -1.25);
    // Shorten the chase camera before it enters a wall or parked ambulance.
    for (let distance = 5.3; distance >= .5; distance -= .4) {
      cameraGoal.current.copy(player.position).addScaledVector(forward.current, -distance).addScaledVector(right.current, -Math.min(.8, distance / 2));
      if (!isBuildingCollision(cameraGoal.current.x, cameraGoal.current.z) && !isInsideAmbulance(cameraGoal.current.x, cameraGoal.current.z, ambulancePose)) break;
    }
    cameraGoal.current.y = player.position.y + 2.9;
    lookGoal.current.copy(player.position).addScaledVector(forward.current, 4.6);
    lookGoal.current.y = player.position.y + 1.45;
    camera.position.lerp(cameraGoal.current, 1 - Math.exp(-delta * 5.2));
    camera.lookAt(lookGoal.current);

    if (state.clock.elapsedTime - lastReported.current > 0.12) {
      lastReported.current = state.clock.elapsedTime;
      onPlayerMove([player.position.x, 0, player.position.z]);
    }
  });

  return (
    <group ref={group} visible={active}>
      <group rotation={[0, Math.PI, 0]}>
        <SickCityMedic movementRef={movementRef} scale={1.1} />
      </group>
    </group>
  );
}

function CloudBank() {
  const clouds = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!clouds.current) return;
    clouds.current.position.x += delta * 0.18;
    if (clouds.current.position.x > 75) clouds.current.position.x = -75;
  });
  return (
    <group ref={clouds}>
      {[
        [-46, 20, -56], [-8, 17, -61], [38, 21, -54],
        [-58, 18, 18], [56, 19, 12], [-36, 20, 58], [30, 18, 61],
      ].map((position, index) => (
        <group key={index} position={position as Point} scale={0.72 + (index % 3) * 0.14}>
          <mesh><sphereGeometry args={[2.8, 12, 8]} /><meshStandardMaterial color="#d6bbd2" roughness={1} /></mesh>
          <mesh position={[2.4, -0.35, 0]}><sphereGeometry args={[1.8, 12, 8]} /><meshStandardMaterial color="#b8afca" roughness={1} /></mesh>
          <mesh position={[-2.25, -0.4, 0]}><sphereGeometry args={[1.7, 12, 8]} /><meshStandardMaterial color="#b8afca" roughness={1} /></mesh>
        </group>
      ))}
    </group>
  );
}

function GradientSky() {
  const sky = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => { if (sky.current) sky.current.position.copy(camera.position); });
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color("#202d58") },
      horizonColor: { value: new THREE.Color("#e6a889") },
    }),
    []
  );

  return (
    <mesh ref={sky} renderOrder={-1000}>
      <sphereGeometry args={[350, 36, 20]} />
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vWorldPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 horizonColor;
          varying vec3 vWorldPosition;
          void main() {
            float heightMix = smoothstep(0.0, 0.72, clamp(normalize(vWorldPosition).y, 0.0, 1.0));
            gl_FragColor = vec4(mix(horizonColor, topColor, heightMix), 1.0);
          }
        `}
      />
    </mesh>
  );
}

function CitySun() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ camera }) => {
    if (!sun.current) return;
    target.position.set(camera.position.x, 0, camera.position.z);
    sun.current.position.set(camera.position.x - 42, 32, camera.position.z - 38);
    target.updateMatrixWorld();
  });
  return <><primitive object={target} /><directionalLight ref={sun} target={target}
    position={[-42, 32, -38]} intensity={2.4} color="#ffb67d" castShadow
    shadow-mapSize={[1024, 1024]} shadow-camera-left={-64} shadow-camera-right={64}
    shadow-camera-top={64} shadow-camera-bottom={-64} shadow-camera-far={180} shadow-normalBias={.12} /></>;
}

function World(props: SceneProps) {
  const usesLayingPatient = props.activeCall.id === "park-fall";
  const pedestrianPlacements = useMemo(() => [
    { url: "/models/sickcity/pedestrians/pedestrian-walking-1.glb", position: [-58, 0.1, -6.2] as Point, speed: 1.2, minX: -58, maxX: 25 },
    { url: "/models/sickcity/pedestrians/pedestrian-walking-2.glb", position: [-34, 0.1, 28.6] as Point, speed: 0.95, minX: -34, maxX: 32 },
    { url: "/models/sickcity/pedestrians/pedestrian-walking-1.glb", position: [4, 0.1, -39.4] as Point, speed: 1.05, minX: 4, maxX: 62 },
    { url: "/models/sickcity/pedestrians/pedestrian-walking-3.glb", position: [-62, 0.1, 39.4] as Point, speed: 1, minX: -62, maxX: -8 },
  ], []);

  return (
    <>
      <color attach="background" args={["#bc9292"]} />
      <fog attach="fog" args={["#ad94a6", 88, 172]} />
      <GradientSky />
      <hemisphereLight args={["#a1bafa", "#414d3d", 1.25]} />
      <ambientLight intensity={0.6} />
      <CitySun />
      <SickCityStreets />
      <SickCityEnvironment />
      <CloudBank />
      <directionalLight position={[24, 14, 18]} color="#91b9ff" intensity={0.8} />

      {props.showDestinationMarker ? <DestinationBeacon position={props.activeCall.position} label={props.activeCall.location} /> : null}

      <group position={props.activeCall.position}>
        {usesLayingPatient ? <LayingMoaningPatient /> : <Patient pose={props.activeCall.pose} color={props.activeCall.shirtColor} />}
        {props.showPatientMarker ? (
          <PatientInteractionMarker
            label={props.activeCall.code}
            detail={props.activeCall.patientLabel}
            height={usesLayingPatient ? 1.1 : props.activeCall.pose === "supine" ? 1.9 : 3.3}
            interactive={props.patientMarkerInteractive}
            onClick={props.onPatientSelect}
          />
        ) : null}
      </group>

      {pedestrianPlacements.map((pedestrian, index) => (
        <SickCityPedestrian
          key={`${pedestrian.url}-${index}`}
          url={pedestrian.url}
          position={pedestrian.position}
          walking
          direction={1}
          speed={pedestrian.speed}
          minX={pedestrian.minX}
          maxX={pedestrian.maxX}
        />
      ))}
      <SickCityPedestrian
        url="/models/sickcity/pedestrians/pedestrian-standing.glb"
        position={[-23, 0.1, -6.25]}
        modelRotation={0}
        animate
      />
      <SickCityPedestrian
        url="/models/sickcity/pedestrians/pedestrian-standing.glb"
        position={[28, 0.1, 28.75]}
        modelRotation={Math.PI}
        animate
      />

      <SickCityAmbulance occupied={props.inAmbulance} inputEnabled={props.movementEnabled}
        movementRef={props.movementRef} resetToken={props.vehicleResetToken}
        showMarker={!props.inAmbulance && props.movementEnabled}
        onEnter={props.onAmbulanceEnter} onMove={props.onAmbulanceMove} />
      <Player
        ambulancePose={props.ambulancePose}
        active={!props.inAmbulance}
        movementEnabled={props.movementEnabled}
        movementRef={props.movementRef}
        spawnPosition={props.playerSpawn}
        spawnFacing={props.playerFacing}
        resetToken={props.playerResetToken}
        onPlayerMove={props.onPlayerMove}
      />
    </>
  );
}

useGLTF.preload(LAYING_PATIENT_URL);

function SceneLoading() {
  return (
    <Html center>
      <div className="w-48 rounded-md border border-teal-300/35 bg-[#061a22]/95 px-4 py-3 text-center text-white shadow-2xl backdrop-blur-xl">
        <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" />
        <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">Building SickCity</span>
        <span className="mt-1 block text-[10px] text-slate-400">Loading streets, crews, and dispatches</span>
      </div>
    </Html>
  );
}

export default function SickCityScene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.4]}
      camera={{ position: [-54, 3.05, 12.6], fov: 59, near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <color attach="background" args={["#202d58"]} />
      <Suspense fallback={<SceneLoading />}>
        <World {...props} />
      </Suspense>
    </Canvas>
  );
}
