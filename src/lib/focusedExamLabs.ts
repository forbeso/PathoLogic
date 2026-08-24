export type AnkleCaseId =
  | "lateral-sprain"
  | "lateral-malleolus"
  | "fifth-metatarsal"
  | "neurovascular-emergency";

export type ExamPhaseId =
  | "inspection"
  | "palpation"
  | "neurovascular"
  | "function"
  | "decision";

export type ExamFindingId =
  | "appearance"
  | "skin"
  | "lateral-malleolus"
  | "medial-malleolus"
  | "navicular"
  | "fifth-metatarsal"
  | "atfl"
  | "dorsalis-pedis"
  | "sensation"
  | "motor"
  | "weight-bearing";

export type ImagingDecision =
  | "no-radiographs"
  | "ankle-radiographs"
  | "foot-radiographs"
  | "ankle-and-foot-radiographs"
  | "rule-not-appropriate";

export type AnkleExamCase = {
  id: AnkleCaseId;
  title: string;
  shortTitle: string;
  dispatch: string;
  mechanism: string;
  patientLine: string;
  painZone: "malleolar" | "midfoot" | "both";
  immediateConcern: boolean;
  canBearWeight: boolean;
  correctDecision: ImagingDecision;
  requiredFindings: ExamFindingId[];
  findings: Record<ExamFindingId, string>;
  rationale: string;
};

const NORMAL_FINDINGS: Record<ExamFindingId, string> = {
  appearance: "Mild lateral swelling. No gross deformity or shortening.",
  skin: "Skin is intact with no open wound or active bleeding.",
  "lateral-malleolus": "No bony tenderness at the posterior edge or tip of the lateral malleolus.",
  "medial-malleolus": "No bony tenderness at the posterior edge or tip of the medial malleolus.",
  navicular: "No focal tenderness over the navicular.",
  "fifth-metatarsal": "No focal tenderness at the base of the fifth metatarsal.",
  atfl: "Tenderness is localized to the soft tissue just anterior to the lateral malleolus.",
  "dorsalis-pedis": "Dorsalis pedis pulse is strong and equal.",
  sensation: "Sensation is intact throughout the foot and toes.",
  motor: "The patient can move all toes without weakness.",
  "weight-bearing": "The patient takes four careful steps with a limp.",
};

export const ankleExamCases: AnkleExamCase[] = [
  {
    id: "lateral-sprain",
    title: "Twisted Ankle at Practice",
    shortTitle: "Likely lateral sprain",
    dispatch: "A 19-year-old stepped on another player's foot and rolled the right ankle outward.",
    mechanism: "Inversion injury 20 minutes ago. Pain is centered around the lateral ankle.",
    patientLine: "It hurts on the outside, but I can put a little weight on it.",
    painZone: "malleolar",
    immediateConcern: false,
    canBearWeight: true,
    correctDecision: "no-radiographs",
    requiredFindings: [
      "appearance",
      "skin",
      "lateral-malleolus",
      "medial-malleolus",
      "atfl",
      "dorsalis-pedis",
      "sensation",
      "motor",
      "weight-bearing",
    ],
    findings: NORMAL_FINDINGS,
    rationale:
      "There is malleolar-zone pain, but no qualifying posterior-edge or tip bony tenderness and the patient can take four steps. Ottawa ankle criteria are negative. Continue clinical judgment, supportive care, and appropriate follow-up rather than promising that fracture is impossible.",
  },
  {
    id: "lateral-malleolus",
    title: "Fall From a Curb",
    shortTitle: "Lateral malleolus concern",
    dispatch: "A 44-year-old missed a curb and landed hard on the right ankle.",
    mechanism: "Rotational ankle injury. The patient could not walk immediately afterward.",
    patientLine: "I can't stand on it, and that bone on the outside is extremely sore.",
    painZone: "malleolar",
    immediateConcern: false,
    canBearWeight: false,
    correctDecision: "ankle-radiographs",
    requiredFindings: [
      "appearance",
      "skin",
      "lateral-malleolus",
      "medial-malleolus",
      "dorsalis-pedis",
      "sensation",
      "motor",
      "weight-bearing",
    ],
    findings: {
      ...NORMAL_FINDINGS,
      appearance: "Moderate lateral swelling without gross deformity.",
      "lateral-malleolus":
        "Marked bony tenderness along the posterior edge and tip of the lateral malleolus.",
      "weight-bearing": "The patient cannot take four steps because of ankle pain.",
    },
    rationale:
      "Malleolar-zone pain plus qualifying lateral malleolus tenderness and inability to take four steps meets Ottawa ankle criteria for ankle radiographs.",
  },
  {
    id: "fifth-metatarsal",
    title: "Foot Pain After a Misstep",
    shortTitle: "Fifth metatarsal concern",
    dispatch: "A 31-year-old stepped into a shallow hole while jogging and now has lateral foot pain.",
    mechanism: "Inversion injury with pain centered in the midfoot rather than around the ankle bones.",
    patientLine: "The worst spot is along the outside of my foot near the base of my little toe.",
    painZone: "midfoot",
    immediateConcern: false,
    canBearWeight: true,
    correctDecision: "foot-radiographs",
    requiredFindings: [
      "appearance",
      "skin",
      "navicular",
      "fifth-metatarsal",
      "dorsalis-pedis",
      "sensation",
      "motor",
      "weight-bearing",
    ],
    findings: {
      ...NORMAL_FINDINGS,
      appearance: "Swelling is concentrated over the lateral midfoot. No gross deformity.",
      "fifth-metatarsal": "Sharp focal bony tenderness at the base of the fifth metatarsal.",
      "weight-bearing": "The patient takes four guarded steps.",
    },
    rationale:
      "Midfoot-zone pain plus focal tenderness at the base of the fifth metatarsal meets Ottawa foot criteria for foot radiographs, even though the patient can take four steps.",
  },
  {
    id: "neurovascular-emergency",
    title: "Deformed Ankle After a Fall",
    shortTitle: "Immediate limb concern",
    dispatch: "A 57-year-old fell from a short ladder and has an obviously deformed right ankle.",
    mechanism: "High-force twisting injury. The foot appears pale and the patient reports numbness.",
    patientLine: "My foot feels numb and cold. Please don't make me stand on it.",
    painZone: "both",
    immediateConcern: true,
    canBearWeight: false,
    correctDecision: "rule-not-appropriate",
    requiredFindings: ["appearance", "skin", "dorsalis-pedis", "sensation", "motor"],
    findings: {
      ...NORMAL_FINDINGS,
      appearance: "Gross ankle deformity with abnormal alignment.",
      skin: "Skin is tented over the medial ankle. The foot is pale and cool.",
      "dorsalis-pedis": "Dorsalis pedis pulse is not palpable on the injured side.",
      sensation: "Sensation is reduced over the toes and forefoot.",
      motor: "Toe movement is weak and increases pain.",
      "weight-bearing": "Do not ask this patient to bear weight.",
    },
    rationale:
      "Gross deformity and neurovascular compromise require immediate emergency management. Do not delay care to complete an Ottawa screen or ask the patient to walk.",
  },
];

export const examPhases: Array<{
  id: ExamPhaseId;
  label: string;
  shortLabel: string;
  findingIds: ExamFindingId[];
}> = [
  { id: "inspection", label: "Inspection", shortLabel: "Inspect", findingIds: ["appearance", "skin"] },
  {
    id: "palpation",
    label: "Landmark palpation",
    shortLabel: "Palpate",
    findingIds: ["lateral-malleolus", "medial-malleolus", "navicular", "fifth-metatarsal", "atfl"],
  },
  {
    id: "neurovascular",
    label: "Neurovascular",
    shortLabel: "N/V",
    findingIds: ["dorsalis-pedis", "sensation", "motor"],
  },
  { id: "function", label: "Weight bearing", shortLabel: "Function", findingIds: ["weight-bearing"] },
  { id: "decision", label: "Imaging decision", shortLabel: "Decision", findingIds: [] },
];

export const decisionOptions: Array<{ id: ImagingDecision; label: string }> = [
  { id: "no-radiographs", label: "Ottawa criteria do not indicate radiographs" },
  { id: "ankle-radiographs", label: "Ankle radiographs are indicated" },
  { id: "foot-radiographs", label: "Foot radiographs are indicated" },
  { id: "ankle-and-foot-radiographs", label: "Both ankle and foot radiographs are indicated" },
  { id: "rule-not-appropriate", label: "Stop the screen and manage the immediate threat" },
];

export function getCase(caseId: string | undefined) {
  return ankleExamCases.find((item) => item.id === caseId) ?? ankleExamCases[0];
}

export function getRelevantPalpationTargets(examCase: AnkleExamCase) {
  if (examCase.painZone === "malleolar") {
    return ["lateral-malleolus", "medial-malleolus", "atfl"] as ExamFindingId[];
  }
  if (examCase.painZone === "midfoot") {
    return ["navicular", "fifth-metatarsal"] as ExamFindingId[];
  }
  return [
    "lateral-malleolus",
    "medial-malleolus",
    "navicular",
    "fifth-metatarsal",
  ] as ExamFindingId[];
}

export function getPhaseRequiredFindings(examCase: AnkleExamCase, phase: ExamPhaseId) {
  if (phase === "palpation") {
    return getRelevantPalpationTargets(examCase).filter((id) => examCase.requiredFindings.includes(id));
  }
  const phaseConfig = examPhases.find((item) => item.id === phase);
  return (phaseConfig?.findingIds ?? []).filter((id) => examCase.requiredFindings.includes(id));
}

export function scoreAnkleExam(examCase: AnkleExamCase, examined: ExamFindingId[], decision: ImagingDecision) {
  const requiredCompleted = examCase.requiredFindings.filter((id) => examined.includes(id)).length;
  const assessmentPercent = Math.round((requiredCompleted / examCase.requiredFindings.length) * 70);
  const decisionPoints = decision === examCase.correctDecision ? 30 : 0;
  return {
    score: assessmentPercent + decisionPoints,
    assessmentPercent,
    decisionCorrect: decision === examCase.correctDecision,
    missed: examCase.requiredFindings.filter((id) => !examined.includes(id)),
  };
}
