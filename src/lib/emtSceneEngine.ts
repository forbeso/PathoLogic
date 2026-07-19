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
  | "CRASH_SCENE_INSPECTED"
  | "FIRE_RESCUE_CALLED"
  | "TRAFFIC_CONTROLLED"
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
  outcome?: "correct" | "incorrect";
  feedback?: string;
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
  scenarioId: string;
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
          outcome: "correct",
          onSuccessEvents: ["GENERAL_IMPRESSION_OBSERVED"],
          scoreEffect: 5,
        },
        {
          id: "introduce-yourself",
          label: "Introduce yourself and ask what happened",
          description: "Speak to the patient and assess whether they answer appropriately.",
          outcome: "correct",
          requires: ["GENERAL_IMPRESSION_OBSERVED"],
          onSuccessEvents: ["RESPONSIVENESS_CHECKED"],
          scoreEffect: 5,
        },
        {
          id: "painful-stimulus-alert-patient",
          label: "Apply a painful stimulus",
          description: "Use a trapezius squeeze to assess responsiveness.",
          outcome: "incorrect",
          requires: ["GENERAL_IMPRESSION_OBSERVED"],
          feedback:
            "The patient is already alert and speaking. A painful stimulus is unnecessary; begin with verbal interaction and assess their response.",
          scoreEffect: -3,
          timeEffect: 10,
        },
        {
          id: "skip-responsiveness",
          label: "Skip directly to vital signs",
          description: "Begin equipment-based measurements without speaking to the patient.",
          outcome: "incorrect",
          requires: ["GENERAL_IMPRESSION_OBSERVED"],
          feedback:
            "Responsiveness is part of the primary assessment. Speak to this alert patient first and determine whether their answers are appropriate.",
          scoreEffect: -3,
          timeEffect: 10,
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
          label: "Assess speech and inspect the airway",
          description: "Listen to speech and look for swelling, secretions, or obstruction.",
          outcome: "correct",
          onSuccessEvents: ["AIRWAY_OPENED"],
          scoreEffect: 5,
        },
        {
          id: "insert-opa-alert-patient",
          label: "Insert an oropharyngeal airway",
          description: "Place an OPA before continuing the assessment.",
          outcome: "incorrect",
          feedback:
            "An OPA is contraindicated in an alert patient with an intact gag reflex. The patient is speaking, so assess patency and watch closely for worsening swelling.",
          scoreEffect: -4,
          timeEffect: 12,
        },
        {
          id: "blind-finger-sweep",
          label: "Perform a blind finger sweep",
          description: "Sweep the mouth for a possible unseen obstruction.",
          outcome: "incorrect",
          feedback:
            "There is no visible foreign body, and a blind finger sweep can push material deeper or injure the airway. Inspect the mouth and listen to speech instead.",
          scoreEffect: -4,
          timeEffect: 12,
        },
        {
          id: "immediate-suction",
          label: "Suction the airway immediately",
          description: "Begin suction before checking for fluid or secretions.",
          outcome: "incorrect",
          feedback:
            "No blood, vomit, or secretions are present. Suction is not the first action here; assess the patent but threatened airway for allergic swelling.",
          scoreEffect: -3,
          timeEffect: 10,
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
          label: "Assess effort and count respirations",
          description: "Observe chest rise, rate, depth, effort, and audible breath sounds.",
          outcome: "correct",
          onSuccessEvents: ["RESPIRATIONS_COUNTED"],
          scoreEffect: 5,
        },
        {
          id: "rescue-breaths-spontaneous",
          label: "Begin rescue breaths",
          description: "Ventilate immediately with a bag-mask device.",
          outcome: "incorrect",
          feedback:
            "The patient is breathing spontaneously and speaking. First assess rate, depth, effort, and breath sounds; assisted ventilation is reserved for inadequate breathing.",
          scoreEffect: -4,
          timeEffect: 12,
        },
        {
          id: "walking-tolerance-test",
          label: "Have the patient walk",
          description: "Test exertional tolerance before deciding how severe the breathing problem is.",
          outcome: "incorrect",
          feedback:
            "Exertion could worsen this unstable patient's respiratory distress. Keep them at rest and assess breathing where they are.",
          scoreEffect: -5,
          timeEffect: 15,
        },
        {
          id: "delay-breathing-assessment",
          label: "Obtain blood pressure first",
          description: "Delay the breathing assessment until baseline vital signs are recorded.",
          outcome: "incorrect",
          feedback:
            "Breathing is an immediate primary-assessment priority. Assess respiratory effort before moving to baseline vital signs.",
          scoreEffect: -3,
          timeEffect: 10,
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
          label: "Check radial pulse, skin, and major bleeding",
          description: "Assess pulse quality and rate, skin signs, and scan for life-threatening bleeding.",
          outcome: "correct",
          onSuccessEvents: ["PULSE_CHECKED"],
          scoreEffect: 5,
        },
        {
          id: "temperature-before-circulation",
          label: "Take an oral temperature",
          description: "Measure temperature before checking pulse and perfusion.",
          outcome: "incorrect",
          feedback:
            "Temperature is not the immediate circulation priority. Check pulse, skin signs, perfusion, and major bleeding first.",
          scoreEffect: -3,
          timeEffect: 10,
        },
        {
          id: "skip-circulation-alert",
          label: "Skip circulation because the patient is alert",
          description: "Assume perfusion is adequate based on mental status alone.",
          outcome: "incorrect",
          feedback:
            "An alert patient can still be in shock. This patient is at risk for distributive shock, so pulse quality and skin signs must be assessed.",
          scoreEffect: -5,
          timeEffect: 12,
        },
        {
          id: "carotid-only",
          label: "Check only a carotid pulse",
          description: "Use a central pulse and move on without assessing skin or bleeding.",
          outcome: "incorrect",
          feedback:
            "A radial pulse provides useful perfusion information in this responsive patient. Circulation also includes skin signs and a major-bleeding scan.",
          scoreEffect: -3,
          timeEffect: 10,
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
          outcome: "correct",
          onSuccessEvents: ["TRANSPORT_SELECTED", "SECONDARY_UNLOCKED"],
          scoreEffect: 8,
        },
        {
          id: "non-urgent-transport",
          label: "Routine, non-urgent transport",
          description: "Complete an extended on-scene assessment before leaving.",
          outcome: "incorrect",
          feedback:
            "Wheezing, throat tightness, hypoxemia, and hypotension make this patient high priority. Minimize scene time and transport urgently.",
          scoreEffect: -5,
          timeEffect: 20,
        },
        {
          id: "remain-on-scene",
          label: "Remain on scene for observation",
          description: "Watch for improvement before making a transport decision.",
          outcome: "incorrect",
          feedback:
            "This presentation can deteriorate rapidly. Observation without urgent transport is unsafe for a patient with respiratory compromise and hypotension.",
          scoreEffect: -6,
          timeEffect: 25,
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
          outcome: "correct",
          onSuccessEvents: ["WORKING_IMPRESSION_SELECTED"],
          scoreEffect: 8,
        },
        {
          id: "suspect-panic-attack",
          label: "Suspect a panic attack",
          description: "Attribute the breathing difficulty and anxiety primarily to stress.",
          outcome: "incorrect",
          feedback:
            "Anxiety may be present, but it does not explain hives, throat tightness, wheezing, hypoxemia, and hypotension. This is a severe allergic reaction.",
          scoreEffect: -5,
          timeEffect: 15,
        },
        {
          id: "suspect-isolated-asthma",
          label: "Suspect an isolated asthma attack",
          description: "Treat the wheezing as a respiratory condition without systemic involvement.",
          outcome: "incorrect",
          feedback:
            "Asthma can cause wheezing, but the hives, throat tightness, allergen exposure, and hypotension indicate systemic anaphylaxis.",
          scoreEffect: -4,
          timeEffect: 15,
        },
        {
          id: "suspect-heat-exhaustion",
          label: "Suspect heat exhaustion",
          description: "Connect the outdoor setting, flushing, and weakness to heat illness.",
          outcome: "incorrect",
          feedback:
            "The setting alone should not outweigh the clinical pattern. Hives, airway symptoms, wheezing, and hypotension after food exposure indicate anaphylaxis.",
          scoreEffect: -4,
          timeEffect: 15,
        },
      ],
    },
  ],
};

export const carAccidentScenario: SceneScenarioConfig = {
  id: "car-accident",
  title: "Driver Trapped After Collision",
  dispatch:
    "Single-vehicle collision on a residential roadway. Smoke is coming from the engine compartment and the driver remains inside.",
  sceneReport:
    "A damaged sedan is blocking one lane. Traffic is still moving past the crash, the vehicle is not stabilized, and an adult driver is slumped behind the wheel.",
  startingLocation: "ambulance",
  initialPhase: "sceneSafety",
  currentObjectiveId: "inspect-crash",
  environmentInitialState: {
    dogSecured: true,
    fireControlled: false,
    trafficStopped: false,
    sceneSafe: false,
    dogAgitated: false,
  },
  patientInitialState: {
    workingImpression: undefined,
    responsiveness: "Responds to voice, confused about the collision",
    airwayStatus: "Patent, cervical spine risk present",
    breathingStatus: "Shallow respirations with left chest pain",
    circulationStatus: "Rapid weak radial pulse, pale cool skin",
    position: "driver-seat",
    oxygenApplied: false,
    medicationGiven: [],
    findingsDiscovered: [],
    vitalsRevealed: [],
    vitals: {
      heartRate: 112,
      respiratoryRate: 24,
      systolicBP: 104,
      diastolicBP: 68,
      spo2: 94,
    },
  },
  objectives: [
    {
      id: "inspect-crash",
      label: "Crash Scene Size-Up",
      subtleGoal: "Identify immediate roadway and vehicle hazards before approaching.",
      phase: "sceneSafety",
      requiredEvents: ["CRASH_SCENE_INSPECTED"],
      hintLevels: [
        "Start outside the damaged vehicle.",
        "Look for traffic, smoke, leaking fluids, and vehicle instability.",
        "Select the smoking car and inspect the crash from the ambulance staging point.",
      ],
    },
    {
      id: "request-crash-resources",
      label: "Request Resources",
      subtleGoal: "Request the resources needed to control traffic and stabilize the vehicle.",
      phase: "sceneSafety",
      requiredEvents: ["RADIO_SELECTED", "FIRE_RESCUE_CALLED"],
      hintLevels: [
        "Do not enter an uncontrolled crash scene alone.",
        "Fire-rescue and police are needed.",
        "Rotate to the ambulance radio and request fire-rescue and police.",
      ],
    },
    {
      id: "secure-crash-scene",
      label: "Roadway Secured",
      subtleGoal: "Wait until traffic is stopped and the vehicle is stabilized.",
      phase: "sceneSafety",
      requiredEvents: ["TRAFFIC_CONTROLLED"],
      hintLevels: [
        "Hold at staging while support controls the hazards.",
        "The vehicle and traffic must be secured first.",
        "Wait for police and fire-rescue to finish scene control.",
      ],
    },
    {
      id: "bsi-ppe",
      label: "BSI / PPE",
      subtleGoal: "Open the medical bag and equip gloves before patient contact.",
      phase: "primaryAssessment",
      requiredEvents: ["GLOVES_EQUIPPED"],
      hintLevels: ["Prepare PPE at the ambulance.", "Open the medical bag.", "Put on gloves before approaching the driver."],
    },
    {
      id: "approach-patient",
      label: "Approach Driver",
      subtleGoal: "Bring the aid bag to the secured driver side.",
      phase: "primaryAssessment",
      requiredEvents: ["PATIENT_APPROACHED"],
      hintLevels: ["Use the protected shoulder.", "Approach on the stabilized driver side.", "Select the approach point beside the driver door."],
    },
    {
      id: "general-impression",
      label: "General Impression",
      subtleGoal: "Form an initial impression from mechanism and visible findings.",
      phase: "primaryAssessment",
      requiredEvents: ["GENERAL_IMPRESSION_OBSERVED"],
      hintLevels: ["Consider the collision mechanism and patient position.", "Look for pallor, guarding, and mentation.", "Select the driver and observe the general impression."],
    },
    {
      id: "responsiveness",
      label: "Responsiveness",
      subtleGoal: "Determine how the driver responds without unnecessary movement.",
      phase: "primaryAssessment",
      requiredEvents: ["RESPONSIVENESS_CHECKED"],
      hintLevels: ["Begin verbally.", "Ask the driver to remain still and identify themselves.", "Use the patient interaction menu."],
    },
    {
      id: "airway",
      label: "Airway With Spinal Precautions",
      subtleGoal: "Assess airway while protecting the cervical spine.",
      phase: "primaryAssessment",
      requiredEvents: ["AIRWAY_OPENED"],
      hintLevels: ["The mechanism creates spinal risk.", "Stabilize the head before manipulating the airway.", "Use manual stabilization and a jaw-thrust assessment."],
    },
    {
      id: "breathing",
      label: "Breathing",
      subtleGoal: "Assess chest movement, effort, and injury.",
      phase: "primaryAssessment",
      requiredEvents: ["RESPIRATIONS_COUNTED"],
      hintLevels: ["Inspect the chest after airway.", "Compare chest movement and count respirations.", "Select the chest hotspot."],
    },
    {
      id: "circulation",
      label: "Circulation",
      subtleGoal: "Assess pulse, perfusion, and major bleeding.",
      phase: "primaryAssessment",
      requiredEvents: ["PULSE_CHECKED"],
      hintLevels: ["Trauma patients can compensate before pressure falls.", "Check pulse, skin, and major bleeding.", "Select the wrist hotspot."],
    },
    {
      id: "baseline-vitals",
      label: "Baseline Vitals",
      subtleGoal: "Obtain baseline blood pressure and oxygen saturation.",
      phase: "primaryAssessment",
      requiredEvents: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      hintLevels: ["Use monitoring equipment after the ABCs.", "Record perfusion and oxygenation.", "Use the BP cuff and pulse oximeter."],
    },
    {
      id: "working-impression",
      label: "Working Impression",
      subtleGoal: "Identify the likely trauma pattern from mechanism and findings.",
      phase: "primaryAssessment",
      requiredEvents: ["WORKING_IMPRESSION_SELECTED"],
      hintLevels: ["Do not anchor on one painful area.", "Consider spine, chest, and internal injury.", "Choose multisystem trauma with possible compensated shock."],
    },
    {
      id: "transport-priority",
      label: "Transport Priority",
      subtleGoal: "Choose urgency and destination for the trapped trauma patient.",
      phase: "primaryAssessment",
      requiredEvents: ["TRANSPORT_SELECTED"],
      hintLevels: ["Use mechanism, mentation, breathing, and perfusion.", "Coordinate extrication while minimizing scene time.", "Choose rapid transport to an appropriate trauma center."],
    },
  ],
  interactiveObjects: [
    {
      id: "crash-vehicle",
      name: "Smoking Crash Vehicle",
      category: "hazard",
      visibleWhen: ["DISPATCH_RECEIVED"],
      completedWhen: ["CRASH_SCENE_INSPECTED"],
      position: [2.6, 1.15, 0],
      focusPosition: [-2.2, 2.7, 7.4],
      focusTarget: [2.4, 0.95, 0],
      highlightColor: "#fb923c",
      actions: [
        {
          id: "inspect-crash-from-distance",
          label: "Inspect from a safe distance",
          description: "Scan traffic, smoke, vehicle position, leaking fluids, and access routes.",
          outcome: "correct",
          successEvents: ["CRASH_SCENE_INSPECTED"],
          scoreEffect: 5,
          timeEffect: 8,
        },
        {
          id: "rush-to-driver",
          label: "Run directly to the driver",
          description: "Cross the active lane and enter the unstable vehicle immediately.",
          outcome: "incorrect",
          feedback:
            "Moving traffic, engine smoke, and an unstabilized vehicle make that approach unsafe. Complete the scene size-up and request specialized resources first.",
          scoreEffect: -8,
          timeEffect: 20,
        },
        {
          id: "open-smoking-hood",
          label: "Open the smoking hood",
          description: "Approach the engine compartment to investigate the smoke.",
          outcome: "incorrect",
          feedback:
            "Do not place yourself over a smoking engine compartment. Keep distance, identify the hazards, and request fire-rescue.",
          scoreEffect: -6,
          timeEffect: 15,
        },
      ],
    },
    {
      id: "ambulance-radio",
      name: "Ambulance Radio",
      category: "vehicle",
      visibleWhen: ["CRASH_SCENE_INSPECTED"],
      completedWhen: ["TRAFFIC_CONTROLLED"],
      position: [-0.9, 2.25, 2.65],
      focusPosition: [2.4, 2.35, 5.7],
      focusTarget: [-0.85, 1.85, 2.55],
      highlightColor: "#2dd4bf",
      actions: [
        {
          id: "request-fire-rescue",
          label: "Request fire-rescue and police",
          description: "Request traffic control, vehicle stabilization, and extrication support.",
          requires: ["RADIO_SELECTED"],
          successEvents: ["FIRE_RESCUE_CALLED"],
          scoreEffect: 10,
          timeEffect: 35,
        },
      ],
    },
    {
      id: "medical-bag",
      name: "Medical Bag",
      category: "equipment",
      visibleWhen: ["TRAFFIC_CONTROLLED"],
      completedWhen: ["GLOVES_EQUIPPED"],
      position: [-0.38, 0.55, 4.08],
      focusPosition: [1.8, 1.7, 6.8],
      focusTarget: [-0.38, 0.45, 4.08],
      highlightColor: "#5eead4",
      enabledWhen: ["TRAFFIC_CONTROLLED"],
      actions: [
        {
          id: "open-medical-bag",
          label: "Open medical bag",
          description: "Open the aid bag and locate PPE before entering the crash area.",
          successEvents: ["MEDICAL_BAG_OPENED"],
          scoreEffect: 3,
        },
        {
          id: "equip-gloves",
          label: "Put on gloves",
          description: "Complete BSI/PPE before touching the driver.",
          requires: ["MEDICAL_BAG_OPENED"],
          successEvents: ["GLOVES_EQUIPPED", "PPE_EQUIPPED"],
          scoreEffect: 6,
        },
      ],
    },
    {
      id: "patient-approach",
      name: "Approach Driver",
      category: "movement",
      visibleWhen: ["PPE_EQUIPPED"],
      completedWhen: ["PATIENT_APPROACHED"],
      position: [1.25, 0.12, 2.15],
      focusPosition: [7.4, 3.3, 7.8],
      focusTarget: [2.25, 1.0, 0.35],
      highlightColor: "#67e8f9",
      enabledWhen: ["TRAFFIC_CONTROLLED", "PPE_EQUIPPED"],
      actions: [
        {
          id: "approach-driver",
          label: "Move to the driver side",
          description: "Bring the aid bag along the protected shoulder to the stabilized vehicle.",
          onSuccessEvents: ["PATIENT_APPROACHED"],
          scoreEffect: 4,
        },
      ],
    },
    {
      id: "patient",
      name: "Trapped Driver",
      category: "patient",
      visibleWhen: ["PATIENT_APPROACHED"],
      completedWhen: ["RESPONSIVENESS_CHECKED"],
      position: [2.0, 1.45, 0.62],
      focusPosition: [5.9, 2.8, 5.3],
      focusTarget: [2.0, 1.25, 0.45],
      highlightColor: "#fda4af",
      enabledWhen: ["PATIENT_APPROACHED"],
      actions: [
        {
          id: "observe-trauma-impression",
          label: "Observe mechanism and general impression",
          description: "Driver slumped, pale, confused, guarding the left chest, with significant frontal vehicle damage.",
          outcome: "correct",
          onSuccessEvents: ["GENERAL_IMPRESSION_OBSERVED"],
          scoreEffect: 5,
        },
        {
          id: "verbal-responsiveness-trauma",
          label: "Introduce yourself and ask the driver to remain still",
          description: "Use verbal interaction to assess orientation while limiting cervical movement.",
          outcome: "correct",
          requires: ["GENERAL_IMPRESSION_OBSERVED"],
          onSuccessEvents: ["RESPONSIVENESS_CHECKED"],
          scoreEffect: 5,
        },
        {
          id: "pull-driver-out",
          label: "Pull the driver out immediately",
          description: "Remove the patient before fire-rescue completes a controlled extrication.",
          outcome: "incorrect",
          requires: ["GENERAL_IMPRESSION_OBSERVED"],
          feedback:
            "There is no immediate fire or airway failure requiring emergency movement. Uncontrolled removal can worsen spinal and internal injuries; assess and coordinate extrication.",
          scoreEffect: -7,
          timeEffect: 15,
        },
        {
          id: "shake-driver",
          label: "Shake the driver's shoulders",
          description: "Use physical movement to test responsiveness.",
          outcome: "incorrect",
          requires: ["GENERAL_IMPRESSION_OBSERVED"],
          feedback:
            "The collision mechanism creates cervical spine risk. Begin with voice and avoid moving the head, neck, or shoulders.",
          scoreEffect: -5,
          timeEffect: 10,
        },
      ],
    },
    {
      id: "airway-hotspot",
      name: "Airway",
      category: "patient",
      visibleWhen: ["RESPONSIVENESS_CHECKED"],
      position: [1.72, 1.58, 0.62],
      focusPosition: [4.4, 2.45, 4.0],
      focusTarget: [1.72, 1.5, 0.58],
      highlightColor: "#fbbf24",
      enabledWhen: ["RESPONSIVENESS_CHECKED"],
      actions: [
        {
          id: "jaw-thrust-with-stabilization",
          label: "Stabilize the head and assess with a jaw-thrust",
          description: "Maintain manual cervical stabilization while checking speech, the mouth, and airway patency.",
          outcome: "correct",
          onSuccessEvents: ["AIRWAY_OPENED"],
          scoreEffect: 6,
        },
        {
          id: "head-tilt-trauma",
          label: "Use a head-tilt chin-lift",
          description: "Extend the neck to open the airway.",
          outcome: "incorrect",
          feedback:
            "Use a jaw-thrust while maintaining manual stabilization when trauma suggests cervical spine injury. Avoid unnecessary neck extension.",
          scoreEffect: -5,
          timeEffect: 12,
        },
        {
          id: "remove-driver-for-airway",
          label: "Remove the driver before checking the airway",
          description: "Delay airway assessment until the patient is outside the vehicle.",
          outcome: "incorrect",
          feedback:
            "Airway is assessed immediately where the patient is found. Maintain stabilization and assess patency while extrication is prepared.",
          scoreEffect: -5,
          timeEffect: 12,
        },
      ],
    },
    {
      id: "chest-hotspot",
      name: "Chest / Breathing",
      category: "patient",
      visibleWhen: ["AIRWAY_OPENED"],
      position: [2.15, 1.28, 0.72],
      focusPosition: [5.0, 2.55, 4.4],
      focusTarget: [2.15, 1.22, 0.65],
      highlightColor: "#38bdf8",
      enabledWhen: ["AIRWAY_OPENED"],
      actions: [
        {
          id: "assess-trauma-breathing",
          label: "Expose and assess chest movement and breathing",
          description: "Count respirations and compare chest rise, effort, tenderness, and visible injury.",
          outcome: "correct",
          onSuccessEvents: ["RESPIRATIONS_COUNTED"],
          scoreEffect: 5,
        },
        {
          id: "sit-driver-up",
          label: "Sit the driver upright",
          description: "Reposition the patient to make breathing easier.",
          outcome: "incorrect",
          feedback:
            "Avoid unnecessary movement with a significant mechanism and possible spinal injury. Assess breathing in position while maintaining stabilization.",
          scoreEffect: -5,
          timeEffect: 12,
        },
        {
          id: "skip-chest-assessment",
          label: "Skip to blood pressure",
          description: "Use the monitor before inspecting breathing and chest movement.",
          outcome: "incorrect",
          feedback:
            "Breathing and chest injury are immediate primary-assessment priorities after airway. Assess them before baseline vital signs.",
          scoreEffect: -4,
          timeEffect: 10,
        },
      ],
    },
    {
      id: "pulse-hotspot",
      name: "Radial Pulse",
      category: "patient",
      visibleWhen: ["RESPIRATIONS_COUNTED"],
      position: [2.38, 1.05, 0.78],
      focusPosition: [5.1, 2.25, 4.2],
      focusTarget: [2.3, 1.0, 0.72],
      highlightColor: "#f472b6",
      enabledWhen: ["RESPIRATIONS_COUNTED"],
      actions: [
        {
          id: "assess-trauma-circulation",
          label: "Check pulse, skin, perfusion, and major bleeding",
          description: "Assess radial pulse and skin while scanning for life-threatening external hemorrhage.",
          outcome: "correct",
          onSuccessEvents: ["PULSE_CHECKED"],
          scoreEffect: 5,
        },
        {
          id: "assume-no-shock",
          label: "Rule out shock because the patient is talking",
          description: "Treat normal speech as proof of adequate perfusion.",
          outcome: "incorrect",
          feedback:
            "Trauma patients can remain responsive during compensated shock. Assess pulse quality, skin, perfusion, and bleeding.",
          scoreEffect: -5,
          timeEffect: 12,
        },
        {
          id: "check-carotid-only-trauma",
          label: "Check only a carotid pulse",
          description: "Confirm a central pulse and move on.",
          outcome: "incorrect",
          feedback:
            "A radial pulse and skin signs add important perfusion information in this responsive patient. Also scan for major bleeding.",
          scoreEffect: -3,
          timeEffect: 10,
        },
      ],
    },
    {
      id: "working-impression",
      name: "Working Impression",
      category: "patient",
      visibleWhen: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      completedWhen: ["WORKING_IMPRESSION_SELECTED"],
      position: [2.8, 1.25, 0.85],
      focusPosition: [5.6, 2.7, 4.8],
      focusTarget: [2.2, 1.2, 0.6],
      highlightColor: "#f0abfc",
      enabledWhen: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      actions: [
        {
          id: "multisystem-trauma",
          label: "Suspect multisystem trauma",
          description: "Mechanism, confusion, neck pain, chest pain, shallow breathing, tachycardia, and pallor suggest multiple serious injuries.",
          outcome: "correct",
          onSuccessEvents: ["WORKING_IMPRESSION_SELECTED"],
          scoreEffect: 8,
        },
        {
          id: "isolated-anxiety-crash",
          label: "Suspect anxiety only",
          description: "Attribute the abnormal findings to fear after the crash.",
          outcome: "incorrect",
          feedback:
            "Anxiety does not explain the significant mechanism, confusion, chest guarding, shallow breathing, weak tachycardic pulse, and pallor.",
          scoreEffect: -5,
          timeEffect: 15,
        },
        {
          id: "isolated-neck-strain",
          label: "Suspect an isolated neck strain",
          description: "Treat the complaint as a minor musculoskeletal injury.",
          outcome: "incorrect",
          feedback:
            "The patient has multisystem findings beyond neck pain. Maintain a broad trauma impression until serious chest, spine, and internal injuries are excluded.",
          scoreEffect: -5,
          timeEffect: 15,
        },
      ],
    },
    {
      id: "transport-decision",
      name: "Transport Decision",
      category: "movement",
      visibleWhen: ["WORKING_IMPRESSION_SELECTED"],
      position: [3.85, 0.16, 2.0],
      focusPosition: [7.2, 3.2, 6.4],
      focusTarget: [2.3, 1.05, 0.45],
      highlightColor: "#a7f3d0",
      enabledWhen: ["PULSE_CHECKED"],
      actions: [
        {
          id: "rapid-trauma-transport",
          label: "Rapid transport to an appropriate trauma center",
          description: "Coordinate controlled extrication, spinal motion restriction, and rapid transport with ongoing reassessment.",
          outcome: "correct",
          onSuccessEvents: ["TRANSPORT_SELECTED", "SECONDARY_UNLOCKED"],
          scoreEffect: 8,
        },
        {
          id: "routine-transport-crash",
          label: "Routine non-urgent transport",
          description: "Complete a prolonged roadside assessment before leaving.",
          outcome: "incorrect",
          feedback:
            "The significant mechanism, altered mentation, chest findings, and perfusion concerns make this patient high priority. Minimize scene time.",
          scoreEffect: -6,
          timeEffect: 20,
        },
        {
          id: "refuse-transport-for-driver",
          label: "Allow the confused driver to decline transport",
          description: "Accept refusal immediately because the patient is speaking.",
          outcome: "incorrect",
          feedback:
            "Confusion after a significant collision raises concern for impaired decision-making and serious injury. Continue emergency care and rapid transport.",
          scoreEffect: -7,
          timeEffect: 20,
        },
      ],
    },
  ],
};

export function createScenarioState(scenario: SceneScenarioConfig = anaphylaxisFestivalScenario): ScenarioState {
  return {
    scenarioId: scenario.id,
    currentPhase: scenario.initialPhase,
    currentObjectiveId: scenario.currentObjectiveId,
    completedObjectives: [],
    failedObjectives: [],
    triggeredEvents: ["DISPATCH_RECEIVED"],
    selectedObjectId: undefined,
    focusedObjectId: scenario.interactiveObjects.find((object) =>
      (object.visibleWhen ?? []).every((event) => event === "DISPATCH_RECEIVED")
    )?.id,
    inventory: [],
    equippedItems: [],
    elapsedTime: 0,
    score: 80,
    hintsUsed: 0,
    feedback: scenario.dispatch,
    locationId: scenario.startingLocation,
    accessibilityMode: false,
    environment: { ...scenario.environmentInitialState },
    patient: {
      ...scenario.patientInitialState,
      medicationGiven: [...scenario.patientInitialState.medicationGiven],
      findingsDiscovered: [...scenario.patientInitialState.findingsDiscovered],
      vitalsRevealed: [...scenario.patientInitialState.vitalsRevealed],
      vitals: { ...scenario.patientInitialState.vitals },
    },
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
  return object.actions.some((action) => {
    const successEvents = getActionSuccessEvents(action);
    return successEvents.length > 0 && hasEvents(state, successEvents);
  });
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
  if (object.enabledWhen?.includes("TRAFFIC_CONTROLLED") && !state.environment.trafficStopped) {
    return { enabled: false, reason: "Wait for fire-rescue and police to control the roadway and stabilize the vehicle." };
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

function feedbackForEvent(event: SceneEvent, state: ScenarioState): string {
  const isCrash = state.scenarioId === "car-accident";

  switch (event) {
    case "AMBULANCE_EXITED":
      return "You step out and scan the scene from a safe distance. The dog is actively blocking the patient.";
    case "DOG_SELECTED":
      return "The dog is barking, tense, and between you and the patient.";
    case "DOG_INSPECTED":
      return "Hazard identified: the dog is blocking safe patient access. Rotate the scene to find the highlighted ambulance radio.";
    case "DOG_AGITATED":
      return "The dog lunges closer. You step back and lose time. The patient is still not safely reachable.";
    case "CAR_INSPECTED":
      return "Vehicle checked from a safe distance. Smoke is present, but this patient appears to be a separate medical call.";
    case "CRASH_SCENE_INSPECTED":
      return "Crash hazards identified: moving traffic, an unstable vehicle, and smoke from the engine compartment. Use the ambulance radio for fire-rescue and police.";
    case "FIRE_RESCUE_CALLED":
      return "Dispatch confirms fire-rescue and police are responding. Hold at the ambulance until the roadway and vehicle are secured.";
    case "TRAFFIC_CONTROLLED":
      return "Police stop traffic while fire-rescue chocks the vehicle and disconnects power. The driver-side approach is now safe.";
    case "BYSTANDERS_QUESTIONED":
      return "Bystanders report itching, trouble breathing, and sudden fear after the teen ate dessert.";
    case "RADIO_SELECTED":
      return "Radio selected. Contact dispatch before approaching the dog or patient.";
    case "ANIMAL_CONTROL_CALLED":
      return "Radio: Animal control and police support are en route. Hold position until the dog is secured.";
    case "DOG_SECURED":
      return "The dog is secured and the path is safe. Rotate the scene to find the highlighted medical bag and put on gloves.";
    case "MEDICAL_BAG_OPENED":
      return "The medical bag is open. Gloves are visible inside.";
    case "GLOVES_EQUIPPED":
      return "Gloves on. BSI/PPE is complete before patient contact.";
    case "PPE_EQUIPPED":
      return "Gloves on. BSI/PPE is complete before patient contact.";
    case "PATIENT_APPROACHED":
      return isCrash
        ? "You bring the aid bag to the driver side and approach from the secured shoulder."
        : "You move to the patient's side using the safe approach path.";
    case "GENERAL_IMPRESSION_OBSERVED":
      return isCrash
        ? "General impression: adult driver slumped behind the wheel, pale, confused, and guarding the left chest."
        : "General impression: anxious teen, hives, flushed skin, increased work of breathing.";
    case "RESPONSIVENESS_CHECKED":
      return isCrash
        ? "Patient: I can hear you. My chest and neck hurt. I do not remember the impact."
        : "Patient: I can talk, but my throat feels tight and breathing is hard.";
    case "AIRWAY_OPENED":
      return isCrash
        ? "Manual stabilization maintained. Airway is patent with no visible obstruction or secretions."
        : "Airway is patent. No visible obstruction. Patient reports throat tightness.";
    case "RESPIRATIONS_COUNTED":
      return isCrash
        ? "Breathing: RR 24, shallow respirations, guarded left chest movement, and pain with inspiration."
        : "Breathing: RR 28, wheezing, shallow but present chest rise.";
    case "PULSE_CHECKED":
      return isCrash
        ? "Circulation: rapid weak radial pulse 112, pale cool skin, and no uncontrolled external bleeding."
        : "Circulation: rapid radial pulse 128. Skin is warm, flushed, with widespread hives.";
    case "BLOOD_PRESSURE_OBTAINED":
      return isCrash
        ? "Blood pressure obtained: 104/68. The trend and mechanism still support possible compensated shock."
        : "Blood pressure obtained: 92/60. This supports poor perfusion.";
    case "SPO2_OBTAINED":
      return isCrash
        ? "Pulse oximeter reading obtained: SpO2 94%. Continue monitoring breathing and perfusion."
        : "Pulse oximeter reading obtained: SpO2 89%. Oxygenation is inadequate.";
    case "WORKING_IMPRESSION_SELECTED":
      return isCrash
        ? "Working impression: multisystem trauma with possible cervical spine, chest, and internal injuries."
        : "Working impression: severe allergic reaction with respiratory compromise and shock signs.";
    case "TRANSPORT_SELECTED":
      return isCrash
        ? "Rapid trauma transport selected. Maintain spinal motion restriction and coordinate extrication with fire-rescue."
        : "Urgent transport selected. Primary assessment is complete; secondary assessment is now unlocked.";
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
  const isCrash = state.scenarioId === "car-accident";

  const next: ScenarioState = {
    ...state,
    triggeredEvents: [...state.triggeredEvents, event],
    feedback: feedbackForEvent(event, state),
  };

  if (event === "AMBULANCE_EXITED") {
    next.locationId = "roadside";
    next.focusedObjectId = "dog";
  }
  if (event === "DOG_SELECTED") next.focusedObjectId = "dog";
  if (event === "DOG_INSPECTED") next.focusedObjectId = "ambulance-radio";
  if (event === "CRASH_SCENE_INSPECTED") next.focusedObjectId = "ambulance-radio";
  if (event === "FIRE_RESCUE_CALLED") next.focusedObjectId = "crash-vehicle";
  if (event === "TRAFFIC_CONTROLLED") {
    next.environment = {
      ...next.environment,
      trafficStopped: true,
      fireControlled: true,
      sceneSafe: true,
    };
    next.focusedObjectId = "medical-bag";
  }
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
      findingsDiscovered: addFinding(
        next,
        isCrash
          ? "Adult driver slumped in the seat with pallor, confusion, and guarded left chest movement"
          : "Anxious teen with visible hives and increased work of breathing"
      ),
    };
  }
  if (event === "RESPONSIVENESS_CHECKED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(
        next,
        isCrash
          ? "Responds to voice, confused about the collision, reports neck and chest pain"
          : "Alert, speaking in short phrases, reports throat tightness"
      ),
    };
  }
  if (event === "AIRWAY_OPENED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(
        next,
        isCrash
          ? "Airway patent while manual cervical stabilization is maintained"
          : "Airway patent with reported throat tightness"
      ),
    };
  }
  if (event === "RESPIRATIONS_COUNTED") {
    next.patient = {
      ...next.patient,
      breathingStatus: isCrash
        ? "Shallow respirations, RR 24, guarded left chest movement"
        : "Wheezing, RR 28, increased work of breathing",
      findingsDiscovered: addFinding(
        next,
        isCrash
          ? "Shallow breathing with left chest pain and guarded movement"
          : "Wheezing with increased work of breathing"
      ),
      vitalsRevealed: revealVital(next, "respiratoryRate"),
      vitals: {
        ...next.patient.vitals,
        respiratoryRate: isCrash ? 24 : 28,
        spo2: isCrash ? 94 : 89,
      },
    };
  }
  if (event === "PULSE_CHECKED") {
    next.patient = {
      ...next.patient,
      circulationStatus: isCrash
        ? "Rapid weak radial pulse, pale cool skin, no uncontrolled external bleeding"
        : "Rapid radial pulse, warm flushed skin, hives",
      findingsDiscovered: addFinding(
        next,
        isCrash
          ? "Rapid weak radial pulse with pale cool skin and no uncontrolled external bleeding"
          : "Rapid radial pulse with warm flushed skin and hives"
      ),
      vitalsRevealed: revealVital(next, "heartRate"),
      vitals: {
        ...next.patient.vitals,
        heartRate: isCrash ? 112 : 128,
        systolicBP: isCrash ? 104 : 92,
        diastolicBP: isCrash ? 68 : 60,
      },
    };
  }
  if (event === "BLOOD_PRESSURE_OBTAINED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(
        next,
        isCrash ? "Blood pressure 104/68 with possible compensated shock" : "Hypotension: BP 92/60"
      ),
      vitalsRevealed: revealVital({ ...next, patient: { ...next.patient, vitalsRevealed: revealVital(next, "systolicBP") } }, "diastolicBP"),
    };
    next.focusedObjectId = "patient";
  }
  if (event === "SPO2_OBTAINED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(next, isCrash ? "SpO2 94% on room air" : "Low SpO2: 89%"),
      vitalsRevealed: revealVital(next, "spo2"),
    };
    next.focusedObjectId = "working-impression";
  }
  if (event === "WORKING_IMPRESSION_SELECTED") {
    next.patient = {
      ...next.patient,
      workingImpression: isCrash
        ? "Multisystem trauma with possible cervical spine, chest, and internal injuries"
        : "Severe allergic reaction with respiratory compromise and shock signs",
      findingsDiscovered: addFinding(
        next,
        isCrash
          ? "Working impression selected from mechanism, altered mentation, chest pain, and perfusion findings"
          : "Working impression selected from hives, wheezing, hypoxia, and hypotension"
      ),
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
        next = applyEvent(
          next,
          state.scenarioId === "car-accident" ? "FIRE_RESCUE_CALLED" : "ANIMAL_CONTROL_CALLED"
        );
        next = {
          ...next,
          elapsedTime: next.elapsedTime + (state.scenarioId === "car-accident" ? 35 : 45),
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

      if (interaction.outcome === "incorrect") {
        const maxScore = state.failedObjectives.includes("dog-hazard") ? 88 : 100;
        return {
          ...state,
          selectedObjectId: object.id,
          focusedObjectId: object.id,
          feedback:
            interaction.feedback ??
            "That action does not fit the patient's current presentation. Reassess and choose another option.",
          elapsedTime: state.elapsedTime + (interaction.timeEffect ?? 10),
          score: Math.max(0, Math.min(maxScore, state.score + (interaction.scoreEffect ?? -3))),
        };
      }

      let next = state;
      getActionSuccessEvents(interaction).forEach((event) => {
        next = applyEvent(next, event);
      });

      const hasRemainingObjectActions = object.actions.some(
        (action) => {
          const successEvents = getActionSuccessEvents(action);
          return successEvents.length > 0 && !hasEvents(next, successEvents) && hasEvents(next, action.requires);
        }
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
  const isCrash = state.scenarioId === carAccidentScenario.id;
  const unsafeDog = state.failedObjectives.includes("dog-hazard");
  const unsafeCrash = state.failedObjectives.includes("crash-hazard");
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
    safety: isCrash
      ? Math.max(
          55,
          100 -
            (unsafeCrash ? 28 : 0) -
            (state.triggeredEvents.includes("CRASH_SCENE_INSPECTED") ? 0 : 18)
        )
      : Math.max(
          55,
          100 -
            (unsafeDog ? 28 : 0) -
            (state.triggeredEvents.includes("DOG_INSPECTED") ? 0 : 18)
        ),
    assessment: Math.round((completedAssessment / assessmentEvents.length) * 100),
    clinicalDecisions: state.triggeredEvents.includes("WORKING_IMPRESSION_SELECTED")
      ? state.triggeredEvents.includes("TRANSPORT_SELECTED")
        ? 94
        : 82
      : 45,
    treatment: state.triggeredEvents.includes("TRANSPORT_SELECTED") ? 72 : 35,
    reassessment: state.currentPhase === "secondaryAssessment" ? 55 : 0,
    communication: state.triggeredEvents.includes(
      isCrash ? "FIRE_RESCUE_CALLED" : "ANIMAL_CONTROL_CALLED"
    )
      ? 90
      : 52,
    efficiency: Math.max(
      45,
      100 -
        state.hintsUsed * 6 -
        Math.floor(state.elapsedTime / 60) * 3 -
        (isCrash ? (unsafeCrash ? 14 : 0) : unsafeDog ? 14 : 0)
    ),
  };
}

export function buildScenarioDebrief(state: ScenarioState) {
  const isCrash = state.scenarioId === carAccidentScenario.id;
  const score = getScenarioScoreBreakdown(state);
  const correct: string[] = [];
  const missed: string[] = [];
  const unsafe: string[] = [];

  if (isCrash) {
    if (state.triggeredEvents.includes("CRASH_SCENE_INSPECTED")) {
      correct.push("Identified traffic, vehicle instability, and smoke before approaching the driver.");
    } else {
      missed.push("The collision scene was not inspected from a safe position.");
    }

    if (state.triggeredEvents.includes("FIRE_RESCUE_CALLED")) {
      correct.push("Requested fire-rescue, police, and traffic control before entering the roadway.");
    } else {
      missed.push("Additional collision resources were not requested.");
    }
  } else {
    if (state.triggeredEvents.includes("DOG_INSPECTED")) {
      correct.push("Identified the dog as a scene safety hazard before patient contact.");
    } else {
      missed.push("Scene hazard inspection was not completed.");
    }

    if (state.triggeredEvents.includes("ANIMAL_CONTROL_CALLED")) {
      correct.push("Requested animal control/police support instead of entering an unsafe scene.");
    } else {
      missed.push("Additional resources were not requested for the animal hazard.");
    }
  }

  if (state.triggeredEvents.includes("GLOVES_EQUIPPED")) correct.push("Equipped PPE before touching the patient.");
  else missed.push("PPE was not equipped before patient contact.");

  if (state.triggeredEvents.includes("BLOOD_PRESSURE_OBTAINED") && state.triggeredEvents.includes("SPO2_OBTAINED")) {
    correct.push("Obtained baseline BP and SpO2 after the ABC assessment.");
  } else {
    missed.push("Baseline vital signs were incomplete.");
  }

  if (state.triggeredEvents.includes("WORKING_IMPRESSION_SELECTED")) {
    correct.push(
      isCrash
        ? "Formed a trauma working impression from the mechanism, confusion, and chest and neck findings."
        : "Formed a working impression from hives, wheezing, hypoxia, and hypotension."
    );
  } else {
    missed.push("Working impression was not selected from the gathered findings.");
  }

  if (isCrash && state.failedObjectives.includes("crash-hazard")) {
    unsafe.push("Entered the active roadway or approached the unstable vehicle before hazards were controlled.");
  } else if (state.failedObjectives.includes("dog-hazard")) {
    unsafe.push("Approached or ignored the dog before the scene was controlled, costing time and access.");
  }

  return {
    score,
    correct,
    missed,
    unsafe,
    findings: state.patient.findingsDiscovered,
    summary:
      state.triggeredEvents.includes("TRANSPORT_SELECTED")
        ? isCrash
          ? "Primary trauma assessment complete: significant mechanism, altered mentation, and chest and neck findings support rapid transport to a trauma center."
          : "Primary assessment complete: respiratory distress, skin findings, hypoxia, and hypotension support urgent transport and rapid treatment."
        : "Scenario in progress. Continue collecting assessment findings before choosing transport priority.",
  };
}
