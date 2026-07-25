import { expect, test, type Page } from "@playwright/test";

const practiceItem = {
  id: 1,
  source: "static",
  domain: "Airway",
  topic: "Airway Assessment",
  vignette:
    "An adult patient is unresponsive after a fall. Breathing is present, but snoring respirations are heard.",
  cues: [
    {
      text: "snoring respirations",
      rationale: "Snoring suggests upper-airway obstruction by soft tissue.",
    },
  ],
  question: "What should the EMT do first?",
  choices: [
    {
      id: "a",
      text: "Open the airway with a jaw-thrust maneuver",
      correct: true,
      why_right: "Trauma is possible and the airway requires immediate attention.",
    },
    {
      id: "b",
      text: "Apply a cervical collar before touching the airway",
      correct: false,
      why_wrong: "Airway threats take priority over collar placement.",
    },
    {
      id: "c",
      text: "Obtain a full set of vital signs",
      correct: false,
      why_wrong: "Vital signs do not precede correction of an airway threat.",
    },
    {
      id: "d",
      text: "Begin a secondary assessment",
      correct: false,
      why_wrong: "The primary assessment must be completed first.",
    },
  ],
  reasoning_steps: [
    {
      label: "Recognize the threat",
      detail: "Snoring respirations indicate a partially obstructed airway.",
    },
    {
      label: "Protect the spine",
      detail: "Use a jaw thrust when trauma is possible.",
    },
  ],
  tags: ["Airway", "NREMT"],
  difficulty: "moderate",
};

async function mockStableApis(page: Page) {
  await page.route("**/api/test", async (route) => {
    await route.fulfill({ status: 200, json: [practiceItem] });
  });

  await page.route("**/api/progression", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          totalXp: 0,
          level: 1,
          levelProgress: 0,
          levelXpRequired: 250,
          streakDays: 0,
        },
      });
      return;
    }
    await route.fulfill({ status: 200, json: { ok: true } });
  });

  await page.route("**/api/scenario/attempt", async (route) => {
    await route.fulfill({ status: 200, json: { ok: true } });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test.beforeEach(async ({ page }) => {
  await mockStableApis(page);
});

test.describe("core route health", () => {
  const routes = [
    { path: "/", heading: "PathoLogix" },
    { path: "/learn", heading: "Build the reasoning behind the response." },
    { path: "/flashcards", heading: "EMT flashcards" },
    { path: "/emtrainer", heading: "Practice the call before exam day." },
    { path: "/contact", heading: "How can we help?" },
    { path: "/privacy", heading: "Privacy Policy" },
    { path: "/terms", heading: "Terms of Use" },
    { path: "/not-a-real-pathologix-page", heading: "We could not find that page." },
  ];

  for (const route of routes) {
    test(`${route.path} renders without layout overflow`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
      await expectNoHorizontalOverflow(page);
    });
  }
});

test("flashcards reveal answers and advance cleanly", async ({ page }) => {
  await page.goto("/flashcards");

  const reveal = page.getByRole("button", { name: "Reveal the answer" });
  await expect(reveal).toBeVisible();
  await reveal.click();
  await expect(page.getByRole("button", { name: "Show the question" })).toBeVisible();

  await page.getByRole("button", { name: "Next flashcard" }).click();
  await expect(page.getByText("Card 2 of 52")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reveal the answer" })).toBeVisible();
});

test("EMT Scene renders its responsive training shell", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.goto("/emtscene");

  await expect(page.getByRole("link", { name: "PathoLogix home" })).toBeVisible();
  const canvas = page.locator("canvas");
  const sceneLoader = page.getByRole("heading", { name: "Preparing EMT Scene" });
  await expect(canvas).toHaveCount(1);
  await expect(sceneLoader).toBeVisible({ timeout: 30_000 });
  await expect(sceneLoader).toBeHidden({ timeout: 120_000 });
  const canvasScreenshot = await canvas.screenshot();
  expect(canvasScreenshot.byteLength).toBeGreaterThan(10_000);
  await expect(page.locator("body")).not.toContainText("Application error");
  const collisionModelLoaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/models/emt-scene/quaternius_cc0-large-building-741.glb"),
    { timeout: 120_000 }
  );

  if (testInfo.project.name.startsWith("mobile")) {
    const sceneSwitcher = page.getByRole("button", { name: "Switch scene" });
    await expect(sceneSwitcher).toBeVisible();
    await expect(page.getByRole("button", { name: "Show HUD" })).toBeVisible();
    await sceneSwitcher.click();
    await page
      .getByLabel("Select mobile scenario")
      .selectOption({ label: "Driver Trapped After Collision" });
    await expect(sceneSwitcher).toBeVisible();
    await sceneSwitcher.click();
    await expect(
      page.getByRole("heading", {
        name: "Driver Trapped After Collision",
        exact: true,
      })
    ).toBeVisible();
  } else {
    await expect(page.getByText("Active Dispatch")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Teen With Shortness of Breath",
        exact: true,
      })
    ).toBeVisible();
    await page
      .getByLabel("Select scenario")
      .selectOption({ label: "Driver Trapped After Collision" });
    await expect(
      page.getByRole("heading", {
        name: "Driver Trapped After Collision",
        exact: true,
      })
    ).toBeVisible();
  }

  const collisionModelResponse = await collisionModelLoaded;
  expect(collisionModelResponse.ok()).toBe(true);
  await expect(sceneLoader).toBeHidden({ timeout: 120_000 });
  const collisionScreenshot = await canvas.screenshot();
  expect(collisionScreenshot.byteLength).toBeGreaterThan(5_000);
  await expect(page.locator("body")).not.toContainText("Application error");
  await expectNoHorizontalOverflow(page);
});

test("account access exposes sign-in, sign-up, and recovery views", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in to PathoLogix" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Google" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "GitHub" })).toHaveCount(0);

  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(
    page.getByText("Email and password are all you need.")
  ).toBeVisible();
  await expect(
    page.getByText(/verification link after registration/i)
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Google" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "GitHub" })).toHaveCount(0);

  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
});

test("Exam Mode redirects signed-out learners to login", async ({ page }) => {
  await page.goto("/exam/nremt");
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("mobile navigation exposes every primary destination", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page.locator("#mobile-navigation");
  await expect(
    mobileNavigation.getByRole("link", { name: "Scenarios", exact: true })
  ).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Exam Mode", exact: true })
  ).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Flashcards", exact: true })
  ).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Learn", exact: true })
  ).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Progress", exact: true })
  ).toBeVisible();
});
