import * as THREE from 'three';

export type Ambulance = {
  group: THREE.Group;
  /** call with elapsed time (seconds) inside your animate loop */
  update: (t: number) => void;
  /** turn siren (lightbar blink + point lights) on/off */
  setSiren: (on: boolean) => void;
  siren: THREE.Group;
};

type Options = {
  scale?: number;
  bodyColor?: number;
  stripeColor?: number;
  windowColor?: number;
  wheelColor?: number;
  emissiveHeadlights?: number;
  emissiveTaillights?: number;
};

export function createAmbulance(opts: Options = {}): Ambulance {
  const {
    scale = 1,
    bodyColor = 0xffffff,
    stripeColor = 0xff4d4d,
    windowColor = 0x9ecae1,
    wheelColor = 0x222222,
    emissiveHeadlights = 0xffffff,
    emissiveTaillights = 0xff3333,
  } = opts;

  const group = new THREE.Group();
  group.scale.setScalar(scale);

  // helpers
  const setShadow = (obj: THREE.Object3D) => {
    obj.traverse((o: any) => {
      const m = o as THREE.Mesh;
      if ((m as any).isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  };

  // === dimensions (meters-ish) ===
  const w = 1.9;       // width
  const h = 1.9;       // height
  const L = 4.2;       // length
  const bodyY = 0.55;  // chassis bottom above ground
  const wheelR = 0.4;
  const wheelW = 0.24;
  const wheelBase = 2.7;
  const track = 1.55;

  // === BODY ===
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6, metalness: 0.1 });

  // lower box (cargo)
  const lower = new THREE.Mesh(
    new THREE.BoxGeometry(w, h * 0.75, L * 0.68),
    bodyMat
  );
  lower.position.set(0, bodyY + (h * 0.75) / 2, -L * 0.05);
  group.add(lower);

  // cab (front)
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.95, h * 0.7, L * 0.32),
    bodyMat
  );
  cab.position.set(0, bodyY + (h * 0.7) / 2, L * 0.28);
  group.add(cab);

  // roof cap
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.92, h * 0.12, L * 0.7),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7 })
  );
  roof.position.set(0, bodyY + h * 0.75 + h * 0.06, -L * 0.05);
  group.add(roof);

  // side stripe
  const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.5 });
  const stripeH = 0.14;
  const stripeLen = L * 0.64;
  const stripeZ = -L * 0.08;
  const stripeY = bodyY + h * 0.32;
  const stripeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, stripeH, stripeLen), stripeMat);
  stripeLeft.position.set(-w / 2 - 0.011, stripeY, stripeZ);
  const stripeRight = stripeLeft.clone();
  stripeRight.position.x = w / 2 + 0.011;
  group.add(stripeLeft, stripeRight);

  // medical cross on doors (two boxes)
  const cross = (side: 'L' | 'R') => {
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.24, 0.07), stripeMat);
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.24), stripeMat);
    const crossG = new THREE.Group();
    crossG.add(g1, g2);
    crossG.position.set(side === 'L' ? -w / 2 - 0.012 : w / 2 + 0.012, bodyY + 0.95, -L * 0.12);
    return crossG;
  };
  group.add(cross('L'), cross('R'));

  // WINDOWS
  const glassMat = new THREE.MeshStandardMaterial({
    color: windowColor,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.75,
  });
  const windshieldDrop = 0.12; // meters to lower

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, h * 0.3, 0.02), glassMat);
  windshield.position.set(0, bodyY + h * 0.6 - windshieldDrop, L * 0.44);
  group.add(windshield);

  const sideWinL = new THREE.Mesh(new THREE.BoxGeometry(0.02, h * 0.28, L * 0.22), glassMat);
  sideWinL.position.set(-w / 2 - 0.011, bodyY + h * 0.58 - windshieldDrop, L * 0.27);
  const sideWinR = sideWinL.clone();
  sideWinR.position.x = w / 2 + 0.011;
  group.add(sideWinL, sideWinR);

  // === WHEELS ===
  const wheelMat = new THREE.MeshStandardMaterial({ color: wheelColor, roughness: 0.9, metalness: 0.2 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 1, roughness: 0.2 });

  const makeWheel = () => {
    const g = new THREE.Group();

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 22), wheelMat);
    tire.rotation.z = Math.PI / 2;
    g.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelR * 0.6, wheelR * 0.6, wheelW * 1.02, 12), rimMat);
    rim.rotation.z = Math.PI / 2;
    g.add(rim);

    setShadow(g);
    return g;
  };


  const wheelFL = makeWheel();
  const wheelFR = makeWheel();
  const wheelRL = makeWheel();
  const wheelRR = makeWheel();

  const wheelDrop = 0.3;

  const axY = bodyY + wheelR * 0.98 - wheelDrop;
  wheelFL.position.set(-track / 2, axY, wheelBase / 2);
  wheelFR.position.set(track / 2, axY, wheelBase / 2);
  wheelRL.position.set(-track / 2, axY, -wheelBase / 2);
  wheelRR.position.set(track / 2, axY, -wheelBase / 2);
  group.add(wheelFL, wheelFR, wheelRL, wheelRR);

  // === LIGHTS ===
  // Headlights
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: emissiveHeadlights,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.0,
  });
  const headL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), headMat);
  const headR = headL.clone();
  headL.rotation.x = Math.PI / 2;
  headR.rotation.x = Math.PI / 2;
  headL.position.set(-w * 0.28, bodyY + 0.55, L * 0.52);
  headR.position.set(w * 0.28, bodyY + 0.55, L * 0.52);
  group.add(headL, headR);

  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    emissive: emissiveTaillights,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.02), tailMat);
  const tailR = tailL.clone();
  tailL.position.set(-w * 0.35, bodyY + 0.7, -L * 0.43);
  tailR.position.set(w * 0.35, bodyY + 0.7, -L * 0.43);
  group.add(tailL, tailR);

  // Lightbar (red/blue halves)
 // --- LIGHTBAR / SIREN (grouped so it's movable) ---
const siren = new THREE.Group();
siren.name = 'siren';

// Place the siren on the roof (local to ambulance body)
siren.position.set(0, bodyY + h * 0.9 + 0.03, L * 0.22);

// Bar housing + lenses
const barBase = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.06, 0.16),
  new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1 })
);

const redMat  = new THREE.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0xff0000, emissiveIntensity: 0 });
const blueMat = new THREE.MeshStandardMaterial({ color: 0x4d7dff, emissive: 0x0044ff, emissiveIntensity: 0 });

const redHalf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.14), redMat);
redHalf.position.set(-0.16, 0.05, 0);

const blueHalf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.14), blueMat);
blueHalf.position.set(0.16, 0.05, 0);

// Point lights FOLLOW the siren
const redPoint  = new THREE.PointLight(0xff0000, 0, 3);
redPoint.position.set(-0.2, 0.05, 0);
const bluePoint = new THREE.PointLight(0x2255ff, 0, 3);
bluePoint.position.set( 0.2, 0.05, 0);

// Build and attach
siren.add(barBase, redHalf, blueHalf, redPoint, bluePoint);
group.add(siren);


  setShadow(group);

  // control state
  let sirenOn = true;

  const setSiren = (on: boolean) => {
    sirenOn = on;
    if (!on) {
      redMat.emissiveIntensity = 0;
      blueMat.emissiveIntensity = 0;
      redPoint.intensity = 0;
      bluePoint.intensity = 0;
    }
  };

  // public update
  const update = (t: number) => {
    // spin wheels slightly if you want motion feel
    const spin = t * 2.0;
    [wheelFL, wheelFR, wheelRL, wheelRR].forEach(w => (w.rotation.x = spin));

    if (sirenOn) {
      const pulse = (x: number) => (Math.sin(x) > 0 ? 1.4 : 0.1);
      redMat.emissiveIntensity = pulse(t * 8.0);
      blueMat.emissiveIntensity = pulse(t * 8.0 + Math.PI);
      redPoint.intensity = redMat.emissiveIntensity * 1.1;
      bluePoint.intensity = blueMat.emissiveIntensity * 1.1;
    }
  };

  // sit the van on the ground: wheels already at y = wheelR ~ bodyY chosen above
  group.position.y = 0;

  return { group, update, setSiren, siren };
}
