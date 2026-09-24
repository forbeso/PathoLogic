import type { ScenarioState } from './emtSceneEngine';

export type CityPatientResponse = {
  stage: 'assessment' | 'treated' | 'reassessed';
  respiratoryRate: number;
  breathingEffort: number;
  condition: 'unconfirmed' | 'reassessed' | 'worsening';
  respiratoryRateObserved: boolean;
  breathing: string;
  responsiveness: string;
};

/** Present the city scenario's recorded observations; never infer recovery from a click. */
export function cityPatientResponse(state: ScenarioState): CityPatientResponse | undefined {
  const requiredTreatment: Record<string, string[]> = {
    'sickcity-teen-breathing': ['EPINEPHRINE_ADMINISTERED', 'OXYGEN_APPLIED'],
    'car-accident': ['OXYGEN_APPLIED', 'SPINAL_PRECAUTIONS_MAINTAINED', 'EXTRICATION_COORDINATED'],
    hypoglycemia: ['SCENARIO_MEDICATION_ADMINISTERED'],
    'opioid-overdose': ['OXYGEN_APPLIED', 'SCENARIO_MEDICATION_ADMINISTERED'],
    'chest-pain': ['OXYGEN_APPLIED', 'SCENARIO_MEDICATION_ADMINISTERED'],
  };
  const required = requiredTreatment[state.scenarioId];
  if (!required) return undefined;
  const events: readonly string[] = state.triggeredEvents;
  const treated = required.some(event => events.includes(event));
  const reassessed = required.every(event => events.includes(event)) && events.includes('REASSESSMENT_COMPLETED');
  const crash = state.scenarioId === 'car-accident';
  const teen = state.scenarioId === 'sickcity-teen-breathing';
  // Visual amplitude describes the existing scenario findings, not treatment effectiveness.
  const breathingEffort = teen ? reassessed ? .014 : .025
    : crash ? .006 : state.scenarioId === 'opioid-overdose' ? reassessed ? .01 : .004 : .008;
  return {
    breathingEffort,
    condition: reassessed ? crash ? 'worsening' : 'reassessed' : 'unconfirmed',
    stage: reassessed ? 'reassessed' : treated ? 'treated' : 'assessment',
    respiratoryRate: state.patient.vitals.respiratoryRate,
    respiratoryRateObserved: state.patient.vitalsRevealed.includes('respiratoryRate'),
    breathing: state.patient.breathingStatus,
    responsiveness: state.patient.responsiveness,
  };
}
