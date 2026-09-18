import type { SickCityCall } from './sickCity';
export type CarePoint = [number, number, number];
/** Match the visible patient's torso, rather than the ground-level dispatch waypoint. */
export function patientCareTarget(call: SickCityCall): CarePoint {
  const [x,y,z] = call.position;
  if (call.id === 'park-fall' || call.clinicalScenarioId === 'hypoglycemia') return [x,y + .45,z];
  if (call.pose === 'supine') return [x,y + .25,z];
  return [x,y + (call.pose === 'seated' ? .8 : 1.15),z];
}
export function patientCareCamera(patient: CarePoint, medic: CarePoint, aspect: number): CarePoint {
  const dx=medic[0]-patient[0], dz=medic[2]-patient[2];
  const distance=Math.hypot(dx,dz);
  const nx=distance>.1 ? dx/distance : 0, nz=distance>.1 ? dz/distance : 1;
  // Fixed patient-relative distance: approach direction must not change the framing scale.
  const retreat=aspect<1 ? 10 : 8;
  return [patient[0]+nx*retreat,patient[1]+4,patient[2]+nz*retreat];
}
