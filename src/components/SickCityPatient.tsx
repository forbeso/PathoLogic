import type { CityPatientResponse } from '@/lib/sickCityPatientResponse';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { patientBone, posePatientRig } from '@/lib/sickCityPatientRig';
import type { SickCityPose } from '@/lib/sickCity';

const PATIENT_URL='/models/sickcity/pedestrians/pedestrian-standing.glb';

export default function SickCityPatient({pose,patientRef,teen=false,response,modelUrl=PATIENT_URL}: {pose:SickCityPose;patientRef:RefObject<THREE.Group|null>;teen?:boolean;response?:CityPatientResponse;modelUrl?:string}) {
  const source=useGLTF(modelUrl,'/draco/');
  const prepared=useMemo(()=>{
    const character=clone(source.scene);
    // Pose the cloned bind skeleton directly; an idle mixer would reset these joints.
    character.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(character,true);
    const height=bounds.max.y-bounds.min.y;
    const scaled=new THREE.Group();
    scaled.add(character);
    scaled.scale.setScalar((teen?1.62:1.78)/Math.max(height,.01));
    const posed=new THREE.Group();posed.add(scaled);
    posePatientRig(posed,pose);
    const box=new THREE.Box3().setFromObject(posed,true), center=box.getCenter(new THREE.Vector3());
    const grounded=new THREE.Group();grounded.add(posed);
    posed.position.set(-center.x,-box.min.y+.025,-center.z);
    character.traverse(node=>{
      if(node instanceof THREE.Mesh) {
        node.castShadow=true;node.receiveShadow=true;
        // Imported skinned bounds are for the original pose, not the care pose.
        node.frustumCulled=false;
      }
    });
    const spine=patientBone(character,'Spine2');
    return {root:grounded,spine,rest:spine?.quaternion.clone()};
  },[source.scene,pose,teen]);
  const breathPhase=useRef(0);
  const breathing=useRef({rate:teen?28:14,effort:teen?.025:.008});
  useFrame((_,delta)=>{
    const dt=Math.min(delta,.1);
    breathing.current.rate=THREE.MathUtils.damp(breathing.current.rate,response?.respiratoryRate ?? (teen?28:14),3,dt);
    breathing.current.effort=THREE.MathUtils.damp(breathing.current.effort,response?.breathingEffort ?? (teen ? .025 : .008),3,dt);
    breathPhase.current+=dt*breathing.current.rate*Math.PI*2/60;
    if(prepared.spine && prepared.rest) {
      prepared.spine.quaternion.copy(prepared.rest);
      prepared.spine.rotateX(Math.sin(breathPhase.current)*breathing.current.effort);
    }
  });
  return <primitive ref={patientRef} object={prepared.root}/>;
}
