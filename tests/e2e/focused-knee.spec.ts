import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectCoachTextFullyVisible(page: Page) {
  const clippedParagraphs = await page.getByTestId("knee-exam-coach").locator("p").evaluateAll((paragraphs) =>
    paragraphs
      .filter((paragraph) =>
        paragraph.scrollHeight > paragraph.clientHeight + 1
        || paragraph.scrollWidth > paragraph.clientWidth + 1
      )
      .map((paragraph) => paragraph.textContent?.trim())
  );
  expect(clippedParagraphs).toEqual([]);
}

async function clickKneeMarker(page: Page, id: string) {
  const marker = page.getByTestId(`knee-marker-${id}`);
  await expect(marker).toBeVisible();
  await marker.click();
  await expect(marker).toHaveCount(0);
}

async function continueKneeExam(page: Page) {
  const button = page.getByTestId("continue-knee-exam");
  await expect(button).toBeEnabled();
  await button.click();
}

test("knee lab completes the stable medial sprain pathway", async ({ page }) => {
  await page.goto("/focused-exams/knee");
  await expect(page.getByRole("heading", { name: "Knee assessment" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("begin-knee-exam").click();
  await expect(page.locator("aside")).toHaveCount(0);
  await expectCoachTextFullyVisible(page);

  const firstMarker = page.getByTestId("knee-marker-knee-appearance");
  const box = await firstMarker.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(60);
  expect(box?.height).toBeGreaterThanOrEqual(60);

  await clickKneeMarker(page, "knee-appearance");
  await expect(page.getByTestId("knee-finding-message")).toContainText("Expose and compare both knees");
  await expect(page.getByTestId("knee-finding-message")).toContainText("Mild medial swelling");
  await page.getByRole("button", { name: "Dismiss knee finding" }).click();
  await clickKneeMarker(page, "knee-skin");
  await continueKneeExam(page);
  await expectCoachTextFullyVisible(page);

  await clickKneeMarker(page, "patella");
  await clickKneeMarker(page, "fibular-head");
  await clickKneeMarker(page, "medial-joint-line");
  await continueKneeExam(page);
  await expectCoachTextFullyVisible(page);

  await clickKneeMarker(page, "distal-pulse");
  await clickKneeMarker(page, "knee-sensation");
  await clickKneeMarker(page, "ankle-motor");
  await continueKneeExam(page);
  await expectCoachTextFullyVisible(page);

  await clickKneeMarker(page, "valgus-stress");
  await clickKneeMarker(page, "varus-stress");
  await clickKneeMarker(page, "anterior-drawer");
  await continueKneeExam(page);
  await expectCoachTextFullyVisible(page);

  await clickKneeMarker(page, "knee-flexion");
  await clickKneeMarker(page, "knee-weight-bearing");
  await continueKneeExam(page);
  await expectCoachTextFullyVisible(page);

  await page.getByRole("button", {
    name: "Ottawa criteria do not indicate knee radiographs",
    exact: true,
  }).click();
  const debrief = page.getByTestId("knee-debrief");
  await expect(debrief).toContainText("Good clinical decision");
  await expect(debrief).toContainText("100");
  await expect(debrief).toContainText("Findings that drove the decision");
  await expectNoHorizontalOverflow(page);
});

test("isolated patellar findings lead to knee radiographs", async ({ page }) => {
  await page.goto("/focused-exams/knee");
  await page.getByLabel("Choose knee case").selectOption("patella-concern");
  await page.getByTestId("begin-knee-exam").click();

  await clickKneeMarker(page, "knee-appearance");
  await clickKneeMarker(page, "knee-skin");
  await continueKneeExam(page);
  await clickKneeMarker(page, "patella");
  await clickKneeMarker(page, "fibular-head");
  await continueKneeExam(page);
  await clickKneeMarker(page, "distal-pulse");
  await clickKneeMarker(page, "knee-sensation");
  await clickKneeMarker(page, "ankle-motor");
  await continueKneeExam(page);
  await clickKneeMarker(page, "knee-flexion");
  await clickKneeMarker(page, "knee-weight-bearing");
  await continueKneeExam(page);

  await page.getByRole("button", { name: "Knee radiographs are indicated", exact: true }).click();
  await expect(page.getByTestId("knee-debrief")).toContainText("isolated patellar tenderness");
  await expect(page.getByTestId("knee-debrief")).toContainText("100");
});

test("fibular-head tenderness leads to knee radiographs", async ({ page }) => {
  await page.goto("/focused-exams/knee");
  await page.getByLabel("Choose knee case").selectOption("fibular-head-concern");
  await page.getByTestId("begin-knee-exam").click();

  await clickKneeMarker(page, "knee-appearance");
  await clickKneeMarker(page, "knee-skin");
  await continueKneeExam(page);
  await clickKneeMarker(page, "patella");
  await clickKneeMarker(page, "fibular-head");
  await continueKneeExam(page);
  await clickKneeMarker(page, "distal-pulse");
  await clickKneeMarker(page, "knee-sensation");
  await clickKneeMarker(page, "ankle-motor");
  await continueKneeExam(page);
  await clickKneeMarker(page, "knee-flexion");
  await clickKneeMarker(page, "knee-weight-bearing");
  await continueKneeExam(page);

  await page.getByRole("button", { name: "Knee radiographs are indicated", exact: true }).click();
  await expect(page.getByTestId("knee-debrief")).toContainText("fibular-head tenderness");
  await expect(page.getByTestId("knee-debrief")).toContainText("100");
});

test("knee dislocation bypasses stability and function testing", async ({ page }) => {
  await page.goto("/focused-exams/knee");
  await page.getByLabel("Choose knee case").selectOption("knee-dislocation");
  await page.getByTestId("begin-knee-exam").click();

  await clickKneeMarker(page, "knee-appearance");
  await clickKneeMarker(page, "knee-skin");
  await continueKneeExam(page);
  await expect(page.getByText("Check beyond the knee")).toBeVisible();
  await expect(page.getByTestId("knee-marker-knee-weight-bearing")).toHaveCount(0);
  await expect(page.getByTestId("knee-marker-valgus-stress")).toHaveCount(0);

  await clickKneeMarker(page, "distal-pulse");
  await clickKneeMarker(page, "knee-sensation");
  await clickKneeMarker(page, "ankle-motor");
  await continueKneeExam(page);

  await page.getByRole("button", { name: "Stop the exam and manage the limb threat", exact: true }).click();
  await expect(page.getByTestId("knee-debrief")).toContainText("immediate limb threat");
  await expect(page.getByTestId("knee-debrief")).toContainText("100");
});

test("focused exam library links to the knee lab", async ({ page }) => {
  await page.goto("/focused-exams");
  await expect(page.getByRole("link", { name: "Start knee lab" })).toHaveAttribute(
    "href",
    "/focused-exams/knee"
  );
  await expectNoHorizontalOverflow(page);
});
