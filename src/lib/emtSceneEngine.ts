import {
  COLLISION_RADIO_POSITION,
  FESTIVAL_RADIO_POSITION,
} from "@/lib/emtSceneLayout";

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
  | "CRASH_HAZARD_BREACHED"
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
  | "SECONDARY_UNLOCKED"
  | "EPINEPHRINE_ADMINISTERED"
  | "SCENARIO_MEDICATION_ADMINISTERED"
  | "OXYGEN_APPLIED"
  | "SPINAL_PRECAUTIONS_MAINTAINED"
  | "EXTRICATION_COORDINATED"
  | "FOCUSED_HISTORY_OBTAINED"
  | "FOCUSED_EXAM_COMPLETED"
  | "REASSESSMENT_COMPLETED";

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

export type ScenarioDecision = {
  objectId: string;
  objectName: string;
  actionId: string;
  actionLabel: string;
  outcome: "correct" | "incorrect";
  feedback?: string;
  phase: ScenarioPhase;
  objectiveId: string;
  elapsedTime: number;
};

export type ScenarioState = {
  scenarioId: string;
  currentPhase: ScenarioPhase;
  currentObjectiveId: string;
  completedObjectives: string[];
  failedObjectives: string[];
  triggeredEvents: SceneEvent[];
  decisionHistory: ScenarioDecision[];
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

type AdditionalMedicalScenarioId = "hypoglycemia" | "opioid-overdose" | "chest-pain";

type AdditionalMedicalProfile = {
  id: AdditionalMedicalScenarioId;
  title: string;
  dispatch: string;
  sceneReport: string;
  responsiveness: string;
  airway: string;
  breathing: string;
  circulation: string;
  generalImpression: string;
  patientReply: string;
  vitals: PatientVitals;
  impression: string;
  impressionDistractors: [string, string];
  medication: string;
  medicationLabel: string;
  medicationDescription: string;
  medicationDistractors: [
    { label: string; feedback: string },
    { label: string; feedback: string },
  ];
  airwayAction: string;
  airwayDescription: string;
  airwayDistractors: [
    { label: string; feedback: string },
    { label: string; feedback: string },
  ];
  breathingAction: string;
  breathingDescription: string;
  breathingDistractors: [
    { label: string; feedback: string },
    { label: string; feedback: string },
  ];
  circulationAction: string;
  history: string;
  exam: string;
  reassessment: string;
  reassessedVitals: PatientVitals;
  requiresBreathingSupport: boolean;
  breathingSupportLabel?: string;
  breathingSupportDescription?: string;
};

const ADDITIONAL_MEDICAL_PROFILES: Record<AdditionalMedicalScenarioId, AdditionalMedicalProfile> = {
  hypoglycemia: {
    id: "hypoglycemia",
    title: "Diabetic With Altered Mental Status",
    dispatch:
      "Adult with confusion and weakness near the festival information booth. No trauma is reported.",
    sceneReport:
      "The patient is on the grass beside a bench. The area is calm, no hazards are visible, and a friend reports the patient has diabetes.",
    responsiveness: "Responds to voice, confused, follows simple commands",
    airway: "Patent with an intact gag reflex",
    breathing: "Adequate, regular respirations",
    circulation: "Rapid radial pulse, pale cool diaphoretic skin",
    generalImpression:
      "Adult on the ground, confused and weak, with pale diaphoretic skin and no visible trauma.",
    patientReply: "Patient: I feel shaky. I took my insulin, but I did not eat lunch.",
    vitals: {
      heartRate: 108,
      respiratoryRate: 18,
      systolicBP: 110,
      diastolicBP: 70,
      spo2: 97,
    },
    impression: "Symptomatic hypoglycemia with altered mental status",
    impressionDistractors: ["Stroke without checking glucose", "Heat exhaustion only"],
    medication: "oral glucose",
    medicationLabel: "Give oral glucose",
    medicationDescription:
      "The patient follows commands and can swallow, so administer oral glucose per protocol and monitor closely.",
    medicationDistractors: [
      {
        label: "Give food and leave the patient",
        feedback:
          "Food is not a substitute for controlled treatment and reassessment. Give oral glucose per protocol, monitor the airway, and transport.",
      },
      {
        label: "Give insulin",
        feedback:
          "Insulin would lower the glucose further and can be dangerous. This presentation requires glucose, not insulin.",
      },
    ],
    airwayAction: "Assess patency and ability to swallow",
    airwayDescription:
      "The airway is patent. The patient has an intact gag reflex and can follow a command to swallow.",
    airwayDistractors: [
      {
        label: "Insert an OPA",
        feedback:
          "The patient is responsive with an intact gag reflex. An OPA is not indicated; assess and protect the airway.",
      },
      {
        label: "Give glucose before checking the airway",
        feedback:
          "Confirm that the patient can protect the airway and swallow before giving anything by mouth.",
      },
    ],
    breathingAction: "Count respirations and assess ventilation",
    breathingDescription: "Respirations are regular at 18/min with adequate chest rise.",
    breathingDistractors: [
      {
        label: "Begin positive-pressure ventilation",
        feedback:
          "Ventilation is adequate. Continue the primary assessment and reserve a BVM for inadequate breathing.",
      },
      {
        label: "Skip breathing because SpO2 looks normal",
        feedback:
          "Pulse oximetry does not replace a breathing assessment. Count respirations and assess depth and effort.",
      },
    ],
    circulationAction: "Check pulse, skin, and signs of injury",
    history:
      "Friend reports insulin use, a missed meal, gradual confusion, no seizure, and no known recent illness or trauma.",
    exam:
      "Focused exam finds pale diaphoretic skin, no facial droop, equal grip when coached, and no traumatic injury.",
    reassessment:
      "Mental status improves after glucose. The patient is alert, skin is less diaphoretic, HR 92, RR 16, BP 116/74, and SpO2 98%.",
    reassessedVitals: {
      heartRate: 92,
      respiratoryRate: 16,
      systolicBP: 116,
      diastolicBP: 74,
      spo2: 98,
    },
    requiresBreathingSupport: false,
  },
  "opioid-overdose": {
    id: "opioid-overdose",
    title: "Unresponsive Patient Near the Park",
    dispatch:
      "Unresponsive adult with slow breathing near a festival bench. A bystander reports possible opioid use.",
    sceneReport:
      "The patient is supine on the grass. No needles or immediate hazards are visible, and the bystander has stepped back.",
    responsiveness: "Unresponsive to voice, withdraws to painful stimulus",
    airway: "Partially obstructed by the tongue with snoring respirations",
    breathing: "Slow and shallow with inadequate chest rise",
    circulation: "Slow radial pulse, cool skin, mild cyanosis",
    generalImpression:
      "Adult supine and unresponsive with cyanotic lips, pinpoint pupils, and visibly slow breathing.",
    patientReply: "Patient does not answer. A bystander says the patient used an opioid shortly before collapsing.",
    vitals: {
      heartRate: 56,
      respiratoryRate: 6,
      systolicBP: 96,
      diastolicBP: 58,
      spo2: 82,
    },
    impression: "Opioid overdose with respiratory failure",
    impressionDistractors: ["Alcohol intoxication with adequate breathing", "Behavioral emergency"],
    medication: "naloxone",
    medicationLabel: "Administer naloxone",
    medicationDescription:
      "Administer naloxone per protocol after ventilation support is underway, without delaying oxygenation.",
    medicationDistractors: [
      {
        label: "Wait for a definitive drug history",
        feedback:
          "The respiratory failure must be treated now. Support ventilation and give naloxone when opioid overdose is suspected.",
      },
      {
        label: "Give oral glucose",
        feedback:
          "This patient cannot protect the airway or swallow. Oral glucose creates an aspiration risk and does not treat the respiratory failure.",
      },
    ],
    airwayAction: "Open the airway and prepare suction",
    airwayDescription:
      "Use a head-tilt chin-lift when no trauma is suspected, clear the mouth, and prepare suction as needed.",
    airwayDistractors: [
      {
        label: "Insert an OPA without opening the airway",
        feedback:
          "Position and open the airway first, then select an adjunct based on gag reflex and patient tolerance.",
      },
      {
        label: "Leave the snoring airway alone",
        feedback:
          "Snoring indicates partial obstruction. Open and maintain the airway immediately.",
      },
    ],
    breathingAction: "Assist ventilations with BVM and oxygen",
    breathingDescription:
      "Provide effective BVM ventilations with oxygen, watching for visible chest rise at an appropriate rate.",
    breathingDistractors: [
      {
        label: "Use a nasal cannula only",
        feedback:
          "A respiratory rate of 6 with shallow effort is inadequate. The patient needs assisted ventilation, not oxygen alone.",
      },
      {
        label: "Give naloxone before ventilating",
        feedback:
          "Do not delay ventilation while preparing naloxone. Oxygenation and ventilation are the immediate priorities.",
      },
    ],
    circulationAction: "Check pulse, skin, and perfusion",
    history:
      "Bystander reports opioid use minutes before collapse. No trauma, seizure, diabetes, or medication allergy is known.",
    exam:
      "Focused exam finds pinpoint pupils, track marks, cool skin, no traumatic injury, and improving color with ventilation.",
    reassessment:
      "After ventilation and naloxone, the patient opens eyes to voice. HR 72, RR 14, BP 108/68, and SpO2 95%. Continue airway monitoring.",
    reassessedVitals: {
      heartRate: 72,
      respiratoryRate: 14,
      systolicBP: 108,
      diastolicBP: 68,
      spo2: 95,
    },
    requiresBreathingSupport: true,
    breathingSupportLabel: "Continue BVM ventilations with oxygen",
    breathingSupportDescription:
      "Ventilate first, confirm chest rise, and continue support while naloxone is prepared.",
  },
  "chest-pain": {
    id: "chest-pain",
    title: "Chest Pressure at the Festival",
    dispatch:
      "Adult with sudden chest pressure and sweating near the food booths. Patient is conscious and reclined on the grass.",
    sceneReport:
      "The area is calm and accessible. The patient is pale, clutching the chest, and a friend is holding the patient's prescribed nitroglycerin.",
    responsiveness: "Alert and oriented, anxious",
    airway: "Patent, speaking clearly",
    breathing: "Mildly labored with equal chest rise",
    circulation: "Rapid regular radial pulse, pale cool diaphoretic skin",
    generalImpression:
      "Adult reclined on the grass, pale and diaphoretic, guarding the center of the chest with mild respiratory distress.",
    patientReply:
      "Patient: It feels like heavy pressure in the middle of my chest and it is moving into my left arm.",
    vitals: {
      heartRate: 104,
      respiratoryRate: 22,
      systolicBP: 148,
      diastolicBP: 88,
      spo2: 93,
    },
    impression: "Suspected acute coronary syndrome",
    impressionDistractors: ["Anxiety only", "Musculoskeletal chest pain"],
    medication: "aspirin",
    medicationLabel: "Administer chewable aspirin",
    medicationDescription:
      "After checking for allergy and bleeding contraindications, administer aspirin per local protocol.",
    medicationDistractors: [
      {
        label: "Assist with nitroglycerin before checking contraindications",
        feedback:
          "Confirm the prescription, blood pressure, dose, and contraindications before assisting with nitroglycerin.",
      },
      {
        label: "Delay medication until pain becomes severe",
        feedback:
          "Suspected ACS is time-sensitive. Complete contraindication checks and give aspirin per protocol without unnecessary delay.",
      },
    ],
    airwayAction: "Assess speech and airway patency",
    airwayDescription: "The patient speaks clearly without obstruction; continue to monitor.",
    airwayDistractors: [
      {
        label: "Insert an OPA",
        feedback:
          "The alert patient has an intact gag reflex and a patent airway. An OPA is contraindicated.",
      },
      {
        label: "Skip airway because the complaint is chest pain",
        feedback:
          "Every primary assessment includes airway. Confirm patency before moving to breathing.",
      },
    ],
    breathingAction: "Assess rate, effort, and chest rise",
    breathingDescription:
      "Respirations are 22/min with mild effort and equal chest rise. SpO2 will help guide oxygen use.",
    breathingDistractors: [
      {
        label: "Assume all chest pain needs high-flow oxygen",
        feedback:
          "Assess breathing and oxygenation first. Oxygen should be titrated to clinical need and local protocol.",
      },
      {
        label: "Focus only on the pain score",
        feedback:
          "Pain is important, but respiratory rate, effort, chest rise, and oxygenation are primary-assessment priorities.",
      },
    ],
    circulationAction: "Check pulse, skin, and perfusion",
    history:
      "OPQRST and SAMPLE reveal pressure beginning 15 minutes ago, radiation to the left arm, nausea, prescribed nitroglycerin, and no aspirin allergy or recent bleeding.",
    exam:
      "Focused exam finds equal breath sounds, no chest-wall tenderness, pale diaphoretic skin, and no signs of trauma.",
    reassessment:
      "Pain eases slightly after aspirin, positioning, and oxygen. HR 96, RR 18, BP 140/84, and SpO2 96%. Continue rapid transport.",
    reassessedVitals: {
      heartRate: 96,
      respiratoryRate: 18,
      systolicBP: 140,
      diastolicBP: 84,
      spo2: 96,
    },
    requiresBreathingSupport: true,
    breathingSupportLabel: "Apply titrated oxygen",
    breathingSupportDescription:
      "With SpO2 93% and respiratory distress, apply oxygen and titrate to the target in local protocol.",
  },
};

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
      id: "working-impression",
      label: "Working Impression",
      subtleGoal: "Recognize the life-threatening pattern from the primary assessment.",
      phase: "primaryAssessment",
      requiredEvents: ["WORKING_IMPRESSION_SELECTED"],
      hintLevels: [
        "Connect the respiratory distress with the skin findings.",
        "Throat tightness, wheezing, hives, and a rapid pulse indicate a systemic reaction.",
        "Choose anaphylaxis with respiratory and perfusion compromise.",
      ],
    },
    {
      id: "epinephrine-treatment",
      label: "Immediate Medication",
      subtleGoal: "Choose the first-line medication for this life-threatening allergic reaction.",
      phase: "interventions",
      requiredEvents: ["EPINEPHRINE_ADMINISTERED"],
      hintLevels: [
        "This patient has airway, breathing, and perfusion compromise.",
        "Do not delay the first-line treatment for anaphylaxis.",
        "Administer IM epinephrine per local protocol.",
      ],
    },
    {
      id: "oxygen-support",
      label: "Breathing Support",
      subtleGoal: "Support oxygenation while preparing for rapid transport.",
      phase: "interventions",
      requiredEvents: ["OXYGEN_APPLIED"],
      hintLevels: [
        "SpO2 is 89% with increased work of breathing.",
        "Support oxygenation and be ready to assist ventilation.",
        "Apply oxygen and monitor respiratory effort.",
      ],
    },
    {
      id: "transport-priority",
      label: "Transport Priority",
      subtleGoal: "Choose urgent transport after immediate life-saving care begins.",
      phase: "transport",
      requiredEvents: ["TRANSPORT_SELECTED"],
      hintLevels: [
        "Use the primary findings to decide urgency.",
        "This patient has respiratory compromise and signs of poor perfusion.",
        "Choose urgent transport while treatment and monitoring continue.",
      ],
    },
    {
      id: "baseline-vitals",
      label: "Baseline Vitals",
      subtleGoal: "Gather baseline vital signs without delaying treatment or transport.",
      phase: "secondaryAssessment",
      requiredEvents: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      hintLevels: [
        "Immediate treatment has started; now establish objective baselines.",
        "Use monitoring equipment while urgent transport is prepared.",
        "Use the blood pressure cuff and pulse oximeter.",
      ],
    },
    {
      id: "focused-history",
      label: "Focused History",
      subtleGoal: "Clarify the allergen exposure, symptom timeline, and relevant SAMPLE history.",
      phase: "secondaryAssessment",
      requiredEvents: ["FOCUSED_HISTORY_OBTAINED"],
      hintLevels: [
        "Treatment should continue while you collect a concise history.",
        "Ask about the exposure, onset, prior reactions, medications, and epinephrine access.",
        "Select the focused history hotspot and choose a targeted SAMPLE and allergy history.",
      ],
    },
    {
      id: "focused-exam",
      label: "Focused Exam",
      subtleGoal: "Look for persistent airway, breathing, skin, and perfusion findings.",
      phase: "secondaryAssessment",
      requiredEvents: ["FOCUSED_EXAM_COMPLETED"],
      hintLevels: [
        "Recheck the body systems affected by anaphylaxis.",
        "Focus on airway swelling, breath sounds, skin findings, and perfusion.",
        "Select the focused exam hotspot and perform an airway, breathing, skin, and perfusion exam.",
      ],
    },
    {
      id: "treatment-reassessment",
      label: "Reassess After Treatment",
      subtleGoal: "Repeat the ABCs and vital signs to determine the response to treatment.",
      phase: "reassessment",
      requiredEvents: ["REASSESSMENT_COMPLETED"],
      hintLevels: [
        "A treatment is not complete until its effect is checked.",
        "Repeat airway, breathing, circulation, mental status, and vital signs.",
        "Select the patient reassessment hotspot.",
      ],
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
          outcome: "incorrect",
          failureEvents: ["DOG_AGITATED"],
          scoreEffect: -8,
          timeEffect: 20,
        },
        {
          id: "ask-bystander-secure-dog",
          label: "Ask bystander to secure dog",
          description: "A bystander backs away and says they do not know the dog.",
          outcome: "incorrect",
          failureEvents: ["DOG_AGITATED"],
          scoreEffect: -3,
          timeEffect: 15,
        },
        {
          id: "ignore-dog",
          label: "Ignore dog and approach patient",
          description: "Unsafe. The dog lunges and you lose access to the patient.",
          outcome: "incorrect",
          failureEvents: ["DOG_AGITATED"],
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
      position: FESTIVAL_RADIO_POSITION,
      focusPosition: [-2.45, 1.65, -1.35],
      focusTarget: FESTIVAL_RADIO_POSITION,
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
      visibleWhen: ["OXYGEN_APPLIED"],
      position: [3.9, 0.12, 0.95],
      focusPosition: [5.8, 2.8, 4.2],
      focusTarget: [2.4, 0.8, 1.3],
      highlightColor: "#a7f3d0",
      enabledWhen: ["OXYGEN_APPLIED"],
      actions: [
        {
          id: "urgent-transport",
          label: "Urgent transport",
          description: "Primary survey supports urgent transport with respiratory compromise and hypotension.",
          outcome: "correct",
          onSuccessEvents: ["TRANSPORT_SELECTED"],
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
      visibleWhen: ["PULSE_CHECKED"],
      completedWhen: ["WORKING_IMPRESSION_SELECTED"],
      position: [3.0, 0.4, 1.55],
      focusPosition: [5.4, 2.45, 4.2],
      focusTarget: [2.25, 0.85, 1.45],
      highlightColor: "#f0abfc",
      enabledWhen: ["PULSE_CHECKED"],
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
    {
      id: "epinephrine-treatment",
      name: "Medication Decision",
      category: "patient",
      visibleWhen: ["WORKING_IMPRESSION_SELECTED"],
      completedWhen: ["EPINEPHRINE_ADMINISTERED"],
      position: [2.65, 0.72, 1.5],
      focusPosition: [5.0, 2.5, 4.4],
      focusTarget: [2.2, 0.8, 1.45],
      highlightColor: "#fb7185",
      enabledWhen: ["WORKING_IMPRESSION_SELECTED"],
      actions: [
        {
          id: "administer-im-epinephrine",
          label: "Administer IM epinephrine per protocol",
          description: "Give the first-line medication without delaying transport preparation.",
          outcome: "correct",
          onSuccessEvents: ["EPINEPHRINE_ADMINISTERED"],
          scoreEffect: 10,
          timeEffect: 20,
        },
        {
          id: "give-antihistamine-only",
          label: "Give an antihistamine and observe",
          description: "Use an antihistamine alone before considering epinephrine.",
          outcome: "incorrect",
          feedback:
            "Antihistamines do not rapidly reverse airway swelling, bronchospasm, or shock. IM epinephrine is the first-line treatment for anaphylaxis.",
          scoreEffect: -7,
          timeEffect: 20,
        },
        {
          id: "wait-for-als-epinephrine",
          label: "Wait for ALS before treating",
          description: "Delay medication until another unit arrives.",
          outcome: "incorrect",
          feedback:
            "This patient has respiratory compromise and hypotension. Use the epinephrine option authorized by your scope and local protocol without avoidable delay.",
          scoreEffect: -7,
          timeEffect: 25,
        },
        {
          id: "oral-fluids-anaphylaxis",
          label: "Give oral fluids",
          description: "Treat the low blood pressure with oral hydration.",
          outcome: "incorrect",
          feedback:
            "Oral fluids are unsafe with possible airway swelling and do not treat anaphylactic shock. Prioritize epinephrine, oxygenation, and rapid transport.",
          scoreEffect: -6,
          timeEffect: 15,
        },
      ],
    },
    {
      id: "oxygen-support",
      name: "Breathing Support",
      category: "equipment",
      visibleWhen: ["EPINEPHRINE_ADMINISTERED"],
      completedWhen: ["OXYGEN_APPLIED"],
      position: [2.38, 0.68, 1.08],
      focusPosition: [4.8, 2.35, 4.0],
      focusTarget: [2.15, 0.8, 1.4],
      highlightColor: "#38bdf8",
      enabledWhen: ["EPINEPHRINE_ADMINISTERED"],
      actions: [
        {
          id: "apply-oxygen-anaphylaxis",
          label: "Apply oxygen and monitor ventilation",
          description: "Support the hypoxemic patient and prepare to assist ventilation if respiratory effort worsens.",
          outcome: "correct",
          onSuccessEvents: ["OXYGEN_APPLIED"],
          scoreEffect: 8,
          timeEffect: 15,
        },
        {
          id: "withhold-oxygen-anaphylaxis",
          label: "Withhold oxygen because the patient is talking",
          description: "Use speech as proof that oxygenation is adequate.",
          outcome: "incorrect",
          feedback:
            "The patient is speaking but has SpO2 89%, wheezing, and increased work of breathing. Support oxygenation and watch for fatigue.",
          scoreEffect: -5,
          timeEffect: 15,
        },
        {
          id: "force-supine-anaphylaxis",
          label: "Force the patient flat",
          description: "Lay the patient supine despite respiratory distress.",
          outcome: "incorrect",
          feedback:
            "Do not force a conscious patient with respiratory distress into a position that worsens breathing. Support a position of comfort while managing perfusion.",
          scoreEffect: -4,
          timeEffect: 12,
        },
      ],
    },
    {
      id: "focused-history",
      name: "Focused History",
      category: "patient",
      visibleWhen: ["TRANSPORT_SELECTED", "BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      completedWhen: ["FOCUSED_HISTORY_OBTAINED"],
      position: [2.02, 1.08, 1.5],
      focusPosition: [4.9, 2.45, 4.15],
      focusTarget: [2.15, 0.9, 1.42],
      highlightColor: "#c084fc",
      enabledWhen: ["TRANSPORT_SELECTED", "BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
      actions: [
        {
          id: "obtain-focused-allergy-history",
          label: "Ask a focused SAMPLE and allergy history",
          description: "Clarify the exposure, onset, prior reactions, medications, epinephrine access, and relevant history while transport is prepared.",
          outcome: "correct",
          onSuccessEvents: ["FOCUSED_HISTORY_OBTAINED"],
          scoreEffect: 8,
          timeEffect: 20,
        },
        {
          id: "obtain-exhaustive-history",
          label: "Complete an exhaustive medical history",
          description: "Delay transport preparation until every past medical detail is documented.",
          outcome: "incorrect",
          feedback:
            "This is a time-critical allergic emergency. Obtain a concise, targeted history while treatment and urgent transport preparation continue.",
          scoreEffect: -4,
          timeEffect: 25,
        },
        {
          id: "skip-history-after-epinephrine",
          label: "Skip history because epinephrine was given",
          description: "Assume the treatment response provides all the information needed.",
          outcome: "incorrect",
          feedback:
            "Epinephrine does not replace a focused history. Exposure, timing, prior reactions, medications, and epinephrine access affect ongoing care and recurrence risk.",
          scoreEffect: -4,
          timeEffect: 12,
        },
      ],
    },
    {
      id: "focused-exam",
      name: "Focused Exam",
      category: "patient",
      visibleWhen: ["FOCUSED_HISTORY_OBTAINED"],
      completedWhen: ["FOCUSED_EXAM_COMPLETED"],
      position: [2.3, 0.98, 1.43],
      focusPosition: [4.8, 2.4, 4.05],
      focusTarget: [2.16, 0.85, 1.42],
      highlightColor: "#f59e0b",
      enabledWhen: ["FOCUSED_HISTORY_OBTAINED"],
      actions: [
        {
          id: "perform-focused-anaphylaxis-exam",
          label: "Examine airway, breathing, skin, and perfusion",
          description: "Check for swelling or stridor, auscultate breath sounds, inspect hives, and reassess perfusion.",
          outcome: "correct",
          onSuccessEvents: ["FOCUSED_EXAM_COMPLETED"],
          scoreEffect: 8,
          timeEffect: 25,
        },
        {
          id: "perform-skin-only-exam",
          label: "Inspect only the hives",
          description: "Use the visible rash as the entire focused exam.",
          outcome: "incorrect",
          feedback:
            "Anaphylaxis affects more than the skin. Assess airway swelling, breath sounds, work of breathing, and perfusion as well as the rash.",
          scoreEffect: -5,
          timeEffect: 15,
        },
        {
          id: "delay-exam-until-resolved",
          label: "Wait until symptoms fully resolve",
          description: "Delay the focused exam until the patient appears comfortable.",
          outcome: "incorrect",
          feedback:
            "Do not wait for symptoms to resolve. A focused exam now establishes whether airway, breathing, skin, and perfusion findings persist after treatment.",
          scoreEffect: -5,
          timeEffect: 18,
        },
      ],
    },
    {
      id: "patient-reassessment",
      name: "Reassess Patient",
      category: "patient",
      visibleWhen: ["FOCUSED_EXAM_COMPLETED"],
      completedWhen: ["REASSESSMENT_COMPLETED"],
      position: [2.2, 0.94, 1.45],
      focusPosition: [4.9, 2.5, 4.3],
      focusTarget: [2.15, 0.8, 1.42],
      highlightColor: "#2dd4bf",
      enabledWhen: ["FOCUSED_EXAM_COMPLETED"],
      actions: [
        {
          id: "repeat-abcs-and-vitals-anaphylaxis",
          label: "Repeat ABCs and vital signs",
          description: "Recheck airway swelling, breathing effort, perfusion, mental status, BP, and SpO2.",
          outcome: "correct",
          onSuccessEvents: ["REASSESSMENT_COMPLETED"],
          scoreEffect: 10,
          timeEffect: 30,
        },
        {
          id: "assume-epinephrine-worked",
          label: "Assume treatment worked and move on",
          description: "Continue transport preparation without checking the patient's response.",
          outcome: "incorrect",
          feedback:
            "Anaphylaxis can persist or recur. Repeat the ABCs and vital signs after treatment and continue frequent reassessment during transport.",
          scoreEffect: -6,
          timeEffect: 15,
        },
        {
          id: "recheck-spo2-only",
          label: "Recheck only the pulse oximeter",
          description: "Use one monitor value as the full reassessment.",
          outcome: "incorrect",
          feedback:
            "SpO2 alone can miss worsening airway swelling, fatigue, or shock. Repeat airway, breathing, circulation, mental status, and vital signs.",
          scoreEffect: -4,
          timeEffect: 12,
        },
      ],
    },
  ],
};

function createAdditionalMedicalScenario(
  profile: AdditionalMedicalProfile
): SceneScenarioConfig {
  const supportEvents: SceneEvent[] = profile.requiresBreathingSupport
    ? ["OXYGEN_APPLIED"]
    : [];
  const treatmentEvents: SceneEvent[] = [
    ...supportEvents,
    "SCENARIO_MEDICATION_ADMINISTERED",
  ];

  return {
    id: profile.id,
    title: profile.title,
    dispatch: profile.dispatch,
    sceneReport: profile.sceneReport,
    startingLocation: "ambulance",
    initialPhase: "sceneSafety",
    currentObjectiveId: "scene-size-up",
    environmentInitialState: {
      dogSecured: true,
      fireControlled: true,
      trafficStopped: true,
      sceneSafe: true,
      dogAgitated: false,
    },
    patientInitialState: {
      workingImpression: undefined,
      responsiveness: profile.responsiveness,
      airwayStatus: profile.airway,
      breathingStatus: profile.breathing,
      circulationStatus: profile.circulation,
      position: "on-ground",
      oxygenApplied: false,
      medicationGiven: [],
      findingsDiscovered: [],
      vitalsRevealed: [],
      vitals: { ...profile.vitals },
    },
    objectives: [
      {
        id: "scene-size-up",
        label: "Scene Size-Up",
        subtleGoal: "Confirm that the patient area is safe before moving in.",
        phase: "sceneSafety",
        requiredEvents: ["CRASH_SCENE_INSPECTED"],
        hintLevels: [
          "Begin from the ambulance staging point.",
          "Scan for hazards, patient count, and mechanism or nature of illness.",
          "Select the patient area and inspect it from a distance.",
        ],
      },
      {
        id: "bsi-ppe",
        label: "BSI / PPE",
        subtleGoal: "Open the medical bag and put on gloves before patient contact.",
        phase: "primaryAssessment",
        requiredEvents: ["GLOVES_EQUIPPED"],
        hintLevels: [
          "Prepare PPE before approaching.",
          "The gloves are in the medical bag.",
          "Open the bag, then put on gloves.",
        ],
      },
      {
        id: "approach-patient",
        label: "Approach Patient",
        subtleGoal: "Bring the aid bag and move to the patient.",
        phase: "primaryAssessment",
        requiredEvents: ["PATIENT_APPROACHED"],
        hintLevels: [
          "The area is safe and PPE is on.",
          "Use the highlighted approach point.",
          "Select Approach Patient and move in with the bag.",
        ],
      },
      {
        id: "general-impression",
        label: "General Impression",
        subtleGoal: "Use posture, skin, breathing, and surroundings to form a first impression.",
        phase: "primaryAssessment",
        requiredEvents: ["GENERAL_IMPRESSION_OBSERVED"],
        hintLevels: [
          "Look before touching.",
          "Observe position, skin, breathing, and obvious distress.",
          "Select the patient and observe the general impression.",
        ],
      },
      {
        id: "responsiveness",
        label: "Responsiveness",
        subtleGoal: "Determine the patient's level of responsiveness.",
        phase: "primaryAssessment",
        requiredEvents: ["RESPONSIVENESS_CHECKED"],
        hintLevels: [
          "Start with voice.",
          "Use the least invasive stimulus needed.",
          "Select the patient and assess responsiveness.",
        ],
      },
      {
        id: "airway",
        label: "Airway",
        subtleGoal: "Choose the airway action that fits this presentation.",
        phase: "primaryAssessment",
        requiredEvents: ["AIRWAY_OPENED"],
        hintLevels: [
          "Use the patient's responsiveness and sounds.",
          "Decide whether the airway is patent, threatened, or obstructed.",
          "Select the airway hotspot and choose the safest action.",
        ],
      },
      {
        id: "breathing",
        label: "Breathing",
        subtleGoal: "Assess rate, depth, effort, and adequacy.",
        phase: "primaryAssessment",
        requiredEvents: ["RESPIRATIONS_COUNTED"],
        hintLevels: [
          "Look for adequate chest rise.",
          "Rate alone does not establish adequate ventilation.",
          "Select the chest hotspot and choose the appropriate breathing assessment.",
        ],
      },
      ...(profile.id === "opioid-overdose"
        ? [
            {
              id: "breathing-support",
              label: "Immediate Ventilation",
              subtleGoal: "Correct inadequate breathing before continuing the assessment.",
              phase: "interventions" as const,
              requiredEvents: ["OXYGEN_APPLIED" as const],
              hintLevels: [
                "A respiratory rate of 6 with shallow chest rise is inadequate.",
                "Do not wait for naloxone to begin ventilation.",
                "Use a BVM with oxygen and confirm visible chest rise.",
              ],
            },
          ]
        : []),
      {
        id: "circulation",
        label: "Circulation",
        subtleGoal: "Assess pulse, skin, perfusion, and major bleeding.",
        phase: "primaryAssessment",
        requiredEvents: ["PULSE_CHECKED"],
        hintLevels: [
          "Check more than pulse presence.",
          "Include quality, skin, perfusion, and bleeding.",
          "Select the pulse hotspot and complete circulation.",
        ],
      },
      {
        id: "baseline-vitals",
        label: "Baseline Vitals",
        subtleGoal: "Obtain blood pressure and oxygen saturation.",
        phase: "primaryAssessment",
        requiredEvents: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
        hintLevels: [
          "The ABC assessment is complete.",
          "Use both monitoring tools.",
          "Apply the BP cuff and pulse oximeter from the equipment dock.",
        ],
      },
      {
        id: "working-impression",
        label: "Working Impression",
        subtleGoal: "Connect the history, primary findings, and vital signs.",
        phase: "impression",
        requiredEvents: ["WORKING_IMPRESSION_SELECTED"],
        hintLevels: [
          "Use the entire presentation.",
          "Choose the condition that explains the mental status, ABC findings, and vital signs.",
          `Select ${profile.impression}.`,
        ],
      },
      ...(profile.requiresBreathingSupport && profile.id !== "opioid-overdose"
        ? [
            {
              id: "breathing-support",
              label: "Immediate Breathing Support",
              subtleGoal: "Choose the respiratory support indicated by the assessment.",
              phase: "interventions" as const,
              requiredEvents: ["OXYGEN_APPLIED" as const],
              hintLevels: [
                "Treat the breathing abnormality before medication distracts from it.",
                "Match the device to ventilation adequacy and oxygenation.",
                profile.breathingSupportLabel ?? "Support breathing.",
              ],
            },
          ]
        : []),
      {
        id: "scenario-medication",
        label: "Medication Decision",
        subtleGoal: "Choose the indicated medication and avoid harmful alternatives.",
        phase: "interventions",
        requiredEvents: ["SCENARIO_MEDICATION_ADMINISTERED"],
        hintLevels: [
          "Use the working impression and airway status.",
          "Check indications and contraindications before treatment.",
          profile.medicationLabel,
        ],
      },
      {
        id: "transport-priority",
        label: "Transport Priority",
        subtleGoal: "Choose the appropriate transport urgency after immediate care begins.",
        phase: "transport",
        requiredEvents: ["TRANSPORT_SELECTED"],
        hintLevels: [
          "Treatment response does not eliminate the need for transport.",
          "Consider the initial instability and risk of recurrence or deterioration.",
          "Select prompt transport with continued monitoring and reassessment.",
        ],
      },
      {
        id: "focused-history",
        label: "Focused History",
        subtleGoal: "Obtain a concise history relevant to the working impression.",
        phase: "secondaryAssessment",
        requiredEvents: ["FOCUSED_HISTORY_OBTAINED"],
        hintLevels: [
          "Use SAMPLE plus complaint-specific questions.",
          "Keep the history focused while transport preparation continues.",
          "Select Focused History and choose the targeted option.",
        ],
      },
      {
        id: "focused-exam",
        label: "Focused Exam",
        subtleGoal: "Look for findings that support or challenge the working impression.",
        phase: "secondaryAssessment",
        requiredEvents: ["FOCUSED_EXAM_COMPLETED"],
        hintLevels: [
          "Examine the systems connected to the complaint.",
          "Do not repeat a generic head-to-toe exam without purpose.",
          "Select Focused Exam and perform a complaint-directed exam.",
        ],
      },
      {
        id: "treatment-reassessment",
        label: "Reassess Patient",
        subtleGoal: "Repeat ABCs and vital signs after treatment.",
        phase: "reassessment",
        requiredEvents: ["REASSESSMENT_COMPLETED"],
        hintLevels: [
          "Treatment is incomplete until its effect is measured.",
          "Repeat mental status, airway, breathing, circulation, and vital signs.",
          "Select Reassess Patient and repeat the primary assessment.",
        ],
      },
    ],
    interactiveObjects: [
      {
        id: "patient-area",
        name: "Patient Area",
        category: "environment",
        visibleWhen: ["DISPATCH_RECEIVED"],
        completedWhen: ["CRASH_SCENE_INSPECTED"],
        position: [2.6, 1.1, 1.25],
        focusPosition: [-2.3, 2.6, 5.8],
        focusTarget: [2.3, 0.65, 1.2],
        highlightColor: "#38bdf8",
        actions: [
          {
            id: "inspect-medical-scene",
            label: "Inspect from a safe distance",
            description:
              "One patient is visible. The area is calm, access is clear, and no immediate scene hazards are identified.",
            outcome: "correct",
            successEvents: ["CRASH_SCENE_INSPECTED"],
            scoreEffect: 5,
            timeEffect: 8,
          },
          {
            id: "rush-in-without-scan",
            label: "Rush directly to the patient",
            description: "Approach without checking the surroundings.",
            outcome: "incorrect",
            feedback:
              "Even an apparently calm medical call begins with a scene size-up. Confirm hazards, patient count, and nature of illness first.",
            scoreEffect: -4,
            timeEffect: 10,
          },
        ],
      },
      {
        id: "medical-bag",
        name: "Medical Bag",
        category: "equipment",
        visibleWhen: ["CRASH_SCENE_INSPECTED"],
        completedWhen: ["GLOVES_EQUIPPED"],
        position: [-2.9, 0.55, -0.65],
        focusPosition: [-1.05, 1.45, 1.55],
        focusTarget: [-2.9, 0.42, -0.65],
        highlightColor: "#5eead4",
        actions: [
          {
            id: "open-medical-bag",
            label: "Open medical bag",
            description: "Open the aid bag and locate PPE.",
            successEvents: ["MEDICAL_BAG_OPENED"],
            scoreEffect: 3,
          },
          {
            id: "equip-gloves",
            label: "Put on gloves",
            description: "Complete BSI/PPE before patient contact.",
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
        enabledWhen: ["PPE_EQUIPPED"],
        actions: [
          {
            id: "approach-patient",
            label: "Move to patient",
            description: "Bring the aid bag and approach from the patient's side.",
            successEvents: ["PATIENT_APPROACHED"],
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
            description: profile.generalImpression,
            outcome: "correct",
            successEvents: ["GENERAL_IMPRESSION_OBSERVED"],
            scoreEffect: 5,
          },
          {
            id: "assess-responsiveness",
            label:
              profile.id === "opioid-overdose"
                ? "Use verbal, then painful stimulus"
                : "Introduce yourself and assess orientation",
            description: profile.patientReply,
            outcome: "correct",
            requires: ["GENERAL_IMPRESSION_OBSERVED"],
            successEvents: ["RESPONSIVENESS_CHECKED"],
            scoreEffect: 5,
          },
          {
            id: "skip-responsiveness",
            label: "Skip directly to the monitor",
            description: "Apply equipment without establishing responsiveness.",
            outcome: "incorrect",
            requires: ["GENERAL_IMPRESSION_OBSERVED"],
            feedback:
              "Responsiveness helps determine airway risk and the urgency of intervention. Assess it before relying on monitor values.",
            scoreEffect: -4,
            timeEffect: 10,
          },
        ],
      },
      {
        id: "airway-hotspot",
        name: "Airway",
        category: "patient",
        visibleWhen: ["RESPONSIVENESS_CHECKED"],
        completedWhen: ["AIRWAY_OPENED"],
        position: [1.82, 0.46, 1.18],
        focusPosition: [3.7, 2.0, 3.2],
        focusTarget: [1.82, 0.42, 1.18],
        highlightColor: "#fbbf24",
        enabledWhen: ["RESPONSIVENESS_CHECKED"],
        actions: [
          {
            id: "scenario-airway-action",
            label: profile.airwayAction,
            description: profile.airwayDescription,
            outcome: "correct",
            successEvents: ["AIRWAY_OPENED"],
            scoreEffect: 6,
          },
          ...profile.airwayDistractors.map((distractor, index) => ({
            id: `airway-distractor-${index}`,
            label: distractor.label,
            description: distractor.label,
            outcome: "incorrect" as const,
            feedback: distractor.feedback,
            scoreEffect: -5,
            timeEffect: 12,
          })),
        ],
      },
      {
        id: "chest-hotspot",
        name: "Chest / Breathing",
        category: "patient",
        visibleWhen: ["AIRWAY_OPENED"],
        completedWhen: ["RESPIRATIONS_COUNTED"],
        position: [2.2, 0.52, 1.32],
        focusPosition: [4.2, 2.05, 3.7],
        focusTarget: [2.2, 0.48, 1.32],
        highlightColor: "#38bdf8",
        enabledWhen: ["AIRWAY_OPENED"],
        actions: [
          {
            id: "scenario-breathing-action",
            label: profile.breathingAction,
            description: profile.breathingDescription,
            outcome: "correct",
            successEvents: ["RESPIRATIONS_COUNTED"],
            scoreEffect: 6,
          },
          ...profile.breathingDistractors.map((distractor, index) => ({
            id: `breathing-distractor-${index}`,
            label: distractor.label,
            description: distractor.label,
            outcome: "incorrect" as const,
            feedback: distractor.feedback,
            scoreEffect: -5,
            timeEffect: 12,
          })),
        ],
      },
      {
        id: "pulse-hotspot",
        name: "Circulation",
        category: "patient",
        visibleWhen:
          profile.id === "opioid-overdose"
            ? ["OXYGEN_APPLIED"]
            : ["RESPIRATIONS_COUNTED"],
        completedWhen: ["PULSE_CHECKED"],
        position: [2.65, 0.38, 1.55],
        focusPosition: [4.6, 1.8, 3.8],
        focusTarget: [2.62, 0.35, 1.52],
        highlightColor: "#f472b6",
        enabledWhen:
          profile.id === "opioid-overdose"
            ? ["OXYGEN_APPLIED"]
            : ["RESPIRATIONS_COUNTED"],
        actions: [
          {
            id: "scenario-circulation-action",
            label: profile.circulationAction,
            description: profile.circulation,
            outcome: "correct",
            successEvents: ["PULSE_CHECKED"],
            scoreEffect: 5,
          },
          {
            id: "pulse-only",
            label: "Check pulse presence only",
            description: "Confirm a pulse without assessing quality, skin, perfusion, or bleeding.",
            outcome: "incorrect",
            feedback:
              "Circulation includes pulse quality, skin signs, perfusion, and a scan for major bleeding.",
            scoreEffect: -4,
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
        position: [2.25, 0.85, 1.5],
        focusPosition: [4.8, 2.4, 4.3],
        focusTarget: [2.2, 0.7, 1.45],
        highlightColor: "#f0abfc",
        enabledWhen: ["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"],
        actions: [
          {
            id: "select-correct-impression",
            label: profile.impression,
            description: `The complete presentation supports ${profile.impression.toLowerCase()}.`,
            outcome: "correct",
            successEvents: ["WORKING_IMPRESSION_SELECTED"],
            scoreEffect: 8,
          },
          ...profile.impressionDistractors.map((label, index) => ({
            id: `impression-distractor-${index}`,
            label,
            description: label,
            outcome: "incorrect" as const,
            feedback: `That choice does not explain the complete set of findings. Reconsider the mental status, airway, breathing, circulation, and vital signs together.`,
            scoreEffect: -5,
            timeEffect: 15,
          })),
        ],
      },
      ...(profile.requiresBreathingSupport
        ? [
            {
              id: "oxygen-support",
              name: profile.id === "opioid-overdose" ? "Ventilation Support" : "Oxygen Support",
              category: "equipment" as const,
              visibleWhen: [
                (profile.id === "opioid-overdose"
                  ? "RESPIRATIONS_COUNTED"
                  : "WORKING_IMPRESSION_SELECTED") as SceneEvent,
              ],
              completedWhen: ["OXYGEN_APPLIED" as const],
              position: [1.45, 0.75, 2.25] as Vec3,
              focusPosition: [4.2, 2.2, 4.0] as Vec3,
              focusTarget: [2.1, 0.65, 1.45] as Vec3,
              highlightColor: "#60a5fa",
              enabledWhen: [
                (profile.id === "opioid-overdose"
                  ? "RESPIRATIONS_COUNTED"
                  : "WORKING_IMPRESSION_SELECTED") as SceneEvent,
              ],
              actions: [
                {
                  id: "provide-breathing-support",
                  label: profile.breathingSupportLabel ?? "Support breathing",
                  description: profile.breathingSupportDescription,
                  outcome: "correct" as const,
                  successEvents: ["OXYGEN_APPLIED" as const],
                  scoreEffect: 8,
                },
                {
                  id: "delay-breathing-support",
                  label: "Delay support until transport",
                  description: "Wait to address the breathing abnormality.",
                  outcome: "incorrect" as const,
                  feedback:
                    "Treat an identified breathing or oxygenation problem now while transport is prepared.",
                  scoreEffect: -6,
                  timeEffect: 15,
                },
              ],
            },
          ]
        : []),
      {
        id: "scenario-treatment",
        name: "Medication Decision",
        category: "equipment",
        visibleWhen: profile.requiresBreathingSupport
          ? profile.id === "opioid-overdose"
            ? ["OXYGEN_APPLIED", "WORKING_IMPRESSION_SELECTED"]
            : ["OXYGEN_APPLIED"]
          : ["WORKING_IMPRESSION_SELECTED"],
        completedWhen: ["SCENARIO_MEDICATION_ADMINISTERED"],
        position: [2.75, 0.65, 2.0],
        focusPosition: [4.8, 2.25, 4.2],
        focusTarget: [2.25, 0.6, 1.5],
        highlightColor: "#34d399",
        enabledWhen: profile.requiresBreathingSupport
          ? profile.id === "opioid-overdose"
            ? ["OXYGEN_APPLIED", "WORKING_IMPRESSION_SELECTED"]
            : ["OXYGEN_APPLIED"]
          : ["WORKING_IMPRESSION_SELECTED"],
        actions: [
          {
            id: "give-scenario-medication",
            label: profile.medicationLabel,
            description: profile.medicationDescription,
            outcome: "correct",
            successEvents: ["SCENARIO_MEDICATION_ADMINISTERED"],
            scoreEffect: 10,
          },
          ...profile.medicationDistractors.map((distractor, index) => ({
            id: `medication-distractor-${index}`,
            label: distractor.label,
            description: distractor.label,
            outcome: "incorrect" as const,
            feedback: distractor.feedback,
            scoreEffect: -6,
            timeEffect: 15,
          })),
        ],
      },
      {
        id: "transport-decision",
        name: "Transport Decision",
        category: "movement",
        visibleWhen: treatmentEvents,
        completedWhen: ["TRANSPORT_SELECTED"],
        position: [3.55, 0.15, 2.3],
        focusPosition: [6.1, 2.8, 5.4],
        focusTarget: [2.25, 0.65, 1.5],
        highlightColor: "#a7f3d0",
        enabledWhen: treatmentEvents,
        actions: [
          {
            id: "prompt-transport",
            label: "Prompt transport with continued care",
            description:
              "Begin transport while monitoring the patient and continuing indicated treatment.",
            outcome: "correct",
            successEvents: ["TRANSPORT_SELECTED"],
            scoreEffect: 8,
          },
          {
            id: "release-after-improvement",
            label: "Release after initial improvement",
            description: "End care because the first treatment appears to help.",
            outcome: "incorrect",
            feedback:
              "Initial improvement does not eliminate recurrence or deterioration risk. Continue monitoring and transport for further evaluation.",
            scoreEffect: -6,
            timeEffect: 20,
          },
        ],
      },
      {
        id: "focused-history",
        name: "Focused History",
        category: "patient",
        visibleWhen: ["TRANSPORT_SELECTED"],
        completedWhen: ["FOCUSED_HISTORY_OBTAINED"],
        position: [1.92, 0.72, 1.25],
        focusPosition: [4.5, 2.25, 4.0],
        focusTarget: [2.1, 0.65, 1.4],
        highlightColor: "#c084fc",
        enabledWhen: ["TRANSPORT_SELECTED"],
        actions: [
          {
            id: "obtain-focused-history",
            label: "Obtain targeted SAMPLE and event history",
            description: profile.history,
            outcome: "correct",
            successEvents: ["FOCUSED_HISTORY_OBTAINED"],
            scoreEffect: 8,
          },
          {
            id: "complete-social-history",
            label: "Take a complete social history first",
            description: "Delay transport for nonurgent background questions.",
            outcome: "incorrect",
            feedback:
              "Keep the history concise and complaint-focused while treatment and transport continue.",
            scoreEffect: -4,
            timeEffect: 18,
          },
        ],
      },
      {
        id: "focused-exam",
        name: "Focused Exam",
        category: "patient",
        visibleWhen: ["FOCUSED_HISTORY_OBTAINED"],
        completedWhen: ["FOCUSED_EXAM_COMPLETED"],
        position: [2.25, 0.58, 1.48],
        focusPosition: [4.6, 2.25, 4.1],
        focusTarget: [2.2, 0.6, 1.45],
        highlightColor: "#f59e0b",
        enabledWhen: ["FOCUSED_HISTORY_OBTAINED"],
        actions: [
          {
            id: "perform-focused-exam",
            label: "Perform a complaint-directed exam",
            description: profile.exam,
            outcome: "correct",
            successEvents: ["FOCUSED_EXAM_COMPLETED"],
            scoreEffect: 8,
          },
          {
            id: "skip-focused-exam",
            label: "Skip the exam after treatment",
            description: "Assume the working impression is confirmed by response to treatment.",
            outcome: "incorrect",
            feedback:
              "A focused exam can reveal competing diagnoses, complications, and persistent threats. Do not skip it.",
            scoreEffect: -5,
            timeEffect: 15,
          },
        ],
      },
      {
        id: "patient-reassessment",
        name: "Reassess Patient",
        category: "patient",
        visibleWhen: ["FOCUSED_EXAM_COMPLETED"],
        completedWhen: ["REASSESSMENT_COMPLETED"],
        position: [2.2, 0.7, 1.45],
        focusPosition: [4.7, 2.35, 4.2],
        focusTarget: [2.2, 0.65, 1.45],
        highlightColor: "#2dd4bf",
        enabledWhen: ["FOCUSED_EXAM_COMPLETED"],
        actions: [
          {
            id: "repeat-primary-and-vitals",
            label: "Repeat ABCs and vital signs",
            description: profile.reassessment,
            outcome: "correct",
            successEvents: ["REASSESSMENT_COMPLETED"],
            scoreEffect: 10,
            timeEffect: 25,
          },
          {
            id: "recheck-one-number",
            label: "Recheck only one monitor value",
            description: "Use one number as the complete reassessment.",
            outcome: "incorrect",
            feedback:
              "Repeat mental status, airway, breathing, circulation, and the full set of relevant vital signs.",
            scoreEffect: -5,
            timeEffect: 12,
          },
        ],
      },
    ],
  };
}

export const hypoglycemiaScenario = createAdditionalMedicalScenario(
  ADDITIONAL_MEDICAL_PROFILES.hypoglycemia
);
export const opioidOverdoseScenario = createAdditionalMedicalScenario(
  ADDITIONAL_MEDICAL_PROFILES["opioid-overdose"]
);
export const chestPainScenario = createAdditionalMedicalScenario(
  ADDITIONAL_MEDICAL_PROFILES["chest-pain"]
);

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
      hintLevels: [
        "The mechanism creates spinal risk.",
        "The responsive driver is speaking, so assess patency while limiting neck movement.",
        "Maintain manual stabilization and inspect the airway without unnecessary manipulation.",
      ],
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
      id: "oxygen-support",
      label: "Breathing Support",
      subtleGoal: "Support oxygenation while continuing to watch ventilation.",
      phase: "primaryAssessment",
      requiredEvents: ["OXYGEN_APPLIED"],
      hintLevels: [
        "The driver has rapid, shallow breathing and a significant chest mechanism.",
        "Support oxygenation and be ready to assist ventilation if breathing becomes inadequate.",
        "Apply oxygen from the equipment dock, then continue the primary assessment.",
      ],
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
    {
      id: "spinal-protection",
      label: "Protect the Spine",
      subtleGoal: "Choose the safest immediate stabilization for the trapped driver.",
      phase: "interventions",
      requiredEvents: ["SPINAL_PRECAUTIONS_MAINTAINED"],
      hintLevels: [
        "The driver is confused and reports neck pain after a significant mechanism.",
        "Limit unnecessary movement while care and extrication continue.",
        "Maintain manual stabilization and apply spinal motion restriction per protocol.",
      ],
    },
    {
      id: "controlled-extrication",
      label: "Coordinate Extrication",
      subtleGoal: "Choose an extrication plan that balances spinal protection with rapid transport.",
      phase: "interventions",
      requiredEvents: ["EXTRICATION_COORDINATED"],
      hintLevels: [
        "The patient needs rapid transport but is not in immediate danger from fire.",
        "Coordinate with fire-rescue instead of pulling the driver out alone.",
        "Use a controlled, time-conscious extrication with ongoing ABC support.",
      ],
    },
    {
      id: "rapid-trauma-exam",
      label: "Rapid Trauma Exam",
      subtleGoal: "Perform a rapid head-to-toe exam without delaying transport.",
      phase: "secondaryAssessment",
      requiredEvents: ["FOCUSED_EXAM_COMPLETED"],
      hintLevels: [
        "The mechanism and altered mentation call for a rapid exam, not a single-system check.",
        "Assess the head, neck, chest, abdomen, pelvis, and extremities during controlled movement.",
        "Select the rapid trauma exam hotspot and perform a time-conscious head-to-toe exam.",
      ],
    },
    {
      id: "focused-trauma-history",
      label: "Focused Trauma History",
      subtleGoal: "Obtain relevant AMPLE history and repeat neurologic and distal circulation checks.",
      phase: "secondaryAssessment",
      requiredEvents: ["FOCUSED_HISTORY_OBTAINED"],
      hintLevels: [
        "Use the patient's limited responses and available scene information.",
        "Ask concise AMPLE questions and repeat neurologic and distal pulse, motor, and sensation checks.",
        "Select the focused history hotspot and obtain AMPLE with neurologic and distal PMS checks.",
      ],
    },
    {
      id: "trauma-reassessment",
      label: "Reassess During Extrication",
      subtleGoal: "Repeat the primary assessment and vital signs while preparing to transport.",
      phase: "reassessment",
      requiredEvents: ["REASSESSMENT_COMPLETED"],
      hintLevels: [
        "Trauma findings can worsen during movement and extrication.",
        "Repeat mental status, airway, breathing, perfusion, and vital signs.",
        "Select the driver reassessment hotspot.",
      ],
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
          failureEvents: ["CRASH_HAZARD_BREACHED"],
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
          failureEvents: ["CRASH_HAZARD_BREACHED"],
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
      position: COLLISION_RADIO_POSITION,
      focusPosition: [2.4, 2.35, 5.7],
      focusTarget: COLLISION_RADIO_POSITION,
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
          id: "assess-airway-with-stabilization",
          label: "Maintain stabilization and assess airway",
          description: "Because the driver is speaking, maintain manual cervical stabilization while checking speech, the mouth, and airway patency.",
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
            "The speaking driver's airway is patent. Maintain manual stabilization and avoid unnecessary neck extension; use a jaw-thrust if airway opening becomes necessary.",
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
          onSuccessEvents: ["TRANSPORT_SELECTED"],
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
    {
      id: "spinal-protection",
      name: "Spinal Protection",
      category: "patient",
      visibleWhen: ["TRANSPORT_SELECTED"],
      completedWhen: ["SPINAL_PRECAUTIONS_MAINTAINED"],
      position: [1.72, 1.58, 0.62],
      focusPosition: [4.5, 2.5, 4.1],
      focusTarget: [1.78, 1.48, 0.6],
      highlightColor: "#fbbf24",
      enabledWhen: ["TRANSPORT_SELECTED"],
      actions: [
        {
          id: "maintain-spinal-precautions",
          label: "Maintain stabilization and restrict spinal motion",
          description: "Continue manual stabilization and apply spinal motion restriction per local protocol.",
          outcome: "correct",
          onSuccessEvents: ["SPINAL_PRECAUTIONS_MAINTAINED"],
          scoreEffect: 9,
          timeEffect: 18,
        },
        {
          id: "allow-driver-to-turn",
          label: "Ask the driver to turn and look at you",
          description: "Have the patient rotate the head to improve communication.",
          outcome: "incorrect",
          feedback:
            "The mechanism, confusion, and neck pain create spinal injury risk. Communicate without asking the patient to rotate the head or neck.",
          scoreEffect: -6,
          timeEffect: 12,
        },
        {
          id: "remove-stabilization",
          label: "Release stabilization after a patent airway",
          description: "Stop spinal protection because the patient is talking.",
          outcome: "incorrect",
          feedback:
            "A patent airway does not remove spinal risk. Maintain stabilization and limit unnecessary movement through extrication.",
          scoreEffect: -6,
          timeEffect: 12,
        },
      ],
    },
    {
      id: "extrication-plan",
      name: "Extrication Plan",
      category: "movement",
      visibleWhen: ["SPINAL_PRECAUTIONS_MAINTAINED"],
      completedWhen: ["EXTRICATION_COORDINATED"],
      position: [2.5, 1.2, 0.25],
      focusPosition: [6.0, 3.0, 5.5],
      focusTarget: [2.2, 1.1, 0.45],
      highlightColor: "#67e8f9",
      enabledWhen: ["SPINAL_PRECAUTIONS_MAINTAINED"],
      actions: [
        {
          id: "coordinate-controlled-extrication",
          label: "Coordinate a controlled rapid extrication",
          description: "Work with fire-rescue to remove the patient promptly while maintaining ABC support and spinal motion restriction.",
          outcome: "correct",
          onSuccessEvents: ["EXTRICATION_COORDINATED"],
          scoreEffect: 10,
          timeEffect: 30,
        },
        {
          id: "self-extricate-driver",
          label: "Have the driver climb out",
          description: "Ask the confused patient to exit the vehicle without assistance.",
          outcome: "incorrect",
          feedback:
            "Confusion, neck pain, chest injury, and poor perfusion make unassisted self-extrication unsafe. Coordinate controlled removal with fire-rescue.",
          scoreEffect: -7,
          timeEffect: 18,
        },
        {
          id: "prolonged-roadside-exam",
          label: "Delay extrication for a full head-to-toe exam",
          description: "Keep the high-priority patient in the vehicle for a prolonged assessment.",
          outcome: "incorrect",
          feedback:
            "Do not prolong scene time for this unstable trauma patient. Coordinate extrication, treat immediate threats, and continue assessment during transport.",
          scoreEffect: -6,
          timeEffect: 25,
        },
      ],
    },
    {
      id: "rapid-trauma-exam",
      name: "Rapid Trauma Exam",
      category: "patient",
      visibleWhen: ["EXTRICATION_COORDINATED"],
      completedWhen: ["FOCUSED_EXAM_COMPLETED"],
      position: [2.05, 1.36, 0.62],
      focusPosition: [5.1, 2.6, 4.7],
      focusTarget: [2.05, 1.3, 0.55],
      highlightColor: "#f59e0b",
      enabledWhen: ["EXTRICATION_COORDINATED"],
      actions: [
        {
          id: "perform-rapid-trauma-exam",
          label: "Perform a rapid head-to-toe trauma exam",
          description: "Assess the head, neck, chest, abdomen, pelvis, and extremities during controlled extrication without prolonging scene time.",
          outcome: "correct",
          onSuccessEvents: ["FOCUSED_EXAM_COMPLETED"],
          scoreEffect: 9,
          timeEffect: 30,
        },
        {
          id: "examine-chest-only",
          label: "Examine only the painful chest",
          description: "Limit the exam to the patient's chief complaint.",
          outcome: "incorrect",
          feedback:
            "A significant collision with altered mentation can cause multisystem injury. Perform a rapid head-to-toe trauma exam rather than anchoring on the chest.",
          scoreEffect: -6,
          timeEffect: 18,
        },
        {
          id: "detailed-extremity-exam-first",
          label: "Start with a detailed extremity exam",
          description: "Document every extremity finding before assessing the torso.",
          outcome: "incorrect",
          feedback:
            "Prioritize a rapid exam for life threats in the head, neck, chest, abdomen, and pelvis. Detailed extremity assessment can continue during transport.",
          scoreEffect: -5,
          timeEffect: 22,
        },
      ],
    },
    {
      id: "focused-history",
      name: "Focused Trauma History",
      category: "patient",
      visibleWhen: ["FOCUSED_EXAM_COMPLETED"],
      completedWhen: ["FOCUSED_HISTORY_OBTAINED"],
      position: [1.86, 1.58, 0.62],
      focusPosition: [4.9, 2.55, 4.55],
      focusTarget: [2.02, 1.38, 0.58],
      highlightColor: "#c084fc",
      enabledWhen: ["FOCUSED_EXAM_COMPLETED"],
      actions: [
        {
          id: "obtain-ample-and-neurologic-checks",
          label: "Obtain AMPLE and repeat neurologic and distal PMS checks",
          description: "Use concise questions and available scene information while checking pupils, mentation, and distal pulse, motor, and sensation.",
          outcome: "correct",
          onSuccessEvents: ["FOCUSED_HISTORY_OBTAINED"],
          scoreEffect: 8,
          timeEffect: 25,
        },
        {
          id: "rely-on-vehicle-damage",
          label: "Rely on vehicle damage alone",
          description: "Use the collision appearance instead of asking the patient or checking neurologic status.",
          outcome: "incorrect",
          feedback:
            "Mechanism guides suspicion but does not replace AMPLE history, neurologic reassessment, or distal pulse, motor, and sensation checks.",
          scoreEffect: -5,
          timeEffect: 15,
        },
        {
          id: "obtain-complete-social-history",
          label: "Take a complete social history",
          description: "Delay transport to collect nonurgent background details.",
          outcome: "incorrect",
          feedback:
            "Keep the history focused and time-conscious. Prioritize AMPLE, event details, neurologic status, and distal PMS while transport continues.",
          scoreEffect: -4,
          timeEffect: 20,
        },
      ],
    },
    {
      id: "patient-reassessment",
      name: "Reassess Driver",
      category: "patient",
      visibleWhen: ["FOCUSED_HISTORY_OBTAINED"],
      completedWhen: ["REASSESSMENT_COMPLETED"],
      position: [2.05, 1.42, 0.62],
      focusPosition: [5.1, 2.6, 4.7],
      focusTarget: [2.05, 1.3, 0.55],
      highlightColor: "#2dd4bf",
      enabledWhen: ["FOCUSED_HISTORY_OBTAINED"],
      actions: [
        {
          id: "repeat-trauma-primary-and-vitals",
          label: "Repeat primary assessment and vital signs",
          description: "Recheck mental status, airway, breathing, perfusion, BP, and SpO2 during extrication.",
          outcome: "correct",
          onSuccessEvents: ["REASSESSMENT_COMPLETED"],
          scoreEffect: 10,
          timeEffect: 30,
        },
        {
          id: "wait-until-hospital-reassessment",
          label: "Wait until hospital arrival to reassess",
          description: "Assume the initial findings remain unchanged through extrication.",
          outcome: "incorrect",
          feedback:
            "Trauma patients can deteriorate quickly, especially during movement. Repeat the primary assessment and vital signs now and throughout transport.",
          scoreEffect: -7,
          timeEffect: 20,
        },
        {
          id: "recheck-pain-only",
          label: "Ask only whether the pain changed",
          description: "Use the pain report as the sole reassessment.",
          outcome: "incorrect",
          feedback:
            "Pain is only one data point. Repeat mental status, airway, breathing, circulation, and vital signs to identify deterioration.",
          scoreEffect: -4,
          timeEffect: 12,
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
    decisionHistory: [],
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

export function getActionFailureEvents(action: InteractionAction) {
  return action.failureEvents ?? action.onFailureEvents ?? [];
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
  const medicalProfile =
    ADDITIONAL_MEDICAL_PROFILES[
      state.scenarioId as AdditionalMedicalScenarioId
    ];

  if (medicalProfile) {
    switch (event) {
      case "CRASH_SCENE_INSPECTED":
        return "Scene size-up complete: one medical patient, clear access, and no immediate hazards. Prepare PPE before approaching.";
      case "MEDICAL_BAG_OPENED":
        return "The medical bag is open. Gloves are ready.";
      case "GLOVES_EQUIPPED":
      case "PPE_EQUIPPED":
        return "Gloves on. BSI/PPE is complete.";
      case "PATIENT_APPROACHED":
        return "You bring the aid bag and move to the patient's side.";
      case "GENERAL_IMPRESSION_OBSERVED":
        return `General impression: ${medicalProfile.generalImpression}`;
      case "RESPONSIVENESS_CHECKED":
        return medicalProfile.patientReply;
      case "AIRWAY_OPENED":
        return `Airway: ${medicalProfile.airway}.`;
      case "RESPIRATIONS_COUNTED":
        return `Breathing: ${medicalProfile.breathing}. RR ${medicalProfile.vitals.respiratoryRate}.`;
      case "PULSE_CHECKED":
        return `Circulation: ${medicalProfile.circulation}. Pulse ${medicalProfile.vitals.heartRate}.`;
      case "BLOOD_PRESSURE_OBTAINED":
        return `Blood pressure obtained: ${medicalProfile.vitals.systolicBP}/${medicalProfile.vitals.diastolicBP}.`;
      case "SPO2_OBTAINED":
        return `Pulse oximetry obtained: SpO2 ${medicalProfile.vitals.spo2}%.`;
      case "WORKING_IMPRESSION_SELECTED":
        return `Working impression: ${medicalProfile.impression}. Choose the immediate care that fits this presentation.`;
      case "OXYGEN_APPLIED":
        return medicalProfile.breathingSupportDescription ?? "Breathing support applied.";
      case "SCENARIO_MEDICATION_ADMINISTERED":
        return `${medicalProfile.medicationLabel}. Continue monitoring and prepare for transport.`;
      case "TRANSPORT_SELECTED":
        return "Prompt transport selected. Continue treatment, focused assessment, and frequent reassessment en route.";
      case "FOCUSED_HISTORY_OBTAINED":
        return `Focused history: ${medicalProfile.history}`;
      case "FOCUSED_EXAM_COMPLETED":
        return `Focused exam: ${medicalProfile.exam}`;
      case "REASSESSMENT_COMPLETED":
        return `Reassessment: ${medicalProfile.reassessment}`;
      default:
        break;
    }
  }

  switch (event) {
    case "AMBULANCE_EXITED":
      return "You step out and scan the scene from a safe distance. The dog is actively blocking the patient.";
    case "DOG_SELECTED":
      return "The dog is barking, tense, and between you and the patient.";
    case "DOG_INSPECTED":
      return "Hazard identified: the dog is blocking safe patient access. Rotate the scene to find the highlighted ambulance radio.";
    case "DOG_AGITATED":
      return "The dog lunges closer. You step back and lose time. The patient is still not safely reachable.";
    case "CRASH_HAZARD_BREACHED":
      return "Unsafe approach stopped: moving traffic, smoke, and an unstabilized vehicle still threaten the crew and patient.";
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
        : "Working impression: anaphylaxis with respiratory compromise and signs of poor perfusion. Treat the life threat now.";
    case "TRANSPORT_SELECTED":
      return isCrash
        ? "Rapid trauma transport selected. Maintain spinal motion restriction and coordinate extrication with fire-rescue."
        : "Urgent transport selected. Obtain baseline monitor values while transport preparation continues.";
    case "SECONDARY_UNLOCKED":
      return "Primary assessment complete. Secondary assessment is now unlocked.";
    case "EPINEPHRINE_ADMINISTERED":
      return "IM epinephrine administered per protocol. Continue oxygenation support and prepare for rapid transport.";
    case "SCENARIO_MEDICATION_ADMINISTERED":
      return "Scenario-appropriate medication administered. Continue monitoring and transport preparation.";
    case "OXYGEN_APPLIED":
      return isCrash
        ? "Oxygen applied. Continue assessing ventilation, chest movement, perfusion, and any need for assisted ventilation."
        : "Oxygen applied. Work of breathing remains increased; continue urgent transport preparation and reassess the full response.";
    case "SPINAL_PRECAUTIONS_MAINTAINED":
      return "Manual stabilization and spinal motion restriction are maintained. Coordinate a controlled, time-conscious extrication.";
    case "EXTRICATION_COORDINATED":
      return "Fire-rescue begins controlled extrication while you maintain ABC support and spinal protection. Continue with a rapid trauma exam.";
    case "FOCUSED_HISTORY_OBTAINED":
      return isCrash
        ? "Focused history: the restrained driver recalls the impact poorly, reports no anticoagulant use or known allergies, and has intact distal pulse, motor, and sensation. Mentation remains confused."
        : "Focused history: symptoms began within minutes of eating dessert containing nuts. The patient had a prior mild reaction and was prescribed an auto-injector but does not have it today.";
    case "FOCUSED_EXAM_COMPLETED":
      return isCrash
        ? "Rapid trauma exam: cervical tenderness, left chest tenderness and guarded movement, and a seat-belt bruise are present. The pelvis is stable and no major external bleeding is found."
        : "Focused exam: mild lip swelling, widespread hives, bilateral wheezing, and weak peripheral perfusion persist. There is no stridor, and breathing is beginning to improve.";
    case "REASSESSMENT_COMPLETED":
      return isCrash
        ? "Reassessment: the driver is more confused, respirations are 26, pulse 118 and weak, BP 98/64, and SpO2 93%. Continue rapid trauma transport with frequent reassessment."
        : "Reassessment: throat tightness and wheezing are improving. HR 116, RR 22, BP 104/68, and SpO2 95%. Continue urgent transport and monitor for recurrence.";
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
  const medicalProfile =
    ADDITIONAL_MEDICAL_PROFILES[
      state.scenarioId as AdditionalMedicalScenarioId
    ];

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
  if (event === "CRASH_SCENE_INSPECTED" && medicalProfile) {
    next.focusedObjectId = "medical-bag";
  }
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
    next.focusedObjectId = "dog";
    next.failedObjectives = next.failedObjectives.includes("dog-hazard")
      ? next.failedObjectives
      : [...next.failedObjectives, "dog-hazard"];
  }
  if (event === "CRASH_HAZARD_BREACHED") {
    next.focusedObjectId = "crash-vehicle";
    next.failedObjectives = next.failedObjectives.includes("crash-hazard")
      ? next.failedObjectives
      : [...next.failedObjectives, "crash-hazard"];
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
  if (
    event === "RESPIRATIONS_COUNTED" &&
    medicalProfile?.id === "opioid-overdose"
  ) {
    next.focusedObjectId = "oxygen-support";
  }
  if (event === "PULSE_CHECKED") next.focusedObjectId = "working-impression";
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
        medicalProfile
          ? medicalProfile.generalImpression
          : isCrash
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
        medicalProfile
          ? medicalProfile.responsiveness
          : isCrash
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
        medicalProfile
          ? medicalProfile.airway
          : isCrash
          ? "Airway patent while manual cervical stabilization is maintained"
          : "Airway patent with reported throat tightness"
      ),
    };
  }
  if (event === "RESPIRATIONS_COUNTED") {
    next.patient = {
      ...next.patient,
      breathingStatus: medicalProfile
        ? medicalProfile.breathing
        : isCrash
        ? "Shallow respirations, RR 24, guarded left chest movement"
        : "Wheezing, RR 28, increased work of breathing",
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? medicalProfile.breathing
          : isCrash
          ? "Shallow breathing with left chest pain and guarded movement"
          : "Wheezing with increased work of breathing"
      ),
      vitalsRevealed: revealVital(next, "respiratoryRate"),
      vitals: {
        ...next.patient.vitals,
        respiratoryRate: medicalProfile
          ? medicalProfile.vitals.respiratoryRate
          : isCrash
            ? 24
            : 28,
        spo2: medicalProfile ? medicalProfile.vitals.spo2 : isCrash ? 94 : 89,
      },
    };
  }
  if (event === "PULSE_CHECKED") {
    next.patient = {
      ...next.patient,
      circulationStatus: medicalProfile
        ? medicalProfile.circulation
        : isCrash
        ? "Rapid weak radial pulse, pale cool skin, no uncontrolled external bleeding"
        : "Rapid radial pulse, warm flushed skin, hives",
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? medicalProfile.circulation
          : isCrash
          ? "Rapid weak radial pulse with pale cool skin and no uncontrolled external bleeding"
          : "Rapid radial pulse with warm flushed skin and hives"
      ),
      vitalsRevealed: revealVital(next, "heartRate"),
      vitals: {
        ...next.patient.vitals,
        heartRate: medicalProfile ? medicalProfile.vitals.heartRate : isCrash ? 112 : 128,
        systolicBP: medicalProfile ? medicalProfile.vitals.systolicBP : isCrash ? 104 : 92,
        diastolicBP: medicalProfile ? medicalProfile.vitals.diastolicBP : isCrash ? 68 : 60,
      },
    };
  }
  if (event === "BLOOD_PRESSURE_OBTAINED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? `Blood pressure ${medicalProfile.vitals.systolicBP}/${medicalProfile.vitals.diastolicBP}`
          : isCrash
            ? "Blood pressure 104/68 with possible compensated shock"
            : "Hypotension: BP 92/60"
      ),
      vitalsRevealed: revealVital({ ...next, patient: { ...next.patient, vitalsRevealed: revealVital(next, "systolicBP") } }, "diastolicBP"),
    };
    next.focusedObjectId = "patient";
  }
  if (event === "SPO2_OBTAINED") {
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? `SpO2 ${medicalProfile.vitals.spo2}%`
          : isCrash
            ? "SpO2 94% on room air"
            : "Low SpO2: 89%"
      ),
      vitalsRevealed: revealVital(next, "spo2"),
    };
    next.focusedObjectId = medicalProfile || isCrash ? "working-impression" : "focused-history";
  }
  if (event === "WORKING_IMPRESSION_SELECTED") {
    next.patient = {
      ...next.patient,
      workingImpression: medicalProfile
        ? medicalProfile.impression
        : isCrash
        ? "Multisystem trauma with possible cervical spine, chest, and internal injuries"
        : "Anaphylaxis with respiratory compromise and signs of poor perfusion",
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? `Working impression: ${medicalProfile.impression}`
          : isCrash
          ? "Working impression selected from mechanism, altered mentation, chest pain, and perfusion findings"
          : "Working impression selected from throat tightness, hives, wheezing, and poor perfusion"
      ),
    };
    next.focusedObjectId = medicalProfile
      ? medicalProfile.requiresBreathingSupport
        ? "oxygen-support"
        : "scenario-treatment"
      : "transport-decision";
  }
  if (event === "TRANSPORT_SELECTED") {
    next.currentPhase = isCrash ? "interventions" : medicalProfile ? "transport" : "primaryAssessment";
    next.focusedObjectId = isCrash ? "spinal-protection" : medicalProfile ? "focused-history" : "patient";
  }
  if (event === "SECONDARY_UNLOCKED") {
    next.currentPhase = "secondaryAssessment";
    next.focusedObjectId = isCrash ? "rapid-trauma-exam" : "focused-history";
  }
  if (event === "EPINEPHRINE_ADMINISTERED") {
    next.currentPhase = "interventions";
    next.patient = {
      ...next.patient,
      medicationGiven: next.patient.medicationGiven.includes("epinephrine")
        ? next.patient.medicationGiven
        : [...next.patient.medicationGiven, "epinephrine"],
      findingsDiscovered: addFinding(next, "IM epinephrine administered for anaphylaxis"),
    };
    next.focusedObjectId = "oxygen-support";
  }
  if (event === "SCENARIO_MEDICATION_ADMINISTERED" && medicalProfile) {
    next.currentPhase = "interventions";
    next.patient = {
      ...next.patient,
      medicationGiven: next.patient.medicationGiven.includes(medicalProfile.medication)
        ? next.patient.medicationGiven
        : [...next.patient.medicationGiven, medicalProfile.medication],
      findingsDiscovered: addFinding(
        next,
        `${medicalProfile.medicationLabel} for ${medicalProfile.impression.toLowerCase()}`
      ),
    };
    next.focusedObjectId = "transport-decision";
  }
  if (event === "OXYGEN_APPLIED") {
    next.currentPhase = isCrash ? "primaryAssessment" : "interventions";
    next.patient = {
      ...next.patient,
      oxygenApplied: true,
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? medicalProfile.breathingSupportDescription ?? "Breathing support applied"
          : isCrash
          ? "Oxygen applied while ventilation and chest movement are monitored"
          : "Oxygen applied with ventilation monitored"
      ),
    };
    next.focusedObjectId = isCrash
      ? "pulse-hotspot"
      : medicalProfile
        ? medicalProfile.id === "opioid-overdose"
          ? "pulse-hotspot"
          : "scenario-treatment"
        : "transport-decision";
  }
  if (event === "SPINAL_PRECAUTIONS_MAINTAINED") {
    next.currentPhase = "interventions";
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(next, "Spinal motion restriction maintained during care"),
    };
    next.focusedObjectId = "extrication-plan";
  }
  if (event === "EXTRICATION_COORDINATED") {
    next.currentPhase = "interventions";
    next.patient = {
      ...next.patient,
      position: "controlled-extrication",
      findingsDiscovered: addFinding(next, "Controlled rapid extrication coordinated with fire-rescue"),
    };
    next.focusedObjectId = "rapid-trauma-exam";
  }
  if (event === "FOCUSED_HISTORY_OBTAINED") {
    next.currentPhase = "secondaryAssessment";
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? medicalProfile.history
          : isCrash
          ? "AMPLE history obtained with persistent confusion and intact distal pulse, motor, and sensation"
          : "Nut exposure with rapid symptom onset, prior reaction, and prescribed auto-injector not available"
      ),
    };
    next.focusedObjectId = isCrash ? "patient-reassessment" : "focused-exam";
  }
  if (event === "FOCUSED_EXAM_COMPLETED") {
    next.currentPhase = "secondaryAssessment";
    next.patient = {
      ...next.patient,
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? medicalProfile.exam
          : isCrash
          ? "Rapid trauma exam finds cervical and left chest tenderness with seat-belt bruising and no major external bleeding"
          : "Focused exam finds mild lip swelling, hives, bilateral wheezing, and weak peripheral perfusion without stridor"
      ),
    };
    next.focusedObjectId = isCrash ? "focused-history" : "patient-reassessment";
  }
  if (event === "REASSESSMENT_COMPLETED") {
    next.currentPhase = "complete";
    next.patient = {
      ...next.patient,
      responsiveness: medicalProfile
        ? medicalProfile.id === "opioid-overdose"
          ? "Opens eyes to voice, confused"
          : "Alert, improving"
        : isCrash
        ? "Responds to voice, increasingly confused"
        : "Alert, less anxious, speaking in longer phrases",
      airwayStatus: medicalProfile
        ? "Patent and maintained"
        : isCrash
        ? "Patent with spinal motion restriction maintained"
        : "Patent, throat tightness improving",
      breathingStatus: medicalProfile
        ? `Improving, RR ${medicalProfile.reassessedVitals.respiratoryRate}`
        : isCrash
        ? "Shallow respirations, RR 26, persistent left chest pain"
        : "Wheezing improving, RR 22, work of breathing reduced",
      circulationStatus: medicalProfile
        ? "Perfusion improving"
        : isCrash
        ? "Rapid weak radial pulse, pale cool skin, worsening perfusion"
        : "Rapid radial pulse, hives persist, perfusion improving",
      findingsDiscovered: addFinding(
        next,
        medicalProfile
          ? medicalProfile.reassessment
          : isCrash
          ? "Repeat ABCs and vital signs show worsening compensated shock"
          : "Repeat ABCs and vital signs show partial response to epinephrine and oxygen"
      ),
      vitalsRevealed: [
        "heartRate",
        "respiratoryRate",
        "systolicBP",
        "diastolicBP",
        "spo2",
      ],
      vitals: medicalProfile
        ? { ...medicalProfile.reassessedVitals }
        : isCrash
        ? {
            heartRate: 118,
            respiratoryRate: 26,
            systolicBP: 98,
            diastolicBP: 64,
            spo2: 93,
          }
        : {
            heartRate: 116,
            respiratoryRate: 22,
            systolicBP: 104,
            diastolicBP: 68,
            spo2: 95,
          },
    };
    next.focusedObjectId = "patient-reassessment";
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
  if (completedObjectives.length === scenario.objectives.length) {
    return {
      ...state,
      completedObjectives,
      currentObjectiveId: scenario.objectives[scenario.objectives.length - 1].id,
      currentPhase: "complete",
      focusedObjectId: "patient-reassessment",
    };
  }
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

      const decisionOutcome =
        interaction.outcome ?? "correct";

      if (interaction.outcome === "incorrect") {
        let next = state;
        getActionFailureEvents(interaction).forEach((event) => {
          next = applyEvent(next, event);
        });
        const hasSafetyFailure =
          next.failedObjectives.includes("dog-hazard") ||
          next.failedObjectives.includes("crash-hazard");
        const maxScore = hasSafetyFailure ? 88 : 100;
        return {
          ...next,
          decisionHistory: [
            ...next.decisionHistory,
            {
              objectId: object.id,
              objectName: object.name,
              actionId: interaction.id,
              actionLabel: interaction.label,
              outcome: "incorrect",
              feedback: interaction.feedback,
              phase: state.currentPhase,
              objectiveId: state.currentObjectiveId,
              elapsedTime: state.elapsedTime,
            },
          ],
          selectedObjectId: object.id,
          focusedObjectId: object.id,
          feedback:
            interaction.feedback ??
            "That action does not fit the patient's current presentation. Reassess and choose another option.",
          elapsedTime: next.elapsedTime + (interaction.timeEffect ?? 10),
          score: Math.max(0, Math.min(maxScore, next.score + (interaction.scoreEffect ?? -3))),
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
        (object.id === "medical-bag" || object.id === "patient") &&
        hasRemainingObjectActions;
      const hasSafetyFailure =
        next.failedObjectives.includes("dog-hazard") ||
        next.failedObjectives.includes("crash-hazard");
      const maxScore = hasSafetyFailure ? 88 : 100;
      next = {
        ...next,
        decisionHistory: [
          ...next.decisionHistory,
          {
            objectId: object.id,
            objectName: object.name,
              actionId: interaction.id,
              actionLabel: interaction.label,
              outcome: decisionOutcome,
            feedback: interaction.feedback ?? interaction.description,
            phase: state.currentPhase,
            objectiveId: state.currentObjectiveId,
            elapsedTime: state.elapsedTime,
          },
        ],
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
  const medicalProfile =
    ADDITIONAL_MEDICAL_PROFILES[
      state.scenarioId as AdditionalMedicalScenarioId
    ];
  const unsafeDog = state.failedObjectives.includes("dog-hazard");
  const unsafeCrash = state.failedObjectives.includes("crash-hazard");
  const sceneInspected = state.triggeredEvents.includes(
    isCrash || medicalProfile ? "CRASH_SCENE_INSPECTED" : "DOG_INSPECTED"
  );
  const resourcesRequested = medicalProfile
    ? true
    : state.triggeredEvents.includes(
        isCrash ? "FIRE_RESCUE_CALLED" : "ANIMAL_CONTROL_CALLED"
      );
  const assessmentEvents: SceneEvent[] = [
    "GENERAL_IMPRESSION_OBSERVED",
    "RESPONSIVENESS_CHECKED",
    "AIRWAY_OPENED",
    "RESPIRATIONS_COUNTED",
    "PULSE_CHECKED",
    "BLOOD_PRESSURE_OBTAINED",
    "SPO2_OBTAINED",
    "FOCUSED_HISTORY_OBTAINED",
    "FOCUSED_EXAM_COMPLETED",
  ];
  const completedAssessment = assessmentEvents.filter((event) => state.triggeredEvents.includes(event)).length;
  const workingImpressionSelected = state.triggeredEvents.includes("WORKING_IMPRESSION_SELECTED");
  const transportSelected = state.triggeredEvents.includes("TRANSPORT_SELECTED");
  const treatmentEvents: SceneEvent[] = medicalProfile
    ? [
        ...(medicalProfile.requiresBreathingSupport
          ? (["OXYGEN_APPLIED"] as SceneEvent[])
          : []),
        "SCENARIO_MEDICATION_ADMINISTERED",
      ]
    : isCrash
      ? ["OXYGEN_APPLIED", "SPINAL_PRECAUTIONS_MAINTAINED", "EXTRICATION_COORDINATED"]
      : ["EPINEPHRINE_ADMINISTERED", "OXYGEN_APPLIED"];
  const completedTreatment = treatmentEvents.filter((event) => state.triggeredEvents.includes(event)).length;
  const reassessmentCompleted = state.triggeredEvents.includes("REASSESSMENT_COMPLETED");
  const incorrectDecisionCount = state.decisionHistory.filter(
    (decision) => decision.outcome === "incorrect"
  ).length;
  const clinicalDecisionPenalty = Math.min(60, incorrectDecisionCount * 12);

  return {
    safety: Math.max(
      0,
      100 -
        (isCrash ? (unsafeCrash ? 35 : 0) : medicalProfile ? 0 : unsafeDog ? 35 : 0) -
        (sceneInspected ? 0 : 35) -
        (resourcesRequested ? 0 : 30)
    ),
    assessment: Math.round((completedAssessment / assessmentEvents.length) * 100),
    clinicalDecisions: Math.max(
      0,
      (workingImpressionSelected ? (transportSelected ? 100 : 65) : 0) -
        clinicalDecisionPenalty
    ),
    treatment: Math.round((completedTreatment / treatmentEvents.length) * 100),
    reassessment: reassessmentCompleted ? 100 : 0,
    communication:
      (medicalProfile ? (sceneInspected ? 50 : 0) : resourcesRequested ? 50 : 0) +
      (state.triggeredEvents.includes("RESPONSIVENESS_CHECKED") ? 50 : 0),
    efficiency: Math.max(
      45,
      100 -
        state.hintsUsed * 6 -
        incorrectDecisionCount * 5 -
        Math.floor(state.elapsedTime / 60) * 3 -
        (isCrash ? (unsafeCrash ? 14 : 0) : medicalProfile ? 0 : unsafeDog ? 14 : 0)
    ),
  };
}

export function buildScenarioDebrief(state: ScenarioState) {
  const isCrash = state.scenarioId === carAccidentScenario.id;
  const medicalProfile =
    ADDITIONAL_MEDICAL_PROFILES[
      state.scenarioId as AdditionalMedicalScenarioId
    ];
  const score = getScenarioScoreBreakdown(state);
  const correct: string[] = [];
  const missed: string[] = [];
  const unsafe: string[] = [];
  const decisionReview = state.decisionHistory
    .filter((decision) => decision.outcome === "incorrect")
    .filter(
      (decision, index, decisions) =>
        decisions.findIndex((candidate) => candidate.actionId === decision.actionId) === index
    )
    .map((decision) => ({
      choice: decision.actionLabel,
      context: decision.objectName,
      rationale:
        decision.feedback ??
        "Reassess the available findings and choose the action that addresses the highest-priority threat.",
    }));

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
  } else if (medicalProfile) {
    if (state.triggeredEvents.includes("CRASH_SCENE_INSPECTED")) {
      correct.push("Completed a scene size-up before approaching the medical patient.");
    } else {
      missed.push("The patient area was not inspected before approach.");
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

  const primaryAssessmentEvents: SceneEvent[] = [
    "GENERAL_IMPRESSION_OBSERVED",
    "RESPONSIVENESS_CHECKED",
    "AIRWAY_OPENED",
    "RESPIRATIONS_COUNTED",
    "PULSE_CHECKED",
  ];
  if (primaryAssessmentEvents.every((event) => state.triggeredEvents.includes(event))) {
    correct.push(
      isCrash
        ? "Completed general impression, responsiveness, airway with spinal precautions, breathing, and circulation."
        : medicalProfile
          ? "Completed general impression, responsiveness, airway, breathing, and circulation in sequence."
        : "Completed general impression, responsiveness, airway, breathing, and circulation before equipment-based vital signs."
    );
  } else {
    missed.push("The general impression and primary ABC assessment were incomplete.");
  }

  if (state.triggeredEvents.includes("BLOOD_PRESSURE_OBTAINED") && state.triggeredEvents.includes("SPO2_OBTAINED")) {
    correct.push("Obtained baseline BP and SpO2 after the ABC assessment.");
  } else {
    missed.push("Baseline vital signs were incomplete.");
  }

  if (state.triggeredEvents.includes("WORKING_IMPRESSION_SELECTED")) {
    correct.push(
      isCrash
        ? "Formed a trauma working impression from the mechanism, confusion, and chest and neck findings."
        : medicalProfile
          ? `Formed the working impression of ${medicalProfile.impression.toLowerCase()} from the complete presentation.`
        : "Formed a working impression from hives, wheezing, hypoxia, and hypotension."
    );
  } else {
    missed.push("Working impression was not selected from the gathered findings.");
  }

  if (state.triggeredEvents.includes("TRANSPORT_SELECTED")) {
    correct.push(
      isCrash
        ? "Selected rapid transport to an appropriate trauma center while coordinating controlled extrication."
        : "Recognized the patient as high priority and selected urgent transport without prolonging scene time."
    );
  } else {
    missed.push("Transport priority was not selected from the primary assessment findings.");
  }

  if (isCrash) {
    if (
      state.triggeredEvents.includes("OXYGEN_APPLIED") &&
      state.triggeredEvents.includes("SPINAL_PRECAUTIONS_MAINTAINED") &&
      state.triggeredEvents.includes("EXTRICATION_COORDINATED")
    ) {
      correct.push(
        "Supported oxygenation, maintained spinal protection, and coordinated a controlled, time-conscious extrication."
      );
    } else {
      missed.push("Breathing support, spinal protection, and controlled extrication were not all completed.");
    }
  } else if (medicalProfile) {
    const medicationComplete = state.triggeredEvents.includes(
      "SCENARIO_MEDICATION_ADMINISTERED"
    );
    const breathingSupportComplete =
      !medicalProfile.requiresBreathingSupport ||
      state.triggeredEvents.includes("OXYGEN_APPLIED");
    if (medicationComplete && breathingSupportComplete) {
      correct.push(
        `Provided the indicated immediate care, including ${medicalProfile.medication}.`
      );
    } else {
      missed.push("The scenario-specific immediate treatment was incomplete.");
    }
  } else if (
    state.triggeredEvents.includes("EPINEPHRINE_ADMINISTERED") &&
    state.triggeredEvents.includes("OXYGEN_APPLIED")
  ) {
    correct.push("Administered first-line epinephrine and supported oxygenation without delaying transport.");
  } else {
    missed.push("Immediate anaphylaxis treatment with epinephrine and oxygenation support was incomplete.");
  }

  if (
    state.triggeredEvents.includes("FOCUSED_HISTORY_OBTAINED") &&
    state.triggeredEvents.includes("FOCUSED_EXAM_COMPLETED")
  ) {
    correct.push(
      isCrash
        ? "Completed a rapid head-to-toe trauma exam, focused AMPLE history, neurologic reassessment, and distal PMS checks without delaying transport."
        : medicalProfile
          ? "Completed a targeted history and complaint-directed focused exam while transport continued."
        : "Completed a focused allergy history and targeted airway, breathing, skin, and perfusion exam while urgent transport preparation continued."
    );
  } else {
    missed.push(
      isCrash
        ? "The rapid trauma exam and focused trauma history were not both completed."
        : medicalProfile
          ? "The targeted history and focused exam were not both completed."
        : "The focused allergy history and targeted secondary exam were not both completed."
    );
  }

  if (state.triggeredEvents.includes("REASSESSMENT_COMPLETED")) {
    correct.push(
      isCrash
        ? "Repeated the primary assessment and vital signs during extrication, identifying worsening perfusion."
        : medicalProfile
          ? "Repeated the primary assessment and vital signs after treatment to measure the response."
        : "Repeated the ABCs and vital signs after treatment, confirming improvement while watching for recurrence."
    );
  } else {
    missed.push("The patient's response to treatment was not reassessed.");
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
    decisionReview,
    decisionsMade: state.decisionHistory.length,
    incorrectDecisions: state.decisionHistory.filter(
      (decision) => decision.outcome === "incorrect"
    ).length,
    priorityTakeaway:
      unsafe[0] ??
      decisionReview[0]?.rationale ??
      (isCrash
        ? "Significant mechanism, altered mentation, chest findings, and worsening perfusion demand rapid trauma transport with repeated primary assessment."
        : medicalProfile
          ? `${medicalProfile.impression} requires prompt treatment, transport, and reassessment.`
        : "Anaphylaxis with respiratory and perfusion compromise requires early epinephrine, oxygenation support, urgent transport, and frequent reassessment."),
    recommendedReview: isCrash
      ? {
          title: "Review shock vital-sign patterns",
          href: "/learn/emt-shock-vital-sign-patterns",
        }
      : medicalProfile
        ? {
            title: "Review the EMT primary assessment",
            href: "/learn/emt-primary-assessment-sequence",
          }
      : {
          title: "Review recognizing anaphylaxis",
          href: "/learn/recognizing-anaphylaxis-emt-assessment",
        },
    findings: state.patient.findingsDiscovered,
    summary:
      state.triggeredEvents.includes("REASSESSMENT_COMPLETED")
        ? isCrash
          ? "Scenario complete: worsening mentation, breathing, and perfusion during extrication confirm the need for rapid transport to a trauma center and continuous reassessment."
          : medicalProfile
            ? `Scenario complete: the patient was treated for ${medicalProfile.impression.toLowerCase()}, transported, and reassessed for response.`
          : "Scenario complete: epinephrine and oxygenation support produced a partial response, but anaphylaxis still requires urgent transport and monitoring for recurrence."
        : state.triggeredEvents.includes("TRANSPORT_SELECTED")
          ? "Transport priority selected. Continue immediate treatment and reassess the patient before completing the scenario."
        : "Scenario in progress. Continue collecting assessment findings before choosing transport priority.",
  };
}
