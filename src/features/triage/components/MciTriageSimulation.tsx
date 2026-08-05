import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Clock3, LoaderCircle, MousePointer2, Pause, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { buildTriageDebrief, scorePatient, TRIAGE_CATEGORY_META } from "../engine";
import { highwayCollisionScenario } from "../scenario";
import {
  createTriageSimulationState,
  triageSimulationReducer,
} from "../state";
import type {
  SimulationMode,
  TriageCategory,
  TriageInterventionId,
} from "../types";
import { PatientAssessmentPanel } from "./PatientAssessmentPanel";
import { TriageBriefing } from "./TriageBriefing";
import { TriageDebrief } from "./TriageDebrief";
import { TriageHud } from "./TriageHud";
import { createProgressionRunId, syncLearnerProgress } from "@/lib/progression";
import { saveTriageCompletion } from "@/lib/triageAttemptApi";
import { trackProductEvent } from "@/lib/telemetry";

const TriageScene = dynamic(
  () => import("./TriageScene").then((module) => module.TriageScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-[#7fc4ea]" role="status">
        <div className="rounded-md border border-white/50 bg-[#071820] px-4 py-3 text-sm font-bold text-white shadow-xl">
          <LoaderCircle className="mr-2 inline animate-spin motion-reduce:animate-none" size={17} />
          Preparing incident scene
        </div>
      </div>
    ),
  }
);

const categoryByKey: Record<string, TriageCategory> = {
  "1": "immediate",
  "2": "delayed",
  "3": "minimal",
  "4": "expectant",
  "5": "dead",
};

const BEST_SCORE_KEY = `pathologix:triage:best:${highwayCollisionScenario.id}`;
const MODE_KEY = "pathologix:triage:last-mode";
const COMPLETED_KEY = "pathologix:triage:completed";

type SaveState =
  | { status: "idle" | "saving"; xp: 0 }
  | { status: "saved"; xp: number; awarded: boolean }
  | { status: "signed-out" | "error"; xp: 0 };

function playTagSound() {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(520, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(690, context.currentTime + 0.08);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.13);
  oscillator.addEventListener("ended", () => void context.close());
}

export default function MciTriageSimulation() {
  const [state, dispatch] = useReducer(
    triageSimulationReducer,
    highwayCollisionScenario,
    (scenario) => createTriageSimulationState(scenario, "challenge")
  );
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [runId, setRunId] = useState(() => createProgressionRunId("triage"));
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle", xp: 0 });
  const [startNoticeMode, setStartNoticeMode] = useState<SimulationMode | null>(null);
  const completionSaved = useRef(false);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(MODE_KEY);
    if (storedMode === "learn" || storedMode === "challenge") {
      dispatch({ type: "SET_MODE", mode: storedMode });
    }
    const storedBest = Number(window.localStorage.getItem(BEST_SCORE_KEY) ?? 0);
    if (Number.isFinite(storedBest)) setBestScore(storedBest);
  }, []);

  useEffect(() => {
    if (state.status !== "active") return;
    const timer = window.setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => window.clearInterval(timer);
  }, [state.status]);

  useEffect(() => {
    if (!state.lastFeedback) return;
    const timeout = window.setTimeout(
      () => dispatch({ type: "CLEAR_FEEDBACK" }),
      state.mode === "learn" ? 8000 : 3500
    );
    return () => window.clearTimeout(timeout);
  }, [state.lastFeedback, state.mode]);

  useEffect(() => {
    if (!startNoticeMode) return;
    const timeout = window.setTimeout(() => setStartNoticeMode(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [startNoticeMode]);

  const debrief = useMemo(
    () => buildTriageDebrief(state.scenario, state.patients, state.elapsedSeconds),
    [state.elapsedSeconds, state.patients, state.scenario]
  );

  const persistCompletion = useCallback(async () => {
    if (state.status !== "completed" && state.status !== "timed-out") return;
    setSaveState({ status: "saving", xp: 0 });

    try {
      const result = await saveTriageCompletion({
        runId,
        scenarioId: state.scenario.id,
        mode: state.mode,
        status: state.status,
        elapsedSeconds: state.elapsedSeconds,
        patients: state.patients,
      });
      if (result.status === "signed-out") {
        setSaveState({ status: "signed-out", xp: 0 });
        return;
      }
      setSaveState({
        status: "saved",
        xp: result.xp,
        awarded: result.awarded,
      });
      await syncLearnerProgress();
    } catch {
      setSaveState({ status: "error", xp: 0 });
    }
  }, [runId, state.elapsedSeconds, state.mode, state.patients, state.scenario.id, state.status]);

  useEffect(() => {
    if (state.status !== "completed" && state.status !== "timed-out") {
      completionSaved.current = false;
      return;
    }
    if (completionSaved.current) return;
    completionSaved.current = true;
    const nextBest = Math.max(bestScore, debrief.score);
    window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
    window.localStorage.setItem(
      COMPLETED_KEY,
      String(Number(window.localStorage.getItem(COMPLETED_KEY) ?? 0) + 1)
    );
    setBestScore(nextBest);
    trackProductEvent("triage_completed", {
      scenarioId: state.scenario.id,
      mode: state.mode,
      outcome: state.status,
      score: debrief.score,
      accuracy: debrief.accuracy,
      elapsedSeconds: state.elapsedSeconds,
    });
    void persistCompletion();
  }, [bestScore, debrief.accuracy, debrief.score, persistCompletion, state.elapsedSeconds, state.mode, state.scenario.id, state.status]);

  const selectedPatient = state.scenario.patients.find(
    (patient) => patient.id === state.selectedPatientId
  );
  const hoveredPatient = state.scenario.patients.find(
    (patient) => patient.id === state.hoveredPatientId
  );
  const selectedRuntime = selectedPatient
    ? state.patients[selectedPatient.id]
    : null;
  const triagedCount = Object.values(state.patients).filter(
    (runtime) => runtime.assignedCategory !== null
  ).length;
  const correctTagged = state.scenario.patients.filter((patient) => {
    const runtime = state.patients[patient.id];
    return runtime.assignedCategory === patient.correctCategory;
  }).length;
  const liveAccuracy = triagedCount
    ? Math.round((correctTagged / triagedCount) * 100)
    : 0;
  const liveScore = state.scenario.patients.reduce((total, patient) => {
    const runtime = state.patients[patient.id];
    return runtime.assignedCategory ? total + scorePatient(patient, runtime).score : total;
  }, 0);

  const selectPatient = useCallback((patientId: string) => {
    dispatch({ type: "SELECT_PATIENT", patientId });
  }, []);
  const hoverPatient = useCallback((patientId: string | null) => {
    dispatch({ type: "HOVER_PATIENT", patientId });
  }, []);

  const assignCategory = useCallback(
    (category: TriageCategory) => {
      if (!state.selectedPatientId) return;
      dispatch({
        type: "ASSIGN_CATEGORY",
        patientId: state.selectedPatientId,
        category,
      });
      if (soundEnabled) playTagSound();
    },
    [soundEnabled, state.selectedPatientId]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (element?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape" && state.selectedPatientId) {
        dispatch({ type: "SELECT_PATIENT", patientId: null });
        return;
      }
      const category = categoryByKey[event.key];
      if (category && state.status === "active" && state.selectedPatientId) {
        event.preventDefault();
        assignCategory(category);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [assignCategory, state.selectedPatientId, state.status]);

  const begin = () => {
    window.localStorage.setItem(MODE_KEY, state.mode);
    setStartNoticeMode(state.mode);
    trackProductEvent("triage_started", {
      scenarioId: state.scenario.id,
      mode: state.mode,
    });
    dispatch({ type: "START" });
  };

  const restart = () => {
    setRestartOpen(false);
    setStartNoticeMode(null);
    setSceneKey((value) => value + 1);
    setRunId(createProgressionRunId("triage"));
    setSaveState({ status: "idle", xp: 0 });
    dispatch({ type: "RESTART" });
  };

  const requestRestart = () => {
    if (state.status === "briefing" || state.status === "completed" || state.status === "timed-out") {
      restart();
      return;
    }
    setRestartOpen(true);
  };

  const showDebrief = state.status === "completed" || state.status === "timed-out";

  return (
    <div className="triage-simulation-shell theme-locked-dark relative h-full min-h-0 overflow-hidden bg-[#31533f] text-white">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{state.announcement}</div>

      <TriageScene
        key={sceneKey}
        patients={state.scenario.patients}
        patientStates={state.patients}
        selectedPatientId={state.selectedPatientId}
        hoveredPatientId={state.hoveredPatientId}
        interactionEnabled={state.status === "active"}
        onSelectPatient={selectPatient}
        onHoverPatient={hoverPatient}
      />

      {state.status !== "briefing" && !showDebrief ? (
        <TriageHud
          title={state.scenario.title}
          status={state.status}
          mode={state.mode}
          elapsedSeconds={state.elapsedSeconds}
          remainingSeconds={state.remainingSeconds}
          triaged={triagedCount}
          total={state.scenario.patients.length}
          score={liveScore}
          accuracy={liveAccuracy}
          soundEnabled={soundEnabled}
          onPause={() => dispatch({ type: "PAUSE" })}
          onResume={() => dispatch({ type: "RESUME" })}
          onRestart={requestRestart}
          onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
        />
      ) : null}

      <AnimatePresence>
        {state.status === "active" && startNoticeMode ? (
          <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center px-4">
            <motion.div
              data-testid="triage-start-notice"
              role="status"
              initial={{ opacity: 1, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-[390px] rounded-lg border border-teal-200/35 bg-[#071820]/95 px-5 py-4 text-center text-white shadow-2xl backdrop-blur-md"
            >
              <Clock3 size={24} className="mx-auto text-amber-300" aria-hidden="true" />
              <div className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-teal-300">
                {startNoticeMode === "challenge" ? "Challenge started" : "Learn mode started"}
              </div>
              <div className="mt-1 text-2xl font-black">
                {startNoticeMode === "challenge" ? "2:00 starts now" : "Take your time"}
              </div>
              <p className="mt-1.5 text-sm leading-5 text-slate-300">
                {startNoticeMode === "challenge"
                  ? `Triage all ${state.scenario.patients.length} patients before time runs out.`
                  : "Assess each patient carefully. Learn Mode has no countdown."}
              </p>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {state.status === "briefing" ? (
        <TriageBriefing
          scenario={state.scenario}
          mode={state.mode}
          onModeChange={(mode: SimulationMode) => dispatch({ type: "SET_MODE", mode })}
          onBegin={begin}
        />
      ) : null}

      {state.status === "active" && selectedPatient && selectedRuntime ? (
        <PatientAssessmentPanel
          scenario={state.scenario}
          patient={selectedPatient}
          runtime={selectedRuntime}
          mode={state.mode}
          onClose={() => dispatch({ type: "SELECT_PATIENT", patientId: null })}
          onIntervention={(interventionId: TriageInterventionId) =>
            dispatch({
              type: "APPLY_INTERVENTION",
              patientId: selectedPatient.id,
              interventionId,
            })
          }
          onAssign={assignCategory}
          onReassess={() => dispatch({ type: "REASSESS", patientId: selectedPatient.id })}
        />
      ) : null}

      {state.status === "active" && hoveredPatient && !selectedPatient ? (
        <div className="pointer-events-none absolute bottom-5 left-5 z-20 hidden max-w-xs rounded-md border border-white/15 bg-[#071820] p-3 shadow-xl lg:block">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-teal-300">{hoveredPatient.displayName}</div>
          <div className="mt-1 text-sm font-bold">{hoveredPatient.observableSummary[0]}</div>
          <div className="mt-1 text-xs text-slate-400">Select to perform a rapid assessment.</div>
        </div>
      ) : null}

      {state.status === "active" && !selectedPatient && !state.lastFeedback ? (
        <div className="triage-scene-hint pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-[#071820] px-4 py-2 text-xs font-bold shadow-xl">
          <MousePointer2 size={15} className="text-teal-300" />
          <span className="hidden sm:inline">Select a patient to begin</span>
          <span className="sm:hidden">Drag to explore · tap a patient</span>
        </div>
      ) : null}

      {state.lastFeedback && state.status === "active" ? (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-[9.5rem] z-30 w-[min(92vw,560px)] -translate-x-1/2 rounded-md border border-teal-300/35 bg-[#071820] px-4 py-3 text-center text-sm leading-5 shadow-2xl lg:top-28"
        >
          {state.lastFeedback}
        </div>
      ) : null}

      {state.status === "paused" ? (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#031016]/70 p-4 backdrop-blur-sm">
          <section className="w-full max-w-sm rounded-lg border border-white/15 bg-[#071820] p-6 text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="triage-paused-title">
            <Pause className="mx-auto text-teal-300" size={28} />
            <h2 id="triage-paused-title" className="mt-3 text-xl font-black">Simulation paused</h2>
            <p className="mt-2 text-sm text-slate-300">The timer and patient interactions are stopped.</p>
            <button type="button" onClick={() => dispatch({ type: "RESUME" })} className="mt-5 min-h-11 w-full rounded-md bg-teal-400 px-4 text-sm font-black text-slate-950 hover:bg-teal-300">Resume triage</button>
          </section>
        </div>
      ) : null}

      {restartOpen ? (
        <div className="absolute inset-0 z-[70] grid place-items-center bg-[#031016]/75 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" aria-labelledby="restart-title" className="w-full max-w-md rounded-lg border border-white/15 bg-[#071820] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="restart-title" className="text-lg font-black">Restart this incident?</h2>
                <p className="mt-2 text-sm leading-5 text-slate-300">Your current tags, interventions, timer, and camera view will reset.</p>
              </div>
              <button type="button" aria-label="Cancel restart" onClick={() => setRestartOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10"><X size={17} /></button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRestartOpen(false)} className="min-h-11 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-bold hover:bg-white/10">Keep working</button>
              <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-rose-500 px-4 text-sm font-black text-white hover:bg-rose-400"><RotateCcw size={16} /> Restart</button>
            </div>
          </section>
        </div>
      ) : null}

      {showDebrief ? (
        <TriageDebrief
          debrief={debrief}
          bestScore={Math.max(bestScore, debrief.score)}
          timedOut={state.status === "timed-out"}
          saveState={saveState}
          onRetrySave={() => void persistCompletion()}
          onRestart={restart}
        />
      ) : null}
    </div>
  );
}
