import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectCoachTextFullyVisible(page: Page) {
  const clippedParagraphs = await page.getByTestId("guided-exam-coach").locator("p").evaluateAll((paragraphs) =>
    paragraphs
      .filter((paragraph) =>
        paragraph.scrollHeight > paragraph.clientHeight + 1
        || paragraph.scrollWidth > paragraph.clientWidth + 1
      )
      .map((paragraph) => paragraph.textContent?.trim())
  );
  expect(clippedParagraphs).toEqual([]);
}

async function clickMarker(page: Page, id: string) {
  const marker = page.getByTestId(`exam-marker-${id}`);
  await expect(marker).toBeVisible();
  await marker.click();
  await expect(marker).toHaveCount(0);
}

test("ankle lab completes the likely sprain pathway", async ({ page }) => {
  await page.goto("/focused-exams/ankle");
  await expect(page.getByRole("heading", { name: "Ankle and foot assessment" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByTestId("begin-ankle-exam").click();
  await expect(page.locator("aside")).toHaveCount(0);
  await expectCoachTextFullyVisible(page);

  const firstMarker = page.getByTestId("exam-marker-appearance");
  const box = await firstMarker.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(60);
  expect(box?.height).toBeGreaterThanOrEqual(60);

  await clickMarker(page, "appearance");
  await expect(page.getByTestId("exam-finding-message")).toContainText("Compare both ankles before touching");
  await expect(page.getByTestId("exam-finding-message")).toContainText("Mild lateral swelling");
  await page.getByRole("button", { name: "Dismiss finding" }).click();
  await expect(page.getByTestId("exam-finding-message")).toHaveCount(0);
  await clickMarker(page, "skin");
  await page.getByTestId("continue-exam").click();
  await expectCoachTextFullyVisible(page);

  await clickMarker(page, "lateral-malleolus");
  await clickMarker(page, "medial-malleolus");
  await clickMarker(page, "atfl");
  await page.getByTestId("continue-exam").click();
  await expectCoachTextFullyVisible(page);

  await clickMarker(page, "dorsalis-pedis");
  await clickMarker(page, "sensation");
  await clickMarker(page, "motor");
  await page.getByTestId("continue-exam").click();
  await expectCoachTextFullyVisible(page);

  await clickMarker(page, "weight-bearing");
  await page.getByTestId("continue-exam").click();
  await expectCoachTextFullyVisible(page);

  await page.getByRole("button", {
    name: "Ottawa criteria do not indicate radiographs",
  }).click();

  const debrief = page.getByTestId("exam-debrief");
  await expect(debrief).toContainText("Good clinical decision");
  await expect(debrief).toContainText("100");
  await expect(debrief).toContainText("rather than promising that fracture is impossible");
  await expect(debrief).toContainText("Findings that drove the decision");
  await expect(page.locator("aside")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("lateral malleolus findings lead to ankle radiographs", async ({ page }) => {
  await page.goto("/focused-exams/ankle");
  await page.getByLabel("Choose ankle case").selectOption("lateral-malleolus");
  await page.getByTestId("begin-ankle-exam").click();

  await clickMarker(page, "appearance");
  await clickMarker(page, "skin");
  await page.getByTestId("continue-exam").click();
  await clickMarker(page, "lateral-malleolus");
  await clickMarker(page, "medial-malleolus");
  await page.getByTestId("continue-exam").click();
  await clickMarker(page, "dorsalis-pedis");
  await clickMarker(page, "sensation");
  await clickMarker(page, "motor");
  await page.getByTestId("continue-exam").click();
  await clickMarker(page, "weight-bearing");
  await page.getByTestId("continue-exam").click();

  await page.getByRole("button", { name: "Ankle radiographs are indicated", exact: true }).click();
  await expect(page.getByTestId("exam-debrief")).toContainText("qualifying lateral malleolus tenderness");
  await expect(page.getByTestId("exam-debrief")).toContainText("100");
});

test("fifth metatarsal findings lead to foot radiographs", async ({ page }) => {
  await page.goto("/focused-exams/ankle");
  await page.getByLabel("Choose ankle case").selectOption("fifth-metatarsal");
  await page.getByTestId("begin-ankle-exam").click();

  await clickMarker(page, "appearance");
  await clickMarker(page, "skin");
  await page.getByTestId("continue-exam").click();
  await clickMarker(page, "navicular");
  await clickMarker(page, "fifth-metatarsal");
  await page.getByTestId("continue-exam").click();
  await clickMarker(page, "dorsalis-pedis");
  await clickMarker(page, "sensation");
  await clickMarker(page, "motor");
  await page.getByTestId("continue-exam").click();
  await clickMarker(page, "weight-bearing");
  await page.getByTestId("continue-exam").click();

  await page.getByRole("button", { name: "Foot radiographs are indicated", exact: true }).click();
  await expect(page.getByTestId("exam-debrief")).toContainText("base of the fifth metatarsal");
  await expect(page.getByTestId("exam-debrief")).toContainText("100");
});

test("limb-threat case bypasses unsafe weight bearing", async ({ page }) => {
  await page.goto("/focused-exams/ankle");
  await page.getByLabel("Choose ankle case").selectOption("neurovascular-emergency");
  await page.getByTestId("begin-ankle-exam").click();

  await clickMarker(page, "appearance");
  await clickMarker(page, "skin");
  await page.getByTestId("continue-exam").click();

  await expect(page.getByText("Check the foot beyond the injury")).toBeVisible();
  await expect(page.getByTestId("exam-marker-weight-bearing")).toHaveCount(0);

  await clickMarker(page, "dorsalis-pedis");
  await clickMarker(page, "sensation");
  await clickMarker(page, "motor");
  await page.getByTestId("continue-exam").click();

  await page.getByRole("button", {
    name: "Stop the screen and manage the immediate threat",
  }).click();
  await expect(page.getByTestId("exam-debrief")).toContainText("immediate emergency management");
});

test("focused exam library exposes the playable lab", async ({ page }) => {
  await page.goto("/focused-exams");
  await expect(page.getByRole("heading", { name: "Practice the exam, not just the answer." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start ankle lab" })).toHaveAttribute(
    "href",
    "/focused-exams/ankle"
  );
  await expectNoHorizontalOverflow(page);
});
