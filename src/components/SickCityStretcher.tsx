import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {CityPoint} from '@/lib/sickCityVehicle';
import SickCityPatient from './SickCityPatient';

export default function SickCityStretcher({position,loaded,teen,laying}:{position:CityPoint;loaded:boolean;teen:boolean;laying:boolean}) {
  const root=useRef<THREE.Group>(null),patient=useRef<THREE.Group>(null);
  const previous=useMemo(()=>new THREE.Vector3(),[]); // Initial placement only.
  const heading=useRef(0);
  useFrame(()=>{
    if(!root.current) return;
    const dx=position[0]-previous.x,dz=position[2]-previous.z;
    if(Math.hypot(dx,dz)>.015) heading.current=Math.atan2(dx,dz);
    previous.set(...position);
    root.current.position.set(position[0]-Math.sin(heading.current)*1.5,.04,position[2]-Math.cos(heading.current)*1.5);
    root.current.rotation.y=heading.current;
  });
  return <group ref={root}>
    <mesh position={[0,.74,0]} castShadow><boxGeometry args={[.72,.1,2.05]}/><meshStandardMaterial color="#dba332" metalness={.3}/></mesh>
    <mesh position={[0,.85,0]} castShadow><boxGeometry args={[.63,.15,1.95]}/><meshStandardMaterial color="#173f50" roughness={.85}/></mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*.36,.93,0]}><boxGeometry args={[.045,.14,1.3]}/><meshStandardMaterial color="#d2dce1" metalness={.8} roughness={.3}/></mesh>
      {[-.68,.68].map(z=><group key={z}>
        <mesh position={[side*.28,.42,z]}><boxGeometry args={[.045,.6,.045]}/><meshStandardMaterial color="#b6c4ca" metalness={.7}/></mesh>
        <mesh position={[side*.3,.13,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.13,.13,.07,12]}/><meshStandardMaterial color="#20252b"/></mesh>
      </group>)}
    </group>)}
    {loaded && <group position={[0,.93,0]}><SickCityPatient pose="supine" patientRef={patient} teen={teen} modelUrl={laying ? "/models/sickcity/patients/laying-moaning.glb" : undefined}/></group>}
    {loaded && [-.3,.45].map(z=><mesh key={z} position={[0,1.14,z]}><boxGeometry args={[.63,.025,.07]}/><meshStandardMaterial color="#d5b54b"/></mesh>)}
  </group>;
}
