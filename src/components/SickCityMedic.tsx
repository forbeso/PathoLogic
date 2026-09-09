import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { SickCityMovement } from "@/components/SickCityScene";

type SickCityMedicProps = React.JSX.IntrinsicElements["group"] & {
  movementRef: React.MutableRefObject<SickCityMovement>;
};

const MEDIC_MODEL_URL = "/models/sickcity/medic-walking.glb";

export default function SickCityMedic({ movementRef, ...props }: SickCityMedicProps) {
  const source = useGLTF(MEDIC_MODEL_URL);
  const model = useMemo(() => clone(source.scene), [source.scene]);
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
  const { actions, names } = useAnimations(animations, root);
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

useGLTF.preload(MEDIC_MODEL_URL);
