import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { blockBuildings, cityBlocks, STREAM_RADIUS, STREAM_STEP, streetCoordinates, streetWidth } from "@/lib/sickCityWorld";

type Box = { position: [number, number, number]; size: [number, number, number]; color?: string };

// One draw call per material, even as hundreds of surrounding lots are streamed.
function Boxes({ items, color, emissive = false, shadow = false }: { items: Box[]; color: string; emissive?: boolean; shadow?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new THREE.Object3D();
    const tint = new THREE.Color();
    items.forEach((item, index) => {
      transform.position.set(...item.position);
      transform.scale.set(...item.size);
      transform.updateMatrix();
      mesh.current!.setMatrixAt(index, transform.matrix);
      mesh.current!.setColorAt(index, tint.set(item.color ?? color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [items, color]);
  return <instancedMesh key={items.length} ref={mesh} args={[undefined, undefined, items.length]} receiveShadow={!emissive} castShadow={shadow}>
    <boxGeometry />
    <meshStandardMaterial color="white" roughness={emissive ? .4 : .85}
      emissive={emissive ? "#ffbc72" : "black"} emissiveIntensity={emissive ? .45 : 0} />
  </instancedMesh>;
}

export default function SickCityStreets() {
  const [chunk, setChunk] = useState<[number, number]>([0, 0]);
  const chunkRef = useRef<[number, number]>([0, 0]);
  useFrame(({ camera }) => {
    const x = Math.round(camera.position.x / STREAM_STEP) * STREAM_STEP;
    const z = Math.round(camera.position.z / STREAM_STEP) * STREAM_STEP;
    if (x !== chunkRef.current[0] || z !== chunkRef.current[1]) {
      chunkRef.current = [x, z];
      setChunk([x, z]);
    }
  });
  const [centerX, centerZ] = chunk;
  const batches = useMemo(() => {
    const roads: Box[] = [], markings: Box[] = [], walks: Box[] = [];
    const walls: Box[] = [], trim: Box[] = [], glass: Box[] = [], lit: Box[] = [], details: Box[] = [];
    const xs = streetCoordinates("x", centerX - STREAM_RADIUS, centerX + STREAM_RADIUS);
    const zs = streetCoordinates("z", centerZ - STREAM_RADIUS, centerZ + STREAM_RADIUS);
    const length = STREAM_RADIUS * 2 + 120;
    for (const x of xs) roads.push({ position: [x, .02, centerZ], size: [streetWidth(x), .12, length] });
    for (const z of zs) roads.push({ position: [centerX, .022, z], size: [length, .12, streetWidth(z)] });
    for (const x of xs) for (let z = Math.floor((centerZ - STREAM_RADIUS) / 6) * 6; z < centerZ + STREAM_RADIUS; z += 6) {
      if (zs.some(cross => Math.abs(z - cross) < streetWidth(cross) / 2 + 2)) continue;
      markings.push({ position: [x, .092, z], size: [.14, .02, 2.8] });
    }
    for (const z of zs) for (let x = Math.floor((centerX - STREAM_RADIUS) / 6) * 6; x < centerX + STREAM_RADIUS; x += 6) {
      if (xs.some(cross => Math.abs(x - cross) < streetWidth(cross) / 2 + 2)) continue;
      markings.push({ position: [x, .094, z], size: [2.8, .02, .14] });
    }
    for (const block of cityBlocks(centerX, centerZ, STREAM_RADIUS)) {
      const left = block.left + streetWidth(block.left) / 2, right = block.right - streetWidth(block.right) / 2;
      const north = block.north + streetWidth(block.north) / 2, south = block.south - streetWidth(block.south) / 2;
      // Interrupted curbs leave every intersection and the garage driveway open.
      for (const z of [north + .9, south - .9]) walks.push({ position: [(left + right) / 2, .08, z], size: [right - left, .16, 1.8] });
      for (const x of [left + .9, right - .9]) {
        if (Math.abs(x - 30.6) < .1 && block.north === -90) {
          walks.push({ position: [x, .08, (north - 67.5) / 2], size: [1.8, .16, -67.5 - north] });
          walks.push({ position: [x, .08, (-56.5 + south) / 2], size: [1.8, .16, south + 56.5] });
        } else walks.push({ position: [x, .08, (north + south) / 2], size: [1.8, .16, south - north] });
      }
      const buildings = blockBuildings(block);
      if (buildings.length) {
        for (const [x,z] of [[left + .9, north + 10], [right - .9, south - 10]]) {
          trim.push({ position: [x, 2.9, z], size: [.16, 5.8, .16] });
          trim.push({ position: [x, 5.7, z - .6], size: [.16, .16, 1.3] });
          lit.push({ position: [x, 5.6, z - 1.15], size: [.5, .13, .7] });
        }
      }
      for (const building of buildings) {
        const { x, z, width, depth, height, style } = building;
        const palette = ["#9b8073", "#c3b29a", "#768b91", "#ad927e", "#889884"];
        walls.push({ position: [x, height / 2, z], size: [width, height, depth], color: palette[style] });
        trim.push({ position: [x, height + .18, z], size: [width + .5, .36, depth + .5] });
        trim.push({ position: [x, .3, z], size: [width + .3, .6, depth + .3] });
        details.push({ position: [x - 2, height + .65, z + 1], size: [2.3, .9, 1.8], color: "#66717c" });
        // Doors, canopies and windows on all four sides: no unfinished skyline backs.
        for (const face of [-1, 1]) {
          glass.push({ position: [x, 1.35, z + face * (depth / 2 + .04)], size: [1.6, 2.7, .1] });
          details.push({ position: [x, 3, z + face * (depth / 2 + .65)], size: [4.5, .2, 1.5], color: style % 2 ? "#426b69" : "#785448" });
          glass.push({ position: [x + face * (width / 2 + .04), 1.35, z], size: [.1, 2.7, 1.6] });
          for (let y = 4.5; y < height - 1; y += 3) for (const column of [-1, 0, 1]) {
            const windows = (Math.round(y) + column + style) % 3 ? lit : glass;
            windows.push({ position: [x + column * 2.7, y, z + face * (depth / 2 + .06)], size: [1.5, 1.6, .12] });
            windows.push({ position: [x + face * (width / 2 + .06), y, z + column * 2.7], size: [.12, 1.6, 1.5] });
          }
        }
      }
    }
    return { roads, markings, walks, walls, trim, glass, lit, details };
  }, [centerX, centerZ]);

  return <group>
    <mesh position={[centerX, -.17, centerZ]} receiveShadow>
      <boxGeometry args={[1200, .3, 1200]} /><meshStandardMaterial color="#526c58" roughness={1} />
    </mesh>
    <Boxes items={batches.roads} color="#283443" />
    <Boxes items={batches.markings} color="#edc56c" />
    <Boxes items={batches.walks} color="#aab0af" />
    <Boxes items={batches.walls} color="#9b8073" shadow />
    <Boxes items={batches.trim} color="#46515b" />
    <Boxes items={batches.glass} color="#365260" />
    <Boxes items={batches.lit} color="#e2bc84" emissive />
    <Boxes items={batches.details} color="#66717c" />
  </group>;
}
