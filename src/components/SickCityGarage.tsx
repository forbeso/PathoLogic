import { Html } from "@react-three/drei";

function Block({ position, size, color, glow = false }: {
  position: [number, number, number]; size: [number, number, number]; color: string; glow?: boolean;
}) {
  return <mesh position={position} castShadow={!glow} receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={.75} emissive={glow ? color : "#000000"} emissiveIntensity={glow ? 1.8 : 0} />
  </mesh>;
}

/** Open east-facing vehicle bay behind the hospital, with a clear road exit. */
export default function SickCityGarage() {
  return <group>
    <Block position={[26.25, .05, -62]} size={[28.5, .12, 12]} color="#495762" />
    <Block position={[12, 3, -62]} size={[.5, 6, 12.5]} color="#36505a" />
    {[-68, -56].map(z => <group key={z}>
      <Block position={[22, 3, z]} size={[20.5, 6, .5]} color="#647985" />
      <Block position={[22, 1, z + (z === -68 ? .28 : -.28)]} size={[20, .22, .06]} color="#b6f582" />
      {[14, 20, 26, 31.6].map(x => <Block key={x} position={[x, 3, z]} size={[.24, 6.1, .7]} color="#293c48" />)}
    </group>)}
    <Block position={[22, 6.2, -62]} size={[21, .4, 13]} color="#293c48" />
    <Block position={[32, 5.65, -62]} size={[.6, .9, 12.2]} color="#263f48" />
    {/* Rolled-up door and guide rails leave the full opening clear. */}
    <mesh position={[31.7, 5.75, -62]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.42, .42, 10.8, 16]} /><meshStandardMaterial color="#a7b5ba" metalness={.45} roughness={.4} />
    </mesh>
    {[16, 23, 29].map(x => <Block key={x} position={[x, 5.95, -62]} size={[.24, .12, 7]} color="#d7f2ec" glow />)}
    <pointLight position={[22, 4.7, -62]} intensity={26} color="#e3f7ef" distance={17} decay={2} />
    {[-65, -59].map(z => <Block key={z} position={[22, .13, z]} size={[15, .025, .12]} color="#efce78" />)}
    {[33, 36, 39].map(x => <Block key={x} position={[x, .14, -62]} size={[1.2, .025, .16]} color="#efce78" />)}
    {[-67.3, -56.7].map(z => <group key={z}>
      <Block position={[32, .6, z]} size={[.25, 1.2, .25]} color="#efce78" />
      <Block position={[32, .8, z]} size={[.28, .16, .28]} color="#26333b" />
    </group>)}
    <Block position={[13.3, 1.1, -65.8]} size={[1.1, 2.2, 2.5]} color="#bd6048" />
    <Block position={[13.3, 2.25, -65.8]} size={[1.2, .15, 2.6]} color="#cbd6d7" />
    <Block position={[13.25, 1.2, -58]} size={[1, 2.4, 2]} color="#364755" />
    <Html position={[32.4, 5.6, -62]} center zIndexRange={[15, 3]} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded-md border border-lime-200/30 bg-slate-950/90 px-4 py-2 text-center text-white">
        <p className="text-[9px] font-bold tracking-[.2em] text-lime-200">SICKCITY MEDICAL</p>
        <p className="text-sm font-bold">Ambulance garage · Bay 07</p>
      </div>
    </Html>
    <Html position={[14, 3.7, -62]} center zIndexRange={[15, 3]} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded bg-slate-950/80 px-3 py-2 text-xs font-bold text-lime-200">UNIT 07 · EXIT EAST →</div>
    </Html>
  </group>;
}
