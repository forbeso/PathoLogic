import * as THREE from 'three';

export const CARE_FADE_DISTANCE = 14;
export function isNearPatient(object: THREE.Object3D, focus: THREE.Vector3) {
  const position = object.getWorldPosition(new THREE.Vector3());
  return Math.hypot(position.x-focus.x,position.z-focus.z) <= CARE_FADE_DISTANCE;
}

/** Own temporary materials so fading never mutates shared/cached GLTF materials. */
export function createCareVisibility() {
  const faded = new Map<THREE.Mesh, {material:THREE.Material|THREE.Material[];temporary:THREE.Material[];shadow:boolean}>();
  const restore = (mesh:THREE.Mesh) => {
    const state=faded.get(mesh);
    if (!state) return;
    mesh.material=state.material; mesh.castShadow=state.shadow;
    state.temporary.forEach(material=>material.dispose());
    faded.delete(mesh);
  };
  return {
    update(roots:THREE.Object3D[], focus?:THREE.Vector3) {
      const active=new Set<THREE.Mesh>();
      if(focus) for(const root of roots) if(isNearPatient(root,focus)) root.traverse(object=>{
        if(!(object instanceof THREE.Mesh)) return;
        active.add(object);
        if(faded.has(object)) return;
        const originals=Array.isArray(object.material)?object.material:[object.material];
        const temporary=originals.map(original=>{
          const material=original.clone();
          material.transparent=true;material.opacity=original.opacity*.12;material.depthWrite=false;
          return material;
        });
        faded.set(object,{material:object.material,temporary,shadow:object.castShadow});
        object.material=Array.isArray(object.material)?temporary:temporary[0];object.castShadow=false;
      });
      for(const mesh of faded.keys()) if(!active.has(mesh)) restore(mesh);
    },
    restoreAll() { for(const mesh of faded.keys()) restore(mesh); },
  };
}
