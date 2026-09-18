import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, type RefObject } from 'react';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { patientBone, posePatientRig } from '@/lib/sickCityPatientRig';
import type { SickCityPose } from '@/lib/sickCity';

const PATIENT_URL='/models/sickcity/pedestrians/pedestrian-standing.glb';

export default function SickCityPatient({pose,patientRef,teen=false,modelUrl=PATIENT_URL}: {pose:SickCityPose;patientRef:RefObject<THREE.Group|null>;teen?:boolean;modelUrl?:string}) {
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
  useFrame(({clock})=>{
    if(prepared.spine && prepared.rest) {
      prepared.spine.quaternion.copy(prepared.rest);
      prepared.spine.rotateX(Math.sin(clock.elapsedTime*1.5)*.008);
    }
  });
  return <primitive ref={patientRef} object={prepared.root}/>;
}
