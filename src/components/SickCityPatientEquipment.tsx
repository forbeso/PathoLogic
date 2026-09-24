import { useMemo, useRef, type RefObject, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { WorldCareEquipment } from '@/lib/sickCityInteraction';

// Follow world-space bones without inheriting the imported skeleton's scale.
function Attachment({patientRef, boneName, children}: {patientRef:RefObject<THREE.Group|null>;boneName:string;children:ReactNode}) {
  const root=useRef<THREE.Group>(null);
  const transform=useMemo(()=>({position:new THREE.Vector3(),rotation:new THREE.Quaternion(),parent:new THREE.Quaternion()}),[]);
  const bone=useRef<THREE.Object3D|null>(null);
  useFrame(()=>{
    const group=root.current;
    if(!group?.parent || !patientRef.current) return;
    if(!bone.current || !patientRef.current.getObjectById(bone.current.id)) {
      bone.current=null;
      patientRef.current.traverse(object=>{if((object instanceof THREE.Bone && object.name.endsWith(boneName)) || object.name===`care-${boneName}`) bone.current=object;});
    }
    group.visible=Boolean(bone.current);
    if(!bone.current) return;
    bone.current.getWorldPosition(transform.position);
    group.position.copy(group.parent.worldToLocal(transform.position));
    bone.current.getWorldQuaternion(transform.rotation);
    group.parent.getWorldQuaternion(transform.parent).invert();
    group.quaternion.copy(transform.parent.multiply(transform.rotation));
  });
  return <group ref={root} visible={false}>{children}</group>;
}

export default function SickCityPatientEquipment({patientRef,equipment,onStretcher=false,procedural=false}: {patientRef:RefObject<THREE.Group|null>;equipment:WorldCareEquipment;onStretcher?:boolean;procedural?:boolean}) {
  if(!equipment.bagOpen) return null;
  return <>
    {equipment.oxygenApplied && <>
      <group position={onStretcher ? [.43,-.25,.65] : [1.8,.32,.65]}>
        <mesh castShadow><cylinderGeometry args={[.12,.12,.55,20]}/><meshStandardMaterial color="#d9e2e3" metalness={.5} roughness={.4}/></mesh>
        <mesh position={[0,.3,0]}><cylinderGeometry args={[.1,.12,.08,16]}/><meshStandardMaterial color="#297a65"/></mesh>
        <mesh position={[0,.39,0]}><boxGeometry args={[.13,.1,.08]}/><meshStandardMaterial color="#c3aa65" metalness={.5}/></mesh>
        {!equipment.response && <Html center position={[0,.6,0]} zIndexRange={[40,30]} style={{pointerEvents:'none'}}><span aria-label="Oxygen support active" style={{color:'#b7eadc',background:'#102620',borderRadius:8,padding:'4px 8px',fontSize:11,whiteSpace:'nowrap'}}>Oxygen applied</span></Html>}
      </group>
      <Attachment patientRef={patientRef} boneName="Head">
        <mesh position={[0,procedural?-.1:.08,procedural?.36:.1]} scale={procedural?[.17,.2,.1]:[.065,.08,.04]}>
          <sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#b9e5df" transparent opacity={.65} depthWrite={false}/>
        </mesh>
      </Attachment>
    </>}
    {equipment.bloodPressure && <Attachment patientRef={patientRef} boneName="RightArm">
      <mesh position={[0,.13,0]}><cylinderGeometry args={[procedural?.12:.09,procedural?.115:.085,.17,20,1,true]}/><meshStandardMaterial color="#273947" side={THREE.DoubleSide}/></mesh>
      <mesh position={[.085,.13,0]}><boxGeometry args={[.025,.09,.07]}/><meshStandardMaterial color="#69c2c0"/></mesh>
    </Attachment>}
    {equipment.spo2 !== undefined && <Attachment patientRef={patientRef} boneName="RightHand">
      <mesh position={[0,.085,0]}><boxGeometry args={[.055,.085,.06]}/><meshStandardMaterial color="#e3e8ec"/></mesh>
      <mesh position={[0,.085,.032]}><boxGeometry args={[.03,.035,.005]}/><meshStandardMaterial color="#56e8c0" emissive="#56e8c0" emissiveIntensity={.7}/></mesh>
    </Attachment>}
    <group position={onStretcher ? [0,.05,1.08] : [1.35,.07,.65]}>
      <mesh><boxGeometry args={[.48,.14,.32]}/><meshStandardMaterial color="#263746"/></mesh>
      <mesh position={[0,.076,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.37,.23]}/><meshStandardMaterial color="#143f3f" emissive="#143f3f" emissiveIntensity={.6}/></mesh>
      {(equipment.bloodPressure || equipment.spo2 !== undefined || equipment.response?.stage === 'treated' || equipment.response?.stage === 'reassessed') && <Html center position={[0,.3,0]} zIndexRange={[40,30]} style={{pointerEvents:'none'}} calculatePosition={(object,camera,size)=>{
        const point=new THREE.Vector3().setFromMatrixPosition(object.matrixWorld).project(camera);
        return [Math.max(140,Math.min(size.width-140,(point.x+1)*size.width/2+(onStretcher && size.width>=640 ? 220 : 0))),Math.max(160,Math.min(size.height-(size.width<640 ? 300 : 180),(1-point.y)*size.height/2+80))];
      }}>
        <div aria-label="Patient equipment readings" style={{width:230,maxWidth:'calc(100vw - 32px)',boxSizing:'border-box',background:'rgba(9,20,27,.92)',border:'1px solid #4b807f',borderRadius:9,padding:'8px 12px',color:'#a9f0df',fontFamily:'monospace',fontSize:12,whiteSpace:'nowrap'}}>
          <div style={{fontSize:9,color:'#9baeb6',letterSpacing:2,marginBottom:4}}>PATIENT MONITOR</div>
          {equipment.response && <div aria-label="Patient response" data-response-stage={equipment.response.stage} data-response-condition={equipment.response.condition} style={{maxWidth:230,whiteSpace:'normal',lineHeight:1.45,marginBottom:6}}>
            {equipment.response.condition==='worsening' && <div style={{color:'#ffb3a6',fontWeight:700}}>WORSENING ON REASSESSMENT</div>}
            <div>{equipment.response.stage==='reassessed' ? 'PARTNER · REASSESSMENT' : equipment.response.stage==='treated' ? 'PARTNER · TREATMENT GIVEN' : 'PATIENT OBSERVATION'}</div>
            {equipment.response.stage==='treated' ? 'Treatment given. Reassess to check the response.' : <>{equipment.response.breathing}. {equipment.response.responsiveness}.</>}
            {equipment.response.respiratoryRateObserved && <div>RR {equipment.response.respiratoryRate}/min</div>}
          </div>}
          {equipment.response && equipment.oxygenApplied && <div aria-label="Oxygen support active" style={{fontSize:10,marginBottom:4}}>Oxygen applied</div>}
          {equipment.bloodPressure && <div>BP {equipment.bloodPressure} mmHg</div>}
          {equipment.spo2 !== undefined && <div>SpO₂ {equipment.spo2}% · Pulse {equipment.pulse}/min</div>}
        </div>
      </Html>}
    </group>
  </>;
}
