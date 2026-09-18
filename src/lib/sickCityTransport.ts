import type { CityPoint, VehiclePose } from './sickCityVehicle';
export type TransportPhase = 'loading' | 'stretcher' | 'transferring' | 'carrying' | 'boarding' | 'transport' | 'handoff';
export const HOSPITAL_RECEIVING_BAY:CityPoint=[22,0,-34];
export const HANDOFF_DURATION_MS=3500;
export function isTransportPhase(phase:string):phase is TransportPhase {
  return ['loading','stretcher','transferring','carrying','boarding','transport','handoff'].includes(phase);
}
export function readyForHospitalHandoff(pose:VehiclePose,inAmbulance:boolean) {
  return inAmbulance && Math.abs(pose.speed)<.3 && Math.hypot(pose.position[0]-HOSPITAL_RECEIVING_BAY[0],pose.position[2]-HOSPITAL_RECEIVING_BAY[2])<=5;
}
export function transportDestination(phase:TransportPhase,patient:CityPoint,ambulance:CityPoint):CityPoint {
  return phase==='transport' || phase==='handoff' ? HOSPITAL_RECEIVING_BAY : (phase==='stretcher' || phase==='transferring') ? patient : ambulance;
}

export const PATIENT_TRANSFER_MS = 2400;
export const AMBULANCE_LOADING_MS = 2800;
