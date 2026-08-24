import { ContactShadows, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ElementRef, type RefObject } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import type {
  AnkleCaseId,
  ExamFindingId,
  ExamPhaseId,
} from "@/lib/focusedExamLabs";

type FocusedAnkleExamSceneProps = {
  caseId: AnkleCaseId;
  phase: ExamPhaseId;
  availableFindings: ExamFindingId[];
  examinedFindings: ExamFindingId[];
  onExamine: (findingId: ExamFindingId) => void;
};

type OrbitControlsHandle = ElementRef<typeof OrbitControls>;

function ResponsiveCamera({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsHandle | null>;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const portrait = size.width <= 600;
    if (portrait) {
      camera.position.set(5.35, 4.05, 7.55);
      controls.target.set(0, 1.55, 0.65);
    } else {
      camera.position.set(4.8, 3.2, 6.25);
      controls.target.set(0, 1, 0.55);
    }

    camera.updateProjectionMatrix();
    controls.update();
    controls.saveState();
  }, [camera, controlsRef, size.width]);

  return null;
}

type MarkerConfig = {
  id: ExamFindingId;
  label: string;
  position: [number, number, number];
  tone?: "teal" | "amber" | "rose";
};

const PHASE_MARKERS: Record<Exclude<ExamPhaseId, "decision">, MarkerConfig[]> = {
  inspection: [
    { id: "appearance", label: "Alignment and swelling", position: [0.68, 0.88, 0.16] },
    { id: "skin", label: "Skin and color", position: [-0.68, 0.31, 1.42] },
  ],
  palpation: [
    { id: "lateral-malleolus", label: "Lateral malleolus", position: [0.82, 0.78, 0.08] },
    { id: "medial-malleolus", label: "Medial malleolus", position: [-0.82, 0.76, 0.04] },
    { id: "navicular", label: "Navicular", position: [-0.76, 0.34, 0.88] },
    { id: "fifth-metatarsal", label: "Base of fifth metatarsal", position: [0.78, 0.28, 1.26] },
    { id: "atfl", label: "Lateral soft tissue", position: [0.74, 0.28, 0.52] },
  ],
  neurovascular: [
    { id: "dorsalis-pedis", label: "Dorsalis pedis pulse", position: [0.02, 0.72, 0.76] },
    { id: "sensation", label: "Distal sensation", position: [-0.82, 0.25, 1.46] },
    { id: "motor", label: "Toe movement", position: [0.82, 0.23, 1.88] },
  ],
  function: [
    { id: "weight-bearing", label: "Assess four steps", position: [0, 0.2, 2.32], tone: "amber" },
  ],
};

function ExamMarker({
  marker,
  completed,
  onSelect,
}: {
  marker: MarkerConfig;
  completed: boolean;
  onSelect: () => void;
}) {
  const color = marker.tone === "amber" ? "#f59e0b" : marker.tone === "rose" ? "#fb7185" : "#2dd4bf";
  const labelPosition = marker.position[0] > 0.25
    ? "right-0"
    : marker.position[0] < -0.25
      ? "left-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <group position={marker.position}>
      <mesh>
        <sphereGeometry args={[0.065, 24, 24]} />
        <meshStandardMaterial
          color={completed ? "#22c55e" : color}
          emissive={completed ? "#16a34a" : color}
          emissiveIntensity={0.75}
          roughness={0.35}
        />
      </mesh>
      <pointLight color={completed ? "#22c55e" : color} intensity={0.4} distance={1.1} />
      <Html center distanceFactor={5.5} zIndexRange={[18, 8]}>
        <button
          type="button"
          data-testid={`exam-marker-${marker.id}`}
          aria-label={`${completed ? "Reviewed" : "Examine"}: ${marker.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className={`group relative grid h-16 w-16 place-items-center rounded-full border-2 transition focus:outline-none focus:ring-4 focus:ring-white/80 sm:h-[4.5rem] sm:w-[4.5rem] ${
            completed
              ? "border-emerald-300 bg-emerald-400/20"
              : "border-teal-200 bg-teal-300/10 hover:bg-teal-300/25"
          }`}
        >
          {!completed ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-1 rounded-full border border-teal-100/80 animate-[exam-pulse_2.2s_ease-in-out_infinite]"
            />
          ) : null}
          <span className={`pointer-events-none absolute top-full mt-1.5 w-max max-w-36 rounded-md border border-white/15 bg-slate-950/92 px-2.5 py-1.5 text-center text-[10px] font-bold leading-4 text-white shadow-xl backdrop-blur sm:text-xs ${labelPosition}`}>
            {completed ? "Checked" : marker.label}
          </span>
        </button>
      </Html>
    </group>
  );
}

function AnkleModel({ caseId }: { caseId: AnkleCaseId }) {
  const group = useRef<THREE.Group>(null);
  const isDeformed = caseId === "neurovascular-emergency";
  const swellingPosition =
    caseId === "fifth-metatarsal"
      ? ([0.34, 0.34, 1.13] as const)
      : ([0.35, 0.62, 0.24] as const);

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.25) * 0.008;
  });

  return (
    <group ref={group} rotation={isDeformed ? [0.02, 0, -0.08] : [0, 0, 0]}>
      <mesh position={[0, 1.45, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.34, 1.55, 12, 32]} />
        <meshStandardMaterial color="#c98a64" roughness={0.72} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.4, 0.5, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.62, 0.16]} castShadow receiveShadow>
        <sphereGeometry args={[0.43, 32, 24]} />
        <meshStandardMaterial color="#cb8d66" roughness={0.7} />
      </mesh>
      <RoundedBox args={[0.72, 0.46, 1.72]} radius={0.22} smoothness={6} position={[0, 0.34, 0.93]} castShadow receiveShadow>
        <meshStandardMaterial color="#ce9069" roughness={0.72} />
      </RoundedBox>

      {[-0.28, -0.14, 0, 0.14, 0.28].map((x, index) => (
        <mesh key={x} position={[x, 0.28, 1.82 + Math.abs(index - 2) * -0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.18 - Math.abs(index - 2) * 0.012, 6, 20]} />
          <meshStandardMaterial color="#cc8d66" roughness={0.72} />
        </mesh>
      ))}

      <mesh position={swellingPosition} scale={caseId === "fifth-metatarsal" ? [1.25, 0.7, 1.35] : [1, 1.2, 1]}>
        <sphereGeometry args={[caseId === "lateral-sprain" ? 0.23 : 0.28, 28, 20]} />
        <meshStandardMaterial color="#f59e91" transparent opacity={0.22} roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.12, 0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.96, 48]} />
        <meshStandardMaterial color="#0f766e" transparent opacity={0.09} />
      </mesh>
    </group>
  );
}

function SceneContent({
  caseId,
  phase,
  availableFindings,
  examinedFindings,
  onExamine,
  controlsRef,
}: FocusedAnkleExamSceneProps & { controlsRef: RefObject<OrbitControlsHandle | null> }) {
  const markers = useMemo(() => {
    if (phase === "decision") return [];
    return PHASE_MARKERS[phase].filter((marker) => availableFindings.includes(marker.id));
  }, [availableFindings, phase]);

  return (
    <>
      <color attach="background" args={["#dceff0"]} />
      <fog attach="fog" args={["#dceff0", 8, 14]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#dff7ff", "#7c6653", 1.25]} />
      <directionalLight position={[4, 7, 5]} intensity={2.3} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -3]} intensity={0.65} color="#99f6e4" />

      <group position={[0, -0.04, -0.18]}>
        <AnkleModel caseId={caseId} />
        {markers.filter((marker) => !examinedFindings.includes(marker.id)).map((marker) => (
          <ExamMarker
            key={marker.id}
            marker={marker}
            completed={examinedFindings.includes(marker.id)}
            onSelect={() => onExamine(marker.id)}
          />
        ))}
      </group>

      <RoundedBox args={[4.7, 0.22, 4.2]} radius={0.12} smoothness={5} position={[0, -0.16, 0.62]} receiveShadow>
        <meshStandardMaterial color="#cde5e1" roughness={0.88} />
      </RoundedBox>
      <mesh position={[0, -0.28, 0.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#eef6f4" roughness={0.98} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0.45]} scale={5} opacity={0.28} blur={2.5} far={3.5} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={4.6}
        maxDistance={7.6}
        minPolarAngle={Math.PI / 4.4}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 1.0, 0.55]}
      />
      <ResponsiveCamera controlsRef={controlsRef} />
    </>
  );
}

export default function FocusedAnkleExamScene(props: FocusedAnkleExamSceneProps) {
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  return (
    <div className="relative h-full min-h-[340px] w-full overflow-hidden bg-[#dceff0]">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [4.8, 3.2, 6.25], fov: 38, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        shadows
      >
        <SceneContent {...props} controlsRef={controlsRef} />
      </Canvas>
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-slate-900/10 bg-white/75 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm backdrop-blur">
        Right ankle
      </div>
      <button
        type="button"
        title="Reset ankle view"
        aria-label="Reset ankle view"
        onClick={() => controlsRef.current?.reset()}
        className="absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-900/10 bg-white/85 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus:ring-4 focus:ring-teal-300/50"
      >
        <RotateCcw size={15} />
      </button>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/50 bg-white/72 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur dark:bg-slate-950/70 dark:text-slate-200">
        Drag to rotate · Pinch or scroll to zoom
      </div>
      <style jsx global>{`
        @keyframes exam-pulse {
          0%, 100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.48); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 15px rgba(45, 212, 191, 0); }
        }
      `}</style>
    </div>
  );
}
