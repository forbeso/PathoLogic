import { memo, Suspense, useEffect, useRef, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { CustomAmbulanceModel } from "@/components/worldassets/CustomSceneAssets";
import { TRIAGE_CATEGORY_META } from "../engine";
import type {
  PatientRuntimeState,
  TriagePatient,
} from "../types";

type SceneProps = {
  patients: TriagePatient[];
  patientStates: Record<string, PatientRuntimeState>;
  selectedPatientId: string | null;
  hoveredPatientId: string | null;
  interactionEnabled: boolean;
  onSelectPatient: (patientId: string) => void;
  onHoverPatient: (patientId: string | null) => void;
};

const SKIN = "#b97750";
const PANTS = "#26364a";
const SHIRTS = [
  "#0f766e",
  "#334155",
  "#1d4ed8",
  "#7c3aed",
  "#991b1b",
  "#155e75",
  "#713f12",
  "#475569",
];

function Limb({
  position,
  rotation = [0, 0, 0],
  length = 0.58,
  color = SKIN,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <capsuleGeometry args={[0.09, length, 6, 10]} />
      <meshStandardMaterial color={color} roughness={0.82} />
    </mesh>
  );
}

function StandingFigure({ patient, shirt }: { patient: TriagePatient; shirt: string }) {
  const waving = patient.id === "patient-02";
  const walking = patient.position === "walking";
  return (
    <group>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.16, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.55, 6, 10]} />
        <meshStandardMaterial color={shirt} roughness={0.86} />
      </mesh>
      <Limb
        position={[-0.24, 1.24, 0]}
        rotation={[0, 0, waving ? -1.1 : -0.12]}
        color={shirt}
        length={0.48}
      />
      <Limb
        position={[0.24, waving ? 1.52 : 1.22, 0]}
        rotation={[0, 0, waving ? 1.05 : 0.12]}
        color={shirt}
        length={0.48}
      />
      <Limb
        position={[-0.13, 0.48, walking ? -0.08 : 0]}
        rotation={[walking ? 0.18 : 0, 0, -0.02]}
        color={PANTS}
        length={0.72}
      />
      <Limb
        position={[0.13, 0.48, walking ? 0.08 : 0]}
        rotation={[walking ? -0.18 : 0, 0, 0.02]}
        color={PANTS}
        length={0.72}
      />
    </group>
  );
}

function SeatedFigure({ patient, shirt }: { patient: TriagePatient; shirt: string }) {
  const kneeling = patient.position === "kneeling";
  return (
    <group>
      <mesh position={[0, kneeling ? 1.18 : 1.05, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.82} />
      </mesh>
      <mesh position={[0, kneeling ? 0.76 : 0.64, 0]} castShadow>
        <capsuleGeometry args={[0.23, 0.48, 6, 10]} />
        <meshStandardMaterial color={shirt} roughness={0.86} />
      </mesh>
      <Limb position={[-0.27, 0.69, 0]} rotation={[0.1, 0, -0.24]} color={shirt} />
      <Limb position={[0.27, 0.69, 0]} rotation={[-0.1, 0, 0.24]} color={shirt} />
      <Limb
        position={[-0.22, 0.25, 0.2]}
        rotation={[kneeling ? 1.15 : 0.82, 0, -0.05]}
        color={PANTS}
        length={0.62}
      />
      <Limb
        position={[0.22, 0.25, 0.2]}
        rotation={[kneeling ? 1.15 : 0.82, 0, 0.05]}
        color={PANTS}
        length={0.62}
      />
      {patient.id === "patient-04" ? (
        <mesh position={[0.37, 0.67, 0.03]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.14, 0.28, 0.16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}

function LyingFigure({ patient, shirt }: { patient: TriagePatient; shirt: string }) {
  const prone = patient.position === "prone";
  const trapped = patient.position === "trapped";
  return (
    <group position={[0, 0.18, 0]}>
      <mesh position={[-0.8, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.21, 16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.82} />
      </mesh>
      <mesh position={[-0.28, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.23, 0.58, 6, 10]} />
        <meshStandardMaterial color={shirt} roughness={0.86} />
      </mesh>
      <Limb position={[-0.3, 0.1, -0.3]} rotation={[0, 0, 1.42]} color={shirt} />
      <Limb position={[-0.3, 0.1, 0.3]} rotation={[0, 0, 1.42]} color={shirt} />
      <Limb position={[0.54, 0.12, -0.13]} rotation={[0, 0, 1.5]} color={PANTS} length={0.72} />
      <Limb position={[0.54, 0.12, 0.13]} rotation={[0, 0, 1.5]} color={PANTS} length={0.72} />
      {patient.id === "patient-05" ? (
        <mesh position={[0.65, 0.015, 0.23]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.36, 18]} />
          <meshStandardMaterial color="#7f1d1d" transparent opacity={0.78} />
        </mesh>
      ) : null}
      {trapped ? (
        <mesh position={[0.2, 0.42, -0.28]} rotation={[0.18, 0.15, -0.1]} castShadow>
          <boxGeometry args={[1.15, 0.22, 0.6]} />
          <meshStandardMaterial color="#4b5563" roughness={0.96} />
        </mesh>
      ) : null}
      {prone ? (
        <mesh position={[-0.25, 0.41, 0]}>
          <boxGeometry args={[0.75, 0.04, 0.42]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}

function PatientFigure({
  patient,
  runtime,
  index,
  selected,
  hovered,
  interactionEnabled,
  onSelectPatient,
  onHoverPatient,
}: {
  patient: TriagePatient;
  runtime: PatientRuntimeState;
  index: number;
  selected: boolean;
  hovered: boolean;
  interactionEnabled: boolean;
  onSelectPatient: (patientId: string) => void;
  onHoverPatient: (patientId: string | null) => void;
}) {
  const figure = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion();
  const { size } = useThree();
  const distress = patient.initialFindings.respiratoryDistress;
  const isUpright = patient.position === "walking" || patient.position === "standing";
  const portrait = size.width / size.height < 0.82;
  const figurePosition: [number, number, number] =
    patient.id === "patient-08" && portrait
      ? [3.25, 0, -2.65]
      : patient.visualPosition;
  const markerHeight = isUpright ? 2.25 : patient.position === "seated" || patient.position === "kneeling" ? 1.7 : 1.2;
  const markerDistanceFactor = portrait ? 16 : 10;

  useFrame(({ clock }) => {
    if (!figure.current || reduceMotion) return;
    const t = clock.getElapsedTime();
    figure.current.position.y =
      patient.position === "walking" ? Math.abs(Math.sin(t * 2.2)) * 0.035 : 0;
    if (distress) figure.current.scale.y = 1 + Math.sin(t * 4) * 0.015;
  });

  const assignedMeta = runtime.assignedCategory
    ? TRIAGE_CATEGORY_META[runtime.assignedCategory]
    : null;

  return (
    <group
      position={figurePosition}
      rotation={patient.visualRotation ?? [0, 0, 0]}
      onClick={(event) => {
        event.stopPropagation();
        if (interactionEnabled) onSelectPatient(patient.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (interactionEnabled) onHoverPatient(patient.id);
      }}
      onPointerOut={() => onHoverPatient(null)}
    >
      <group ref={figure}>
        {isUpright ? (
          <StandingFigure patient={patient} shirt={SHIRTS[index]} />
        ) : patient.position === "seated" || patient.position === "kneeling" ? (
          <SeatedFigure patient={patient} shirt={SHIRTS[index]} />
        ) : (
          <LyingFigure patient={patient} shirt={SHIRTS[index]} />
        )}
      </group>

      <mesh
        position={[0, 0.025, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={selected || hovered || !runtime.locked}
      >
        <ringGeometry args={[0.48, 0.62, 32]} />
        <meshBasicMaterial
          color={selected ? "#5eead4" : hovered ? "#67e8f9" : "#dbeafe"}
          transparent
          opacity={selected ? 0.95 : hovered ? 0.75 : 0.28}
          depthWrite={false}
        />
      </mesh>

      <Html center position={[0, markerHeight, 0]} distanceFactor={markerDistanceFactor} zIndexRange={[20, 5]}>
        <button
          type="button"
          data-testid={`triage-patient-${patient.id}`}
          aria-label={`${patient.displayName}, ${runtime.locked ? `tagged ${assignedMeta?.name}` : "not yet tagged"}`}
          disabled={!interactionEnabled}
          onClick={(event) => {
            event.stopPropagation();
            onSelectPatient(patient.id);
          }}
          onFocus={() => onHoverPatient(patient.id)}
          onBlur={() => onHoverPatient(null)}
          className={`group grid min-h-10 min-w-10 place-items-center border-2 px-2 py-1 text-[11px] font-black shadow-xl transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950 ${
            assignedMeta
              ? "rounded-sm text-white"
              : "rounded-full border-white/80 bg-slate-950/88 text-white hover:scale-105 hover:border-teal-300"
          }`}
          style={
            assignedMeta
              ? {
                  backgroundColor: assignedMeta.color,
                  borderColor:
                    runtime.assignedCategory === "delayed" ? "#713f12" : "white",
                  color:
                    runtime.assignedCategory === "delayed" ? "#1c1917" : "white",
                }
              : undefined
          }
        >
          {assignedMeta ? (
            <span className="whitespace-nowrap">
              {assignedMeta.icon} {assignedMeta.name}
            </span>
          ) : (
            patient.id.slice(-2)
          )}
        </button>
      </Html>
    </group>
  );
}

function DamagedCar({
  position,
  overturned = false,
  color,
}: {
  position: [number, number, number];
  overturned?: boolean;
  color: string;
}) {
  return (
    <group
      position={position}
      rotation={overturned ? [0.15, -0.35, 1.22] : [0, 0.24, 0]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.65, 1.45]} />
        <meshStandardMaterial color={color} roughness={0.76} metalness={0.08} />
      </mesh>
      <mesh position={[-0.2, 0.58, 0]} castShadow>
        <boxGeometry args={[1.65, 0.72, 1.3]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[-0.2, 0.64, 0.66]}>
        <boxGeometry args={[1.38, 0.48, 0.035]} />
        <meshStandardMaterial color="#294052" roughness={0.3} />
      </mesh>
      <mesh position={[1.48, 0.2, 0]} rotation={[0, 0, 0.18]} castShadow>
        <boxGeometry args={[0.35, 0.55, 1.38]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.9} />
      </mesh>
      {[-1.05, 1.02].flatMap((x) =>
        [-0.75, 0.75].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.25, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.18, 16]} />
            <meshStandardMaterial color="#111827" roughness={0.96} />
          </mesh>
        ))
      )}
    </group>
  );
}

function SceneControls() {
  const { camera, size } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    const portrait = size.width / size.height < 0.82;
    camera.position.set(0, portrait ? 7.4 : 5.7, portrait ? 15.2 : 10.8);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = portrait ? 45 : 42;
      camera.updateProjectionMatrix();
    }
    controls.current?.target.set(0, 0.65, 0);
    controls.current?.update();
  }, [camera, size.height, size.width]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0.65, 0]}
      minDistance={8.5}
      maxDistance={24}
      minPolarAngle={0.55}
      maxPolarAngle={1.42}
      enablePan={false}
      rotateSpeed={0.55}
      zoomSpeed={0.65}
    />
  );
}

function RoadsideDiorama(props: SceneProps) {
  const { size } = useThree();
  const portrait = size.width / size.height < 0.82;

  return (
    <>
      <color attach="background" args={["#7fc4ea"]} />
      <fog attach="fog" args={["#b9d8df", 19, 34]} />
      <hemisphereLight intensity={1.25} color="#e0f2fe" groundColor="#334b36" />
      <directionalLight
        castShadow
        position={[-7, 12, 8]}
        intensity={2.1}
        color="#fff4d6"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 15]} />
        <meshStandardMaterial color="#567747" roughness={1} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 7.4]} />
        <meshStandardMaterial color="#3e4850" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.045, 3.65]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 0.7]} />
        <meshStandardMaterial color="#987a53" roughness={1} />
      </mesh>
      <mesh position={[0, 0.045, -3.65]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 0.7]} />
        <meshStandardMaterial color="#987a53" roughness={1} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh
          key={`lane-${index}`}
          position={[-7.9 + index * 1.75, 0.055, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1.05, 0.11]} />
          <meshBasicMaterial color="#f4d35e" />
        </mesh>
      ))}
      {[-3.55, 3.55].map((z) => (
        <mesh key={z} position={[0, 0.058, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 0.09]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}

      <Suspense fallback={null}>
        <CustomAmbulanceModel
          position={[portrait ? -2.9 : -5.25, 1.55, -3.05]}
          rotation={[0, 0.42, 0]}
          scale={6.2}
        />
      </Suspense>
      <DamagedCar position={[-2.15, 0.62, -0.2]} color="#315d86" />
      <DamagedCar position={[2.8, 0.78, 0.7]} color="#8b3e31" overturned />

      {[
        [-0.9, 0.13, -1.2, 0.2],
        [1.8, 0.11, 2.4, -0.5],
        [4.6, 0.12, -2.1, 0.8],
        [-5.1, 0.1, -0.5, 0.4],
        [0.4, 0.08, 3.0, -0.2],
      ].map(([x, y, z, rotation], index) => (
        <mesh key={`debris-${index}`} position={[x, y, z]} rotation={[0.2, rotation, 0.1]} castShadow>
          <boxGeometry args={[0.38 + (index % 2) * 0.2, 0.16, 0.24]} />
          <meshStandardMaterial color={index % 2 ? "#374151" : "#6b7280"} roughness={0.96} />
        </mesh>
      ))}

      {props.patients.map((patient, index) => (
        <PatientFigure
          key={patient.id}
          patient={patient}
          runtime={props.patientStates[patient.id]}
          index={index}
          selected={props.selectedPatientId === patient.id}
          hovered={props.hoveredPatientId === patient.id}
          interactionEnabled={props.interactionEnabled}
          onSelectPatient={props.onSelectPatient}
          onHoverPatient={props.onHoverPatient}
        />
      ))}

      <ContactShadows
        position={[0, 0.065, 0]}
        opacity={0.34}
        scale={22}
        blur={2.4}
        far={6}
      />
      <SceneControls />
    </>
  );
}

function TriageSceneComponent(props: SceneProps) {
  return (
    <div className="absolute inset-0" data-testid="triage-scene">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 5.7, 10.8], fov: 42, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <RoadsideDiorama {...props} />
      </Canvas>
    </div>
  );
}

export const TriageScene = memo(TriageSceneComponent);
