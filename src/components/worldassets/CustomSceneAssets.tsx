import { Clone, useGLTF } from "@react-three/drei";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

type ModelProps = JSX.IntrinsicElements["group"];

function AssetModel({ url, enhanceMaterials = false, ...props }: ModelProps & { url: string; enhanceMaterials?: boolean }) {
  const { scene } = useGLTF(url) as GLTF;

  useLayoutEffect(() => {
    if (!enhanceMaterials) return;

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];

      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;

        if (material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.map.needsUpdate = true;
        }

        material.color.setScalar(1);
        material.metalness = 0;
        material.roughness = Math.min(material.roughness ?? 0.82, 0.86);
        material.emissive.set("#ffffff");
        material.emissiveIntensity = 0.055;
        material.needsUpdate = true;
      });
    });
  }, [enhanceMaterials, scene]);

  return (
    <group {...props} dispose={null}>
      <Clone object={scene} />
    </group>
  );
}

export function DownloadedRockModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/legendsvr-rocks-303.glb" {...props} />;
}

export function DownloadedBenchModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-bench-694.glb" {...props} />;
}

export function DownloadedGrassModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-grass-1072.glb" {...props} />;
}

export function DownloadedConeModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/cone.glb" {...props} />;
}

export function DownloadedTerrainSandModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/terrain-sand-01.glb" {...props} />;
}

export function DownloadedTerrainGroundRightModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/terrain-ground-right-01.glb" {...props} />;
}

export function DownloadedTerrainGroundGrassModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/terrain-ground-grass-01.glb" {...props} />;
}

export function DownloadedTerrainGroundModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/terrain-ground-01.glb" {...props} />;
}

export function DownloadedGroundPlatformModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/ground-platform-01.glb" {...props} />;
}

export function DownloadedBigBuildingModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-big-building-745.glb" {...props} />;
}

export function DownloadedBuildingModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-building-747.glb" {...props} />;
}

export function DownloadedLargeBuildingModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-large-building-741.glb" {...props} />;
}

export function DownloadedSmallBuildingModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-small-building-742.glb" {...props} />;
}

export function DownloadedMossyRockModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-mossy-rock-1308.glb" {...props} />;
}

export function DownloadedWindmillModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/quaternius_cc0-windmill-1504.glb" {...props} />;
}

export function DownloadedScaffoldingModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/32809140-scaffolding-2637.glb" {...props} />;
}

export function DownloadedParamedicGuideModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/paramedic-guide.glb" {...props} />;
}

export function CustomFirstAidBagModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/custom/first-aid-bag.glb" enhanceMaterials {...props} />;
}

export function CustomAmbulanceModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/custom/ambulance.glb" enhanceMaterials {...props} />;
}

export function CustomPatientModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/custom/patient.glb" enhanceMaterials {...props} />;
}

export function GeneratedFirstAidBagModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/first-aid-bag.glb" {...props} />;
}

export function GeneratedFirstAidBagBakedModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/first-aid-bag-baked.glb" enhanceMaterials {...props} />;
}

export function GeneratedBystandersCoupleModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/bystanders-couple.glb" {...props} />;
}

export function GeneratedBystandersCoupleBakedModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/bystanders-couple-baked.glb" enhanceMaterials {...props} />;
}

export function GeneratedDamagedBlueCarModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/damaged-blue-car.glb" {...props} />;
}

export function GeneratedDamagedBlueCarBakedModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/damaged-blue-car-baked.glb" enhanceMaterials {...props} />;
}

export function GeneratedBarkingDogModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/barking-dog.glb" {...props} />;
}

export function GeneratedBarkingDogBakedModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/barking-dog-baked.glb" enhanceMaterials {...props} />;
}

export function GeneratedLyingPatientModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/lying-patient.glb" {...props} />;
}

export function GeneratedLyingPatientBakedModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/lying-patient-baked.glb" enhanceMaterials {...props} />;
}

export function GeneratedAmbulanceModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/ambulance.glb" {...props} />;
}

export function GeneratedAmbulanceBakedModel(props: ModelProps) {
  return <AssetModel url="/models/emt-scene/triposr/ambulance-baked.glb" enhanceMaterials {...props} />;
}

useGLTF.preload("/models/emt-scene/legendsvr-rocks-303.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-bench-694.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-grass-1072.glb");
useGLTF.preload("/models/emt-scene/cone.glb");
useGLTF.preload("/models/emt-scene/terrain-sand-01.glb");
useGLTF.preload("/models/emt-scene/terrain-ground-right-01.glb");
useGLTF.preload("/models/emt-scene/terrain-ground-grass-01.glb");
useGLTF.preload("/models/emt-scene/terrain-ground-01.glb");
useGLTF.preload("/models/emt-scene/ground-platform-01.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-big-building-745.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-building-747.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-large-building-741.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-small-building-742.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-mossy-rock-1308.glb");
useGLTF.preload("/models/emt-scene/quaternius_cc0-windmill-1504.glb");
useGLTF.preload("/models/emt-scene/32809140-scaffolding-2637.glb");
useGLTF.preload("/models/emt-scene/paramedic-guide.glb");
useGLTF.preload("/models/emt-scene/custom/first-aid-bag.glb");
useGLTF.preload("/models/emt-scene/custom/ambulance.glb");
useGLTF.preload("/models/emt-scene/custom/patient.glb");
useGLTF.preload("/models/emt-scene/triposr/first-aid-bag.glb");
useGLTF.preload("/models/emt-scene/triposr/first-aid-bag-baked.glb");
useGLTF.preload("/models/emt-scene/triposr/bystanders-couple.glb");
useGLTF.preload("/models/emt-scene/triposr/bystanders-couple-baked.glb");
useGLTF.preload("/models/emt-scene/triposr/damaged-blue-car.glb");
useGLTF.preload("/models/emt-scene/triposr/damaged-blue-car-baked.glb");
useGLTF.preload("/models/emt-scene/triposr/barking-dog.glb");
useGLTF.preload("/models/emt-scene/triposr/barking-dog-baked.glb");
useGLTF.preload("/models/emt-scene/triposr/lying-patient.glb");
useGLTF.preload("/models/emt-scene/triposr/lying-patient-baked.glb");
useGLTF.preload("/models/emt-scene/triposr/ambulance.glb");
useGLTF.preload("/models/emt-scene/triposr/ambulance-baked.glb");
