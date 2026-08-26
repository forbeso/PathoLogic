export type FocusedClinicalLabId = "wrist-hand" | "neuro";

export type FocusedClinicalFinding = {
  id: string;
  label: string;
  technique: string;
};

export type FocusedClinicalPhase = {
  id: string;
  label: string;
  title: string;
  description: string;
  teaching: string;
  findingIds: string[];
};

export type FocusedClinicalDecision = {
  id: string;
  label: string;
};

export type FocusedClinicalCase = {
  id: string;
  title: string;
  shortTitle: string;
  dispatch: string;
  mechanism: string;
  patientLine: string;
  statusLabel: string;
  statusTone: "stable" | "urgent";
  phaseIds: string[];
  requiredFindings: string[];
  decisionDrivers: string[];
  findings: Record<string, string>;
  correctDecision: string;
  rationale: string;
};

export type FocusedClinicalLabConfig = {
  id: FocusedClinicalLabId;
  title: string;
  shortTitle: string;
  seoTitle: string;
  seoDescription: string;
  path: string;
  modelLabel: string;
  loadingLabel: string;
  findings: FocusedClinicalFinding[];
  phases: FocusedClinicalPhase[];
  decisions: FocusedClinicalDecision[];
  cases: FocusedClinicalCase[];
};

const wristFindings: FocusedClinicalFinding[] = [
  {
    id: "wrist-appearance",
    label: "Alignment and swelling",
    technique: "Compare both wrists and hands. Look for deformity, rotation, swelling, bruising, and a guarded resting position before palpation.",
  },
  {
    id: "wrist-skin",
    label: "Skin and bleeding",
    technique: "Inspect the entire hand, including between the fingers, for wounds, skin tenting, contamination, and color change.",
  },
  {
    id: "distal-radius",
    label: "Distal radius and ulna",
    technique: "Palpate gently along the distal radius and ulna. Stop if pain is severe or the wrist is visibly deformed.",
  },
  {
    id: "snuffbox",
    label: "Anatomic snuffbox",
    technique: "Ask the patient to extend the thumb, then palpate the triangular hollow at the base of the thumb. Focal tenderness raises concern for scaphoid injury.",
  },
  {
    id: "scaphoid-tubercle",
    label: "Scaphoid tubercle",
    technique: "Palpate the volar scaphoid tubercle near the base of the thenar eminence and compare with the uninjured side.",
  },
  {
    id: "radial-pulse",
    label: "Radial pulse",
    technique: "Palpate the radial pulse and compare rate and strength with the opposite side. Recheck after splinting.",
  },
  {
    id: "capillary-refill",
    label: "Capillary refill",
    technique: "Blanch a fingernail and observe return of color. Also note hand temperature and overall perfusion.",
  },
  {
    id: "median-sensation",
    label: "Median nerve sensation",
    technique: "Lightly touch the pad of the index finger and compare sides. Ask the patient to report numbness or altered sensation.",
  },
  {
    id: "ulnar-sensation",
    label: "Ulnar nerve sensation",
    technique: "Test light touch at the pad of the little finger and compare with the opposite hand.",
  },
  {
    id: "radial-sensation",
    label: "Radial nerve sensation",
    technique: "Test light touch over the dorsal first web space between the thumb and index finger.",
  },
  {
    id: "thumb-opposition",
    label: "Thumb opposition",
    technique: "Ask the patient to touch the thumb to the little finger. Avoid resistance if fracture or severe pain is suspected.",
  },
  {
    id: "finger-abduction",
    label: "Finger abduction",
    technique: "Ask the patient to spread the fingers apart. This screens ulnar motor function without forceful stress.",
  },
  {
    id: "wrist-extension",
    label: "Wrist and finger extension",
    technique: "Ask for gentle wrist and finger extension. Do not force motion through marked pain or deformity.",
  },
];

const wristNormalFindings: Record<string, string> = {
  "wrist-appearance": "Mild dorsal wrist swelling without deformity or finger rotation.",
  "wrist-skin": "Skin is intact with normal color and no active bleeding.",
  "distal-radius": "No focal bony tenderness is present over the distal radius or ulna.",
  snuffbox: "The anatomic snuffbox is not focally tender.",
  "scaphoid-tubercle": "No focal tenderness is present over the scaphoid tubercle.",
  "radial-pulse": "The radial pulse is strong and equal bilaterally.",
  "capillary-refill": "Fingertip capillary refill is brisk and the hand is warm.",
  "median-sensation": "Sensation at the index fingertip is intact and symmetric.",
  "ulnar-sensation": "Sensation at the little fingertip is intact and symmetric.",
  "radial-sensation": "Sensation over the dorsal first web space is intact and symmetric.",
  "thumb-opposition": "Thumb opposition is intact, though motion causes mild wrist discomfort.",
  "finger-abduction": "The patient abducts all fingers symmetrically.",
  "wrist-extension": "Gentle wrist and finger extension are intact with mild pain limitation.",
};

const wristPhases: FocusedClinicalPhase[] = [
  {
    id: "inspection",
    label: "Inspection",
    title: "Look before you touch",
    description: "Compare alignment, swelling, skin, and the resting position of the fingers.",
    teaching: "Deformity, an open wound, pallor, or finger malrotation changes the urgency and may make further motion testing unsafe.",
    findingIds: ["wrist-appearance", "wrist-skin"],
  },
  {
    id: "palpation",
    label: "Palpation",
    title: "Localize the bony pain",
    description: "Palpate the distal radius and ulna, then check both scaphoid landmarks.",
    teaching: "Scaphoid injury can be subtle. Snuffbox or scaphoid-tubercle tenderness after a fall deserves immobilization and appropriate imaging or follow-up.",
    findingIds: ["distal-radius", "snuffbox", "scaphoid-tubercle"],
  },
  {
    id: "neurovascular",
    label: "Neurovascular",
    title: "Check the hand beyond the injury",
    description: "Assess perfusion and the median, ulnar, and radial sensory territories.",
    teaching: "Document circulation, sensation, and movement before and after splinting. Any deterioration needs immediate reassessment.",
    findingIds: ["radial-pulse", "capillary-refill", "median-sensation", "ulnar-sensation", "radial-sensation"],
  },
  {
    id: "function",
    label: "Motor function",
    title: "Screen hand function gently",
    description: "Check thumb opposition, finger abduction, and wrist or finger extension without forcing pain.",
    teaching: "These movements sample median, ulnar, and radial motor function. Severe pain or deformity is a reason to stop, not push harder.",
    findingIds: ["thumb-opposition", "finger-abduction", "wrist-extension"],
  },
  {
    id: "decision",
    label: "Disposition",
    title: "Choose the safest next step",
    description: "Use the mechanism, bony tenderness, deformity, and distal exam to decide what happens next.",
    teaching: "A normal distal exam does not rule out fracture. Immobilize suspected injury, reassess neurovascular status, and follow local protocols.",
    findingIds: [],
  },
];

const wristCases: FocusedClinicalCase[] = [
  {
    id: "wrist-sprain",
    title: "Wrist Pain After a Low-Energy Fall",
    shortTitle: "Likely wrist sprain",
    dispatch: "A 22-year-old caught a fall with the right hand and reports mild wrist pain.",
    mechanism: "Low-energy fall from standing. No head injury or other complaint.",
    patientLine: "It is sore when I move it, but I can still use my fingers.",
    statusLabel: "Stable",
    statusTone: "stable",
    phaseIds: ["inspection", "palpation", "neurovascular", "function", "decision"],
    requiredFindings: wristFindings.map((finding) => finding.id),
    decisionDrivers: ["wrist-appearance", "distal-radius", "snuffbox", "scaphoid-tubercle", "radial-pulse"],
    findings: wristNormalFindings,
    correctDecision: "support-and-follow-up",
    rationale: "There is no deformity, qualifying focal bony tenderness, or neurovascular deficit. Support the wrist, provide appropriate symptom care, and arrange follow-up according to local protocol and clinical judgment.",
  },
  {
    id: "scaphoid-concern",
    title: "Thumb-Side Pain After a Fall",
    shortTitle: "Scaphoid concern",
    dispatch: "A 31-year-old fell onto an outstretched hand and has persistent pain at the base of the right thumb.",
    mechanism: "FOOSH mechanism with radial-sided wrist pain and little visible deformity.",
    patientLine: "The wrist looks okay, but that hollow by my thumb is really tender.",
    statusLabel: "Imaging concern",
    statusTone: "stable",
    phaseIds: ["inspection", "palpation", "neurovascular", "function", "decision"],
    requiredFindings: wristFindings.map((finding) => finding.id),
    decisionDrivers: ["snuffbox", "scaphoid-tubercle", "radial-pulse", "median-sensation"],
    findings: {
      ...wristNormalFindings,
      "wrist-appearance": "Minimal swelling is present at the radial side of the wrist without deformity.",
      snuffbox: "There is sharp focal tenderness in the anatomic snuffbox.",
      "scaphoid-tubercle": "Palpation over the scaphoid tubercle reproduces the patient's pain.",
      "thumb-opposition": "Thumb opposition is intact but increases pain at the radial wrist.",
    },
    correctDecision: "immobilize-scaphoid",
    rationale: "A FOOSH mechanism with snuffbox and scaphoid-tubercle tenderness raises concern for scaphoid fracture even without deformity. Immobilize appropriately, document the distal exam, and arrange imaging and follow-up.",
  },
  {
    id: "deformed-wrist",
    title: "Deformed Wrist With Numb Fingers",
    shortTitle: "Immediate limb concern",
    dispatch: "A 70-year-old has an obviously deformed right wrist after falling from a step.",
    mechanism: "Direct load through the hand with visible deformity and worsening hand numbness.",
    patientLine: "My fingers feel numb and the hand is getting cold.",
    statusLabel: "Limb threat",
    statusTone: "urgent",
    phaseIds: ["inspection", "neurovascular", "decision"],
    requiredFindings: ["wrist-appearance", "wrist-skin", "radial-pulse", "capillary-refill", "median-sensation", "ulnar-sensation", "radial-sensation"],
    decisionDrivers: ["wrist-appearance", "wrist-skin", "radial-pulse", "capillary-refill", "median-sensation"],
    findings: {
      ...wristNormalFindings,
      "wrist-appearance": "Marked deformity and swelling are present at the distal wrist.",
      "wrist-skin": "Skin is tented over the deformity. The hand appears pale.",
      "radial-pulse": "The radial pulse is faint compared with the uninjured side.",
      "capillary-refill": "Capillary refill is delayed and the fingers are cool.",
      "median-sensation": "Sensation is reduced at the index fingertip.",
      "ulnar-sensation": "Sensation is diminished at the little fingertip.",
      "radial-sensation": "Sensation is diminished over the dorsal first web space.",
    },
    correctDecision: "urgent-limb-management",
    rationale: "Gross deformity with impaired perfusion and sensation is an immediate limb threat. Stop the routine exam, manage according to protocol, splint in the safest position, reassess frequently, and transport promptly.",
  },
];

const neuroFindings: FocusedClinicalFinding[] = [
  {
    id: "responsiveness",
    label: "Level of consciousness",
    technique: "Introduce yourself, assess orientation, and note whether the patient follows a simple command. Use AVPU or GCS as appropriate.",
  },
  {
    id: "speech",
    label: "Speech and language",
    technique: "Listen for slurring, inappropriate words, or inability to name or repeat a simple phrase. Separate dysarthria from aphasia when possible.",
  },
  {
    id: "facial-symmetry",
    label: "Facial symmetry",
    technique: "Ask the patient to smile or show their teeth. Look for unilateral lower facial weakness.",
  },
  {
    id: "gaze",
    label: "Gaze and tracking",
    technique: "Ask the patient to follow your finger without moving the head. Note gaze preference, impaired movement, diplopia, or nystagmus.",
  },
  {
    id: "pupils",
    label: "Pupils",
    technique: "Compare pupil size and response to light. Unequal or poorly reactive pupils can indicate a serious neurologic process.",
  },
  {
    id: "arm-drift",
    label: "Arm drift",
    technique: "Ask the patient to hold both arms forward, palms up, for about 10 seconds. Watch for unilateral drift or pronation.",
  },
  {
    id: "grip",
    label: "Grip strength",
    technique: "Ask for a gentle bilateral hand squeeze and compare sides. Avoid relying on grip alone to rule out weakness.",
  },
  {
    id: "leg-strength",
    label: "Leg strength",
    technique: "Compare the ability to lift each leg or push and pull the feet. Keep the test safe if balance is impaired.",
  },
  {
    id: "neuro-sensation",
    label: "Sensation",
    technique: "Compare light touch on both sides of the face, arms, and legs. Ask whether either side feels different.",
  },
  {
    id: "coordination",
    label: "Coordination and balance",
    technique: "Check finger-to-nose or heel-to-shin when safe. Do not stand a dizzy or unstable patient without support.",
  },
  {
    id: "blood-glucose",
    label: "Blood glucose",
    technique: "Obtain a blood glucose early because hypoglycemia can mimic stroke and is immediately treatable.",
  },
  {
    id: "last-known-well",
    label: "Last known well",
    technique: "Identify the exact time the patient was last known at their neurologic baseline, not merely when symptoms were discovered.",
  },
];

const neuroNormalFindings: Record<string, string> = {
  responsiveness: "The patient is alert, oriented, and follows commands appropriately.",
  speech: "Speech is clear and language is appropriate.",
  "facial-symmetry": "The smile is symmetric without facial droop.",
  gaze: "Extraocular movements are intact without gaze preference or nystagmus.",
  pupils: "Pupils are equal, round, and reactive to light.",
  "arm-drift": "Both arms remain elevated without drift or pronation.",
  grip: "Grip strength is equal bilaterally.",
  "leg-strength": "Leg strength is equal bilaterally.",
  "neuro-sensation": "Light-touch sensation is symmetric across the face and extremities.",
  coordination: "Finger-to-nose testing is smooth and symmetric. No truncal instability is present while seated.",
  "blood-glucose": "Blood glucose is 104 mg/dL.",
  "last-known-well": "The patient was last known well 35 minutes ago.",
};

const neuroPhases: FocusedClinicalPhase[] = [
  {
    id: "mental-status",
    label: "Mental status",
    title: "Start with responsiveness and speech",
    description: "Confirm the patient can engage, follow commands, and communicate normally.",
    teaching: "Airway and breathing still come first. Once stable, the first neurologic clues often appear in attention, command following, speech, and language.",
    findingIds: ["responsiveness", "speech"],
  },
  {
    id: "face-eyes",
    label: "Face and eyes",
    title: "Inspect the face, gaze, and pupils",
    description: "Look for asymmetry, gaze abnormality, visual complaints, and unequal pupils.",
    teaching: "A normal smile does not exclude posterior circulation stroke. Eye findings and severe imbalance can carry the diagnosis when FAST is negative.",
    findingIds: ["facial-symmetry", "gaze", "pupils"],
  },
  {
    id: "motor",
    label: "Motor",
    title: "Compare both sides",
    description: "Check arm drift, grip, and leg strength for a new focal deficit.",
    teaching: "Side-to-side comparison matters. Subtle drift or pronation can be more revealing than a single grip-strength check.",
    findingIds: ["arm-drift", "grip", "leg-strength"],
  },
  {
    id: "sensation-coordination",
    label: "Sensation",
    title: "Add sensation and coordination",
    description: "Compare sensation and safely assess coordination or balance when indicated.",
    teaching: "Posterior circulation events may present with sudden ataxia, diplopia, nystagmus, or severe imbalance without obvious arm weakness.",
    findingIds: ["neuro-sensation", "coordination"],
  },
  {
    id: "context",
    label: "Time and glucose",
    title: "Find the mimic and the clock",
    description: "Check blood glucose and establish the exact last-known-well time.",
    teaching: "Glucose identifies a reversible mimic. Last known well guides stroke-system decisions, so document the actual time clearly.",
    findingIds: ["blood-glucose", "last-known-well"],
  },
  {
    id: "decision",
    label: "Disposition",
    title: "Choose the next priority",
    description: "Use the full pattern, not one isolated screening item, to choose treatment and transport.",
    teaching: "Activate the appropriate stroke pathway early when focal or posterior-circulation findings are concerning. Follow local destination and notification protocols.",
    findingIds: [],
  },
];

const neuroCases: FocusedClinicalCase[] = [
  {
    id: "left-mca",
    title: "Sudden Speech Change and Right-Sided Weakness",
    shortTitle: "Anterior stroke pattern",
    dispatch: "A 68-year-old suddenly developed difficulty speaking and weakness while eating breakfast.",
    mechanism: "Symptoms began abruptly. Family reports the patient was normal 35 minutes ago.",
    patientLine: "I... can't... get the words out.",
    statusLabel: "Time critical",
    statusTone: "urgent",
    phaseIds: ["mental-status", "face-eyes", "motor", "sensation-coordination", "context", "decision"],
    requiredFindings: neuroFindings.map((finding) => finding.id),
    decisionDrivers: ["speech", "facial-symmetry", "arm-drift", "leg-strength", "blood-glucose", "last-known-well"],
    findings: {
      ...neuroNormalFindings,
      speech: "Speech is hesitant and the patient cannot correctly name common objects.",
      "facial-symmetry": "The right lower face droops when the patient smiles.",
      "arm-drift": "The right arm drifts downward and pronates within several seconds.",
      grip: "Right grip is weaker than left.",
      "leg-strength": "The right leg lifts briefly but cannot remain elevated.",
      "neuro-sensation": "Light touch feels reduced on the right arm and leg.",
    },
    correctDecision: "stroke-alert",
    rationale: "Abrupt aphasia, right facial weakness, and right-sided motor and sensory deficits with normal glucose indicate a time-critical stroke pattern. Activate the stroke pathway, document last known well, notify the receiving system, and transport promptly.",
  },
  {
    id: "hypoglycemia-mimic",
    title: "Confusion and Slurred Speech",
    shortTitle: "Hypoglycemia mimic",
    dispatch: "A 54-year-old with diabetes became confused and sweaty at work.",
    mechanism: "The patient took insulin but skipped lunch. Coworkers noticed slurred speech 15 minutes ago.",
    patientLine: "I'm... okay. Just a little shaky.",
    statusLabel: "Treatable mimic",
    statusTone: "urgent",
    phaseIds: ["mental-status", "face-eyes", "motor", "sensation-coordination", "context", "decision"],
    requiredFindings: neuroFindings.map((finding) => finding.id),
    decisionDrivers: ["responsiveness", "speech", "arm-drift", "blood-glucose"],
    findings: {
      ...neuroNormalFindings,
      responsiveness: "The patient is drowsy, confused about the date, and follows simple commands slowly.",
      speech: "Speech is slurred, but naming and comprehension are intact.",
      coordination: "Movements are slow but symmetric without focal ataxia.",
      "blood-glucose": "Blood glucose is 42 mg/dL.",
      "last-known-well": "Coworkers report normal behavior 20 minutes ago.",
    },
    correctDecision: "treat-glucose-reassess",
    rationale: "Severe hypoglycemia can mimic stroke. Treat according to protocol, reassess the complete neurologic exam, and transport. Persistent focal deficits after glucose correction still require stroke activation.",
  },
  {
    id: "posterior-stroke",
    title: "Sudden Vertigo and Inability to Walk",
    shortTitle: "Posterior stroke pattern",
    dispatch: "A 72-year-old developed abrupt vertigo, vomiting, and severe imbalance while gardening.",
    mechanism: "Symptoms were maximal at onset. The patient denies trauma and cannot sit upright without support.",
    patientLine: "The whole world is moving. I can't keep myself upright.",
    statusLabel: "Time critical",
    statusTone: "urgent",
    phaseIds: ["mental-status", "face-eyes", "motor", "sensation-coordination", "context", "decision"],
    requiredFindings: neuroFindings.map((finding) => finding.id),
    decisionDrivers: ["gaze", "arm-drift", "coordination", "blood-glucose", "last-known-well"],
    findings: {
      ...neuroNormalFindings,
      gaze: "Direction-changing nystagmus is present and the patient reports double vision.",
      coordination: "The patient has marked limb and truncal ataxia and cannot sit unsupported.",
      "last-known-well": "The patient was last known well 50 minutes ago.",
    },
    correctDecision: "stroke-alert",
    rationale: "Sudden persistent vertigo, direction-changing nystagmus, diplopia, and severe ataxia are concerning for posterior circulation stroke despite a normal smile and arm-drift test. Activate the stroke pathway and transport promptly.",
  },
];

export const focusedClinicalLabs: Record<FocusedClinicalLabId, FocusedClinicalLabConfig> = {
  "wrist-hand": {
    id: "wrist-hand",
    title: "Wrist and hand assessment",
    shortTitle: "Wrist & hand",
    seoTitle: "Focused Wrist and Hand Exam Lab",
    seoDescription: "Practice wrist and hand inspection, scaphoid palpation, distal neurovascular assessment, motor testing, and safe disposition decisions.",
    path: "/focused-exams/wrist-hand",
    modelLabel: "Right wrist and hand",
    loadingLabel: "Preparing the hand model",
    findings: wristFindings,
    phases: wristPhases,
    decisions: [
      { id: "support-and-follow-up", label: "Support the wrist and arrange appropriate follow-up" },
      { id: "immobilize-scaphoid", label: "Immobilize for suspected scaphoid injury and arrange imaging" },
      { id: "urgent-limb-management", label: "Stop the exam and manage the limb threat now" },
    ],
    cases: wristCases,
  },
  neuro: {
    id: "neuro",
    title: "Focused neurologic assessment",
    shortTitle: "Focused neuro",
    seoTitle: "Focused Neurologic Exam Lab",
    seoDescription: "Practice a focused prehospital neurologic examination including speech, face, gaze, pupils, motor function, sensation, glucose, and last known well.",
    path: "/focused-exams/neuro",
    modelLabel: "Focused neurologic exam",
    loadingLabel: "Preparing the neurologic model",
    findings: neuroFindings,
    phases: neuroPhases,
    decisions: [
      { id: "stroke-alert", label: "Activate the stroke pathway and transport promptly" },
      { id: "treat-glucose-reassess", label: "Treat hypoglycemia, repeat the neuro exam, and transport" },
      { id: "supportive-monitoring", label: "Monitor supportively without stroke or glucose intervention" },
    ],
    cases: neuroCases,
  },
};

export function getFocusedClinicalLab(labId: FocusedClinicalLabId) {
  return focusedClinicalLabs[labId];
}

export function getFocusedClinicalCase(config: FocusedClinicalLabConfig, caseId: string | undefined) {
  return config.cases.find((examCase) => examCase.id === caseId) ?? config.cases[0];
}

export function getFocusedPhase(config: FocusedClinicalLabConfig, phaseId: string) {
  return config.phases.find((phase) => phase.id === phaseId) ?? config.phases[0];
}

export function getPhaseFindings(config: FocusedClinicalLabConfig, examCase: FocusedClinicalCase, phaseId: string) {
  const phase = getFocusedPhase(config, phaseId);
  return phase.findingIds.filter((findingId) => examCase.requiredFindings.includes(findingId));
}

export function scoreFocusedClinicalExam(
  examCase: FocusedClinicalCase,
  examined: string[],
  decision: string
) {
  const completed = examCase.requiredFindings.filter((findingId) => examined.includes(findingId)).length;
  const assessmentPoints = Math.round((completed / examCase.requiredFindings.length) * 70);
  const decisionCorrect = decision === examCase.correctDecision;
  return {
    score: assessmentPoints + (decisionCorrect ? 30 : 0),
    assessmentPoints,
    decisionCorrect,
  };
}

export function getFocusedDecisionFeedback(
  config: FocusedClinicalLabConfig,
  examCase: FocusedClinicalCase,
  decision: string
) {
  if (decision === examCase.correctDecision) return examCase.rationale;

  const selected = config.decisions.find((option) => option.id === decision)?.label.toLowerCase();
  const correct = config.decisions.find((option) => option.id === examCase.correctDecision)?.label;
  return `${selected ? `“${selected}” does not fit the full pattern. ` : ""}Recheck the priority findings from this exam. The safest next step is: ${correct}.`;
}
