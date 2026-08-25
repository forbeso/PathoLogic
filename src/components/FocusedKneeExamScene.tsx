import { ContactShadows, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, type ElementRef, type RefObject } from "react";
import * as THREE from "three";
import type { KneeCaseId, KneeExamPhaseId, KneeFindingId } from "@/lib/focusedKneeExam";

type FocusedKneeExamSceneProps = {
  caseId: KneeCaseId;
  phase: KneeExamPhaseId;
  availableFindings: KneeFindingId[];
  examinedFindings: KneeFindingId[];
  onExamine: (findingId: KneeFindingId) => void;
};

type OrbitControlsHandle = ElementRef<typeof OrbitControls>;

type MarkerConfig = {
  id: KneeFindingId;
  label: string;
  position: [number, number, number];
  tone?: "teal" | "amber" | "rose";
};

const PHASE_MARKERS: Record<Exclude<KneeExamPhaseId, "decision">, MarkerConfig[]> = {
  inspection: [
    { id: "knee-appearance", label: "Alignment and swelling", position: [0.55, 1.02, -0.05] },
    { id: "knee-skin", label: "Skin and bruising", position: [-0.56, 0.83, 0.12] },
  ],
  palpation: [
    { id: "patella", label: "Patella", position: [0, 1.22, 0.03] },
    { id: "fibular-head", label: "Fibular head", position: [0.48, 0.68, 0.5] },
    { id: "medial-joint-line", label: "Medial joint line", position: [-0.58, 0.86, 0.06] },
  ],
  neurovascular: [
    { id: "distal-pulse", label: "Distal pulse", position: [-0.76, 0.68, 2.28] },
    { id: "knee-sensation", label: "Distal sensation", position: [0, 0.73, 1.44] },
    { id: "ankle-motor", label: "Ankle and toe movement", position: [0.78, 0.68, 2.25] },
  ],
  stability: [
    { id: "valgus-stress", label: "Valgus stress", position: [-0.65, 0.8, 0] },
    { id: "varus-stress", label: "Varus stress", position: [0.65, 0.8, 0] },
    { id: "anterior-drawer", label: "Anterior translation", position: [0, 1.14, 2.2] },
  ],
  function: [
    { id: "knee-flexion", label: "Flexion to 90 degrees", position: [0.58, 0.68, 1.16], tone: "amber" },
    { id: "knee-weight-bearing", label: "Assess four steps", position: [0, 0.2, 2.72], tone: "amber" },
  ],
};

function ResponsiveCamera({ controlsRef }: { controlsRef: RefObject<OrbitControlsHandle | null> }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (size.width <= 600) {
      camera.position.set(5.9, 4.6, 7.8);
      controls.target.set(0, 0.9, 0.45);
    } else {
      camera.position.set(5.1, 3.5, 6.3);
      controls.target.set(0, 0.78, 0.32);
    }
    camera.updateProjectionMatrix();
    controls.update();
    controls.saveState();
  }, [camera, controlsRef, size.width]);

  return null;
}

function ExamMarker({ marker, onSelect }: { marker: MarkerConfig; onSelect: () => void }) {
  const color = marker.tone === "amber" ? "#f59e0b" : marker.tone === "rose" ? "#fb7185" : "#2dd4bf";
  const labelPosition = marker.position[0] > 0.25
    ? "left-0"
    : marker.position[0] < -0.25
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <group position={marker.position}>
      <mesh>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.78} roughness={0.35} />
      </mesh>
      <pointLight color={color} intensity={0.42} distance={1.2} />
      <Html center distanceFactor={5.4} zIndexRange={[18, 8]}>
        <button
          type="button"
          data-testid={`knee-marker-${marker.id}`}
          aria-label={`Examine: ${marker.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className="group relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border-2 border-teal-200 bg-teal-300/10 transition hover:bg-teal-300/25 focus:outline-none focus:ring-4 focus:ring-white/80"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-1 rounded-full border border-teal-100/80 animate-[knee-exam-pulse_2.2s_ease-in-out_infinite]"
          />
          <span className={`pointer-events-none absolute top-full mt-1.5 w-max max-w-36 rounded-md border border-white/15 bg-slate-950/92 px-2.5 py-1.5 text-center text-[10px] font-bold leading-4 text-white shadow-xl backdrop-blur sm:text-xs ${labelPosition}`}>
            {marker.label}
          </span>
        </button>
      </Html>
    </group>
  );
}

function KneeModel({ caseId }: { caseId: KneeCaseId }) {
  const group = useRef<THREE.Group>(null);
  const isDeformed = caseId === "knee-dislocation";
  const isPatellaCase = caseId === "patella-concern";
  const isFibularCase = caseId === "fibular-head-concern";

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.15) * 0.007;
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0.72, -1.2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.5, 1.72, 12, 32]} />
        <meshStandardMaterial color="#c98a64" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.74, -2.13]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.55, 0.55, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.82} />
      </mesh>

      <mesh position={[0, 0.72, 0]} scale={[1, 0.9, 1.05]} castShadow receiveShadow>
        <sphereGeometry args={[0.57, 32, 24]} />
        <meshStandardMaterial color="#cc8d66" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.05, 0.03]} scale={[0.63, 0.28, 0.76]} castShadow>
        <sphereGeometry args={[0.5, 28, 20]} />
        <meshStandardMaterial color="#d49a72" roughness={0.68} />
      </mesh>

      <group position={isDeformed ? [0.27, 0.02, 0.08] : [0, 0, 0]} rotation={isDeformed ? [0, 0.18, 0.03] : [0, 0, 0]}>
        <mesh position={[0, 0.58, 1.22]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.36, 1.9, 12, 32]} />
          <meshStandardMaterial color="#cb8d66" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.56, 2.36]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.35, 0.72, 10, 28]} />
          <meshStandardMaterial color="#c98a64" roughness={0.72} />
        </mesh>
      </group>

      <mesh
        position={isPatellaCase ? [0, 1.11, 0.02] : isFibularCase ? [0.43, 0.67, 0.48] : [-0.36, 0.83, 0.05]}
        scale={isPatellaCase ? [1.45, 0.75, 1.25] : [1.1, 0.85, 1.1]}
      >
        <sphereGeometry args={[isPatellaCase ? 0.31 : 0.24, 28, 20]} />
        <meshStandardMaterial color="#f59e91" transparent opacity={0.26} roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.12, 0.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.12, 48]} />
        <meshStandardMaterial color="#0f766e" transparent opacity={0.08} />
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
}: FocusedKneeExamSceneProps & { controlsRef: RefObject<OrbitControlsHandle | null> }) {
  const markers = useMemo(() => {
    if (phase === "decision") return [];
    return PHASE_MARKERS[phase].filter((marker) => availableFindings.includes(marker.id));
  }, [availableFindings, phase]);

  return (
    <>
      <color attach="background" args={["#dceff0"]} />
      <fog attach="fog" args={["#dceff0", 9, 15]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#dff7ff", "#7c6653", 1.25]} />
      <directionalLight position={[4, 7, 5]} intensity={2.3} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -3]} intensity={0.65} color="#99f6e4" />

      <group position={[0, -0.03, 0]}>
        <KneeModel caseId={caseId} />
        {markers.filter((marker) => !examinedFindings.includes(marker.id)).map((marker) => (
          <ExamMarker key={marker.id} marker={marker} onSelect={() => onExamine(marker.id)} />
        ))}
      </group>

      <RoundedBox args={[5.2, 0.22, 5.7]} radius={0.12} smoothness={5} position={[0, -0.16, 0.1]} receiveShadow>
        <meshStandardMaterial color="#cde5e1" roughness={0.88} />
      </RoundedBox>
      <mesh position={[0, -0.28, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#eef6f4" roughness={0.98} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0.15]} scale={5.8} opacity={0.3} blur={2.7} far={3.6} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={5}
        maxDistance={8.3}
        minPolarAngle={Math.PI / 4.4}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 0.78, 0.32]}
      />
      <ResponsiveCamera controlsRef={controlsRef} />
    </>
  );
}

export default function FocusedKneeExamScene(props: FocusedKneeExamSceneProps) {
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  return (
    <div className="relative h-full min-h-[340px] w-full overflow-hidden bg-[#dceff0]">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [5.1, 3.5, 6.3], fov: 39, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        shadows
      >
        <SceneContent {...props} controlsRef={controlsRef} />
      </Canvas>
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-slate-900/10 bg-white/75 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm backdrop-blur">
        Right knee
      </div>
      <button
        type="button"
        title="Reset knee view"
        aria-label="Reset knee view"
        onClick={() => controlsRef.current?.reset()}
        className="absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-900/10 bg-white/85 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus:ring-4 focus:ring-teal-300/50"
      >
        <RotateCcw size={15} />
      </button>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/50 bg-white/72 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur dark:bg-slate-950/70 dark:text-slate-200">
        Drag to rotate · Pinch or scroll to zoom
      </div>
      <style jsx global>{`
        @keyframes knee-exam-pulse {
          0%, 100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.48); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 15px rgba(45, 212, 191, 0); }
        }
      `}</style>
    </div>
  );
}
