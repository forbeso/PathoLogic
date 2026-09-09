const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
function load(file) {
 const mod = { exports: {} };
 const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
 }).outputText;
 new Function('exports', 'require', 'module', compiled)(mod.exports, name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), mod);
 return mod.exports;
}
const { advanceAmbulance, canPlaceAmbulance, ambulanceExitPosition, isInsideAmbulance, HOSPITAL_AMBULANCE_START, HOSPITAL_MEDIC_START, AMBULANCE_START_YAW } = load('src/lib/sickCityVehicle.ts');
const { cityBlocks, blockBuildings, isStreet, isNeighborhoodBuilding } = load('src/lib/sickCityWorld.ts');
const idle = { forward: false, backward: false, left: false, right: false };
const start = () => ({ position: [...HOSPITAL_AMBULANCE_START], yaw: AMBULANCE_START_YAW, speed: 0 });
function run(pose, input, seconds) { for (let i = 0; i < seconds * 60; i++) pose = advanceAmbulance(pose, { ...idle, ...input }, 1 / 60); return pose; }

test('hospital starts outside vehicle, within boarding range, and on drivable ground', () => {
 const pose = start();
 assert.ok(canPlaceAmbulance(...[pose.position[0], pose.position[2], pose.yaw]));
 assert.ok(!isInsideAmbulance(HOSPITAL_MEDIC_START[0], HOSPITAL_MEDIC_START[2], pose));
 assert.ok(Math.hypot(HOSPITAL_MEDIC_START[0]-pose.position[0],HOSPITAL_MEDIC_START[2]-pose.position[2]) < 5);
});
test('accelerates forward, follows the road, and brakes to a stop', () => {
 const driven = run(start(), { forward: true }, 1);
 assert.ok(driven.position[0] > 29);
 assert.ok(Math.abs(driven.position[2] - HOSPITAL_AMBULANCE_START[2]) < .01);
 assert.ok(driven.speed > 10);
 const parked = run(driven, { brake: true }, 1);
 assert.ok(Math.abs(parked.speed) < .1);
 const exit = ambulanceExitPosition(parked);
 assert.ok(exit && !isInsideAmbulance(exit[0], exit[2], parked));
});
test('reverse works and steering cannot spin a parked vehicle', () => {
 assert.ok(run(start(), { backward: true }, 1).position[0] < 20);
 assert.equal(run(start(), { left: true }, 1).yaw, AMBULANCE_START_YAW);
 const left = run({ position: [0,0,0], yaw:0, speed:3 }, { forward:true,left:true }, .2);
 assert.ok(left.yaw > 0);
 const reverse = run({ position: [0,0,0], yaw:0, speed:-3 }, { backward:true,left:true }, .2);
 assert.ok(reverse.yaw < 0);
});
test('vehicle footprint stays clear of buildings and the end of the garage driveway', () => {
 assert.equal(canPlaceAmbulance(18,-17,0),false);
 const pose = run(start(), { forward:true }, 20);
 assert.ok(pose.position[0] < 66);
 assert.ok(canPlaceAmbulance(pose.position[0],pose.position[2],pose.yaw));
 assert.equal(pose.speed,0);
});
test('long frames are bounded to avoid jumping through obstacles', () => {
 assert.deepEqual(advanceAmbulance(start(),{...idle,forward:true},10),advanceAmbulance(start(),{...idle,forward:true},.05));
});

test('rear garage has an open east exit connecting to the city street', () => {
 for (let x = 22; x <= 36; x += .25) assert.ok(canPlaceAmbulance(x,-62,AMBULANCE_START_YAW), `Blocked garage exit at ${x}`);
 assert.equal(canPlaceAmbulance(12,-62,AMBULANCE_START_YAW),false);
 assert.equal(canPlaceAmbulance(22,-68,AMBULANCE_START_YAW),false);
 assert.equal(canPlaceAmbulance(22,-56,AMBULANCE_START_YAW),false);
});


test('every original street continues through the former boundary in both directions', () => {
 for (const x of [-36, 0, 36]) for (const direction of [-1, 1]) {
  const pose = run({ position: [x,0,0], yaw: direction < 0 ? 0 : Math.PI, speed:0 }, {forward:true}, 75);
  assert.ok(pose.position[2] * direction > 1200, JSON.stringify(pose));
  assert.ok(pose.speed > 16);
 }
 for (const z of [-34, 0, 34]) for (const direction of [-1, 1]) {
  const pose = run({ position: [0,0,z], yaw: -direction * Math.PI / 2, speed:0 }, {forward:true}, 75);
  assert.ok(pose.position[0] * direction > 1200, JSON.stringify(pose));
  assert.ok(pose.speed > 16);
 }
});

test('new neighborhoods connect to the original roads and remain drivable far from downtown', () => {
 for (const road of [-6090,-210,-150,-90,90,150,210,6090]) {
  for (let along = -240; along <= 240; along += .5) {
   assert.ok(canPlaceAmbulance(road,along,0));
   assert.ok(canPlaceAmbulance(along,road,-Math.PI/2));
  }
 }
});

test('a complete circuit around downtown has continuous road clearance', () => {
 for (const [cx,cz,start] of [[84,-84,0],[84,84,Math.PI/2],[-84,84,Math.PI],[-84,-84,Math.PI*1.5]]) {
  for(let i=0;i<=90;i++) {
   const a=start+i*Math.PI/180;
   const x=cx+Math.sin(a)*6, z=cz-Math.cos(a)*6;
   assert.ok(canPlaceAmbulance(x,z,-a-Math.PI/2), `Turn blocked at ${x},${z}`);
  }
 }
 for(let p=-84;p<=84;p+=.25) for(const side of [-90,90]) {
  assert.ok(canPlaceAmbulance(p,side,Math.PI/2));
  assert.ok(canPlaceAmbulance(side,p,0));
 }
});

test('streamed buildings have collision, stay clear of roads, and regenerate consistently', () => {
 const buildings = cityBlocks(0,0,300).flatMap(blockBuildings);
 assert.ok(buildings.length > 100);
 assert.deepEqual(buildings, cityBlocks(0,0,300).flatMap(blockBuildings));
 for(const b of buildings) {
  assert.ok(isNeighborhoodBuilding(b.x,b.z));
  for(const dx of [-b.width/2,0,b.width/2]) for(const dz of [-b.depth/2,0,b.depth/2]) {
   assert.ok(!isStreet(b.x+dx,b.z+dz), `Building overlaps road ${JSON.stringify(b)}`);
  }
 }
 const nearby = cityBlocks(60,0,300).flatMap(blockBuildings);
 for(const b of buildings.filter(b=>Math.abs(b.x)<200&&Math.abs(b.z)<200)) {
  assert.deepEqual(nearby.find(other=>other.x===b.x&&other.z===b.z),b);
 }
});

test('accelerating and steering clears the garage turn into the northbound avenue', () => {
 let pose = { position:[30,0,-62], yaw: -Math.PI/2, speed:0 };
 for(let frame=0; frame<600 && pose.yaw < -.01; frame++) {
  pose=advanceAmbulance(pose,{...idle,forward:true,left:true},1/60);
 }
 assert.ok(Math.abs(pose.yaw)<.03, JSON.stringify(pose));
 const straight=run({...pose,yaw:0},{forward:true},10);
 assert.ok(straight.position[2]<-200, JSON.stringify(straight));
});


const { mapCoordinate, mapMarker, mapHeadingDegrees } = load('src/lib/sickCityMap.ts');
test('map arrow aligns with actual forward motion in cardinal and diagonal directions', () => {
 for (let degrees=0; degrees<360; degrees+=45) {
  const pose={position:[0,0,0],yaw:degrees*Math.PI/180,speed:2};
  const moved=advanceAmbulance(pose,{...idle,forward:true},1/60);
  const screenX=parseFloat(mapCoordinate(moved.position[0],0))-50;
  const screenY=parseFloat(mapCoordinate(moved.position[2],0))-50;
  const length=Math.hypot(screenX,screenY);
  const arrow=mapHeadingDegrees(moved.yaw)*Math.PI/180;
  assert.ok(Math.abs(screenX/length-Math.sin(arrow))<1e-9);
  assert.ok(Math.abs(screenY/length+Math.cos(arrow))<1e-9);
 }
});
test('map follows reverse motion while the arrow retains vehicle facing', () => {
 const initial={position:[0,0,0],yaw:-Math.PI/2,speed:-2};
 const moved=advanceAmbulance(initial,{...idle,backward:true},1/60);
 assert.ok(moved.position[0]<0);
 assert.equal(mapHeadingDegrees(moved.yaw),90);
 assert.ok(parseFloat(mapCoordinate(36,moved.position[0]))>parseFloat(mapCoordinate(36,0)));
});
test('steering left and right rotates the map arrow in the corresponding direction', () => {
 const pose={position:[0,0,0],yaw:0,speed:3};
 assert.ok(mapHeadingDegrees(advanceAmbulance(pose,{...idle,forward:true,left:true},.05).yaw)<0);
 assert.ok(mapHeadingDegrees(advanceAmbulance(pose,{...idle,forward:true,right:true},.05).yaw)>0);
});
test('off-screen markers preserve the destination bearing in every quadrant', () => {
 for(const [dx,dz] of [[400,100],[-400,100],[100,-400],[-100,-400],[1200,1200]]) {
  const marker=mapMarker(22+dx,-62+dz,22,-62);
  const mx=parseFloat(marker.left)-50,mz=parseFloat(marker.top)-50;
  assert.ok(Math.abs(mx/mz-dx/dz)<1e-9);
  assert.equal(Math.max(Math.abs(mx),Math.abs(mz)),47);
 }
 assert.deepEqual(mapMarker(22,-62,22,-62),{left:'50%',top:'50%'});
});
