import { expect, test } from "@playwright/test";
import {
  applyPatientIntervention,
  classifyTriageDifference,
  evaluateSaltMuccCategory,
  scorePatient,
} from "@/features/triage/engine";
import { highwayCollisionScenario } from "@/features/triage/scenario";
import {
  createTriageSimulationState,
  triageSimulationReducer,
} from "@/features/triage/state";
import type { TriageFindingState } from "@/features/triage/types";

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name.startsWith("mobile")) {
    await page.setViewportSize({ width: 390, height: 844 });
  }
});

const stable: TriageFindingState = {
  breathing: true,
  followsCommands: true,
  purposefulMovement: true,
  peripheralPulse: true,
  respiratoryDistress: false,
  hemorrhage: "none",
  injuriesAreMinor: false,
  likelyToSurviveWithCurrentResources: true,
  apneaInterventionComplete: false,
};

test("SALT classifies minor stable injuries as Minimal", () => {
  expect(evaluateSaltMuccCategory({ ...stable, injuriesAreMinor: true })).toBe("minimal");
});

test("SALT classifies stable non-minor injuries as Delayed", () => {
  expect(evaluateSaltMuccCategory(stable)).toBe("delayed");
});

test("respiratory distress is an Immediate finding", () => {
  expect(evaluateSaltMuccCategory({ ...stable, respiratoryDistress: true })).toBe("immediate");
});

test("uncontrolled major hemorrhage is an Immediate finding", () => {
  expect(evaluateSaltMuccCategory({ ...stable, hemorrhage: "uncontrolled" })).toBe("immediate");
});

test("resource-limited poor survival changes an Immediate-level patient to Expectant", () => {
  expect(
    evaluateSaltMuccCategory({
      ...stable,
      peripheralPulse: false,
      likelyToSurviveWithCurrentResources: false,
    })
  ).toBe("expectant");
});

test("apnea is Dead only after the protocol airway attempt is complete", () => {
  const apneic = { ...stable, breathing: false };
  expect(evaluateSaltMuccCategory(apneic)).toBe("immediate");
  expect(evaluateSaltMuccCategory({ ...apneic, apneaInterventionComplete: true })).toBe("dead");
});

test("breathing restored after an airway maneuver is not Dead", () => {
  expect(
    evaluateSaltMuccCategory({
      ...stable,
      followsCommands: false,
      purposefulMovement: false,
      respiratoryDistress: true,
      apneaInterventionComplete: true,
    })
  ).toBe("immediate");
});

test("hemorrhage control updates the evaluation using post-intervention findings", () => {
  const hemorrhagePatient = highwayCollisionScenario.patients.find(
    (patient) => patient.id === "patient-05"
  );
  expect(hemorrhagePatient).toBeTruthy();
  const before = { ...stable, hemorrhage: "uncontrolled" as const };
  const after = applyPatientIntervention(
    hemorrhagePatient!,
    before,
    "direct-pressure"
  );
  expect(evaluateSaltMuccCategory(before)).toBe("immediate");
  expect(after.hemorrhage).toBe("controlled");
  expect(evaluateSaltMuccCategory(after)).toBe("delayed");
});

test("Expectant and Dead remain distinct categories", () => {
  const expectant = highwayCollisionScenario.patients.find(
    (patient) => patient.correctCategory === "expectant"
  );
  const dead = highwayCollisionScenario.patients.find(
    (patient) => patient.correctCategory === "dead"
  );
  expect(expectant?.initialFindings.breathing).toBe(true);
  expect(dead?.correctCategory).toBe("dead");
  expect(expectant?.correctCategory).not.toBe(dead?.correctCategory);
});

test("triage comparison identifies over-triage and under-triage", () => {
  expect(classifyTriageDifference("immediate", "minimal")).toBe("over-triage");
  expect(classifyTriageDifference("delayed", "immediate")).toBe("under-triage");
});

test("scenario contains the required balanced eight-patient distribution", () => {
  const categories = highwayCollisionScenario.patients.map(
    (patient) => patient.correctCategory
  );
  expect(categories).toHaveLength(8);
  expect(categories.filter((category) => category === "minimal")).toHaveLength(2);
  expect(categories.filter((category) => category === "delayed")).toHaveLength(2);
  expect(categories.filter((category) => category === "immediate")).toHaveLength(2);
  expect(categories.filter((category) => category === "expectant")).toHaveLength(1);
  expect(categories.filter((category) => category === "dead")).toHaveLength(1);
});

test("patient scoring penalizes under-triage more than over-triage", () => {
  const immediatePatient = highwayCollisionScenario.patients.find(
    (patient) => patient.correctCategory === "immediate"
  )!;
  const runtime = {
    findings: immediatePatient.initialFindings,
    actionsTaken: [],
    assignedCategory: "delayed" as const,
    locked: true,
  };
  const underScore = scorePatient(immediatePatient, runtime).score;
  const overScore = scorePatient(immediatePatient, {
    ...runtime,
    assignedCategory: "immediate",
  }).score;
  expect(underScore).toBeLessThan(overScore);
});

test("paused reducer state prevents patient interaction and timer changes", () => {
  let state = createTriageSimulationState(highwayCollisionScenario);
  state = triageSimulationReducer(state, { type: "START" });
  state = triageSimulationReducer(state, { type: "PAUSE" });
  const paused = triageSimulationReducer(state, { type: "TICK" });
  const selected = triageSimulationReducer(paused, {
    type: "SELECT_PATIENT",
    patientId: "patient-01",
  });
  expect(selected.elapsedSeconds).toBe(0);
  expect(selected.selectedPatientId).toBeNull();
});

test("Challenge mode ends at the two-minute limit and cannot keep ticking", () => {
  expect(highwayCollisionScenario.durationSeconds).toBe(120);

  let state = createTriageSimulationState(highwayCollisionScenario, "challenge");
  state = triageSimulationReducer(state, { type: "START" });
  state = {
    ...state,
    elapsedSeconds: 119,
    remainingSeconds: 1,
  };

  const timedOut = triageSimulationReducer(state, { type: "TICK" });
  expect(timedOut.status).toBe("timed-out");
  expect(timedOut.elapsedSeconds).toBe(120);
  expect(timedOut.remainingSeconds).toBe(0);
  expect(triageSimulationReducer(timedOut, { type: "TICK" })).toEqual(timedOut);
});

test("Challenge mode withholds correctness while Learn mode explains it", () => {
  const assignFirst = (mode: "challenge" | "learn") => {
    let state = createTriageSimulationState(highwayCollisionScenario, mode);
    state = triageSimulationReducer(state, { type: "START" });
    return triageSimulationReducer(state, {
      type: "ASSIGN_CATEGORY",
      patientId: "patient-01",
      category: "immediate",
    });
  };
  expect(assignFirst("challenge").lastFeedback).toMatch(/tagged Immediate/);
  expect(assignFirst("challenge").lastFeedback).not.toMatch(/not the best|correct/i);
  expect(assignFirst("learn").lastFeedback).toMatch(/not the best tag/i);
});

test("Learn mode flags a missed rapid intervention even when the final tag category is right", () => {
  let state = createTriageSimulationState(highwayCollisionScenario, "learn");
  state = triageSimulationReducer(state, { type: "START" });
  state = triageSimulationReducer(state, {
    type: "ASSIGN_CATEGORY",
    patientId: "patient-06",
    category: "immediate",
  });
  expect(state.lastFeedback).toMatch(/required rapid lifesaving intervention was missed/i);
});

test("triage briefing holds the timer until the user begins", async ({ page }) => {
  await page.goto("/triage");
  await expect(page.getByRole("heading", { name: /Highway Collision/i })).toBeVisible();
  await expect(page.getByTestId("triage-briefing-simulator-link")).toHaveAttribute(
    "href",
    "/emtscene?scenario=car-accident"
  );
  await expect(page.getByTestId("triage-timer")).toHaveCount(0);
  await page.waitForTimeout(1100);
  await expect(page.getByTestId("triage-timer")).toHaveCount(0);
});

test("starting Challenge mode briefly announces the two-minute limit", async ({ page }) => {
  await page.goto("/triage");
  await page.getByRole("radio", { name: /Challenge/i }).click();
  await page.getByTestId("triage-begin").click();

  const notice = page.getByTestId("triage-start-notice");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("2:00 starts now");
  await expect(notice).toContainText("Triage all 8 patients");
  await expect(notice).toBeHidden({ timeout: 6_000 });
});

test("portrait phones can enter and use triage without an orientation gate", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/triage");

  await expect(page.getByRole("heading", { name: /Highway Collision/i })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Rotate your phone" })).toHaveCount(0);
  await page.getByTestId("triage-begin").click();
  await expect(page.getByText("Drag to explore · tap a patient")).toBeVisible();
  await expect(page.getByTestId("triage-patient-patient-06")).toBeVisible();
});

test("Learn mode supports patient selection, keyboard tagging, and reassessment", async ({ page }) => {
  await page.goto("/triage");
  await page.getByRole("radio", { name: /Learn/i }).click();
  await page.getByTestId("triage-begin").click();
  await expect(page.getByTestId("triage-timer")).toBeVisible();

  await page.getByTestId("triage-patient-patient-06").click();
  await expect(page.getByTestId("triage-assessment-panel")).toBeVisible();
  await page.getByRole("button", { name: /Open airway/i }).click();
  await page.keyboard.press("1");
  await expect(page.getByText(/Immediate \/ Red is correct/i)).toBeVisible();

  await page.getByTestId("triage-patient-patient-06").click();
  await expect(page.getByRole("button", { name: /Reassess patient/i })).toBeVisible();
});

test("Challenge mode acknowledges a tag without revealing correctness", async ({ page }) => {
  await page.goto("/triage");
  await page.getByTestId("triage-begin").click();
  await page.getByTestId("triage-patient-patient-06").click();
  await page.getByTestId("triage-tag-immediate").click();
  await expect(page.getByTestId("triage-patient-patient-06")).toHaveAttribute(
    "aria-label",
    /tagged Immediate/i
  );
  await expect(page.getByText(/not the best tag|is correct/i)).toHaveCount(0);
});

test("completing all eight patients opens a scored debrief", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"));
  await page.goto("/triage");
  await page.getByTestId("triage-begin").click();

  const decisions = [
    ["patient-01", "minimal", null],
    ["patient-02", "minimal", null],
    ["patient-03", "delayed", null],
    ["patient-04", "delayed", null],
    ["patient-05", "immediate", "direct-pressure"],
    ["patient-06", "immediate", "open-airway"],
    ["patient-07", "expectant", null],
    ["patient-08", "dead", "open-airway"],
  ] as const;

  for (const [patientId, category, intervention] of decisions) {
    await page.getByTestId(`triage-patient-${patientId}`).click();
    if (intervention) {
      await page.getByTestId(`triage-intervention-${intervention}`).click();
    }
    await page.getByTestId(`triage-tag-${category}`).click();
  }

  await expect(page.getByRole("heading", { name: "MCI triage debrief" })).toBeVisible();
  await expect(page.getByTestId("triage-debrief-simulator-link")).toHaveAttribute(
    "href",
    "/emtscene?scenario=car-accident"
  );
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByText("Expectant is not Dead.", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Sign in to save future results and earn XP/i)
  ).toBeVisible();
});

test("mobile triage controls fit the viewport and patient panel remains usable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/triage");
  await page.getByTestId("triage-begin").click();
  await page.getByTestId("triage-patient-patient-06").click();
  const panel = page.getByTestId("triage-assessment-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: /Open airway/i })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
