export type TriageProtocol = "SALT_MUCC" | "START" | "JUMPSTART";

export type TriageCategory =
  | "immediate"
  | "delayed"
  | "minimal"
  | "expectant"
  | "dead";

export type HemorrhageState = "none" | "controlled" | "uncontrolled";

export type PatientPosition =
  | "walking"
  | "standing"
  | "seated"
  | "kneeling"
  | "supine"
  | "prone"
  | "trapped";

export type AgeGroup = "adult" | "pediatric" | "older-adult";

export type SimulationMode = "learn" | "challenge";

export type SimulationStatus =
  | "briefing"
  | "active"
  | "paused"
  | "completed"
  | "timed-out";

export type TriageInterventionId =
  | "open-airway"
  | "direct-pressure"
  | "tourniquet"
  | "recovery-position"
  | "pediatric-rescue-breaths";

export interface TriageFindingState {
  breathing: boolean;
  followsCommands: boolean;
  purposefulMovement: boolean;
  peripheralPulse: boolean | null;
  respiratoryDistress: boolean;
  hemorrhage: HemorrhageState;
  injuriesAreMinor: boolean;
  likelyToSurviveWithCurrentResources: boolean;
  apneaInterventionComplete: boolean;
}

export interface TriageIntervention {
  id: TriageInterventionId;
  label: string;
  description: string;
  resourceId?: string;
  withinEmtScope: boolean;
  isRapid: boolean;
  requiresStayingWithPatient: boolean;
  isCorrect: boolean;
  isHarmfulOrUnnecessary?: boolean;
  resultSummary: string;
}

export interface PatientStateTransition {
  interventionId: TriageInterventionId;
  findings: Partial<TriageFindingState>;
}

export interface TriagePatient {
  id: string;
  displayName: string;
  ageGroup: AgeGroup;
  position: PatientPosition;
  visualPosition: [number, number, number];
  visualRotation?: [number, number, number];
  observableSummary: string[];
  patientStatement?: string;
  visibleInjury: string;
  initialFindings: TriageFindingState;
  availableInterventions: TriageIntervention[];
  requiredInterventionGroups: TriageInterventionId[][];
  stateTransitions: PatientStateTransition[];
  correctCategory: TriageCategory;
  explanation: string;
  decisionPath: string[];
  assessmentPriority: 1 | 2 | 3;
}

export interface ScenarioResource {
  id: string;
  label: string;
  available: boolean;
}

export interface TriageScenario {
  id: string;
  title: string;
  description: string;
  protocol: TriageProtocol;
  durationSeconds: number;
  availableResources: ScenarioResource[];
  patients: TriagePatient[];
}

export interface PatientRuntimeState {
  findings: TriageFindingState;
  actionsTaken: TriageInterventionId[];
  assignedCategory: TriageCategory | null;
  locked: boolean;
}

export type TriageDifference = "correct" | "over-triage" | "under-triage";

export interface PatientDebrief {
  patient: TriagePatient;
  assignedCategory: TriageCategory | null;
  correctCategory: TriageCategory;
  difference: TriageDifference | "untagged";
  actionsTaken: TriageInterventionId[];
  correctInterventions: TriageInterventionId[];
  missedInterventions: TriageInterventionId[];
  score: number;
}

export interface TriageDebrief {
  score: number;
  accuracy: number;
  correctClassifications: number;
  correctInterventions: number;
  missedInterventions: number;
  overTriage: number;
  underTriage: number;
  untagged: number;
  completionSeconds: number;
  patients: PatientDebrief[];
}
