import {expect,test,type Page} from '@playwright/test';
import {careerAssignment} from './sickcity-career-fixture';
import {walkTo,telemetry,transportPatientToHospital} from './sickcity-transport-fixture';
test.use({actionTimeout:15000});
import {SICK_CITY_CALLS} from '../../src/lib/sickCity';

async function care(page:Page,index:number) {
 await page.getByRole('button',{name:/BEGIN ASSESSMENT/}).click();
 if(index===7) {
  const action=async(name:string,id:string)=>{
   const choice=page.getByTestId(`scene-action-${id}`);
   if(!await choice.isVisible()) await page.getByRole('button',{name:`Interact with ${name}`,exact:true}).click();
   await choice.click();
  };
  await expect(page.getByTestId('sickcity-patient-care')).toBeVisible();
  await action('Patient Area','inspect-medical-scene');
  await action('Medical Bag','open-medical-bag');
  await page.getByTestId('scene-action-equip-gloves').click();
  await action('Approach Patient','approach-patient');
  await action('Patient','general-impression');
  await page.getByTestId('scene-action-assess-responsiveness').click();
  await action('Airway','scenario-airway-action');
  await action('Chest / Breathing','scenario-breathing-action');
  await action('Circulation','scenario-circulation-action');
  for(const name of ['BP Cuff','Pulse Ox']) await page.getByRole('button',{name:`Interact with ${name}`,exact:true}).click();
  await expect(page.getByLabel('Patient equipment readings')).toBeVisible();
  await action('Working Impression','select-correct-impression');
  await action('Medication Decision','give-scenario-medication');
  await action('Transport Decision','prompt-transport');
  await action('Focused History','obtain-focused-history');
  await action('Focused Exam','perform-focused-exam');
  await action('Reassess Patient','repeat-primary-and-vitals');
  await expect(page.locator('main')).toHaveAttribute('data-phase','loading');
  await expect(page.getByLabel('Patient equipment readings')).toHaveCount(0);
  return;
 }

 const call=SICK_CITY_CALLS[index];
 for(const [i,step] of call.steps.entries()) {
  await page.getByTestId(`world-care-${step.id}`).click();
  const menu=page.getByRole('region',{name:/ actions$/});
  await expect(menu.getByRole('button',{name:'Continue assessment',exact:true})).toHaveCount(0);
  await menu.getByRole('button').filter({hasText:step.options.find(option=>option.correct)!.label}).click();
  if(i<call.steps.length-1) await menu.getByRole('button',{name:'Continue assessment',exact:true}).click();
 }
 await expect(page.locator('main')).toHaveAttribute('data-phase','loading');
}
async function follow(page:Page,points:number[][]) {for(const [x,z] of points) await walkTo(page,x,z,.6);}

test('five mixed calls complete a shift and reset safely for the next shift',async({page},info)=>{
 test.setTimeout(1200000);
 await careerAssignment(page,2);
 await page.goto('/sickcity');
 const canvas=await page.locator('canvas').elementHandle();
 await page.getByRole('button',{name:'ACCEPT CALL · MED-14'}).click();
 await follow(page,[[36,-59],[36,-29],[32,-28]]);
 await care(page,2);
 await transportPatientToHospital(page,info.project.name);
 console.log('Consecutive call 1 completed');
 let earned=SICK_CITY_CALLS[2].steps.length*10+SICK_CITY_CALLS[2].rewardXp;
 for(const [iteration,index] of [3,7,0,1].entries()) {
  // Keep the random value inside the next desired dispatch bucket without repeating UUID values.
  const bucket=index===3?.285:index===7?.65:.02;
  await page.evaluate(bucket=>{
   const base=(window as Window & {sickCityTestRandom?:()=>number}).sickCityTestRandom!;
   Math.random=()=>bucket+base()*.01;
  },bucket);
  const parked=await telemetry(page);
  await page.getByRole('button',{name:'CLEAR CALL',exact:true}).click();
  await expect(page.getByRole('button',{name:`ACCEPT CALL · ${SICK_CITY_CALLS[index].code}`})).toBeVisible({timeout:10000});
  await expect(page.getByRole('region',{name:/ actions$/})).toHaveCount(0);
  await expect(page.getByLabel('Patient equipment readings')).toHaveCount(0);
  await page.getByRole('button',{name:`ACCEPT CALL · ${SICK_CITY_CALLS[index].code}`}).click();
  await page.getByRole('button',{name:/Park & exit ambulance/}).click();
  const routes:Record<number,number[][]>={
   3:[[36,-29],[36,6]],7:[[36,-29],[32,-28]],
   0:[[36,-29],[36,0],[53,0],[53,8.5]],
   1:[[36,-29],[36,0],[0,0],[-29,0],[-29,-4]],
  };
  const route=routes[index];
  const exitZ=Number(await page.locator('main').getAttribute('data-player-z'));
  await follow(page,[[parked.x+5,exitZ],[parked.x+5,-29],...route]);
  await care(page,index);
  const back=[...route].reverse();
  await follow(page,[...back,[parked.x,-29],[parked.x,parked.z+2.7]]);
  await page.getByRole('button',{name:/Retrieve stretcher/}).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase','stretcher');
  await follow(page,[[parked.x,-29],...route]);
  await page.getByRole('button',{name:/Transfer patient to stretcher/}).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase','carrying');
  await follow(page,[...back,[parked.x,-29],[parked.x,parked.z+2.7]]);
  await page.getByRole('button',{name:/Load patient into ambulance/}).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase','transport');
  await page.getByRole('button',{name:/Enter ambulance/}).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase','handoff');
  await expect(page.locator('main')).toHaveAttribute('data-phase','complete',{timeout:15000});
  await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText(`${iteration+2} / 5 CALLS`);
  console.log(`Consecutive call ${iteration+2} completed`);
  earned+=index===7?190:SICK_CITY_CALLS[index].steps.length*10+SICK_CITY_CALLS[index].rewardXp;
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pathologix:learner-progress:v1')!).totalXp)).toBe(500+earned);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pathologix:learner-progress:v1')!).totalXp)).toBe(500+earned);
 }
 await page.getByRole('button',{name:'CLEAR CALL & REVIEW SHIFT',exact:true}).click();
 await expect(page.locator('main')).toHaveAttribute('data-phase','shiftComplete');
 const review=page.getByRole('region',{name:'Shift review'});
 await expect(review).toContainText('5PATIENTS TREATED');
 await expect(review.getByLabel(`+${earned} XP`,{exact:true})).toBeVisible();
 await page.waitForTimeout(1600);
 await expect(page.getByRole('button',{name:/ACCEPT CALL/})).toHaveCount(0);
 await page.screenshot({path:`tmp/site-audit/full-shift-${info.project.name}.png`});
 await page.getByRole('button',{name:'START NEXT SHIFT →',exact:true}).click();
 await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText('SHIFT 02 · 0 / 5 CALLS');
 await expect(page.getByRole('button',{name:/ACCEPT CALL/})).toBeVisible();
 expect(await telemetry(page)).toMatchObject({x:22,z:-62});
 await expect(page.locator('main')).toHaveAttribute('data-player-x','19');
 await expect(page.locator('main')).toHaveAttribute('data-player-z','-59');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pathologix:learner-progress:v1')!).totalXp)).toBe(500+earned);
 expect(await canvas!.evaluate(element=>element.isConnected)).toBe(true);
 await page.getByRole('button',{name:/ACCEPT CALL/}).click();
 await expect(page.getByRole('button',{name:/Enter ambulance/})).toBeVisible();
 await expect(page.getByRole('region',{name:'Shift review'})).toHaveCount(0);
 console.log('Five-call shift and next-shift reset verified');

});
