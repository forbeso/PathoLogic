import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {hospitalReceiverOffset,hospitalStretcherPose,type TransportPhase} from '@/lib/sickCityTransport';
import type {CityPoint,VehiclePose} from '@/lib/sickCityVehicle';
import SickCityPatient from './SickCityPatient';
import SickCityMedic from './SickCityMedic';

export default function SickCityStretcher({position,loaded,teen,laying,phase,progress,patientPosition,ambulance}:{position:CityPoint;loaded:boolean;teen:boolean;laying:boolean;phase?:TransportPhase;progress:number;patientPosition:CityPoint;ambulance:VehiclePose}) {
  const root=useRef<THREE.Group>(null),patient=useRef<THREE.Group>(null);
  const previous=useRef<THREE.Vector3 | null>(null);
  const passenger=useRef<THREE.Group>(null);
  const localPatient=useMemo(()=>new THREE.Vector3(),[]);
  const mattress=useMemo(()=>new THREE.Vector3(0,.93,0),[]);
  const heading=useRef(0);
  const partner=useRef<THREE.Group>(null);
  const partnerInput=useRef({forward:false,backward:false,left:false,right:false});
  const walkingUntil=useRef(0);
  const lastPartner=useRef<THREE.Vector3 | null>(null);
  const partnerWorld=useMemo(()=>new THREE.Vector3(),[]);

  useFrame(({clock})=>{
    if(!root.current) return;
    const dx=previous.current ? position[0]-previous.current.x : 0,dz=previous.current ? position[2]-previous.current.z : 0;
    if(Math.hypot(dx,dz)>.015) heading.current=Math.atan2(dx,dz);
    if(!previous.current) previous.current=new THREE.Vector3();
    previous.current.set(...position);
    root.current.position.set(position[0]-Math.sin(heading.current)*1.5,.04,position[2]-Math.cos(heading.current)*1.5);
    root.current.rotation.y=heading.current;
    const eased=progress*progress*(3-2*progress);
    if(phase==='boarding') {
      // Approach the rear first, then slide the cot into the patient compartment.
      const approach=Math.min(1,progress/.55);
      const slide=Math.max(0,(progress-.55)/.45);
      const rearDistance=4.4-slide*3.4;
      const targetX=ambulance.position[0]+Math.sin(ambulance.yaw)*rearDistance;
      const targetZ=ambulance.position[2]+Math.cos(ambulance.yaw)*rearDistance;
      root.current.position.lerp(localPatient.set(targetX,.04+slide*.35,targetZ),approach*approach*(3-2*approach));
      const turn=Math.atan2(Math.sin(ambulance.yaw-heading.current),Math.cos(ambulance.yaw-heading.current));
      root.current.rotation.y=heading.current+turn*approach;
    }
    if(phase==='handoff') {
      const handoff=hospitalStretcherPose(ambulance,progress);
      root.current.position.set(...handoff.position);
      root.current.rotation.y=handoff.yaw;
    }
    if(partner.current) {
      partner.current.position.set(0,-root.current.position.y,-1.65);
      partner.current.rotation.y=0;
      if(phase==='transferring') {
        partner.current.position.set(.9,-root.current.position.y,0);
        partner.current.rotation.y=-Math.PI/2;
      } else if(phase==='boarding') {
        const slide=Math.max(0,(progress-.55)/.45);
        // Remain outside the rear doors while the cot slides into the compartment.
        partner.current.position.z=1.65+slide*2;
        partner.current.rotation.y=Math.PI;
      } else if(phase==='handoff') {
        const offset=hospitalReceiverOffset(ambulance,progress);
        partner.current.position.set(...offset);
        partner.current.rotation.y=-Math.PI/4;
      }
      root.current.updateMatrixWorld(true);
      partner.current.getWorldPosition(partnerWorld);
      const moving=lastPartner.current ? lastPartner.current.distanceToSquared(partnerWorld)>.000001 : false;
      if(moving) walkingUntil.current=clock.elapsedTime+.16;
      partnerInput.current.forward=clock.elapsedTime<walkingUntil.current;
      if(!lastPartner.current) lastPartner.current=new THREE.Vector3();
      lastPartner.current.copy(partnerWorld);
    }
    if(passenger.current) {
      passenger.current.position.set(0,.93,0);
      if(phase==='transferring') {
        root.current.updateMatrixWorld(true);
        localPatient.set(...patientPosition);
        root.current.worldToLocal(localPatient);
        passenger.current.position.copy(localPatient).lerp(mattress,eased);
        passenger.current.position.y+=Math.sin(Math.PI*progress)*.25;
      }
    }
  });
  const handTargets=()=>{
    if(!root.current || phase==='handoff' && progress<.4) return;
    const sideGrip=phase==='transferring' || phase==='handoff';
    const boarding=phase==='boarding';
    const left=sideGrip ? new THREE.Vector3(.38,.99,.25) : new THREE.Vector3(boarding?-.27:.27,.98,boarding?1.12:-1.12);
    const right=sideGrip ? new THREE.Vector3(.38,.99,-.25) : new THREE.Vector3(boarding?.27:-.27,.98,boarding?1.12:-1.12);
    root.current.updateMatrixWorld(true);
    return {left:root.current.localToWorld(left),right:root.current.localToWorld(right)};
  };
  return <group ref={root}>
    {<group ref={partner}><SickCityMedic movementRef={partnerInput} handTargets={handTargets} handlingStretcher scale={1.1}/></group>}
    {[-1,1].flatMap(end=>[-.27,.27].map(x=><mesh key={`handle-${end}-${x}`} position={[x,.98,end*1.12]}><boxGeometry args={[.055,.055,.32]}/><meshStandardMaterial color="#293d43"/></mesh>))}
    <mesh position={[0,.74,0]} castShadow><boxGeometry args={[.72,.1,2.05]}/><meshStandardMaterial color="#dba332" metalness={.3}/></mesh>
    <mesh position={[0,.85,0]} castShadow><boxGeometry args={[.63,.15,1.95]}/><meshStandardMaterial color="#173f50" roughness={.85}/></mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*.36,.93,0]}><boxGeometry args={[.045,.14,1.3]}/><meshStandardMaterial color="#d2dce1" metalness={.8} roughness={.3}/></mesh>
      {[-.68,.68].map(z=><group key={z}>
        <mesh position={[side*.28,.42,z]}><boxGeometry args={[.045,.6,.045]}/><meshStandardMaterial color="#b6c4ca" metalness={.7}/></mesh>
        <mesh position={[side*.3,.13,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.13,.13,.07,12]}/><meshStandardMaterial color="#20252b"/></mesh>
      </group>)}
    </group>)}
    {loaded && <group ref={passenger} position={[0,.93,0]}><SickCityPatient pose="supine" patientRef={patient} teen={teen} modelUrl={laying ? "/models/sickcity/patients/laying-moaning.glb" : undefined}/></group>}
    {loaded && phase !== 'transferring' && [-.3,.45].map(z=><mesh key={z} position={[0,1.14,z]}><boxGeometry args={[.63,.025,.07]}/><meshStandardMaterial color="#d5b54b"/></mesh>)}
  </group>;
}
