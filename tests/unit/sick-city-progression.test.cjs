const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
function load(file, mocks = {}) {
  const mod = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', 'module', compiled)(mod.exports, name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(path.resolve('src', name.slice(2) + '.ts'), mocks);
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'), mocks);
    return require(name);
  }, mod);
  return mod.exports;
}
const { SICK_CITY_CALLS } = load('src/lib/sickCity.ts');
const { progressionAwardXp } = load('src/lib/progressionAwards.ts');
const { shuffled } = load('src/lib/shuffle.ts');

test('all SickCity objectives and completions resolve to content-defined rewards', () => {
  for (const call of SICK_CITY_CALLS) {
    for (const step of call.steps) {
      assert.equal(progressionAwardXp(`sickcity:${call.id}:${step.id}:v2`, 'scenario_objective', {scenarioId:call.id, objectiveId:step.id}), 10);
    }
    assert.equal(progressionAwardXp(`sickcity:${call.id}:complete:v2`, 'scenario_complete', {scenarioId:call.id, objectiveId:'complete'}), call.rewardXp);
  }
});
test('unknown content, mismatched metadata, and invented award IDs cannot mint SickCity XP', () => {
  for (const [id, event, metadata] of [
    ['sickcity:fake:complete:v2','scenario_complete',{scenarioId:'fake',objectiveId:'complete'}],
    ['sickcity:park-fall:complete:v2','scenario_complete',{scenarioId:'market-breathing',objectiveId:'complete'}],
    ['sickcity:park-fall:complete:v2:replay','scenario_complete',{scenarioId:'park-fall',objectiveId:'complete'}],
    ['sickcity:park-fall:complete:v2','scenario_objective',{scenarioId:'park-fall',objectiveId:'complete'}],
    ['sickcity:park-fall:scene:v2','toString',{scenarioId:'park-fall',objectiveId:'scene'}],
  ]) assert.equal(progressionAwardXp(id,event,metadata),null);
});
test('existing EMT Scene award format remains compatible', () => {
  assert.equal(progressionAwardXp('emt-scene:anaphylaxis:123:abc:objective:safety','scenario_objective',{}),10);
  assert.equal(progressionAwardXp('emt-scene:anaphylaxis:123:abc:scenario-complete','scenario_complete',{}),40);
});
test('shuffle moves the correct answer across positions without changing source options or identities', () => {
  const source = SICK_CITY_CALLS[0].steps[0].options;
  const original = source.map(o=>o.id);
  const positions = new Set();
  for(const random of [()=>0, (()=>{let i=0;return ()=>i++ ? 0 : 0.99;})(), ()=>0.99]) {
    const result = shuffled(source,random);
    positions.add(result.findIndex(o=>o.correct));
    assert.deepEqual(result.map(o=>o.id).sort(),[...original].sort());
    assert.equal(result.filter(o=>o.correct).length,1);
  }
  assert.equal(positions.size,3);
  assert.deepEqual(source.map(o=>o.id),original);
});
test('authenticated progression endpoint saves the configured SickCity reward, rejects forged awards, and preserves RPC deduplication', async () => {
  const calls=[];
  const handler=load('src/pages/api/progression.ts',{
    '@/lib/server/apiSecurity':{requireApiUser:async()=>({id:'test-user'}),enforceRateLimit:()=>true},
    '@/lib/server/supabaseAdmin':{getSupabaseAdmin:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:[{awarded:calls.length===1,total_xp:80,current_streak:1,longest_streak:1,last_active_date:'2026-09-09'}],error:null};}})},
  }).default;
  const invoke=async(body)=>{const result={};const res={status(code){result.status=code;return this;},json(data){result.data=data;return this;},setHeader(){}};await handler({method:'POST',body},res);return result;};
  const payload={action:'award',awardId:'sickcity:park-fall:complete:v2',eventType:'scenario_complete',metadata:{scenarioId:'park-fall',objectiveId:'complete'},xp:9999};
  const first=await invoke(payload);
  assert.equal(first.status,200);assert.equal(first.data.awarded,true);assert.equal(calls[0].args.p_xp,80);
  assert.equal((await invoke(payload)).data.awarded,false);
  assert.equal((await invoke({...payload,awardId:payload.awardId+':invented'})).status,400);
  assert.equal(calls.length,2);
});

test('SickCity keeps clinical patient profiles while owning its dispatch locations', () => {
  const { CLINICAL_SCENARIOS } = load('src/lib/clinicalScenarios.ts');
  const { DEFAULT_SICK_CITY_CALL_INDEX } = load('src/lib/sickCity.ts');
  const fullCalls = SICK_CITY_CALLS.filter(call => call.clinicalScenarioId);
  assert.equal(fullCalls.length, 5);
  assert.ok(SICK_CITY_CALLS[DEFAULT_SICK_CITY_CALL_INDEX].clinicalScenarioId);
  for (const scenario of CLINICAL_SCENARIOS) {
    const call = fullCalls.find(call => call.clinicalScenarioId === scenario.id);
    assert.ok(call);
    assert.equal(call.title, scenario.title);
    const {getCityLocation}=load('src/lib/sickCityLocations.ts');
    assert.equal(call.location,getCityLocation(call.locationId).name);
    assert.equal(call.district,getCityLocation(call.locationId).district);
    if(scenario.id==='anaphylaxis') assert.doesNotMatch(call.summary,/festival|dog|animal/i);
    assert.equal(call.initialPatientLine, scenario.patient);
    assert.equal(call.steps.length, 0, 'full calls must use the clinical engine, not quick answer steps');
  }
});

const shift = load('src/lib/sickCityShift.ts');
test('career dispatch honors level eligibility, avoids repeats when possible, and always finds a call', () => {
  for (const level of [1,2,3,5,10,15]) for (const random of [0,0.3,0.99,1]) {
    const index=shift.assignCall(level,[],()=>random);
    assert.ok(shift.CAREER_CALLS[index].minimumLevel<=level);
    const next=shift.assignCall(level,[SICK_CITY_CALLS[index].id],()=>random);
    assert.notEqual(next,index);
  }
  assert.ok(shift.assignCall(1,SICK_CITY_CALLS.map(c=>c.id))>=0);
});
test('shift scores use actual decisions and never manufacture unmeasured categories', () => {
  const decisions=[{category:'transport',correct:false},{category:'transport',correct:true},{category:'safety',correct:true}];
  assert.deepEqual(shift.quickScores(decisions),{transport:50,safety:100});
  const summary=shift.summarizeShift([{scores:{transport:50,safety:100},xp:40},{scores:{safety:80,assessment:100},xp:0}]);
  assert.deepEqual(summary.scores,{safety:90,assessment:100,transport:50});
  assert.equal(summary.weakest,'transport');assert.equal(summary.xp,40);
  assert.equal(shift.quickCategory('plan'),'transport');
  assert.equal(shift.quickCategory('reassess'),'reassessment');
});
test('unit status reflects actual care phase without inventing hospital transport', () => {
  assert.equal(shift.unitStatus('starting',50,false),'AVAILABLE');
  assert.equal(shift.unitStatus('dispatch',50,false),'DISPATCHED');
  assert.equal(shift.unitStatus('locate',50,true),'EN ROUTE');
  assert.equal(shift.unitStatus('locate',3,false),'ON SCENE');
  assert.equal(shift.unitStatus('clinical',3,false),'PATIENT CONTACT');
  assert.equal(shift.unitStatus('complete',3,false),'CLEARING');
  assert.equal(shift.unitStatus('shiftComplete',3,false),'AVAILABLE');
});
test('dispatch metadata resolves to real city locations without exposing clinical diagnoses', () => {
  for (const call of shift.CAREER_CALLS) {
    const location=shift.CITY_LOCATIONS.find(place=>place.id===call.locationId);
    assert.ok(location);
    const scenario=SICK_CITY_CALLS.find(item=>item.id===call.id);
    assert.deepEqual(location.position,scenario.position);
    assert.ok(call.objectives.length>0);
    assert.ok(call.performanceCategories.length>0);
    assert.ok(call.priority>=1 && call.priority<=3);
    assert.equal(call.xpReward,scenario.rewardXp);
    if(call.hiddenDiagnosis) assert.ok(!JSON.stringify(call.dispatchReport).includes(call.hiddenDiagnosis));
  }
});

test('care framing targets the visible torso and is independent of medic approach distance', () => {
  const {patientCareTarget,patientCareCamera}=load('src/lib/sickCityCareCamera.ts');
  const crash=SICK_CITY_CALLS.find(call=>call.id==='clinical-car-accident');
  assert.equal(crash.pose,'seated');
  const target=patientCareTarget(crash);
  assert.ok(target[1]>.5 && target[1]<1.2,'seated driver target must match the human-scale torso');
  assert.deepEqual(patientCareCamera(target,[target[0]+2,0,target[2]],.5),patientCareCamera(target,[target[0]+4,0,target[2]],.5));
  const zero=patientCareCamera(target,target,1);
  assert.ok(zero.every(Number.isFinite));
  for(const call of SICK_CITY_CALLS) assert.ok(patientCareTarget(call).every(Number.isFinite));
});

test('SickCity radio selection opens choices without automatically requesting crash resources', () => {
  const {carAccidentScenario,createScenarioState,scenarioReducer}=load('src/lib/emtSceneEngine.ts');
  let state=createScenarioState(carAccidentScenario);
  state=scenarioReducer(carAccidentScenario,state,{type:'RUN_ACTION',objectId:'crash-vehicle',actionId:'inspect-crash-from-distance'});
  const selected=scenarioReducer(carAccidentScenario,state,{type:'SELECT_OBJECT',objectId:'ambulance-radio',chooseAction:true});
  assert.equal(selected.selectedObjectId,'ambulance-radio');
  assert.ok(selected.triggeredEvents.includes('RADIO_SELECTED'));
  assert.ok(!selected.triggeredEvents.includes('FIRE_RESCUE_CALLED'));
  const requested=scenarioReducer(carAccidentScenario,selected,{type:'RUN_ACTION',objectId:'ambulance-radio',actionId:'request-fire-rescue'});
  assert.ok(requested.triggeredEvents.includes('FIRE_RESCUE_CALLED'));
  assert.ok(!requested.triggeredEvents.includes('TRAFFIC_CONTROLLED'),'resources must still secure the scene');
  const legacy=scenarioReducer(carAccidentScenario,state,{type:'SELECT_OBJECT',objectId:'ambulance-radio'});
  assert.ok(legacy.triggeredEvents.includes('FIRE_RESCUE_CALLED'),'standalone lab behavior remains compatible');
});

test('SickCity teen call has no lab animal hazard, and inspection unlocks PPE without rescue', () => {
  const {sickCityTeenBreathingScenario:scenario}=load('src/lib/sickCityClinicalScenarios.ts');
  const engine=load('src/lib/emtSceneEngine.ts');
  assert.doesNotMatch(JSON.stringify([scenario.objectives,scenario.interactiveObjects,scenario.sceneReport]),/dog|animal.control/i);
  let state=engine.createScenarioState(scenario);
  state=engine.scenarioReducer(scenario,state,{type:'RUN_ACTION',objectId:'patient-area',actionId:'inspect-medical-scene'});
  assert.ok(state.completedObjectives.includes('scene-size-up'));
  const bag=scenario.interactiveObjects.find(object=>object.id==='medical-bag');
  assert.equal(engine.getObjectAvailability(bag,state).enabled,true);
  const review=engine.buildScenarioDebrief(state);
  assert.doesNotMatch(JSON.stringify(review),/dog|animal hazard|animal control/i);
  assert.doesNotMatch(state.feedback ?? '',/dog|smoke|vehicle/i);
  assert.equal(engine.getScenarioScoreBreakdown(state).safety,100);
  const {getCityLocation}=load('src/lib/sickCityLocations.ts');
  const {isCityBuilding}=load('src/lib/sickCityWorld.ts');
  const [x,,z]=getCityLocation('park-east').position;
  assert.equal(isCityBuilding(x,z),false);
});

test('care fades only nearby props and restores original shared materials and shadows',()=>{
  const THREE=require('three');
  const {createCareVisibility}=load('src/lib/sickCityCareVisibility.ts');
  const material=new THREE.MeshStandardMaterial({opacity:.48,transparent:true,depthWrite:true});
  const near=new THREE.Group(),far=new THREE.Group();far.position.x=30;
  const a=new THREE.Mesh(new THREE.BoxGeometry(),material),b=new THREE.Mesh(new THREE.BoxGeometry(),material);
  a.castShadow=true;near.add(a);far.add(b);
  const visibility=createCareVisibility();
  visibility.update([near,far],new THREE.Vector3());
  assert.notEqual(a.material,material);assert.equal(b.material,material);
  assert.equal(material.opacity,.48);assert.equal(a.material.opacity,.48*.12);
  assert.equal(a.material.depthWrite,false);assert.equal(a.castShadow,false);
  visibility.update([near,far]);
  assert.equal(a.material,material);assert.equal(a.castShadow,true);assert.equal(a.material.depthWrite,true);
  visibility.update([near],new THREE.Vector3());visibility.restoreAll();assert.equal(a.material,material);
  visibility.update([near],new THREE.Vector3());near.position.x=30;
  visibility.update([near],new THREE.Vector3());assert.equal(a.material,material);
});


test('patient joint aiming respects parent rotation and preserves limb length',()=>{
  const THREE=require('three');
  const {aimPatientBone}=load('src/lib/sickCityPatientRig.ts');
  const root=new THREE.Group();root.rotation.set(.4,.8,-.2);root.scale.setScalar(.01);
  const upper=new THREE.Bone();upper.name='mixamorig12RightArm';
  const lower=new THREE.Bone();lower.name='mixamorig12RightForeArm';lower.position.set(0,40,0);
  root.add(upper);upper.add(lower);root.updateMatrixWorld(true);
  const desired=new THREE.Vector3(.1,-1,.3).normalize();
  aimPatientBone(root,'RightArm','RightForeArm',desired);
  const actual=lower.getWorldPosition(new THREE.Vector3()).sub(upper.getWorldPosition(new THREE.Vector3()));
  assert.ok(Math.abs(actual.length()-.4)<1e-6);
  assert.ok(actual.normalize().distanceTo(desired)<1e-6);
});


test('hospital handoff requires a loaded transport driven to the bay and stopped',()=>{
 const {readyForHospitalHandoff,HOSPITAL_RECEIVING_BAY,transportDestination}=load('src/lib/sickCityTransport.ts');
 const pose={position:HOSPITAL_RECEIVING_BAY,yaw:0,speed:0};
 assert.equal(readyForHospitalHandoff(pose,true),true);
 assert.equal(readyForHospitalHandoff(pose,false),false);
 assert.equal(readyForHospitalHandoff({...pose,speed:2},true),false);
 assert.equal(readyForHospitalHandoff({...pose,position:[22,0,-62]},true),false);
 assert.deepEqual(transportDestination('transport',[30,0,-28],[22,0,-62]),HOSPITAL_RECEIVING_BAY);
 assert.deepEqual(transportDestination('stretcher',[30,0,-28],[22,0,-62]),[30,0,-28]);
 assert.deepEqual(transportDestination('carrying',[30,0,-28],[22,0,-62]),[22,0,-62]);
});


test('hospital unloading starts inside the ambulance, clears the rear, and reaches receiving',()=>{
 const {hospitalStretcherPose,HOSPITAL_RECEIVING_ENTRANCE}=load('src/lib/sickCityTransport.ts');
 for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]) {
  const pose={position:[22,0,-34],yaw,speed:0};
  const start=hospitalStretcherPose(pose,0);
  assert.ok(Math.abs(Math.hypot(start.position[0]-22,start.position[2]+34)-1)<1e-8);
  const rear=hospitalStretcherPose(pose,.4);
  assert.ok(Math.abs(Math.hypot(rear.position[0]-22,rear.position[2]+34)-5)<1e-8);
  assert.deepEqual(hospitalStretcherPose(pose,1).position,HOSPITAL_RECEIVING_ENTRANCE);
  for(const boundary of [.12,.4,.55,.82]) {
   const a=hospitalStretcherPose(pose,boundary-1e-6).position;
   const b=hospitalStretcherPose(pose,boundary+1e-6).position;
   assert.ok(Math.hypot(...a.map((value,index)=>value-b[index]))<.001);
  }
 }
});

test('a blocked ambulance turn preserves safe travel out of the garage',()=>{
 const {advanceAmbulance,canPlaceAmbulance}=load('src/lib/sickCityVehicle.ts');
 const pose={position:[30.25,0,-60.25],yaw:-2.7,speed:3};
 const next=advanceAmbulance(pose,{forward:true,backward:false,left:false,right:true},.05);
 assert.equal(next.yaw,pose.yaw);
 assert.ok(next.speed>0);
 assert.notDeepEqual(next.position,pose.position);
 assert.ok(canPlaceAmbulance(next.position[0],next.position[2],next.yaw));
});

test('ambulance recovery never permits driving through the garage walls',()=>{
 const {advanceAmbulance,canPlaceAmbulance}=load('src/lib/sickCityVehicle.ts');
 for(const right of [false,true]) {
  let pose={position:[22,0,-62],yaw:Math.PI/2,speed:0};
  for(let frame=0;frame<600;frame++) {
   pose=advanceAmbulance(pose,{forward:true,backward:false,left:false,right},1/60);
   assert.ok(canPlaceAmbulance(pose.position[0],pose.position[2],pose.yaw));
  }
 }
});


test('hospital receiver stays grounded and clear of the ambulance while unloading',()=>{
 const {hospitalReceiverOffset,hospitalStretcherPose}=load('src/lib/sickCityTransport.ts');
 const {isInsideAmbulance}=load('src/lib/sickCityVehicle.ts');
 for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]) {
  const pose={position:[22,0,-34],yaw,speed:0};
  for(let step=0;step<=100;step++) {
   const progress=step/100;
   const cot=hospitalStretcherPose(pose,progress),offset=hospitalReceiverOffset(pose,progress);
   assert.ok(Math.abs(cot.position[1]+offset[1])<1e-9);
   if(progress<.4) {
    const x=cot.position[0]+Math.cos(cot.yaw)*offset[0]+Math.sin(cot.yaw)*offset[2];
    const z=cot.position[2]-Math.sin(cot.yaw)*offset[0]+Math.cos(cot.yaw)*offset[2];
    assert.equal(isInsideAmbulance(x,z,pose),false);
   }
  }
 }
});

test('hand IK reaches rotated and scaled grips without stretching either arm segment',()=>{
 const THREE=require('three');
 const {reachPatientHand}=load('src/lib/sickCityPatientRig.ts');
 for(const scale of [1,.01]) {
  const root=new THREE.Group();root.rotation.set(.3,.8,-.2);root.scale.setScalar(scale);
  const arm=new THREE.Bone();arm.name='rigRightArm';
  const elbow=new THREE.Bone();elbow.name='rigRightForeArm';elbow.position.y=.4/scale;
  const hand=new THREE.Bone();hand.name='rigRightHand';hand.position.y=.35/scale;
  root.add(arm);arm.add(elbow);elbow.add(hand);root.updateMatrixWorld(true);
  for(const target of [new THREE.Vector3(.3,.25,.2),new THREE.Vector3(4,2,1)]) {
   reachPatientHand(root,'Right',target,new THREE.Vector3(0,-1,0));
   const a=arm.getWorldPosition(new THREE.Vector3()),b=elbow.getWorldPosition(new THREE.Vector3()),c=hand.getWorldPosition(new THREE.Vector3());
   assert.ok(Math.abs(a.distanceTo(b)-.4)<1e-6);
   assert.ok(Math.abs(b.distanceTo(c)-.35)<1e-6);
   if(target.length()<.75) assert.ok(c.distanceTo(target)<1e-6);
   else assert.ok(c.distanceTo(a)<=.75);
  }
 }
});


test('walking helper selects the nearest keyboard direction across camera headings',()=>{
 const {walkingKeys}=load('tests/e2e/sickcity-navigation.ts');
 assert.deepEqual(walkingKeys(36-27.8894,-59+40.2879,-1.15371),['d']);
 assert.deepEqual(walkingKeys(0,0,1),[]);
 for(let yaw=-Math.PI;yaw<Math.PI;yaw+=.17) for(let angle=-Math.PI;angle<Math.PI;angle+=.13) {
  const dx=Math.cos(angle),dz=Math.sin(angle),keys=walkingKeys(dx,dz,yaw);
  const f=Number(keys.includes('w'))-Number(keys.includes('s'));
  const r=Number(keys.includes('d'))-Number(keys.includes('a'));
  const x=f*Math.sin(yaw)+r*Math.cos(yaw),z=-f*Math.cos(yaw)+r*Math.sin(yaw);
  const agreement=(x*dx+z*dz)/Math.hypot(x,z);
  assert.ok(agreement>=Math.cos(Math.PI/8)-1e-8);
 }
});
