import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, Sky, SoftShadows, Text, useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type Ref, type RefObject } from "react";
import * as THREE from "three";
import type { Group } from "three";
// import { EMTCharacter } from "@/components/EMTCharacter";

import type { InteractiveObjectConfig, ScenarioState } from "@/lib/emtSceneEngine";
import { MoveLeft, MoveRight, ZoomIn, ZoomOut } from "lucide-react";
import { Model as BushModel } from "@/components/worldassets/Bush02";
import { Model as GrassModel } from "@/components/worldassets/SmallGrass01";
import { Model as PalmTreeModel } from "@/components/worldassets/PalmTree02";
import { Model as Stone04Model } from "@/components/worldassets/Stone04";
import { Model as Stone05Model } from "@/components/worldassets/Stone05";
import { Model as TerrainGrassModel } from "@/components/worldassets/TerrainGrass01";
import { Model as Tree01ArtModel } from "@/components/worldassets/Tree01_Art";
import { Model as Tree02Model } from "@/components/worldassets/Tree02";
import { Model as Tree03Model } from "@/components/worldassets/Tree03";
import { Model as Tree04Model } from "@/components/worldassets/Tree04";
import {
  CustomAmbulanceModel,
  CustomFirstAidBagModel,
  CustomPatientModel,
  DownloadedBigBuildingModel,
  DownloadedBenchModel,
  DownloadedBuildingModel,
  DownloadedConeModel,
  DownloadedGroundPlatformModel,
  DownloadedGrassModel,
  DownloadedLargeBuildingModel,
  DownloadedMossyRockModel,
  DownloadedParamedicGuideModel,
  DownloadedRockModel,
  DownloadedScaffoldingModel,
  DownloadedSmallBuildingModel,
  DownloadedTerrainGroundGrassModel,
  DownloadedTerrainGroundModel,
  DownloadedTerrainGroundRightModel,
  DownloadedTerrainSandModel,
  DownloadedWindmillModel,
} from "@/components/worldassets/CustomSceneAssets";

type ThreeDSceneProps = {
  height?: number;
  scenarioId?: SceneVariant | string;
  intervention?: InterventionState;
  patientState?: PatientState;
  sceneFinding?: string;
  sceneSpeaker?: "coach" | "patient";
  interactiveObjects?: SceneInteractiveObject[];
  selectedObjectId?: string;
  focusedObjectId?: string;
  accessibilityMode?: boolean;
  environment?: ScenarioState["environment"];
  locationId?: ScenarioState["locationId"];
  inventory?: string[];
  onObjectSelect?: (objectId: string) => void;
};

type Vec3 = [number, number, number];
type SceneVariant = "anaphylaxis" | "spine" | "chest-pain";
type InterventionState = "none" | "oxygen" | "positioning" | "medication";
type PatientState = "stable" | "distressed" | "improving" | "critical";
type SceneInteractiveObject = InteractiveObjectConfig & {
  enabled?: boolean;
  completed?: boolean;
  disabledReason?: string;
};

const SCENE_HTML_Z_INDEX_RANGE: [number, number] = [8, 0];
const NORMAL_CAMERA_POSITION: Vec3 = [8.55, 2.75, 7.72];
const NORMAL_CAMERA_TARGET: Vec3 = [1.1, 1.05, -2.1];
const NORMAL_CAMERA_DISTANCE = Math.hypot(
  NORMAL_CAMERA_POSITION[0] - NORMAL_CAMERA_TARGET[0],
  NORMAL_CAMERA_POSITION[1] - NORMAL_CAMERA_TARGET[1],
  NORMAL_CAMERA_POSITION[2] - NORMAL_CAMERA_TARGET[2]
);
const CAMERA_MIN_DISTANCE = 4.6;
const CAMERA_MAX_DISTANCE = 18.5;
const CAMERA_MIN_POLAR_ANGLE = 0.78;
const CAMERA_MAX_POLAR_ANGLE = 1.55;
const CAMERA_DEFAULT_AZIMUTH = Math.atan2(
  NORMAL_CAMERA_POSITION[0] - NORMAL_CAMERA_TARGET[0],
  NORMAL_CAMERA_POSITION[2] - NORMAL_CAMERA_TARGET[2]
);
const CAMERA_AZIMUTH_RANGE = 1.35;
const GUIDE_PARAMEDIC_POSITION: Vec3 = [0.35, 0.05, 0.95];
const GUIDE_PARAMEDIC_MODEL_SCALE = 0.9;
const GUIDE_PARAMEDIC_CAMERA_POSITION: Vec3 = [2.35, 1.88, 4.05];
const GUIDE_PARAMEDIC_CAMERA_TARGET: Vec3 = [0.35, 1.3, 0.95];
const MOBILE_GUIDE_PARAMEDIC_ROTATION_Y = 0;
const MOBILE_GUIDE_CAMERA_POSITION: Vec3 = [0.35, 1.54, 2.92];
const MOBILE_GUIDE_CAMERA_TARGET: Vec3 = [0.35, 1.32, 0.95];
const MOBILE_NORMAL_CAMERA_POSITION: Vec3 = [6.7, 2.58, 7.65];
const MOBILE_NORMAL_CAMERA_TARGET: Vec3 = [1.45, 0.95, -1.15];

type GuideStep = "welcome" | "name" | "named" | "done" | "soon";
type CameraMode = "guide" | "normal" | "free";

function normalizeSceneVariant(scenarioId?: string): SceneVariant {
  if (scenarioId === "spine" || scenarioId === "chest-pain") return scenarioId;
  return "anaphylaxis";
}


function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type ScatterItem = {
  position: Vec3;
  rotation: number;
  scale: number;
};

function createScatter(
  count: number,
  seed: number,
  minRadius: number,
  maxRadius: number,
  y = 0.03
): ScatterItem[] {
  const random = seededRandom(seed);
  const items: ScatterItem[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = minRadius + Math.sqrt(random()) * (maxRadius - minRadius);
    items.push({
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
      rotation: random() * Math.PI * 2,
      scale: 0.65 + random() * 0.85,
    });
  }

  return items;
}

function GrassTufts() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => createScatter(150, 73, 7.2, 31, 0.14), []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    items.forEach((item, index) => {
      position.set(...item.position);
      euler.set(0, item.rotation, (index % 3 - 1) * 0.08);
      quaternion.setFromEuler(euler);
      scale.set(item.scale, 0.8 + item.scale * 0.6, item.scale);
      matrix.compose(position, quaternion, scale);
      ref.current?.setMatrixAt(index, matrix);
    });

    ref.current.instanceMatrix.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow receiveShadow>
      <coneGeometry args={[0.055, 0.34, 5]} />
      <meshStandardMaterial color="#66875e" roughness={1} />
    </instancedMesh>
  );
}

function GroundPebbles() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => createScatter(46, 121, 0.8, 6.8, 0.055), []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    items.forEach((item, index) => {
      position.set(...item.position);
      euler.set(item.rotation * 0.3, item.rotation, item.rotation * 0.2);
      quaternion.setFromEuler(euler);
      scale.set(item.scale * 0.12, item.scale * 0.05, item.scale * 0.09);
      matrix.compose(position, quaternion, scale);
      ref.current?.setMatrixAt(index, matrix);
    });

    ref.current.instanceMatrix.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#7d6b55" roughness={1} />
    </instancedMesh>
  );
}

function Tree({ position, scale = 1, tint = "#5f7f58" }: { position: Vec3; scale?: number; tint?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.23, 2.5, 9]} />
        <meshStandardMaterial color="#72573f" roughness={1} />
      </mesh>
      <mesh position={[0, 2.65, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color={tint} roughness={0.95} />
      </mesh>
      <mesh position={[-0.75, 2.35, 0.2]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.78, 1]} />
        <meshStandardMaterial color="#6f8e62" roughness={0.95} />
      </mesh>
      <mesh position={[0.7, 2.32, -0.16]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.82, 1]} />
        <meshStandardMaterial color="#587950" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Shrub({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[-0.34, 0.34, 0]} castShadow>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color="#68845d" roughness={1} />
      </mesh>
      <mesh position={[0.16, 0.42, -0.08]} castShadow>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color="#58784f" roughness={1} />
      </mesh>
      <mesh position={[0.53, 0.3, 0.05]} castShadow>
        <icosahedronGeometry args={[0.36, 1]} />
        <meshStandardMaterial color="#78956a" roughness={1} />
      </mesh>
    </group>
  );
}

function WorldTree({ position, scale = 1, variant = 0 }: { position: Vec3; scale?: number; variant?: number }) {
  // Exclude palms from the main mixed tree pool so we can place fewer, controlled palms
  const treeModels = [Tree02Model, Tree03Model, Tree04Model];
  const Asset = treeModels[variant % treeModels.length];

  return <Asset position={position} scale={scale} />;
}

function WorldBush({ position, scale = 1, variant = 0 }: { position: Vec3; scale?: number; variant?: number }) {
  const Asset = BushModel;

  return <Asset position={position} scale={scale} />;
}

function WorldGrass({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return <GrassModel position={position} scale={scale} />;
}

function WorldStone({ position, scale = 1, variant = 0 }: { position: Vec3; scale?: number; variant?: number }) {
  const Asset = variant % 2 === 0 ? Stone04Model : Stone05Model;

  return <Asset position={position} scale={scale} />;
}

function DistantBooth({ position, color }: { position: Vec3; color: string }) {
  return (
    <group position={position} scale={0.9}>
      <mesh position={[0, 1.9, 0]} castShadow>
        <coneGeometry args={[1.65, 0.72, 4]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {[
        [-1.05, 0.92, -0.95],
        [1.05, 0.92, -0.95],
        [-1.05, 0.92, 0.95],
        [1.05, 0.92, 0.95],
      ].map((positionValue, index) => (
        <mesh key={index} position={positionValue as Vec3} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.84, 8]} />
          <meshStandardMaterial color="#d7ddd7" metalness={0.1} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.9, 1.25]} />
        <meshStandardMaterial color="#9b704d" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Bunting() {
  const flags = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        x: -6.3 + index * 1.15,
        y: 4.45 - Math.sin((index / 11) * Math.PI) * 0.35,
        color: ["#d97757", "#e0b45e", "#6d9b8c"][index % 3],
      })),
    []
  );

  return (
    <group position={[0, 0, -9.4]}>
      <mesh position={[0, 4.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 13.2, 12]} />
        <meshStandardMaterial color="#66584b" roughness={1} />
      </mesh>
      {flags.map((flag, index) => (
        <mesh key={index} position={[flag.x, flag.y - 0.17, 0]} rotation={[0, 0, Math.PI]} castShadow>
          <coneGeometry args={[0.14, 0.34, 3]} />
          <meshStandardMaterial color={flag.color} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}


function CloudCluster({
  position,
  scale = 1,
  drift = 0.02,
  driftVector = [1, 0, 0],
  phase = 0,
}: {
  position: Vec3;
  scale?: number;
  drift?: number;
  driftVector?: Vec3;
  phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * drift + phase;
    ref.current.position.x = position[0] + Math.sin(t) * driftVector[0];
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * driftVector[1];
    ref.current.position.z = position[2] + Math.cos(t * 0.82) * driftVector[2];
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow={false}>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.92} roughness={1} />
      </mesh>
      <mesh position={[0.78, 0.12, 0.06]} castShadow={false}>
        <sphereGeometry args={[0.62, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.92} roughness={1} />
      </mesh>
      <mesh position={[-0.72, 0.05, 0.02]} castShadow={false}>
        <sphereGeometry args={[0.58, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.9} roughness={1} />
      </mesh>
      <mesh position={[0.08, 0.28, -0.08]} castShadow={false}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} roughness={1} />
      </mesh>
    </group>
  );
}

function Birds() {
  const flock = useRef<THREE.Group>(null);
  const birds = useMemo(
    () => [
      { position: [-4.6, 7.9, -17.5] as Vec3, scale: 0.55, phase: 0 },
      { position: [-3.5, 8.2, -18.3] as Vec3, scale: 0.45, phase: 0.7 },
      { position: [-2.2, 7.7, -17.1] as Vec3, scale: 0.5, phase: 1.1 },
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!flock.current) return;
    const t = clock.getElapsedTime();
    flock.current.children.forEach((child, index) => {
      child.position.y = birds[index].position[1] + Math.sin(t * 2.4 + birds[index].phase) * 0.06;
      child.rotation.z = Math.sin(t * 4.8 + birds[index].phase) * 0.12;
    });
  });

  return (
    <group ref={flock}>
      {birds.map((bird, index) => (
        <group key={index} position={bird.position} scale={bird.scale}>
          <mesh position={[-0.16, 0, 0]} rotation={[0, 0, 0.42]}>
            <boxGeometry args={[0.34, 0.04, 0.02]} />
            <meshStandardMaterial color="#334155" roughness={1} />
          </mesh>
          <mesh position={[0.16, 0, 0]} rotation={[0, 0, -0.42]}>
            <boxGeometry args={[0.34, 0.04, 0.02]} />
            <meshStandardMaterial color="#334155" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Aircraft() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.22;
    ref.current.position.x = -18 + (t % 36);
    ref.current.position.y = 8.95 + Math.sin(t * 0.8) * 0.12;
  });

  return (
    <group ref={ref} position={[-14, 9, -24]} rotation={[0, 0.2, -0.08]} scale={0.42}>
      <mesh>
        <boxGeometry args={[2.2, 0.14, 0.18]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.5, 0.06, 1.35]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      <mesh position={[0.8, 0.12, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.45, 0.06, 0.55]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      <mesh position={[-0.95, 0.2, 0]} rotation={[0, 0, -0.65]}>
        <boxGeometry args={[0.34, 0.06, 0.38]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
    </group>
  );
}


type TownBuildingSpec = {
  position: Vec3;
  size: Vec3;
  color: string;
  roofColor: string;
  roof?: "flat" | "pitched";
};

function TownBuilding({ position, size, color, roofColor, roof = "flat" }: TownBuildingSpec) {
  const [width, height, depth] = size;
  const floors = Math.max(1, Math.floor(height / 0.75));
  const windowRows = Array.from({ length: Math.min(floors, 4) }, (_, index) => index);

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>

      {roof === "pitched" ? (
        <mesh
          position={[0, height + 0.28, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[width * 0.68, 1, depth * 0.68]}
        >
          <coneGeometry args={[1, 0.58, 4]} />
          <meshStandardMaterial color={roofColor} roughness={0.98} />
        </mesh>
      ) : (
        <mesh position={[0, height + 0.08, 0]}>
          <boxGeometry args={[width * 1.04, 0.16, depth * 1.04]} />
          <meshStandardMaterial color={roofColor} roughness={0.96} />
        </mesh>
      )}

      {windowRows.map((row) => {
        const y = 0.46 + row * 0.67;
        return (
          <group key={row}>
            <mesh position={[-width * 0.23, y, depth / 2 + 0.012]}>
              <boxGeometry args={[width * 0.22, 0.19, 0.025]} />
              <meshStandardMaterial color="#607487" roughness={0.45} />
            </mesh>
            <mesh position={[width * 0.23, y, depth / 2 + 0.012]}>
              <boxGeometry args={[width * 0.22, 0.19, 0.025]} />
              <meshStandardMaterial color="#607487" roughness={0.45} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function DistantTown() {
  const buildings = useMemo<TownBuildingSpec[]>(
    () => [
      { position: [-15.8, 0, 0.9], size: [2.2, 2.7, 2.0], color: "#b9aa98", roofColor: "#775f56", roof: "pitched" },
      { position: [-13.1, 0, -0.3], size: [1.7, 4.4, 1.8], color: "#9da7ad", roofColor: "#68737a" },
      { position: [-10.7, 0, 0.6], size: [2.4, 3.1, 2.0], color: "#c0ad91", roofColor: "#875f4b", roof: "pitched" },
      { position: [-7.7, 0, -0.2], size: [2.1, 5.2, 2.1], color: "#9ba3a8", roofColor: "#626d73" },
      { position: [-4.9, 0, 0.8], size: [2.6, 3.7, 2.2], color: "#b7a997", roofColor: "#7c6256", roof: "pitched" },
      { position: [-1.7, 0, -0.5], size: [2.0, 6.1, 2.1], color: "#8f9ba2", roofColor: "#5f6b72" },
      { position: [1.1, 0, 0.4], size: [2.4, 4.1, 2.0], color: "#b1a38f", roofColor: "#755b50", roof: "pitched" },
      { position: [4.2, 0, -0.2], size: [2.1, 5.4, 2.2], color: "#96a2a9", roofColor: "#606b72" },
      { position: [7.0, 0, 0.8], size: [2.7, 3.4, 2.0], color: "#bcae99", roofColor: "#826257", roof: "pitched" },
      { position: [10.1, 0, -0.3], size: [1.8, 4.8, 1.9], color: "#a1aaae", roofColor: "#687278" },
      { position: [12.6, 0, 0.7], size: [2.4, 3.0, 2.1], color: "#b6a894", roofColor: "#7e6053", roof: "pitched" },
      { position: [15.4, 0, -0.1], size: [2.0, 4.0, 2.0], color: "#98a3a8", roofColor: "#606b71" },
    ],
    []
  );

  return (
    <group position={[0, 0, -28]} scale={0.92}>
      {/* Low, muted silhouettes keep the town present without stealing focus from the call. */}
      {buildings.map((building, index) => (
        <TownBuilding key={index} {...building} />
      ))}

      {/* Raised town road: a thin slab prevents the grass from visually bleeding through. */}
      <group position={[0, 0.035, 1.8]}>
        <mesh receiveShadow>
          <boxGeometry args={[38, 0.07, 3.6]} />
          <meshStandardMaterial color="#62686d" roughness={0.98} />
        </mesh>

        <mesh position={[0, 0.045, 1.58]} receiveShadow>
          <boxGeometry args={[38.4, 0.018, 0.22]} />
          <meshStandardMaterial color="#d8d1bd" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.045, -1.58]} receiveShadow>
          <boxGeometry args={[38.4, 0.018, 0.22]} />
          <meshStandardMaterial color="#d8d1bd" roughness={0.9} />
        </mesh>

        {[-15, -11, -7, -3, 1, 5, 9, 13].map((x) => (
          <mesh key={x} position={[x, 0.052, 0]} receiveShadow>
            <boxGeometry args={[2.0, 0.018, 0.13]} />
            <meshStandardMaterial color="#e7dfbe" roughness={0.9} />
          </mesh>
        ))}
      </group>

      <group position={[17.7, 0, 0.25]}>
        <mesh position={[0, 1.9, 0]}>
          <cylinderGeometry args={[0.34, 0.46, 3.8, 12]} />
          <meshStandardMaterial color="#9aa3a7" roughness={0.94} />
        </mesh>
        <mesh position={[0, 4.0, 0]}>
          <sphereGeometry args={[0.72, 16, 16]} />
          <meshStandardMaterial color="#87949a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function OutdoorEnvironment() {
  const roadsideTrees = useMemo(
    () => [
      { position: [-12.8, 0, -11.5] as Vec3, scale: 0.44, variant: 0 },
      { position: [-9.6, 0, -13.4] as Vec3, scale: 0.4, variant: 1 },
      { position: [-5.8, 0, -12.8] as Vec3, scale: 0.42, variant: 2 },
      { position: [0.2, 0, -13.7] as Vec3, scale: 0.38, variant: 3 },
      { position: [4.8, 0, -12.6] as Vec3, scale: 0.44, variant: 1 },
      { position: [9.5, 0, -13.1] as Vec3, scale: 0.4, variant: 2 },
      { position: [13.2, 0, -11.2] as Vec3, scale: 0.46, variant: 0 },
      { position: [-13.6, 0, 8.2] as Vec3, scale: 0.48, variant: 3 },
      { position: [-9.2, 0, 10.6] as Vec3, scale: 0.42, variant: 2 },
      { position: [-4.8, 0, 11.3] as Vec3, scale: 0.45, variant: 0 },
      { position: [5.5, 0, 10.8] as Vec3, scale: 0.43, variant: 1 },
      { position: [10.4, 0, 8.9] as Vec3, scale: 0.46, variant: 2 },
      { position: [14.2, 0, 6.2] as Vec3, scale: 0.42, variant: 3 },
    ],
    []
  );

  const bushes = useMemo(
    () => [
      { position: [-7.8, 0, 5.2] as Vec3, scale: 1.0, variant: 0 },
      { position: [-6.6, 0, 6.5] as Vec3, scale: 0.85, variant: 1 },
      { position: [-2.8, 0, 5.8] as Vec3, scale: 0.9, variant: 0 },
      { position: [5.7, 0, 5.5] as Vec3, scale: 0.95, variant: 1 },
      { position: [7.6, 0, 4.2] as Vec3, scale: 0.82, variant: 0 },
      { position: [-10.8, 0, -7.4] as Vec3, scale: 0.9, variant: 1 },
      { position: [11.0, 0, -7.6] as Vec3, scale: 1.0, variant: 0 },
    ],
    []
  );

  const assetGrass = useMemo(
    () => [
      [-9.6, 0.02, 4.9, 0.42],
      [-7.2, 0.02, 7.8, 0.38],
      [-3.2, 0.02, 8.9, 0.36],
      [3.6, 0.02, 8.5, 0.4],
      [7.7, 0.02, 7.2, 0.38],
      [-11.8, 0.02, -1.6, 0.34],
      [11.6, 0.02, -1.9, 0.36],
      [-12.2, 0.02, 2.6, 0.34],
      [12.4, 0.02, 2.2, 0.34],
      [0.4, 0.02, 10.4, 0.36],
    ] as Array<[number, number, number, number]>,
    []
  );

  const stones = useMemo(
    () => [
      [-7.5, 0.02, 3.8, 0.28, 0],
      [-5.6, 0.02, 5.9, 0.24, 1],
      [-1.2, 0.02, 6.2, 0.22, 0],
      [4.9, 0.02, 5.8, 0.26, 1],
      [8.7, 0.02, 4.8, 0.3, 0],
      [-10.4, 0.02, -3.5, 0.24, 1],
      [10.2, 0.02, -4.0, 0.22, 0],
    ] as Array<[number, number, number, number, number]>,
    []
  );

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[4.2, 2.6, -5]}
        turbidity={4.8}
        rayleigh={1.6}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <CloudCluster position={[-9.2, 8.8, -24]} scale={1.35} drift={0.12} />
      <CloudCluster position={[8.6, 8.6, -25]} scale={1.45} drift={0.11} />
      <Birds />
      <Aircraft />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.045, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#94ad72" roughness={1} />
      </mesh>

      <DownloadedGroundPlatformModel position={[0, 0.006, 9.6]} scale={0.038} rotation={[0, 0.78, 0]} />
      <DownloadedTerrainGroundGrassModel position={[-10.8, 0.012, 8.8]} scale={0.055} rotation={[0, 0.4, 0]} />
      <DownloadedTerrainGroundModel position={[11.8, 0.012, 8.4]} scale={0.055} rotation={[0, -0.3, 0]} />
      <DownloadedTerrainGroundRightModel position={[-13.2, 0.012, -1.5]} scale={0.052} rotation={[0, 1.25, 0]} />
      <DownloadedTerrainSandModel position={[2.6, 0.014, 1.75]} scale={0.052} rotation={[0, -0.2, 0]} />
      <TerrainGrassModel position={[-7.2, 0.018, 4.8]} scale={1.35} rotation={[0, 0.25, 0]} />
      <TerrainGrassModel position={[8.6, 0.018, 4.7]} scale={1.1} rotation={[0, -0.4, 0]} />

      {/* Road stack: shoulders sit lower than the asphalt to avoid z-fighting and make the road read clearly. */}
      <group position={[0, 0.02, -5.65]} rotation={[0, -0.08, 0]}>
        <mesh position={[0, 0.005, 0]} receiveShadow>
          <boxGeometry args={[38, 0.05, 5.7]} />
          <meshStandardMaterial color="#9c8a6f" roughness={1} />
        </mesh>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <boxGeometry args={[38, 0.08, 4.05]} />
          <meshStandardMaterial color="#555d63" roughness={0.98} />
        </mesh>
        <mesh position={[0, 0.108, -1.86]} receiveShadow>
          <boxGeometry args={[38.2, 0.018, 0.12]} />
          <meshStandardMaterial color="#d9d0b4" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.108, 1.86]} receiveShadow>
          <boxGeometry args={[38.2, 0.018, 0.12]} />
          <meshStandardMaterial color="#d9d0b4" roughness={0.9} />
        </mesh>
        {[-16, -12, -8, -4, 0, 4, 8, 12, 16].map((x) => (
          <mesh key={x} position={[x, 0.112, 0]} receiveShadow>
            <boxGeometry args={[1.6, 0.018, 0.11]} />
            <meshStandardMaterial color="#f3e8c7" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Treatment clearing around the patient: soft dirt pad framed by grass, not a blank plane. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[2.05, 0.004, 1.85]}>
        <circleGeometry args={[3.65, 72]} />
        <meshStandardMaterial color="#b99b72" roughness={1} />
      </mesh>

      <group position={[-12.0, 0.018, 1.2]} rotation={[0, -0.18, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[3.3, 48]} />
          <meshStandardMaterial color="#4f91a3" roughness={0.42} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.15, 3.55, 48]} />
          <meshStandardMaterial color="#8d9f67" roughness={1} side={THREE.DoubleSide} />
        </mesh>
        <DownloadedMossyRockModel position={[-2.6, 0.05, -0.55]} scale={0.006} rotation={[0, 0.4, 0]} />
        <DownloadedMossyRockModel position={[2.1, 0.05, 1.6]} scale={0.005} rotation={[0, -0.9, 0]} />
        <DownloadedGrassModel position={[-1.2, 0.03, 3.0]} scale={0.0032} rotation={[0, 0.3, 0]} />
        <DownloadedGrassModel position={[1.4, 0.03, -2.8]} scale={0.003} rotation={[0, -0.5, 0]} />
      </group>

      <GrassTufts />
      <GroundPebbles />

      {assetGrass.map(([x, y, z, scale], index) => (
        <DownloadedGrassModel
          key={`asset-grass-${index}`}
          position={[x, y, z]}
          scale={scale * 0.006}
          rotation={[0, index * 0.47, 0]}
        />
      ))}

      {stones.map(([x, y, z, scale, variant], index) => (
        <DownloadedRockModel
          key={`stone-${index}`}
          position={[x, y, z]}
          scale={scale * 0.004}
          rotation={[0, variant * 0.8 + index * 0.35, 0]}
        />
      ))}

      {roadsideTrees.map((tree, index) => (
        <WorldTree key={`roadside-tree-${index}`} position={tree.position} scale={tree.scale} variant={tree.variant} />
      ))}

      {bushes.map((bush, index) => (
        <WorldBush key={`bush-${index}`} position={bush.position} scale={bush.scale} variant={bush.variant} />
      ))}

      <PalmTreeModel position={[-18.4, 0, -12.8]} scale={0.26} />
      <PalmTreeModel position={[18.6, 0, -12.2]} scale={0.24} />
      <DownloadedBenchModel position={[-8.7, 0.03, 8.6]} scale={0.01} rotation={[0, 0.9, 0]} />
      <DownloadedBenchModel position={[9.65, 0.03, 8.1]} scale={0.01} rotation={[0, -0.75, 0]} />

      <FenceLine position={[-12.6, 0, 3.2]} rotationY={0.55} segments={6} />
      <FenceLine position={[7.8, 0, 7.4]} rotationY={-0.5} segments={5} />
      <TrailSign position={[-7.3, 0, 4.9]} />
      <DistantBooth position={[-6.8, 0, -15.8]} color="#1f8a70" />
      <DistantBooth position={[-2.5, 0, -16.8]} color="#c46950" />
      <DistantBooth position={[2.4, 0, -16.0]} color="#d8a84f" />
      <DownloadedBigBuildingModel position={[9.2, 0.02, 11.4]} scale={0.018} rotation={[0, -0.64, 0]} />
      <DistantTown />

      <Bunting />

      <ContactShadows
        position={[0, 0.03, 0]}
        scale={18}
        opacity={0.34}
        blur={2.6}
        far={9}
        color="#34452f"
        frames={1}
      />
    </>
  );
}

function ReferenceWindmill({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const blades = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!blades.current) return;
    blades.current.rotation.z = clock.getElapsedTime() * 0.28;
  });

  return (
    <group position={position} scale={scale} rotation={[0, 0.12, 0]}>
      {[
        [-0.5, 1.35, -0.35, -0.12],
        [0.5, 1.35, -0.35, 0.12],
        [-0.42, 1.35, 0.35, -0.06],
        [0.42, 1.35, 0.35, 0.06],
      ].map(([x, y, z, tilt], index) => (
        <mesh key={`windmill-leg-${index}`} position={[x, y, z]} rotation={[0, 0, tilt]} castShadow>
          <boxGeometry args={[0.12, 2.7, 0.12]} />
          <meshStandardMaterial color="#9b6b35" roughness={0.9} />
        </mesh>
      ))}

      {[0.55, 1.2, 1.85].map((y) => (
        <mesh key={`windmill-cross-${y}`} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1.15, 0.07, 0.08]} />
          <meshStandardMaterial color="#b68042" roughness={0.9} />
        </mesh>
      ))}

      <mesh position={[0, 2.9, 0]} castShadow>
        <boxGeometry args={[0.42, 0.34, 0.36]} />
        <meshStandardMaterial color="#a36f38" roughness={0.85} />
      </mesh>

      <group ref={blades} position={[0, 3.15, 0.25]}>
        {Array.from({ length: 8 }, (_, index) => (
          <group key={`blade-${index}`} rotation={[0, 0, (index * Math.PI) / 4]}>
            <mesh position={[0, 0.58, 0]} castShadow>
              <boxGeometry args={[0.08, 1.08, 0.035]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.05, 0]} castShadow>
              <boxGeometry args={[0.24, 0.34, 0.035]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
            </mesh>
          </group>
        ))}
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 16]} />
          <meshStandardMaterial color="#9b6b35" roughness={0.8} />
        </mesh>
      </group>

      <mesh position={[0.74, 3.15, 0.02]} rotation={[0, 0, -0.2]} castShadow>
        <coneGeometry args={[0.24, 0.74, 3]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.82} />
      </mesh>
    </group>
  );
}

function ReferenceScaffold({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const verticals = [
    [-1.0, 1.1, -0.45],
    [0, 1.1, -0.45],
    [1.0, 1.1, -0.45],
    [-1.0, 1.1, 0.45],
    [0, 1.1, 0.45],
    [1.0, 1.1, 0.45],
  ] as Vec3[];

  return (
    <group position={position} scale={scale} rotation={[0, -0.12, 0]}>
      {verticals.map((post, index) => (
        <mesh key={`scaffold-post-${index}`} position={post} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 2.2, 8]} />
          <meshStandardMaterial color="#b56d32" roughness={0.78} />
        </mesh>
      ))}

      {[0.55, 1.18, 1.78, 2.25].map((y) => (
        <group key={`scaffold-level-${y}`} position={[0, y, 0]}>
          <mesh position={[0, 0, -0.45]} castShadow>
            <boxGeometry args={[2.22, 0.06, 0.06]} />
            <meshStandardMaterial color="#b56d32" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0, 0.45]} castShadow>
            <boxGeometry args={[2.22, 0.06, 0.06]} />
            <meshStandardMaterial color="#b56d32" roughness={0.78} />
          </mesh>
          <mesh position={[-1.0, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, 1.0]} />
            <meshStandardMaterial color="#b56d32" roughness={0.78} />
          </mesh>
          <mesh position={[1.0, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, 1.0]} />
            <meshStandardMaterial color="#b56d32" roughness={0.78} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((x) =>
        [-0.45, 0.45].map((z) => (
          <mesh key={`scaffold-foot-${x}-${z}`} position={[x, 0.04, z]} receiveShadow>
            <boxGeometry args={[0.38, 0.08, 0.38]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
}

function ReferenceFence({ position, rotationY = 0, segments = 4 }: { position: Vec3; rotationY?: number; segments?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: segments }, (_, index) => {
        const x = index * 0.9;
        return (
          <group key={`reference-fence-${index}`} position={[x, 0, 0]}>
            <mesh position={[0, 0.38, 0]} castShadow>
              <boxGeometry args={[0.09, 0.76, 0.09]} />
              <meshStandardMaterial color="#b7783e" roughness={0.9} />
            </mesh>
            {index < segments - 1 ? (
              <>
                <mesh position={[0.45, 0.54, 0]} castShadow>
                  <boxGeometry args={[0.86, 0.07, 0.07]} />
                  <meshStandardMaterial color="#bc7c40" roughness={0.9} />
                </mesh>
                <mesh position={[0.45, 0.3, 0]} castShadow>
                  <boxGeometry args={[0.86, 0.07, 0.07]} />
                  <meshStandardMaterial color="#bc7c40" roughness={0.9} />
                </mesh>
              </>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function ParamedicGuideDialogue({
  step,
  userName,
  onNameChange,
  onNext,
  onDoneName,
  onBegin,
  onReturn,
}: {
  step: GuideStep;
  userName: string;
  onNameChange: (value: string) => void;
  onNext: () => void;
  onDoneName: () => void;
  onBegin: () => void;
  onReturn: () => void;
}) {
  if (step === "done") return null;

  const displayName = userName.trim() || "friend";
  const buttonClass =
    "rounded-md bg-teal-300 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-950 shadow-lg shadow-teal-950/20 transition hover:bg-teal-200";

  const content = (autoFocusName = false) => (
    <>
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-200 sm:text-[11px]">
        Paramedic Guide
      </div>

      {step === "welcome" ? (
        <>
          <p className="text-sm font-semibold leading-relaxed">
            Hi, I&apos;m your paramedic guide. Welcome to Sick City. Around here, you&apos;ll practice EMT
            decisions for falls from high places, sudden chest pain, severe allergic reactions, and trouble breathing.
          </p>
          <div className="mt-3 flex justify-end">
            <button type="button" className={buttonClass} onClick={onNext}>
              Next
            </button>
          </div>
        </>
      ) : null}

      {step === "name" ? (
        <>
          <p className="text-sm font-semibold leading-relaxed">Before we start, what should I call you?</p>
          <input
            data-testid={autoFocusName ? "mobile-guide-name-input" : "desktop-guide-name-input"}
            value={userName}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onDoneName();
            }}
            placeholder="Type your name"
            className="mt-3 w-full border-0 border-b border-teal-200/70 bg-transparent px-1 py-2 text-sm font-semibold italic text-white outline-none placeholder:italic placeholder:text-black"
            autoFocus={autoFocusName}
          />
          <div className="mt-3 flex justify-end">
            <button type="button" className={buttonClass} onClick={onDoneName}>
              Done
            </button>
          </div>
        </>
      ) : null}

      {step === "named" ? (
        <>
          <p className="text-sm font-semibold leading-relaxed">
            <span className="italic">{displayName}</span>, you&apos;re the EMT in this training game. Use each
            scene to practice your assessment, make safe decisions, and build the habits you&apos;ll need in the field.
          </p>
          <div className="mt-3 flex justify-end">
            <button type="button" className={buttonClass} onClick={onBegin}>
              Begin
            </button>
          </div>
        </>
      ) : null}

      {step === "soon" ? (
        <>
          <p className="text-sm font-semibold leading-relaxed">Stay ready. More guided training is coming soon.</p>
          <div className="mt-3 flex justify-end">
            <button type="button" className={buttonClass} onClick={onReturn}>
              Back to scene
            </button>
          </div>
        </>
      ) : null}
    </>
  );

  return (
    <>
      <Html
        position={[GUIDE_PARAMEDIC_POSITION[0] + 1.48, GUIDE_PARAMEDIC_POSITION[1] + 2.2, GUIDE_PARAMEDIC_POSITION[2] + 0.05]}
        center
        distanceFactor={5.2}
        zIndexRange={[18, 0]}
      >
        <div
          className="hidden w-[min(360px,80vw)] rounded-xl border border-teal-200/45 bg-slate-950/78 p-4 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-md lg:block"
          style={{ pointerEvents: "auto" }}
        >
          {content(false)}
        </div>
      </Html>
    </>
  );
}

function MobileParamedicGuideDialogue({
  step,
  userName,
  onNameChange,
  onNext,
  onDoneName,
  onBegin,
  onReturn,
}: {
  step: GuideStep;
  userName: string;
  onNameChange: (value: string) => void;
  onNext: () => void;
  onDoneName: () => void;
  onBegin: () => void;
  onReturn: () => void;
}) {
  if (step === "done") return null;

  const displayName = userName.trim() || "friend";
  const buttonClass =
    "rounded-md bg-teal-300 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-950 shadow-lg shadow-teal-950/20 transition hover:bg-teal-200";

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-40 lg:hidden">
      <div
        data-testid="mobile-guide-dialogue"
        className="pointer-events-auto max-h-[42vh] overflow-y-auto rounded-2xl border border-teal-200/45 bg-slate-950/88 p-3.5 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl"
      >
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-200">
          Paramedic Guide
        </div>

        {step === "welcome" ? (
          <>
            <p className="text-sm font-semibold leading-relaxed">
              Hi, I&apos;m your paramedic guide. Welcome to Sick City. Around here, you&apos;ll practice EMT
              decisions for falls from high places, sudden chest pain, severe allergic reactions, and trouble breathing.
            </p>
            <div className="mt-3 flex justify-end">
              <button type="button" className={buttonClass} onClick={onNext}>
                Next
              </button>
            </div>
          </>
        ) : null}

        {step === "name" ? (
          <>
            <p className="text-sm font-semibold leading-relaxed">Before we start, what should I call you?</p>
            <input
              data-testid="mobile-guide-name-input"
              value={userName}
              onChange={(event) => onNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onDoneName();
              }}
              placeholder="Type your name"
              className="mt-3 w-full border-0 border-b border-teal-200/70 bg-transparent px-1 py-2 text-sm font-semibold italic text-white outline-none placeholder:italic placeholder:text-black"
              autoFocus
            />
            <div className="mt-3 flex justify-end">
              <button type="button" className={buttonClass} onClick={onDoneName}>
                Done
              </button>
            </div>
          </>
        ) : null}

        {step === "named" ? (
          <>
            <p className="text-sm font-semibold leading-relaxed">
              <span className="italic">{displayName}</span>, you&apos;re the EMT in this training game. Use each
              scene to practice your assessment, make safe decisions, and build the habits you&apos;ll need in the field.
            </p>
            <div className="mt-3 flex justify-end">
              <button type="button" className={buttonClass} onClick={onBegin}>
                Begin
              </button>
            </div>
          </>
        ) : null}

        {step === "soon" ? (
          <>
            <p className="text-sm font-semibold leading-relaxed">Stay ready. More guided training is coming soon.</p>
            <div className="mt-3 flex justify-end">
              <button type="button" className={buttonClass} onClick={onReturn}>
                Back to scene
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ReferenceRoofCap({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, -0.04, 0]}>
      <mesh position={[0, 0.12, -0.55]} rotation={[0.32, 0, 0]} castShadow>
        <boxGeometry args={[3.0, 0.12, 1.65]} />
        <meshStandardMaterial color="#a93c31" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.12, 0.55]} rotation={[-0.32, 0, 0]} castShadow>
        <boxGeometry args={[3.0, 0.12, 1.65]} />
        <meshStandardMaterial color="#b7493d" roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.08, 0]} castShadow>
        <boxGeometry args={[3.2, 0.12, 2.85]} />
        <meshStandardMaterial color="#b7493d" roughness={0.86} />
      </mesh>
    </group>
  );
}

function ReferenceGroundSurface() {
  const islandShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = [
      [-30.0, -18.0],
      [-24.6, -23.8],
      [-13.8, -26.15],
      [-2.1, -26.85],
      [12.9, -25.55],
      [24.1, -20.95],
      [30.4, -11.9],
      [31.0, 1.85],
      [27.2, 13.15],
      [16.9, 20.65],
      [3.6, 23.4],
      [-11.3, 21.95],
      [-22.8, 16.85],
      [-30.6, 6.95],
    ];
    shape.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();
    return shape;
  }, []);

  const dirtShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = [
      [-8.9, -6.1],
      [-4.1, -7.65],
      [2.55, -7.55],
      [8.65, -5.25],
      [9.15, 0.8],
      [6.35, 4.5],
      [0.65, 5.55],
      [-5.55, 4.45],
      [-8.7, 1.25],
    ];
    shape.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();
    return shape;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow>
        <shapeGeometry args={[islandShape]} />
        <meshStandardMaterial color="#82a33f" roughness={0.96} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.25, 0.008, -0.65]} receiveShadow>
        <shapeGeometry args={[dirtShape]} />
        <meshStandardMaterial color="#a47751" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10.2, 0.01, 5.15]} receiveShadow>
        <circleGeometry args={[2.6, 28]} />
        <meshStandardMaterial color="#8cac44" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10.65, 0.01, 6.2]} receiveShadow>
        <circleGeometry args={[2.45, 28]} />
        <meshStandardMaterial color="#8fb044" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.01, 10.25]} receiveShadow>
        <circleGeometry args={[3.5, 36]} />
        <meshStandardMaterial color="#8fb044" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-13.4, 0.01, -5.75]} receiveShadow>
        <circleGeometry args={[2.7, 28]} />
        <meshStandardMaterial color="#82a33f" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[13.7, 0.01, -7.05]} receiveShadow>
        <circleGeometry args={[2.9, 28]} />
        <meshStandardMaterial color="#8fb044" roughness={0.98} />
      </mesh>
    </group>
  );
}

type BackgroundCityBuildingSpec = {
  kind: "large" | "standard" | "small" | "big";
  position: Vec3;
  rotationY: number;
  scale: number;
};

function BackgroundCityBuilding({ kind, position, rotationY, scale }: BackgroundCityBuildingSpec) {
  const props = {
    position,
    rotation: [0, rotationY, 0] as Vec3,
    scale,
  };

  if (kind === "large") return <DownloadedLargeBuildingModel {...props} />;
  if (kind === "small") return <DownloadedSmallBuildingModel {...props} />;
  if (kind === "big") return <DownloadedBigBuildingModel {...props} />;
  return <DownloadedBuildingModel {...props} />;
}

function DistantSteeple({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 2.7, 0.9]} />
        <meshStandardMaterial color="#d9d7c8" roughness={0.94} />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <coneGeometry args={[0.68, 1.35, 4]} />
        <meshStandardMaterial color="#8f918a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.72, 0.46]}>
        <boxGeometry args={[0.32, 0.55, 0.035]} />
        <meshStandardMaterial color="#6e7b82" roughness={0.55} />
      </mesh>
    </group>
  );
}

function DistantTower({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 3.1, 0.9]} />
        <meshStandardMaterial color="#d7cfbd" roughness={0.94} />
      </mesh>
      <mesh position={[0, 3.35, 0]} castShadow>
        <coneGeometry args={[0.7, 1.0, 4]} />
        <meshStandardMaterial color="#bf8169" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.1, 0.47]}>
        <boxGeometry args={[0.28, 0.48, 0.035]} />
        <meshStandardMaterial color="#687985" roughness={0.55} />
      </mesh>
    </group>
  );
}

function BackgroundCity() {
  const buildings = useMemo<BackgroundCityBuildingSpec[]>(
    () => {
      const specs: BackgroundCityBuildingSpec[] = [];
      const kinds: BackgroundCityBuildingSpec["kind"][] = ["small", "standard", "small", "standard", "standard"];

      const addTouchingRow = (
        startX: number,
        endX: number,
        step: number,
        zAt: (x: number) => number,
        rotationAt: (x: number) => number,
        scale: number,
        offset = 0
      ) => {
        const count = Math.floor((endX - startX) / step) + 1;
        for (let index = 0; index < count; index += 1) {
          const x = startX + index * step;
          specs.push({
            kind: kinds[(index + offset) % kinds.length],
            position: [x, 0.04, zAt(x)] as Vec3,
            rotationY: rotationAt(x),
            scale,
          });
        }
      };

      // These rows intentionally overlap slightly so the background reads as joined townhouses.
      addTouchingRow(-26.8, -7.8, 0.74, (x) => -9.9 - (x + 26.8) * 0.23, () => 0.22, 0.39);
      addTouchingRow(-10.4, 12.6, 0.72, () => -14.45, () => 0.02, 0.39, 1);
      addTouchingRow(8.6, 27.4, 0.74, (x) => -14.25 + (x - 8.6) * 0.23, () => -0.22, 0.39, 2);
      addTouchingRow(-23.0, 22.5, 1.12, () => -17.35, () => 0, 0.3, 1);

      return specs;
    },
    []
  );
  const districtShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = [
      [-27.4, -3.0],
      [-18.6, -4.0],
      [-8.0, -3.55],
      [4.6, -3.95],
      [27.2, -2.9],
      [26.5, 3.7],
      [12.4, 4.4],
      [-1.8, 3.85],
      [-14.6, 4.25],
      [-27.0, 3.35],
    ];
    shape.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();
    return shape;
  }, []);

  return (
    <group>
      <mesh position={[0, 0.018, -15.98]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[districtShape]} />
        <meshStandardMaterial color="#9caa73" roughness={0.98} />
      </mesh>

      <mesh position={[0, 0.045, -14.85]} receiveShadow>
        <boxGeometry args={[49, 0.04, 0.82]} />
        <meshStandardMaterial color="#8a9180" roughness={0.98} />
      </mesh>
      {[-23, -19, -15, -11, -7, -3, 1, 5, 9, 13, 17, 21].map((x) => (
        <mesh key={`background-city-lane-${x}`} position={[x, 0.076, -14.85]} receiveShadow>
          <boxGeometry args={[1.55, 0.016, 0.055]} />
          <meshStandardMaterial color="#e2d8b8" roughness={0.9} />
        </mesh>
      ))}

      {buildings.map((building, index) => (
        <BackgroundCityBuilding key={`background-city-building-${index}`} {...building} />
      ))}

      <DistantSteeple position={[-13.1, 0.04, -13.75]} scale={0.62} />
      <DistantTower position={[22.0, 0.04, -11.9]} scale={0.58} />

      <mesh position={[0, 0.09, -13.85]} receiveShadow>
        <boxGeometry args={[50, 0.035, 0.38]} />
        <meshStandardMaterial color="#8a775f" roughness={1} />
      </mesh>
    </group>
  );
}

function BaselineGroundRightTerrain() {
  const mossyRocks = useMemo(
    () => [
      { position: [-9.4, 0.04, 2.7] as Vec3, scale: 1.45, rotation: -0.18 },
      { position: [-7.25, 0.04, 1.35] as Vec3, scale: 1.12, rotation: 0.42 },
      { position: [-12.4, 0.04, 6.4] as Vec3, scale: 0.92, rotation: -0.55 },
      { position: [-15.1, 0.04, 0.2] as Vec3, scale: 0.72, rotation: 0.9 },
      { position: [-18.5, 0.04, -8.15] as Vec3, scale: 0.68, rotation: -0.2 },
      { position: [9.9, 0.04, 5.4] as Vec3, scale: 0.95, rotation: -0.35 },
      { position: [13.2, 0.04, 8.15] as Vec3, scale: 1.15, rotation: 0.65 },
      { position: [16.0, 0.04, -4.8] as Vec3, scale: 0.7, rotation: 0.35 },
      { position: [20.5, 0.04, 3.1] as Vec3, scale: 0.62, rotation: -0.48 },
      { position: [-5.2, 0.04, 5.7] as Vec3, scale: 0.54, rotation: 0.15 },
      { position: [5.45, 0.04, 4.05] as Vec3, scale: 0.48, rotation: -0.22 },
    ],
    []
  );
  const grasses = useMemo(
    () => [
      [-4.2, 0.05, -1.0, 0.34, 0.2],
      [-2.35, 0.05, -2.2, 0.28, -0.35],
      [-1.65, 0.05, 1.95, 0.32, 0.7],
      [0.45, 0.05, -1.15, 0.28, 0.1],
      [1.15, 0.05, 1.35, 0.32, -0.8],
      [2.65, 0.05, -0.55, 0.26, 0.45],
      [3.35, 0.05, 1.85, 0.3, -0.2],
      [4.25, 0.05, -2.85, 0.26, 0.85],
      [-4.85, 0.05, 2.45, 0.28, -0.6],
      [-0.1, 0.05, 2.85, 0.3, 0.25],
      [-7.2, 0.05, 4.55, 0.32, 0.1],
      [-4.85, 0.05, 5.95, 0.3, -0.45],
      [-1.35, 0.05, 6.8, 0.34, 0.65],
      [2.2, 0.05, 6.55, 0.3, -0.25],
      [5.9, 0.05, 5.15, 0.34, 0.5],
      [7.6, 0.05, 1.1, 0.28, -0.75],
      [-7.9, 0.05, 0.55, 0.3, 0.85],
      [6.85, 0.05, -4.25, 0.26, 0.15],
      [-6.9, 0.05, -4.7, 0.28, -0.2],
      [-13.5, 0.05, 7.6, 0.34, 0.4],
      [-10.9, 0.05, 10.1, 0.32, -0.55],
      [-5.4, 0.05, 11.5, 0.34, 0.2],
      [1.4, 0.05, 12.35, 0.36, -0.35],
      [7.8, 0.05, 10.55, 0.34, 0.75],
      [13.2, 0.05, 7.45, 0.32, -0.15],
      [15.2, 0.05, 0.65, 0.3, 0.35],
      [14.25, 0.05, -7.85, 0.32, -0.45],
      [8.25, 0.05, -12.1, 0.34, 0.15],
      [1.45, 0.05, -13.55, 0.32, -0.8],
      [-6.8, 0.05, -13.0, 0.34, 0.55],
      [-13.95, 0.05, -9.25, 0.32, -0.25],
      [-15.5, 0.05, -1.8, 0.3, 0.7],
      [-21.6, 0.05, 12.9, 0.34, -0.3],
      [-15.2, 0.05, 16.9, 0.32, 0.55],
      [-8.0, 0.05, 19.3, 0.36, -0.1],
      [1.7, 0.05, 20.15, 0.34, 0.25],
      [11.5, 0.05, 17.25, 0.36, -0.55],
      [21.4, 0.05, 10.4, 0.32, 0.45],
      [24.4, 0.05, -1.95, 0.32, -0.25],
      [22.1, 0.05, -13.8, 0.34, 0.35],
      [12.8, 0.05, -20.35, 0.36, -0.7],
      [0.25, 0.05, -22.15, 0.34, 0.12],
      [-13.5, 0.05, -20.45, 0.34, -0.45],
      [-24.0, 0.05, -12.25, 0.32, 0.6],
      [-25.4, 0.05, 1.95, 0.32, -0.15],
    ] as Array<[number, number, number, number, number]>,
    []
  );
  const perimeterFences = useMemo(
    () => [
      { position: [-5.15, 0.05, -2.35] as Vec3, rotationY: 0.08, segments: 4 },
      { position: [-4.25, 0.05, 2.4] as Vec3, rotationY: -0.86, segments: 3 },
      { position: [2.85, 0.05, 3.0] as Vec3, rotationY: -0.24, segments: 4 },
      { position: [-11.8, 0.05, 4.8] as Vec3, rotationY: -0.18, segments: 7 },
      { position: [-8.85, 0.05, -1.25] as Vec3, rotationY: 0.36, segments: 5 },
      { position: [8.8, 0.05, 4.65] as Vec3, rotationY: 0.34, segments: 6 },
      { position: [10.75, 0.05, -0.5] as Vec3, rotationY: -0.82, segments: 4 },
    ],
    []
  );
  const behindHouseTrees = useMemo(
    () => [
      { position: [-4.25, 0.04, -6.2] as Vec3, scale: 0.5, variant: 0 },
      { position: [-2.4, 0.04, -6.7] as Vec3, scale: 0.42, variant: 1 },
      { position: [-0.55, 0.04, -6.95] as Vec3, scale: 0.46, variant: 2 },
      { position: [2.0, 0.04, -7.05] as Vec3, scale: 0.43, variant: 0 },
      { position: [4.75, 0.04, -6.85] as Vec3, scale: 0.48, variant: 1 },
      { position: [7.55, 0.04, -6.35] as Vec3, scale: 0.45, variant: 2 },
      { position: [9.95, 0.04, -5.65] as Vec3, scale: 0.38, variant: 0 },
    ],
    []
  );

  return (
    <group>
      {/*
        The Drei sky shader was washing this scene gray from the default EMT camera.
        Keep the Canvas blue background visible and let the cloud meshes carry the sky detail.
      */}
      <CloudCluster position={[-10.5, 7.1, -16.2]} scale={0.9} drift={0.085} driftVector={[1.15, 0.08, 0.24]} />
      <CloudCluster position={[0.4, 7.6, -18.4]} scale={0.74} drift={0.072} driftVector={[-0.9, 0.06, 0.34]} phase={1.8} />
      <CloudCluster position={[10.2, 7.15, -15.5]} scale={0.66} drift={0.078} driftVector={[0.72, 0.05, -0.42]} phase={3.1} />
      <ReferenceGroundSurface />
      <DownloadedLargeBuildingModel position={[1.45, 0.05, -2.75]} scale={0.9} rotation={[0, -0.03, 0]} />
      {behindHouseTrees.map((tree, index) => (
        <WorldTree key={`behind-house-tree-${index}`} position={tree.position} scale={tree.scale} variant={tree.variant} />
      ))}
      <DownloadedWindmillModel position={[-7.15, 0.05, -3.85]} scale={0.48} rotation={[0, 0.12, 0]} />
      <DownloadedScaffoldingModel position={[6.25, 0.08, -2.65]} scale={0.94} rotation={[0, -0.08, 0]} />
      <BackgroundCity />

      {perimeterFences.map((fence, index) => (
        <ReferenceFence
          key={`reference-perimeter-fence-${index}`}
          position={fence.position}
          rotationY={fence.rotationY}
          segments={fence.segments}
        />
      ))}

      {mossyRocks.map((rock, index) => (
        <DownloadedMossyRockModel
          key={`baseline-mossy-rock-${index}`}
          position={rock.position}
          scale={rock.scale}
          rotation={[0, rock.rotation, 0]}
        />
      ))}
      {grasses.map(([x, y, z, scale, rotation], index) => (
        <DownloadedGrassModel
          key={`reference-grass-${index}`}
          position={[x, y, z]}
          scale={scale}
          rotation={[0, rotation, 0]}
        />
      ))}
    </group>
  );
}

function RoadsideFestivalGround() {
  const grassPatches = useMemo(
    () => [
      [-7.6, 0.04, 1.6, 0.38, -0.4],
      [-6.1, 0.04, 3.4, 0.34, 0.2],
      [-4.9, 0.04, -1.4, 0.3, 0.9],
      [-2.6, 0.04, 2.4, 0.26, -0.6],
      [-0.7, 0.04, 3.8, 0.34, 0.35],
      [1.3, 0.04, 2.75, 0.28, -0.2],
      [3.25, 0.04, 2.9, 0.32, 0.75],
      [5.75, 0.04, 1.35, 0.36, -0.55],
      [7.3, 0.04, 3.15, 0.32, 0.15],
      [-7.25, 0.04, -7.7, 0.3, -0.45],
      [-4.0, 0.04, -8.45, 0.26, 0.6],
      [2.4, 0.04, -8.2, 0.3, -0.2],
      [6.9, 0.04, -8.1, 0.34, 0.42],
      [-9.4, 0.04, -11.4, 0.35, 0.12],
      [-5.2, 0.04, -12.6, 0.32, -0.7],
      [0.4, 0.04, -11.9, 0.3, 0.4],
      [5.8, 0.04, -12.35, 0.34, -0.25],
      [9.2, 0.04, -11.15, 0.32, 0.55],
    ] as Array<[number, number, number, number, number]>,
    []
  );
  const smallRocks = useMemo(
    () => [
      [-7.1, 0.04, 0.55, 0.35, 0.1],
      [-5.6, 0.04, 1.9, 0.24, -0.35],
      [-3.25, 0.04, 0.85, 0.22, 0.7],
      [-1.2, 0.04, 2.85, 0.18, -0.6],
      [0.6, 0.04, 1.65, 0.2, 0.22],
      [2.2, 0.04, 2.95, 0.24, -0.2],
      [3.9, 0.04, 1.05, 0.28, 0.8],
      [5.45, 0.04, 2.55, 0.22, -0.4],
      [7.05, 0.04, 0.6, 0.3, 0.35],
      [-8.6, 0.04, -8.15, 0.42, -0.5],
      [8.3, 0.04, -8.4, 0.38, 0.2],
    ] as Array<[number, number, number, number, number]>,
    []
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.018, -1.4]} receiveShadow>
        <planeGeometry args={[30, 24]} />
        <meshStandardMaterial color="#78a64e" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 1.2]} receiveShadow>
        <circleGeometry args={[6.9, 48]} />
        <meshStandardMaterial color="#a98258" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 1.2]} receiveShadow>
        <circleGeometry args={[4.65, 42]} />
        <meshStandardMaterial color="#b08862" roughness={1} transparent opacity={0.72} />
      </mesh>

      <mesh position={[0, 0.045, -4.55]} receiveShadow>
        <boxGeometry args={[24, 0.08, 3.42]} />
        <meshStandardMaterial color="#30383b" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.027, -2.72]} receiveShadow>
        <boxGeometry args={[24.4, 0.045, 0.36]} />
        <meshStandardMaterial color="#c4b08d" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.027, -6.4]} receiveShadow>
        <boxGeometry args={[24.4, 0.045, 0.38]} />
        <meshStandardMaterial color="#bda47c" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.09, -2.93]} receiveShadow>
        <boxGeometry args={[24.2, 0.02, 0.045]} />
        <meshStandardMaterial color="#f3ead4" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.092, -6.19]} receiveShadow>
        <boxGeometry args={[24.2, 0.02, 0.045]} />
        <meshStandardMaterial color="#f3ead4" roughness={0.72} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={`road-center-mark-${index}`} position={[-11 + index * 2, 0.097, -4.55]} receiveShadow>
          <boxGeometry args={[1.08, 0.018, 0.055]} />
          <meshStandardMaterial color="#e7c95d" roughness={0.7} />
        </mesh>
      ))}

      {grassPatches.map(([x, y, z, scale, rotation], index) => (
        <DownloadedGrassModel
          key={`roadside-grass-${index}`}
          position={[x, y, z]}
          scale={scale}
          rotation={[0, rotation, 0]}
        />
      ))}
      {smallRocks.map(([x, y, z, scale, rotation], index) => (
        <DownloadedMossyRockModel
          key={`roadside-rock-${index}`}
          position={[x, y, z]}
          scale={scale}
          rotation={[0, rotation, 0]}
        />
      ))}
    </group>
  );
}

function FestivalRoadsideSign({ position = [1.35, 0.02, -7.15] as Vec3 }: { position?: Vec3 }) {
  return (
    <group position={position} rotation={[0, -0.06, 0]}>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.78, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.055, 1.56, 8]} />
          <meshStandardMaterial color="#7b5738" roughness={0.94} />
        </mesh>
      ))}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.78, 0.1]} />
        <meshStandardMaterial color="#e4d1a5" roughness={0.88} />
      </mesh>
      <Text position={[0, 1.31, 0.062]} fontSize={0.18} anchorX="center" anchorY="middle" color="#3f2f22">
        RIVERSIDE
      </Text>
      <Text position={[0, 1.08, 0.064]} fontSize={0.18} anchorX="center" anchorY="middle" color="#3f2f22">
        FESTIVAL
      </Text>
    </group>
  );
}

function RoadsideBuntingLine({ position, rotationY = 0, width = 8.5 }: { position: Vec3; rotationY?: number; width?: number }) {
  const flags = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        x: -width / 2 + index * (width / 10),
        y: 2.52 - Math.sin((index / 10) * Math.PI) * 0.18,
        color: ["#d14f3b", "#f1c453", "#308f79", "#f8fafc"][index % 4],
      })),
    [width]
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 2.52, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, width, 8]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.94} />
      </mesh>
      {flags.map((flag, index) => (
        <mesh key={`roadside-bunting-${index}`} position={[flag.x, flag.y - 0.14, 0]} rotation={[0, 0, Math.PI]} castShadow>
          <coneGeometry args={[0.11, 0.28, 3]} />
          <meshStandardMaterial color={flag.color} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function RoadsideVillageBackdrop() {
  const buildings = useMemo(
    () => [
      { kind: "small" as const, position: [-8.0, 0.03, -11.5] as Vec3, rotationY: 0.14, scale: 0.5 },
      { kind: "standard" as const, position: [-6.75, 0.03, -11.75] as Vec3, rotationY: 0.12, scale: 0.48 },
      { kind: "large" as const, position: [-5.35, 0.03, -11.95] as Vec3, rotationY: 0.1, scale: 0.43 },
      { kind: "small" as const, position: [-3.95, 0.03, -12.1] as Vec3, rotationY: 0.08, scale: 0.48 },
      { kind: "standard" as const, position: [3.85, 0.03, -11.95] as Vec3, rotationY: -0.08, scale: 0.47 },
      { kind: "small" as const, position: [5.15, 0.03, -11.75] as Vec3, rotationY: -0.1, scale: 0.48 },
      { kind: "large" as const, position: [6.55, 0.03, -11.55] as Vec3, rotationY: -0.12, scale: 0.42 },
      { kind: "standard" as const, position: [7.95, 0.03, -11.3] as Vec3, rotationY: -0.14, scale: 0.46 },
    ],
    []
  );
  const trees = useMemo(
    () => [
      [-10.3, 0.02, -8.9, 0.76, 0],
      [-8.9, 0.02, -10.1, 0.58, 1],
      [-1.8, 0.02, -10.6, 0.54, 2],
      [0.4, 0.02, -10.9, 0.62, 0],
      [2.2, 0.02, -10.35, 0.58, 1],
      [8.9, 0.02, -10.0, 0.55, 2],
      [10.2, 0.02, -8.7, 0.72, 0],
      [-11.6, 0.02, -2.8, 0.62, 1],
      [11.3, 0.02, -2.95, 0.68, 2],
    ] as Array<[number, number, number, number, number]>,
    []
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -10.55]} receiveShadow>
        <planeGeometry args={[24, 7]} />
        <meshStandardMaterial color="#91ad5b" roughness={0.98} />
      </mesh>
      {buildings.map((building, index) => (
        <BackgroundCityBuilding key={`roadside-village-${index}`} {...building} />
      ))}
      <DistantSteeple position={[0.2, 0.03, -11.85]} scale={0.88} />
      <DistantTower position={[9.85, 0.03, -10.7]} scale={0.62} />
      {trees.map(([x, y, z, scale, variant], index) => (
        <WorldTree key={`roadside-tree-${index}`} position={[x, y, z]} scale={scale} variant={variant} />
      ))}
      <DistantBooth position={[-2.75, 0.02, -8.55]} color="#e9f6f1" />
      <DistantBooth position={[3.15, 0.02, -8.75]} color="#d84f43" />
      <DistantBooth position={[5.25, 0.02, -8.95]} color="#edf7ec" />
      <FestivalRoadsideSign />
      <RoadsideBuntingLine position={[-3.7, 0.02, -8.05]} rotationY={0.08} width={8} />
      <RoadsideBuntingLine position={[4.65, 0.02, -8.2]} rotationY={-0.08} width={7.8} />
      <ReferenceFence position={[-10.2, 0.05, -7.1]} rotationY={0.02} segments={8} />
      <ReferenceFence position={[-2.8, 0.05, -7.15]} rotationY={0.02} segments={5} />
      <ReferenceFence position={[5.5, 0.05, -7.12]} rotationY={0.02} segments={7} />
    </group>
  );
}

function AmbulanceLightGlow({ position }: { position: Vec3 }) {
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const blueRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const pulse = (Math.sin(clock.getElapsedTime() * 5.2) + 1) / 2;
    if (redRef.current) redRef.current.emissiveIntensity = 0.45 + pulse * 1.25;
    if (blueRef.current) blueRef.current.emissiveIntensity = 1.7 - pulse * 1.05;
  });

  return (
    <group position={position}>
      <mesh position={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.24, 0.09, 0.12]} />
        <meshStandardMaterial ref={redRef} color="#ef4444" emissive="#ef4444" emissiveIntensity={0.9} roughness={0.35} />
      </mesh>
      <mesh position={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.24, 0.09, 0.12]} />
        <meshStandardMaterial ref={blueRef} color="#2563eb" emissive="#2563eb" emissiveIntensity={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RoadsideFestivalEmergencyScene({ environment }: { environment?: ScenarioState["environment"] }) {
  const cones = useMemo(
    () => [
      [-3.35, 0.11, -3.05, 0.1],
      [-0.95, 0.11, -3.0, -0.18],
      [2.25, 0.11, -3.1, 0.26],
      [4.7, 0.11, -5.95, -0.08],
    ] as Array<[number, number, number, number]>,
    []
  );

  return (
    <group>
      <CloudCluster position={[-8.4, 7.15, -16.4]} scale={0.72} drift={0.075} driftVector={[0.9, 0.06, 0.24]} />
      <CloudCluster position={[1.4, 7.85, -17.9]} scale={0.62} drift={0.068} driftVector={[-0.7, 0.04, 0.28]} phase={1.4} />
      <CloudCluster position={[9.2, 7.3, -15.2]} scale={0.68} drift={0.081} driftVector={[0.7, 0.05, -0.2]} phase={2.8} />
      <RoadsideFestivalGround />
      <RoadsideVillageBackdrop />

      <CustomAmbulanceModel position={[-4.55, 0.96, -4.78]} scale={3.78} rotation={[0, 0.34, 0]} />
      <AmbulanceLightGlow position={[-4.62, 2.55, -3.62]} />
      <DamagedCar position={[3.85, 0.08, -4.72]} />

      {cones.map(([x, y, z, rotation], index) => (
        <DownloadedConeModel key={`roadside-cone-${index}`} position={[x, y, z]} scale={0.3} rotation={[0, rotation, 0]} />
      ))}

      <CustomFirstAidBagModel position={[-1.25, 0.06, 1.86]} scale={0.88} rotation={[0, -0.5, 0]} />
      <CustomPatientModel position={[2.28, 0.2, 1.18]} scale={2.0} rotation={[0, -0.16, 0]} />
      <mesh position={[2.28, 0.025, 1.28]} rotation={[-Math.PI / 2, 0, -0.16]} receiveShadow>
        <circleGeometry args={[1.55, 40]} />
        <meshStandardMaterial color="#7e684f" transparent opacity={0.22} roughness={1} />
      </mesh>
      <BarkingDog position={[5.38, 0, 1.28]} secured={environment?.dogSecured} agitated={environment?.dogAgitated ?? true} showLabel={false} />

      <ReferenceFence position={[-9.5, 0.05, -2.0]} rotationY={0.05} segments={7} />
      <ReferenceFence position={[6.3, 0.05, -1.9]} rotationY={0.02} segments={5} />
      <DownloadedMossyRockModel position={[-7.85, 0.04, 2.85]} scale={0.44} rotation={[0, -0.2, 0]} />
      <DownloadedMossyRockModel position={[6.8, 0.04, 2.78]} scale={0.36} rotation={[0, 0.45, 0]} />
    </group>
  );
}

function FestivalTent() {
  return (
    <group position={[0, 0, -2]}>
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[4.7, 1.8, 4]} />
        <meshStandardMaterial color="#134e4a" />
      </mesh>
      {[
        [-3.2, 1.7, -2.8],
        [3.2, 1.7, -2.8],
        [-3.2, 1.7, 2.8],
        [3.2, 1.7, 2.8],
      ].map((position, index) => (
        <mesh key={index} position={position as Vec3} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3.4, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Stretcher() {
  return (
    <group position={[2.35, 0.52, 1.45]}>
      <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.85, 0.12, 1.18]} />
        <meshStandardMaterial color="#7b8794" metalness={0.18} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.58, 0.18, 1.02]} />
        <meshStandardMaterial color="#0ea5a4" roughness={0.82} />
      </mesh>
      <mesh position={[-0.95, 0.34, 0]} castShadow>
        <boxGeometry args={[0.58, 0.22, 0.92]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.76} />
      </mesh>

      {[-0.56, 0.56].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.38, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 2.78, 12]} />
            <meshStandardMaterial color="#d6dde5" metalness={0.32} roughness={0.48} />
          </mesh>
          <mesh position={[-1.25, 0.25, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.36, 10]} />
            <meshStandardMaterial color="#c4cdd8" metalness={0.35} roughness={0.48} />
          </mesh>
          <mesh position={[1.25, 0.25, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.36, 10]} />
            <meshStandardMaterial color="#c4cdd8" metalness={0.35} roughness={0.48} />
          </mesh>
        </group>
      ))}

      {[-0.48, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} castShadow>
          <boxGeometry args={[0.08, 0.055, 1.08]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>
      ))}

      {[
        [-1.05, -0.38, -0.42],
        [1.05, -0.38, -0.42],
        [-1.05, -0.38, 0.42],
        [1.05, -0.38, 0.42],
      ].map((position, index) => (
        <group key={index} position={position as Vec3}>
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.78, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, index % 2 === 0 ? 0.55 : -0.55]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.05, 8]} />
            <meshStandardMaterial color="#aab4c0" metalness={0.35} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {[
        [-1.05, -0.74, -0.42],
        [1.05, -0.74, -0.42],
        [-1.05, -0.74, 0.42],
        [1.05, -0.74, 0.42],
      ].map((position, index) => (
        <group key={index} position={position as Vec3}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.12, 0.04, 10, 18]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.035, 0.035, 0.08, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PulseRing({ position }: { position: Vec3 }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2.5) * 0.08;
    ref.current.scale.setScalar(pulse);
    const material = ref.current.material as THREE.MeshStandardMaterial;
    material.opacity = 0.3 + ((Math.sin(t * 2.5) + 1) / 2) * 0.25;
  });

  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.7, 48]} />
      <meshStandardMaterial color="#22d3ee" transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

function FloatingLabel({
  position,
  text,
  tone = "cyan",
}: {
  position: Vec3;
  text: string;
  tone?: "cyan" | "teal" | "rose";
}) {
  const className =
    tone === "rose"
      ? "rounded-full border border-rose-300/50 bg-rose-500/25 px-3 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur"
      : tone === "teal"
        ? "rounded-full border border-teal-300/50 bg-teal-500/25 px-3 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur"
        : "rounded-full border border-cyan-300/50 bg-cyan-500/25 px-3 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur";

  return (
    <Html position={position} center distanceFactor={10} zIndexRange={SCENE_HTML_Z_INDEX_RANGE}>
      <div className={className}>{text}</div>
    </Html>
  );
}

function FindingBubble({ text, speaker = "coach" }: { text?: string; speaker?: "coach" | "patient" }) {
  const [visibleText, setVisibleText] = useState(text ?? "");
  const [isVisible, setIsVisible] = useState(Boolean(text));

  useEffect(() => {
    if (!text) {
      setIsVisible(false);
      return;
    }

    setVisibleText(text);
    setIsVisible(true);

    const fadeTimer = window.setTimeout(() => setIsVisible(false), 4600);
    return () => window.clearTimeout(fadeTimer);
  }, [text]);

  if (!visibleText) return null;

  const label = speaker === "patient" ? "Patient" : "Coach";
  const bubbleClass =
    speaker === "patient"
      ? "border-teal-200/55 bg-teal-950/78 text-teal-50"
      : "border-sky-200/55 bg-slate-950/82 text-sky-50";
  const cleanedText = visibleText.replace(/^(Coach|Patient):\s*/i, "");

  return (
    <Html position={[1.2, 2.25, 2.25]} center distanceFactor={6.8} zIndexRange={SCENE_HTML_Z_INDEX_RANGE}>
      <div
        data-testid="scene-finding-bubble"
        className={`w-[210px] rounded-lg border px-2.5 py-1.5 text-left text-[10px] font-bold leading-4 shadow-xl backdrop-blur transition-opacity duration-[1800ms] ${bubbleClass} ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="mb-0.5 text-[8px] font-black uppercase tracking-[0.16em] opacity-75">
          {label}
        </div>
        {cleanedText}
      </div>
    </Html>
  );
}

function CameraDirector({
  focusObject,
  locationId = "ambulance",
}: {
  focusObject?: SceneInteractiveObject;
  locationId?: ScenarioState["locationId"];
}) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!focusObject?.focusPosition && !focusObject?.focusTarget) return;

    const fallbackPosition: Vec3 =
      locationId === "patientSide"
        ? [5.1, 2.7, 4.7]
        : locationId === "roadside"
          ? [7.0, 3.5, 7.5]
          : [10.8, 5.25, 9.8];
    const fallbackTarget: Vec3 =
      locationId === "patientSide"
        ? [2.05, 0.9, 1.4]
        : locationId === "roadside"
          ? [0.2, 0.9, 1.2]
          : [1.1, 1.15, -1.6];

    desiredPosition.set(...(focusObject?.focusPosition ?? fallbackPosition));
    target.set(...(focusObject?.focusTarget ?? fallbackTarget));
    camera.position.lerp(desiredPosition, 0.045);
    camera.lookAt(target);
  });

  return null;
}

function GuideCameraRig({
  mode,
  controlsRef,
  onNormalSettled,
}: {
  mode: CameraMode;
  controlsRef: RefObject<any>;
  onNormalSettled: () => void;
}) {
  const { camera, size } = useThree();
  const isMobile = size.width < 768;
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const scratchTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (mode === "free") return;

    const guidePosition = isMobile ? MOBILE_GUIDE_CAMERA_POSITION : GUIDE_PARAMEDIC_CAMERA_POSITION;
    const guideTarget = isMobile ? MOBILE_GUIDE_CAMERA_TARGET : GUIDE_PARAMEDIC_CAMERA_TARGET;
    const normalPosition = isMobile ? MOBILE_NORMAL_CAMERA_POSITION : NORMAL_CAMERA_POSITION;
    const normalTarget = isMobile ? MOBILE_NORMAL_CAMERA_TARGET : NORMAL_CAMERA_TARGET;

    desiredPosition.set(...(mode === "guide" ? guidePosition : normalPosition));
    desiredTarget.set(...(mode === "guide" ? guideTarget : normalTarget));

    camera.position.lerp(desiredPosition, mode === "guide" ? 0.055 : 0.065);

    const controls = controlsRef.current;
    if (controls?.target) {
      controls.target.lerp(desiredTarget, mode === "guide" ? 0.08 : 0.075);
      controls.update();
    } else {
      camera.lookAt(desiredTarget);
    }

    scratchTarget.copy(controls?.target ?? desiredTarget);
    const settled =
      camera.position.distanceTo(desiredPosition) < 0.04 && scratchTarget.distanceTo(desiredTarget) < 0.04;
    if (mode === "normal" && settled) onNormalSettled();
  });

  return null;
}

function SceneViewControls({
  visible,
  onViewControl,
}: {
  visible: boolean;
  onViewControl: (action: "zoom-in" | "zoom-out" | "left" | "right") => void;
}) {
  if (!visible) return null;

  const controls = [
    { action: "zoom-in" as const, label: "Zoom in", icon: ZoomIn },
    { action: "zoom-out" as const, label: "Zoom out", icon: ZoomOut },
    { action: "left" as const, label: "Move left", icon: MoveLeft },
    { action: "right" as const, label: "Move right", icon: MoveRight },
  ];

  return (
    <div className="pointer-events-auto absolute left-4 top-[590px] z-20 rounded-xl border border-white/15 bg-slate-950/68 p-2 shadow-2xl shadow-slate-950/35 backdrop-blur-md [@media(max-height:760px)]:bottom-[132px] [@media(max-height:760px)]:left-[424px] [@media(max-height:760px)]:top-auto [@media(max-height:760px)]:p-1.5">
      <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200 [@media(max-height:760px)]:sr-only">Scene view</div>
      <div className="grid grid-cols-4 gap-2 [@media(max-height:760px)]:gap-1.5">
        {controls.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => onViewControl(action)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:border-teal-200/60 hover:bg-teal-300/20 hover:text-teal-100 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:w-9"
          >
            <Icon size={18} strokeWidth={2.4} />
          </button>
        ))}
      </div>
    </div>
  );
}

function InteractiveHotspot({
  object,
  selected,
  accessibilityMode,
  onSelect,
}: {
  object: SceneInteractiveObject;
  selected: boolean;
  accessibilityMode?: boolean;
  onSelect?: (objectId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const mesh = useRef<THREE.Mesh>(null);
  const color = object.completed ? "#34d399" : object.highlightColor ?? "#2dd4bf";
  const highlightVisible = accessibilityMode || hovered || selected || object.category === "movement";
  const labelVisible = accessibilityMode || hovered || object.category === "movement";
  const disabled = object.enabled === false;

  useEffect(() => {
    if (!hovered) return;
    const previous = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = previous;
    };
  }, [hovered]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 3.2) * 0.08;
    mesh.current.scale.setScalar(selected ? pulse * 1.12 : pulse);
  });

  return (
    <group position={object.position}>
      <mesh
        ref={mesh}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(object.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[object.category === "movement" ? 0.42 : 0.34, 20, 20]} />
        <meshStandardMaterial
          color={disabled ? "#64748b" : color}
          emissive={disabled ? "#111827" : color}
          emissiveIntensity={highlightVisible ? 0.55 : 0.12}
          transparent
          opacity={highlightVisible ? (disabled ? 0.18 : 0.3) : 0.03}
          depthWrite={false}
        />
      </mesh>
      {labelVisible ? (
        <Html center distanceFactor={9} position={[0, 0.58, 0]} zIndexRange={SCENE_HTML_Z_INDEX_RANGE}>
          <div
            className={`max-w-[150px] rounded-full border px-3 py-1 text-center text-[10px] font-black uppercase tracking-wider shadow-xl backdrop-blur ${disabled
              ? "border-slate-400/30 bg-slate-950/60 text-slate-300"
              : object.completed
                ? "border-emerald-200/60 bg-emerald-500/25 text-emerald-50"
                : "border-teal-200/55 bg-slate-950/70 text-teal-50"
              }`}
          >
            {object.name}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function InteractiveLayer({
  objects,
  selectedObjectId,
  accessibilityMode,
  onObjectSelect,
}: {
  objects: SceneInteractiveObject[];
  selectedObjectId?: string;
  accessibilityMode?: boolean;
  onObjectSelect?: (objectId: string) => void;
}) {
  return (
    <group>
      {objects.map((object) => (
        <InteractiveHotspot
          key={object.id}
          object={object}
          selected={object.id === selectedObjectId}
          accessibilityMode={accessibilityMode}
          onSelect={onObjectSelect}
        />
      ))}
    </group>
  );
}

function BarkingDog({
  secured,
  agitated,
  position = [1.15, 0, 3.35] as Vec3,
  showLabel = false,
}: {
  secured?: boolean;
  agitated?: boolean;
  position?: Vec3;
  showLabel?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current) {
      root.current.position.x = position[0] + (agitated && !secured ? Math.sin(t * 4.8) * 0.08 : 0);
      root.current.position.z = position[2] + (agitated && !secured ? Math.cos(t * 4.4) * 0.05 : 0);
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * (secured ? 0.9 : 3.4)) * (secured ? 0.08 : 0.22);
      head.current.rotation.x = -0.08 + Math.sin(t * 5.5) * (secured ? 0.02 : 0.08);
    }
  });

  if (secured) {
    return (
      <group position={[5.25, 0, 3.7]} rotation={[0, -0.75, 0]} scale={0.72}>
        <TinyPerson position={[0.85, 0, 0.1]} shirt="#0f766e" rotation={-0.8} scale={0.88} />
        <mesh position={[0.35, 0.76, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        <BarkingDog position={[0, 0, 0]} secured={false} agitated={false} showLabel />
        <FloatingLabel position={[0.25, 1.45, 0]} text="Dog secured" tone="teal" />
      </group>
    );
  }

  return (
    <group ref={root} position={position} rotation={[0, -1.05, 0]} scale={0.78}>
      <mesh position={[0, 0.62, 0]} scale={[0.92, 0.48, 0.36]} castShadow>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#5b4636" roughness={0.96} />
      </mesh>
      <group ref={head} position={[0.55, 0.9, 0]}>
        <mesh scale={[0.52, 0.42, 0.36]} castShadow>
          <sphereGeometry args={[0.36, 14, 14]} />
          <meshStandardMaterial color="#6b4f3d" roughness={0.96} />
        </mesh>
        <mesh position={[0.24, -0.02, 0]} scale={[0.38, 0.28, 0.26]} castShadow>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color="#3f2f27" roughness={0.98} />
        </mesh>
        <mesh position={[-0.06, 0.31, -0.18]} rotation={[0.28, 0, -0.2]} castShadow>
          <coneGeometry args={[0.09, 0.28, 6]} />
          <meshStandardMaterial color="#3f2f27" roughness={1} />
        </mesh>
        <mesh position={[-0.06, 0.31, 0.18]} rotation={[-0.28, 0, -0.2]} castShadow>
          <coneGeometry args={[0.09, 0.28, 6]} />
          <meshStandardMaterial color="#3f2f27" roughness={1} />
        </mesh>
      </group>
      {[-0.32, 0.28].flatMap((x) =>
        [-0.16, 0.16].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.25, z]} castShadow>
            <cylinderGeometry args={[0.045, 0.055, 0.55, 8]} />
            <meshStandardMaterial color="#4b382f" roughness={1} />
          </mesh>
        ))
      )}
      <mesh position={[-0.58, 0.78, 0]} rotation={[0, 0, 0.72]} castShadow>
        <coneGeometry args={[0.06, 0.36, 8]} />
        <meshStandardMaterial color="#5b4636" roughness={1} />
      </mesh>
      {showLabel || agitated ? (
        <Html position={[0.35, 1.45, 0]} center distanceFactor={5.8} zIndexRange={SCENE_HTML_Z_INDEX_RANGE}>
          <div className="rounded-lg border border-rose-200/55 bg-rose-950/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-rose-50 shadow-xl backdrop-blur">
            {agitated ? "Barking louder" : "Barking dog"}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

export function EMTCharacter({
  animation = "Idle",
  position = [0, 0, 0] as Vec3,
  hasGloves = false,
}: {
  animation?: string;
  position?: Vec3;
  hasGloves?: boolean;
}) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/Robot.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const action = actions[animation];

    action?.reset().fadeIn(0.2).play();

    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, animation]);

  return <group position={position}><primitive ref={group} object={scene} /></group>;
}

function StarOfLifeMark({ position, rotation = [0, 0, 0], scale = 1 }: { position: Vec3; rotation?: Vec3; scale?: number }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {[0, Math.PI / 3, -Math.PI / 3].map((angle) => (
        <mesh key={angle} rotation={[0, 0, angle]} castShadow>
          <boxGeometry args={[0.1, 0.36, 0.018]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.82} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.012]} castShadow>
        <boxGeometry args={[0.032, 0.24, 0.012]} />
        <meshStandardMaterial color="#1d5f83" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.065, 0.018]} castShadow>
        <sphereGeometry args={[0.028, 10, 8]} />
        <meshStandardMaterial color="#1d5f83" roughness={0.76} />
      </mesh>
    </group>
  );
}

function ReflectiveBand({
  position,
  size,
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  size: Vec3;
  rotation?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#d9e1dc" metalness={0.08} roughness={0.52} />
    </mesh>
  );
}

function GLBParamedicGuide({
  position = GUIDE_PARAMEDIC_POSITION,
  rotationY = 0.6,
  onClick,
  showGuidePulse = false,
}: {
  position?: Vec3;
  rotationY?: number;
  onClick?: () => void;
  showGuidePulse?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const guidePulse = useRef<THREE.Mesh>(null);
  const guidePulseMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const { size } = useThree();
  const actualRotationY = size.width < 768 ? MOBILE_GUIDE_PARAMEDIC_ROTATION_Y : rotationY;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current) {
      root.current.rotation.y = actualRotationY + Math.sin(t * 0.62) * 0.012;
      root.current.position.y = position[1] + Math.sin(t * 1.45) * 0.006;
    }
    if (guidePulse.current) guidePulse.current.scale.setScalar(1 + (Math.sin(t * 1.1) + 1) * 0.04);
    if (guidePulseMaterial.current) guidePulseMaterial.current.opacity = showGuidePulse ? 0.08 + (Math.sin(t * 1.1) + 1) * 0.03 : 0;
  });

  return (
    <group
      ref={root}
      position={position}
      rotation={[0, actualRotationY, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      <mesh ref={guidePulse} position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.68, 24, 16]} />
        <meshStandardMaterial
          ref={guidePulseMaterial}
          color="#6fffe2"
          emissive="#2dd4bf"
          emissiveIntensity={0.14}
          transparent
          opacity={showGuidePulse ? 0.1 : 0}
          roughness={0.45}
          depthWrite={false}
        />
      </mesh>
      {showGuidePulse ? <FloatingLabel position={[0, 2.05, 0]} text="Paramedic" tone="teal" /> : null}
      <DownloadedParamedicGuideModel scale={GUIDE_PARAMEDIC_MODEL_SCALE} />
    </group>
  );
}

function LowPolyParamedic({
  position = GUIDE_PARAMEDIC_POSITION,
  rotationY = 0.6,
  onClick,
  showGuidePulse = false,
}: {
  position?: Vec3;
  rotationY?: number;
  onClick?: () => void;
  showGuidePulse?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const guidePulse = useRef<THREE.Mesh>(null);
  const guidePulseMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const jacket = "#25563e";
  const jacketDark = "#173a2b";
  const jacketLight = "#3b7557";
  const pants = "#1d2223";
  const pantsLight = "#2b3132";
  const skin = "#b87843";
  const skinDark = "#875732";
  const hair = "#171717";
  const boot = "#181a1b";
  const reflective = "#eef3ef";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current) {
      root.current.rotation.y = rotationY + Math.sin(t * 0.62) * 0.018;
      root.current.position.y = position[1] + Math.sin(t * 1.45) * 0.01;
    }
    if (head.current) head.current.rotation.y = Math.sin(t * 0.72) * 0.025;
    if (leftArm.current) leftArm.current.rotation.z = 0.07 + Math.sin(t * 1.05) * 0.018;
    if (rightArm.current) rightArm.current.rotation.z = -0.07 - Math.sin(t * 1.05 + 0.4) * 0.018;
    if (guidePulse.current) guidePulse.current.scale.setScalar(1 + (Math.sin(t * 1.1) + 1) * 0.045);
    if (guidePulseMaterial.current) guidePulseMaterial.current.opacity = showGuidePulse ? 0.08 + (Math.sin(t * 1.1) + 1) * 0.03 : 0;
  });

  const Arm = ({ side, armRef }: { side: -1 | 1; armRef: Ref<THREE.Group> }) => (
    <group ref={armRef} position={[side * 0.49, 1.66, 0.01]} rotation={[0.03, 0, side * 0.045]}>
      <mesh position={[side * 0.01, -0.03, 0]} scale={[1.0, 1.08, 0.92]} castShadow>
        <sphereGeometry args={[0.118, 24, 18]} />
        <meshStandardMaterial color={jacket} roughness={0.78} />
      </mesh>
      <mesh position={[side * 0.035, -0.32, 0]} rotation={[0, 0, side * 0.012]} castShadow>
        <capsuleGeometry args={[0.095, 0.5, 10, 18]} />
        <meshStandardMaterial color={jacket} roughness={0.78} />
      </mesh>
      <ReflectiveBand position={[side * 0.04, -0.4, 0.008]} size={[0.22, 0.052, 0.225]} />
      <mesh position={[side * 0.042, -0.64, 0]} rotation={[0, 0, side * 0.006]} castShadow>
        <capsuleGeometry args={[0.085, 0.34, 10, 18]} />
        <meshStandardMaterial color={jacket} roughness={0.78} />
      </mesh>
      <mesh position={[side * 0.05, -0.92, 0.035]} scale={[0.72, 0.95, 0.54]} castShadow>
        <sphereGeometry args={[0.105, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.88} />
      </mesh>
      <mesh position={[side * 0.045, -1.0, 0.115]} rotation={[0.35, 0, side * 0.08]} castShadow>
        <capsuleGeometry args={[0.022, 0.13, 6, 10]} />
        <meshStandardMaterial color={skin} roughness={0.88} />
      </mesh>
    </group>
  );

  const Leg = ({ side }: { side: -1 | 1 }) => (
    <group position={[side * 0.18, 0.82, 0]}>
      <mesh position={[0, -0.35, 0]} scale={[0.98, 1, 0.86]} castShadow>
        <capsuleGeometry args={[0.15, 0.9, 10, 18]} />
        <meshStandardMaterial color={pants} roughness={0.86} />
      </mesh>
      <mesh position={[side * 0.06, -0.22, 0.15]} castShadow>
        <boxGeometry args={[0.12, 0.28, 0.045]} />
        <meshStandardMaterial color={pantsLight} roughness={0.86} />
      </mesh>
      <mesh position={[0, -1.06, 0.04]} scale={[1.12, 0.44, 1.55]} castShadow>
        <boxGeometry args={[0.29, 0.18, 0.34]} />
        <meshStandardMaterial color={boot} roughness={0.8} />
      </mesh>
      <mesh position={[0, -1.1, 0.18]} scale={[1.05, 0.34, 0.92]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.28]} />
        <meshStandardMaterial color="#232323" roughness={0.82} />
      </mesh>
    </group>
  );

  return (
    <group
      ref={root}
      position={position}
      scale={0.66}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      <mesh ref={guidePulse} position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.82, 24, 16]} />
        <meshStandardMaterial
          ref={guidePulseMaterial}
          color="#6fffe2"
          emissive="#2dd4bf"
          emissiveIntensity={0.14}
          transparent
          opacity={showGuidePulse ? 0.1 : 0}
          roughness={0.45}
          depthWrite={false}
        />
      </mesh>
      <FloatingLabel position={[0, 2.74, 0]} text="Paramedic" tone="teal" />

      <mesh position={[0, 1.6, 0]} scale={[0.7, 0.88, 0.42]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 1.02, 0.58]} />
        <meshStandardMaterial color={jacket} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.94, 0.23]} rotation={[0.16, 0, 0]} castShadow>
        <coneGeometry args={[0.14, 0.24, 32]} />
        <meshStandardMaterial color="#f7f4ec" roughness={0.82} />
      </mesh>
      <mesh position={[-0.18, 1.88, 0.24]} rotation={[0, 0, 0.62]} castShadow>
        <boxGeometry args={[0.34, 0.07, 0.04]} />
        <meshStandardMaterial color={jacketLight} roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 1.88, 0.24]} rotation={[0, 0, -0.62]} castShadow>
        <boxGeometry args={[0.34, 0.07, 0.04]} />
        <meshStandardMaterial color={jacketLight} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.55, 0.31]} castShadow>
        <boxGeometry args={[0.025, 0.88, 0.028]} />
        <meshStandardMaterial color={jacketDark} roughness={0.82} />
      </mesh>
      <ReflectiveBand position={[-0.23, 1.42, 0.32]} size={[0.3, 0.08, 0.034]} />
      <ReflectiveBand position={[0.23, 1.42, 0.32]} size={[0.3, 0.08, 0.034]} />
      <ReflectiveBand position={[0, 1.42, -0.32]} size={[0.78, 0.08, 0.034]} />
      <StarOfLifeMark position={[0.23, 1.68, 0.35]} scale={0.45} />
      <StarOfLifeMark position={[0, 1.63, -0.35]} rotation={[0, Math.PI, 0]} scale={0.72} />
      <Text
        position={[0, 1.94, -0.37]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.16}
        anchorX="center"
        anchorY="middle"
        color="#f8fafc"
        outlineWidth={0.002}
        outlineColor="#647067"
      >
        PARAMEDIC
      </Text>

      <mesh position={[0, 1.08, 0.01]} castShadow>
        <boxGeometry args={[0.76, 0.11, 0.48]} />
        <meshStandardMaterial color="#1f2324" roughness={0.82} />
      </mesh>
      {[-0.28, 0.02, 0.3].map((x) => (
        <mesh key={`belt-loop-${x}`} position={[x, 1.08, 0.27]} castShadow>
          <boxGeometry args={[0.045, 0.13, 0.04]} />
          <meshStandardMaterial color="#313638" roughness={0.76} />
        </mesh>
      ))}
      <mesh position={[0, 1.08, 0.32]} castShadow>
        <boxGeometry args={[0.16, 0.13, 0.035]} />
        <meshStandardMaterial color="#cbd5d0" roughness={0.56} />
      </mesh>
      <mesh position={[0, 0.92, 0]} scale={[0.92, 0.68, 0.78]} castShadow>
        <boxGeometry args={[0.58, 0.36, 0.4]} />
        <meshStandardMaterial color={pants} roughness={0.88} />
      </mesh>
      <mesh position={[-0.11, 0.73, 0.02]} rotation={[0, 0, 0.025]} castShadow>
        <boxGeometry args={[0.2, 0.42, 0.34]} />
        <meshStandardMaterial color={pants} roughness={0.88} />
      </mesh>
      <mesh position={[0.11, 0.73, 0.02]} rotation={[0, 0, -0.025]} castShadow>
        <boxGeometry args={[0.2, 0.42, 0.34]} />
        <meshStandardMaterial color={pants} roughness={0.88} />
      </mesh>

      <group ref={head} position={[0, 2.26, 0.03]}>
        <mesh scale={[0.82, 1.04, 0.72]} castShadow>
          <sphereGeometry args={[0.27, 32, 24]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.17, -0.045]} scale={[0.92, 0.44, 0.78]} castShadow>
          <sphereGeometry args={[0.28, 24, 18]} />
          <meshStandardMaterial color={hair} roughness={0.82} />
        </mesh>
        <mesh position={[0.09, 0.14, 0.12]} rotation={[0.22, 0.06, -0.08]} scale={[0.78, 0.34, 0.38]} castShadow>
          <sphereGeometry args={[0.22, 24, 18]} />
          <meshStandardMaterial color={hair} roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.06, 0.2]} scale={[0.36, 0.26, 0.34]} castShadow>
          <coneGeometry args={[0.13, 0.18, 24]} />
          <meshStandardMaterial color={skinDark} roughness={0.88} />
        </mesh>
        <mesh position={[-0.13, 0.04, 0.22]} castShadow>
          <boxGeometry args={[0.04, 0.075, 0.026]} />
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
        <mesh position={[0.13, 0.04, 0.22]} castShadow>
          <boxGeometry args={[0.04, 0.075, 0.026]} />
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
        <mesh position={[-0.13, 0.105, 0.22]} rotation={[0, 0, -0.08]} castShadow>
          <boxGeometry args={[0.13, 0.026, 0.026]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>
        <mesh position={[0.13, 0.105, 0.22]} rotation={[0, 0, 0.08]} castShadow>
          <boxGeometry args={[0.13, 0.026, 0.026]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.105, 0.244]} rotation={[0, 0, Math.PI]} castShadow>
          <torusGeometry args={[0.07, 0.009, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#5a3327" roughness={0.86} />
        </mesh>
        <mesh position={[-0.27, -0.01, 0.01]} scale={[0.44, 0.72, 0.3]} castShadow>
          <sphereGeometry args={[0.08, 20, 16]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
        <mesh position={[0.27, -0.01, 0.01]} scale={[0.44, 0.72, 0.3]} castShadow>
          <sphereGeometry args={[0.08, 20, 16]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
      </group>

      <mesh position={[0, 1.99, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.2, 10, 18]} />
        <meshStandardMaterial color={skinDark} roughness={0.9} />
      </mesh>

      <mesh position={[-0.27, 1.76, 0.34]} castShadow>
        <boxGeometry args={[0.16, 0.2, 0.08]} />
        <meshStandardMaterial color="#232628" roughness={0.72} />
      </mesh>
      <mesh position={[-0.28, 1.57, 0.33]} rotation={[0.08, 0, 0.04]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.46, 6]} />
        <meshStandardMaterial color="#111827" roughness={0.68} />
      </mesh>
      <mesh position={[-0.28, 1.38, 0.31]} castShadow>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color="#111827" roughness={0.68} />
      </mesh>

      <Arm side={-1} armRef={leftArm} />
      <Arm side={1} armRef={rightArm} />
      <Leg side={-1} />
      <Leg side={1} />

      <StarOfLifeMark position={[-0.56, 1.58, 0.03]} rotation={[0, -Math.PI / 2, 0]} scale={0.36} />
      <StarOfLifeMark position={[0.56, 1.58, 0.03]} rotation={[0, Math.PI / 2, 0]} scale={0.36} />
    </group>
  );
}

function PatientCharacter({
  position = [2.25, 0.72, 1.45] as Vec3,
  scenarioId,
  intervention = "none",
  patientState = "distressed",
  showLabel = false,
}: {
  position?: Vec3;
  scenarioId: SceneVariant;
  intervention?: InterventionState;
  patientState?: PatientState;
  showLabel?: boolean;
}) {
  const chest = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const breathingRate = patientState === "critical" ? 3.1 : patientState === "improving" ? 1.45 : 2.15;
  const breathingDepth = scenarioId === "spine" ? 0.018 : patientState === "critical" ? 0.07 : 0.045;

  useFrame(({ clock }) => {
    if (!chest.current) return;

    const t = clock.getElapsedTime();
    const breath = (Math.sin(t * breathingRate) + 1) / 2;
    chest.current.scale.y = 1 + breath * breathingDepth;
    chest.current.scale.z = 1 + breath * breathingDepth * 0.55;
    chest.current.position.y = 0.21 + breath * 0.008;
    if (head.current && scenarioId !== "spine") head.current.rotation.z = -0.04 + Math.sin(t * 0.7) * 0.015;
  });

  return (
    <group position={position} rotation={[0, scenarioId === "spine" ? 0 : -0.035, 0]}>
      {showLabel ? <FloatingLabel position={[-0.15, 1.05, 0]} text="Patient" tone="rose" /> : null}
      {/* Head and neck sit directly over the stretcher pillow. */}
      <mesh ref={head} position={[-1.0, 0.39, 0]} rotation={[0, 0, -0.04]} castShadow>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color="#d6a37a" />
      </mesh>
      <mesh position={[-0.79, 0.24, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.11, 0.2, 16]} />
        <meshStandardMaterial color="#d6a37a" />
      </mesh>
      {scenarioId === "spine" ? (
        <>
          <mesh position={[-0.96, 0.35, -0.31]} castShadow>
            <boxGeometry args={[0.42, 0.18, 0.08]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.78} />
          </mesh>
          <mesh position={[-0.96, 0.35, 0.31]} castShadow>
            <boxGeometry args={[0.42, 0.18, 0.08]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.78} />
          </mesh>
          <mesh position={[-0.79, 0.26, 0]} castShadow>
            <torusGeometry args={[0.16, 0.035, 8, 28]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.75} />
          </mesh>
        </>
      ) : null}
      {intervention === "oxygen" || scenarioId === "chest-pain" || scenarioId === "anaphylaxis" ? (
        <group position={[-1.18, 0.38, 0.02]} rotation={[0, 0, -0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.09, 0.2]} />
            <meshStandardMaterial color="#dbeafe" transparent opacity={0.86} roughness={0.45} />
          </mesh>
          <mesh position={[-0.32, -0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.65, 8]} />
            <meshStandardMaterial color="#bfdbfe" roughness={0.5} />
          </mesh>
        </group>
      ) : null}

      {/* Torso, abdomen, and hips form one horizontal body line on the mattress. */}
      <mesh ref={chest} position={[-0.43, 0.21, 0]} castShadow>
        <boxGeometry args={[0.82, 0.29, 0.5]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.78} />
      </mesh>
      <mesh position={[0.08, 0.17, 0]} castShadow>
        <boxGeometry args={[0.3, 0.24, 0.43]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.78} />
      </mesh>
      <mesh position={[0.3, 0.15, 0]} castShadow>
        <boxGeometry args={[0.32, 0.24, 0.46]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.82} />
      </mesh>

      {/* Left arm rests naturally beside the torso. */}
      <mesh position={[-0.43, 0.16, -0.34]} rotation={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.5, 0.14, 0.15]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.78} />
      </mesh>
      <mesh position={[-0.03, 0.13, -0.35]} rotation={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.35, 0.13, 0.14]} />
        <meshStandardMaterial color="#d6a37a" />
      </mesh>
      <mesh position={[0.18, 0.13, -0.37]} castShadow>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial color="#d6a37a" />
      </mesh>

      {/* Right arm is bent gently across the abdomen instead of clipping below the bed. */}
      <mesh position={[-0.48, 0.31, scenarioId === "chest-pain" ? 0.18 : 0.29]} rotation={[0, scenarioId === "chest-pain" ? -0.05 : -0.42, 0]} castShadow>
        <boxGeometry args={[0.44, 0.14, 0.15]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.78} />
      </mesh>
      <mesh position={[-0.12, 0.32, scenarioId === "chest-pain" ? 0.12 : 0.17]} rotation={[0, scenarioId === "chest-pain" ? -0.35 : 0.52, 0]} castShadow>
        <boxGeometry args={[0.38, 0.13, 0.14]} />
        <meshStandardMaterial color="#d6a37a" />
      </mesh>
      <mesh position={[scenarioId === "chest-pain" ? -0.23 : 0.08, 0.32, scenarioId === "chest-pain" ? 0.16 : 0.08]} castShadow>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial color="#d6a37a" />
      </mesh>

      {/* Legs run along the length of the stretcher with a small natural separation. */}
      {[-0.13, 0.13].map((z, index) => (
        <group key={z}>
          <mesh position={[0.64, 0.14, z]} rotation={[0, index === 0 ? 0.015 : -0.015, 0]} castShadow>
            <boxGeometry args={[0.52, 0.2, 0.18]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.82} />
          </mesh>
          <mesh position={[1.13, 0.13, z]} rotation={[0, index === 0 ? 0.018 : -0.018, 0]} castShadow>
            <boxGeometry args={[0.5, 0.18, 0.17]} />
            <meshStandardMaterial color="#d6a37a" />
          </mesh>
          <mesh position={[1.51, 0.12, z + (index === 0 ? -0.015 : 0.015)]} castShadow>
            <boxGeometry args={[0.29, 0.17, 0.22]} />
            <meshStandardMaterial color="#111827" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {scenarioId === "anaphylaxis" ? (
        <mesh position={[-0.78, 0.47, 0.14]} castShadow>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#ef9a9a" roughness={0.7} />
        </mesh>
      ) : null}
    </group>
  );
}


function Ambulance({ position = [-6.8, 0, -6.15] as Vec3 }) {
  const lightRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const flash = Math.sin(clock.getElapsedTime() * 7.5) > 0;
    lightRef.current.children.forEach((child, index) => {
      const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = flash === (index % 2 === 0) ? 2.8 : 0.35;
    });
  });

  const wheelPositions: Vec3[] = [
    [-1.15, 0.42, -0.82],
    [1.18, 0.42, -0.82],
    [-1.15, 0.42, 0.82],
    [1.18, 0.42, 0.82],
  ];

  return (
    <group position={position} rotation={[0, 0.18, 0]} scale={0.9}>
      <mesh position={[-0.35, 1.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.65, 1.7]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.72} />
      </mesh>
      <mesh position={[1.35, 0.98, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.25, 1.62]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.72} />
      </mesh>
      <mesh position={[1.53, 1.2, 0]} castShadow>
        <boxGeometry args={[0.7, 0.48, 1.66]} />
        <meshStandardMaterial color="#334155" roughness={0.35} />
      </mesh>
      <mesh position={[1.9, 0.83, -0.55]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.34]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.22} roughness={0.48} />
      </mesh>
      <mesh position={[1.9, 0.83, 0.55]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.34]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.22} roughness={0.48} />
      </mesh>
      <mesh position={[-1.82, 0.98, -0.72]} castShadow>
        <boxGeometry args={[0.06, 0.26, 0.26]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-1.82, 0.98, 0.72]} castShadow>
        <boxGeometry args={[0.06, 0.26, 0.26]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-0.35, 1.18, -0.865]} castShadow>
        <boxGeometry args={[2.65, 0.28, 0.035]} />
        <meshStandardMaterial color="#0f766e" roughness={0.65} />
      </mesh>
      <mesh position={[-0.35, 1.18, 0.865]} castShadow>
        <boxGeometry args={[2.65, 0.28, 0.035]} />
        <meshStandardMaterial color="#0f766e" roughness={0.65} />
      </mesh>

      {/* Simple medical cross on the visible side. */}
      <group position={[-0.55, 1.23, 0.892]}>
        <mesh>
          <boxGeometry args={[0.16, 0.62, 0.04]} />
          <meshStandardMaterial color="#dc2626" roughness={0.75} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.62, 0.16, 0.04]} />
          <meshStandardMaterial color="#dc2626" roughness={0.75} />
        </mesh>
      </group>

      <group ref={lightRef} position={[-0.1, 2.09, 0]}>
        <mesh position={[-0.36, 0, -0.22]}>
          <boxGeometry args={[0.38, 0.12, 0.3]} />
          <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0.36, 0, -0.22]}>
          <boxGeometry args={[0.38, 0.12, 0.3]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[-0.36, 0, 0.22]}>
          <boxGeometry args={[0.38, 0.12, 0.3]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0.36, 0, 0.22]}>
          <boxGeometry args={[0.38, 0.12, 0.3]} />
          <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={1.4} />
        </mesh>
      </group>

      {wheelPositions.map((wheelPosition, index) => (
        <group key={index} position={wheelPosition}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.62, 0.18, 0.34]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.82} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.28, 0.1, 10, 20]} />
            <meshStandardMaterial color="#111827" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SmokePlume({ position }: { position: Vec3 }) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const puffs = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        phase: index / 11,
        drift: ((index % 3) - 1) * 0.13,
        depth: ((index % 4) - 1.5) * 0.08,
      })),
    []
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 0.22;

    puffs.forEach((puff, index) => {
      const mesh = refs.current[index];
      if (!mesh) return;

      const cycle = (time + puff.phase) % 1;
      const sway = Math.sin((cycle + puff.phase) * Math.PI * 3) * 0.16;
      mesh.position.set(puff.drift + sway, cycle * 3.2, puff.depth);
      mesh.scale.setScalar(0.2 + cycle * 0.72);

      const material = mesh.material as THREE.MeshStandardMaterial;
      material.opacity = Math.max(0, (1 - cycle) * 0.38);
    });
  });

  return (
    <group position={position}>
      {puffs.map((_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            refs.current[index] = mesh;
          }}
        >
          <sphereGeometry args={[0.38, 12, 12]} />
          <meshStandardMaterial color="#5f6368" transparent opacity={0.3} depthWrite={false} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function DamagedCar({ position = [5.9, 0, -5.6] as Vec3 }) {
  const wheelPositions: Vec3[] = [
    [-1.05, 0.4, -0.72],
    [1.05, 0.4, -0.72],
    [-1.05, 0.4, 0.72],
    [1.05, 0.4, 0.72],
  ];

  return (
    <group position={position} rotation={[0, -0.34, 0]} scale={0.92}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.62, 1.48]} />
        <meshStandardMaterial color="#7c3f32" roughness={0.83} />
      </mesh>
      <mesh position={[-0.4, 1.18, 0]} castShadow>
        <boxGeometry args={[1.45, 0.68, 1.3]} />
        <meshStandardMaterial color="#8b4a3a" roughness={0.8} />
      </mesh>
      <mesh position={[-0.42, 1.26, -0.665]} castShadow>
        <boxGeometry args={[1.05, 0.42, 0.03]} />
        <meshStandardMaterial color="#273746" roughness={0.32} />
      </mesh>
      <mesh position={[-0.2, 1.27, -0.696]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.04, 0.52, 0.035]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} />
      </mesh>

      {/* The bonnet pivots near the cabin and is visibly bent upward. */}
      <group position={[0.55, 1.0, 0]} rotation={[0, 0, 0.42]}>
        <mesh position={[0.72, 0, 0]} castShadow>
          <boxGeometry args={[1.45, 0.13, 1.38]} />
          <meshStandardMaterial color="#6f342a" roughness={0.86} />
        </mesh>
        <mesh position={[0.95, 0.1, 0.16]} rotation={[0.15, 0, -0.18]} castShadow>
          <boxGeometry args={[0.46, 0.08, 0.48]} />
          <meshStandardMaterial color="#5f2a24" roughness={0.95} />
        </mesh>
      </group>

      <mesh position={[1.35, 0.9, -0.77]} castShadow>
        <boxGeometry args={[0.46, 0.24, 0.05]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[1.42, 0.68, -0.77]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[0.78, 0.18, 0.08]} />
        <meshStandardMaterial color="#3f241f" roughness={0.92} />
      </mesh>
      <mesh position={[1.38, 0.92, 0.77]} castShadow>
        <boxGeometry args={[0.32, 0.2, 0.05]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>

      {wheelPositions.map((wheelPosition, index) => (
        <mesh key={index} position={wheelPosition} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.27, 0.09, 10, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.96} />
        </mesh>
      ))}

      <SmokePlume position={[1.45, 1.25, 0]} />
    </group>
  );
}

function Deer({ position = [8.4, 0, -11.3] as Vec3 }) {
  const head = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!head.current) return;
    const t = clock.getElapsedTime();
    head.current.rotation.y = -0.18 + Math.sin(t * 0.7) * 0.18;
    head.current.rotation.z = Math.sin(t * 0.9) * 0.035;
  });

  return (
    <group position={position} rotation={[0, -0.32, 0]} scale={0.78}>
      <mesh position={[0, 1.28, 0]} scale={[1.05, 0.58, 0.48]} castShadow>
        <sphereGeometry args={[0.72, 18, 18]} />
        <meshStandardMaterial color="#a7774f" roughness={0.96} />
      </mesh>
      <mesh position={[0.63, 1.72, 0]} rotation={[0, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.95, 10]} />
        <meshStandardMaterial color="#a7774f" roughness={0.96} />
      </mesh>

      <group ref={head} position={[0.98, 2.02, 0]}>
        <mesh scale={[0.7, 0.5, 0.44]} castShadow>
          <sphereGeometry args={[0.46, 16, 16]} />
          <meshStandardMaterial color="#b38359" roughness={0.96} />
        </mesh>
        <mesh position={[0.36, -0.03, 0]} scale={[0.65, 0.4, 0.35]} castShadow>
          <sphereGeometry args={[0.28, 14, 14]} />
          <meshStandardMaterial color="#c09770" roughness={0.98} />
        </mesh>
        <mesh position={[-0.12, 0.39, -0.22]} rotation={[0.2, 0, -0.2]} castShadow>
          <coneGeometry args={[0.12, 0.38, 8]} />
          <meshStandardMaterial color="#8f623f" roughness={1} />
        </mesh>
        <mesh position={[-0.12, 0.39, 0.22]} rotation={[-0.2, 0, -0.2]} castShadow>
          <coneGeometry args={[0.12, 0.38, 8]} />
          <meshStandardMaterial color="#8f623f" roughness={1} />
        </mesh>
      </group>

      {[-0.48, 0.45].flatMap((x) =>
        [-0.22, 0.22].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.58, z]} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 1.2, 8]} />
            <meshStandardMaterial color="#8f623f" roughness={1} />
          </mesh>
        ))
      )}
      <mesh position={[-0.82, 1.46, 0]} rotation={[0, 0, 0.72]} castShadow>
        <coneGeometry args={[0.09, 0.38, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={1} />
      </mesh>
    </group>
  );
}

function HikingGear({ position = [-3.0, 0.1, 2.0] as Vec3 }) {
  return (
    <group position={position} rotation={[0, 0.28, 0]}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.62, 0.88, 0.38]} />
        <meshStandardMaterial color="#49684d" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.77, 0.22]} castShadow>
        <boxGeometry args={[0.44, 0.24, 0.08]} />
        <meshStandardMaterial color="#324c37" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.72, 14]} />
        <meshStandardMaterial color="#d08a4b" roughness={0.92} />
      </mesh>
      <mesh position={[-0.25, 0.52, 0.24]} rotation={[0, 0, 0.08]}>
        <torusGeometry args={[0.22, 0.035, 8, 18, Math.PI]} />
        <meshStandardMaterial color="#2f4733" roughness={1} />
      </mesh>
      <mesh position={[0.22, 0.52, 0.24]} rotation={[0, 0, -0.08]}>
        <torusGeometry args={[0.22, 0.035, 8, 18, Math.PI]} />
        <meshStandardMaterial color="#2f4733" roughness={1} />
      </mesh>

      {[-0.42, -0.18].map((x, index) => (
        <group key={x} position={[x, 0.58, -0.08]} rotation={[0.04, 0, index === 0 ? -0.2 : -0.12]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.022, 1.8, 8]} />
            <meshStandardMaterial color="#52525b" metalness={0.4} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <torusGeometry args={[0.07, 0.018, 8, 16]} />
            <meshStandardMaterial color="#262626" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <mesh position={[0.72, 0.12, 0.08]} rotation={[Math.PI / 2, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.58, 14]} />
        <meshStandardMaterial color="#64748b" roughness={0.96} />
      </mesh>
    </group>
  );
}

function FenceLine({ position, rotationY = 0, segments = 5 }: { position: Vec3; rotationY?: number; segments?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: segments }, (_, index) => {
        const x = index * 1.35;
        return (
          <group key={index} position={[x, 0, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[0.14, 1.2, 0.14]} />
              <meshStandardMaterial color="#8b6a4f" roughness={0.95} />
            </mesh>
            {index < segments - 1 ? (
              <>
                <mesh position={[0.68, 0.86, 0]} castShadow>
                  <boxGeometry args={[1.25, 0.09, 0.09]} />
                  <meshStandardMaterial color="#9a7658" roughness={0.95} />
                </mesh>
                <mesh position={[0.68, 0.48, 0]} castShadow>
                  <boxGeometry args={[1.25, 0.09, 0.09]} />
                  <meshStandardMaterial color="#9a7658" roughness={0.95} />
                </mesh>
              </>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function TrailSign({ position }: { position: Vec3 }) {
  return (
    <group position={position} rotation={[0, -0.28, 0]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.16, 2.1, 0.16]} />
        <meshStandardMaterial color="#7c5d45" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.7, 0.08]} castShadow>
        <boxGeometry args={[1.15, 0.42, 0.12]} />
        <meshStandardMaterial color="#d9c7a6" roughness={0.95} />
      </mesh>
      <mesh position={[0.26, 1.42, 0.08]} rotation={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[0.82, 0.18, 0.12]} />
        <meshStandardMaterial color="#d9c7a6" roughness={0.95} />
      </mesh>
    </group>
  );
}

function PicnicTable({ position }: { position: Vec3 }) {
  return (
    <group position={position} rotation={[0, 0.35, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.7, 0.12, 0.7]} />
        <meshStandardMaterial color="#9a7658" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[1.2, 0.1, 0.3]} />
        <meshStandardMaterial color="#845f45" roughness={0.96} />
      </mesh>
      {[
        [-0.6, 0.36, -0.22],
        [0.6, 0.36, -0.22],
        [-0.6, 0.36, 0.22],
        [0.6, 0.36, 0.22],
      ].map((p, i) => (
        <mesh key={i} position={p as Vec3} castShadow>
          <boxGeometry args={[0.12, 0.72, 0.12]} />
          <meshStandardMaterial color="#7a5b41" roughness={0.96} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -0.52]} castShadow>
        <boxGeometry args={[1.45, 0.09, 0.28]} />
        <meshStandardMaterial color="#8c674b" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.5, 0.52]} castShadow>
        <boxGeometry args={[1.45, 0.09, 0.28]} />
        <meshStandardMaterial color="#8c674b" roughness={0.96} />
      </mesh>
    </group>
  );
}

function ParkedHatchback({ position, rotation = 0, color = "#55606f" }: { position: Vec3; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.78}>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.58, 1.35]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[-0.25, 1.02, 0]} castShadow>
        <boxGeometry args={[1.35, 0.48, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[-0.25, 1.03, -0.63]}>
        <boxGeometry args={[0.95, 0.28, 0.03]} />
        <meshStandardMaterial color="#314155" roughness={0.35} />
      </mesh>
      <mesh position={[1.08, 0.76, -0.69]}>
        <boxGeometry args={[0.24, 0.18, 0.03]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.18} />
      </mesh>
      {[
        [-0.9, 0.3, -0.62], [0.9, 0.3, -0.62], [-0.9, 0.3, 0.62], [0.9, 0.3, 0.62]
      ].map((p, i) => (
        <mesh key={i} position={p as Vec3} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.24, 0.08, 10, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function TinyPerson({ position, shirt = "#3b82f6", rotation = 0, scale = 1 }: { position: Vec3; shirt?: string; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#f3c8a2" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.24, 0.6, 0.16]} />
        <meshStandardMaterial color={shirt} roughness={0.88} />
      </mesh>
      <mesh position={[-0.09, 0.25, 0]} castShadow>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#1f2937" roughness={0.92} />
      </mesh>
      <mesh position={[0.09, 0.25, 0]} castShadow>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#1f2937" roughness={0.92} />
      </mesh>
    </group>
  );
}

function FestivalCrowd() {
  const people = useMemo(
    () => [
      [-10.8, 0, -13.2, "#ef4444", 0.1, 0.9],
      [-9.7, 0, -13.7, "#10b981", -0.2, 0.82],
      [-8.6, 0, -12.9, "#3b82f6", 0.2, 0.88],
      [-5.8, 0, -15.4, "#f59e0b", 0.1, 0.8],
      [-4.9, 0, -16.1, "#0ea5e9", -0.1, 0.75],
      [-2.6, 0, -14.8, "#84cc16", 0.15, 0.84],
      [0.8, 0, -14.4, "#f97316", -0.1, 0.86],
      [1.9, 0, -15.0, "#8b5cf6", 0.3, 0.76],
      [4.2, 0, -13.8, "#06b6d4", 0.05, 0.8],
      [5.1, 0, -14.3, "#ef4444", -0.2, 0.72],
      [8.4, 0, -12.7, "#22c55e", 0.25, 0.84],
      [9.8, 0, -13.2, "#eab308", 0.1, 0.8],
      [11.1, 0, -14.1, "#3b82f6", -0.15, 0.74],
      [-13.8, 0, -9.4, "#a855f7", 0.2, 0.78],
      [13.2, 0, -9.8, "#f43f5e", -0.2, 0.78],
    ] as Array<[number, number, number, string, number, number]>,
    []
  );

  return (
    <group>
      {people.map(([x, y, z, shirt, rot, scale], index) => (
        <TinyPerson key={index} position={[x, y, z]} shirt={shirt} rotation={rot} scale={scale} />
      ))}
    </group>
  );
}

function FirstAidPicnicSetup({ position = [-5.0, 0, 2.8] as Vec3 }) {
  return (
    <group position={position}>
      <PicnicTable position={[0, 0, 0]} />

      <mesh position={[-0.5, 1.02, -0.08]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.46, 14]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.4} />
      </mesh>
      <mesh position={[-0.5, 1.3, -0.08]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 12]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
      </mesh>
      <group position={[0.15, 0.98, 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.24, 0.3]} />
          <meshStandardMaterial color="#b93b2e" roughness={0.85} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.14, 0.04, 0.18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.04, 0.14, 0.18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[-0.05, 0.98, 0.28]} castShadow>
        <coneGeometry args={[0.14, 0.34, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.88} />
      </mesh>
      <mesh position={[-0.05, 1.08, 0.28]}>
        <torusGeometry args={[0.09, 0.02, 8, 20]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
      </mesh>

      <HikingGear position={[-0.72, 0.1, 1.15]} />
    </group>
  );
}

function SceneProps({ environment }: { environment?: ScenarioState["environment"] }) {
  const cones = useMemo<Vec3[]>(
    () => [
      [0.15, 0.28, 4.35],
      [5.05, 0.28, 2.75],
    ],
    []
  );

  return (
    <>
      {cones.map((position, index) => (
        <group key={index} position={position}>
          <DownloadedConeModel scale={0.42} rotation={[0, index === 0 ? -0.25 : 0.2, 0]} />
        </group>
      ))}

      {/* PPE/supply station set away from the medic path. */}
      <mesh position={[-3.35, 0.7, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 1.32, 0.72]} />
        <meshStandardMaterial color="#36536a" roughness={0.9} />
      </mesh>
      <mesh position={[-3.33, 1.3, 0.51]} castShadow>
        <boxGeometry args={[0.5, 0.22, 0.42]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      <mesh position={[-3.33, 1.1, 0.53]} castShadow>
        <boxGeometry args={[0.28, 0.18, 0.3]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      <mesh position={[4.75, 0.86, 0.9]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 1.72, 0.34]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
      <mesh position={[4.75, 1.92, 0.9]} castShadow>
        <boxGeometry args={[0.88, 0.08, 0.88]} />
        <meshStandardMaterial color="#64748b" roughness={0.75} />
      </mesh>
      <mesh position={[4.75, 1.52, 0.9]} castShadow>
        <boxGeometry args={[0.2, 0.03, 0.3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      <FirstAidPicnicSetup position={[-6.25, 0, 3.15]} />
      <FestivalCrowd />
      <Ambulance position={[-6.0, 0, -4.2]} />
      <DamagedCar position={[4.8, 0.02, -6.05]} />
      <Deer position={[6.8, 0.02, -10.2]} />
      <BarkingDog position={[1.35, 0, 3.1]} secured={environment?.dogSecured} agitated={environment?.dogAgitated} />
    </>
  );
}

export default function ThreeDScene({
  height = 760,
  scenarioId = "anaphylaxis",
  intervention = "none",
  patientState = "distressed",
  sceneFinding,
  sceneSpeaker = "coach",
  interactiveObjects = [],
  selectedObjectId,
  focusedObjectId,
  accessibilityMode,
  environment,
  locationId = "ambulance",
  inventory = [],
  onObjectSelect,
}: ThreeDSceneProps) {
  const activeScenarioId = normalizeSceneVariant(scenarioId);
  const useRoadsideFestivalScene = activeScenarioId === "anaphylaxis";
  const focusObject = interactiveObjects.find((object) => object.id === focusedObjectId);
  const patientPosition: Vec3 = [2.18, 0.08, 1.55];
  const orbitControlsRef = useRef<any>(null);
  const [guideStep, setGuideStep] = useState<GuideStep>("welcome");
  const [guideName, setGuideName] = useState("");
  const [cameraMode, setCameraMode] = useState<CameraMode>("guide");

  const focusGuideParamedic = () => {
    setCameraMode("guide");
    setGuideStep((currentStep) => (currentStep === "done" ? "soon" : currentStep));
  };

  const returnToScene = () => {
    setGuideStep("done");
    setCameraMode("normal");
  };

  const handleSceneViewControl = (action: "zoom-in" | "zoom-out" | "left" | "right") => {
    const controls = orbitControlsRef.current;
    const camera = controls?.object;
    const target = controls?.target as THREE.Vector3 | undefined;
    if (!camera?.position || !target) return;

    if (action === "zoom-in" || action === "zoom-out") {
      const direction = target.clone().sub(camera.position).normalize();
      const distance = camera.position.distanceTo(target);
      if (action === "zoom-in" && distance > CAMERA_MIN_DISTANCE) {
        camera.position.addScaledVector(direction, Math.min(0.85, distance - CAMERA_MIN_DISTANCE));
      }
      if (action === "zoom-out" && distance < CAMERA_MAX_DISTANCE) {
        camera.position.addScaledVector(direction, -Math.min(0.85, CAMERA_MAX_DISTANCE - distance));
      }
    } else {
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      camera.getWorldDirection(forward);
      right.crossVectors(forward, camera.up).normalize();
      const amount = action === "left" ? -0.85 : 0.85;
      camera.position.addScaledVector(right, amount);
      target.addScaledVector(right, amount);
    }

    controls.update?.();
  };

  return (
    <div className="relative h-full w-full" style={{ height }}>
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: NORMAL_CAMERA_POSITION, fov: 50 }}>
        <color attach="background" args={["#86d4ff"]} />
        <fog attach="fog" args={["#dcf4ff", 66, 132]} />
        <SoftShadows size={24} samples={12} focus={0.45} />

        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#e8f7ff", "#8ea563", 1.95]} />
        <directionalLight
          castShadow
          intensity={3.65}
          color="#fff1d4"
          position={[-8, 12, 7]}
          shadow-mapSize-width={1536}
          shadow-mapSize-height={1536}
          shadow-camera-near={0.1}
          shadow-camera-far={38}
          shadow-camera-left={-13}
          shadow-camera-right={13}
          shadow-camera-top={13}
          shadow-camera-bottom={-13}
          shadow-bias={-0.00018}
        />

        {useRoadsideFestivalScene ? <RoadsideFestivalEmergencyScene environment={environment} /> : <BaselineGroundRightTerrain />}
        <GLBParamedicGuide
          position={GUIDE_PARAMEDIC_POSITION}
          rotationY={0.58}
          onClick={focusGuideParamedic}
          showGuidePulse={guideStep === "done"}
        />
        {!useRoadsideFestivalScene ? (
          <>
            <CustomFirstAidBagModel position={[-1.15, 0.06, 1.72]} scale={0.88} rotation={[0, -0.48, 0]} />
            <CustomAmbulanceModel position={[-3.95, 0.52, -0.7]} scale={2.05} rotation={[0, 0.58, 0]} />
          </>
        ) : null}
        <ParamedicGuideDialogue
          step={guideStep}
          userName={guideName}
          onNameChange={setGuideName}
          onNext={() => setGuideStep("name")}
          onDoneName={() => setGuideStep("named")}
          onBegin={returnToScene}
          onReturn={returnToScene}
        />
        <GuideCameraRig
          mode={cameraMode}
          controlsRef={orbitControlsRef}
          onNormalSettled={() => setCameraMode("free")}
        />
        <FindingBubble text={sceneFinding} speaker={sceneSpeaker} />
        <InteractiveLayer
          objects={interactiveObjects}
          selectedObjectId={selectedObjectId}
          accessibilityMode={accessibilityMode}
          onObjectSelect={onObjectSelect}
        />
        <CameraDirector focusObject={focusObject} locationId={locationId} />

        {/*
          Scene reset baseline, 2026-07-12:
          Keep the previous outdoor scene code available, but do not render it while rebuilding.

          <OutdoorEnvironment />
          <SceneProps environment={environment} />
          <EMTCharacter position={locationId === "patientSide" ? [0.62, 0, 0.48] : [-0.65, 0, 0.42]} hasGloves={inventory.includes("gloves")} />
          <PatientCharacter
            position={patientPosition}
            scenarioId={activeScenarioId}
            intervention={intervention}
            patientState={patientState}
            showLabel={locationId === "patientSide"}
          />
          <mesh position={[2.18, 0.045, 1.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.45, 44]} />
            <meshStandardMaterial color="#0f766e" transparent opacity={0.22} roughness={0.9} />
          </mesh>
          <mesh position={[2.18, 0.055, 1.55]} rotation={[-Math.PI / 2, 0, -0.04]} receiveShadow>
            <boxGeometry args={[3.1, 1.32, 0.035]} />
            <meshStandardMaterial color="#2a9d8f" roughness={0.86} />
          </mesh>
          <FindingBubble text={sceneFinding} speaker={sceneSpeaker} />
          <InteractiveLayer
            objects={interactiveObjects}
            selectedObjectId={selectedObjectId}
            accessibilityMode={accessibilityMode}
            onObjectSelect={onObjectSelect}
          />
          <CameraDirector focusObject={focusObject} locationId={locationId} />
        */}

        <OrbitControls
          ref={orbitControlsRef}
          enablePan
          panSpeed={0.35}
          enableDamping
          makeDefault
          minDistance={CAMERA_MIN_DISTANCE}
          maxDistance={CAMERA_MAX_DISTANCE}
          minPolarAngle={CAMERA_MIN_POLAR_ANGLE}
          maxPolarAngle={CAMERA_MAX_POLAR_ANGLE}
          minAzimuthAngle={CAMERA_DEFAULT_AZIMUTH - CAMERA_AZIMUTH_RANGE}
          maxAzimuthAngle={CAMERA_DEFAULT_AZIMUTH + CAMERA_AZIMUTH_RANGE}
          target={NORMAL_CAMERA_TARGET}
        />
      </Canvas>
      <MobileParamedicGuideDialogue
        step={guideStep}
        userName={guideName}
        onNameChange={setGuideName}
        onNext={() => setGuideStep("name")}
        onDoneName={() => setGuideStep("named")}
        onBegin={returnToScene}
        onReturn={returnToScene}
      />
      <SceneViewControls visible={cameraMode === "free"} onViewControl={handleSceneViewControl} />
    </div>
  );
}
