import SickCityGarage from "@/components/SickCityGarage";
import { CityKitModel } from "@/components/SickCityDesignedAssets";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  DownloadedBenchModel,
  DownloadedMossyRockModel,
} from "@/components/worldassets/CustomSceneAssets";

type Point = [number, number, number];

const HELL_SLAMMER_URL = "/models/sickcity/props/hell-slammer-a.glb";

type BuildingPlacement = {
  id: string;
  kind: "small" | "regular" | "large";
  position: Point;
  rotation: number;
  scale: number;
  tint?: string;
};

const BUILDINGS: BuildingPlacement[] = [
  ...[-54, -18, 54].map((x, index) => ({
    id: `north-edge-${x}`,
    kind: index === 1 ? "large" as const : "regular" as const,
    position: [x, 0, -51] as Point,
    rotation: Math.PI,
    scale: index === 1 ? 1.12 : 1.32,
  })),
  ...[-18, 18, 54].map((x, index) => ({
    id: `south-edge-${x}`,
    kind: index === 1 ? "regular" as const : "small" as const,
    position: [x, 0, 51] as Point,
    rotation: 0,
    scale: index === 1 ? 1.28 : 1.38,
  })),
  ...[-54, -18, 18, 54].map((x, index) => ({
    id: `north-inner-${x}`,
    kind: index % 3 === 0 ? "regular" as const : "small" as const,
    position: [x, 0, -17] as Point,
    rotation: Math.PI,
    scale: index % 3 === 0 ? 1.28 : 1.36,
  })),
  ...[-54, -18, 18, 54].map((x, index) => ({
    id: `south-inner-${x}`,
    kind: index % 3 === 1 ? "regular" as const : "small" as const,
    position: [x, 0, 17] as Point,
    rotation: 0,
    scale: index % 3 === 1 ? 1.28 : 1.36,
  })),
];

export const SICK_CITY_BUILDING_CENTERS = BUILDINGS.map(({ position }) => position);

const TREE_POSITIONS: Point[] = [
  [12, 0, 14], [20, 0, 17], [27, 0, 13], [46, 0, 14], [54, 0, 20],
  [14, 0, 25], [24, 0, 23], [46, 0, 25], [54, 0, 25], [18, 0, 48],
  [-61, 0, 18], [-52, 0, 24], [-21, 0, 20], [-12, 0, 25],
  [-62, 0, -24], [-20, 0, -24], [17, 0, -24], [27, 0, -19], [61, 0, -20],
];

function Tree({ position, scale = 1 }: { position: Point; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.36, 3.2, 8]} />
        <meshStandardMaterial color="#765035" roughness={0.94} />
      </mesh>
      <mesh position={[0, 3.75, 0]} castShadow>
        <dodecahedronGeometry args={[1.65, 0]} />
        <meshStandardMaterial color="#3f8048" roughness={0.92} />
      </mesh>
      <mesh position={[-0.9, 3.42, 0.18]} castShadow>
        <dodecahedronGeometry args={[1.02, 0]} />
        <meshStandardMaterial color="#569a54" roughness={0.92} />
      </mesh>
      <mesh position={[0.9, 3.55, -0.12]} castShadow>
        <dodecahedronGeometry args={[1.08, 0]} />
        <meshStandardMaterial color="#4c914e" roughness={0.92} />
      </mesh>
    </group>
  );
}

function GrassSlammer({ position, rotation = 0 }: { position: Point; rotation?: number }) {
  const source = useGLTF(HELL_SLAMMER_URL, "/draco/");
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
    <group ref={root} position={position} rotation={[0, rotation, 0]} scale={1}>
      <primitive object={model} />
    </group>
  );
}

function Building({ placement }: { placement: BuildingPlacement }) {
  const asset = placement.kind === "large" ? "civic-apartments"
    : placement.kind === "regular" ? "market-corner" : "riverside-cafe";
  return <CityKitModel asset={asset} position={placement.position} rotation={placement.rotation} />;
}

function Crosswalk({ position }: { position: Point }) {
  return (
    <group position={position}>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-3.3 + index * 0.82, 0.112, 0]} receiveShadow>
          <boxGeometry args={[0.42, 0.025, 7.5]} />
          <meshStandardMaterial color="#edf0eb" />
        </mesh>
      ))}
    </group>
  );
}

function StreetLight({ position, rotation = 0 }: { position: Point; rotation?: number }) {
  return (
    <group userData={{careFade:true}} position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 3.6, 8]} />
        <meshStandardMaterial color="#253239" metalness={0.28} roughness={0.62} />
      </mesh>
      <mesh position={[0.34, 3.52, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.68, 8]} />
        <meshStandardMaterial color="#253239" metalness={0.28} roughness={0.62} />
      </mesh>
      <mesh position={[0.68, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 24]} />
        <meshBasicMaterial color="#ffd99a" transparent opacity={0.09} depthWrite={false} />
      </mesh>
      <mesh position={[0.68, 3.48, 0]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshStandardMaterial color="#fff3bd" emissive="#ffe89a" emissiveIntensity={2.4} />
      </mesh>
    </group>
  );
}

function ParkedCar({ position, rotation = 0, color }: { position: Point; rotation?: number; color: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[3.2, 0.72, 1.55]} />
        <meshStandardMaterial color={color} roughness={0.72} metalness={0.05} />
      </mesh>
      <mesh position={[-0.25, 1.15, 0]} castShadow>
        <boxGeometry args={[1.65, 0.62, 1.38]} />
        <meshStandardMaterial color={color} roughness={0.72} metalness={0.05} />
      </mesh>
      <mesh position={[-0.25, 1.18, -0.71]}>
        <boxGeometry args={[1.35, 0.42, 0.05]} />
        <meshStandardMaterial color="#5e7882" roughness={0.35} metalness={0.08} />
      </mesh>
      {[-1.05, 1.05].flatMap((x) => [-0.76, 0.76].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.34, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.24, 12]} />
          <meshStandardMaterial color="#24282a" roughness={0.9} />
        </mesh>
      )))}
    </group>
  );
}

function MarketStall({ position, color }: { position: Point; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[3.8, 0.22, 2.6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.75, 0]} castShadow>
        <coneGeometry args={[2.45, 1.1, 4]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {[[-1.65, 1.95, -1.05], [1.65, 1.95, -1.05], [-1.65, 1.95, 1.05], [1.65, 1.95, 1.05]].map((post, index) => (
        <mesh key={index} position={post as Point}>
          <cylinderGeometry args={[0.06, 0.08, 3.2, 7]} />
          <meshStandardMaterial color="#5b4938" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[3.25, 0.16, 2]} />
        <meshStandardMaterial color="#d9b477" roughness={0.9} />
      </mesh>
    </group>
  );
}

function TransitShelter({ position, rotation = 0 }: { position: Point; rotation?: number }) {
  return (
    <group userData={{careFade:true}} position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.65, 0.75]}>
        <boxGeometry args={[4.5, 3.3, 0.12]} />
        <meshStandardMaterial color="#8ec4cf" transparent opacity={0.48} metalness={0.05} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <boxGeometry args={[5, 0.2, 2]} />
        <meshStandardMaterial color="#2d5961" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, 0.3]}>
        <boxGeometry args={[3.6, 0.18, 0.65]} />
        <meshStandardMaterial color="#76573d" roughness={0.94} />
      </mesh>
      {[-1.65, 1.65].map((x) => (
        <mesh key={x} position={[x, 0.35, 0.3]}>
          <boxGeometry args={[0.12, 0.7, 0.55]} />
          <meshStandardMaterial color="#314249" roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function CivicFountain() {
  return (
    <group position={[18, 0, -19]}>
      <mesh position={[0, 0.38, 0]} receiveShadow>
        <cylinderGeometry args={[4.8, 5.1, 0.72, 32]} />
        <meshStandardMaterial color="#b7b5aa" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[4.15, 4.15, 0.18, 32]} />
        <meshStandardMaterial color="#4f9eb4" roughness={0.32} metalness={0.05} />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.62, 2.6, 12]} />
        <meshStandardMaterial color="#d5d3c8" roughness={0.88} />
      </mesh>
      <mesh position={[0, 3.28, 0]}>
        <sphereGeometry args={[0.34, 12, 10]} />
        <meshStandardMaterial color="#78cde0" emissive="#62b7ca" emissiveIntensity={0.14} />
      </mesh>
    </group>
  );
}

function FireHydrant({ position }: { position: Point }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.9, 10]} />
        <meshStandardMaterial color="#d84b3f" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color="#df5a47" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.72, 9]} />
        <meshStandardMaterial color="#c33c34" roughness={0.74} />
      </mesh>
    </group>
  );
}

function DistrictSign({ position, title, subtitle }: { position: Point; title: string; subtitle: string }) {
  return (
    <Html position={position} center distanceFactor={16} zIndexRange={[3, 0]} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded border border-white/30 bg-[#09242b]/88 px-3 py-2 text-center text-white shadow-xl backdrop-blur-md">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-300">{subtitle}</p>
        <p className="mt-0.5 text-sm font-black">{title}</p>
      </div>
    </Html>
  );
}

function RiversidePark() {
  return (
    <group>
      <mesh position={[37, -0.02, 31]} receiveShadow>
        <boxGeometry args={[57, 0.15, 56]} />
        <meshStandardMaterial color="#6fa85a" roughness={1} />
      </mesh>
      <mesh position={[47, 0.04, 39]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9.2, 40]} />
        <meshStandardMaterial color="#4d9ab0" roughness={0.38} metalness={0.04} />
      </mesh>
      <mesh position={[47, 0.02, 39]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.2, 10.2, 40]} />
        <meshStandardMaterial color="#b8a47c" roughness={1} />
      </mesh>
      <DownloadedBenchModel position={[26, 0.05, 25]} rotation={[0, Math.PI / 2, 0]} scale={0.52} />
      <DownloadedBenchModel position={[52, 0.05, 23]} rotation={[0, -Math.PI / 2, 0]} scale={0.52} />
      <DownloadedBenchModel position={[33, 0.05, 49]} rotation={[0, 0, 0]} scale={0.52} />
      <DistrictSign position={[37, 5.2, 13]} title="Riverside Park" subtitle="East District" />
    </group>
  );
}

function Hospital() {
  return (
    <group position={[22, 0, -47]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[17, 9.2, 11]} />
        <meshStandardMaterial color="#e8ece9" roughness={0.8} />
      </mesh>
      <mesh position={[0, 9.9, 0]} castShadow>
        <boxGeometry args={[8, 1.4, 2]} />
        <meshStandardMaterial color="#f3f6f4" roughness={0.75} />
      </mesh>
      <mesh position={[0, 9.9, -1.04]}>
        <boxGeometry args={[1.2, 0.95, 0.08]} />
        <meshStandardMaterial color="#d94747" emissive="#a91f2b" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 9.9, -1.09]}>
        <boxGeometry args={[0.95, 1.2, 0.08]} />
        <meshStandardMaterial color="#d94747" emissive="#a91f2b" emissiveIntensity={0.1} />
      </mesh>
      {[-5.5, 0, 5.5].map((x) => [2.2, 5.1, 7.7].map((y) => (
        <mesh key={`${x}-${y}`} position={[x, y, -5.56]}>
          <boxGeometry args={[2.3, 1.35, 0.1]} />
          <meshStandardMaterial color="#7fb4c5" metalness={0.08} roughness={0.36} />
        </mesh>
      )))}
      <mesh position={[0,1.6,-5.64]}><boxGeometry args={[3.8,3.2,.12]}/><meshStandardMaterial color="#24444e"/></mesh>
      {[-.91,.91].map(x=><group key={`receiving-${x}`}>
        <mesh position={[x,1.6,-5.73]}><boxGeometry args={[1.74,2.95,.06]}/><meshStandardMaterial color="#73afb8" metalness={.2} roughness={.25}/></mesh>
        <mesh position={[x*.18,1.45,-5.8]}><boxGeometry args={[.05,.6,.06]}/><meshStandardMaterial color="#e8efed"/></mesh>
      </group>)}
      <mesh position={[0,3.55,-7]} castShadow><boxGeometry args={[6,.22,3.3]}/><meshStandardMaterial color="#294a54"/></mesh>
      <DistrictSign position={[0,4.2,-6.4]} title="Patient receiving" subtitle="EMERGENCY · HOSPITAL HANDOFF"/>
      <mesh position={[0, .08, 10]} receiveShadow><boxGeometry args={[20, .14, 16]} /><meshStandardMaterial color="#566272" roughness={.8} /></mesh>
      <mesh position={[0, 3.4, 7.3]} castShadow><boxGeometry args={[12, .35, 5]} /><meshStandardMaterial color="#294a54" /></mesh>
      {[-5.5, 5.5].map(x => <mesh key={x} position={[x, 1.7, 9.4]}><boxGeometry args={[.22, 3.4, .22]} /><meshStandardMaterial color="#d9e2e0" /></mesh>)}
      <mesh position={[0, 1.55, 5.59]}><boxGeometry args={[3.4, 3, .12]} /><meshStandardMaterial color="#6aabb4" metalness={.25} roughness={.22} /></mesh>
      {[-5, 5].map(x => <mesh key={`bay-${x}`} position={[x, .17, 13]}><boxGeometry args={[.12, .025, 7]} /><meshStandardMaterial color="#edd895" /></mesh>)}
      <DistrictSign position={[0, 4.2, 9.9]} title="Ambulance entrance" subtitle="Unit 07 · Pickup bay" />
      <DistrictSign position={[0, 12.8, 0]} title="SickCity Medical" subtitle="Hospital" />
    </group>
  );
}

function FireStation() {
  return (
    <group position={[-52, 0, 49]}>
      <mesh position={[0, 3.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[17, 6.6, 12]} />
        <meshStandardMaterial color="#d9c8ad" roughness={0.88} />
      </mesh>
      {[-4.8, 0, 4.8].map((x) => (
        <mesh key={x} position={[x, 2.55, -6.05]}>
          <boxGeometry args={[3.8, 4.7, 0.12]} />
          <meshStandardMaterial color="#9e2f32" roughness={0.7} />
        </mesh>
      ))}
      <DistrictSign position={[0, 8.2, 0]} title="Station 68" subtitle="Home base" />
    </group>
  );
}

export default function SickCityEnvironment() {
  const lights = useMemo<Point[]>(() => [
    [-62, 0, -6], [-48, 0, -6], [-27, 0, -6], [-12, 0, -6], [12, 0, -6], [27, 0, -6], [48, 0, -6], [62, 0, -6],
    [-62, 0, 6], [-43, 0, 6], [-24, 0, 6], [-8, 0, 6], [13, 0, 6], [31, 0, 6], [52, 0, 6],
  ], []);

  return (
    <group>
      {[-36, 0, 36].flatMap((x) => [-34, 0, 34].map((z) => <Crosswalk key={`${x}-${z}`} position={[x, 0, z]} />))}
      {BUILDINGS.map((placement) => <Building key={placement.id} placement={placement} />)}
      <Hospital />
      <SickCityGarage />
      <FireStation />
      <RiversidePark />
      <CivicFountain />
      <GrassSlammer position={[-10, 0.08, 16]} rotation={Math.PI * 0.2} />
      <MarketStall position={[-27, 0.1, -22]} color="#c94f48" />
      <MarketStall position={[-21.8, 0.1, -22]} color="#e0a33b" />
      <MarketStall position={[-16.6, 0.1, -22]} color="#3f8f78" />
      <TransitShelter position={[-15.5, 0.1, 28.4]} rotation={Math.PI} />
      <TransitShelter position={[22, 0.1, -28.4]} />
      <ParkedCar position={[-16, 0.1, 2.6]} color="#b7473d" />
      <ParkedCar position={[12, 0.1, -2.6]} rotation={Math.PI} color="#376a8c" />
      <ParkedCar position={[52, 0.1, 31.4]} color="#d1a13b" />
      <ParkedCar position={[-45, 0.1, 36.6]} rotation={Math.PI} color="#62725e" />
      <FireHydrant position={[-31, 0.1, -6.2]} />
      <FireHydrant position={[31, 0.1, 6.2]} />
      <FireHydrant position={[-41, 0.1, 28.5]} />
      <FireHydrant position={[43, 0.1, 39.4]} />
      {TREE_POSITIONS.map((position, index) => <Tree key={`city-tree-${index}`} position={position} scale={0.78 + (index % 4) * 0.07} />)}
      {lights.map((position, index) => <StreetLight key={`light-${index}`} position={position} rotation={index % 2 ? Math.PI : 0} />)}
      <DownloadedMossyRockModel position={[57, 0.1, 52]} scale={1.4} rotation={[0, 0.4, 0]} />
      <DownloadedMossyRockModel position={[15, 0.1, 43]} scale={0.9} rotation={[0, -0.8, 0]} />
      <DistrictSign position={[-30, 6.2, -9]} title="Maple Market" subtitle="West District" />
      <DistrictSign position={[4, 6.2, -29]} title="Civic Center" subtitle="North District" />
      <DistrictSign position={[-30, 6.2, 29]} title="Station Quarter" subtitle="South District" />
    </group>
  );
}

useGLTF.preload(HELL_SLAMMER_URL, "/draco/");
