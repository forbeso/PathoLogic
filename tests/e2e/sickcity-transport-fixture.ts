import {expect,type Page} from '@playwright/test';
async function telemetry(page:Page) {
 const main=page.locator('main');
 return {x:Number(await main.getAttribute('data-vehicle-x')),z:Number(await main.getAttribute('data-vehicle-z')),yaw:Number(await main.getAttribute('data-vehicle-yaw'))};
}
async function walkTo(page:Page,x:number,z:number,tolerance=1) {
 const facing=Number(await page.locator('main').getAttribute('data-player-facing'));
 for(let i=0;i<400;i++) {
  const marker=page.locator('[data-world-x]').first();
  const dx=x-Number(await marker.getAttribute('data-world-x')),dz=z-Number(await marker.getAttribute('data-world-z'));
  if(Math.hypot(dx,dz)<tolerance) return;
  const forward=dx*Math.sin(facing)-dz*Math.cos(facing),right=dx*Math.cos(facing)+dz*Math.sin(facing);
  const keys=[...(Math.abs(forward)>.35?[forward>0?'w':'s']:[]),...(Math.abs(right)>.35?[right>0?'d':'a']:[])];
  for(const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(100);
  for(const key of keys) await page.keyboard.up(key);
 }
 throw new Error(`Could not walk stretcher to ${x},${z}`);
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
 await expect(page.locator('main')).toHaveAttribute('data-phase','carrying');
 await page.waitForTimeout(750); // Let the canvas show the loaded patient before visual review.
 await page.screenshot({path:`tmp/site-audit/patient-stretcher-${project}.png`});
 await walkTo(page,36,-29);await walkTo(page,36,-59);await walkTo(page,stagingX,-59,.7);
 await page.getByRole('button',{name:/Load patient into ambulance/}).click();
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
 await expect(page.locator('main')).toHaveAttribute('data-phase','complete',{timeout:15000});
 await expect(page.getByText('Patient delivered to SickCity Medical. Hospital handoff complete.')).toBeVisible();
 await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText('1 / 5 CALLS');
}
