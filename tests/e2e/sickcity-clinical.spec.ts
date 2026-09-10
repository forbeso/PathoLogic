import { expect, test, type Page } from "@playwright/test";

async function position(page: Page) {
  const marker = page.locator('[data-world-x]').first();
  return { x: Number(await marker.getAttribute('data-world-x')), z: Number(await marker.getAttribute('data-world-z')) };
}
async function travel(page: Page, key: string, done: (p: {x:number;z:number}) => boolean) {
  await page.keyboard.down(key);
  try { await expect.poll(async () => done(await position(page)), { timeout: 60000, intervals: [100] }).toBe(true); }
  finally { await page.keyboard.up(key); }
}
async function action(page: Page, name: string, id: string) {
  const choice = page.getByTestId(`scene-action-${id}`);
  if (!(await choice.isVisible())) {
    await page.getByRole('button',{name:`Interact with ${name}`,exact:true}).click();
  }
  await choice.click();
}

test('full clinical call preserves the city assignment through care and scored debrief', async ({ page }, testInfo) => {
  test.setTimeout(480000);
  await page.setViewportSize(testInfo.project.name.startsWith('mobile') ? {width:393,height:851} : {width:1280,height:800});
  await page.goto('/sickcity');
  await page.getByRole('button',{name:'TRAINING MODE',exact:true}).click();
  await page.getByLabel('AVAILABLE CALLS', { exact: true }).selectOption('7');
  await page.getByRole('button', {name:'ACCEPT CALL · CLIN-03',exact:true}).click();
  await expect(page.getByText('Ambulance garage · Bay 07',{exact:true})).toBeVisible({timeout:40000});
  await page.getByRole('button',{name:/Enter ambulance/}).click();
  await travel(page,'w',p=>p.x>=34);
  await page.keyboard.down(' ');
  await expect(page.getByText(/^0 KM\/H/)).toBeVisible({timeout:15000});
  await page.keyboard.up(' ');
  await page.getByRole('button',{name:/Park & exit ambulance/}).click();
  // Exiting faces north: D moves east, S moves south toward the plaza.
  let p=await position(page);
  if(p.x<34) await travel(page,'d',p=>p.x>=34);
  await travel(page,'s',p=>p.z>=-29);
  p=await position(page);
  if(p.x>33) await travel(page,'a',p=>p.x<=33);
  const cityCanvas = await page.locator('canvas').elementHandle();
  await page.getByRole('button',{name:/BEGIN ASSESSMENT/}).click();
  await expect(page.getByTestId('sickcity-patient-care')).toBeVisible();
  await expect(page.getByTestId('sickcity-clinical-hud')).toBeVisible();
  await expect(page.getByTestId('mobile-next-scene-object')).toHaveCount(0);
  await expect(page.getByTestId('desktop-bottom-hud')).toHaveCount(0);
  await expect(page.getByTestId('scenario-progress-panel')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(await cityCanvas!.evaluate(canvas => canvas.isConnected)).toBe(true);
  await expect(page.locator('a[href="/emtscene"]')).toHaveCount(0);
  await page.waitForTimeout(700); // Let the patient-contact camera settle for visual review.
  await page.screenshot({path:`tmp/site-audit/sickcity-in-world-care-${testInfo.project.name}.png`});
  await expect(page.getByRole('button',{name:'Leave patient care',exact:true})).toBeVisible();
  await expect(page).toHaveURL(/\/sickcity$/);
  await expect(page.getByRole('heading',{name:'Preparing EMT Scene'})).toBeHidden({timeout:120000});
  await expect(page.locator('main')).toHaveCount(1);

  await action(page,'Patient Area','inspect-medical-scene');
  await action(page,'Medical Bag','open-medical-bag');
  await page.getByTestId('scene-action-equip-gloves').click();
  await action(page,'Approach Patient','approach-patient');
  await action(page,'Patient','general-impression');
  await page.getByTestId('scene-action-assess-responsiveness').click();
  await action(page,'Airway','scenario-airway-action');
  await action(page,'Chest / Breathing','scenario-breathing-action');
  await action(page,'Circulation','scenario-circulation-action');
  // The equipment objectives open the same mobile gear panel used by the skills lab.
  for(const id of ['bp','pulseox']) {
    await page.getByRole('button',{name:id==='bp'?'BP Cuff':'Pulse Ox',exact:true}).filter({visible:true}).first().click();
  }
  await action(page,'Working Impression','select-correct-impression');
  await action(page,'Medication Decision','give-scenario-medication');
  await action(page,'Transport Decision','prompt-transport');
  await action(page,'Focused History','obtain-focused-history');
  await action(page,'Focused Exam','perform-focused-exam');
  await action(page,'Reassess Patient','repeat-primary-and-vitals');
  await page.getByRole('button',{name:'Return to Unit 07 with debrief',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Clinical care complete',exact:true})).toBeVisible();
  await expect(page.getByText('CLINICAL CALL XP',{exact:true})).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('main')).toHaveCount(1);
  expect(await cityCanvas!.evaluate(canvas => canvas.isConnected)).toBe(true);
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
  await expect(page.getByLabel('+190 XP',{exact:true})).toHaveText('+190');
  await page.screenshot({path:'tmp/site-audit/sickcity-clinical-debrief.png'});
});

test('crash care uses the same in-city choices through scene safety and driver assessment', async ({page}, info) => {
  test.setTimeout(180000);
  await page.goto('/sickcity');
  await page.getByRole('button',{name:'TRAINING MODE',exact:true}).click();
  await page.getByLabel('AVAILABLE CALLS').selectOption('6');
  await page.getByRole('button',{name:'ACCEPT CALL · CLIN-02'}).click();
  // Walk along the open north-south street from the garage to the crash call.
  await travel(page,'w',p=>p.x>=36);
  await travel(page,'d',p=>p.z>=2.5);
  const canvas=await page.locator('canvas').elementHandle();
  await page.getByRole('button',{name:'BEGIN ASSESSMENT'}).click();
  await action(page,'Smoking Crash Vehicle','inspect-crash-from-distance');
  await action(page,'Ambulance Radio','request-fire-rescue');
  await action(page,'Medical Bag','open-medical-bag');
  await page.getByTestId('scene-action-equip-gloves').click();
  await action(page,'Approach Driver','approach-driver');
  const patientControl=page.getByRole('button',{name:'Interact with Trapped Driver',exact:true});
  await patientControl.click();
  const choices=page.getByTestId('sickcity-care-choices');
  await expect(choices).toBeVisible();
  await expect(choices.getByRole('button').first().locator('span').first()).toHaveText('A');
  const initialOrder=await choices.getByRole('button').allTextContents();
  await page.getByRole('button',{name:'Close action choices for Trapped Driver'}).click();
  await patientControl.click();
  expect(await choices.getByRole('button').allTextContents()).toEqual(initialOrder);
  await page.waitForTimeout(700);
  await page.screenshot({path:`tmp/site-audit/crash-care-${info.project.name}.png`});
  await page.getByTestId('scene-action-observe-trauma-impression').click();
  await page.getByTestId('scene-action-verbal-responsiveness-trauma').click();
  await action(page,'Airway','assess-airway-with-stabilization');
  await action(page,'Chest / Breathing','assess-trauma-breathing');
  await action(page,'Radial Pulse','assess-trauma-circulation');
  expect(await canvas!.evaluate(el=>el.isConnected)).toBe(true);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page).toHaveURL(/\/sickcity$/);
});
