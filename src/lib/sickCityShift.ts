export { CITY_LOCATIONS, type CityLocation } from './sickCityLocations';
import { SICK_CITY_CALLS, type SickCityCallId } from './sickCity';
import { CLINICAL_SCENARIOS } from './clinicalScenarios';

export const SHIFT_CALL_LIMIT = 5;
export type UnitStatus = 'AVAILABLE' | 'DISPATCHED' | 'EN ROUTE' | 'ON SCENE' | 'PATIENT CONTACT' | 'TRANSPORTING' | 'AT HOSPITAL' | 'CLEARING';
export type PerformanceCategory = 'safety' | 'airway' | 'breathing' | 'circulation' | 'assessment' | 'history' | 'vitals' | 'treatment' | 'medication' | 'transport' | 'triage' | 'clinicalDecisions' | 'reassessment' | 'communication' | 'efficiency';
export type SkillScores = Partial<Record<PerformanceCategory, number>>;
export interface ClinicalDecision { objectiveId: string; category: PerformanceCategory; choice: string; correct: boolean; rationale: string }
export interface ShiftCallResult { callId: SickCityCallId; scores: SkillScores; xp: number; review: string; decisions: ClinicalDecision[] }
export interface Shift { number: number; calls: ShiftCallResult[] }
export interface PlayerProgress { level: number; totalXp: number }
export interface DispatchReport { title: string; lines: string[]; reliability: 'caller-report' | 'limited' }
export interface CareerCall {
  id: SickCityCallId; priority: 1 | 2 | 3; locationId: string; dispatchReport: DispatchReport;
  minimumLevel: number; difficulty: number; xpReward: number; callType: 'medical' | 'trauma';
  hiddenDiagnosis?: string; objectives: string[]; performanceCategories: PerformanceCategory[];
}
// Optional per-call overrides; adding content does not depend on its array order.
const careerMetadata: Partial<Record<SickCityCallId, { title?: string; minimumLevel: number; difficulty: number }>> = {
  'plaza-diabetic': {title:'Adult with altered mental status', minimumLevel:1, difficulty:1},
  'clinical-anaphylaxis': {title:'Teenager with breathing difficulty', minimumLevel:3, difficulty:3},
  'clinical-car-accident': {title:'Driver trapped after collision', minimumLevel:3, difficulty:3},
  'clinical-hypoglycemia': {title:'Adult confused and weak', minimumLevel:2, difficulty:2},
  'clinical-opioid-overdose': {title:'Unresponsive adult', minimumLevel:3, difficulty:3},
  'clinical-chest-pain': {title:'Adult with chest pressure', minimumLevel:2, difficulty:2},
};
export const CAREER_CALLS: CareerCall[] = SICK_CITY_CALLS.map(call => {
  const metadata = careerMetadata[call.id];
  return {
    id: call.id, priority: call.priority === 'High priority' ? 1 : call.priority === 'Urgent' ? 2 : 3,
    locationId: call.locationId,
    dispatchReport: {title:metadata?.title ?? call.title, lines:[call.summary], reliability:call.clinicalScenarioId ? 'limited' : 'caller-report'},
    minimumLevel:metadata?.minimumLevel ?? 1, difficulty:metadata?.difficulty ?? 1,
    xpReward:call.rewardXp, callType:call.id.includes('trauma') || call.id.includes('fall') || call.id.includes('accident') ? 'trauma' : 'medical',
    hiddenDiagnosis:call.clinicalScenarioId ? CLINICAL_SCENARIOS.find(s => s.id === call.clinicalScenarioId)?.fieldImpression : undefined,
    objectives:call.clinicalScenarioId ? ['scene-safety', 'primary-assessment', 'baseline-vitals', 'treatment', 'transport-decision', 'reassessment'] : call.steps.map(step => step.id),
    performanceCategories:call.clinicalScenarioId ? ['safety', 'assessment', 'clinicalDecisions', 'treatment', 'reassessment', 'communication', 'efficiency'] : [...new Set(call.steps.map(step => quickCategory(step.id)))],
  };
});
export const SKILL_LABELS: Record<PerformanceCategory, string> = { safety: 'Scene safety', airway: 'Airway', breathing: 'Breathing', circulation: 'Circulation', assessment: 'Assessment', history: 'History', vitals: 'Vitals', treatment: 'Treatment', medication: 'Medication', transport: 'Transport decisions', triage: 'Triage', clinicalDecisions: 'Clinical decisions', reassessment: 'Reassessment', communication: 'Communication', efficiency: 'Efficiency' };
export function careerRank(level: number) { return level >= 15 ? 'HIGH ACUITY' : level >= 10 ? 'SENIOR EMT' : level >= 5 ? 'EMT' : 'ROOKIE EMT'; }
export function assignCall(level: number, recent: SickCityCallId[], random = Math.random): number {
  const unlocked = CAREER_CALLS.map((call, index) => ({call, index})).filter(({call}) => call.minimumLevel <= level);
  const unseen = unlocked.filter(({call}) => !recent.includes(call.id));
  const different = unlocked.filter(({call}) => call.id !== recent.at(-1));
  const pool = unseen.length ? unseen : different.length ? different : unlocked;
  return pool[Math.min(pool.length - 1, Math.floor(Math.max(0, random()) * pool.length))]?.index ?? 0;
}
export function unitStatus(phase: string, distance: number, inAmbulance: boolean): UnitStatus {
  if (phase === 'dispatch') return 'DISPATCHED';
  if (phase === 'locate') return distance <= 10 && !inAmbulance ? 'ON SCENE' : 'EN ROUTE';
  if (phase === 'clinical' || phase === 'assessment') return 'PATIENT CONTACT';
  if (['loading','stretcher','carrying'].includes(phase)) return 'ON SCENE';
  if (phase === 'transport') return 'TRANSPORTING';
  if (phase === 'handoff') return 'AT HOSPITAL';
  if (phase === 'complete') return 'CLEARING';
  return 'AVAILABLE';
}
export function quickCategory(id: string): PerformanceCategory {
  return ({ scene: 'safety', primary: 'assessment', focused: 'assessment', assessment: 'assessment', treatment: 'treatment', plan: 'transport', transport: 'transport', reassess: 'reassessment' } as Record<string, PerformanceCategory>)[id] ?? 'assessment';
}
export function quickScores(decisions: ClinicalDecision[]): SkillScores {
  const scores: SkillScores = {};
  for (const decision of decisions) {
    const attempts = decisions.filter(item => item.category === decision.category);
    scores[decision.category] = Math.round(100 * attempts.filter(item => item.correct).length / attempts.length);
  }
  return scores;
}
export function summarizeShift(calls: ShiftCallResult[]) {
  const scores: SkillScores = {};
  for (const key of Object.keys(SKILL_LABELS) as PerformanceCategory[]) {
    const measured = calls.flatMap(call => typeof call.scores[key] === 'number' ? [call.scores[key]!] : []);
    if (measured.length) scores[key] = Math.round(measured.reduce((sum, value) => sum + value, 0) / measured.length);
  }
  const weakest = (Object.keys(scores) as PerformanceCategory[]).sort((a,b) => scores[a]! - scores[b]!)[0];
  return { scores, weakest, xp: calls.reduce((sum, call) => sum + call.xp, 0) };
}
export function recommendedTraining(skill?: PerformanceCategory) {
  if (skill === 'assessment' || skill === 'vitals' || skill === 'history') return { href: '/focused-exams', label: 'Focused assessment labs' };
  return { href: '/emtscene', label: 'Clinical skills lab' };
}
