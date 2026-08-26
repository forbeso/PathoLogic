import {
  applyPatientIntervention,
  classifyTriageDifference,
  formatCategory,
  getAvailableInterventions,
} from "./engine";
import type {
  PatientRuntimeState,
  SimulationMode,
  SimulationStatus,
  TriageCategory,
  TriageInterventionId,
  TriageScenario,
} from "./types";

export interface TriageSimulationState {
  scenario: TriageScenario;
  status: SimulationStatus;
  mode: SimulationMode;
  selectedPatientId: string | null;
  hoveredPatientId: string | null;
  patients: Record<string, PatientRuntimeState>;
  elapsedSeconds: number;
  remainingSeconds: number;
  lastFeedback: string | null;
  feedbackTone: "correct" | "incorrect" | "warning" | "info" | null;
  feedbackCategory: TriageCategory | null;
  announcement: string;
}

export type TriageSimulationAction =
  | { type: "SET_MODE"; mode: SimulationMode }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "SELECT_PATIENT"; patientId: string | null }
  | { type: "HOVER_PATIENT"; patientId: string | null }
  | {
      type: "APPLY_INTERVENTION";
      patientId: string;
      interventionId: TriageInterventionId;
    }
  | {
      type: "ASSIGN_CATEGORY";
      patientId: string;
      category: TriageCategory;
    }
  | { type: "REASSESS"; patientId: string }
  | { type: "RESTART" }
  | { type: "CLEAR_FEEDBACK" };

function createPatientStates(scenario: TriageScenario) {
  return Object.fromEntries(
    scenario.patients.map((patient) => [
      patient.id,
      {
        findings: { ...patient.initialFindings },
        actionsTaken: [],
        assignedCategory: null,
        locked: false,
      } satisfies PatientRuntimeState,
    ])
  );
}

export function createTriageSimulationState(
  scenario: TriageScenario,
  mode: SimulationMode = "challenge"
): TriageSimulationState {
  return {
    scenario,
    status: "briefing",
    mode,
    selectedPatientId: null,
    hoveredPatientId: null,
    patients: createPatientStates(scenario),
    elapsedSeconds: 0,
    remainingSeconds: scenario.durationSeconds,
    lastFeedback: null,
    feedbackTone: null,
    feedbackCategory: null,
    announcement: "Triage briefing ready.",
  };
}

export function triageSimulationReducer(
  state: TriageSimulationState,
  action: TriageSimulationAction
): TriageSimulationState {
  switch (action.type) {
    case "SET_MODE":
      if (state.status !== "briefing") return state;
      return { ...state, mode: action.mode };
    case "START":
      if (state.status !== "briefing") return state;
      return {
        ...state,
        status: "active",
        announcement: "Triage simulation started. Select a patient.",
      };
    case "PAUSE":
      if (state.status !== "active") return state;
      return {
        ...state,
        status: "paused",
        selectedPatientId: null,
        hoveredPatientId: null,
        announcement: "Simulation paused.",
      };
    case "RESUME":
      if (state.status !== "paused") return state;
      return {
        ...state,
        status: "active",
        announcement: "Simulation resumed.",
      };
    case "TICK": {
      if (state.status !== "active") return state;
      const elapsedSeconds = state.elapsedSeconds + 1;
      if (state.mode === "challenge") {
        const remainingSeconds = Math.max(0, state.remainingSeconds - 1);
        if (remainingSeconds === 0) {
          return {
            ...state,
            status: "timed-out",
            selectedPatientId: null,
            hoveredPatientId: null,
            elapsedSeconds,
            remainingSeconds,
            announcement: "Time expired. The scenario has ended.",
          };
        }
        return { ...state, elapsedSeconds, remainingSeconds };
      }
      return { ...state, elapsedSeconds };
    }
    case "SELECT_PATIENT":
      if (state.status !== "active") return state;
      return {
        ...state,
        selectedPatientId: action.patientId,
        hoveredPatientId: null,
        lastFeedback: null,
        feedbackTone: null,
        feedbackCategory: null,
      };
    case "HOVER_PATIENT":
      if (state.status !== "active") return state;
      return { ...state, hoveredPatientId: action.patientId };
    case "APPLY_INTERVENTION": {
      if (state.status !== "active") return state;
      const patient = state.scenario.patients.find(
        (item) => item.id === action.patientId
      );
      const runtime = state.patients[action.patientId];
      if (!patient || !runtime || runtime.locked) return state;
      if (runtime.actionsTaken.includes(action.interventionId)) return state;

      const intervention = getAvailableInterventions(
        patient,
        state.scenario
      ).find((item) => item.id === action.interventionId);
      if (!intervention) return state;

      const findings = applyPatientIntervention(
        patient,
        runtime.findings,
        action.interventionId
      );
      return {
        ...state,
        patients: {
          ...state.patients,
          [patient.id]: {
            ...runtime,
            findings,
            actionsTaken: [...runtime.actionsTaken, action.interventionId],
          },
        },
        lastFeedback: intervention.resultSummary,
        feedbackTone: intervention.isCorrect ? "info" : "warning",
        feedbackCategory: null,
        announcement: `${intervention.label} applied to ${patient.displayName}. ${intervention.resultSummary}`,
      };
    }
    case "ASSIGN_CATEGORY": {
      if (state.status !== "active") return state;
      const patient = state.scenario.patients.find(
        (item) => item.id === action.patientId
      );
      const runtime = state.patients[action.patientId];
      if (!patient || !runtime || runtime.locked) return state;

      const difference = classifyTriageDifference(
        action.category,
        patient.correctCategory
      );
      const missedRapidIntervention = patient.requiredInterventionGroups.some(
        (group) => !group.some((id) => runtime.actionsTaken.includes(id))
      );
      const assignedLabel = formatCategory(action.category);
      const tagFeedback =
        difference === "correct"
          ? missedRapidIntervention
            ? `${assignedLabel} is the right tag, but complete the rapid lifesaving intervention before moving on.`
            : `${assignedLabel} is correct.`
          : `${assignedLabel} is not the best tag. Try again using ${formatCategory(patient.correctCategory)}.`;
      const assignmentComplete =
        difference === "correct" && !missedRapidIntervention;
      const patients = {
        ...state.patients,
        [patient.id]: {
          ...runtime,
          assignedCategory: action.category,
          locked: assignmentComplete,
        },
      };
      const completed = Object.values(patients).every(
        (item) => item.locked
      );

      return {
        ...state,
        patients,
        status: completed ? "completed" : state.status,
        selectedPatientId: assignmentComplete ? null : patient.id,
        hoveredPatientId: null,
        lastFeedback: tagFeedback,
        feedbackTone:
          difference !== "correct"
            ? "incorrect"
            : missedRapidIntervention
              ? "warning"
              : "correct",
        feedbackCategory: patient.correctCategory,
        announcement: assignmentComplete
          ? `${patient.displayName} tagged ${assignedLabel}. ${
              completed ? "All patients have been triaged." : "Select the next patient."
            }`
          : difference !== "correct"
            ? `${assignedLabel} is not the best tag for ${patient.displayName}. Choose another tag.`
            : `${assignedLabel} is the right tag, but the required rapid intervention is still needed.`,
      };
    }
    case "REASSESS": {
      if (state.status !== "active") return state;
      const runtime = state.patients[action.patientId];
      if (!runtime?.locked) return state;
      return {
        ...state,
        patients: {
          ...state.patients,
          [action.patientId]: {
            ...runtime,
            assignedCategory: null,
            locked: false,
          },
        },
        selectedPatientId: action.patientId,
        lastFeedback: "Reassessment opened. Assign a new tag when ready.",
        feedbackTone: "info",
        feedbackCategory: null,
        announcement: "Patient reassessment opened.",
      };
    }
    case "RESTART":
      return createTriageSimulationState(state.scenario, state.mode);
    case "CLEAR_FEEDBACK":
      return {
        ...state,
        lastFeedback: null,
        feedbackTone: null,
        feedbackCategory: null,
      };
    default:
      return state;
  }
}
