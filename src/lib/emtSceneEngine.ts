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
  | "RADIO_SELECTED"
  | "ANIMAL_CONTROL_CALLED"
  | "DOG_SECURED"
  | "MEDICAL_BAG_OPENED"
  | "GLOVES_COLLECTED"
  | "GLOVES_EQUIPPED"
  | "PPE_EQUIPPED"
  | "PATIENT_APPROACHED"
  | "GENERAL_IMPRESSION_OBSERVED"
  | "RESPONSIVENESS_CHECKED"
  | "AIRWAY_OPENED"
  | "RESPIRATIONS_COUNTED"
  | "PULSE_CHECKED"
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
    responsiveness: string;
    airwayStatus: string;
    breathingStatus: string;
    circulationStatus: string;
    position: string;
    oxygenApplied: boolean;
    medicationGiven: string[];
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
  | { type: "USE_HINT" }
  | { type: "RESET"; scenario?: SceneScenarioConfig }
  | { type: "TOGGLE_ACCESSIBILITY" }
  | { type: "TICK"; seconds: number };

export const anaphylaxisFestivalScenario: SceneScenarioConfig = {
  id: "anaphylaxis-festival",
  title: "Allergic Reaction at a Festival",
  dispatch: "Teen short of breath after eating dessert containing nuts. Respond from the ambulance staging point.",
  sceneReport:
    "Outdoor festival first-aid area. The patient is visible near the treatment area, but a barking dog is between you and the patient.",
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
    responsiveness: "Alert, anxious, speaking in short phrases",
    airwayStatus: "Patent, throat tightness reported",
    breathingStatus: "Wheezing with increased work of breathing",
    circulationStatus: "Rapid radial pulse, flushed skin with hives",
    position: "on-ground",
    oxygenApplied: false,
    medicationGiven: [],
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
      label: "Inspect Hazard",
      subtleGoal: "Observe from the ambulance staging point and inspect the barking dog.",
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
      label: "Use Radio",
      subtleGoal: "Use the ambulance radio to request help.",
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
      focusPosition: [7.65, 2.35, 4.4],
      focusTarget: [5.25, 0.75, 1.25],
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
      id: "ambulance-radio",
      name: "Ambulance Radio",
      category: "vehicle",
      visibleWhen: ["DOG_INSPECTED"],
      completedWhen: ["DOG_SECURED"],
      position: [-5.35, 1.75, -5.3],
      focusPosition: [0.4, 2.65, 4.35],
      focusTarget: [-3.45, 0.95, -2.85],
      highlightColor: "#2dd4bf",
      actions: [
        {
          id: "request-animal-control",
          label: "Request animal control",
          description: "Radio dispatch for animal control and police support.",
          requires: ["RADIO_SELECTED"],
          successEvents: ["ANIMAL_CONTROL_CALLED", "DOG_SECURED"],
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
      position: [-1.7, 0.55, 1.66],
      focusPosition: [1.25, 1.85, 4.05],
      focusTarget: [-1.7, 0.55, 1.66],
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
          id: "collect-gloves",
          label: "Take gloves",
          description: "Take clean gloves from inside the medical bag.",
          requires: ["MEDICAL_BAG_OPENED"],
          successEvents: ["GLOVES_COLLECTED"],
          scoreEffect: 3,
        },
        {
          id: "equip-gloves",
          label: "Put on gloves",
          description: "Finish BSI/PPE before touching the patient.",
          requires: ["GLOVES_COLLECTED"],
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
      position: [1.25, 1.2, 1.45],
      focusPosition: [3.7, 2.0, 3.2],
      focusTarget: [1.25, 1.0, 1.45],
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
      position: [1.8, 1.08, 1.45],
      focusPosition: [4.3, 2.2, 3.6],
      focusTarget: [1.8, 0.95, 1.45],
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
      visibleWhen: ["PULSE_CHECKED"],
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
    case "RADIO_SELECTED":
      return "Radio selected. Contact dispatch before approaching the dog or patient.";
    case "ANIMAL_CONTROL_CALLED":
      return "Radio: Animal control and police support are en route. Hold position until the dog is secured.";
    case "DOG_SECURED":
      return "A responder secures the dog and leads it away. The path to the patient is now safe.";
    case "MEDICAL_BAG_OPENED":
      return "The medical bag is open. Gloves are visible inside.";
    case "GLOVES_COLLECTED":
      return "You take a pair of gloves from the medical bag.";
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
      return "Breathing: RR 28, wheezing, shallow but present chest rise. SpO2 remains 89%.";
    case "PULSE_CHECKED":
      return "Circulation: rapid radial pulse 128. Skin is warm, flushed, with widespread hives.";
    case "TRANSPORT_SELECTED":
      return "Urgent transport selected. Primary assessment is complete; secondary assessment is now unlocked.";
    default:
      return "Action complete.";
  }
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
  if (event === "DOG_INSPECTED") next.focusedObjectId = "dog";
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
  if (event === "GENERAL_IMPRESSION_OBSERVED") next.focusedObjectId = "patient";
  if (event === "RESPONSIVENESS_CHECKED") next.focusedObjectId = "airway-hotspot";
  if (event === "AIRWAY_OPENED") next.focusedObjectId = "chest-hotspot";
  if (event === "RESPIRATIONS_COUNTED") next.focusedObjectId = "pulse-hotspot";
  if (event === "PULSE_CHECKED") next.focusedObjectId = "transport-decision";
  if (event === "MEDICAL_BAG_OPENED") next.focusedObjectId = "medical-bag";
  if (event === "GLOVES_COLLECTED") {
    next.inventory = next.inventory.includes("gloves") ? next.inventory : [...next.inventory, "gloves"];
    next.focusedObjectId = "medical-bag";
  }
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
  if (event === "RESPIRATIONS_COUNTED") {
    next.patient = {
      ...next.patient,
      breathingStatus: "Wheezing, RR 28, increased work of breathing",
      vitals: { ...next.patient.vitals, respiratoryRate: 28, spo2: 89 },
    };
  }
  if (event === "PULSE_CHECKED") {
    next.patient = {
      ...next.patient,
      circulationStatus: "Rapid radial pulse, warm flushed skin, hives",
      vitals: { ...next.patient.vitals, heartRate: 128, systolicBP: 92, diastolicBP: 60 },
    };
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
      if (action.objectId === "ambulance-radio") next = applyEvent(next, "RADIO_SELECTED");
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

      const hasRemainingObjectActions = object.actions.some((action) => !hasEvents(next, getActionSuccessEvents(action)));
      const shouldKeepSelection =
        (object.id === "dog" && next.environment.dogAgitated && !next.environment.dogSecured) ||
        (object.id === "medical-bag" && hasRemainingObjectActions);
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
