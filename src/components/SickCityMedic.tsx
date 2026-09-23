import {aimPatientBone,patientBone,reachPatientHand} from "@/lib/sickCityPatientRig";
import type {TransportPhase} from "@/lib/sickCityTransport";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { SickCityMovement } from "@/components/SickCityScene";

type SickCityMedicProps = React.JSX.IntrinsicElements["group"] & {
  handTargets?:()=>{left:THREE.Vector3;right:THREE.Vector3}|undefined;
  handlingStretcher?:boolean;
  transferPhase?:TransportPhase;
  transferProgress?:number;
  movementRef: React.MutableRefObject<SickCityMovement>;
};

const MEDIC_MODEL_URL = "/models/sickcity/medic-walking.glb";

export default function SickCityMedic({ movementRef, handTargets, handlingStretcher=false, transferPhase, transferProgress=0, ...props }: SickCityMedicProps) {
  const source = useGLTF(MEDIC_MODEL_URL, "/draco/");
  const model = useMemo(() => {
    const copy=clone(source.scene);
    if(handlingStretcher) {
      copy.updateMatrixWorld(true);
      const hips=patientBone(copy,'Hips')?.getWorldPosition(new THREE.Vector3());
      if(hips) {copy.position.x-=hips.x;copy.position.z-=hips.z;copy.updateMatrixWorld(true);}
    }
    return copy;
  }, [source.scene,handlingStretcher]);
  const animations = useMemo(
    () =>
      source.animations.map((sourceClip) => {
        const clip = sourceClip.clone();
        const hipTrack = clip.tracks.find(
          (track): track is THREE.VectorKeyframeTrack =>
            track instanceof THREE.VectorKeyframeTrack && track.name.endsWith("Hips.position")
        );

        // Keep the natural vertical step, but let the game controller own world movement.
        if (hipTrack) {
          const values = hipTrack.values;
          const startX = values[0];
          const startY = values[1];
          for (let index = 0; index < values.length; index += 3) {
            values[index] = startX;
            values[index + 1] = startY;
          }
        }

        return clip;
      }),
    [source.animations]
  );
  const root = useRef<THREE.Group>(null);
  const wasMoving = useRef(false);
  const posedBones=useMemo(()=>['Spine','Spine1','LeftArm','RightArm','LeftForeArm','RightForeArm'].map(name=>patientBone(model,name)).filter((bone):bone is THREE.Bone=>Boolean(bone)),[model]);
  const originalPose=useRef<THREE.Quaternion[]>([]);
  // Restore last frame's overlay before the animation mixer evaluates its base pose.
  useFrame(()=>{
    posedBones.forEach((bone,index)=>{if(originalPose.current[index]) bone.quaternion.copy(originalPose.current[index]);});
  },-2);
  const { actions, names } = useAnimations(animations, root);
  useFrame(()=>{
    originalPose.current=posedBones.map(bone=>bone.quaternion.clone());
    if(!handlingStretcher && transferPhase!=='transferring' && transferPhase!=='boarding') return;
    const reach=handlingStretcher ? 1 : Math.sin(Math.PI*transferProgress);
    posedBones.forEach(bone=>{
      if(bone.name.endsWith('Spine') || bone.name.endsWith('Spine1')) bone.rotateX(reach*.18);
    });
    const orientation=root.current?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
    for(const [side,sign] of [['Left',1],['Right',-1]] as const) {
      for(const [joint,child,direction] of [
        ['Arm','ForeArm',new THREE.Vector3(sign*.15,-1,.45)],
        ['ForeArm','Hand',new THREE.Vector3(0,-.45,1)],
      ] as const) {
        const bone=patientBone(model,`${side}${joint}`);
        if(!bone) continue;
        const base=bone.quaternion.clone();
        aimPatientBone(model,`${side}${joint}`,`${side}${child}`,direction.applyQuaternion(orientation));
        bone.quaternion.slerp(base,1-reach);
      }
    }
    const grips=handTargets?.();
    if(grips) for(const [side,sign] of [['Left',1],['Right',-1]] as const) {
      const pole=new THREE.Vector3(sign*.4,-1,-.2).applyQuaternion(orientation);
      reachPatientHand(model,side,side==='Left'?grips.left:grips.right,pole);
    }
  });
  const walkAction = names.length > 0 ? actions[names[0]] : undefined;
  const idlePoseTime = animations[0] ? animations[0].duration * 0.24 : 0;

  useLayoutEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
  }, [model]);

  useEffect(() => {
    if (!walkAction) return;
    walkAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    walkAction.paused = true;
    walkAction.time = idlePoseTime;
    return () => {
      walkAction.stop();
    };
  }, [idlePoseTime, walkAction]);

  useFrame(() => {
    if (!walkAction) return;
    const movement = movementRef.current;
    const isMoving = movement.forward || movement.backward || movement.left || movement.right;
    if (isMoving === wasMoving.current) return;
    wasMoving.current = isMoving;
    walkAction.paused = !isMoving;
    if (!isMoving) walkAction.time = idlePoseTime;
  });

  return (
    <group ref={root} {...props} dispose={null}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MEDIC_MODEL_URL, "/draco/");
