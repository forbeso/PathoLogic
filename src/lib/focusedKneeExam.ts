export type KneeCaseId =
  | "medial-sprain"
  | "patella-concern"
  | "fibular-head-concern"
  | "knee-dislocation";

export type KneeExamPhaseId =
  | "inspection"
  | "palpation"
  | "neurovascular"
  | "stability"
  | "function"
  | "decision";

export type KneeFindingId =
  | "knee-appearance"
  | "knee-skin"
  | "patella"
  | "fibular-head"
  | "medial-joint-line"
  | "distal-pulse"
  | "knee-sensation"
  | "ankle-motor"
  | "valgus-stress"
  | "varus-stress"
  | "anterior-drawer"
  | "knee-flexion"
  | "knee-weight-bearing";

export type KneeDecision =
  | "no-knee-radiographs"
  | "knee-radiographs"
  | "immediate-knee-management";

export type KneeExamCase = {
  id: KneeCaseId;
  title: string;
  shortTitle: string;
  dispatch: string;
  mechanism: string;
  patientLine: string;
  age: number;
  immediateConcern: boolean;
  correctDecision: KneeDecision;
  requiredFindings: KneeFindingId[];
  decisionDrivers: KneeFindingId[];
  findings: Record<KneeFindingId, string>;
  rationale: string;
};

export const kneeFindingLabels: Record<KneeFindingId, string> = {
  "knee-appearance": "Alignment and swelling",
  "knee-skin": "Skin and bruising",
  patella: "Patella",
  "fibular-head": "Fibular head",
  "medial-joint-line": "Medial joint line",
  "distal-pulse": "Distal pulse",
  "knee-sensation": "Distal sensation",
  "ankle-motor": "Ankle and toe movement",
  "valgus-stress": "Valgus stress",
  "varus-stress": "Varus stress",
  "anterior-drawer": "Anterior translation",
  "knee-flexion": "Flexion to 90 degrees",
  "knee-weight-bearing": "Four-step weight bearing",
};

export const kneeExamTechniques: Record<KneeFindingId, string> = {
  "knee-appearance": "Expose and compare both knees. Look from the front and side for deformity, patellar position, swelling, and loss of normal contour.",
  "knee-skin": "Inspect the entire joint for wounds, bruising, pallor, coolness, and skin tenting before palpation.",
  patella: "Palpate the patella systematically around its borders and surface. Ask whether tenderness is isolated to the patella.",
  "fibular-head": "Palpate the fibular head on the upper lateral lower leg and identify sharply focal bony tenderness.",
  "medial-joint-line": "Palpate along the medial joint line and the course of the medial collateral ligament, distinguishing soft-tissue pain from bony tenderness.",
  "distal-pulse": "Palpate a distal pulse and compare it with the uninjured side. A weak or absent pulse after knee trauma is an emergency finding.",
  "knee-sensation": "Compare light touch over the lower leg and foot, including the space between the first two toes, and ask about numbness or tingling.",
  "ankle-motor": "Ask the patient to dorsiflex and plantarflex the ankle and move the toes without forcing the injured knee.",
  "valgus-stress": "Only when fracture and gross instability are not suspected, support the leg and apply gentle valgus stress. Stop for severe pain or marked laxity.",
  "varus-stress": "Only when safe, support the leg and apply gentle varus stress while comparing end feel with the uninjured side.",
  "anterior-drawer": "With the knee supported and flexed, assess anterior tibial translation gently. Do not force the maneuver in an acutely painful or unstable knee.",
  "knee-flexion": "Ask the patient to flex the knee actively toward 90 degrees. Stop if pain, deformity, or mechanical resistance makes the movement unsafe.",
  "knee-weight-bearing": "Ask whether four steps were possible after the injury, then observe four steps now only when deformity and neurovascular compromise are absent.",
};

const NORMAL_KNEE_FINDINGS: Record<KneeFindingId, string> = {
  "knee-appearance": "Mild medial swelling without deformity or abnormal patellar position.",
  "knee-skin": "Skin is intact with no open wound, tenting, or concerning discoloration.",
  patella: "No isolated bony tenderness of the patella.",
  "fibular-head": "No focal bony tenderness at the fibular head.",
  "medial-joint-line": "Tenderness follows the medial collateral ligament without focal bony tenderness.",
  "distal-pulse": "Distal pulse is strong and equal to the uninjured side.",
  "knee-sensation": "Distal sensation is intact and symmetric.",
  "ankle-motor": "Ankle and toe movement are strong and symmetric.",
  "valgus-stress": "Gentle valgus stress reproduces medial pain with a firm endpoint and no marked laxity.",
  "varus-stress": "Varus stress is painless with a firm endpoint.",
  "anterior-drawer": "No excessive anterior translation is appreciated on this focused screen.",
  "knee-flexion": "The patient actively flexes the knee beyond 90 degrees.",
  "knee-weight-bearing": "The patient takes four careful steps with a mild limp.",
};

export const kneeExamCases: KneeExamCase[] = [
  {
    id: "medial-sprain",
    title: "Knee Pain After a Side Step",
    shortTitle: "Likely medial sprain",
    dispatch: "A 24-year-old planted the right foot while changing direction and felt pain along the inside of the knee.",
    mechanism: "Low-energy valgus stress during recreational sports. No direct blow or fall.",
    patientLine: "It hurts on the inside, but I walked over here on it.",
    age: 24,
    immediateConcern: false,
    correctDecision: "no-knee-radiographs",
    requiredFindings: [
      "knee-appearance",
      "knee-skin",
      "patella",
      "fibular-head",
      "medial-joint-line",
      "distal-pulse",
      "knee-sensation",
      "ankle-motor",
      "valgus-stress",
      "varus-stress",
      "anterior-drawer",
      "knee-flexion",
      "knee-weight-bearing",
    ],
    decisionDrivers: ["patella", "fibular-head", "knee-flexion", "knee-weight-bearing"],
    findings: NORMAL_KNEE_FINDINGS,
    rationale:
      "The patient is younger than 55, has no isolated patellar or fibular-head tenderness, flexes beyond 90 degrees, and can take four steps. Ottawa Knee Rule criteria are negative. Continue clinical judgment, supportive care, and appropriate follow-up.",
  },
  {
    id: "patella-concern",
    title: "Direct Fall Onto the Knee",
    shortTitle: "Patellar concern",
    dispatch: "A 62-year-old tripped and landed directly on the right kneecap.",
    mechanism: "Direct anterior impact with immediate pain and swelling.",
    patientLine: "The kneecap itself is the spot that really hurts.",
    age: 62,
    immediateConcern: false,
    correctDecision: "knee-radiographs",
    requiredFindings: [
      "knee-appearance",
      "knee-skin",
      "patella",
      "fibular-head",
      "distal-pulse",
      "knee-sensation",
      "ankle-motor",
      "knee-flexion",
      "knee-weight-bearing",
    ],
    decisionDrivers: ["patella", "knee-flexion", "knee-weight-bearing"],
    findings: {
      ...NORMAL_KNEE_FINDINGS,
      "knee-appearance": "Moderate prepatellar swelling without gross deformity.",
      patella: "Sharp isolated bony tenderness is present over the patella.",
      "knee-flexion": "Pain limits active flexion to about 75 degrees.",
      "knee-weight-bearing": "The patient cannot take four steps without assistance.",
    },
    rationale:
      "Age 55 or older, isolated patellar tenderness, inability to flex to 90 degrees, and inability to take four steps each support knee radiographs under the Ottawa Knee Rule.",
  },
  {
    id: "fibular-head-concern",
    title: "Collision at the Sideline",
    shortTitle: "Fibular-head concern",
    dispatch: "A 33-year-old was struck on the inside of the right knee and now has upper lateral lower-leg pain.",
    mechanism: "Direct valgus force with pain concentrated near the fibular head.",
    patientLine: "The sorest point is that bump just below the outside of my knee.",
    age: 33,
    immediateConcern: false,
    correctDecision: "knee-radiographs",
    requiredFindings: [
      "knee-appearance",
      "knee-skin",
      "patella",
      "fibular-head",
      "distal-pulse",
      "knee-sensation",
      "ankle-motor",
      "knee-flexion",
      "knee-weight-bearing",
    ],
    decisionDrivers: ["fibular-head", "knee-flexion", "knee-weight-bearing"],
    findings: {
      ...NORMAL_KNEE_FINDINGS,
      "knee-appearance": "Localized swelling is present over the upper lateral lower leg.",
      "fibular-head": "There is sharp focal bony tenderness at the fibular head.",
      "knee-weight-bearing": "The patient takes two steps, then stops because of pain.",
    },
    rationale:
      "Focal fibular-head tenderness and inability to complete four steps meet Ottawa Knee Rule criteria for knee radiographs.",
  },
  {
    id: "knee-dislocation",
    title: "Deformed Knee After a Crash",
    shortTitle: "Immediate limb concern",
    dispatch: "A 40-year-old has a visibly deformed right knee after a high-energy motorcycle crash.",
    mechanism: "High-energy blunt trauma. The lower leg appears pale and the patient reports numbness.",
    patientLine: "My foot is numb and cold. Please don't move my knee.",
    age: 40,
    immediateConcern: true,
    correctDecision: "immediate-knee-management",
    requiredFindings: [
      "knee-appearance",
      "knee-skin",
      "distal-pulse",
      "knee-sensation",
      "ankle-motor",
    ],
    decisionDrivers: ["knee-appearance", "knee-skin", "distal-pulse", "knee-sensation"],
    findings: {
      ...NORMAL_KNEE_FINDINGS,
      "knee-appearance": "Gross knee deformity with abnormal alignment of the lower leg.",
      "knee-skin": "Skin is tented. The lower leg and foot are pale and cool.",
      "distal-pulse": "A distal pulse is not palpable on the injured side.",
      "knee-sensation": "Sensation is reduced across the foot.",
      "ankle-motor": "Ankle and toe movement are weak.",
      "knee-flexion": "Do not flex this knee.",
      "knee-weight-bearing": "Do not ask this patient to bear weight.",
    },
    rationale:
      "Gross deformity with distal neurovascular compromise is an immediate limb threat. Do not perform stability maneuvers, force flexion, or delay emergency management to complete an Ottawa screen.",
  },
];

export const kneeExamPhases: Array<{
  id: KneeExamPhaseId;
  label: string;
  findingIds: KneeFindingId[];
}> = [
  { id: "inspection", label: "Inspection", findingIds: ["knee-appearance", "knee-skin"] },
  { id: "palpation", label: "Landmark palpation", findingIds: ["patella", "fibular-head", "medial-joint-line"] },
  { id: "neurovascular", label: "Neurovascular", findingIds: ["distal-pulse", "knee-sensation", "ankle-motor"] },
  { id: "stability", label: "Stability", findingIds: ["valgus-stress", "varus-stress", "anterior-drawer"] },
  { id: "function", label: "Motion and gait", findingIds: ["knee-flexion", "knee-weight-bearing"] },
  { id: "decision", label: "Imaging decision", findingIds: [] },
];

export const kneeDecisionOptions: Array<{ id: KneeDecision; label: string }> = [
  { id: "no-knee-radiographs", label: "Ottawa criteria do not indicate knee radiographs" },
  { id: "knee-radiographs", label: "Knee radiographs are indicated" },
  { id: "immediate-knee-management", label: "Stop the exam and manage the limb threat" },
];

export function getKneeCase(caseId: string | undefined) {
  return kneeExamCases.find((item) => item.id === caseId) ?? kneeExamCases[0];
}

export function kneePhasesForCase(examCase: KneeExamCase) {
  if (examCase.immediateConcern) {
    return ["inspection", "neurovascular", "decision"] as KneeExamPhaseId[];
  }
  if (examCase.id === "medial-sprain") {
    return ["inspection", "palpation", "neurovascular", "stability", "function", "decision"] as KneeExamPhaseId[];
  }
  return ["inspection", "palpation", "neurovascular", "function", "decision"] as KneeExamPhaseId[];
}

export function getKneePhaseFindings(examCase: KneeExamCase, phase: KneeExamPhaseId) {
  const phaseConfig = kneeExamPhases.find((item) => item.id === phase);
  return (phaseConfig?.findingIds ?? []).filter((id) => examCase.requiredFindings.includes(id));
}

export function scoreKneeExam(examCase: KneeExamCase, examined: KneeFindingId[], decision: KneeDecision) {
  const requiredCompleted = examCase.requiredFindings.filter((id) => examined.includes(id)).length;
  const assessmentPoints = Math.round((requiredCompleted / examCase.requiredFindings.length) * 70);
  const decisionPoints = decision === examCase.correctDecision ? 30 : 0;
  return {
    score: assessmentPoints + decisionPoints,
    assessmentPoints,
    decisionCorrect: decision === examCase.correctDecision,
  };
}

export function getKneeDecisionFeedback(examCase: KneeExamCase, decision: KneeDecision) {
  if (decision === examCase.correctDecision) return examCase.rationale;
  if (examCase.immediateConcern) {
    return "Gross deformity, pallor, coolness, an absent distal pulse, or sensory loss takes priority over imaging rules. Manage the limb threat immediately.";
  }
  if (decision === "immediate-knee-management") {
    return "No immediate limb threat was identified. Complete the Ottawa Knee Rule decision using age, patellar and fibular-head tenderness, flexion, and four-step weight bearing.";
  }
  if (decision === "no-knee-radiographs") {
    return "A qualifying Ottawa Knee Rule finding is present. Recheck age, isolated patellar tenderness, fibular-head tenderness, flexion to 90 degrees, and four-step weight bearing.";
  }
  return "None of the five Ottawa Knee Rule criteria are present in this case. Imaging may still be appropriate for other clinical reasons, but the rule itself is negative.";
}
