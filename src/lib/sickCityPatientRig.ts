import * as THREE from 'three';
import type { SickCityPose } from './sickCity';

export function patientBone(root:THREE.Object3D,name:string) {
  let result:THREE.Bone|undefined;
  root.traverse(node=>{if(node instanceof THREE.Bone && node.name.endsWith(name)) result=node;});
  return result;
}

/** Aim a joint in world space, preserving its bind-axis convention and bone lengths. */
export function aimPatientBone(root:THREE.Object3D,name:string,childName:string,direction:THREE.Vector3) {
  const bone=patientBone(root,name), child=patientBone(root,childName);
  if(!bone?.parent || !child) return;
  root.updateMatrixWorld(true);
  const current=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  const delta=new THREE.Quaternion().setFromUnitVectors(current,direction.clone().normalize());
  const world=bone.getWorldQuaternion(new THREE.Quaternion());
  const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(parent.multiply(delta).multiply(world));
  root.updateMatrixWorld(true);
}

export function posePatientRig(root:THREE.Group,pose:SickCityPose) {
  for(const [side,sign] of [['Left',1],['Right',-1]] as const) {
    aimPatientBone(root,`${side}Arm`,`${side}ForeArm`,new THREE.Vector3(sign*.12,-1,.15));
    aimPatientBone(root,`${side}ForeArm`,`${side}Hand`,new THREE.Vector3(sign*-.12,pose==='seated'?-.15:-1,pose==='seated'?1:.15));
    aimPatientBone(root,`${side}UpLeg`,`${side}Leg`,new THREE.Vector3(sign*.07,pose==='seated'?-.1:-1,pose==='seated'?1:0));
    aimPatientBone(root,`${side}Leg`,`${side}Foot`,new THREE.Vector3(0,pose==='seated'?-.05:-1,pose==='seated'?1:0));
    if(pose==='seated') aimPatientBone(root,`${side}Foot`,`${side}ToeBase`,new THREE.Vector3(0,0,1));
  }
  // An upright character faces +Z; -90° lays it on its back, face upwards.
  if(pose==='supine') root.rotation.x=-Math.PI/2;
  root.updateMatrixWorld(true);
}
