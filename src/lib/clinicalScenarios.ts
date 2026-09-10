export type VitalSet = {
  loc: string;
  airway: string;
  breathing: string;
  pulse: string;
  bp: string;
  spo2: string;
  skin: string;
};

export type Scenario = {
  id: string;
  title: string;
  domain: string;
  location: string;
  dispatch: string;
  scene: string;
  patient: string;
  priority: "Stable" | "Potentially unstable" | "Unstable";
  vitals: VitalSet;
  cues: string[];
  fieldImpression: string;
};

export const CLINICAL_SCENARIOS: Scenario[] = [
  {
    id: "anaphylaxis",
    title: "Teen With Shortness of Breath",
    domain: "Medical / Respiratory",
    location: "Riverside community festival",
    dispatch: "Teenager short of breath at a community festival.",
    scene:
      "Outdoor festival first-aid tent. Bystanders report sudden itching and breathing trouble.",
    patient:
      "17-year-old seated upright, anxious, speaking in short phrases, with lip swelling and hives.",
    priority: "Unstable",
    vitals: {
      loc: "Alert, anxious",
      airway: "Patent, throat tightness",
      breathing: "Wheezing, RR 28",
      pulse: "Rapid radial 128",
      bp: "92/60",
      spo2: "89%",
      skin: "Warm, flushed, hives",
    },
    cues: ["Nut exposure", "Wheezing", "Hives", "Lip swelling", "Hypotension"],
    fieldImpression: "Anaphylaxis with respiratory compromise and shock signs.",
  },
  {
    id: "car-accident",
    title: "Driver Trapped After Collision",
    domain: "Trauma / Motor Vehicle Collision",
    location: "Oak Street residential corridor",
    dispatch:
      "Single-vehicle collision with smoke from the engine compartment and one driver still inside.",
    scene:
      "A damaged sedan blocks one lane. Traffic is moving, the vehicle is unstable, and the driver is slumped behind the wheel.",
    patient:
      "Adult driver seated behind the wheel, confused, pale, guarding the left chest, and reporting neck pain.",
    priority: "Unstable",
    vitals: {
      loc: "Responds to voice, confused",
      airway: "Patent, spinal risk",
      breathing: "Shallow, RR 24",
      pulse: "Rapid weak radial 112",
      bp: "104/68",
      spo2: "94%",
      skin: "Pale, cool",
    },
    cues: ["Significant mechanism", "Confusion", "Neck pain", "Chest guarding", "Poor perfusion"],
    fieldImpression: "Multisystem trauma with possible cervical spine, chest, and internal injuries.",
  },
  {
    id: "hypoglycemia",
    title: "Diabetic With Altered Mental Status",
    domain: "Medical / Endocrine",
    location: "Riverside festival information area",
    dispatch: "Adult with confusion and weakness near the festival information booth.",
    scene:
      "The patient is on the grass beside a bench. A friend reports diabetes and a missed meal.",
    patient:
      "Adult responding to voice, confused, pale, cool, and diaphoretic without signs of trauma.",
    priority: "Potentially unstable",
    vitals: {
      loc: "Responds to voice, confused",
      airway: "Patent, can swallow",
      breathing: "Adequate, RR 18",
      pulse: "Rapid radial 108",
      bp: "110/70",
      spo2: "97%",
      skin: "Pale, cool, diaphoretic",
    },
    cues: ["Diabetes", "Missed meal", "Confusion", "Diaphoresis", "Weakness"],
    fieldImpression: "Symptomatic hypoglycemia with altered mental status.",
  },
  {
    id: "opioid-overdose",
    title: "Unresponsive Patient Near the Park",
    domain: "Medical / Toxicology",
    location: "Riverside festival park edge",
    dispatch: "Unresponsive adult with slow breathing near a festival bench.",
    scene:
      "The patient is supine on the grass. A bystander reports possible opioid use and no trauma.",
    patient:
      "Adult unresponsive to voice with snoring, slow shallow respirations, cyanosis, and pinpoint pupils.",
    priority: "Unstable",
    vitals: {
      loc: "Withdraws to pain",
      airway: "Snoring, partially obstructed",
      breathing: "Inadequate, RR 6",
      pulse: "Slow radial 56",
      bp: "96/58",
      spo2: "82%",
      skin: "Cool, mildly cyanotic",
    },
    cues: ["Slow breathing", "Pinpoint pupils", "Cyanosis", "Possible opioid use", "Altered LOC"],
    fieldImpression: "Opioid overdose with respiratory failure.",
  },
  {
    id: "chest-pain",
    title: "Chest Pressure at the Festival",
    domain: "Medical / Cardiology",
    location: "Riverside festival food court",
    dispatch: "Adult with sudden chest pressure and sweating near the food booths.",
    scene:
      "The area is calm. The patient is pale, clutching the chest, and reclined on the grass.",
    patient:
      "Alert adult with central chest pressure radiating to the left arm, nausea, and diaphoresis.",
    priority: "Potentially unstable",
    vitals: {
      loc: "Alert, anxious",
      airway: "Patent, speaking clearly",
      breathing: "Mildly labored, RR 22",
      pulse: "Rapid regular radial 104",
      bp: "148/88",
      spo2: "93%",
      skin: "Pale, cool, diaphoretic",
    },
    cues: ["Chest pressure", "Left arm radiation", "Nausea", "Diaphoresis", "Cardiac history"],
    fieldImpression: "Suspected acute coronary syndrome.",
  },
];

export type ClinicalScenarioId = "anaphylaxis" | "car-accident" | "hypoglycemia" | "opioid-overdose" | "chest-pain";
export type ClinicalCallResult = { objectives: number; mistakes: number; xp: number; summary: string; takeaway: string; score: Record<string, number> };
