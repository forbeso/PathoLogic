import {expect,test,type Page} from '@playwright/test';
import {careerAssignment} from './sickcity-career-fixture';
import {walkTo,telemetry,transportPatientToHospital} from './sickcity-transport-fixture';
test.use({actionTimeout:15000});
import {SICK_CITY_CALLS} from '../../src/lib/sickCity';

async function care(page:Page,index:number) {
 await page.getByRole('button',{name:/BEGIN ASSESSMENT/}).click();
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

test('three different consecutive calls preserve the shift and award each completion once',async({page},info)=>{
 test.setTimeout(900000);
 await careerAssignment(page,2);
 await page.goto('/sickcity');
 await page.getByRole('button',{name:'ACCEPT CALL · MED-14'}).click();
 await follow(page,[[36,-59],[36,-29],[32,-28]]);
 await care(page,2);
 await transportPatientToHospital(page,info.project.name);
 console.log('Consecutive call 1 completed');
 let earned=SICK_CITY_CALLS[2].steps.length*10+SICK_CITY_CALLS[2].rewardXp;
 for(const [iteration,index] of [3,4].entries()) {
  // Keep the random value inside the next desired dispatch bucket without repeating UUID values.
  await page.evaluate(()=>{const base=Math.random;Math.random=()=>.285+base()*.001;});
  const parked=await telemetry(page);
  await page.getByRole('button',{name:'CLEAR CALL',exact:true}).click();
  await expect(page.getByRole('button',{name:`ACCEPT CALL · ${SICK_CITY_CALLS[index].code}`})).toBeVisible({timeout:10000});
  await expect(page.getByRole('region',{name:/ actions$/})).toHaveCount(0);
  await page.getByRole('button',{name:`ACCEPT CALL · ${SICK_CITY_CALLS[index].code}`}).click();
  await page.getByRole('button',{name:/Park & exit ambulance/}).click();
  const route=index===3 ? [[36,-29],[36,6]] : [[36,-29],[36,0],[0,0],[0,34],[-23,34],[-23,30]];
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
  earned+=SICK_CITY_CALLS[index].steps.length*10+SICK_CITY_CALLS[index].rewardXp;
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pathologix:learner-progress:v1')!).totalXp)).toBe(500+earned);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pathologix:learner-progress:v1')!).totalXp)).toBe(500+earned);
 }
});
