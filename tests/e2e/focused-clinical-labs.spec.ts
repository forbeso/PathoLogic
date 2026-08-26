import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function clickClinicalMarker(page: Page, id: string) {
  const marker = page.getByTestId(`clinical-marker-${id}`);
  await expect(marker).toBeVisible();
  const box = await marker.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(60);
  expect(box?.height).toBeGreaterThanOrEqual(60);
  await marker.click();
  await expect(marker).toHaveCount(0);
}

async function continueClinicalExam(page: Page) {
  const button = page.getByTestId("continue-clinical-exam");
  await expect(button).toBeEnabled();
  await button.click();
}

test("focused exam library links to wrist, hand, and neuro labs", async ({ page }) => {
  await page.goto("/focused-exams");
  await expect(page.getByRole("link", { name: "Start wrist and hand lab" })).toHaveAttribute(
    "href",
    "/focused-exams/wrist-hand"
  );
  await expect(page.getByRole("link", { name: "Start focused neuro lab" })).toHaveAttribute(
    "href",
    "/focused-exams/neuro"
  );
  await expectNoHorizontalOverflow(page);
});

test("every focused lab exposes the same in-lab switcher", async ({ page }) => {
  await page.goto("/focused-exams/ankle");
  const labNavigation = page.getByRole("navigation", { name: "Switch focused exam lab" });
  await expect(labNavigation.getByRole("link", { name: "Ankle & foot" })).toHaveAttribute("aria-current", "page");
  await expect(labNavigation.getByRole("link", { name: "Knee" })).toBeVisible();
  await expect(labNavigation.getByRole("link", { name: "Wrist & hand" })).toBeVisible();
  await expect(labNavigation.getByRole("link", { name: "Focused neuro" })).toBeVisible();

  await labNavigation.getByRole("link", { name: "Wrist & hand" }).click();
  await expect(page).toHaveURL(/\/focused-exams\/wrist-hand$/);
  await expect(
    page.getByRole("navigation", { name: "Switch focused exam lab" }).getByRole("link", { name: "Wrist & hand" })
  ).toHaveAttribute("aria-current", "page");
  await expectNoHorizontalOverflow(page);
});

test("wrist and hand lab completes the scaphoid pathway", async ({ page }) => {
  await page.goto("/focused-exams/wrist-hand");
  await page.getByLabel("Choose case").selectOption("scaphoid-concern");
  await page.getByTestId("begin-wrist-hand-exam").click();

  await clickClinicalMarker(page, "wrist-appearance");
  await expect(page.getByTestId("clinical-finding-message")).toContainText("Minimal swelling");
  await page.getByRole("button", { name: "Dismiss finding" }).click();
  await clickClinicalMarker(page, "wrist-skin");
  await continueClinicalExam(page);

  await clickClinicalMarker(page, "distal-radius");
  await clickClinicalMarker(page, "snuffbox");
  await clickClinicalMarker(page, "scaphoid-tubercle");
  await continueClinicalExam(page);

  for (const finding of ["radial-pulse", "capillary-refill", "median-sensation", "ulnar-sensation", "radial-sensation"]) {
    await clickClinicalMarker(page, finding);
  }
  await continueClinicalExam(page);

  for (const finding of ["thumb-opposition", "finger-abduction", "wrist-extension"]) {
    await clickClinicalMarker(page, finding);
  }
  await continueClinicalExam(page);

  await page.getByRole("button", {
    name: "Immobilize for suspected scaphoid injury and arrange imaging",
  }).click();
  const debrief = page.getByTestId("clinical-debrief");
  await expect(debrief).toContainText("Good clinical decision");
  await expect(debrief).toContainText("100");
  await expect(debrief).toContainText("snuffbox and scaphoid-tubercle tenderness");
  await expectNoHorizontalOverflow(page);
});

test("focused neuro lab recognizes and treats a hypoglycemia mimic", async ({ page }) => {
  await page.goto("/focused-exams/neuro");
  await page.getByLabel("Choose case").selectOption("hypoglycemia-mimic");
  await page.getByTestId("begin-neuro-exam").click();

  await clickClinicalMarker(page, "responsiveness");
  await clickClinicalMarker(page, "speech");
  await continueClinicalExam(page);

  for (const finding of ["facial-symmetry", "gaze", "pupils"]) {
    await clickClinicalMarker(page, finding);
  }
  await continueClinicalExam(page);

  for (const finding of ["arm-drift", "grip", "leg-strength"]) {
    await clickClinicalMarker(page, finding);
  }
  await continueClinicalExam(page);

  await clickClinicalMarker(page, "neuro-sensation");
  await clickClinicalMarker(page, "coordination");
  await continueClinicalExam(page);

  await clickClinicalMarker(page, "blood-glucose");
  await expect(page.getByTestId("clinical-finding-message")).toContainText("42 mg/dL");
  await clickClinicalMarker(page, "last-known-well");
  await continueClinicalExam(page);

  await page.getByRole("button", {
    name: "Treat hypoglycemia, repeat the neuro exam, and transport",
  }).click();
  const debrief = page.getByTestId("clinical-debrief");
  await expect(debrief).toContainText("Good clinical decision");
  await expect(debrief).toContainText("100");
  await expect(debrief).toContainText("hypoglycemia can mimic stroke");
  await expectNoHorizontalOverflow(page);
});
