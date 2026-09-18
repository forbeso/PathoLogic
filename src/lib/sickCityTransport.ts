import type { CityPoint, VehiclePose } from './sickCityVehicle';
export type TransportPhase = 'loading' | 'stretcher' | 'transferring' | 'carrying' | 'boarding' | 'transport' | 'handoff';
export const HOSPITAL_RECEIVING_BAY:CityPoint=[22,0,-34];
export const HANDOFF_DURATION_MS=7000;
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

export const HOSPITAL_RECEIVING_ENTRANCE:CityPoint=[22,0,-38];
/** Exit behind the ambulance, move alongside it, then approach receiving. */
export function hospitalStretcherPose(pose:VehiclePose,progress:number) {
  const t=Math.max(0,Math.min(1,progress));
  const rear=[Math.sin(pose.yaw),Math.cos(pose.yaw)];
  const side=[Math.cos(pose.yaw),-Math.sin(pose.yaw)];
  const toward=(HOSPITAL_RECEIVING_ENTRANCE[0]-pose.position[0])*side[0]+(HOSPITAL_RECEIVING_ENTRANCE[2]-pose.position[2])*side[1];
  const sign=toward<0?-1:1;
  const inside:CityPoint=[pose.position[0]+rear[0],.39,pose.position[2]+rear[1]];
  const outside:CityPoint=[pose.position[0]+rear[0]*5,.04,pose.position[2]+rear[1]*5];
  const beside:CityPoint=[outside[0]+side[0]*sign*4,.04,outside[2]+side[1]*sign*4];
  const along=(HOSPITAL_RECEIVING_ENTRANCE[0]-pose.position[0])*rear[0]+(HOSPITAL_RECEIVING_ENTRANCE[2]-pose.position[2])*rear[1];
  const approach:CityPoint=[pose.position[0]+side[0]*sign*4+rear[0]*along,.04,pose.position[2]+side[1]*sign*4+rear[1]*along];
  const points=[inside,inside,outside,beside,approach,HOSPITAL_RECEIVING_ENTRANCE];
  const stops=[0,.12,.4,.55,.82,1];
  const segment=t<.12?0:t<.4?1:t<.55?2:t<.82?3:4;
  const a=points[segment],b=points[segment+1];
  const linear=(t-stops[segment])/(stops[segment+1]-stops[segment]);
  const blend=linear*linear*(3-2*linear);
  const position:CityPoint=[a[0]+(b[0]-a[0])*blend,a[1]+(b[1]-a[1])*blend,a[2]+(b[2]-a[2])*blend];
  return {position,yaw:segment<2?pose.yaw:Math.atan2(b[0]-a[0],b[2]-a[2])};
}
