import { Clone, useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";

type ModelProps = JSX.IntrinsicElements["group"];

function AssetModel({ url, ...props }: ModelProps & { url: string }) {
  const { scene } = useGLTF(url) as GLTF;

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
