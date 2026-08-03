import type {
  PatientDebrief,
  PatientRuntimeState,
  TriageCategory,
  TriageDebrief,
  TriageDifference,
  TriageFindingState,
  TriageIntervention,
  TriageInterventionId,
  TriagePatient,
  TriageScenario,
} from "./types";

export const TRIAGE_CATEGORY_META: Record<
  TriageCategory,
  {
    name: string;
    shortLabel: string;
    colorName: string;
    color: string;
    icon: string;
    description: string;
  }
> = {
  immediate: {
    name: "Immediate",
    shortLabel: "RED",
    colorName: "Red",
    color: "#dc2626",
    icon: "!",
    description: "Immediate lifesaving care or transport priority.",
  },
  delayed: {
    name: "Delayed",
    shortLabel: "YELLOW",
    colorName: "Yellow",
    color: "#eab308",
    icon: "II",
    description: "Serious injury without an immediate life threat.",
  },
  minimal: {
    name: "Minimal",
    shortLabel: "GREEN",
    colorName: "Green",
    color: "#16a34a",
    icon: "III",
    description: "Minor injuries; ambulatory care can be delayed.",
  },
  expectant: {
    name: "Expectant",
    shortLabel: "GRAY",
    colorName: "Gray",
    color: "#64748b",
    icon: "E",
    description: "Alive, but unlikely to survive with current MCI resources.",
  },
  dead: {
    name: "Dead",
    shortLabel: "BLACK",
    colorName: "Black",
    color: "#111827",
    icon: "D",
    description: "Not breathing after the protocol-appropriate airway attempt.",
  },
};

export function evaluateSaltMuccCategory(
  findings: TriageFindingState
): TriageCategory {
  if (!findings.breathing && findings.apneaInterventionComplete) {
    return "dead";
  }

  const hasImmediateFinding =
    !findings.breathing ||
    (!findings.followsCommands && !findings.purposefulMovement) ||
    findings.peripheralPulse === false ||
    findings.respiratoryDistress ||
    findings.hemorrhage === "uncontrolled";

  if (hasImmediateFinding) {
    return findings.likelyToSurviveWithCurrentResources
      ? "immediate"
      : "expectant";
  }

  return findings.injuriesAreMinor ? "minimal" : "delayed";
}

export function applyPatientIntervention(
  patient: TriagePatient,
  findings: TriageFindingState,
  interventionId: TriageInterventionId
) {
  const transition = patient.stateTransitions.find(
    (item) => item.interventionId === interventionId
  );
  return transition ? { ...findings, ...transition.findings } : findings;
}

export function getAvailableInterventions(
  patient: TriagePatient,
  scenario: TriageScenario
): TriageIntervention[] {
  const resources = new Map(
    scenario.availableResources.map((resource) => [
      resource.id,
      resource.available,
    ])
  );
  return patient.availableInterventions.filter(
    (intervention) =>
      intervention.withinEmtScope &&
      intervention.isRapid &&
      !intervention.requiresStayingWithPatient &&
      (!intervention.resourceId || resources.get(intervention.resourceId) === true)
  );
}

export function getCorrectInterventionIds(patient: TriagePatient) {
  return Array.from(new Set(patient.requiredInterventionGroups.flat()));
}

const RESOURCE_PRIORITY: Record<TriageCategory, number> = {
  dead: 0,
  expectant: 1,
  minimal: 2,
  delayed: 3,
  immediate: 4,
};

export function classifyTriageDifference(
  assigned: TriageCategory,
  correct: TriageCategory
): TriageDifference {
  if (assigned === correct) return "correct";
  return RESOURCE_PRIORITY[assigned] > RESOURCE_PRIORITY[correct]
    ? "over-triage"
    : "under-triage";
}

export function scorePatient(
  patient: TriagePatient,
  runtime: PatientRuntimeState
): PatientDebrief {
  const correctInterventions = getCorrectInterventionIds(patient);
  const completedInterventionGroups = patient.requiredInterventionGroups.filter(
    (group) => group.some((id) => runtime.actionsTaken.includes(id))
  );
  const missedInterventions = patient.requiredInterventionGroups
    .filter((group) => !group.some((id) => runtime.actionsTaken.includes(id)))
    .map((group) => group[0]);
  const correctActionCount = completedInterventionGroups.length;
  const harmfulActions = runtime.actionsTaken.filter((id) =>
    patient.availableInterventions.some(
      (intervention) =>
        intervention.id === id && intervention.isHarmfulOrUnnecessary
    )
  );

  if (!runtime.assignedCategory) {
    return {
      patient,
      assignedCategory: null,
      correctCategory: patient.correctCategory,
      difference: "untagged",
      actionsTaken: runtime.actionsTaken,
      correctInterventions,
      missedInterventions,
      score:
        -75 +
        correctActionCount * 40 -
        missedInterventions.length * 50 -
        harmfulActions.length * 35,
    };
  }

  const difference = classifyTriageDifference(
    runtime.assignedCategory,
    patient.correctCategory
  );
  const classificationScore =
    difference === "correct" ? 100 : difference === "under-triage" ? -80 : -60;
  const noInterventionBonus =
    correctInterventions.length === 0 && runtime.actionsTaken.length === 0 ? 15 : 0;

  return {
    patient,
    assignedCategory: runtime.assignedCategory,
    correctCategory: patient.correctCategory,
    difference,
    actionsTaken: runtime.actionsTaken,
    correctInterventions,
    missedInterventions,
    score:
      classificationScore +
      correctActionCount * 40 +
      noInterventionBonus -
      missedInterventions.length * 50 -
      harmfulActions.length * 35,
  };
}

export function buildTriageDebrief(
  scenario: TriageScenario,
  patients: Record<string, PatientRuntimeState>,
  completionSeconds: number
): TriageDebrief {
  const patientResults = scenario.patients.map((patient) =>
    scorePatient(patient, patients[patient.id])
  );
  const completedAll = patientResults.every(
    (result) => result.assignedCategory !== null
  );
  const timeRemaining = Math.max(0, scenario.durationSeconds - completionSeconds);
  const timeBonus = completedAll
    ? Math.min(80, Math.round((timeRemaining / scenario.durationSeconds) * 80))
    : 0;
  const correctClassifications = patientResults.filter(
    (result) => result.difference === "correct"
  ).length;

  return {
    score:
      patientResults.reduce((total, result) => total + result.score, 0) +
      timeBonus,
    accuracy: Math.round(
      (correctClassifications / scenario.patients.length) * 100
    ),
    correctClassifications,
    correctInterventions: patientResults.reduce(
      (total, result) =>
        total +
        (result.correctInterventions.length > 0 &&
        result.actionsTaken.some((action) =>
          result.correctInterventions.includes(action)
        )
          ? 1
          : 0),
      0
    ),
    missedInterventions: patientResults.reduce(
      (total, result) => total + result.missedInterventions.length,
      0
    ),
    overTriage: patientResults.filter(
      (result) => result.difference === "over-triage"
    ).length,
    underTriage: patientResults.filter(
      (result) => result.difference === "under-triage"
    ).length,
    untagged: patientResults.filter(
      (result) => result.difference === "untagged"
    ).length,
    completionSeconds,
    patients: patientResults,
  };
}

export function formatCategory(category: TriageCategory) {
  const meta = TRIAGE_CATEGORY_META[category];
  return `${meta.name} / ${meta.colorName}`;
}
