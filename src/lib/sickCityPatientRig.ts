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

/** Two-bone reach in world space; unreachable grips clamp without stretching bones. */
export function reachPatientHand(root:THREE.Object3D,side:'Left'|'Right',target:THREE.Vector3,pole:THREE.Vector3) {
  const upper=patientBone(root,`${side}Arm`),elbow=patientBone(root,`${side}ForeArm`),hand=patientBone(root,`${side}Hand`);
  if(!upper || !elbow || !hand) return;
  root.updateMatrixWorld(true);
  const shoulder=upper.getWorldPosition(new THREE.Vector3());
  const joint=elbow.getWorldPosition(new THREE.Vector3());
  const wrist=hand.getWorldPosition(new THREE.Vector3());
  const a=shoulder.distanceTo(joint),b=joint.distanceTo(wrist);
  if(a<1e-6 || b<1e-6) return;
  const direction=target.clone().sub(shoulder);
  const requested=direction.length();
  if(requested<1e-6) return;
  direction.divideScalar(requested);
  const distance=THREE.MathUtils.clamp(requested,Math.abs(a-b)+1e-6,a+b-1e-6);
  const bend=pole.clone().addScaledVector(direction,-pole.dot(direction));
  if(bend.lengthSq()<1e-8) {
    bend.set(Math.abs(direction.y)<.9?0:1,Math.abs(direction.y)<.9?1:0,0);
    bend.addScaledVector(direction,-bend.dot(direction));
  }
  bend.normalize();
  const along=(a*a-b*b+distance*distance)/(2*distance);
  const height=Math.sqrt(Math.max(0,a*a-along*along));
  const elbowTarget=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height);
  const wristTarget=shoulder.clone().addScaledVector(direction,distance);
  aimPatientBone(root,`${side}Arm`,`${side}ForeArm`,elbowTarget.sub(shoulder));
  aimPatientBone(root,`${side}ForeArm`,`${side}Hand`,wristTarget.sub(elbow.getWorldPosition(new THREE.Vector3())));
}
