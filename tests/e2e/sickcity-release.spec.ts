import { careerAssignment } from './sickcity-career-fixture';
import { expect, test } from "@playwright/test";

test("landing shows one cue preview and offers all training paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: /scenario trainer with key patient details highlighted/i })).toHaveCount(1);
  await page.getByRole("link", { name: "Explore all training paths" }).click();
  await expect(page.getByRole("heading", { name: "Choose your next practice." })).toBeVisible();
  for (const name of ["Scenario Trainer", "SickCity", "EMT Scene", "MCI Triage", "Focused Exam Labs", "NREMT Exam Mode", "Flashcards", "Learning Center"]) {
    await expect(page.getByRole("link", { name: `Open ${name}`, exact: true })).toBeVisible();
  }
  await expect(page.locator("main")).toHaveCount(1);
});

test("SickCity loads local compressed assets and supports keyboard map and menu dialogs", async ({ page }) => {
  test.setTimeout(120000);
  const failedAssets: string[] = [];
  const decoderRequests: string[] = [];
  page.on("response", response => {
    const url = response.url();
    if (url.includes("/draco/")) decoderRequests.push(url);
    if ((url.includes("/draco/") || url.includes("/models/sickcity/")) && !response.ok()) failedAssets.push(url);
  });
  await page.goto("/sickcity");
  await expect(page.getByText("Ambulance garage · Bay 07", { exact: true })).toBeVisible({ timeout: 40000 });
  expect(failedAssets).toEqual([]);
  expect(decoderRequests.some(url => url.endsWith("draco_decoder.wasm"))).toBe(true);
  const map = page.getByRole("button", { name: "Toggle city map" });
  await map.click();
  await expect(page.getByRole("dialog", { name: "City operations map" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close map" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Return to shift" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(map).toBeFocused();
  const menu = page.getByRole("button", { name: "Shift menu", exact: true });
  await menu.click();
  await expect(page.getByRole("dialog", { name: "Shift menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
});

test("career dispatch starts muted, has no training mode, and an accepted assignment stays locked", async ({ page }) => {
  test.setTimeout(120000);
  await careerAssignment(page,7);
  await page.goto('/sickcity');
  await expect(page.getByRole('button', {name: /ACCEPT CALL/})).toBeVisible();
  await expect(page.getByLabel('AVAILABLE CALLS')).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Enable radio audio'})).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button', {name:'TRAINING MODE',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Adult confused and weak',exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'Patient dispatch board'})).not.toContainText('hypoglycemia');
  await page.getByRole('button',{name:'ACCEPT CALL · CLIN-03'}).click();
  await expect(page.getByRole('status').filter({hasText:'EN ROUTE'})).toBeVisible();
  await page.getByRole('button',{name:'Open patient dispatch board'}).click();
  await expect(page.getByLabel('AVAILABLE CALLS')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'RETURN TO CALL'})).toBeVisible();
  await page.getByRole('button',{name:'RETURN TO CALL'}).click();
  await expect(page.getByRole('button',{name:/Enter ambulance/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
