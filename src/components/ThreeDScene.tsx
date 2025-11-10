'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createAmbulance } from './Ambulance'; // <-- keep your path

type Limb = {
  group: THREE.Group;
  upper: THREE.Mesh;
  lower: THREE.Mesh;
};

const makeCapsule = (radius: number, length: number, color = 0xd1d5db) => {
  const geo = new THREE.CapsuleGeometry(radius, Math.max(0, length), 8, 16);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const makeLimb = (
  upperLen: number,
  lowerLen: number,
  radius: number,
  color = 0xd1d5db
): Limb => {
  const group = new THREE.Group();

  const upper = makeCapsule(radius, upperLen, color);
  upper.position.y = -upperLen / 2 - radius;
  group.add(upper);

  const elbow = new THREE.Group();
  elbow.position.y = -upperLen - radius * 2;
  group.add(elbow);

  const lower = makeCapsule(radius * 0.9, lowerLen, color);
  lower.position.y = -lowerLen / 2 - radius * 0.9;
  elbow.add(lower);

  return { group, upper, lower };
};

const ThreeMannequin: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 500;

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f8);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(2.6, 1.8, 3.6); // looking toward (0,1.2,0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.update();

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(4, 6, 4);
    key.castShadow = true;
    scene.add(key);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(8, 64),
      new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.9, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ----- AMBULANCE (behind the mannequin) -----
    const ambulance = createAmbulance({ scale: 1 });
    scene.add(ambulance.group);
    // camera looks at origin; negative Z is "back"
    ambulance.group.position.set(-0.8, 0, -3.4);
    ambulance.group.rotation.y = 0; // face toward the center
    ambulance.setSiren(true);
    // --------------------------------------------

    // === Mannequin proportions (meters-ish) ===
    const torsoLen = 0.9;
    const hipWidth = 0.35;
    const shoulderWidth = 0.55;
    const upperArmLen = 0.35;
    const lowerArmLen = 0.32;
    const upperLegLen = 0.45;
    const lowerLegLen = 0.45;
    const limbRadius = 0.07;

    const mannequin = new THREE.Group();
    mannequin.position.y = 1.2; // lift above ground
    scene.add(mannequin);

    // Torso
    const chest = makeCapsule(0.18, torsoLen * 0.55, 0xcbd5e1);
    chest.position.y = torsoLen * 0.65;
    mannequin.add(chest);

    const abdomen = makeCapsule(0.16, torsoLen * 0.35, 0xcbd5e1);
    abdomen.position.y = torsoLen * 0.25;
    mannequin.add(abdomen);

    // Pelvis
    const pelvis = new THREE.Mesh(
      new THREE.BoxGeometry(hipWidth, 0.18, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xbfc7d5, roughness: 0.6 })
    );
    pelvis.position.y = 0.0;
    pelvis.castShadow = true;
    pelvis.receiveShadow = true;
    mannequin.add(pelvis);

    // Head + neck
    const neck = makeCapsule(0.08, 0.08, 0xd1d5db);
    neck.position.y = torsoLen + 0.12;
    mannequin.add(neck);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.4 })
    );
    head.position.y = torsoLen + 0.38;
    head.castShadow = true;
    head.receiveShadow = true;
    mannequin.add(head);

    // Shoulders anchor
    const shoulders = new THREE.Group();
    shoulders.position.set(0, torsoLen + 0.5, 0);
    mannequin.add(shoulders);

    // Arms
    const leftArm = makeLimb(upperArmLen, lowerArmLen, limbRadius);
    leftArm.group.position.set(-shoulderWidth / 2, torsoLen + 0.45, 0);
    leftArm.group.rotation.z = Math.PI / 2.4;
    shoulders.add(leftArm.group);

    const rightArm = makeLimb(upperArmLen, lowerArmLen, limbRadius);
    rightArm.group.position.set(shoulderWidth / 2, torsoLen + 0.45, 0);
    rightArm.group.rotation.z = -Math.PI / 2.4;
    shoulders.add(rightArm.group);

    // Legs
    const leftLeg = makeLimb(upperLegLen, lowerLegLen, limbRadius * 1.05);
    leftLeg.group.position.set(-hipWidth / 2 + 0.05, 0.06, 0);
    mannequin.add(leftLeg.group);

    const rightLeg = makeLimb(upperLegLen, lowerLegLen, limbRadius * 1.05);
    rightLeg.group.position.set(hipWidth / 2 - 0.05, 0.06, 0);
    mannequin.add(rightLeg.group);

    // Pose
    leftArm.group.rotation.x = -0.2;
    rightArm.group.rotation.x = -0.2;
    leftLeg.group.rotation.x = 0.05;
    rightLeg.group.rotation.x = -0.05;
    head.rotation.y = 0.15;

    // Animate
    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // mannequin idle
      const bob = Math.sin(t) * 0.01;
      mannequin.position.y = 1.2 + bob;
      leftArm.group.rotation.z = Math.PI / 2.4 + Math.sin(t * 0.8) * 0.05;
      rightArm.group.rotation.z = -Math.PI / 2.4 - Math.sin(t * 0.8) * 0.05;

      // ambulance updates (wheels + lightbar)
      ambulance.update(t);

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: 800 }} />;
};

export default ThreeMannequin;
