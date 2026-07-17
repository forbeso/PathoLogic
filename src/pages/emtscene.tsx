import Header from "@/components/Header";
import Head from "next/head";
import ThreeDScene from "@/components/ThreeDScene";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppShell, StatusPill } from "@/components/AppShell";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Lightbulb,
  LogOut,
  MousePointerClick,
  PanelRightClose,
  PanelRightOpen,
  RefreshCcw,
  ShieldCheck,
  Siren,
  Star,
  Stethoscope,
  Timer,
} from "lucide-react";
import {
  anaphylaxisFestivalScenario,
  createScenarioState,
  getActionSuccessEvents,
  getCurrentObjective,
  getObjectAvailability,
  getVisibleInteractiveObjects,
  hasEvents,
  isInteractiveObjectComplete,
  scenarioReducer,
  type InteractiveObjectConfig,
} from "@/lib/emtSceneEngine";

type StageKey = "primary" | "secondary" | "impression" | "interventions" | "transport" | "reassessment";

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
    title: "Allergic Reaction at a Festival",
    domain: "Medical / Respiratory",
    dispatch: "Teenager short of breath after eating dessert containing nuts.",
    scene:
      "Outdoor festival first-aid tent. Bystanders report sudden hives and breathing trouble after dessert.",
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
  {
    id: "spine",
    title: "Fall With Neurologic Symptoms",
    domain: "Trauma / Spine",
    dispatch: "Adult fell from a porch and reports shoulder pain.",
    scene:
      "Residential porch. Patient is seated on the ground, intoxicated, with family nearby.",
    patient:
      "58-year-old with shoulder pain, denies neck pain, reports tingling in fingers.",
    priority: "Potentially unstable",
    vitals: {
      loc: "Alert, intoxicated",
      airway: "Patent",
      breathing: "RR 18, nonlabored",
      pulse: "Radial 96",
      bp: "138/84",
      spo2: "97%",
      skin: "Warm, dry",
    },
    cues: ["Fall mechanism", "Intoxication", "Distracting injury", "Finger tingling"],
    fieldImpression: "Possible spinal injury requiring motion restriction and neurologic reassessment.",
  },
  {
    id: "chest-pain",
    title: "Sudden Pleuritic Chest Pain",
    domain: "Medical / Respiratory",
    dispatch: "Tall, thin adult with sudden sharp chest pain and mild shortness of breath.",
    scene:
      "Quiet sidewalk. Patient stopped walking abruptly and is guarding the right side of the chest.",
    patient:
      "22-year-old speaking full sentences, decreased breath sounds on the right, pink and warm.",
    priority: "Potentially unstable",
    vitals: {
      loc: "Alert",
      airway: "Patent",
      breathing: "RR 24, pleuritic pain",
      pulse: "Radial 108",
      bp: "124/76",
      spo2: "93%",
      skin: "Pink, warm, dry",
    },
    cues: ["Sudden onset", "Sharp pleuritic pain", "Decreased right breath sounds", "Tall thin habitus"],
    fieldImpression: "Spontaneous pneumothorax; monitor closely for deterioration.",
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

function getMonitorVitals(vitals: VitalSet, scenarioId: string) {
  return [
    { label: "HR", value: firstNumber(vitals.pulse), unit: "bpm", tone: "text-rose-400" },
    { label: "BP", value: vitals.bp, unit: "mmHg", tone: "text-amber-300" },
    { label: "SpO2", value: vitals.spo2, unit: "", tone: "text-rose-400" },
    { label: "RR", value: firstNumber(vitals.breathing), unit: "/min", tone: "text-amber-300" },
    { label: "AVPU", value: avpuFromLoc(vitals.loc), unit: "", tone: "text-teal-300" },
    { label: "TEMP", value: scenarioId === "anaphylaxis" ? "98.2°F" : "98.6°F", unit: "", tone: "text-slate-100" },
  ];
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
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const [sceneHeight, setSceneHeight] = useState(655);
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
      setSceneHeight(Math.max(window.innerHeight - headerHeight, 520));
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
  const phaseObjectives = sceneScenario.objectives.filter((objective) => objective.phase === gameState.currentPhase);
  const activeStage = STAGES.find((item) => item.key === stage) ?? STAGES[0];
  const completedCount = phaseObjectives.filter((objective) => gameState.completedObjectives.includes(objective.id)).length;
  const totalTasks = phaseObjectives.length || activeStage.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const scenarioTasks = sceneScenario.objectives;
  const scenarioCompletedCount = gameState.completedObjectives.length;
  const scenarioProgressPercent = Math.round((scenarioCompletedCount / scenarioTasks.length) * 100);
  const stageIndex = STAGES.findIndex((item) => item.key === stage);
  const relevantActions = QUICK_ACTIONS.filter((action) => action.stage === stage);
  const monitorVitals = useMemo(() => getMonitorVitals(vitals, scenario.id), [scenario.id, vitals]);
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
  const selectedObject = sceneObjects.find((object) => object.id === gameState.selectedObjectId);
  const actionableSceneObjects = sceneObjects.filter(
    (object) => !object.completed || object.id === gameState.selectedObjectId
  );
  const nextSceneObject = actionableSceneObjects.find((object) => object.enabled !== false);
  const selectedActions = selectedObject
    ? selectedObject.actions.filter(
      (action) => !hasEvents(gameState, getActionSuccessEvents(action)) && hasEvents(gameState, action.requires)
    )
    : [];

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
      <Head>
        <title>PathoLogix - EMT Scene Lab</title>
      </Head>
      <Header />

      <main className="relative isolate min-h-0 overflow-hidden bg-slate-950" style={{ height: sceneHeight }}>
        <div className="absolute inset-0">
          <ThreeDScene
            height={sceneHeight}
            scenarioId={scenario.id}
            sceneFinding={sceneFinding}
            sceneSpeaker={latestSceneMessage?.who === "patient" ? "patient" : "coach"}
            interactiveObjects={actionableSceneObjects}
            selectedObjectId={gameState.selectedObjectId}
            focusedObjectId={gameState.focusedObjectId}
            accessibilityMode={gameState.accessibilityMode}
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
          className="absolute right-3 top-3 z-[60] inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/82 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition hover:border-teal-300/60 hover:bg-teal-400/10 lg:hidden"
          aria-expanded={mobileHudOpen}
          aria-controls="mobile-hud-panel"
        >
          {mobileHudOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          {mobileHudOpen ? "Close HUD" : "Show HUD"}
        </button>

        {!mobileHudOpen && !selectedObject && nextSceneObject ? (
          <button
            type="button"
            data-testid="mobile-next-scene-object"
            onClick={() => dispatchGame({ type: "SELECT_OBJECT", objectId: nextSceneObject.id })}
            className="absolute inset-x-3 bottom-[112px] z-40 rounded-2xl border border-teal-200/45 bg-slate-950/82 p-3 text-left text-white shadow-2xl shadow-slate-950/45 backdrop-blur-xl transition active:scale-[0.99] lg:hidden"
          >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
              <MousePointerClick size={13} />
              Start here
            </div>
            <div className="mt-1 text-base font-black leading-5">Tap {nextSceneObject.name}</div>
            <div className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-slate-300">
              {currentObjective.subtleGoal}
            </div>
          </button>
        ) : null}

        {mobileHudOpen ? (
          <section
            id="mobile-hud-panel"
            data-testid="mobile-hud-panel"
            className="absolute inset-x-3 top-[58px] z-50 max-h-[calc(100%-74px)] overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/88 p-3 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                  <Siren size={13} />
                  Active dispatch
                </div>
                <h2 className="mt-1 text-base font-black leading-5">{scenario.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-300">{sceneScenario.dispatch}</p>
              </div>
              <StatusPill tone={scenario.priority === "Unstable" ? "rose" : "amber"}>
                {scenario.priority}
              </StatusPill>
            </div>

            <div className="mt-3">
              <select
                value={scenario.id}
                onChange={(event) => selectScenario(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-400"
                aria-label="Select scenario"
              >
                {SCENARIOS.map((item) => (
                  <option key={item.id} value={item.id} className="bg-slate-900">
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <ShieldCheck size={13} />
                Scene report
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-200">{sceneScenario.sceneReport}</p>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
                  <MousePointerClick size={13} />
                  Current goal
                </div>
                <button
                  type="button"
                  onClick={() => dispatchGame({ type: "TOGGLE_ACCESSIBILITY" })}
                  className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider transition ${gameState.accessibilityMode
                    ? "border-teal-200 bg-teal-300 text-slate-950"
                    : "border-white/15 bg-white/10 text-slate-200 hover:border-teal-200/60"
                    }`}
                >
                  Mark objects
                </button>
              </div>
              <h2 className="mt-2 text-lg font-black leading-6 text-white">{currentObjective.subtleGoal}</h2>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {actionableSceneObjects.map((object) => (
                  <button
                    key={object.id}
                    type="button"
                    data-testid={`mobile-scene-object-${object.id}`}
                    onClick={() => {
                      dispatchGame({ type: "SELECT_OBJECT", objectId: object.id });
                      setMobileHudOpen(false);
                    }}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${object.id === gameState.selectedObjectId
                      ? "border-teal-200 bg-teal-300 text-slate-950"
                      : object.enabled === false
                        ? "border-white/10 bg-white/5 text-slate-400"
                        : "border-white/15 bg-white/10 text-white hover:border-teal-200/70"
                      }`}
                  >
                    {object.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => dispatchGame({ type: "USE_HINT" })}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:border-amber-200/70 hover:bg-amber-300/15"
                >
                  <Lightbulb size={14} />
                  Hint
                </button>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-200">
                  Score {gameState.score} · {Math.floor(gameState.elapsedTime / 60)}:{String(gameState.elapsedTime % 60).padStart(2, "0")}
                </div>
              </div>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                  <HeartPulse size={14} />
                  Patient vitals
                </div>
                <div className="text-[11px] font-medium text-slate-400">Live monitor</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {monitorVitals.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                    <div className={`mt-1 whitespace-nowrap text-xl font-black leading-none ${item.tone}`} title={item.value}>
                      {item.value}
                    </div>
                    {item.unit ? <div className="mt-1 text-[11px] font-semibold text-slate-300">{item.unit}</div> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="grid grid-cols-5 gap-1.5">
                {PHASE_DOCK_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const itemIndex = STAGES.findIndex((stageItem) => stageItem.key === item.key);
                  const isActive = item.key === stage;
                  const isPast = itemIndex >= 0 && itemIndex < stageIndex;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setStage(item.key)}
                      className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl border px-0.5 py-2 text-center transition ${isActive
                        ? "border-teal-300 bg-teal-400/15 text-teal-200 shadow-[0_0_28px_rgba(45,212,191,0.18)]"
                        : isPast
                          ? "border-teal-400/25 bg-teal-400/10 text-teal-100"
                          : "border-white/15 bg-white/5 text-slate-200 hover:border-teal-300/50 hover:bg-white/10"
                        }`}
                      aria-pressed={isActive}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg border transition ${isActive
                          ? "border-teal-300 bg-teal-400/10 text-teal-200"
                          : "border-white/15 bg-white/5 text-slate-100 group-hover:border-teal-300/50"
                          }`}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                      </span>
                      <span className={`max-w-full whitespace-nowrap text-[8px] font-bold leading-none ${isActive ? "text-teal-300" : "text-slate-200"}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                  <Star size={14} />
                  Scenario progress
                </div>
                <div className="text-2xl font-black text-teal-300">{scenarioProgressPercent}%</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all duration-300"
                  style={{ width: `${scenarioProgressPercent}%` }}
                />
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-300">
                {scenarioCompletedCount} of {scenarioTasks.length} scenario objectives complete
              </div>
            </div>
          </section>
        ) : null}

        <section
          data-testid="scene-objective-prompt"
          className="absolute left-4 top-[330px] z-30 hidden max-h-[172px] w-[min(390px,calc(100%-32px))] overflow-hidden rounded-2xl border border-teal-200/35 bg-slate-950/45 p-3.5 text-white shadow-2xl shadow-slate-950/35 backdrop-blur-md [@media(max-height:760px)]:max-h-[190px] 2xl:max-h-[calc(100%-430px)] lg:block"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-200">
              <MousePointerClick size={14} />
              Current goal
            </div>
            <button
              type="button"
              onClick={() => dispatchGame({ type: "TOGGLE_ACCESSIBILITY" })}
              className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider transition ${gameState.accessibilityMode
                ? "border-teal-200 bg-teal-300 text-slate-950"
                : "border-white/15 bg-white/10 text-slate-200 hover:border-teal-200/60"
                }`}
            >
              Mark objects
            </button>
          </div>
          <h2 className="mt-2 text-lg font-black leading-6 text-white xl:text-xl">{currentObjective.subtleGoal}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => dispatchGame({ type: "USE_HINT" })}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:border-amber-200/70 hover:bg-amber-300/15"
            >
              <Lightbulb size={14} />
              Hint
            </button>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-200">
              Score {gameState.score} · {Math.floor(gameState.elapsedTime / 60)}:{String(gameState.elapsedTime % 60).padStart(2, "0")}
            </div>
          </div>
          {gameState.failedObjectives.includes("dog-hazard") ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200/25 bg-rose-500/10 px-3 py-2 text-xs font-bold leading-5 text-rose-50">
              <AlertTriangle className="mt-0.5 shrink-0" size={14} />
              Unsafe approach consequence: the dog lunged closer, forced you back, and cost scene time.
            </div>
          ) : null}
        </section>

        {selectedObject ? (
          <section
            data-testid="scene-decision-prompt"
            className="absolute bottom-28 left-4 right-4 z-50 rounded-2xl border border-white/15 bg-slate-950/82 p-3.5 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl lg:bottom-[156px] xl:left-[424px] xl:right-[416px]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200">
                  Selected object
                </div>
                <h2 className="mt-1 text-lg font-black leading-6 text-white">{selectedObject.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => dispatchGame({ type: "SELECT_OBJECT", objectId: undefined })}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20"
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
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {selectedActions.length === 0 ? (
                <div className="rounded-xl border border-teal-200/25 bg-teal-400/10 px-3 py-3 text-sm font-bold text-teal-50">
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
                    className="flex min-h-[58px] items-start justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-left text-xs font-black text-white shadow-lg shadow-black/10 transition hover:border-teal-200/80 hover:bg-teal-300/15 disabled:cursor-not-allowed disabled:opacity-45 xl:text-sm"
                  >
                    <span>
                      {action.label}
                      {action.description ? (
                        <span className="mt-1 block text-[11px] font-semibold leading-4 text-slate-300">{action.description}</span>
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
              <ShieldCheck size={13} />
              Scene report
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-200">{sceneScenario.sceneReport}</p>
          </div>
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

          <div
            data-testid="patient-vitals-panel"
            className="w-[388px] shrink-0 rounded-2xl border border-white/15 bg-slate-950/80 p-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl 2xl:w-[640px] 2xl:p-4"
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

          <div
            data-testid="phase-dock"
            className="w-[300px] shrink-0 rounded-2xl border border-white/15 bg-slate-950/80 p-2 shadow-2xl shadow-slate-950/40 backdrop-blur-xl 2xl:w-[390px] 2xl:p-3"
          >
            <div className="grid grid-cols-5 gap-1.5 2xl:gap-2">
              {PHASE_DOCK_ITEMS.map((item) => {
                const Icon = item.icon;
                const itemIndex = STAGES.findIndex((stageItem) => stageItem.key === item.key);
                const isActive = item.key === stage;
                const isPast = itemIndex >= 0 && itemIndex < stageIndex;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStage(item.key)}
                    className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl border px-0.5 py-2 text-center transition 2xl:gap-2 2xl:px-1.5 2xl:py-2.5 ${isActive
                      ? "border-teal-300 bg-teal-400/15 text-teal-200 shadow-[0_0_28px_rgba(45,212,191,0.18)]"
                      : isPast
                        ? "border-teal-400/25 bg-teal-400/10 text-teal-100"
                        : "border-white/15 bg-white/5 text-slate-200 hover:border-teal-300/50 hover:bg-white/10"
                      }`}
                    aria-pressed={isActive}
                  >
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-lg border transition 2xl:h-10 2xl:w-10 2xl:rounded-xl ${isActive
                        ? "border-teal-300 bg-teal-400/10 text-teal-200"
                        : "border-white/15 bg-white/5 text-slate-100 group-hover:border-teal-300/50"
                        }`}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <span className={`max-w-full whitespace-nowrap text-[8px] font-bold leading-none 2xl:text-xs ${isActive ? "text-teal-300" : "text-slate-200"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
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
          className="absolute bottom-4 right-4 z-40 hidden h-[156px] w-[380px] rounded-2xl border border-white/15 bg-slate-950/80 p-4 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl lg:block"
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
            <Star size={15} />
            Scenario progress
          </div>
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
