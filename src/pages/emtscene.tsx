import Seo from "@/components/Seo";
import Link from "next/link";
import ThreeDScene from "@/components/ThreeDScene";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppShell, StatusPill } from "@/components/AppShell";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Flame,
  HeartPulse,
  Lightbulb,
  LogOut,
  MapPin,
  Menu,
  Music,
  MousePointerClick,
  PanelRightClose,
  PanelRightOpen,
  Play,
  RefreshCcw,
  ShieldCheck,
  Siren,
  Star,
  Stethoscope,
  Timer,
  Trophy,
  Volume2,
  Wind,
} from "lucide-react";
import {
  anaphylaxisFestivalScenario,
  buildScenarioDebrief,
  createScenarioState,
  getActionSuccessEvents,
  getCurrentObjective,
  getObjectAvailability,
  getVisibleInteractiveObjects,
  hasEvents,
  isInteractiveObjectComplete,
  scenarioReducer,
  type InteractiveObjectConfig,
  type PatientVitalKey,
} from "@/lib/emtSceneEngine";

type StageKey = "primary" | "secondary" | "impression" | "interventions" | "transport" | "reassessment";
type SimulationMode = "guided" | "scenario" | "exam";
type MobileHudSection = "objective" | "dispatch" | "vitals" | "equipment" | "progress";

type VitalSet = {
  loc: string;
  airway: string;
  breathing: string;
  pulse: string;
  bp: string;
  spo2: string;
  skin: string;
};

type Scenario = {
  id: string;
  title: string;
  domain: string;
  dispatch: string;
  scene: string;
  patient: string;
  priority: "Stable" | "Potentially unstable" | "Unstable";
  vitals: VitalSet;
  cues: string[];
  fieldImpression: string;
};

type LogEntry = {
  who: "student" | "patient" | "coach";
  text: string;
};

type QuickAction = {
  label: string;
  stage: StageKey;
  message: string;
  completes: string[];
  patientReply: string;
  vitalPatch?: Partial<VitalSet>;
};

type PrimaryPrompt = {
  task: string;
  question: string;
  options: string[];
  finding: string | ((scenario: Scenario) => string);
};

const STAGES: Array<{ key: StageKey; title: string; tasks: string[] }> = [
  {
    key: "primary",
    title: "Primary",
    tasks: [
      "Scene safety and BSI",
      "General impression",
      "Assess responsiveness",
      "Airway",
      "Breathing",
      "Circulation",
      "Transport priority",
    ],
  },
  {
    key: "secondary",
    title: "Secondary",
    tasks: ["OPQRST", "SAMPLE", "Focused exam", "Baseline vitals"],
  },
  {
    key: "impression",
    title: "Impression",
    tasks: ["Name likely problem", "Identify red flags", "Choose care priority"],
  },
  {
    key: "interventions",
    title: "Interventions",
    tasks: ["Oxygen/ventilation", "Positioning", "Medication or protocol action", "Monitor response"],
  },
  {
    key: "transport",
    title: "Transport",
    tasks: ["Destination", "Urgency", "Radio report"],
  },
  {
    key: "reassessment",
    title: "Reassessment",
    tasks: ["Repeat ABCs", "Repeat vitals", "Trend response", "Update plan"],
  },
];

const PHASE_DOCK_ITEMS = [
  { key: "primary", label: "Primary", icon: Stethoscope },
  { key: "secondary", label: "Secondary", icon: ClipboardList },
  { key: "reassessment", label: "Vitals", icon: HeartPulse },
  { key: "interventions", label: "Treatments", icon: Activity },
  { key: "transport", label: "Transport", icon: Ambulance },
] satisfies Array<{ key: StageKey; label: string; icon: typeof Activity }>;

const EQUIPMENT_DOCK_ITEMS = [
  { id: "gloves", label: "Gloves", icon: ShieldCheck },
  { id: "bp", label: "BP Cuff", icon: Activity },
  { id: "pulseox", label: "Pulse Ox", icon: HeartPulse },
  { id: "oxygen", label: "O2 Tank", icon: Ambulance },
  { id: "mask", label: "Mask", icon: Wind },
  { id: "bvm", label: "BVM", icon: Activity },
] satisfies Array<{ id: string; label: string; icon: typeof Activity }>;

const MOBILE_HUD_SECTIONS = [
  { key: "objective", label: "Goal", icon: ClipboardCheck },
  { key: "dispatch", label: "Dispatch", icon: Siren },
  { key: "vitals", label: "Vitals", icon: HeartPulse },
  { key: "equipment", label: "Gear", icon: ShieldCheck },
  { key: "progress", label: "Progress", icon: Star },
] satisfies Array<{ key: MobileHudSection; label: string; icon: typeof Activity }>;

const SITE_NAV_ITEMS = [
  { href: "/emtrainer", label: "Scenarios" },
  { href: "/exam/nremt", label: "Exam Mode" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/progress", label: "Progress" },
];

const PRIMARY_PROMPTS: PrimaryPrompt[] = [
  {
    task: "Scene safety and BSI",
    question: "What should you check first?",
    options: ["Scene safety and BSI", "Airway", "Transport priority"],
    finding: "Scene safe. BSI/PPE on. You can approach the patient.",
  },
  {
    task: "General impression",
    question: "As you approach, what is the next best move?",
    options: ["General impression", "OPQRST", "Radio report"],
    finding: (scenario) => {
      if (scenario.id === "spine") return "General impression: adult seated on the ground, alert, shoulder pain, possible spinal risk.";
      if (scenario.id === "chest-pain") return "General impression: young adult upright, guarding the right chest, mild respiratory distress.";
      return "General impression: teen upright, anxious, hives visible, respiratory distress present.";
    },
  },
  {
    task: "Assess responsiveness",
    question: "What should you assess next?",
    options: ["Assess responsiveness", "Focused exam", "Medication history"],
    finding: (scenario) => `Responsiveness: ${scenario.vitals.loc}. Patient can answer focused questions.`,
  },
  {
    task: "Airway",
    question: "After responsiveness, what comes next in primary assessment?",
    options: ["Airway", "SAMPLE history", "Destination decision"],
    finding: (scenario) => `Airway: ${scenario.vitals.airway}.`,
  },
  {
    task: "Breathing",
    question: "What do you check after airway?",
    options: ["Breathing", "Blood pressure", "OPQRST"],
    finding: (scenario) => `Breathing: ${scenario.vitals.breathing}. SpO2 ${scenario.vitals.spo2}.`,
  },
  {
    task: "Circulation",
    question: "After breathing, what should you check?",
    options: ["Circulation", "Transport", "Pain scale"],
    finding: (scenario) => `Circulation: ${scenario.vitals.pulse}; skin ${scenario.vitals.skin}.`,
  },
  {
    task: "Transport priority",
    question: "What closes out the primary assessment?",
    options: ["Transport priority", "Detailed physical exam", "Radio report"],
    finding: (scenario) => `Transport priority: ${scenario.priority}. Decide how fast this patient needs definitive care.`,
  },
];

const SCENARIOS: Scenario[] = [
  {
    id: "anaphylaxis",
    title: "Teen With Shortness of Breath",
    domain: "Medical / Respiratory",
    dispatch: "Teenager short of breath at a community festival.",
    scene:
      "Outdoor festival first-aid tent. Bystanders report sudden itching and breathing trouble.",
    patient:
      "17-year-old seated upright, anxious, speaking in short phrases, with lip swelling and hives.",
    priority: "Unstable",
    vitals: {
      loc: "Alert, anxious",
      airway: "Patent, throat tightness",
      breathing: "Wheezing, RR 28",
      pulse: "Rapid radial 128",
      bp: "92/60",
      spo2: "89%",
      skin: "Warm, flushed, hives",
    },
    cues: ["Nut exposure", "Wheezing", "Hives", "Lip swelling", "Hypotension"],
    fieldImpression: "Anaphylaxis with respiratory compromise and shock signs.",
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "PPE and scene safe",
    stage: "primary",
    message: "I confirm PPE and scene safety.",
    completes: ["Scene safety and BSI"],
    patientReply: "Coach: Scene safety and BSI confirmed. You can approach the patient.",
  },
  {
    label: "General impression",
    stage: "primary",
    message: "I form my general impression.",
    completes: ["General impression", "Assess responsiveness"],
    patientReply: "Patient: I am alert but anxious. I can answer you in short phrases.",
  },
  {
    label: "Assess ABCs",
    stage: "primary",
    message: "I assess airway, breathing, and circulation.",
    completes: ["Airway", "Breathing", "Circulation"],
    patientReply: "Patient: Airway is patent. Breathing is the main concern. Radial pulse is present.",
  },
  {
    label: "Get OPQRST",
    stage: "secondary",
    message: "I ask OPQRST questions.",
    completes: ["OPQRST"],
    patientReply: "Patient: It started suddenly. Breathing makes it worse. The discomfort is the main complaint.",
  },
  {
    label: "Get SAMPLE",
    stage: "secondary",
    message: "I ask SAMPLE history.",
    completes: ["SAMPLE"],
    patientReply: "Patient: I can tell you allergies, medicines, history, last oral intake, and events when asked.",
  },
  {
    label: "Focused exam",
    stage: "secondary",
    message: "I perform a focused exam and obtain baseline vitals.",
    completes: ["Focused exam", "Baseline vitals"],
    patientReply: "Patient: Focused findings match the scene cues. Vitals are available on the monitor panel.",
  },
  {
    label: "Give oxygen",
    stage: "interventions",
    message: "I apply oxygen and monitor the response.",
    completes: ["Oxygen/ventilation", "Monitor response"],
    patientReply: "Patient: The oxygen helps. Work of breathing eases slightly and SpO2 improves.",
    vitalPatch: { spo2: "94%", breathing: "RR 24, still labored" },
  },
  {
    label: "Position patient",
    stage: "interventions",
    message: "I position the patient for comfort while maintaining safety.",
    completes: ["Positioning"],
    patientReply: "Patient: Sitting upright feels better. I can talk a little more easily.",
  },
  {
    label: "Choose transport",
    stage: "transport",
    message: "I choose destination and urgency.",
    completes: ["Destination", "Urgency"],
    patientReply: "Coach: Good. Match destination and urgency to the likely life threat and local protocol.",
  },
  {
    label: "Repeat vitals",
    stage: "reassessment",
    message: "I repeat ABCs and vital signs.",
    completes: ["Repeat ABCs", "Repeat vitals", "Trend response", "Update plan"],
    patientReply: "Patient: Reassessment is complete. Compare current findings with your first set of vitals.",
  },
];

const KEYWORD_TASKS: Array<{ task: string; words: string[] }> = [
  { task: "Scene safety and BSI", words: ["scene", "safe", "bsi", "ppe"] },
  { task: "General impression", words: ["general impression", "sick", "not sick"] },
  { task: "Assess responsiveness", words: ["avpu", "responsive", "alert", "loc"] },
  { task: "Airway", words: ["airway"] },
  { task: "Breathing", words: ["breathing", "respirations", "lung", "oxygen"] },
  { task: "Circulation", words: ["circulation", "pulse", "skin", "bleeding"] },
  { task: "Transport priority", words: ["priority", "transport"] },
  { task: "OPQRST", words: ["opqrst", "onset", "provocation", "quality", "radiation", "severity"] },
  { task: "SAMPLE", words: ["sample", "allergies", "medications", "history", "last oral", "events"] },
  { task: "Focused exam", words: ["focused", "exam", "palpate", "inspect"] },
  { task: "Baseline vitals", words: ["vitals", "blood pressure", "spo2"] },
  { task: "Name likely problem", words: ["impression", "likely", "diagnosis"] },
  { task: "Choose care priority", words: ["priority", "care"] },
  { task: "Oxygen/ventilation", words: ["oxygen", "ventilate", "bvm"] },
  { task: "Medication or protocol action", words: ["epi", "epinephrine", "aspirin", "nitro", "albuterol"] },
  { task: "Destination", words: ["destination", "hospital", "center"] },
  { task: "Radio report", words: ["radio", "notify", "report"] },
  { task: "Repeat vitals", words: ["repeat vitals", "reassess"] },
];

function firstNumber(value: string) {
  return value.match(/\d+/)?.[0] ?? value;
}

function avpuFromLoc(loc: string) {
  const normalized = loc.toLowerCase();
  if (normalized.includes("alert")) return "A";
  if (normalized.includes("voice")) return "V";
  if (normalized.includes("pain")) return "P";
  return "U";
}

function getMonitorVitals(vitals: VitalSet, scenarioId: string, revealedVitals: PatientVitalKey[]) {
  const revealed = new Set<PatientVitalKey>(revealedVitals);
  const hidden = { value: "—", tone: "text-slate-500" };

  return [
    revealed.has("heartRate")
      ? { label: "HR", value: firstNumber(vitals.pulse), unit: "bpm", tone: "text-rose-400" }
      : { label: "HR", unit: "bpm", ...hidden },
    revealed.has("systolicBP") && revealed.has("diastolicBP")
      ? { label: "BP", value: vitals.bp, unit: "mmHg", tone: "text-amber-300" }
      : { label: "BP", unit: "mmHg", ...hidden },
    revealed.has("spo2")
      ? { label: "SpO2", value: vitals.spo2, unit: "", tone: "text-rose-400" }
      : { label: "SpO2", unit: "", ...hidden },
    revealed.has("respiratoryRate")
      ? { label: "RR", value: firstNumber(vitals.breathing), unit: "/min", tone: "text-amber-300" }
      : { label: "RR", unit: "/min", ...hidden },
    revealed.has("heartRate")
      ? { label: "AVPU", value: avpuFromLoc(vitals.loc), unit: "", tone: "text-teal-300" }
      : { label: "AVPU", unit: "", ...hidden },
    { label: "TEMP", unit: "", ...hidden },
  ];
}

function SceneTopBar({
  score,
  completed,
  total,
}: {
  score: number;
  completed: number;
  total: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const levelProgress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const streak = Math.max(1, Math.min(9, 5 + completed));

  return (
    <header className="relative z-50 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950 px-4 text-white shadow-2xl shadow-slate-950/35">
      <Link
        href="/"
        aria-label="PathoLogix home"
        className="flex min-w-0 items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-teal-200/35 bg-teal-400/10 text-teal-200">
          <Ambulance size={23} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xl font-black tracking-wide">PATHOLOGIX</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300 lg:hidden">
            EMT Scene Lab
          </div>
        </div>
      </Link>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-8 lg:flex">
        <div className="w-[320px]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-200">
            <span>Level 4</span>
            <span className="text-slate-500">•</span>
            <span className="normal-case tracking-normal text-slate-300">Outdoor Emergencies</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.max(18, levelProgress)}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-black text-teal-200">
          <Flame size={17} className="text-rose-400" />
          {score + 70} XP
        </div>
        <div className="flex items-center gap-2 text-sm font-black text-slate-100">
          <Trophy size={17} className="text-amber-300" />
          Streak: {streak}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-black text-slate-100 transition hover:border-teal-200/50 hover:bg-teal-300/10 md:flex"
        >
          <ClipboardCheck size={16} />
          Objectives
        </button>
        <button type="button" aria-label="Music" className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 text-slate-100 transition hover:border-teal-200/50">
          <Music size={17} />
        </button>
        <button type="button" aria-label="Volume" className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 text-slate-100 transition hover:border-teal-200/50">
          <Volume2 size={17} />
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 text-slate-100 transition hover:border-teal-200/50"
          >
            {menuOpen ? <PanelRightClose size={18} /> : <Menu size={18} />}
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 p-2 text-sm shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
              <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                Navigation
              </div>
              <div className="space-y-1">
                {SITE_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 font-bold text-slate-200 transition hover:bg-teal-400/10 hover:text-teal-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-2 border-t border-white/10 pt-2">
                <Link
                  href="/emtrainer"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl bg-teal-500 px-3 py-2 text-center font-black text-slate-950 transition hover:bg-teal-300"
                >
                  Practice
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 block rounded-xl border border-white/15 px-3 py-2 text-center font-bold text-slate-100 transition hover:border-teal-200/60 hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function makeOpeningLog(scenario: Scenario): LogEntry[] {
  return [
    {
      who: "coach",
      text: `Dispatch: ${scenario.dispatch}`,
    },
    {
      who: "patient",
      text: `Scene: ${scenario.scene}`,
    },
  ];
}

export default function EMTScene() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = useMemo(
    () => SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId]
  );
  const sceneScenario = anaphylaxisFestivalScenario;
  const [gameState, dispatchGame] = useReducer(
    (state: ReturnType<typeof createScenarioState>, action: Parameters<typeof scenarioReducer>[2]) =>
      scenarioReducer(sceneScenario, state, action),
    sceneScenario,
    createScenarioState
  );
  const [stage, setStage] = useState<StageKey>("primary");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [vitals, setVitals] = useState<VitalSet>(scenario.vitals);
  const [log, setLog] = useState<LogEntry[]>(() => makeOpeningLog(scenario));
  const [labOpen, setLabOpen] = useState(true);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [mobileHudSection, setMobileHudSection] = useState<MobileHudSection>("objective");
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const [sceneHeight, setSceneHeight] = useState(655);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("scenario");
  const [primaryStepIndex, setPrimaryStepIndex] = useState(0);
  const [primaryFeedback, setPrimaryFeedback] = useState("Start with the action that protects you, your partner, and the patient.");
  const [sceneFinding, setSceneFinding] = useState("");
  const [animalControlResponseActive, setAnimalControlResponseActive] = useState(false);
  const lastGameFeedback = useRef(gameState.feedback);

  useEffect(() => {
    const updateSceneHeight = () => {
      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 65;
      const desktop = window.innerWidth >= 1024;
      setIsDesktopLayout(desktop);
      if (!desktop) setLabOpen(false);
      if (desktop) setMobileHudOpen(false);
      setSceneHeight(Math.max(window.innerHeight - headerHeight, desktop ? 520 : 320));
    };
    updateSceneHeight();
    window.addEventListener("resize", updateSceneHeight);
    return () => window.removeEventListener("resize", updateSceneHeight);
  }, []);

  useEffect(() => {
    const phaseStage: StageKey =
      gameState.currentPhase === "secondaryAssessment"
        ? "secondary"
        : gameState.currentPhase === "transport"
          ? "transport"
          : gameState.currentPhase === "interventions"
            ? "interventions"
            : gameState.currentPhase === "reassessment"
              ? "reassessment"
              : gameState.currentPhase === "impression"
                ? "impression"
                : "primary";
    setStage(phaseStage);
  }, [gameState.currentPhase]);

  useEffect(() => {
    if (lastGameFeedback.current === gameState.feedback) return;
    lastGameFeedback.current = gameState.feedback;
    if (/selected\. Choose an action\.$/.test(gameState.feedback)) {
      setSceneFinding("");
      return;
    }
    if (gameState.selectedObjectId === "dog" && gameState.feedback.startsWith("The dog is barking")) {
      setSceneFinding("");
      return;
    }
    setLog((prev) => [...prev, { who: gameState.feedback.startsWith("Patient:") ? "patient" : "coach", text: gameState.feedback }]);
    setSceneFinding(gameState.feedback);
  }, [gameState.feedback, gameState.selectedObjectId]);

  useEffect(() => {
    setVitals({
      loc: gameState.patient.responsiveness,
      airway: gameState.patient.airwayStatus,
      breathing: `RR ${gameState.patient.vitals.respiratoryRate}`,
      pulse: `Rapid radial ${gameState.patient.vitals.heartRate}`,
      bp: `${gameState.patient.vitals.systolicBP}/${gameState.patient.vitals.diastolicBP}`,
      spo2: `${gameState.patient.vitals.spo2}%`,
      skin: gameState.patient.circulationStatus,
    });
  }, [gameState.patient]);

  useEffect(() => {
    const animalControlCalled = hasEvents(gameState, ["ANIMAL_CONTROL_CALLED"]);
    const dogSecured = hasEvents(gameState, ["DOG_SECURED"]);
    if (!animalControlCalled || dogSecured) {
      setAnimalControlResponseActive(false);
      return;
    }

    setAnimalControlResponseActive(true);
    const secureDogTimer = window.setTimeout(() => {
      dispatchGame({ type: "APPLY_EVENT", event: "DOG_SECURED" });
    }, 3300);

    return () => window.clearTimeout(secureDogTimer);
  }, [gameState.triggeredEvents]);

  const currentObjective = getCurrentObjective(sceneScenario, gameState);
  const cameraFocusObjectId =
    currentObjective.id === "use-radio" &&
    hasEvents(gameState, ["DOG_INSPECTED"]) &&
    !hasEvents(gameState, ["RADIO_SELECTED"])
      ? "dog"
      : gameState.focusedObjectId;
  const phaseObjectives = sceneScenario.objectives.filter((objective) => objective.phase === gameState.currentPhase);
  const activeStage = STAGES.find((item) => item.key === stage) ?? STAGES[0];
  const completedCount = phaseObjectives.filter((objective) => gameState.completedObjectives.includes(objective.id)).length;
  const totalTasks = phaseObjectives.length || activeStage.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const scenarioTasks = sceneScenario.objectives;
  const scenarioCompletedCount = gameState.completedObjectives.length;
  const scenarioProgressPercent = Math.round((scenarioCompletedCount / scenarioTasks.length) * 100);
  const debrief = useMemo(() => buildScenarioDebrief(gameState), [gameState]);
  const stageIndex = STAGES.findIndex((item) => item.key === stage);
  const relevantActions = QUICK_ACTIONS.filter((action) => action.stage === stage);
  const revealedVitals = gameState.patient.vitalsRevealed;
  const vitalsPanelVisible = revealedVitals.length > 0;
  const equipmentDockVisible = hasEvents(gameState, ["DOG_SECURED"]);
  const monitorVitals = useMemo(() => getMonitorVitals(vitals, scenario.id, revealedVitals), [scenario.id, vitals, revealedVitals]);
  const latestSceneMessage = useMemo(() => {
    for (let index = log.length - 1; index >= 0; index -= 1) {
      if (log[index].who !== "student") return log[index];
    }

    return undefined;
  }, [log]);
  const primaryPrompt = PRIMARY_PROMPTS[Math.min(primaryStepIndex, PRIMARY_PROMPTS.length - 1)];
  const primaryComplete = gameState.completedObjectives.includes("transport-priority");
  const sceneObjects = useMemo(
    () =>
      getVisibleInteractiveObjects(sceneScenario, gameState).map((object) => {
        const availability = getObjectAvailability(object, gameState);
        return {
          ...object,
          enabled: availability.enabled,
          disabledReason: availability.reason,
          completed: isInteractiveObjectComplete(object, gameState),
        };
      }),
    [gameState, sceneScenario]
  );
  const availableActionsForObject = (object: InteractiveObjectConfig) =>
    object.actions.filter(
      (action) => !hasEvents(gameState, getActionSuccessEvents(action)) && hasEvents(gameState, action.requires)
    );
  const selectedObject = sceneObjects.find((object) => object.id === gameState.selectedObjectId);
  const animalControlCalled = hasEvents(gameState, ["ANIMAL_CONTROL_CALLED"]);
  const actionableSceneObjects = sceneObjects.filter(
    (object) =>
      object.id === gameState.selectedObjectId ||
      (!object.completed &&
        (availableActionsForObject(object).length > 0 ||
          (object.id === "ambulance-radio" && !animalControlCalled)))
  );
  const nextSceneObject = actionableSceneObjects.find((object) => object.enabled !== false && !object.optional);
  const glovesEquipped = hasEvents(gameState, ["GLOVES_EQUIPPED"]);
  const medicalBagOpened = hasEvents(gameState, ["MEDICAL_BAG_OPENED"]);
  const animalControlPending =
    animalControlCalled &&
    !hasEvents(gameState, ["DOG_SECURED"]);
  const selectedActions = selectedObject ? availableActionsForObject(selectedObject) : [];
  const nextStepActions = nextSceneObject ? availableActionsForObject(nextSceneObject) : [];
  const currentObjectiveUsesEquipment = currentObjective.id === "baseline-vitals";
  const currentObjectiveStepAvailable =
    simulationMode === "guided" && (Boolean(nextSceneObject) || currentObjectiveUsesEquipment);
  const nextStepButtonLabel = (() => {
    if (animalControlPending) return "Animal control responding";
    if (currentObjective.id === "baseline-vitals") return simulationMode === "guided" ? "Gather baseline vitals" : "Gather vitals";
    if (!nextSceneObject) return "Primary complete";
    if (simulationMode === "exam") return "Continue";
    if (simulationMode === "scenario") {
      if (currentObjective.id === "inspect-dog") return "Assess the scene";
      if (currentObjective.id === "use-radio") return "Request help";
      if (currentObjective.id === "baseline-vitals") return "Gather vitals";
      if (currentObjective.id === "working-impression") return "Choose impression";
      return "Continue assessment";
    }
    if (nextSceneObject.id === "ambulance-radio") return "Use ambulance radio";
    if (nextSceneObject.id === "medical-bag") return medicalBagOpened ? "Put on gloves" : "Open bag for PPE";
    if (nextSceneObject.id === "dog") return "Inspect barking dog";
    return nextStepActions[0]?.label ?? `Select ${nextSceneObject.name}`;
  })();
  const currentTaskCards = useMemo(
    () => {
      if (!hasEvents(gameState, ["DOG_SECURED"])) {
        return [
          {
            label: "Control hazards",
            completed: [
              hasEvents(gameState, ["DOG_INSPECTED"]),
              hasEvents(gameState, ["ANIMAL_CONTROL_CALLED"]),
              hasEvents(gameState, ["DOG_SECURED"]),
            ].filter(Boolean).length,
            total: 3,
          },
          {
            label: "Secure area",
            completed: hasEvents(gameState, ["DOG_SECURED"]) ? 1 : 0,
            total: 1,
          },
          {
            label: "Request additional resources",
            completed: hasEvents(gameState, ["ANIMAL_CONTROL_CALLED"]) ? 1 : 0,
            total: 1,
          },
        ];
      }

      return [
        {
          label: "BSI / PPE",
          completed: hasEvents(gameState, ["GLOVES_EQUIPPED"]) ? 1 : 0,
          total: 1,
        },
        {
          label: "Patient contact",
          completed: [
            hasEvents(gameState, ["PATIENT_APPROACHED"]),
            hasEvents(gameState, ["GENERAL_IMPRESSION_OBSERVED"]),
            hasEvents(gameState, ["RESPONSIVENESS_CHECKED"]),
          ].filter(Boolean).length,
          total: 3,
        },
        {
          label: "Airway / Breathing / Circulation",
          completed: [
            hasEvents(gameState, ["AIRWAY_OPENED"]),
            hasEvents(gameState, ["RESPIRATIONS_COUNTED"]),
            hasEvents(gameState, ["PULSE_CHECKED"]),
          ].filter(Boolean).length,
          total: 3,
        },
        {
          label: "Transport priority",
          completed: hasEvents(gameState, ["TRANSPORT_SELECTED"]) ? 1 : 0,
          total: 1,
        },
      ];
    },
    [gameState.triggeredEvents]
  );
  const phaseProgressItems = [
    { label: "Scene Safety", complete: hasEvents(gameState, ["DOG_SECURED"]) },
    { label: "Primary Survey", complete: hasEvents(gameState, ["TRANSPORT_SELECTED"]) },
    { label: "Secondary Survey", complete: gameState.currentPhase === "secondaryAssessment" },
    { label: "Interventions", complete: gameState.currentPhase === "interventions" },
    { label: "Transport", complete: hasEvents(gameState, ["TRANSPORT_SELECTED"]) },
  ];
  const resetScene = (nextScenario = scenario) => {
    dispatchGame({ type: "RESET", scenario: sceneScenario });
    setStage("primary");
    setChecked({});
    setVitals(nextScenario.vitals);
    setLog(makeOpeningLog(nextScenario));
    setPrimaryStepIndex(0);
    setPrimaryFeedback("Start with the action that protects you, your partner, and the patient.");
    setSceneFinding("");
    setAnimalControlResponseActive(false);
  };

  const runSceneAction = (object: InteractiveObjectConfig, actionId: string) => {
    const action = object.actions.find((item) => item.id === actionId);
    setLabOpen(isDesktopLayout);
    if (action) {
      setLog((prev) => [...prev, { who: "student", text: `${object.name}: ${action.label}` }]);
      setSceneFinding(action.description ?? "");
    }
    dispatchGame({ type: "RUN_ACTION", objectId: object.id, actionId });
  };

  const runEquipmentDockAction = (itemId: string) => {
    if (itemId === "bp" || itemId === "pulseox") {
      if (!hasEvents(gameState, ["PULSE_CHECKED"])) {
        const message = "Finish airway, breathing, and circulation before gathering baseline vitals.";
        setSceneFinding(message);
        setLog((prev) => [...prev, { who: "coach", text: message }]);
        return;
      }

      const event = itemId === "bp" ? "BLOOD_PRESSURE_OBTAINED" : "SPO2_OBTAINED";
      if (hasEvents(gameState, [event])) {
        const message = itemId === "bp" ? "Blood pressure is already recorded." : "Pulse oximetry is already recorded.";
        setSceneFinding(message);
        setLog((prev) => [...prev, { who: "coach", text: message }]);
        return;
      }

      setLog((prev) => [...prev, { who: "student", text: itemId === "bp" ? "Apply blood pressure cuff" : "Apply pulse oximeter" }]);
      dispatchGame({ type: "APPLY_EVENT", event });
      return;
    }

    if (itemId !== "gloves") {
      const message = "Not needed yet. Finish scene safety, PPE, and the primary assessment first.";
      setSceneFinding(message);
      setLog((prev) => [...prev, { who: "coach", text: message }]);
      return;
    }

    const medicalBag = sceneObjects.find((object) => object.id === "medical-bag");
    if (!medicalBag || medicalBag.enabled === false) {
      const message = "Secure the scene before opening your aid bag for PPE.";
      setSceneFinding(message);
      setLog((prev) => [...prev, { who: "coach", text: message }]);
      dispatchGame({ type: "SELECT_OBJECT", objectId: "medical-bag" });
      return;
    }

    if (!medicalBagOpened) {
      runSceneAction(medicalBag, "open-medical-bag");
      return;
    }

    if (!glovesEquipped) {
      runSceneAction(medicalBag, "equip-gloves");
      return;
    }

    const message = "Gloves are already on. Move to the patient when ready.";
    setSceneFinding(message);
    setLog((prev) => [...prev, { who: "coach", text: message }]);
  };

  const runCurrentObjectiveStep = () => {
    if (currentObjective.id === "baseline-vitals") {
      if (!hasEvents(gameState, ["BLOOD_PRESSURE_OBTAINED"])) {
        runEquipmentDockAction("bp");
        return;
      }
      if (!hasEvents(gameState, ["SPO2_OBTAINED"])) {
        runEquipmentDockAction("pulseox");
        return;
      }
    }

    if (!nextSceneObject) return;

    if (nextSceneObject.id === "medical-bag") {
      runEquipmentDockAction("gloves");
      return;
    }

    if (nextSceneObject.id === "ambulance-radio") {
      setLog((prev) => [...prev, { who: "student", text: "Ambulance Radio: request animal control" }]);
      setSceneFinding("Using the radio to request animal control and police support.");
      dispatchGame({ type: "SELECT_OBJECT", objectId: "ambulance-radio" });
      return;
    }

    const nextAction = nextStepActions[0];
    if (nextAction) {
      runSceneAction(nextSceneObject, nextAction.id);
      return;
    }

    dispatchGame({ type: "SELECT_OBJECT", objectId: nextSceneObject.id });
  };

  const markTasks = (tasks: string[]) => {
    if (!tasks.length) return;
    setChecked((prev) => {
      const next = { ...prev };
      tasks.forEach((task) => {
        next[task] = true;
      });
      return next;
    });
  };

  const autoMarkFromText = (text: string) => {
    const lower = text.toLowerCase();
    const matches = KEYWORD_TASKS.filter(({ words }) => words.some((word) => lower.includes(word))).map(
      ({ task }) => task
    );
    markTasks(matches);
  };

  const appendStudent = (message: string) => {
    setLog((prev) => [...prev, { who: "student", text: message }]);
    autoMarkFromText(message);
  };

  const appendReply = (reply: string) => {
    const who: LogEntry["who"] = reply.toLowerCase().startsWith("coach:") ? "coach" : "patient";
    setLog((prev) => [...prev, { who, text: reply }]);
    setSceneFinding(reply);
    autoMarkFromText(reply);
  };

  const runAction = (action: QuickAction) => {
    appendStudent(action.message);
    markTasks(action.completes);
    if (action.vitalPatch) setVitals((prev) => ({ ...prev, ...action.vitalPatch }));
    appendReply(action.patientReply);
  };

  const resolveFinding = (prompt: PrimaryPrompt) =>
    typeof prompt.finding === "function" ? prompt.finding(scenario) : prompt.finding;

  const choosePrimaryOption = (choice: string) => {
    if (!primaryPrompt || primaryComplete) return;

    const correct = choice === primaryPrompt.task;
    setLog((prev) => [...prev, { who: "student", text: choice }]);

    if (!correct) {
      const feedback = `Not yet. In primary assessment, the next move is ${primaryPrompt.task}.`;
      setPrimaryFeedback(feedback);
      setSceneFinding(feedback);
      setLog((prev) => [...prev, { who: "coach", text: feedback }]);
      return;
    }

    const finding = resolveFinding(primaryPrompt);
    markTasks([primaryPrompt.task]);
    setSceneFinding(finding);

    const nextIndex = Math.min(primaryStepIndex + 1, PRIMARY_PROMPTS.length);
    const feedback =
      nextIndex >= PRIMARY_PROMPTS.length
        ? "Correct. Primary assessment complete. You are ready to move into secondary assessment."
        : `Correct. ${finding}`;

    setPrimaryFeedback(feedback);
    setSceneFinding(feedback);
    setLog((prev) => [...prev, { who: "coach", text: feedback }]);
    setPrimaryStepIndex(nextIndex);
  };

  const selectScenario = (id: string) => {
    const nextScenario = SCENARIOS.find((item) => item.id === id) ?? SCENARIOS[0];
    setScenarioId(nextScenario.id);
    resetScene(nextScenario);
  };

  const changeSimulationMode = (mode: SimulationMode) => {
    if (mode === simulationMode) return;
    setSimulationMode(mode);
    resetScene();
    setMobileHudOpen(false);
    setMobileHudSection("objective");
  };

  const controls = (
    <>
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
              <Ambulance size={15} />
              EMT Scene Lab
            </div>
            <h1 className="mt-1 truncate text-lg font-black text-white">{scenario.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => resetScene()}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Reset scene"
            >
              <RefreshCcw size={16} />
            </button>
            <button
              type="button"
              onClick={() => setLabOpen(false)}
              data-testid="desktop-hide-scene-lab"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Hide EMT Scene Lab"
            >
              <PanelRightClose size={16} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pulse</div>
            <div className="mt-0.5 truncate text-xs font-bold text-white">{vitals.pulse}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">BP</div>
            <div className="mt-0.5 truncate text-xs font-bold text-white">{vitals.bp}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SpO2</div>
            <div className="mt-0.5 truncate text-xs font-bold text-white">{vitals.spo2}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/10 px-3 py-2 text-xs font-bold text-teal-100">
          <ClipboardList size={15} />
          Assessment controls
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Current goal</div>
            <div className="mt-1 text-xl font-black text-white">{currentObjective.label}</div>
            <div className="mt-1 text-xs text-slate-400">
              {completedCount} of {totalTasks} phase objectives complete
            </div>
          </div>
          <div className="text-3xl font-black text-teal-300">{progressPercent}%</div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-teal-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {stage === "primary" ? (
          <>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
                  Guided simulation
                </div>
                {primaryComplete ? (
                  <span className="rounded-full bg-teal-300 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                    Complete
                  </span>
                ) : null}
              </div>

              <div className="mt-3 text-sm leading-5 text-slate-300">
                {primaryComplete ? (
                  "Primary assessment complete. Secondary assessment is unlocked."
                ) : (
                  currentObjective.subtleGoal
                )}
              </div>

              {primaryComplete ? (
                <button
                  type="button"
                  onClick={() => setStage("secondary")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-100"
                >
                  Continue to Secondary
                  <Timer size={16} />
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              {sceneScenario.objectives.map((objective) => {
                const complete = gameState.completedObjectives.includes(objective.id);
                const active = objective.id === gameState.currentObjectiveId;
                return (
                  <div
                    key={objective.id}
                    className={`rounded-xl border px-3 py-2.5 text-sm ${complete
                      ? "border-teal-300/35 bg-teal-400/10 text-teal-50"
                      : active
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 bg-black/15 text-slate-400"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold">{objective.label}</span>
                      {complete ? <CheckCircle2 size={15} className="text-teal-300" /> : null}
                    </div>
                    {active && !complete ? (
                      <div className="mt-1 text-xs leading-4 text-slate-300">{objective.subtleGoal}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>

          </>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <Activity size={14} />
              Available actions
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {relevantActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => runAction(action)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-xs font-bold text-white transition hover:border-teal-400/50 hover:bg-teal-400/10"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {stageIndex < STAGES.length - 1 ? (
              <button
                type="button"
                onClick={() => setStage(STAGES[stageIndex + 1].key)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-100"
              >
                Continue to {STAGES[stageIndex + 1].title}
                <Timer size={16} />
              </button>
            ) : null}
          </>
        )}
      </div>
    </>
  );

  return (
    <AppShell>
      <Seo
        title="Interactive EMT Scene Lab"
        description="Practice scene safety, primary assessment, patient interaction, and clinical decision-making in an interactive 3D EMT simulation."
        path="/emtscene"
      />
      <SceneTopBar score={gameState.score} completed={scenarioCompletedCount} total={scenarioTasks.length} />

      <main className="relative isolate min-h-0 overflow-hidden bg-slate-950" style={{ height: sceneHeight }}>
        <div className="absolute inset-0">
          <ThreeDScene
            key={`${scenario.id}-${simulationMode}`}
            height={sceneHeight}
            scenarioId={scenario.id}
            sceneFinding={sceneFinding}
            sceneSpeaker={latestSceneMessage?.who === "patient" ? "patient" : "coach"}
            interactiveObjects={actionableSceneObjects}
            selectedObjectId={gameState.selectedObjectId}
            focusedObjectId={gameState.focusedObjectId}
            cameraFocusObjectId={cameraFocusObjectId}
            accessibilityMode={gameState.accessibilityMode || simulationMode === "guided"}
            environment={gameState.environment}
            locationId={gameState.locationId}
            inventory={gameState.inventory}
            equippedItems={gameState.equippedItems}
            animalControlResponseActive={animalControlResponseActive}
            showGuideIntro={false}
            onObjectSelect={(objectId) => dispatchGame({ type: "SELECT_OBJECT", objectId })}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/65 via-transparent to-slate-950/55" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/35" />

        <button
          type="button"
          data-testid="mobile-hud-toggle"
          onClick={() => setMobileHudOpen((open) => !open)}
          className="absolute right-3 top-3 z-[80] inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-slate-950/86 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition hover:border-teal-300/60 hover:bg-teal-400/10 lg:hidden"
          aria-expanded={mobileHudOpen}
          aria-controls="mobile-hud-panel"
        >
          {mobileHudOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          {mobileHudOpen ? "Close HUD" : "Show HUD"}
        </button>

        {!mobileHudOpen && !selectedObject ? (
          <button
            type="button"
            data-testid="mobile-next-scene-object"
            onClick={() => {
              if (animalControlPending) {
                setMobileHudSection("objective");
                setMobileHudOpen(true);
                return;
              }
              if (nextSceneObject) {
                dispatchGame({ type: "SELECT_OBJECT", objectId: nextSceneObject.id });
                return;
              }
              setMobileHudSection(currentObjectiveUsesEquipment ? "equipment" : "objective");
              setMobileHudOpen(true);
            }}
            className="absolute inset-x-3 bottom-3 z-40 flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-teal-200/45 bg-slate-950/86 px-4 py-3 text-left text-white shadow-2xl shadow-slate-950/45 backdrop-blur-xl transition active:scale-[0.99] lg:hidden"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-teal-200">
                <ClipboardCheck size={13} />
                Current goal
              </div>
              <div className="mt-1 truncate text-sm font-black leading-5">{currentObjective.label}</div>
              <div className="truncate text-[11px] font-semibold text-slate-300">
                {animalControlPending
                  ? "Animal control responding"
                  : nextSceneObject
                    ? `Tap ${nextSceneObject.name}`
                    : nextStepButtonLabel}
              </div>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-teal-200/35 bg-teal-400/15 text-teal-100">
              {animalControlPending ? <Timer size={18} /> : <MousePointerClick size={18} />}
            </span>
          </button>
        ) : null}

        {mobileHudOpen ? (
          <button
            type="button"
            aria-label="Close mobile HUD"
            onClick={() => setMobileHudOpen(false)}
            className="absolute inset-0 z-[55] bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          />
        ) : null}

        {mobileHudOpen ? (
          <section
            id="mobile-hud-panel"
            data-testid="mobile-hud-panel"
            className="absolute inset-x-0 bottom-0 z-[70] flex max-h-[72%] flex-col overflow-hidden rounded-t-2xl border-x border-t border-white/15 bg-slate-950/94 pb-[env(safe-area-inset-bottom)] text-white shadow-2xl shadow-slate-950/60 backdrop-blur-xl lg:hidden"
          >
            <div className="shrink-0 border-b border-white/10 px-3 pb-2 pt-2">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/25" />
              <div className="grid grid-cols-5 gap-1">
                {MOBILE_HUD_SECTIONS.map((item) => {
                  const Icon = item.icon;
                  const active = item.key === mobileHudSection;
                  const hasVitals = item.key !== "vitals" || vitalsPanelVisible;
                  const hasEquipment = item.key !== "equipment" || equipmentDockVisible;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMobileHudSection(item.key)}
                      className={`flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-[9px] font-black transition ${
                        active
                          ? "border-teal-300 bg-teal-400/15 text-teal-200"
                          : "border-transparent text-slate-300 hover:border-white/15 hover:bg-white/5"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="relative">
                        <Icon size={17} />
                        {(!hasVitals || !hasEquipment) && !active ? (
                          <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-slate-500" />
                        ) : null}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {mobileHudSection === "objective" ? (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                        <ClipboardCheck size={14} />
                        Current objective
                      </div>
                      <h2 className="mt-2 text-xl font-black leading-6 text-white">{currentObjective.label}</h2>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{currentObjective.subtleGoal}</p>
                    </div>
                    <div className="shrink-0 text-2xl font-black text-teal-300">{progressPercent}%</div>
                  </div>

                  {currentObjectiveStepAvailable ? (
                    <button
                      type="button"
                      data-testid="mobile-current-objective-step-button"
                      onClick={() => {
                        runCurrentObjectiveStep();
                        setMobileHudOpen(false);
                      }}
                      className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-200/40 bg-teal-400/15 px-3 py-2.5 text-xs font-black text-teal-50 transition hover:border-teal-200 hover:bg-teal-300/25"
                    >
                      <MousePointerClick size={15} />
                      {nextStepButtonLabel}
                    </button>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {actionableSceneObjects.map((object) => (
                      <button
                        key={object.id}
                        type="button"
                        data-testid={`mobile-scene-object-${object.id}`}
                        onClick={() => {
                          dispatchGame({ type: "SELECT_OBJECT", objectId: object.id });
                          setMobileHudOpen(false);
                        }}
                        className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black transition ${
                          object.enabled === false
                            ? "border-white/10 bg-white/5 text-slate-500"
                            : "border-white/15 bg-white/10 text-white hover:border-teal-200/70"
                        }`}
                      >
                        <span className="truncate">{object.name}</span>
                        <MousePointerClick className="shrink-0 text-teal-200" size={14} />
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    {currentTaskCards.map((task) => {
                      const done = task.completed >= task.total;
                      return (
                        <div
                          key={task.label}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs ${
                            done
                              ? "border-teal-300/35 bg-teal-400/10 text-teal-50"
                              : "border-white/10 bg-white/5 text-slate-200"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                              done
                                ? "border-teal-300 bg-teal-300 text-slate-950"
                                : "border-slate-500 bg-slate-950/30"
                            }`}>
                              {done ? <CheckCircle2 size={13} /> : null}
                            </span>
                            <span className="truncate font-bold">{task.label}</span>
                          </div>
                          <span className="font-black text-slate-300">{task.completed}/{task.total}</span>
                        </div>
                      );
                    })}
                  </div>

                  {gameState.failedObjectives.includes("dog-hazard") ? (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200/25 bg-rose-500/10 px-3 py-2 text-xs font-bold leading-5 text-rose-50">
                      <AlertTriangle className="mt-0.5 shrink-0" size={14} />
                      Unsafe approach: the dog forced you back and cost scene time.
                    </div>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => dispatchGame({ type: "USE_HINT" })}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white"
                    >
                      <Lightbulb size={14} />
                      Hint
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchGame({ type: "TOGGLE_ACCESSIBILITY" })}
                      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
                        gameState.accessibilityMode
                          ? "border-teal-200 bg-teal-300 text-slate-950"
                          : "border-white/15 bg-white/10 text-white"
                      }`}
                    >
                      <MousePointerClick size={14} />
                      Mark objects
                    </button>
                  </div>
                </div>
              ) : null}

              {mobileHudSection === "dispatch" ? (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                        <Siren size={14} />
                        Active dispatch
                      </div>
                      <h2 className="mt-2 text-xl font-black leading-6 text-white">{scenario.title}</h2>
                      <p className="mt-2 text-sm leading-5 text-slate-300">{sceneScenario.dispatch}</p>
                    </div>
                    <StatusPill tone={scenario.priority === "Unstable" ? "rose" : "amber"}>
                      {scenario.priority}
                    </StatusPill>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
                    {(["guided", "scenario", "exam"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => changeSimulationMode(mode)}
                        className={`min-h-10 rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                          simulationMode === mode
                            ? "bg-teal-300 text-slate-950"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <MapPin size={13} />
                      Riverside community festival
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-200">{sceneScenario.sceneReport}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-300">
                      <Timer size={15} />
                      Time elapsed
                    </div>
                    <div className="text-lg font-black text-white">
                      {Math.floor(gameState.elapsedTime / 60)}:{String(gameState.elapsedTime % 60).padStart(2, "0")}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetScene();
                      setMobileHudOpen(false);
                    }}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-100"
                  >
                    <LogOut size={16} />
                    End scenario
                  </button>
                </div>
              ) : null}

              {mobileHudSection === "vitals" ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                      <HeartPulse size={14} />
                      Patient vitals
                    </div>
                    <div className="text-[11px] font-medium text-slate-400">Live monitor</div>
                  </div>

                  {vitalsPanelVisible ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {monitorVitals.map((item) => (
                        <div key={item.label} className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                          <div className={`mt-2 whitespace-nowrap text-2xl font-black leading-none ${item.tone}`} title={item.value}>
                            {item.value}
                          </div>
                          {item.unit ? <div className="mt-1 text-[11px] font-semibold text-slate-300">{item.unit}</div> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center">
                      <HeartPulse className="mx-auto text-slate-500" size={28} />
                      <p className="mt-3 text-sm font-black text-slate-200">No vitals recorded</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">Complete the primary checks to unlock the monitor.</p>
                    </div>
                  )}
                </div>
              ) : null}

              {mobileHudSection === "equipment" ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                      <ShieldCheck size={14} />
                      Equipment
                    </div>
                    <div className="text-[11px] font-medium text-slate-400">
                      {equipmentDockVisible ? "Aid bag ready" : "Secure the scene first"}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {EQUIPMENT_DOCK_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active =
                        (item.id === "gloves" && glovesEquipped) ||
                        (item.id === "bp" && hasEvents(gameState, ["BLOOD_PRESSURE_OBTAINED"])) ||
                        (item.id === "pulseox" && hasEvents(gameState, ["SPO2_OBTAINED"]));
                      const available =
                        (item.id === "gloves" && hasEvents(gameState, ["DOG_SECURED"])) ||
                        ((item.id === "bp" || item.id === "pulseox") && hasEvents(gameState, ["PULSE_CHECKED"]));

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            runEquipmentDockAction(item.id);
                            setMobileHudOpen(false);
                          }}
                          className={`flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                            active
                              ? "border-teal-300 bg-teal-400/15 text-teal-200"
                              : available
                                ? "border-teal-300/45 bg-teal-400/10 text-teal-100"
                                : "border-white/10 bg-white/5 text-slate-500"
                          }`}
                          aria-pressed={active}
                        >
                          <Icon size={22} strokeWidth={1.8} />
                          <span className="truncate text-[11px] font-black">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {mobileHudSection === "progress" ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                      <Star size={14} />
                      {primaryComplete ? "Primary debrief" : "Scenario progress"}
                    </div>
                    <div className="text-3xl font-black text-teal-300">{scenarioProgressPercent}%</div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-amber-300">
                    {Array.from({ length: 5 }, (_, index) => {
                      const filled = scenarioProgressPercent >= (index + 1) * 20;
                      return (
                        <Star
                          key={index}
                          size={30}
                          className={filled ? "fill-amber-300 text-amber-300" : "text-teal-500/50"}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-teal-400 transition-all duration-300"
                      style={{ width: `${scenarioProgressPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-300">
                    {scenarioCompletedCount} of {scenarioTasks.length} scenario objectives complete
                  </div>

                  <div className="mt-5 grid grid-cols-5 gap-1">
                    {phaseProgressItems.map((item) => (
                      <div key={item.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
                        <span className={`h-3.5 w-3.5 rounded-full border-2 ${
                          item.complete ? "border-teal-200 bg-teal-300" : "border-slate-500 bg-slate-950"
                        }`} />
                        <span className="text-[8px] font-bold leading-3 text-slate-400">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {primaryComplete ? (
                    <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                      <p className="text-xs font-semibold leading-5 text-slate-200">{debrief.summary}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(debrief.score).map(([label, value]) => (
                          <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</div>
                            <div className="mt-1 text-lg font-black text-teal-200">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold text-slate-300">
                    Score {gameState.score} · {Math.floor(gameState.elapsedTime / 60)}:{String(gameState.elapsedTime % 60).padStart(2, "0")}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section
          data-testid="scene-objective-prompt"
          className="absolute right-4 top-4 z-30 hidden w-[360px] rounded-2xl border border-white/15 bg-slate-950/78 p-4 text-white shadow-2xl shadow-slate-950/45 backdrop-blur-xl lg:block"
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">
            <ClipboardCheck size={15} />
            Objective
          </div>
          <h2 className="mt-4 text-2xl font-black leading-7 text-white">{currentObjective.label}</h2>
          <p className="mt-2 text-sm font-medium leading-5 text-slate-300">{currentObjective.subtleGoal}</p>

          {currentObjectiveStepAvailable ? (
            <button
              type="button"
              data-testid="current-objective-step-button"
              onClick={runCurrentObjectiveStep}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200/40 bg-teal-400/15 px-4 py-3 text-sm font-black text-teal-50 transition hover:border-teal-200 hover:bg-teal-300/25"
            >
              <MousePointerClick size={16} />
              {nextStepButtonLabel}
            </button>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Primary tasks</div>
            <button
              type="button"
              onClick={() => dispatchGame({ type: "TOGGLE_ACCESSIBILITY" })}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition ${gameState.accessibilityMode
                ? "border-teal-200 bg-teal-300 text-slate-950"
                : "border-white/15 bg-white/10 text-slate-200 hover:border-teal-200/60"
                }`}
            >
              Mark objects
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {currentTaskCards.map((task) => {
              const done = task.completed >= task.total;
              return (
                <div
                  key={task.label}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${done
                    ? "border-teal-300/35 bg-teal-400/10 text-teal-50"
                    : "border-white/12 bg-white/5 text-slate-200"
                    }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${done ? "border-teal-300 bg-teal-300 text-slate-950" : "border-slate-500 bg-slate-950/30"}`}>
                      {done ? <CheckCircle2 size={13} /> : null}
                    </span>
                    <span className="truncate font-bold">{task.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-300">
                    {task.completed}/{task.total}
                  </span>
                </div>
              );
            })}
          </div>

          {gameState.failedObjectives.includes("dog-hazard") ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200/25 bg-rose-500/10 px-3 py-2 text-xs font-bold leading-5 text-rose-50">
              <AlertTriangle className="mt-0.5 shrink-0" size={14} />
              Unsafe approach: the dog forced you back and cost scene time.
            </div>
          ) : null}

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Phase progress</div>
            <div className="mt-4 flex items-start justify-between gap-2">
              {phaseProgressItems.map((item, index) => (
                <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                  <div className="flex w-full items-center">
                    <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${item.complete ? "border-teal-200 bg-teal-300" : index === 0 ? "border-teal-200 bg-slate-950" : "border-slate-500 bg-slate-950"}`} />
                    {index < phaseProgressItems.length - 1 ? (
                      <span className={`h-0.5 min-w-0 flex-1 ${phaseProgressItems[index + 1].complete ? "bg-teal-300" : "bg-slate-600"}`} />
                    ) : null}
                  </div>
                  <span className="text-[9px] font-bold leading-3 text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {selectedObject ? (
          <section
            data-testid="scene-decision-prompt"
            className="absolute bottom-28 left-4 right-4 z-50 rounded-2xl border border-white/15 bg-slate-950/86 p-3 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl lg:bottom-auto lg:left-[52%] lg:right-auto lg:top-[46%] lg:w-[230px] lg:-translate-y-1/2 lg:rounded-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-200">
                  Actions
                </div>
                <h2 className="mt-0.5 text-sm font-black leading-5 text-white">{selectedObject.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => dispatchGame({ type: "SELECT_OBJECT", objectId: undefined })}
                className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>
            {selectedObject.enabled === false ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200/25 bg-amber-400/10 px-3 py-2 text-xs font-bold leading-5 text-amber-50">
                <AlertTriangle className="mt-0.5 shrink-0" size={15} />
                {selectedObject.disabledReason}
              </div>
            ) : null}
            <div className="mt-3 grid gap-2">
              {selectedActions.length === 0 ? (
                <div className="rounded-xl border border-teal-200/25 bg-teal-400/10 px-3 py-3 text-xs font-bold text-teal-50">
                  This object is complete. Follow the highlighted next step.
                </div>
              ) : null}
              {selectedActions.map((action) => {
                const disabled =
                  selectedObject.enabled === false || !hasEvents(gameState, action.requires);
                return (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`scene-action-${action.id}`}
                    onClick={() => runSceneAction(selectedObject, action.id)}
                    disabled={disabled}
                    className="flex min-h-[46px] items-center justify-between gap-3 rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-left text-xs font-black text-white shadow-lg shadow-black/10 transition hover:border-teal-200/80 hover:bg-teal-300/15 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span>
                      {action.label}
                      {action.description ? (
                        <span className="mt-0.5 hidden text-[10px] font-semibold leading-3 text-slate-300 lg:block">{action.description}</span>
                      ) : null}
                    </span>
                    <CheckCircle2 className="mt-0.5 shrink-0 text-teal-200" size={16} />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section
          data-testid="active-dispatch-panel"
          className="absolute left-4 top-4 z-20 hidden w-[min(420px,calc(100%-32px))] rounded-2xl border border-white/15 bg-slate-950/70 p-4 text-white shadow-2xl backdrop-blur-xl xl:w-[390px] lg:block"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">
                <Siren size={14} />
                Active dispatch
              </div>
              <h2 className="mt-1 text-lg font-black">{scenario.title}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-300">{sceneScenario.dispatch}</p>
            </div>
            <StatusPill tone={scenario.priority === "Unstable" ? "rose" : "amber"}>
              {scenario.priority}
            </StatusPill>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
            {(["guided", "scenario", "exam"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeSimulationMode(mode)}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${simulationMode === mode
                  ? "bg-teal-300 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>



          <div className="mt-3 flex items-center gap-2">
            <select
              value={scenario.id}
              onChange={(event) => selectScenario(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-400"
              aria-label="Select scenario"
            >
              {SCENARIOS.map((item) => (
                <option key={item.id} value={item.id} className="bg-slate-900">
                  {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setLabOpen(true);
              }}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 lg:hidden"
            >
              Controls
            </button>
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <MapPin size={13} />
              Riverside community festival
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-200">{sceneScenario.sceneReport}</p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              <Timer size={14} />
              Time elapsed
            </div>
            <div className="text-lg font-black text-white">
              {Math.floor(gameState.elapsedTime / 60)}:{String(gameState.elapsedTime % 60).padStart(2, "0")}
            </div>
          </div>
        </section>

        <section
          data-testid="pro-tip-panel"
          className="absolute left-4 top-[392px] z-20 hidden w-[260px] rounded-2xl border border-white/15 bg-slate-950/76 p-4 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl lg:block"
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
            <Lightbulb size={15} />
            Pro tip
          </div>
          <p className="mt-3 text-sm font-semibold leading-5 text-slate-200">
            Scene safety comes first. Address hazards before approaching the patient.
          </p>
          <button
            type="button"
            onClick={() => dispatchGame({ type: "USE_HINT" })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200/35 bg-teal-400/12 px-3 py-2.5 text-xs font-black text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20"
          >
            <Play size={14} className="fill-teal-200" />
            Show me
          </button>
        </section>

        <section
          data-testid="desktop-bottom-hud"
          className="absolute bottom-4 left-4 right-[400px] z-20 hidden items-end gap-2 text-white 2xl:right-[416px] 2xl:gap-3 lg:flex"
        >
          <button
            type="button"
            onClick={() => resetScene()}
            className="flex h-[76px] w-[124px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/80 px-3 text-xs font-black text-slate-100 shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition hover:border-rose-300/60 hover:bg-rose-500/15 hover:text-white 2xl:h-[86px] 2xl:w-[160px] 2xl:text-sm"
          >
            <LogOut size={20} />
            End Scenario
          </button>

          {vitalsPanelVisible ? (
            <div
              data-testid="patient-vitals-panel"
              className="w-[360px] shrink-0 rounded-2xl border border-white/15 bg-slate-950/80 p-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl 2xl:w-[500px] 2xl:p-4"
            >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                <HeartPulse size={14} />
                Patient vitals
              </div>
              <div className="text-[11px] font-medium text-slate-400">Live monitor</div>
            </div>
            <div className="grid grid-cols-[0.75fr_1fr_0.9fr_0.72fr_0.72fr_1.08fr] gap-2 2xl:gap-3">
              {monitorVitals.map((item) => (
                <div key={item.label} className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                  <div className={`mt-1 whitespace-nowrap text-[21px] font-black leading-none tracking-tight ${item.tone} 2xl:text-2xl`} title={item.value}>
                    {item.value}
                  </div>
                  {item.unit ? <div className="mt-1 text-xs font-semibold text-slate-300">{item.unit}</div> : null}
                </div>
              ))}
            </div>
            </div>
          ) : null}

          {equipmentDockVisible ? (
            <div
              data-testid="equipment-dock"
              className="w-[318px] shrink-0 rounded-2xl border border-white/15 bg-slate-950/80 p-2 shadow-2xl shadow-slate-950/40 backdrop-blur-xl 2xl:w-[340px] 2xl:p-3"
            >
            <div className="grid grid-cols-6 gap-1 2xl:gap-2">
              {EQUIPMENT_DOCK_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  (item.id === "gloves" && glovesEquipped) ||
                  (item.id === "bp" && hasEvents(gameState, ["BLOOD_PRESSURE_OBTAINED"])) ||
                  (item.id === "pulseox" && hasEvents(gameState, ["SPO2_OBTAINED"]));
                const available =
                  (item.id === "gloves" && hasEvents(gameState, ["DOG_SECURED"])) ||
                  ((item.id === "bp" || item.id === "pulseox") && hasEvents(gameState, ["PULSE_CHECKED"]));

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => runEquipmentDockAction(item.id)}
                    className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl border px-0.5 py-2 text-center transition 2xl:gap-2 2xl:px-1.5 2xl:py-2.5 ${active
                      ? "border-teal-300 bg-teal-400/15 text-teal-200 shadow-[0_0_28px_rgba(45,212,191,0.2)]"
                      : available
                        ? "border-teal-300/45 bg-teal-400/10 text-teal-100 hover:border-teal-200"
                        : "border-white/15 bg-white/5 text-slate-200 hover:border-teal-300/50 hover:bg-white/10"
                      }`}
                    aria-pressed={active}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg border transition 2xl:h-10 2xl:w-10 2xl:rounded-xl ${active
                        ? "border-teal-300 bg-teal-400/10 text-teal-200"
                        : "border-white/15 bg-white/5 text-slate-100 group-hover:border-teal-300/50"
                        }`}
                    >
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className={`max-w-full whitespace-nowrap text-[7px] font-bold leading-none 2xl:text-xs ${active ? "text-teal-300" : "text-slate-200"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            </div>
          ) : null}
        </section>

        {/*
          EMT Scene Lab HUD temporarily hidden while the scene layout is being refined.
          Keep the panel code here so it can be restored without rebuilding the controls.

          {labOpen && isDesktopLayout ? (
            <aside
              data-testid="desktop-scene-lab"
              className="absolute bottom-[184px] right-4 top-4 z-40 hidden w-[380px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/80 text-white shadow-2xl backdrop-blur-xl lg:flex"
            >
              {controls}
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setLabOpen(true)}
              data-testid="desktop-show-scene-lab"
              className="absolute right-4 top-4 z-40 hidden items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm font-black text-white shadow-2xl backdrop-blur-xl transition hover:border-teal-300/60 hover:bg-teal-400/10 lg:flex"
            >
              <PanelRightOpen size={18} />
              EMT Scene Lab
            </button>
          )}
        */}

        <section
          data-testid="scenario-progress-panel"
          className={`absolute bottom-4 right-4 z-40 hidden w-[380px] rounded-2xl border border-white/15 bg-slate-950/80 p-4 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl lg:block ${primaryComplete ? "max-h-[420px] overflow-y-auto" : "h-[156px]"}`}
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
            <Star size={15} />
            {primaryComplete ? "Primary debrief" : "Scenario progress"}
          </div>

          {primaryComplete ? (
            <div className="mt-3 space-y-3">
              <p className="text-xs font-semibold leading-5 text-slate-200">{debrief.summary}</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(debrief.score).map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</div>
                    <div className="mt-1 text-lg font-black text-teal-200">{value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-xs leading-4 text-slate-300">
                <div>
                  <div className="font-black uppercase tracking-wider text-teal-300">Good calls</div>
                  <p className="mt-1">{debrief.correct[0] ?? "Keep assessing to unlock debrief notes."}</p>
                </div>
                {debrief.unsafe.length ? (
                  <div>
                    <div className="font-black uppercase tracking-wider text-rose-300">Unsafe action</div>
                    <p className="mt-1">{debrief.unsafe[0]}</p>
                  </div>
                ) : null}
                {debrief.missed.length ? (
                  <div>
                    <div className="font-black uppercase tracking-wider text-amber-300">Review</div>
                    <p className="mt-1">{debrief.missed[0]}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }, (_, index) => {
                    const filled = scenarioProgressPercent >= (index + 1) * 20;
                    return (
                      <Star
                        key={index}
                        size={28}
                        className={filled ? "fill-amber-300 text-amber-300" : "text-teal-500/50"}
                      />
                    );
                  })}
                </div>
                <div className="text-3xl font-black text-teal-300">{scenarioProgressPercent}%</div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all duration-300"
                  style={{ width: `${scenarioProgressPercent}%` }}
                />
              </div>
              <div className="mt-3 text-xs font-semibold text-slate-300">
                {scenarioCompletedCount} of {scenarioTasks.length} scenario objectives complete
              </div>
            </>
          )}
        </section>

        {/*
          Mobile EMT Scene Lab HUD temporarily hidden with the desktop panel.

          {labOpen && !isDesktopLayout ? (
            <aside
              data-testid="mobile-scene-lab"
              className="absolute inset-x-3 bottom-3 z-40 flex max-h-[58vh] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 text-white shadow-2xl backdrop-blur-xl lg:hidden"
            >
              {controls}
            </aside>
          ) : null}
        */}
      </main>
    </AppShell>
  );
}
