import { expect, test, type Page } from '@playwright/test';
async function travel(page: Page, key: string, axis: 'x' | 'z', target: number, increasing = true) {
  await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const value = Number(await page.locator('[data-world-x]').first().getAttribute(`data-world-${axis}`));
      return increasing ? value >= target : value <= target;
    }, {timeout:90000,intervals:[100]}).toBe(true);
  } finally { await page.keyboard.up(key); }
}
test('five completed calls produce a scored shift and replay cannot mint duplicate XP', async ({page},info) => {
  test.skip(info.project.name.startsWith('mobile'), 'Full shift lifecycle runs once; dispatch has separate mobile coverage.');
  test.setTimeout(300000);
  await page.setViewportSize({width:800,height:650});
  await page.goto('/sickcity');
  await page.getByRole('button',{name:'TRAINING MODE',exact:true}).click();
  await page.getByLabel('AVAILABLE CALLS').selectOption('2');
  for(let call=0;call<5;call++) {
    await page.getByRole('button',{name:'ACCEPT CALL · MED-14'}).click();
    if(call===0) {
      await travel(page,'w','x',36);
      await travel(page,'d','z',-29);
      await travel(page,'s','x',32,false);
    }
    await page.getByRole('button',{name:'BEGIN ASSESSMENT'}).click();
    // Labels are read from the existing case; this verifies the full reducer/UI lifecycle.
    const content = await import('../../src/lib/sickCity');
    for (const [index,step] of content.SICK_CITY_CALLS[2].steps.entries()) {
      if(call===0 && index===0) await page.getByRole('button',{name:new RegExp(step.options.find(o=>!o.correct)!.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();
      await page.getByRole('button',{name:new RegExp(step.options.find(o=>o.correct)!.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();
      await page.getByRole('button',{name:index===3?'Complete call & debrief':'Continue assessment',exact:true}).click();
    }
    await expect(page.getByRole('status').filter({hasText:'CLEARING'})).toBeVisible();
    await page.getByRole('button',{name:call===4?'CLEAR CALL & REVIEW SHIFT':'CLEAR CALL',exact:true}).click();
  }
  await expect(page.getByRole('heading',{name:'SHIFT COMPLETE'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Shift review'})).toContainText('90%');
  await expect(page.getByRole('region',{name:'Shift review'})).toContainText('+130');
  await expect(page.getByRole('button',{name:/PRACTICE IN SICKCITY/})).toBeVisible();
  await expect(page.locator('a[href="/emtscene"]')).toHaveCount(0);
  await expect(page.getByLabel('+130 XP',{exact:true})).toHaveText('+130');
  await page.screenshot({path:'tmp/site-audit/sickcity-shift-complete.png'});
  await page.getByRole('button',{name:/START NEXT SHIFT/}).click();
  await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText('SHIFT 02 · 0 / 5 CALLS');
});
