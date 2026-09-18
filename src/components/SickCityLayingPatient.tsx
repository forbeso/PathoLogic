import {useGLTF,useAnimations} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import {useMemo,useRef,useLayoutEffect,useEffect} from 'react';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
const LAYING_PATIENT_URL='/models/sickcity/patients/laying-moaning.glb';
export default function SickCityLayingPatient({patientRef, treated=false}: {patientRef?: React.RefObject<THREE.Group | null>; treated?:boolean}) {
  const source = useGLTF(LAYING_PATIENT_URL, "/draco/");
  const model = useMemo(() => clone(source.scene), [source.scene]);
  const animations = useMemo(
    () =>
      source.animations.map((sourceClip) => {
        const clip = sourceClip.clone();
        clip.tracks.forEach((track) => {
          if (!(track instanceof THREE.VectorKeyframeTrack) || !track.name.endsWith("Hips.position")) return;
          const startX = track.values[0];
          // Blender armature: local Z is vertical; X/Y carry planar root motion.
          const startY = track.values[1];
          for (let index = 0; index < track.values.length; index += 3) {
            track.values[index] = startX;
            track.values[index + 1] = startY;
          }
        });
        return clip;
      }),
    [source.animations]
  );
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const action = names.length > 0 ? actions[names[0]] : undefined;
  useFrame((_, delta) => {
    if (action) action.timeScale = THREE.MathUtils.damp(action.timeScale, treated ? .3 : 1, 2, delta);
  });

  useLayoutEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if ("map" in material && material.map instanceof THREE.Texture) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.map.needsUpdate = true;
        }
      });
    });
  }, [model]);

  useEffect(() => {
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    return () => {
      action.stop();
    };
  }, [action]);

  return (
    <group ref={root} position={[0, -0.87, 0]} scale={0.5} rotation={[0, Math.PI * 0.12, 0]}>
      <primitive ref={patientRef} object={model} />
    </group>
  );
}


useGLTF.preload(LAYING_PATIENT_URL,"/draco/");
