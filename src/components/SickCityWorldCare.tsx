import { Html, useGLTF } from '@react-three/drei';
import { useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Activity, Hand, HeartPulse, BriefcaseMedical, X } from 'lucide-react';
import type { WorldCareTarget } from '@/lib/sickCityInteraction';
import SickCityCareChoices from './SickCityCareChoices';
import styles from './SickCityWorldCare.module.css';

function BodyAnchor({anchor,patientRef,children,fallback}: {anchor: WorldCareTarget['anchor'];patientRef:RefObject<THREE.Group|null>;children:ReactNode;fallback:[number,number,number]}) {
  const group=useRef<THREE.Group>(null);
  const point=useMemo(()=>new THREE.Vector3(),[]);
  useFrame(()=> {
    if (!group.current?.parent || !patientRef.current || anchor==='bag') return;
    const suffix=anchor==='head'?'Head':anchor==='hand'?'RightHand':'Spine2';
    let bone:THREE.Object3D|undefined;
    patientRef.current.traverse(node=>{if((node instanceof THREE.Bone && node.name.endsWith(suffix)) || node.name===`care-${suffix}`) bone=node;});
    if (!bone) return;
    bone.getWorldPosition(point);
    group.current.parent.worldToLocal(point);point.y+=.35;
    if(group.current.position.distanceTo(point)>.12) group.current.position.copy(point);
  });
  return <group ref={group} position={fallback}>{children}</group>;
}
export default function SickCityWorldCare({targets,patientRef,fallback}: {fallback:[number,number,number];targets: WorldCareTarget[];patientRef:RefObject<THREE.Group|null>}) {
  const source=useGLTF('/models/emt-scene/custom/first-aid-bag-optimized.glb','/draco/');
  const bag=useMemo(() => {
    const model=source.scene.clone(true);
    const box=new THREE.Box3().setFromObject(model), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3());
    const scale=.8/Math.max(size.x,size.y,size.z);
    model.scale.setScalar(scale);
    model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
    return model;
  },[source.scene]);
  return <>
    <group position={[1.35,0,0]}><primitive object={bag}/></group>
    {targets.map((target,index) => {
      const anchor: [number,number,number] = target.anchor==='bag' ? [1.35,.8+index*.85,0] : target.anchor==='head' ? [0,.9,-.55] : target.anchor==='hand' ? [.45,.65,0] : [0,.85,0];
      const Icon=target.anchor==='bag'?BriefcaseMedical:target.anchor==='hand'?Hand:target.anchor==='chest'?HeartPulse:Activity;
      return <group key={target.id} position={target.anchor==='bag'?anchor:[0,0,0]}><BodyAnchor anchor={target.anchor} patientRef={patientRef} fallback={target.anchor==='bag'?[0,0,0]:fallback}><Html center zIndexRange={[60,50]} calculatePosition={(object,camera,size)=> {
          const projected=new THREE.Vector3().setFromMatrixPosition(object.matrixWorld).project(camera);
          const x=(projected.x+1)*size.width/2, y=(1-projected.y)*size.height/2;
          if (!target.selected) {
            if(size.width<640 && target.anchor==='bag') {
              // Keep equipment controls below the mobile findings panel, in separate rows.
              const base=new THREE.Vector3().setFromMatrixPosition(object.matrixWorld);
              base.y-=index*.85;
              base.project(camera);
              const baseY=Math.max(275,Math.min(size.height-120-(targets.length-1)*56,(1-base.y)*size.height/2));
              return [Math.max(90,Math.min(size.width-90,x)),baseY+index*56];
            }
            return [x,y];
          }
          // Keep the menu beside the patient and inside the viewport at every approach angle.
          return [Math.max(155,Math.min(size.width-155,x-(size.width>900?310:0))),Math.max(170,Math.min(size.height-170,y+(size.width>900?0:200)))];
        }}>
        <div className={styles.target}>
          {target.selected ? <section className={styles.menu} aria-label={`${target.label} actions`}>
            <header><span><Icon size={16}/>{target.label}</span><button aria-label={`Close action choices for ${target.label}`} onClick={target.onClose}><X size={16}/></button></header>
            {target.prompt && <p className={styles.prompt}>{target.prompt}</p>}
            <SickCityCareChoices compact choices={target.choices} onChoose={target.onChoose}/>
            {target.next && <button className={styles.next} onClick={target.next.onClick}>{target.next.label}</button>}
            {target.feedback && <p role="status">{target.feedback.replace(/^(Coach|Patient):\s*/i,'')}</p>}
          </section> : <button className={styles.marker} onClick={target.onSelect} aria-label={`Interact with ${target.label}`} data-testid={`world-care-${target.id}`}><Icon size={20}/><span>{target.label}</span></button>}
        </div>
      </Html></BodyAnchor></group>;
    })}
  </>;
}
