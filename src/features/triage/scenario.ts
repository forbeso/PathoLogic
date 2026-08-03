import { evaluateSaltMuccCategory } from "./engine";
import type {
  PatientStateTransition,
  TriageFindingState,
  TriageIntervention,
  TriagePatient,
  TriageScenario,
} from "./types";

const stableFindings: TriageFindingState = {
  breathing: true,
  followsCommands: true,
  purposefulMovement: true,
  peripheralPulse: true,
  respiratoryDistress: false,
  hemorrhage: "none",
  injuriesAreMinor: false,
  likelyToSurviveWithCurrentResources: true,
  apneaInterventionComplete: false,
};

function intervention(
  definition: Omit<
    TriageIntervention,
    "withinEmtScope" | "isRapid" | "requiresStayingWithPatient"
  >
): TriageIntervention {
  return {
    ...definition,
    withinEmtScope: true,
    isRapid: true,
    requiresStayingWithPatient: false,
  };
}

function buildPatient(
  patient: Omit<TriagePatient, "correctCategory"> & {
    expectedFinalFindings?: TriageFindingState;
  }
): TriagePatient {
  const { expectedFinalFindings, ...definition } = patient;
  return {
    ...definition,
    correctCategory: evaluateSaltMuccCategory(
      expectedFinalFindings ?? definition.initialFindings
    ),
  };
}

const airwayAction = intervention({
  id: "open-airway",
  label: "Open airway",
  description: "Perform one rapid basic airway-opening maneuver.",
  isCorrect: true,
  resultSummary: "The airway maneuver is complete.",
});

const directPressureAction = intervention({
  id: "direct-pressure",
  label: "Apply direct pressure",
  description: "Use rapid direct pressure to control severe external bleeding.",
  resourceId: "bleeding-control",
  isCorrect: true,
  resultSummary: "Direct pressure controls the external hemorrhage.",
});

const tourniquetAction = intervention({
  id: "tourniquet",
  label: "Apply tourniquet",
  description: "Apply a tourniquet to the life-threatening extremity hemorrhage.",
  resourceId: "tourniquet",
  isCorrect: true,
  resultSummary: "The tourniquet controls the leg hemorrhage.",
});

const unnecessaryRecoveryPosition = intervention({
  id: "recovery-position",
  label: "Place in recovery position",
  description: "Roll the patient into a lateral recovery position.",
  isCorrect: false,
  isHarmfulOrUnnecessary: true,
  resultSummary: "This delays hemorrhage control and was not appropriate here.",
});

function transition(
  interventionId: PatientStateTransition["interventionId"],
  findings: Partial<TriageFindingState>
): PatientStateTransition {
  return { interventionId, findings };
}

export const highwayCollisionScenario: TriageScenario = {
  id: "highway-collision-initial-triage",
  title: "Highway Collision — Initial Triage",
  description:
    "A two-vehicle collision has created eight patients. Additional EMS resources are delayed. You are the first EMT assigned to begin primary MCI triage.",
  protocol: "SALT_MUCC",
  durationSeconds: 240,
  availableResources: [
    { id: "bleeding-control", label: "Bleeding-control supplies", available: true },
    { id: "tourniquet", label: "Commercial tourniquets", available: true },
    { id: "basic-airway", label: "Basic airway equipment", available: true },
  ],
  patients: [
    buildPatient({
      id: "patient-01",
      displayName: "Patient 01",
      ageGroup: "adult",
      position: "walking",
      visualPosition: [-2.1, 0, 3.1],
      visualRotation: [0, 0.35, 0],
      observableSummary: [
        "Walking toward the designated safe area",
        "Follows commands",
        "Normal work of breathing",
        "Small cuts to both hands",
      ],
      patientStatement: "I can walk. My hands are cut, but I am okay.",
      visibleInjury: "Minor hand cuts and abrasions",
      initialFindings: { ...stableFindings, injuriesAreMinor: true },
      availableInterventions: [],
      requiredInterventionGroups: [],
      stateTransitions: [],
      explanation:
        "The patient can walk, follows commands, has a peripheral pulse, has no respiratory distress or major hemorrhage, and has only minor injuries.",
      decisionPath: [
        "Global sort: walking",
        "Major assessment criteria intact",
        "Injuries are minor",
        "Minimal / Green",
      ],
      assessmentPriority: 3,
    }),
    buildPatient({
      id: "patient-02",
      displayName: "Patient 02",
      ageGroup: "adult",
      position: "standing",
      visualPosition: [2.1, 0, 3.1],
      visualRotation: [0, -0.45, 0],
      observableSummary: [
        "Standing and waving for help",
        "Moves purposefully and follows commands",
        "No respiratory distress",
        "Minor shoulder pain without deformity",
      ],
      patientStatement: "My shoulder hurts, but I can move it and walk.",
      visibleInjury: "Minor shoulder strain",
      initialFindings: { ...stableFindings, injuriesAreMinor: true },
      availableInterventions: [],
      requiredInterventionGroups: [],
      stateTransitions: [],
      explanation:
        "Purposeful movement, normal breathing, a present pulse, controlled bleeding, and minor injuries support Minimal triage.",
      decisionPath: [
        "Global sort: purposeful movement",
        "Major assessment criteria intact",
        "Injuries are minor",
        "Minimal / Green",
      ],
      assessmentPriority: 2,
    }),
    buildPatient({
      id: "patient-03",
      displayName: "Patient 03",
      ageGroup: "older-adult",
      position: "seated",
      visualPosition: [-1.65, 0, -2.35],
      visualRotation: [0, 0.1, 0],
      observableSummary: [
        "Sitting upright against the blue vehicle",
        "Alert and follows commands",
        "Peripheral pulse present",
        "Closed lower-leg deformity",
      ],
      patientStatement: "I cannot stand on this leg. I can breathe okay.",
      visibleInjury: "Closed lower-leg fracture",
      initialFindings: { ...stableFindings },
      availableInterventions: [],
      requiredInterventionGroups: [],
      stateTransitions: [],
      explanation:
        "The patient is physiologically stable, but the closed leg fracture is more than a minor injury, making Delayed appropriate.",
      decisionPath: [
        "Major assessment criteria intact",
        "No uncontrolled hemorrhage",
        "Injury is more than minor",
        "Delayed / Yellow",
      ],
      assessmentPriority: 2,
    }),
    buildPatient({
      id: "patient-04",
      displayName: "Patient 04",
      ageGroup: "adult",
      position: "kneeling",
      visualPosition: [1.65, 0, -2.35],
      visualRotation: [0, -0.2, 0],
      observableSummary: [
        "Kneeling beside roadway debris",
        "Alert and follows commands",
        "Normal work of breathing",
        "Deep arm wound with bleeding already controlled",
      ],
      patientStatement: "Someone wrapped my arm. The bleeding has stopped.",
      visibleInjury: "Significant arm wound with controlled bleeding",
      initialFindings: { ...stableFindings, hemorrhage: "controlled" },
      availableInterventions: [],
      requiredInterventionGroups: [],
      stateTransitions: [],
      explanation:
        "All major SALT/MUCC assessment criteria are intact, but the arm injury requires more than minimal care.",
      decisionPath: [
        "Major assessment criteria intact",
        "Life-threatening bleeding is controlled",
        "Injury is more than minor",
        "Delayed / Yellow",
      ],
      assessmentPriority: 2,
    }),
    buildPatient({
      id: "patient-05",
      displayName: "Patient 05",
      ageGroup: "adult",
      position: "supine",
      visualPosition: [-0.5, 0, 2.0],
      visualRotation: [0, 0.7, 0],
      observableSummary: [
        "Supine with weak purposeful movement",
        "Breathing without obvious distress",
        "No palpable peripheral pulse",
        "Severe uncontrolled bleeding from right leg",
      ],
      patientStatement: "Help... my leg.",
      visibleInjury: "Life-threatening right-leg hemorrhage",
      initialFindings: {
        ...stableFindings,
        followsCommands: false,
        purposefulMovement: true,
        peripheralPulse: false,
        hemorrhage: "uncontrolled",
      },
      availableInterventions: [
        directPressureAction,
        tourniquetAction,
        unnecessaryRecoveryPosition,
      ],
      requiredInterventionGroups: [["direct-pressure", "tourniquet"]],
      stateTransitions: [
        transition("direct-pressure", { hemorrhage: "controlled" }),
        transition("tourniquet", { hemorrhage: "controlled" }),
      ],
      expectedFinalFindings: {
        ...stableFindings,
        followsCommands: false,
        purposefulMovement: true,
        peripheralPulse: false,
        hemorrhage: "controlled",
      },
      explanation:
        "Rapid hemorrhage control is required before moving on. Even after bleeding is controlled, the absent peripheral pulse remains an Immediate-level finding.",
      decisionPath: [
        "Life-threatening extremity hemorrhage",
        "Rapid hemorrhage control performed",
        "Peripheral pulse remains absent",
        "Likely to survive with current resources",
        "Immediate / Red",
      ],
      assessmentPriority: 1,
    }),
    buildPatient({
      id: "patient-06",
      displayName: "Patient 06",
      ageGroup: "adult",
      position: "supine",
      visualPosition: [1.0, 0, -0.2],
      visualRotation: [0, -0.55, 0],
      observableSummary: [
        "Motionless and supine",
        "Does not respond to verbal commands",
        "No visible chest rise",
        "No major external hemorrhage",
      ],
      visibleInjury: "Blunt head injury",
      initialFindings: {
        ...stableFindings,
        breathing: false,
        followsCommands: false,
        purposefulMovement: false,
      },
      availableInterventions: [airwayAction],
      requiredInterventionGroups: [["open-airway"]],
      stateTransitions: [
        transition("open-airway", {
          breathing: true,
          respiratoryDistress: true,
          apneaInterventionComplete: true,
        }),
      ],
      expectedFinalFindings: {
        ...stableFindings,
        breathing: true,
        followsCommands: false,
        purposefulMovement: false,
        respiratoryDistress: true,
        apneaInterventionComplete: true,
      },
      explanation:
        "The patient begins breathing after a basic airway maneuver. Respiratory distress and absent purposeful response require Immediate triage.",
      decisionPath: [
        "Initially apneic",
        "Airway-opening maneuver performed",
        "Breathing resumes with distress",
        "Immediate / Red",
      ],
      assessmentPriority: 1,
    }),
    buildPatient({
      id: "patient-07",
      displayName: "Patient 07",
      ageGroup: "older-adult",
      position: "trapped",
      visualPosition: [2.5, 0, -0.8],
      visualRotation: [0, -0.9, 0],
      observableSummary: [
        "Partially trapped beside the overturned vehicle",
        "Alive with severe respiratory compromise",
        "No purposeful movement or command response",
        "No palpable peripheral pulse",
      ],
      patientStatement: "Occasional weak groan; no understandable words.",
      visibleInjury: "Catastrophic multisystem trauma",
      initialFindings: {
        ...stableFindings,
        followsCommands: false,
        purposefulMovement: false,
        peripheralPulse: false,
        respiratoryDistress: true,
        likelyToSurviveWithCurrentResources: false,
      },
      availableInterventions: [],
      requiredInterventionGroups: [],
      stateTransitions: [],
      explanation:
        "This patient is alive, not dead. Immediate-level findings are present, but survival is unlikely with the explicitly limited resources currently available. Reassess and provide treatment or comfort care as resources permit.",
      decisionPath: [
        "Patient is breathing and visibly alive",
        "Multiple Immediate-level findings",
        "Survival unlikely with current MCI resources",
        "Expectant / Gray",
      ],
      assessmentPriority: 1,
    }),
    buildPatient({
      id: "patient-08",
      displayName: "Patient 08",
      ageGroup: "adult",
      position: "prone",
      visualPosition: [5.4, 0, -2.0],
      visualRotation: [0, -0.55, 0],
      observableSummary: [
        "Prone and completely still near the road edge",
        "No response to verbal commands",
        "No visible chest rise",
        "No obvious external hemorrhage",
      ],
      visibleInjury: "Severe blunt trauma",
      initialFindings: {
        ...stableFindings,
        breathing: false,
        followsCommands: false,
        purposefulMovement: false,
      },
      availableInterventions: [airwayAction],
      requiredInterventionGroups: [["open-airway"]],
      stateTransitions: [
        transition("open-airway", {
          breathing: false,
          apneaInterventionComplete: true,
        }),
      ],
      expectedFinalFindings: {
        ...stableFindings,
        breathing: false,
        followsCommands: false,
        purposefulMovement: false,
        apneaInterventionComplete: true,
      },
      explanation:
        "The patient remains apneic after one appropriate airway-opening attempt and is tagged Dead / Black. This is distinct from an expectant patient, who remains alive.",
      decisionPath: [
        "Patient is not breathing",
        "One airway-opening attempt performed",
        "Breathing does not resume",
        "Dead / Black",
      ],
      assessmentPriority: 1,
    }),
  ],
};

const distribution = highwayCollisionScenario.patients.reduce<
  Record<string, number>
>((counts, patient) => {
  counts[patient.correctCategory] = (counts[patient.correctCategory] ?? 0) + 1;
  return counts;
}, {});

if (
  distribution.minimal !== 2 ||
  distribution.delayed !== 2 ||
  distribution.immediate !== 2 ||
  distribution.expectant !== 1 ||
  distribution.dead !== 1
) {
  throw new Error("Highway Collision triage distribution is invalid.");
}
