import { getCityLocation } from './sickCityLocations';
import { CLINICAL_SCENARIOS, type ClinicalScenarioId } from "./clinicalScenarios";
export type SickCityCallId =
  | `clinical-${ClinicalScenarioId}`
  | "park-fall"
  | "market-breathing"
  | "plaza-diabetic"
  | "cyclist-trauma"
  | "station-chest-pain";

export type SickCityPose = "seated" | "standing" | "supine";

export type SickCityAssessmentStep = {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    correct: boolean;
    feedback: string;
  }>;
  patientReply: string;
};

export type SickCityCall = {
  id: SickCityCallId;
  code: string;
  locationId: string;
  title: string;
  summary: string;
  district: "Maple Market" | "Civic Center" | "Riverside Park" | "Station Quarter";
  location: string;
  distanceLabel: string;
  priority: "Routine" | "Urgent" | "High priority";
  position: [number, number, number];
  pose: SickCityPose;
  shirtColor: string;
  patientLabel: string;
  initialPatientLine: string;
  completionTitle: string;
  completionCopy: string;
  learningPearl: string;
  rewardXp: number;
  steps: SickCityAssessmentStep[];
  clinicalScenarioId?: ClinicalScenarioId;
};

export const SICK_CITY_CALLS: SickCityCall[] = [
  {
    id: "park-fall",
    locationId: "park-east",
    code: "MED-21",
    title: "Fall near Riverside Park",
    summary: "Adult with ankle pain after stepping off a curb. Patient is conscious and breathing normally.",
    district: "Riverside Park",
    location: "Maple Street and 4th Avenue",
    distanceLabel: "0.8 mi",
    priority: "Routine",
    position: getCityLocation("park-east").position,
    pose: "supine",
    shirtColor: "#334155",
    patientLabel: "Injured person on the grass",
    initialPatientLine: "I stepped down wrong. My ankle hurts, but I did not hit my head.",
    completionTitle: "Ankle call stabilized",
    completionCopy: "You ruled out immediate threats, completed a focused distal exam, supported the injury, and selected an appropriate transport plan.",
    learningPearl: "A focused injury still begins with scene safety and a primary assessment. Check distal circulation, sensation, and movement before and after support.",
    rewardXp: 80,
    steps: [
      {
        id: "scene",
        prompt: "You reach the patient. What comes first?",
        options: [
          { id: "scene-safe", label: "Confirm scene safety and introduce yourself", correct: true, feedback: "Correct. Control the environment before beginning patient care." },
          { id: "walk-now", label: "Ask the patient to walk immediately", correct: false, feedback: "Not yet. Establish scene safety and a general impression before stressing the injury." },
          { id: "splint-now", label: "Apply a splint without assessment", correct: false, feedback: "Support may be appropriate, but first identify threats and assess the limb." },
        ],
        patientReply: "The sidewalk is clear. I am alert and can answer your questions.",
      },
      {
        id: "primary",
        prompt: "The patient is alert. What should you evaluate next?",
        options: [
          { id: "abc", label: "General impression, airway, breathing, and circulation", correct: true, feedback: "Correct. A focused injury still begins with a rapid primary assessment." },
          { id: "remove-shoe", label: "Pull the shoe off immediately", correct: false, feedback: "Rapid removal can worsen pain or deformity. Complete the primary assessment first." },
          { id: "history-only", label: "Ask only about medical history", correct: false, feedback: "History matters, but it cannot replace the primary assessment." },
        ],
        patientReply: "My breathing feels normal. I have a strong radial pulse and no other pain.",
      },
      {
        id: "focused",
        prompt: "Which focused exam is most useful now?",
        options: [
          { id: "ankle-exam", label: "Inspect, palpate Ottawa landmarks, and check distal CMS", correct: true, feedback: "Correct. Compare the limb and document circulation, sensation, and movement." },
          { id: "force-rom", label: "Force the ankle through full range of motion", correct: false, feedback: "Do not force painful movement. Inspect, palpate, and assess distal function gently." },
          { id: "skip-distal", label: "Skip distal circulation and sensation", correct: false, feedback: "Distal neurovascular findings are essential before and after support." },
        ],
        patientReply: "There is lateral swelling. My toes are warm, and I can feel and move them.",
      },
      {
        id: "plan",
        prompt: "No deformity or neurovascular deficit is present. Choose the plan.",
        options: [
          { id: "support", label: "Support the ankle, limit weight bearing, and arrange evaluation", correct: true, feedback: "Correct. Protect the injury, reassess distal CMS, and transport according to local protocol." },
          { id: "walk-off", label: "Tell the patient to walk it off", correct: false, feedback: "That risks worsening the injury and does not provide an appropriate evaluation plan." },
          { id: "emergent", label: "Use lights and sirens for isolated stable ankle pain", correct: false, feedback: "The patient is stable. Transport urgency should match the clinical findings." },
        ],
        patientReply: "The support helps. My toes still feel normal.",
      },
    ],
  },
  {
    id: "market-breathing",
    locationId: "market-corner",
    code: "RESP-08",
    title: "Breathing problem outside Corner Market",
    summary: "Adult with worsening shortness of breath. Caller reports the patient can speak only a few words at a time.",
    district: "Maple Market",
    location: "Corner Market, Grant Avenue",
    distanceLabel: "0.5 mi",
    priority: "High priority",
    position: getCityLocation("market-corner").position,
    pose: "standing",
    shirtColor: "#7c3aed",
    patientLabel: "Person struggling to breathe",
    initialPatientLine: "I cannot catch my breath. My inhaler did not help much.",
    completionTitle: "Respiratory call stabilized",
    completionCopy: "You recognized respiratory distress, prioritized oxygenation and ventilation, and chose prompt transport with reassessment.",
    learningPearl: "Work of breathing, speech, mental status, and chest movement help determine whether ventilation is adequate. Improvement still requires reassessment.",
    rewardXp: 100,
    steps: [
      {
        id: "scene",
        prompt: "The patient is standing and visibly distressed. What comes first?",
        options: [
          { id: "impression", label: "Scene safety, PPE, and a rapid general impression", correct: true, feedback: "Correct. Respiratory distress should be recognized from the doorway." },
          { id: "history", label: "Begin a complete medical history", correct: false, feedback: "Do not delay immediate assessment of airway and breathing for a full history." },
          { id: "walk", label: "Walk the patient to the ambulance", correct: false, feedback: "Exertion may worsen respiratory distress. Assess and support the patient where found." },
        ],
        patientReply: "I can only get out a few words at a time.",
      },
      {
        id: "primary",
        prompt: "What is the priority assessment?",
        options: [
          { id: "airway-breathing", label: "Assess airway, breathing effort, lung sounds, and oxygenation", correct: true, feedback: "Correct. Determine whether breathing is adequate and whether ventilation support is needed." },
          { id: "blood-pressure", label: "Obtain only a blood pressure", correct: false, feedback: "A blood pressure alone does not establish whether ventilation is adequate." },
          { id: "temperature", label: "Check temperature before breathing", correct: false, feedback: "Temperature can wait while you evaluate the immediate breathing threat." },
        ],
        patientReply: "My airway is open, but I am breathing fast with diffuse wheezing.",
      },
      {
        id: "treatment",
        prompt: "Breathing is labored but currently adequate. What is most appropriate?",
        options: [
          { id: "position-oxygen", label: "Position for comfort, support oxygenation, and assist indicated medication", correct: true, feedback: "Correct. Treat within scope while watching closely for fatigue or declining ventilation." },
          { id: "supine", label: "Lay the patient flat", correct: false, feedback: "A flat position may worsen respiratory distress. Allow a position that supports breathing." },
          { id: "delay", label: "Wait to see whether it resolves", correct: false, feedback: "This patient has significant distress and needs treatment and transport now." },
        ],
        patientReply: "Sitting upright and the treatment are helping me speak more clearly.",
      },
      {
        id: "transport",
        prompt: "The patient improves slightly but remains symptomatic. What next?",
        options: [
          { id: "prompt-transport", label: "Begin prompt transport and reassess breathing frequently", correct: true, feedback: "Correct. Improvement does not remove the need for transport and repeated assessment." },
          { id: "release", label: "Release the patient because symptoms improved", correct: false, feedback: "Partial improvement can be temporary. Continued monitoring and evaluation are needed." },
          { id: "walk-home", label: "Have the patient walk home with the inhaler", correct: false, feedback: "That is unsafe given the severity of the initial presentation." },
        ],
        patientReply: "I am breathing easier, but I still feel tightness in my chest.",
      },
    ],
  },
  {
    id: "plaza-diabetic",
    locationId: "civic-plaza",
    code: "MED-14",
    title: "Altered person near City Plaza",
    summary: "Bystander reports a person became confused and sat down suddenly. No trauma was witnessed.",
    district: "Civic Center",
    location: "City Plaza transit stop",
    distanceLabel: "0.9 mi",
    priority: "Urgent",
    position: getCityLocation("civic-plaza").position,
    pose: "supine",
    shirtColor: "#0f766e",
    patientLabel: "Confused person",
    initialPatientLine: "I feel shaky... I do not know what happened.",
    completionTitle: "Diabetic emergency recognized",
    completionCopy: "You protected the airway, checked glucose early, treated a reversible cause, and reassessed mental status before transport.",
    learningPearl: "A glucose check belongs early in the evaluation of unexplained altered mental status, but airway protection always comes first.",
    rewardXp: 90,
    steps: [
      {
        id: "scene",
        prompt: "The patient appears confused. What is your first priority?",
        options: [
          { id: "safe-responsive", label: "Confirm safety and assess responsiveness and airway", correct: true, feedback: "Correct. Altered mental status can rapidly threaten airway protection." },
          { id: "stand", label: "Stand the patient up", correct: false, feedback: "Do not stand a confused patient before identifying the cause and fall risk." },
          { id: "food", label: "Give food immediately", correct: false, feedback: "First confirm airway protection and identify whether hypoglycemia is actually present." },
        ],
        patientReply: "I open my eyes to your voice and can follow simple commands.",
      },
      {
        id: "primary",
        prompt: "Airway and breathing are adequate. What should be checked early?",
        options: [
          { id: "glucose", label: "Check blood glucose while completing the primary assessment", correct: true, feedback: "Correct. Hypoglycemia is a common reversible cause of altered mental status." },
          { id: "orthostatics", label: "Perform standing orthostatic vitals", correct: false, feedback: "Standing this confused patient is unsafe and does not address the immediate reversible cause." },
          { id: "skip", label: "Skip glucose because there is no diabetes history yet", correct: false, feedback: "A glucose check is indicated by the presentation, even before history is available." },
        ],
        patientReply: "The meter reads 46 mg/dL. I can swallow and follow commands.",
      },
      {
        id: "treatment",
        prompt: "The patient can protect the airway and swallow. Choose the treatment.",
        options: [
          { id: "oral-glucose", label: "Give oral glucose per protocol and monitor closely", correct: true, feedback: "Correct. Oral glucose is appropriate when the patient can safely swallow and follow commands." },
          { id: "drink-water", label: "Give plain water only", correct: false, feedback: "Water does not correct the documented hypoglycemia." },
          { id: "nothing", label: "Withhold treatment until the hospital", correct: false, feedback: "This is a reversible emergency that should be treated promptly within scope." },
        ],
        patientReply: "I am feeling clearer now. The shaking is easing.",
      },
      {
        id: "reassess",
        prompt: "Mental status improves after treatment. What completes the call?",
        options: [
          { id: "repeat", label: "Repeat glucose and neurologic assessment, then transport", correct: true, feedback: "Correct. Confirm sustained improvement and evaluate for contributing causes." },
          { id: "leave", label: "Leave immediately because the patient feels better", correct: false, feedback: "Symptoms can recur. Reassessment and an appropriate disposition are required." },
          { id: "exercise", label: "Ask the patient to exercise to raise glucose", correct: false, feedback: "Exercise can further lower glucose and is unsafe here." },
        ],
        patientReply: "I know where I am now. My repeat glucose is improving.",
      },
    ],
  },
  {
    id: "cyclist-trauma",
    locationId: "cycle-crossing",
    code: "TRAUMA-32",
    title: "Cyclist struck near the river trail",
    summary: "A cyclist was clipped by a slow-moving vehicle. The patient is awake with shoulder pain and road rash.",
    district: "Riverside Park",
    location: "River Trail at East 4th Street",
    distanceLabel: "1.0 mi",
    priority: "Urgent",
    position: getCityLocation("cycle-crossing").position,
    pose: "seated",
    shirtColor: "#b45309",
    patientLabel: "Cyclist seated beside the trail",
    initialPatientLine: "The car caught my back wheel. My shoulder hurts, but I remember everything.",
    completionTitle: "Cyclist trauma managed",
    completionCopy: "You identified the mechanism, protected the spine when indicated, completed a trauma assessment, and treated the shoulder injury without losing sight of hidden threats.",
    learningPearl: "Mechanism informs suspicion, but findings drive care. Reassess mental status, breathing, circulation, and distal neurovascular function throughout transport.",
    rewardXp: 100,
    steps: [
      {
        id: "scene",
        prompt: "Traffic is still passing near the patient. What is your first action?",
        options: [
          { id: "control", label: "Control traffic, use PPE, and assess the mechanism", correct: true, feedback: "Correct. Prevent a second collision before entering the treatment area." },
          { id: "shoulder", label: "Immediately manipulate the painful shoulder", correct: false, feedback: "The scene must be controlled before assessment or treatment begins." },
          { id: "helmet", label: "Remove the helmet without assessing the patient", correct: false, feedback: "Helmet removal should be based on airway access, fit, and protocol, not performed automatically." },
        ],
        patientReply: "Traffic has stopped. I was thrown onto my right side and did not lose consciousness.",
      },
      {
        id: "primary",
        prompt: "The patient is alert with normal breathing. What should follow?",
        options: [
          { id: "rapid", label: "Complete the primary assessment and look for major bleeding", correct: true, feedback: "Correct. Do not let an obvious shoulder injury distract from immediate threats." },
          { id: "walk", label: "Ask the patient to walk to the ambulance", correct: false, feedback: "Movement could worsen an occult injury. Complete the assessment first." },
          { id: "bandage-only", label: "Treat only the visible road rash", correct: false, feedback: "Visible wounds can distract from more serious internal or musculoskeletal injury." },
        ],
        patientReply: "My airway is clear, breathing is equal, and there is no major bleeding.",
      },
      {
        id: "focused",
        prompt: "How should the painful shoulder and arm be evaluated?",
        options: [
          { id: "inspect-cms", label: "Inspect, gently palpate, and check distal CMS", correct: true, feedback: "Correct. Document distal findings before and after immobilization." },
          { id: "force", label: "Force the shoulder through full range of motion", correct: false, feedback: "Do not force movement through pain or suspected injury." },
          { id: "ignore-hand", label: "Skip the distal hand exam", correct: false, feedback: "Distal circulation, sensation, and movement are essential in extremity trauma." },
        ],
        patientReply: "My hand is warm, I can feel your touch, and I can move my fingers.",
      },
      {
        id: "transport",
        prompt: "Vitals remain stable and no additional injuries are found. Choose the plan.",
        options: [
          { id: "support", label: "Support the arm, treat wounds, transport, and reassess", correct: true, feedback: "Correct. Continue watching for evolving pain, shock, or neurologic changes." },
          { id: "release", label: "Release the patient at the trail", correct: false, feedback: "A vehicle-versus-cyclist mechanism warrants evaluation and continued reassessment." },
          { id: "food", label: "Give the patient food before transport", correct: false, feedback: "Food is not a priority and may complicate later care." },
        ],
        patientReply: "The support feels better, and my hand still feels normal.",
      },
    ],
  },
  {
    id: "station-chest-pain",
    locationId: "transit-shelter",
    code: "CARD-11",
    title: "Chest pressure at Station Quarter",
    summary: "A commuter reports central chest pressure with sweating and nausea. The patient is sitting near the bus stop.",
    district: "Station Quarter",
    location: "Station 68 transit shelter",
    distanceLabel: "0.3 mi",
    priority: "High priority",
    position: getCityLocation("transit-shelter").position,
    pose: "seated",
    shirtColor: "#1d4ed8",
    patientLabel: "Sweating commuter holding chest",
    initialPatientLine: "It feels like a heavy pressure in the middle of my chest. It started about ten minutes ago.",
    completionTitle: "Cardiac emergency prioritized",
    completionCopy: "You recognized a time-sensitive cardiac presentation, completed an ABC-focused assessment, gathered essential medication information, and selected prompt transport.",
    learningPearl: "Possible ACS is time-sensitive. Minimize exertion, evaluate contraindications before medication assistance, obtain a 12-lead when available, and transport promptly.",
    rewardXp: 110,
    steps: [
      {
        id: "scene",
        prompt: "The patient is pale and sweating. What should happen first?",
        options: [
          { id: "primary", label: "PPE, general impression, and immediate ABC assessment", correct: true, feedback: "Correct. The presentation may represent a time-sensitive cardiac emergency." },
          { id: "walk", label: "Walk the patient to the ambulance", correct: false, feedback: "Avoid unnecessary exertion in a patient with possible acute coronary syndrome." },
          { id: "history-first", label: "Complete a full history before vital signs", correct: false, feedback: "Immediate threats and baseline vital signs take priority over a complete history." },
        ],
        patientReply: "I am alert. My airway is clear, but I feel short of breath with the pressure.",
      },
      {
        id: "assessment",
        prompt: "Which assessment bundle is most useful now?",
        options: [
          { id: "cardiac", label: "Vitals, SpO2, SAMPLE/OPQRST, and early 12-lead", correct: true, feedback: "Correct. Gather focused history while obtaining time-sensitive cardiac data." },
          { id: "ankle", label: "Perform an ankle stability examination", correct: false, feedback: "That does not address the patient’s immediate complaint or risk." },
          { id: "delay", label: "Wait fifteen minutes before reassessment", correct: false, feedback: "Do not delay assessment in a potentially evolving cardiac emergency." },
        ],
        patientReply: "The pressure is 8 out of 10 and does not change when I move or breathe.",
      },
      {
        id: "treatment",
        prompt: "The patient has no aspirin allergy or active bleeding. What is appropriate?",
        options: [
          { id: "aspirin", label: "Assist with aspirin per protocol and prepare for transport", correct: true, feedback: "Correct. Verify contraindications and follow local protocol." },
          { id: "water", label: "Give water and ask the patient to rest alone", correct: false, feedback: "This does not address a possible acute coronary syndrome." },
          { id: "routine", label: "Delay transport because the patient is conscious", correct: false, feedback: "Consciousness does not make this low risk. The symptoms require prompt evaluation." },
        ],
        patientReply: "I took the aspirin. The pressure is still present.",
      },
      {
        id: "transport",
        prompt: "Symptoms persist and the 12-lead is concerning. What next?",
        options: [
          { id: "rapid", label: "Prompt transport, early notification, and frequent reassessment", correct: true, feedback: "Correct. Limit scene time and communicate a concise cardiac alert." },
          { id: "wait", label: "Stay on scene until the pain fully resolves", correct: false, feedback: "Definitive care should not be delayed while waiting for symptom resolution." },
          { id: "self", label: "Have family drive the patient", correct: false, feedback: "The patient needs monitoring, treatment capability, and rapid reassessment during transport." },
        ],
        patientReply: "I understand. Please take me to the hospital.",
      },
    ],
  },
];

const clinicalLocations: Record<ClinicalScenarioId, string> = {
  anaphylaxis: 'park-east', 'car-accident': 'cycle-crossing', hypoglycemia: 'civic-plaza',
  'opioid-overdose': 'market-corner', 'chest-pain': 'transit-shelter',
};
// Clinical call locations come from the city map; care setup is owned separately.

for (const [index, scenario] of CLINICAL_SCENARIOS.entries()) {
  const clinicalScenarioId = scenario.id as ClinicalScenarioId;
  const cityLocation = getCityLocation(clinicalLocations[clinicalScenarioId]);
  SICK_CITY_CALLS.push({
    id: `clinical-${clinicalScenarioId}`, clinicalScenarioId, locationId: clinicalLocations[clinicalScenarioId],
    code: `CLIN-${String(index + 1).padStart(2, "0")}`,
    title: scenario.title, summary: clinicalScenarioId === "anaphylaxis" ? "Teen with shortness of breath near Maple Street and 4th Avenue." : scenario.dispatch,
    district: cityLocation.district,
    location: cityLocation.name, distanceLabel: "", position: cityLocation.position,
    priority: scenario.priority === "Unstable" ? "High priority" : "Urgent",
    pose: clinicalScenarioId === "car-accident" ? "seated" : "supine", shirtColor: "#334155", patientLabel: clinicalScenarioId === "car-accident" ? "Injured driver" : "Patient",
    initialPatientLine: scenario.patient, completionTitle: "Clinical care complete",
    completionCopy: "Scene safety, assessment, treatment, transport planning, and reassessment completed.",
    learningPearl: "Review the clinical debrief before returning to dispatch.", rewardXp: 40, steps: [],
  });
}
export const DEFAULT_SICK_CITY_CALL_INDEX = SICK_CITY_CALLS.findIndex(call => Boolean(call.clinicalScenarioId));

export function getSickCityCall(index: number) {
  return SICK_CITY_CALLS[index % SICK_CITY_CALLS.length];
}
