export type ScenarioPhase =
  | "dispatch"
  | "sceneSafety"
  | "primaryAssessment"
  | "secondaryAssessment"
  | "impression"
  | "interventions"
  | "transport"
  | "reassessment"
  | "complete";

export type ObjectCategory =
  | "hazard"
  | "patient"
  | "equipment"
  | "vehicle"
  | "bystander"
  | "environment"
  | "movement";

export type Vec3 = [number, number, number];

export type SceneEvent =
  | "DISPATCH_RECEIVED"
  | "AMBULANCE_EXITED"
  | "DOG_SELECTED"
  | "DOG_INSPECTED"
  | "DOG_AGITATED"
  | "CAR_INSPECTED"
  | "BYSTANDERS_QUESTIONED"
  | "RADIO_SELECTED"
  | "ANIMAL_CONTROL_CALLED"
  | "DOG_SECURED"
  | "MEDICAL_BAG_OPENED"
  | "GLOVES_EQUIPPED"
  | "PPE_EQUIPPED"
  | "PATIENT_APPROACHED"
  | "GENERAL_IMPRESSION_OBSERVED"
  | "RESPONSIVENESS_CHECKED"
  | "AIRWAY_OPENED"
  | "RESPIRATIONS_COUNTED"
  | "PULSE_CHECKED"
  | "BLOOD_PRESSURE_OBTAINED"
  | "SPO2_OBTAINED"
  | "WORKING_IMPRESSION_SELECTED"
  | "TRANSPORT_SELECTED"
  | "SECONDARY_UNLOCKED";

export type InteractionAction = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  requires?: string[];
  disabledReason?: string;
  duration?: number;
  scoreEffect?: number;
  timeEffect?: number;
  successEvents?: SceneEvent[];
  failureEvents?: SceneEvent[];
  onSuccessEvents?: SceneEvent[];
  onFailureEvents?: SceneEvent[];
};

export type InteractiveObjectConfig = {
  id: string;
  name: string;
  category: ObjectCategory;
  actions: InteractionAction[];
  optional?: boolean;
  visibleWhen?: string[];
  enabledWhen?: string[];
  completedWhen?: string[];
  highlightColor?: string;
  focusPosition?: Vec3;
  focusTarget?: Vec3;
  position: Vec3;
};

export type ObjectiveConfig = {
  id: string;
  label: string;
  subtleGoal: string;
  phase: ScenarioPhase;
  requiredEvents: SceneEvent[];
  hintLevels: string[];
};

export type PatientVitals = {
  heartRate: number;
  respiratoryRate: number;
  systolicBP: number;
  diastolicBP: number;
  spo2: number;
};

export type PatientVitalKey = keyof PatientVitals;

export type ScenarioState = {
  currentPhase: ScenarioPhase;
  currentObjectiveId: string;
  completedObjectives: string[];
  failedObjectives: string[];
  triggeredEvents: SceneEvent[];
  selectedObjectId?: string;
  focusedObjectId?: string;
  inventory: string[];
  equippedItems: string[];
  elapsedTime: number;
  score: number;
  hintsUsed: number;
  feedback: string;
  locationId: "ambulance" | "roadside" | "patientSide";
  accessibilityMode: boolean;
  environment: {
    dogSecured: boolean;
    fireControlled: boolean;
    trafficStopped: boolean;
    sceneSafe: boolean;
    dogAgitated: boolean;
  };
  patient: {
    workingImpression?: string;
    responsiveness: string;
    airwayStatus: string;
    breathingStatus: string;
    circulationStatus: string;
    position: string;
    oxygenApplied: boolean;
    medicationGiven: string[];
    findingsDiscovered: string[];
    vitalsRevealed: PatientVitalKey[];
    vitals: PatientVitals;
  };
};

export type SceneScenarioConfig = {
  id: string;
  title: string;
  dispatch: string;
  sceneReport: string;
  startingLocation: ScenarioState["locationId"];
  initialPhase: ScenarioPhase;
  currentObjectiveId: string;
  objectives: ObjectiveConfig[];
  interactiveObjects: InteractiveObjectConfig[];
  patientInitialState: ScenarioState["patient"];
  environmentInitialState: ScenarioState["environment"];
};

export type ScenarioEngineAction =
  | { type: "SELECT_OBJECT"; objectId?: string }
  | { type: "RUN_ACTION"; objectId: string; actionId: string }
  | { type: "APPLY_EVENT"; event: SceneEvent }
  | { type: "USE_HINT" }
  | { type: "RESET"; scenario?: SceneScenarioConfig }
  | { type: "TOGGLE_ACCESSIBILITY" }
  | { type: "TICK"; seconds: number };

export const anaphylaxisFestivalScenario: SceneScenarioConfig = {
  id: "anaphylaxis-festival",
  title: "Teen With Shortness of Breath",
  dispatch: "Teen short of breath at a community festival. Respond from the ambulance staging point.",
  sceneReport:
    "Outdoor festival first-aid area. The patient is visible near the treatment area. A barking dog is between you and the patient.",
  startingLocation: "ambulance",
  initialPhase: "sceneSafety",
  currentObjectiveId: "inspect-dog",
  environmentInitialState: {
    dogSecured: false,
    fireControlled: true,
    trafficStopped: false,
    sceneSafe: false,
    dogAgitated: false,
  },
  patientInitialState: {
    workingImpression: undefined,
    responsiveness: "Alert, anxious, speaking in short phrases",
    airwayStatus: "Patent, throat tightness reported",
    breathingStatus: "Wheezing with increased work of breathing",
    circulationStatus: "Rapid radial pulse, flushed skin with hives",
    position: "on-ground",
    oxygenApplied: false,
    medicationGiven: [],
    findingsDiscovered: [],
    vitalsRevealed: [],
    vitals: {
      heartRate: 128,
      respiratoryRate: 28,
      systolicBP: 92,
      diastolicBP: 60,
      spo2: 89,
    },
  },
  objectives: [
    {
      id: "inspect-dog",
      label: "Scene Size-Up",
      subtleGoal: "Make the scene safe before approaching the patient.",
      phase: "sceneSafety",
      requiredEvents: ["DOG_INSPECTED"],
      hintLevels: [
        "Something near the patient may prevent a safe approach.",
        "Inspect the barking dog before moving in.",
        "Select the dog and inspect the hazard from a safe distance.",
      ],
    },
    {
      id: "use-radio",
      label: "Additional Resources",
      subtleGoal: "Request the resources needed to control the scene.",
      phase: "sceneSafety",
      requiredEvents: ["RADIO_SELECTED", "ANIMAL_CONTROL_CALLED"],
      hintLevels: [
        "Do not approach the dog yourself.",
        "Use the radio on the ambulance.",
        "Request animal control through dispatch.",
      ],
    },
    {
      id: "secure-dog",
      label: "Dog Secured",
      subtleGoal: "Wait until the dog is secured and the path is safe.",
      phase: "sceneSafety",
      requiredEvents: ["DOG_SECURED"],
      hintLevels: [
        "Stay back while support handles the animal.",
        "The dog must be removed from your approach path.",
        "Once the dog is secured, move into BSI/PPE.",
      ],
    },
    {
      id: "bsi-ppe",
      label: "BSI / PPE",
      subtleGoal: "Open the medical bag and equip gloves before patient contact.",
      phase: "primaryAssessment",
      requiredEvents: ["GLOVES_EQUIPPED"],
      hintLevels: ["Look for gloves or PPE in your kit.", "Open the medical bag.", "Put on gloves before touching the patient."],
    },
    {
      id: "approach-patient",
      label: "Approach Patient",
      subtleGoal: "Move to the patient when the path is safe.",
      phase: "primaryAssessment",
      requiredEvents: ["PATIENT_APPROACHED"],
      hintLevels: ["The patient is reachable after scene safety.", "Use the patient approach marker.", "Click the approach point beside the patient."],
    },
    {
      id: "general-impression",
      label: "General Impression",
      subtleGoal: "Form a first impression from visible findings.",
      phase: "primaryAssessment",
      requiredEvents: ["GENERAL_IMPRESSION_OBSERVED"],
      hintLevels: ["Look at posture, work of breathing, skin, and surroundings.", "Inspect the patient from the side.", "Click the patient and observe general impression."],
    },
    {
      id: "responsiveness",
      label: "Responsiveness",
      subtleGoal: "Find out if the patient responds appropriately.",
      phase: "primaryAssessment",
      requiredEvents: ["RESPONSIVENESS_CHECKED"],
      hintLevels: ["Talk to the patient before painful stimulus.", "Introduce yourself and ask what happened.", "Use the patient interaction menu."],
    },
    {
      id: "airway",
      label: "Airway",
      subtleGoal: "Check the airway.",
      phase: "primaryAssessment",
      requiredEvents: ["AIRWAY_OPENED"],
      hintLevels: ["The airway is assessed at the head and mouth.", "Focus the patient head.", "Inspect the airway hotspot."],
    },
    {
      id: "breathing",
      label: "Breathing",
      subtleGoal: "Assess breathing effort.",
      phase: "primaryAssessment",
      requiredEvents: ["RESPIRATIONS_COUNTED"],
      hintLevels: ["Watch chest rise and respiratory effort.", "Focus on the chest.", "Count respirations from the chest hotspot."],
    },
    {
      id: "circulation",
      label: "Circulation",
      subtleGoal: "Assess pulse and skin.",
      phase: "primaryAssessment",
      requiredEvents: ["PULSE_CHECKED"],
      hintLevels: ["Check pulse and skin signs.", "Use the wrist hotspot.", "Check the radial pulse."],
    },
    {
      id: "baseline-vitals",
      label: "Baseline Vitals",
      subtleGoal: "Gather baseline vital signs using equipment.",
      phase: "primaryAssessment",
      requiredEvents: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      hintLevels: ["Not all vital signs come from looking.", "Use equipment after the ABCs.", "Use the blood pressure cuff and pulse oximeter."],
    },
    {
      id: "working-impression",
      label: "Working Impression",
      subtleGoal: "Use the gathered findings to form a working impression.",
      phase: "primaryAssessment",
      requiredEvents: ["WORKING_IMPRESSION_SELECTED"],
      hintLevels: ["Connect the respiratory distress with the skin findings.", "Consider allergy exposure plus hypotension.", "Choose severe allergic reaction with shock signs."],
    },
    {
      id: "transport-priority",
      label: "Transport Priority",
      subtleGoal: "Decide transport urgency from your findings.",
      phase: "primaryAssessment",
      requiredEvents: ["TRANSPORT_SELECTED"],
      hintLevels: ["Use the primary findings to decide urgency.", "This patient has respiratory compromise and hypotension.", "Choose urgent transport."],
    },
  ],
  interactiveObjects: [
    {
      id: "ambulance-door",
      name: "Ambulance Door",
      category: "movement",
      visibleWhen: ["AMBULANCE_EXIT_REQUIRED"],
      position: [-4.8, 1.1, -4.95],
      focusPosition: [8.8, 4.6, 6.8],
      focusTarget: [-5.75, 0.9, -4.35],
      highlightColor: "#38bdf8",
      actions: [
        {
          id: "exit-ambulance",
          label: "Step out and scan",
          description: "Move from the ambulance to the roadside staging point.",
          successEvents: ["AMBULANCE_EXITED"],
          scoreEffect: 2,
        },
      ],
    },
    {
      id: "dog",
      name: "Barking Dog",
      category: "hazard",
      visibleWhen: ["DISPATCH_RECEIVED"],
      completedWhen: ["DOG_INSPECTED"],
      position: [5.38, 0.72, 1.28],
      focusPosition: [-1.95, 1.62, -0.75],
      focusTarget: [4.9, 0.75, 1.25],
      highlightColor: "#fb7185",
      actions: [
        {
          id: "inspect-dog",
          label: "Inspect from distance",
          description: "The dog is barking, tense, and directly between you and the patient.",
          successEvents: ["DOG_INSPECTED"],
          scoreEffect: 4,
          timeEffect: 8,
        },
        {
          id: "approach-dog",
          label: "Approach the dog",
          description: "Unsafe. The dog blocks your path and forces you back.",
          successEvents: ["DOG_AGITATED"],
          scoreEffect: -8,
          timeEffect: 20,
        },
        {
          id: "ask-bystander-secure-dog",
          label: "Ask bystander to secure dog",
          description: "A bystander backs away and says they do not know the dog.",
          successEvents: ["DOG_AGITATED"],
          scoreEffect: -3,
          timeEffect: 15,
        },
        {
          id: "ignore-dog",
          label: "Ignore dog and approach patient",
          description: "Unsafe. The dog lunges and you lose access to the patient.",
          successEvents: ["DOG_AGITATED"],
          scoreEffect: -10,
          timeEffect: 25,
        },
      ],
    },
    {
      id: "bystanders",
      name: "Bystanders",
      category: "bystander",
      optional: true,
      visibleWhen: ["DISPATCH_RECEIVED"],
      completedWhen: ["BYSTANDERS_QUESTIONED"],
      position: [6.6, 1.0, -2.2],
      focusPosition: [2.3, 1.8, -0.2],
      focusTarget: [6.4, 1.0, -2.1],
      highlightColor: "#c084fc",
      actions: [
        {
          id: "question-bystanders",
          label: "Ask what happened",
          description: "Bystanders report the teen ate a dessert, then developed itching, breathing trouble, and became frightened.",
          successEvents: ["BYSTANDERS_QUESTIONED"],
          scoreEffect: 3,
          timeEffect: 12,
        },
      ],
    },
    {
      id: "ambulance-radio",
      name: "Ambulance Radio",
      category: "vehicle",
      visibleWhen: ["DOG_INSPECTED"],
      completedWhen: ["DOG_SECURED"],
      position: [-4.55, 2.06, -3.52],
      focusPosition: [-2.45, 1.65, -1.35],
      focusTarget: [-4.45, 1.72, -3.45],
      highlightColor: "#2dd4bf",
      actions: [
        {
          id: "request-animal-control",
          label: "Request animal control",
          description: "Radio dispatch for animal control and police support.",
          requires: ["RADIO_SELECTED"],
          successEvents: ["ANIMAL_CONTROL_CALLED"],
          scoreEffect: 10,
          timeEffect: 45,
        },
      ],
    },
    {
      id: "medical-bag",
      name: "Medical Bag",
      category: "equipment",
      visibleWhen: ["DOG_SECURED"],
      completedWhen: ["GLOVES_EQUIPPED"],
      position: [-2.9, 0.55, -0.65],
      focusPosition: [-1.05, 1.45, 1.55],
      focusTarget: [-2.9, 0.42, -0.65],
      highlightColor: "#5eead4",
      enabledWhen: ["DOG_SECURED"],
      actions: [
        {
          id: "open-medical-bag",
          label: "Open medical bag",
          description: "Open the aid bag and locate PPE before patient contact.",
          successEvents: ["MEDICAL_BAG_OPENED"],
          scoreEffect: 3,
        },
        {
          id: "equip-gloves",
          label: "Put on gloves",
          description: "Finish BSI/PPE before touching the patient.",
          requires: ["MEDICAL_BAG_OPENED"],
          successEvents: ["GLOVES_EQUIPPED", "PPE_EQUIPPED"],
          scoreEffect: 6,
        },
      ],
    },
    {
      id: "patient-approach",
      name: "Approach Patient",
      category: "movement",
      visibleWhen: ["PPE_EQUIPPED"],
      completedWhen: ["PATIENT_APPROACHED"],
      position: [0.65, 0.08, 1.8],
      focusPosition: [5.5, 2.8, 5.0],
      focusTarget: [2.15, 0.45, 1.55],
      highlightColor: "#67e8f9",
      enabledWhen: ["DOG_SECURED", "PPE_EQUIPPED"],
      actions: [
        {
          id: "approach-patient",
          label: "Move to patient",
          description: "Take the safe route to the patient side.",
          onSuccessEvents: ["PATIENT_APPROACHED"],
          scoreEffect: 4,
        },
      ],
    },
    {
      id: "patient",
      name: "Patient",
      category: "patient",
      visibleWhen: ["PATIENT_APPROACHED"],
      completedWhen: ["RESPONSIVENESS_CHECKED"],
      position: [2.2, 0.9, 1.45],
      focusPosition: [4.9, 2.6, 4.7],
      focusTarget: [2.1, 0.8, 1.45],
      highlightColor: "#fda4af",
      enabledWhen: ["PATIENT_APPROACHED"],
      actions: [
        {
          id: "general-impression",
          label: "Observe general impression",
          description: "Teen upright on ground, anxious, flushed skin, visible hives, labored breathing.",
          onSuccessEvents: ["GENERAL_IMPRESSION_OBSERVED"],
          scoreEffect: 5,
        },
        {
          id: "introduce-yourself",
          label: "Introduce yourself",
          description: "The patient is alert and answers in short phrases.",
          requires: ["GENERAL_IMPRESSION_OBSERVED"],
          onSuccessEvents: ["RESPONSIVENESS_CHECKED"],
          scoreEffect: 5,
        },
      ],
    },
    {
      id: "airway-hotspot",
      name: "Airway",
      category: "patient",
      visibleWhen: ["RESPONSIVENESS_CHECKED"],
      position: [1.82, 0.46, 1.18],
      focusPosition: [3.7, 2.0, 3.2],
      focusTarget: [1.82, 0.42, 1.18],
      highlightColor: "#fbbf24",
      enabledWhen: ["RESPONSIVENESS_CHECKED"],
      actions: [
        {
          id: "inspect-airway",
          label: "Inspect airway",
          description: "Airway is patent, but the patient reports throat tightness.",
          onSuccessEvents: ["AIRWAY_OPENED"],
          scoreEffect: 5,
        },
      ],
    },
    {
      id: "chest-hotspot",
      name: "Chest / Breathing",
      category: "patient",
      visibleWhen: ["AIRWAY_OPENED"],
      position: [2.45, 0.48, 1.28],
      focusPosition: [4.3, 2.2, 3.6],
      focusTarget: [2.45, 0.42, 1.28],
      highlightColor: "#38bdf8",
      enabledWhen: ["AIRWAY_OPENED"],
      actions: [
        {
          id: "count-respirations",
          label: "Count respirations",
          description: "RR 28 with wheezing and increased work of breathing.",
          onSuccessEvents: ["RESPIRATIONS_COUNTED"],
          scoreEffect: 5,
        },
      ],
    },
    {
      id: "pulse-hotspot",
      name: "Radial Pulse",
      category: "patient",
      visibleWhen: ["RESPIRATIONS_COUNTED"],
      position: [2.16, 0.96, 1.08],
      focusPosition: [4.1, 2.0, 3.4],
      focusTarget: [2.0, 0.95, 1.25],
      highlightColor: "#f472b6",
      enabledWhen: ["RESPIRATIONS_COUNTED"],
      actions: [
        {
          id: "check-radial-pulse",
          label: "Check radial pulse and skin",
          description: "Rapid radial pulse at 128. Skin is warm, flushed, and covered with hives.",
          onSuccessEvents: ["PULSE_CHECKED"],
          scoreEffect: 5,
        },
      ],
    },
    {
      id: "transport-decision",
      name: "Transport Decision",
      category: "movement",
      visibleWhen: ["WORKING_IMPRESSION_SELECTED"],
      position: [3.9, 0.12, 0.95],
      focusPosition: [5.8, 2.8, 4.2],
      focusTarget: [2.4, 0.8, 1.3],
      highlightColor: "#a7f3d0",
      enabledWhen: ["PULSE_CHECKED"],
      actions: [
        {
          id: "urgent-transport",
          label: "Urgent transport",
          description: "Primary survey supports urgent transport with respiratory compromise and hypotension.",
          onSuccessEvents: ["TRANSPORT_SELECTED", "SECONDARY_UNLOCKED"],
          scoreEffect: 8,
        },
      ],
    },
    {
      id: "working-impression",
      name: "Working Impression",
      category: "patient",
      visibleWhen: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      completedWhen: ["WORKING_IMPRESSION_SELECTED"],
      position: [3.0, 0.4, 1.55],
      focusPosition: [5.4, 2.45, 4.2],
      focusTarget: [2.25, 0.85, 1.45],
      highlightColor: "#f0abfc",
      enabledWhen: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      actions: [
        {
          id: "suspect-severe-allergic-reaction",
          label: "Suspect severe allergic reaction",
          description: "Hives, throat tightness, wheezing, SpO2 89%, and BP 92/60 indicate a high-priority allergic emergency.",
          onSuccessEvents: ["WORKING_IMPRESSION_SELECTED"],
          scoreEffect: 8,
        },
      ],
    },
  ],
};

export function createScenarioState(scenario: SceneScenarioConfig = anaphylaxisFestivalScenario): ScenarioState {
  return {
    currentPhase: scenario.initialPhase,
    currentObjectiveId: scenario.currentObjectiveId,
    completedObjectives: [],
    failedObjectives: [],
    triggeredEvents: ["DISPATCH_RECEIVED"],
    selectedObjectId: undefined,
    focusedObjectId: undefined,
    inventory: [],
    equippedItems: [],
    elapsedTime: 0,
    score: 80,
    hintsUsed: 0,
    feedback: scenario.dispatch,
    locationId: scenario.startingLocation,
    accessibilityMode: false,
    environment: scenario.environmentInitialState,
    patient: scenario.patientInitialState,
  };
}

export function hasEvents(state: ScenarioState, events: string[] = []) {
  return events.every((event) => state.triggeredEvents.includes(event as SceneEvent));
}

export function getActionSuccessEvents(action: InteractionAction) {
  return action.successEvents ?? action.onSuccessEvents ?? [];
}

export function isInteractiveObjectComplete(object: InteractiveObjectConfig, state: ScenarioState) {
  if (object.completedWhen) return hasEvents(state, object.completedWhen);
  return object.actions.some((action) => hasEvents(state, getActionSuccessEvents(action)));
}

export function getVisibleInteractiveObjects(scenario: SceneScenarioConfig, state: ScenarioState) {
  return scenario.interactiveObjects.filter((object) => hasEvents(state, object.visibleWhen));
}

export function getObjectAvailability(object: InteractiveObjectConfig, state: ScenarioState) {
  const enabled = hasEvents(state, object.enabledWhen);
  if (enabled) return { enabled: true, reason: undefined };
  if (object.enabledWhen?.includes("DOG_SECURED") && !state.environment.dogSecured) {
    return { enabled: false, reason: "Secure the barking dog before moving closer." };
  }
  if (object.enabledWhen?.includes("PPE_EQUIPPED") && !state.inventory.includes("gloves")) {
    return { enabled: false, reason: "Put on PPE before patient contact." };
  }
  return { enabled: false, reason: "Not available yet." };
}

export function getCurrentObjective(scenario: SceneScenarioConfig, state: ScenarioState) {
  return scenario.objectives.find((objective) => objective.id === state.currentObjectiveId) ?? scenario.objectives[0];
}

function nextObjective(scenario: SceneScenarioConfig, state: ScenarioState, completedObjectives: string[]) {
  return scenario.objectives.find((objective) => !completedObjectives.includes(objective.id)) ?? scenario.objectives[scenario.objectives.length - 1];
}

function feedbackForEvent(event: SceneEvent): string {
  switch (event) {
    case "AMBULANCE_EXITED":
      return "You step out and scan the scene from a safe distance. The dog is actively blocking the patient.";
    case "DOG_SELECTED":
      return "The dog is barking, tense, and between you and the patient.";
    case "DOG_INSPECTED":
      return "Hazard identified: the dog is agitated and blocking safe patient access. Use the ambulance radio for trained help.";
    case "DOG_AGITATED":
      return "The dog lunges closer. You step back and lose time. The patient is still not safely reachable.";
    case "CAR_INSPECTED":
      return "Vehicle checked from a safe distance. Smoke is present, but this patient appears to be a separate medical call.";
    case "BYSTANDERS_QUESTIONED":
      return "Bystanders report itching, trouble breathing, and sudden fear after the teen ate dessert.";
    case "RADIO_SELECTED":
      return "Radio selected. Contact dispatch before approaching the dog or patient.";
    case "ANIMAL_CONTROL_CALLED":
      return "Radio: Animal control and police support are en route. Hold position until the dog is secured.";
    case "DOG_SECURED":
      return "A responder secures the dog and leads it away. The path to the patient is now safe.";
    case "MEDICAL_BAG_OPENED":
      return "The medical bag is open. Gloves are visible inside.";
    case "GLOVES_EQUIPPED":
      return "Gloves on. BSI/PPE is complete before patient contact.";
    case "PPE_EQUIPPED":
      return "Gloves on. BSI/PPE is complete before patient contact.";
    case "PATIENT_APPROACHED":
      return "You move to the patient's side using the safe approach path.";
    case "GENERAL_IMPRESSION_OBSERVED":
      return "General impression: anxious teen, hives, flushed skin, increased work of breathing.";
    case "RESPONSIVENESS_CHECKED":
      return "Patient: I can talk, but my throat feels tight and breathing is hard.";
    case "AIRWAY_OPENED":
      return "Airway is patent. No visible obstruction. Patient reports throat tightness.";
    case "RESPIRATIONS_COUNTED":
      return "Breathing: RR 28, wheezing, shallow but present chest rise.";
    case "PULSE_CHECKED":
      return "Circulation: rapid radial pulse 128. Skin is warm, flushed, with widespread hives.";
    case "BLOOD_PRESSURE_OBTAINED":
      return "Blood pressure obtained: 92/60. This supports poor perfusion.";
    case "SPO2_OBTAINED":
      return "Pulse oximeter reading obtained: SpO2 89%. Oxygenation is inadequate.";
    case "WORKING_IMPRESSION_SELECTED":
      return "Working impression: severe allergic reaction with respiratory compromise and shock signs.";
    case "TRANSPORT_SELECTED":
      return "Urgent transport selected. Primary assessment is complete; secondary assessment is now unlocked.";
    case "SECONDARY_UNLOCKED":
      return "Primary assessment complete. Secondary assessment is now unlocked.";
    default:
      return "Action complete.";
  }
}

function addFinding(state: ScenarioState, finding: string) {
  return state.patient.findingsDiscovered.includes(finding)
    ? state.patient.findingsDiscovered
    : [...state.patient.findingsDiscovered, finding];
}

function revealVital(state: ScenarioState, vital: PatientVitalKey) {
  return state.patient.vitalsRevealed.includes(vital)
    ? state.patient.vitalsRevealed
    : [...state.patient.vitalsRevealed, vital];
}

function applyEvent(state: ScenarioState, event: SceneEvent): ScenarioState {
  if (state.triggeredEvents.includes(event)) return state;

  const next: ScenarioState = {
    ...state,
    triggeredEvents: [...state.triggeredEvents, event],
    feedback: feedbackForEvent(event),
  };

  if (event === "AMBULANCE_EXITED") {
    next.locationId = "roadside";
    next.focusedObjectId = "dog";
  }
  if (event === "DOG_SELECTED") next.focusedObjectId = "dog";
  if (event === "DOG_INSPECTED") next.focusedObjectId = "ambulance-radio";
  if (event === "CAR_INSPECTED") {
    next.patient = { ...next.patient, findingsDiscovered: addFinding(next, "Vehicle smoke monitored from a safe distance") };
  }
  if (event === "BYSTANDERS_QUESTIONED") {
    next.patient = { ...next.patient, findingsDiscovered: addFinding(next, "Bystanders report dessert exposure followed by itching and trouble breathing") };
  }
  if (event === "DOG_AGITATED") {
    next.environment = { ...next.environment, dogAgitated: true };
    next.score = Math.max(0, next.score - 8);
    next.elapsedTime += 20;
    next.focusedObjectId = "dog";
    next.failedObjectives = next.failedObjectives.includes("dog-hazard")
      ? next.failedObjectives
      : [...next.failedObjectives, "dog-hazard"];
  }
  if (event === "DOG_SECURED") {
    next.environment = { ...next.environment, dogSecured: true, sceneSafe: true, dogAgitated: false };
    next.focusedObjectId = "medical-bag";
  }
  if (event === "RADIO_SELECTED") next.focusedObjectId = "ambulance-radio";
  if (event === "ANIMAL_CONTROL_CALLED") next.focusedObjectId = "dog";
  if (event === "GENERAL_IMPRESSION_OBSERVED") next.focusedObjectId = "patient";
  if (event === "RESPONSIVENESS_CHECKED") next.focusedObjectId = "airway-hotspot";
  if (event === "AIRWAY_OPENED") next.focusedObjectId = "chest-hotspot";
  if (event === "RESPIRATIONS_COUNTED") next.focusedObjectId = "pulse-hotspot";
  if (event === "PULSE_CHECKED") next.focusedObjectId = "patient";
  if (event === "MEDICAL_BAG_OPENED") next.focusedObjectId = "medical-bag";
  if (event === "GLOVES_EQUIPPED" || event === "PPE_EQUIPPED") {
    next.inventory = next.inventory.includes("gloves") ? next.inventory : [...next.inventory, "gloves"];
    next.equippedItems = next.equippedItems.includes("gloves") ? next.equippedItems : [...next.equippedItems, "gloves"];
    next.currentPhase = "primaryAssessment";
    next.focusedObjectId = "patient-approach";
  }
  if (event === "PATIENT_APPROACHED") {
    next.locationId = "patientSide";
    next.patient = { ...next.patient, position: "patient-side" };
    next.focusedObjectId = "patient";
  }
  if (event === "GENERAL_IMPRESSION_OBSERVED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(next, "Anxious teen with visible hives and increased work of breathing"),
    };
  }
  if (event === "RESPONSIVENESS_CHECKED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(next, "Alert, speaking in short phrases, reports throat tightness"),
    };
  }
  if (event === "AIRWAY_OPENED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(next, "Airway patent with reported throat tightness"),
    };
  }
  if (event === "RESPIRATIONS_COUNTED") {
    next.patient = {
      ...next.patient,
      breathingStatus: "Wheezing, RR 28, increased work of breathing",
      findingsDiscovered: addFinding(next, "Wheezing with increased work of breathing"),
      vitalsRevealed: revealVital(next, "respiratoryRate"),
      vitals: { ...next.patient.vitals, respiratoryRate: 28, spo2: 89 },
    };
  }
  if (event === "PULSE_CHECKED") {
    next.patient = {
      ...next.patient,
      circulationStatus: "Rapid radial pulse, warm flushed skin, hives",
      findingsDiscovered: addFinding(next, "Rapid radial pulse with warm flushed skin and hives"),
      vitalsRevealed: revealVital(next, "heartRate"),
      vitals: { ...next.patient.vitals, heartRate: 128, systolicBP: 92, diastolicBP: 60 },
    };
  }
  if (event === "BLOOD_PRESSURE_OBTAINED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(next, "Hypotension: BP 92/60"),
      vitalsRevealed: revealVital({ ...next, patient: { ...next.patient, vitalsRevealed: revealVital(next, "systolicBP") } }, "diastolicBP"),
    };
    next.focusedObjectId = "patient";
  }
  if (event === "SPO2_OBTAINED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(next, "Low SpO2: 89%"),
      vitalsRevealed: revealVital(next, "spo2"),
    };
    next.focusedObjectId = "working-impression";
  }
  if (event === "WORKING_IMPRESSION_SELECTED") {
    next.patient = {
      ...next.patient,
      workingImpression: "Severe allergic reaction with respiratory compromise and shock signs",
      findingsDiscovered: addFinding(next, "Working impression selected from hives, wheezing, hypoxia, and hypotension"),
    };
    next.focusedObjectId = "transport-decision";
  }
  if (event === "TRANSPORT_SELECTED" || event === "SECONDARY_UNLOCKED") {
    next.currentPhase = "secondaryAssessment";
    next.focusedObjectId = "patient";
  }

  return next;
}

function completeObjectives(scenario: SceneScenarioConfig, state: ScenarioState): ScenarioState {
  const completed = scenario.objectives
    .filter((objective) => !state.completedObjectives.includes(objective.id))
    .filter((objective) => hasEvents(state, objective.requiredEvents))
    .map((objective) => objective.id);

  if (!completed.length) return state;

  const completedObjectives = [...state.completedObjectives, ...completed];
  const currentObjective = nextObjective(scenario, state, completedObjectives);

  return {
    ...state,
    completedObjectives,
    currentObjectiveId: currentObjective.id,
    currentPhase: currentObjective.phase,
  };
}

export function scenarioReducer(
  scenario: SceneScenarioConfig,
  state: ScenarioState,
  action: ScenarioEngineAction
): ScenarioState {
  switch (action.type) {
    case "RESET":
      return createScenarioState(action.scenario ?? scenario);
    case "TOGGLE_ACCESSIBILITY":
      return { ...state, accessibilityMode: !state.accessibilityMode };
    case "TICK":
      return { ...state, elapsedTime: state.elapsedTime + action.seconds };
    case "APPLY_EVENT":
      return completeObjectives(scenario, applyEvent(state, action.event));
    case "USE_HINT": {
      const objective = getCurrentObjective(scenario, state);
      const hintIndex = Math.min(state.hintsUsed, objective.hintLevels.length - 1);
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        score: Math.max(0, state.score - 2),
        feedback: `Hint: ${objective.hintLevels[hintIndex]}`,
      };
    }
    case "SELECT_OBJECT": {
      const object = scenario.interactiveObjects.find((item) => item.id === action.objectId);
      const selectedState = {
        ...state,
        selectedObjectId: action.objectId,
        focusedObjectId: action.objectId,
        feedback: object ? `${object.name} selected. Choose an action.` : state.feedback,
      };
      let next = action.objectId === "dog" ? applyEvent(selectedState, "DOG_SELECTED") : selectedState;
      if (action.objectId === "ambulance-radio") {
        next = applyEvent(
          {
            ...selectedState,
            selectedObjectId: undefined,
          },
          "RADIO_SELECTED"
        );
        next = applyEvent(next, "ANIMAL_CONTROL_CALLED");
        next = {
          ...next,
          elapsedTime: next.elapsedTime + 45,
          score: Math.min(100, next.score + 10),
        };
        return completeObjectives(scenario, next);
      }
      return next;
    }
    case "RUN_ACTION": {
      const object = scenario.interactiveObjects.find((item) => item.id === action.objectId);
      const interaction = object?.actions.find((item) => item.id === action.actionId);
      if (!object || !interaction) return state;

      const objectAvailability = getObjectAvailability(object, state);
      const actionAvailable = hasEvents(state, interaction.requires);
      if (!objectAvailability.enabled || !actionAvailable) {
        return {
          ...state,
          selectedObjectId: object.id,
          feedback: interaction.disabledReason ?? objectAvailability.reason ?? "That action is not available yet.",
        };
      }

      let next = state;
      getActionSuccessEvents(interaction).forEach((event) => {
        next = applyEvent(next, event);
      });

      const hasRemainingObjectActions = object.actions.some(
        (action) => !hasEvents(next, getActionSuccessEvents(action)) && hasEvents(next, action.requires)
      );
      const shouldKeepSelection =
        (object.id === "dog" && next.environment.dogAgitated && !next.environment.dogSecured) ||
        ((object.id === "medical-bag" || object.id === "patient") && hasRemainingObjectActions);
      const maxScore = next.failedObjectives.includes("dog-hazard") ? 88 : 100;
      next = {
        ...next,
        selectedObjectId: shouldKeepSelection ? object.id : undefined,
        elapsedTime: next.elapsedTime + (interaction.timeEffect ?? 8),
        score: Math.max(0, Math.min(maxScore, next.score + (interaction.scoreEffect ?? 0))),
      };

      return completeObjectives(scenario, next);
    }
    default:
      return state;
  }
}

export type ScenarioScoreBreakdown = {
  safety: number;
  assessment: number;
  clinicalDecisions: number;
  treatment: number;
  reassessment: number;
  communication: number;
  efficiency: number;
};

export function getScenarioScoreBreakdown(state: ScenarioState): ScenarioScoreBreakdown {
  const unsafeDog = state.failedObjectives.includes("dog-hazard");
  const assessmentEvents: SceneEvent[] = [
    "GENERAL_IMPRESSION_OBSERVED",
    "RESPONSIVENESS_CHECKED",
    "AIRWAY_OPENED",
    "RESPIRATIONS_COUNTED",
    "PULSE_CHECKED",
    "BLOOD_PRESSURE_OBTAINED",
    "SPO2_OBTAINED",
  ];
  const completedAssessment = assessmentEvents.filter((event) => state.triggeredEvents.includes(event)).length;

  return {
    safety: Math.max(55, 100 - (unsafeDog ? 28 : 0) - (state.triggeredEvents.includes("DOG_INSPECTED") ? 0 : 18)),
    assessment: Math.round((completedAssessment / assessmentEvents.length) * 100),
    clinicalDecisions: state.triggeredEvents.includes("WORKING_IMPRESSION_SELECTED")
      ? state.triggeredEvents.includes("TRANSPORT_SELECTED")
        ? 94
        : 82
      : 45,
    treatment: state.triggeredEvents.includes("TRANSPORT_SELECTED") ? 72 : 35,
    reassessment: state.currentPhase === "secondaryAssessment" ? 55 : 0,
    communication: state.triggeredEvents.includes("ANIMAL_CONTROL_CALLED") ? 90 : 52,
    efficiency: Math.max(45, 100 - state.hintsUsed * 6 - Math.floor(state.elapsedTime / 60) * 3 - (unsafeDog ? 14 : 0)),
  };
}

export function buildScenarioDebrief(state: ScenarioState) {
  const score = getScenarioScoreBreakdown(state);
  const correct: string[] = [];
  const missed: string[] = [];
  const unsafe: string[] = [];

  if (state.triggeredEvents.includes("DOG_INSPECTED")) correct.push("Identified the dog as a scene safety hazard before patient contact.");
  else missed.push("Scene hazard inspection was not completed.");

  if (state.triggeredEvents.includes("ANIMAL_CONTROL_CALLED")) correct.push("Requested animal control/police support instead of entering an unsafe scene.");
  else missed.push("Additional resources were not requested for the animal hazard.");

  if (state.triggeredEvents.includes("GLOVES_EQUIPPED")) correct.push("Equipped PPE before touching the patient.");
  else missed.push("PPE was not equipped before patient contact.");

  if (state.triggeredEvents.includes("BLOOD_PRESSURE_OBTAINED") && state.triggeredEvents.includes("SPO2_OBTAINED")) {
    correct.push("Obtained baseline BP and SpO2 after the ABC assessment.");
  } else {
    missed.push("Baseline vital signs were incomplete.");
  }

  if (state.triggeredEvents.includes("WORKING_IMPRESSION_SELECTED")) correct.push("Formed a working impression from hives, wheezing, hypoxia, and hypotension.");
  else missed.push("Working impression was not selected from the gathered findings.");

  if (state.failedObjectives.includes("dog-hazard")) unsafe.push("Approached or ignored the dog before the scene was controlled, costing time and access.");

  return {
    score,
    correct,
    missed,
    unsafe,
    findings: state.patient.findingsDiscovered,
    summary:
      state.triggeredEvents.includes("TRANSPORT_SELECTED")
        ? "Primary assessment complete: respiratory distress, skin findings, hypoxia, and hypotension support urgent transport and rapid treatment."
        : "Scenario in progress. Continue collecting assessment findings before choosing transport priority.",
  };
}
