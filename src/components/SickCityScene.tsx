import SickCityLayingPatient from "./SickCityLayingPatient";
import SickCityStretcher from './SickCityStretcher';
import { hospitalStretcherPose, HOSPITAL_RECEIVING_BAY, type TransportPhase } from '@/lib/sickCityTransport';
import SickCityPatient from "./SickCityPatient";
import SickCityPatientEquipment from "./SickCityPatientEquipment";
import SickCityCareVisibility from './SickCityCareVisibility';
import SickCityWorldCare from './SickCityWorldCare';
import type { WorldCareTarget, WorldCareEquipment } from '@/lib/sickCityInteraction';
import { patientCareCamera, patientCareTarget } from '@/lib/sickCityCareCamera';
import SickCityStreets from "@/components/SickCityStreets";
import { isCityBuilding } from "@/lib/sickCityWorld";
import SickCityAmbulance from "@/components/SickCityAmbulance";
import { HOSPITAL_MEDIC_START, isGarageWall, isInsideAmbulance, type VehiclePose } from "@/lib/sickCityVehicle";
import { Html } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import SickCityEnvironment from "@/components/SickCityEnvironment";
import SickCityMedic from "@/components/SickCityMedic";
import SickCityPedestrian from "@/components/SickCityPedestrian";
import type { SickCityCall } from "@/lib/sickCity";

export type SickCityMovement = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake?: boolean;
};

type Point = [number, number, number];

export const SICK_CITY_START_POSITION: Point = HOSPITAL_MEDIC_START;


function isBuildingCollision(x: number, z: number) {
  return isGarageWall(x, z) || isCityBuilding(x, z);
}

type SceneProps = {
  transferProgress:number; destination:Point; destinationName:string; transportPhase?:TransportPhase; playerPosition:Point; hidePatient:boolean;
  worldCareTargets?: WorldCareTarget[];
  careEquipment?: WorldCareEquipment;
  careFocus?: Point;
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
  onPlayerMove: (position: Point, viewYaw:number) => void;
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
  transferPhase, transferProgress=0,
  careFocus,
  closeCare,
  spawnFacing,
  ambulancePose,
  active,
  movementEnabled,
  movementRef,
  spawnPosition,
  resetToken,
  onPlayerMove,
}: {
  careFocus?: Point;
  transferPhase?:TransportPhase; transferProgress?:number;
  closeCare?: boolean;
  spawnFacing: number;
  ambulancePose: VehiclePose;
  active: boolean;
  movementEnabled: boolean;
  movementRef: React.MutableRefObject<SickCityMovement>;
  spawnPosition: Point;
  resetToken: number;
  onPlayerMove: (position: Point, viewYaw:number) => void;
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
    const withStretcher=["stretcher","transferring","carrying","boarding"].includes(transferPhase ?? "");
    const chaseDistance=withStretcher?8.5:5.3;
    cameraGoal.current.copy(player.position).addScaledVector(forward.current, -chaseDistance).addScaledVector(right.current, -1.25);
    // Shorten the chase camera before it enters a wall or parked ambulance.
    for (let distance = chaseDistance; distance >= .5; distance -= .4) {
      cameraGoal.current.copy(player.position).addScaledVector(forward.current, -distance).addScaledVector(right.current, -Math.min(.8, distance / 2));
      if (!isBuildingCollision(cameraGoal.current.x, cameraGoal.current.z) && !isInsideAmbulance(cameraGoal.current.x, cameraGoal.current.z, ambulancePose)) break;
    }
    cameraGoal.current.y = player.position.y + (withStretcher?4.8:2.9);
    lookGoal.current.copy(player.position).addScaledVector(forward.current, withStretcher?-1:4.6);
    lookGoal.current.y = player.position.y + 1.45;
    if (careFocus) {
      const point = patientCareCamera(careFocus, [player.position.x,0,player.position.z], camera instanceof THREE.PerspectiveCamera ? camera.aspect : 1);
      if (closeCare) {
        const dx=point[0]-careFocus[0], dz=point[2]-careFocus[2];
        const distance=Math.hypot(dx,dz) || 1;
        // A side view keeps the attending medic out of the patient's silhouette.
        cameraGoal.current.set(careFocus[0]-dz/distance*5.5,careFocus[1]+3.5,careFocus[2]+dx/distance*5.5);
      } else cameraGoal.current.set(...point);
      lookGoal.current.set(...careFocus);
    }
    camera.position.lerp(cameraGoal.current, 1 - Math.exp(-delta * 5.2));
    camera.lookAt(lookGoal.current);

    if (state.clock.elapsedTime - lastReported.current > 0.12) {
      lastReported.current = state.clock.elapsedTime;
      onPlayerMove([player.position.x, 0, player.position.z],yaw.current);
    }
  });

  return (
    <group ref={group} visible={active}>
      <group rotation={[0, Math.PI, 0]}>
        <SickCityMedic transferPhase={transferPhase} transferProgress={transferProgress} movementRef={movementRef} scale={1.1} />
      </group>
    </group>
  );
}

function HospitalHandoffCamera({pose,progress}:{pose:VehiclePose;progress:number}) {
  const look=useMemo(()=>new THREE.Vector3(),[]);
  const goal=useMemo(()=>new THREE.Vector3(),[]);
  useFrame(({camera},delta)=>{
    const patient=hospitalStretcherPose(pose,progress).position;
    look.set((patient[0]+pose.position[0])/2,1.1,(patient[2]+pose.position[2])/2);
    // View from the open apron, above the ambulance roof and below the hospital sign.
    goal.set(look.x+9,9,look.z+11);
    camera.position.lerp(goal,1-Math.exp(-delta*4));
    camera.lookAt(look);
  });
  return null;
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
  const patientRef=useRef<THREE.Group>(null);
  const usesLayingPatient = props.activeCall.id === "park-fall" || props.activeCall.clinicalScenarioId === "hypoglycemia";
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
      <SickCityCareVisibility focus={props.careFocus ?? (props.transportPhase === "handoff" ? hospitalStretcherPose(props.ambulancePose,props.transferProgress).position : undefined)}/>
      <SickCityStreets />
      <SickCityEnvironment />
      <CloudBank />
      <directionalLight position={[24, 14, 18]} color="#91b9ff" intensity={0.8} />

      {props.showDestinationMarker ? <DestinationBeacon position={props.destination} label={props.destinationName} /> : null}

      <group position={props.activeCall.position} visible={!props.hidePatient}>
        {usesLayingPatient ? <SickCityLayingPatient patientRef={patientRef} treated={props.careEquipment?.treated} /> : <SickCityPatient key={props.activeCall.id} patientRef={patientRef} pose={props.activeCall.pose} teen={props.activeCall.clinicalScenarioId === "anaphylaxis"} />}
        {props.careEquipment && <SickCityPatientEquipment patientRef={patientRef} equipment={props.careEquipment}/>}
        {props.worldCareTargets && <Suspense fallback={null}><SickCityWorldCare fallback={patientCareTarget(props.activeCall).map((value,index)=>value-props.activeCall.position[index]) as Point} patientRef={patientRef} targets={props.worldCareTargets}/></Suspense>}
        {props.showPatientMarker ? (
          <PatientInteractionMarker
            label={props.activeCall.code}
            detail={props.activeCall.patientLabel}
            height={usesLayingPatient ? 1.1 : props.activeCall.pose === "supine" ? .9 : props.activeCall.pose === "seated" ? 1.5 : 2.1}
            interactive={props.patientMarkerInteractive}
            onClick={props.onPatientSelect}
          />
        ) : null}
      </group>

      {(['stretcher','transferring','carrying','boarding','handoff'].includes(props.transportPhase ?? '')) && <Suspense fallback={null}><SickCityStretcher position={props.playerPosition} loaded={props.transportPhase !== 'stretcher'} phase={props.transportPhase} progress={props.transferProgress} patientPosition={props.activeCall.position} ambulance={props.ambulancePose} laying={usesLayingPatient} teen={props.activeCall.clinicalScenarioId === 'anaphylaxis'}/></Suspense>}
      {(props.transportPhase === 'transport' || props.transportPhase === 'handoff') && <group position={HOSPITAL_RECEIVING_BAY}>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,.06,0]}><ringGeometry args={[3.7,4,48]}/><meshBasicMaterial color="#78dfbb" transparent opacity={.8}/></mesh>
        <Html center position={[0,2.5,0]}><span className="rounded bg-slate-950/90 px-3 py-2 text-xs text-teal-200 whitespace-nowrap">HOSPITAL · STOP FOR HANDOFF</span></Html>
      </group>}
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

      <SickCityAmbulance cameraEnabled={props.transportPhase !== "handoff"} doorOpen={props.transportPhase === "boarding" ? Math.min(1,props.transferProgress/.2,(1-props.transferProgress)/.15) : props.transportPhase === "handoff" ? Math.min(1,props.transferProgress/.12,(1-props.transferProgress)/.15) : 0} initialPose={props.ambulancePose} occupied={props.inAmbulance} inputEnabled={props.movementEnabled}
        movementRef={props.movementRef} resetToken={props.vehicleResetToken}
        showMarker={!props.inAmbulance && props.movementEnabled && props.transportPhase !== "stretcher" && props.transportPhase !== "carrying"}
        onEnter={props.onAmbulanceEnter} onMove={props.onAmbulanceMove} />
      <Player transferPhase={props.transportPhase} transferProgress={props.transferProgress}
        careFocus={props.careFocus}
        closeCare={Boolean(props.worldCareTargets)}
        ambulancePose={props.ambulancePose}
        active={!props.inAmbulance}
        movementEnabled={props.movementEnabled}
        movementRef={props.movementRef}
        spawnPosition={props.playerSpawn}
        spawnFacing={props.playerFacing}
        resetToken={props.playerResetToken}
        onPlayerMove={props.onPlayerMove}
      />
      {props.transportPhase === "handoff" && <HospitalHandoffCamera pose={props.ambulancePose} progress={props.transferProgress}/>}
    </>
  );
}



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
