import { expect, test } from '@playwright/test';

test('SickCity starts a career shift with an assigned call and no training mode', async ({page}) => {
  await page.goto('/sickcity');
  await expect(page.getByRole('button',{name:/ACCEPT CALL/})).toBeVisible();
  await expect(page.getByRole('button',{name:'TRAINING MODE',exact:true})).toHaveCount(0);
  await expect(page.getByLabel('AVAILABLE CALLS')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'PathoLogix home'})).toContainText('SHIFT 01 · 0 / 5 CALLS');
  await page.getByRole('button',{name:/ACCEPT CALL/}).click();
  await expect(page.getByRole('status').filter({hasText:'EN ROUTE'})).toBeVisible();
  await page.getByRole('button',{name:'Open patient dispatch board'}).click();
  await expect(page.getByRole('button',{name:'RETURN TO CALL'})).toBeVisible();
  await expect(page.getByLabel('AVAILABLE CALLS')).toHaveCount(0);
});
