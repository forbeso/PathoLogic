import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createCareVisibility } from '@/lib/sickCityCareVisibility';

export default function SickCityCareVisibility({focus}:{focus?:[number,number,number]}) {
  const visibility=useMemo(()=>createCareVisibility(),[]);
  const elapsed=useRef(0);
  useEffect(()=>{
    if(!focus) visibility.restoreAll();
  },[focus,visibility]);
  useEffect(()=>()=>visibility.restoreAll(),[visibility]);
  useFrame(({scene},delta)=>{
    elapsed.current+=delta;
    if(!focus || elapsed.current<.1) return;
    elapsed.current=0;
    const roots:THREE.Object3D[]=[];
    scene.traverse(object=>{if(object.userData.careFade) roots.push(object);});
    visibility.update(roots,new THREE.Vector3(...focus));
  });
  return null;
}
