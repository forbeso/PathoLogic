import {walkingKeys} from './sickcity-navigation';
import {expect,type Page} from '@playwright/test';
export async function telemetry(page:Page) {
 const main=page.locator('main');
 return {x:Number(await main.getAttribute('data-vehicle-x')),z:Number(await main.getAttribute('data-vehicle-z')),yaw:Number(await main.getAttribute('data-vehicle-yaw'))};
}
export async function walkTo(page:Page,x:number,z:number,tolerance=1) {
 for(let i=0;i<400;i++) {
  const current=await page.locator('main').evaluate(element=>({
   facing:Number(element.getAttribute('data-player-facing')),
   x:Number(element.getAttribute('data-player-x')),z:Number(element.getAttribute('data-player-z')),
  }));
  const facing=current.facing,dx=x-current.x,dz=z-current.z;
  if(Math.hypot(dx,dz)<tolerance) return;
  const keys=walkingKeys(dx,dz,facing);
  for(const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(100);
  for(const key of keys) await page.keyboard.up(key);
  // The scene reports at 120ms intervals; wait for that report before steering again.
  await page.waitForTimeout(140);
 }
 const stopped=await page.locator('main').evaluate(element=>({x:element.getAttribute('data-player-x'),z:element.getAttribute('data-player-z'),yaw:element.getAttribute('data-player-facing')}));
 throw new Error(`Could not walk stretcher to ${x},${z}: ${JSON.stringify(stopped)}`);
}
async function driveUntil(page:Page,keys:string[],done:(p:{x:number;z:number;yaw:number})=>boolean) {
 for(const key of keys) await page.keyboard.down(key);
 try {await expect.poll(async()=>done(await telemetry(page)),{timeout:25000,intervals:[35]}).toBe(true);}
 finally {for(const key of keys) await page.keyboard.up(key);}
 await page.keyboard.down(' ');
 try {await expect(page.getByText(/^0 KM\/H/)).toBeVisible({timeout:10000});}
 finally {await page.keyboard.up(' ');}
}
export async function transportPatientToHospital(page:Page,project:string) {
 await expect(page.locator('main')).toHaveAttribute('data-phase','loading');
 await expect(page.getByRole('button',{name:'CLEAR CALL',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText('0 / 5 CALLS');
 const vehicle=await telemetry(page);
 const stagingX=vehicle.x<30?25:36;
 await walkTo(page,36,-29);await walkTo(page,36,-59);await walkTo(page,stagingX,-59,.7);
 await page.getByRole('button',{name:/Retrieve stretcher/}).click();
 await expect(page.locator('main')).toHaveAttribute('data-phase','stretcher');
 await walkTo(page,36,-59);await walkTo(page,36,-29);await walkTo(page,32,-28);
 await page.getByRole('button',{name:/Transfer patient to stretcher/}).click();
 await expect(page.locator('main')).toHaveAttribute('data-phase','transferring');
 await expect(page.getByRole('button',{name:/Securing patient/})).toBeDisabled();
 await page.getByRole('button',{name:'Shift menu',exact:true}).click();
 await page.waitForTimeout(2700);
 await expect(page.locator('main')).toHaveAttribute('data-phase','transferring');
 await page.getByRole('button',{name:/Resume shift/}).click();
 await expect(page.locator('main')).toHaveAttribute('data-phase','carrying');
 await page.waitForTimeout(750); // Let the canvas show the loaded patient before visual review.
 await page.screenshot({path:`tmp/site-audit/patient-stretcher-${project}.png`});
 await walkTo(page,36,-29);await walkTo(page,36,-59);await walkTo(page,stagingX,-59,.7);
 await page.getByRole('button',{name:/Load patient into ambulance/}).click();
 await expect(page.locator('main')).toHaveAttribute('data-phase','boarding');
 await expect(page.getByRole('button',{name:/Loading patient/})).toBeDisabled();
 await page.waitForTimeout(1550);
 await page.screenshot({path:`tmp/site-audit/patient-loading-${project}.png`});
 await expect(page.locator('main')).toHaveAttribute('data-phase','transport');
 await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText('0 / 5 CALLS');
 await page.getByRole('button',{name:/Enter ambulance/}).click();
 // Set up the turn at the east end of the garage driveway.
 const parked=await telemetry(page);
 if(parked.x>33) await driveUntil(page,['s'],p=>p.x<=33);
 else if(parked.x<31.5) await driveUntil(page,['w'],p=>p.x>=31.5);
 await driveUntil(page,['w','d'],p=>p.yaw<=-Math.PI+.06);
 await driveUntil(page,['w'],p=>p.z>=-40.5);
 await driveUntil(page,['w','d'],p=>p.yaw<=-Math.PI*1.5+.06);
 await driveUntil(page,['w'],p=>p.x<=26);
 await expect(page.locator('main')).toHaveAttribute('data-phase','handoff',{timeout:15000});
 await page.getByRole('button',{name:'Shift menu',exact:true}).click();
 await page.waitForTimeout(4000);
 await expect(page.locator('main')).toHaveAttribute('data-phase','handoff');
 await page.getByRole('button',{name:/Resume shift/}).click();
 await page.waitForTimeout(3800);
 await page.screenshot({path:`tmp/site-audit/hospital-handoff-${project}.png`});
 await expect(page.locator('main')).toHaveAttribute('data-phase','complete',{timeout:15000});
 await expect(page.getByText('Patient delivered to SickCity Medical. Hospital handoff complete.')).toBeVisible();
 await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText('1 / 5 CALLS');
}
