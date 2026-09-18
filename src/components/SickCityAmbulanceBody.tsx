import {useGLTF} from '@react-three/drei';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';

/** Replace the kit's solid compartment and fused rear doors with an open shell. */
export default function SickCityAmbulanceBody({doorOpen}:{doorOpen:number}) {
  const {scene}=useGLTF('/models/sickcity/designed/unit-07-ambulance.glb','/draco/');
  const left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null);
  const model=useMemo(()=>{
    const copy=scene.clone(true);
    copy.traverse(object=>{
      if(!(object instanceof THREE.Mesh)) return;
      object.castShadow=true;object.receiveShadow=true;
      const porcelain=object.name.includes('porcelain');
      const rearTrim=object.name.includes('limestone') || object.name.includes('glass');
      if(!porcelain && !rearTrim) return;
      const geometry=object.geometry.clone();
      const positions=geometry.getAttribute('position');
      const index=geometry.index;
      const kept:number[]=[];
      for(let i=0;i<(index?.count ?? positions.count);i+=3) {
        const vertices=[0,1,2].map(offset=>index ? index.getX(i+offset) : i+offset);
        const remove=vertices.every(vertex=>positions.getZ(vertex)>(porcelain ? -1.151 : 2.9));
        if(!remove) kept.push(...vertices);
      }
      geometry.setIndex(kept);object.geometry=geometry;
    });
    return copy;
  },[scene]);
  useEffect(()=>()=>{model.traverse(object=>{if(object instanceof THREE.Mesh && (object.name.includes('porcelain') || object.name.includes('limestone') || object.name.includes('glass'))) object.geometry.dispose();});},[model]);
  useFrame(()=>{
    if(left.current) left.current.rotation.y=-doorOpen*Math.PI*.62;
    if(right.current) right.current.rotation.y=doorOpen*Math.PI*.62;
  });
  return <group position={[0,.13,0]}>
    <primitive object={model} dispose={null}/>
    {/* Thin shell leaves a real opening and space for the loaded cot. */}
    {[-1,1].map(side=><mesh key={side} position={[side*1.29,1.65,.9]} castShadow receiveShadow><boxGeometry args={[.12,2.65,4.1]}/><meshStandardMaterial color="#eef1ec"/></mesh>)}
    <mesh position={[0,2.92,.9]} castShadow><boxGeometry args={[2.7,.12,4.1]}/><meshStandardMaterial color="#eef1ec"/></mesh>
    <mesh position={[0,.38,.9]} receiveShadow><boxGeometry args={[2.7,.12,4.1]}/><meshStandardMaterial color="#4b5963"/></mesh>
    <mesh position={[0,1.65,-1.1]}><boxGeometry args={[2.7,2.65,.1]}/><meshStandardMaterial color="#d8e2df"/></mesh>
    {[-1,1].map(side=><mesh key={`wheel-cover-${side}`} position={[side*1.12,.68,2.02]}><boxGeometry args={[.3,.6,1.25]}/><meshStandardMaterial color="#89999f"/></mesh>)}
    <mesh position={[.99,1.25,-.2]}><boxGeometry args={[.4,1.4,1.25]}/><meshStandardMaterial color="#517684"/></mesh>
    {[-.26,.26].map(x=><mesh key={x} position={[x,.46,.9]}><boxGeometry args={[.045,.035,3.85]}/><meshStandardMaterial color="#bcc9cc" metalness={.6}/></mesh>)}
    {[-1,1].map(side=><group key={side} ref={side<0?left:right} position={[side*1.255,1.69,2.97]}>
      <mesh position={[-side*.615,0,0]} castShadow><boxGeometry args={[1.23,2.26,.08]}/><meshStandardMaterial color="#e7e4d8"/></mesh>
      <mesh position={[-side*.615,.45,.05]}><boxGeometry args={[.77,.72,.025]}/><meshStandardMaterial color="#294b60"/></mesh>
      <mesh position={[-side*1.07,-.2,.07]}><boxGeometry args={[.07,.24,.06]}/><meshStandardMaterial color="#323c42" metalness={.6}/></mesh>
      <mesh position={[-side*.615,-.45,.05]}><boxGeometry args={[1.2,.22,.025]}/><meshStandardMaterial color="#cb4542"/></mesh>
    </group>)}
  </group>;
}
