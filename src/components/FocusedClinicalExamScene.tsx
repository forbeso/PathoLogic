import { ContactShadows, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, type ElementRef, type RefObject } from "react";
import * as THREE from "three";
import type { FocusedClinicalLabId } from "@/lib/focusedClinicalExams";

type FocusedClinicalExamSceneProps = {
  labId: FocusedClinicalLabId;
  caseId: string;
  modelLabel: string;
  availableFindings: string[];
  examinedFindings: string[];
  findingLabels: Record<string, string>;
  onExamine: (findingId: string) => void;
};

type OrbitControlsHandle = ElementRef<typeof OrbitControls>;

type MarkerConfig = {
  id: string;
  position: [number, number, number];
  tone?: "teal" | "amber" | "rose";
  labelSide?: "left" | "center" | "right";
};

const WRIST_MARKERS: MarkerConfig[] = [
  { id: "wrist-appearance", position: [0.65, 0.84, 0.2], labelSide: "right" },
  { id: "wrist-skin", position: [-0.62, 0.73, 0.3], labelSide: "left" },
  { id: "distal-radius", position: [-0.52, 0.92, -0.08], labelSide: "left" },
  { id: "snuffbox", position: [0.9, 0.66, 0.82], tone: "amber", labelSide: "right" },
  { id: "scaphoid-tubercle", position: [0.12, 0.48, 0.62], tone: "amber", labelSide: "left" },
  { id: "radial-pulse", position: [0.72, 1.02, -0.18], labelSide: "right" },
  { id: "capillary-refill", position: [-0.82, 0.26, 2.02], labelSide: "left" },
  { id: "median-sensation", position: [-0.12, 0.22, 2.25], labelSide: "center" },
  { id: "ulnar-sensation", position: [-0.94, 0.52, 1.35], labelSide: "left" },
  { id: "radial-sensation", position: [0.72, 0.74, 1.2], labelSide: "right" },
  { id: "thumb-opposition", position: [0.92, 0.43, 1.28], labelSide: "right" },
  { id: "finger-abduction", position: [-0.38, 0.25, 2.28], labelSide: "center" },
  { id: "wrist-extension", position: [0.03, 1.14, 0.22], labelSide: "center" },
];

const NEURO_MARKERS: MarkerConfig[] = [
  { id: "responsiveness", position: [0, 2.85, 0.36], labelSide: "right" },
  { id: "speech", position: [0, 2.24, 0.54], labelSide: "right" },
  { id: "facial-symmetry", position: [-0.8, 2.32, 0.42], labelSide: "left" },
  { id: "gaze", position: [0.58, 2.62, 0.52], tone: "amber", labelSide: "right" },
  { id: "pupils", position: [-0.12, 2.84, 0.54], labelSide: "center" },
  { id: "arm-drift", position: [1.14, 1.35, 0.26], labelSide: "right" },
  { id: "grip", position: [-1.15, 0.82, 0.25], labelSide: "left" },
  { id: "leg-strength", position: [0.5, 0.14, 0.2], labelSide: "right" },
  { id: "neuro-sensation", position: [-0.66, 1.42, 0.5], labelSide: "left" },
  { id: "coordination", position: [0.7, 1.76, 0.42], labelSide: "right" },
  { id: "blood-glucose", position: [-1.08, 0.9, 0.25], tone: "amber", labelSide: "left" },
  { id: "last-known-well", position: [1.08, 0.9, 0.25], tone: "amber", labelSide: "right" },
];

function ResponsiveCamera({
  labId,
  controlsRef,
}: {
  labId: FocusedClinicalLabId;
  controlsRef: RefObject<OrbitControlsHandle | null>;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const portrait = size.width <= 600;
    if (labId === "neuro") {
      camera.position.set(portrait ? 0.2 : 4.3, portrait ? 2.25 : 2.9, portrait ? 7.2 : 6.6);
      controls.target.set(0, 1.55, 0);
    } else {
      camera.position.set(portrait ? 4.8 : 4.35, portrait ? 3.75 : 3.0, portrait ? 7.8 : 6.4);
      controls.target.set(0, 0.85, 0.72);
    }
    camera.updateProjectionMatrix();
    controls.update();
    controls.saveState();
  }, [camera, controlsRef, labId, size.width]);

  return null;
}

function ExamMarker({
  marker,
  label,
  completed,
  onSelect,
}: {
  marker: MarkerConfig;
  label: string;
  completed: boolean;
  onSelect: () => void;
}) {
  const color = marker.tone === "amber" ? "#f59e0b" : marker.tone === "rose" ? "#fb7185" : "#2dd4bf";
  const labelPosition = marker.labelSide === "right"
    ? "left-full ml-2"
    : marker.labelSide === "left"
      ? "right-full mr-2"
      : "left-1/2 -translate-x-1/2 top-full mt-2";

  return (
    <group position={marker.position}>
      <mesh>
        <sphereGeometry args={[0.06, 22, 22]} />
        <meshStandardMaterial
          color={completed ? "#22c55e" : color}
          emissive={completed ? "#16a34a" : color}
          emissiveIntensity={0.75}
          roughness={0.35}
        />
      </mesh>
      <pointLight color={completed ? "#22c55e" : color} intensity={0.35} distance={1.05} />
      <Html
        center
        distanceFactor={5.2}
        zIndexRange={[18, 8]}
        style={{ pointerEvents: "none" }}
      >
        <button
          type="button"
          data-testid={`clinical-marker-${marker.id}`}
          aria-label={`${completed ? "Reviewed" : "Examine"}: ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className={`pointer-events-auto group relative grid h-20 w-20 place-items-center rounded-full border-2 transition focus:outline-none focus:ring-4 focus:ring-white/80 ${
            completed
              ? "border-emerald-300 bg-emerald-400/20"
              : "border-teal-200 bg-teal-300/10 hover:bg-teal-300/25"
          }`}
        >
          {!completed ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-1 rounded-full border border-teal-100/80 animate-[clinical-pulse_2.2s_ease-in-out_infinite]"
            />
          ) : null}
          <span className={`pointer-events-none absolute w-max max-w-40 rounded-md border border-white/15 bg-slate-950/92 px-2.5 py-1.5 text-center text-[10px] font-bold leading-4 text-white shadow-xl backdrop-blur sm:text-xs ${labelPosition}`}>
            {completed ? "Checked" : label}
          </span>
        </button>
      </Html>
    </group>
  );
}

function WristHandModel({ caseId }: { caseId: string }) {
  const group = useRef<THREE.Group>(null);
  const deformed = caseId === "deformed-wrist";
  const scaphoidConcern = caseId === "scaphoid-concern";

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.006;
  });

  return (
    <group ref={group} rotation={deformed ? [0.03, 0, -0.1] : [0, 0, 0]}>
      <mesh position={[0, 1.22, -0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.36, 1.45, 10, 30]} />
        <meshStandardMaterial color="#bf7f59" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.02, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.83, 0.42, 0.7]} />
        <meshStandardMaterial color="#c88961" roughness={0.7} />
      </mesh>
      <RoundedBox args={[1.18, 0.42, 1.22]} radius={0.22} smoothness={5} position={[0, 0.72, 0.78]} castShadow receiveShadow>
        <meshStandardMaterial color="#ce9068" roughness={0.72} />
      </RoundedBox>

      {[-0.45, -0.16, 0.14, 0.43].map((x, index) => (
        <mesh key={x} position={[x, 0.66, 1.7 + (index === 1 || index === 2 ? 0.12 : 0)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.105, 0.72 + (index === 1 || index === 2 ? 0.12 : 0), 8, 22]} />
          <meshStandardMaterial color="#ca8962" roughness={0.72} />
        </mesh>
      ))}

      <mesh position={[0.66, 0.64, 1.0]} rotation={[Math.PI / 2, 0, -0.72]} castShadow>
        <capsuleGeometry args={[0.12, 0.63, 8, 22]} />
        <meshStandardMaterial color="#cc8b64" roughness={0.72} />
      </mesh>

      <mesh
        position={scaphoidConcern ? [0.46, 0.82, 0.56] : deformed ? [0, 1.05, 0.05] : [0, 0.97, 0.12]}
        scale={scaphoidConcern ? [1.15, 0.65, 1] : deformed ? [1.45, 1.25, 1.2] : [1, 0.7, 1]}
      >
        <sphereGeometry args={[deformed ? 0.36 : 0.24, 28, 20]} />
        <meshStandardMaterial color="#fb7185" transparent opacity={deformed ? 0.28 : 0.18} roughness={0.85} />
      </mesh>
    </group>
  );
}

function NeuroPatientModel({ caseId }: { caseId: string }) {
  const group = useRef<THREE.Group>(null);
  const leftMca = caseId === "left-mca";
  const hypoglycemia = caseId === "hypoglycemia-mimic";
  const posterior = caseId === "posterior-stroke";

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = posterior ? Math.sin(state.clock.elapsedTime * 0.65) * 0.018 : 0;
  });

  return (
    <group ref={group}>
      <RoundedBox args={[1.5, 1.45, 0.68]} radius={0.2} smoothness={5} position={[0, 1.28, 0]} castShadow>
        <meshStandardMaterial color="#356a7b" roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 2.14, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.36, 28]} />
        <meshStandardMaterial color="#a96748" roughness={0.78} />
      </mesh>
      <mesh position={[0, 2.58, 0.02]} castShadow>
        <sphereGeometry args={[0.58, 34, 26]} />
        <meshStandardMaterial color="#b97853" roughness={0.73} />
      </mesh>
      <mesh position={[0, 2.83, -0.26]} scale={[1.02, 0.72, 0.82]} castShadow>
        <sphereGeometry args={[0.58, 26, 20]} />
        <meshStandardMaterial color="#24201e" roughness={0.88} />
      </mesh>

      {[-0.22, 0.22].map((x, index) => (
        <group key={x} position={[x, 2.65, 0.52]} rotation={posterior ? [0, 0, index === 0 ? 0.13 : -0.13] : [0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.075, 18, 18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.45} />
          </mesh>
          <mesh position={[posterior ? (index === 0 ? -0.025 : 0.025) : 0, 0, 0.066]}>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial color="#17202a" roughness={0.4} />
          </mesh>
        </group>
      ))}

      <mesh position={[leftMca ? 0.08 : 0, 2.31, 0.57]} rotation={[0, 0, leftMca ? -0.18 : 0]}>
        <boxGeometry args={[0.31, 0.045, 0.04]} />
        <meshStandardMaterial color="#5b2f2a" roughness={0.7} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.0, 1.42, 0]} rotation={[0, 0, side * (leftMca && side === 1 ? 0.2 : -0.08)]}>
          <mesh position={[0, -0.15, 0]} castShadow>
            <capsuleGeometry args={[0.19, 0.9, 8, 24]} />
            <meshStandardMaterial color="#356a7b" roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.82, 0]} castShadow>
            <sphereGeometry args={[0.22, 22, 18]} />
            <meshStandardMaterial color="#b97853" roughness={0.75} />
          </mesh>
        </group>
      ))}

      {[-0.42, 0.42].map((x) => (
        <group key={x} position={[x, 0.16, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.24, 1.05, 8, 24]} />
            <meshStandardMaterial color="#263746" roughness={0.88} />
          </mesh>
          <mesh position={[0, -0.98, 0.19]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.22, 0.5, 8, 22]} />
            <meshStandardMaterial color="#18232d" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {hypoglycemia ? (
        <>
          <mesh position={[-0.46, 2.58, 0.5]}>
            <sphereGeometry args={[0.035, 14, 14]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.75} />
          </mesh>
          <mesh position={[0.45, 2.5, 0.51]}>
            <sphereGeometry args={[0.03, 14, 14]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.75} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function SceneContent({
  labId,
  caseId,
  availableFindings,
  examinedFindings,
  findingLabels,
  onExamine,
  controlsRef,
}: FocusedClinicalExamSceneProps & { controlsRef: RefObject<OrbitControlsHandle | null> }) {
  const allMarkers = labId === "neuro" ? NEURO_MARKERS : WRIST_MARKERS;
  const markers = useMemo(
    () => allMarkers.filter((marker) => availableFindings.includes(marker.id)),
    [allMarkers, availableFindings]
  );

  return (
    <>
      <color attach="background" args={["#dceff0"]} />
      <fog attach="fog" args={["#dceff0", 8, 15]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#e0f7ff", "#746153", 1.2]} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -2]} intensity={0.62} color="#99f6e4" />

      <group position={labId === "neuro" ? [0, 0.95, -0.1] : [0, -0.02, -0.28]}>
        {labId === "neuro" ? <NeuroPatientModel caseId={caseId} /> : <WristHandModel caseId={caseId} />}
        {markers.filter((marker) => !examinedFindings.includes(marker.id)).map((marker) => (
          <ExamMarker
            key={marker.id}
            marker={marker}
            label={findingLabels[marker.id] ?? marker.id}
            completed={examinedFindings.includes(marker.id)}
            onSelect={() => onExamine(marker.id)}
          />
        ))}
      </group>

      <RoundedBox args={[5.2, 0.22, 4.6]} radius={0.12} smoothness={5} position={[0, -0.16, 0.55]} receiveShadow>
        <meshStandardMaterial color="#cde5e1" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, -0.29, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#eef6f4" roughness={0.98} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0.42]} scale={5.5} opacity={0.27} blur={2.5} far={3.5} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={labId === "neuro" ? 5.1 : 4.5}
        maxDistance={labId === "neuro" ? 8.2 : 7.8}
        minPolarAngle={Math.PI / 4.5}
        maxPolarAngle={Math.PI / 2.05}
        target={labId === "neuro" ? [0, 1.55, 0] : [0, 0.85, 0.72]}
      />
      <ResponsiveCamera labId={labId} controlsRef={controlsRef} />
    </>
  );
}

export default function FocusedClinicalExamScene(props: FocusedClinicalExamSceneProps) {
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  return (
    <div className="relative h-full min-h-[340px] w-full overflow-hidden bg-[#dceff0]">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [4.35, 3, 6.4], fov: 38, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        shadows
      >
        <SceneContent {...props} controlsRef={controlsRef} />
      </Canvas>
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-slate-900/10 bg-white/80 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm backdrop-blur">
        {props.modelLabel}
      </div>
      <button
        type="button"
        title="Reset model view"
        aria-label="Reset model view"
        onClick={() => controlsRef.current?.reset()}
        className="absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-900/10 bg-white/85 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus:ring-4 focus:ring-teal-300/50"
      >
        <RotateCcw size={15} />
      </button>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/50 bg-white/75 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
        Drag to rotate · Pinch or scroll to zoom
      </div>
      <style jsx global>{`
        @keyframes clinical-pulse {
          0%, 100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.48); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 15px rgba(45, 212, 191, 0); }
        }
      `}</style>
    </div>
  );
}
