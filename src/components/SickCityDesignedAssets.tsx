import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";

type Point = [number, number, number];
type KitAsset = "market-corner" | "civic-apartments" | "riverside-cafe" | "unit-07-ambulance";

/** Static GLBs authored in Blender. Instances share geometry and materials. */
export function CityKitModel({ asset, position, rotation = 0 }: {
  asset: KitAsset;
  position: Point;
  rotation?: number;
}) {
  const { scene } = useGLTF(`/models/sickcity/designed/${asset}.glb`, "/draco/");
  const model = useMemo(() => scene.clone(true), [scene]);
  useLayoutEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [model]);
  return <primitive object={model} position={position} rotation={[0, rotation, 0]} dispose={null} />;
}
