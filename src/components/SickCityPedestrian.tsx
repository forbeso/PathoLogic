import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

type SickCityPedestrianProps = React.JSX.IntrinsicElements["group"] & {
  url: string;
  walking?: boolean;
  animate?: boolean;
  direction?: 1 | -1;
  modelRotation?: number;
  speed?: number;
  minX?: number;
  maxX?: number;
};

function prepareClip(sourceClip: THREE.AnimationClip, walking: boolean) {
  const clip = sourceClip.clone();
  clip.tracks.forEach((track) => {
    if (!(track instanceof THREE.VectorKeyframeTrack) || !track.name.endsWith("Hips.position")) return;
    const startX = track.values[0];
    const startY = track.values[1];
    for (let index = 0; index < track.values.length; index += 3) {
      track.values[index] = startX;
      track.values[index + 1] = startY;
    }
  });
  if (!walking || clip.duration < 1.6) return clip;

  // These Mixamo exports contain a partial stride at each end. Frames 6-48
  // form the complete matching cycle, so looping this section removes the hitch.
  return THREE.AnimationUtils.subclip(clip, `${clip.name}-loop`, 6, 49, 30).optimize();
}

export default function SickCityPedestrian({
  url,
  walking = false,
  animate = walking,
  direction = 1,
  modelRotation = direction * Math.PI / 2,
  speed = 1.15,
  minX = -25,
  maxX = 25,
  ...props
}: SickCityPedestrianProps) {
  const source = useGLTF(url, "/draco/");
  const model = useMemo(() => clone(source.scene), [source.scene]);
  const animations = useMemo(
    () => source.animations.map((clip) => prepareClip(clip, walking)),
    [source.animations, walking]
  );
  const route = useRef<THREE.Group>(null);
  const animatedModel = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, animatedModel);
  const walkAction = names.length > 0 ? actions[names[0]] : undefined;

  useLayoutEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = false;
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
    if (!walkAction) return;
    walkAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    walkAction.paused = !animate;
    if (!animate) walkAction.time = 0;
    return () => {
      walkAction.stop();
    };
  }, [animate, walkAction]);

  useFrame((_, delta) => {
    if (!walking || !route.current) return;
    route.current.position.x += direction * speed * delta;
    if (direction === 1 && route.current.position.x > maxX) route.current.position.x = minX;
    if (direction === -1 && route.current.position.x < minX) route.current.position.x = maxX;
  });

  return (
    <group ref={route} {...props} dispose={null}>
      <group ref={animatedModel} rotation={[0, modelRotation, 0]} scale={1}>
        <primitive object={model} />
      </group>
    </group>
  );
}
