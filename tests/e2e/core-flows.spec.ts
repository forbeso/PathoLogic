import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  anaphylaxisFestivalScenario,
  buildScenarioDebrief,
  carAccidentScenario,
  chestPainScenario,
  createScenarioState,
  getActionSuccessEvents,
  getCurrentObjective,
  getObjectAvailability,
  getVisibleInteractiveObjects,
  hasEvents,
  hypoglycemiaScenario,
  opioidOverdoseScenario,
  scenarioReducer,
  type SceneEvent,
  type SceneScenarioConfig,
} from "@/lib/emtSceneEngine";
import { learnArticles } from "@/lib/learnArticles";

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

async function getContrastRatio(locator: Locator) {
  return locator.evaluate((element) => {
    const parseRgb = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (!channels || channels.length !== 3) {
        throw new Error(`Unable to parse computed color: ${value}`);
      }
      return channels;
    };
    const luminance = (channels: number[]) =>
      channels
        .map((channel) => channel / 255)
        .map((channel) =>
          channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
        )
        .reduce(
          (total, channel, index) =>
            total + channel * [0.2126, 0.7152, 0.0722][index],
          0
        );
    const styles = window.getComputedStyle(element);
    const foreground = luminance(parseRgb(styles.color));
    const background = luminance(parseRgb(styles.backgroundColor));
    const lighter = Math.max(foreground, background);
    const darker = Math.min(foreground, background);
    return (lighter + 0.05) / (darker + 0.05);
  });
}

test.beforeEach(async ({ page }) => {
  await mockStableApis(page);
});

test("telemetry endpoint accepts only privacy-safe issue envelopes", async ({
  request,
}) => {
  const payload = {
    issueId: "test-issue-123",
    context: "app_render",
    route: "/emtscene",
    errorName: "TypeError",
    code: "TEST_FAILURE",
    recoverable: true,
    occurredAt: new Date().toISOString(),
  };

  const accepted = await request.post("/api/telemetry", { data: payload });
  expect(accepted.status()).toBe(202);

  const rejected = await request.post("/api/telemetry", {
    data: {
      ...payload,
      issueId: "test-issue-with-message",
      message: "Sensitive free-form text must not be accepted.",
    },
  });
  expect(rejected.status()).toBe(400);
});

test("feedback endpoint is authenticated and POST-only", async ({
  request,
}) => {
  const unsupportedMethod = await request.get("/api/feedback");
  expect(unsupportedMethod.status()).toBe(405);

  const unauthorized = await request.post("/api/feedback", {
    data: {
      category: "friction",
      rating: 4,
      message: "The next action was difficult to find.",
      route: "/emtrainer",
    },
  });
  expect(unauthorized.status()).toBe(401);
});

test("offline state explains what remains available and confirms recovery", async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"));
  await page.goto("/");

  await context.setOffline(true);
  await expect(page.getByText("You are offline", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/current screen remains available/i)
  ).toBeVisible();

  await context.setOffline(false);
  await expect(
    page.getByText("Connection restored", { exact: true })
  ).toBeVisible();
});

test("dark mode toggles without a flash and persists across navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("pathologix:theme", "light");
  });
  await page.reload();

  const darkToggle = page.getByRole("button", {
    name: "Switch to dark mode",
  });
  await darkToggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#08191f"
  );

  await page.goto("/learn");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Switch to light mode" })
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page
    .getByRole("button", { name: "Switch to light mode" })
    .click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expectNoHorizontalOverflow(page);
});

function completeScenario(
  scenario: SceneScenarioConfig,
  sceneEvents: SceneEvent[]
) {
  const isCrash = scenario.id === carAccidentScenario.id;
  const isAdditionalMedical = [
    hypoglycemiaScenario.id,
    opioidOverdoseScenario.id,
    chestPainScenario.id,
  ].includes(scenario.id);
  const secondaryAssessmentEvents: SceneEvent[] =
    isCrash
      ? ["FOCUSED_EXAM_COMPLETED", "FOCUSED_HISTORY_OBTAINED"]
      : ["FOCUSED_HISTORY_OBTAINED", "FOCUSED_EXAM_COMPLETED"];
  const assessmentEvents: SceneEvent[] = [
    ...sceneEvents,
    "GLOVES_EQUIPPED",
    "PATIENT_APPROACHED",
    "GENERAL_IMPRESSION_OBSERVED",
    "RESPONSIVENESS_CHECKED",
    "AIRWAY_OPENED",
    "RESPIRATIONS_COUNTED",
    ...(isCrash || scenario.id === opioidOverdoseScenario.id
      ? (["OXYGEN_APPLIED"] as SceneEvent[])
      : []),
    "PULSE_CHECKED",
    ...(isAdditionalMedical
      ? (["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"] as SceneEvent[])
      : []),
    "WORKING_IMPRESSION_SELECTED",
    ...(scenario.id === chestPainScenario.id
      ? (["OXYGEN_APPLIED"] as SceneEvent[])
      : []),
    ...(isAdditionalMedical
      ? (["SCENARIO_MEDICATION_ADMINISTERED"] as SceneEvent[])
      : !isCrash
      ? (["EPINEPHRINE_ADMINISTERED", "OXYGEN_APPLIED"] as SceneEvent[])
      : []),
    "TRANSPORT_SELECTED",
    ...(!isAdditionalMedical
      ? (["BLOOD_PRESSURE_OBTAINED", "SPO2_OBTAINED"] as SceneEvent[])
      : []),
    ...(isCrash
      ? (["SPINAL_PRECAUTIONS_MAINTAINED", "EXTRICATION_COORDINATED"] as SceneEvent[])
      : []),
    ...secondaryAssessmentEvents,
    "REASSESSMENT_COMPLETED",
  ];

  return assessmentEvents.reduce(
    (state, event) => scenarioReducer(scenario, state, { type: "APPLY_EVENT", event }),
    createScenarioState(scenario)
  );
}

test("every EMT scene has a reachable action path through debrief", () => {
  const scenarios = [
    anaphylaxisFestivalScenario,
    carAccidentScenario,
    hypoglycemiaScenario,
    opioidOverdoseScenario,
    chestPainScenario,
  ];
  const equipmentEvents = new Set<SceneEvent>([
    "BLOOD_PRESSURE_OBTAINED",
    "SPO2_OBTAINED",
    "OXYGEN_APPLIED",
  ]);

  for (const scenario of scenarios) {
    let state = createScenarioState(scenario);
    let steps = 0;

    while (state.currentPhase !== "complete" && steps < 100) {
      steps += 1;

      if (
        hasEvents(state, ["ANIMAL_CONTROL_CALLED"]) &&
        !hasEvents(state, ["DOG_SECURED"])
      ) {
        state = scenarioReducer(scenario, state, {
          type: "APPLY_EVENT",
          event: "DOG_SECURED",
        });
        continue;
      }
      if (
        hasEvents(state, ["FIRE_RESCUE_CALLED"]) &&
        !hasEvents(state, ["TRAFFIC_CONTROLLED"])
      ) {
        state = scenarioReducer(scenario, state, {
          type: "APPLY_EVENT",
          event: "TRAFFIC_CONTROLLED",
        });
        continue;
      }

      const objective = getCurrentObjective(scenario, state);
      const equipmentEvent = objective.requiredEvents.find(
        (event) => equipmentEvents.has(event) && !hasEvents(state, [event])
      );
      if (equipmentEvent) {
        state = scenarioReducer(scenario, state, {
          type: "APPLY_EVENT",
          event: equipmentEvent,
        });
        continue;
      }

      const visibleObjects = getVisibleInteractiveObjects(scenario, state);
      let advanced = false;

      for (const object of visibleObjects) {
        if (!getObjectAvailability(object, state).enabled) continue;

        if (
          object.id === "ambulance-radio" &&
          !hasEvents(
            state,
            scenario.id === "car-accident"
              ? ["FIRE_RESCUE_CALLED"]
              : ["ANIMAL_CONTROL_CALLED"]
          )
        ) {
          state = scenarioReducer(scenario, state, {
            type: "SELECT_OBJECT",
            objectId: object.id,
          });
          advanced = true;
          break;
        }

        const action = object.actions.find((candidate) => {
          const successEvents = getActionSuccessEvents(candidate);
          return (
            candidate.outcome !== "incorrect" &&
            hasEvents(state, candidate.requires) &&
            successEvents.some((event) => !hasEvents(state, [event]))
          );
        });
        if (!action) continue;

        state = scenarioReducer(scenario, state, {
          type: "RUN_ACTION",
          objectId: object.id,
          actionId: action.id,
        });
        advanced = true;
        break;
      }

      expect(
        advanced,
        `${scenario.id} became stuck on ${state.currentObjectiveId}`
      ).toBe(true);
    }

    expect(state.currentPhase, `${scenario.id} did not reach debrief`).toBe(
      "complete"
    );
    expect(state.completedObjectives).toHaveLength(scenario.objectives.length);
  }
});

test("scene debriefs score the full playable clinical flow without scenario leakage", () => {
  const festivalState = completeScenario(anaphylaxisFestivalScenario, [
    "DOG_INSPECTED",
    "RADIO_SELECTED",
    "ANIMAL_CONTROL_CALLED",
    "DOG_SECURED",
  ]);
  const crashState = completeScenario(carAccidentScenario, [
    "CRASH_SCENE_INSPECTED",
    "RADIO_SELECTED",
    "FIRE_RESCUE_CALLED",
    "TRAFFIC_CONTROLLED",
  ]);
  const festivalDebrief = buildScenarioDebrief(festivalState);
  const crashDebrief = buildScenarioDebrief(crashState);

  expect(Object.keys(festivalDebrief.score)).toEqual([
    "safety",
    "assessment",
    "clinicalDecisions",
    "treatment",
    "reassessment",
    "communication",
    "efficiency",
  ]);
  expect(festivalDebrief.score.assessment).toBe(100);
  expect(festivalDebrief.score.clinicalDecisions).toBe(100);
  expect(festivalDebrief.score.treatment).toBe(100);
  expect(festivalDebrief.score.reassessment).toBe(100);
  expect(festivalDebrief.summary).toContain("anaphylaxis");
  expect(festivalDebrief.summary).not.toContain("trauma center");
  expect(festivalState.currentPhase).toBe("complete");
  expect(festivalState.patient.medicationGiven).toEqual(["epinephrine"]);
  expect(festivalState.patient.oxygenApplied).toBe(true);
  expect(festivalState.patient.vitals).toEqual({
    heartRate: 116,
    respiratoryRate: 22,
    systolicBP: 104,
    diastolicBP: 68,
    spo2: 95,
  });

  expect(crashDebrief.score.assessment).toBe(100);
  expect(crashDebrief.score.clinicalDecisions).toBe(100);
  expect(crashDebrief.score.treatment).toBe(100);
  expect(crashDebrief.score.reassessment).toBe(100);
  expect(crashDebrief.summary).toContain("trauma center");
  expect(crashDebrief.summary).not.toContain("anaphylaxis");
  expect(crashState.currentPhase).toBe("complete");
  expect(crashState.patient.medicationGiven).toEqual([]);
  expect(crashState.patient.oxygenApplied).toBe(true);
  expect(crashState.patient.vitals).toEqual({
    heartRate: 118,
    respiratoryRate: 26,
    systolicBP: 98,
    diastolicBP: 64,
    spo2: 93,
  });

  for (const scenario of [
    hypoglycemiaScenario,
    opioidOverdoseScenario,
    chestPainScenario,
  ]) {
    const state = completeScenario(scenario, ["CRASH_SCENE_INSPECTED"]);
    const debrief = buildScenarioDebrief(state);

    expect(state.currentPhase).toBe("complete");
    expect(state.patient.medicationGiven).toHaveLength(1);
    expect(state.patient.workingImpression).toBeTruthy();
    expect(debrief.score.safety).toBe(100);
    expect(debrief.score.assessment).toBe(100);
    expect(debrief.score.treatment).toBe(100);
    expect(debrief.score.reassessment).toBe(100);
    expect(debrief.summary).toContain("Scenario complete");
    expect(state.patient.oxygenApplied).toBe(
      scenario.id === opioidOverdoseScenario.id ||
        scenario.id === chestPainScenario.id
    );
  }
});

test("secondary assessment unlocks in scenario-specific order before reassessment", () => {
  const advance = (
    scenario: SceneScenarioConfig,
    events: SceneEvent[]
  ) =>
    events.reduce(
      (state, event) => scenarioReducer(scenario, state, { type: "APPLY_EVENT", event }),
      createScenarioState(scenario)
    );

  const festivalState = advance(anaphylaxisFestivalScenario, [
    "DOG_INSPECTED",
    "RADIO_SELECTED",
    "ANIMAL_CONTROL_CALLED",
    "DOG_SECURED",
    "GLOVES_EQUIPPED",
    "PATIENT_APPROACHED",
    "GENERAL_IMPRESSION_OBSERVED",
    "RESPONSIVENESS_CHECKED",
    "AIRWAY_OPENED",
    "RESPIRATIONS_COUNTED",
    "PULSE_CHECKED",
    "WORKING_IMPRESSION_SELECTED",
    "EPINEPHRINE_ADMINISTERED",
    "OXYGEN_APPLIED",
    "TRANSPORT_SELECTED",
    "BLOOD_PRESSURE_OBTAINED",
    "SPO2_OBTAINED",
  ]);
  expect(festivalState.currentPhase).toBe("secondaryAssessment");
  expect(festivalState.currentObjectiveId).toBe("focused-history");
  expect(
    getVisibleInteractiveObjects(anaphylaxisFestivalScenario, festivalState).map(
      (object) => object.id
    )
  ).toContain("focused-history");
  expect(
    getVisibleInteractiveObjects(anaphylaxisFestivalScenario, festivalState).map(
      (object) => object.id
    )
  ).not.toContain("patient-reassessment");

  const festivalExamState = scenarioReducer(
    anaphylaxisFestivalScenario,
    scenarioReducer(anaphylaxisFestivalScenario, festivalState, {
      type: "APPLY_EVENT",
      event: "FOCUSED_HISTORY_OBTAINED",
    }),
    { type: "APPLY_EVENT", event: "FOCUSED_EXAM_COMPLETED" }
  );
  expect(festivalExamState.currentObjectiveId).toBe("treatment-reassessment");
  expect(
    getVisibleInteractiveObjects(anaphylaxisFestivalScenario, festivalExamState).map(
      (object) => object.id
    )
  ).toContain("patient-reassessment");

  const crashState = advance(carAccidentScenario, [
    "CRASH_SCENE_INSPECTED",
    "RADIO_SELECTED",
    "FIRE_RESCUE_CALLED",
    "TRAFFIC_CONTROLLED",
    "GLOVES_EQUIPPED",
    "PATIENT_APPROACHED",
    "GENERAL_IMPRESSION_OBSERVED",
    "RESPONSIVENESS_CHECKED",
    "AIRWAY_OPENED",
    "RESPIRATIONS_COUNTED",
    "OXYGEN_APPLIED",
    "PULSE_CHECKED",
    "BLOOD_PRESSURE_OBTAINED",
    "SPO2_OBTAINED",
    "WORKING_IMPRESSION_SELECTED",
    "TRANSPORT_SELECTED",
    "SPINAL_PRECAUTIONS_MAINTAINED",
    "EXTRICATION_COORDINATED",
  ]);
  expect(crashState.currentPhase).toBe("secondaryAssessment");
  expect(crashState.currentObjectiveId).toBe("rapid-trauma-exam");
  expect(
    getVisibleInteractiveObjects(carAccidentScenario, crashState).map(
      (object) => object.id
    )
  ).toContain("rapid-trauma-exam");
  expect(
    getVisibleInteractiveObjects(carAccidentScenario, crashState).map(
      (object) => object.id
    )
  ).not.toContain("patient-reassessment");

  const crashHistoryState = scenarioReducer(
    carAccidentScenario,
    scenarioReducer(carAccidentScenario, crashState, {
      type: "APPLY_EVENT",
      event: "FOCUSED_EXAM_COMPLETED",
    }),
    { type: "APPLY_EVENT", event: "FOCUSED_HISTORY_OBTAINED" }
  );
  expect(crashHistoryState.currentObjectiveId).toBe("trauma-reassessment");
  expect(
    getVisibleInteractiveObjects(carAccidentScenario, crashHistoryState).map(
      (object) => object.id
    )
  ).toContain("patient-reassessment");
});

test("scenario debrief remembers recoverable clinical and safety mistakes", () => {
  const crashMistake = scenarioReducer(
    carAccidentScenario,
    createScenarioState(carAccidentScenario),
    {
      type: "RUN_ACTION",
      objectId: "crash-vehicle",
      actionId: "rush-to-driver",
    }
  );
  const crashDebrief = buildScenarioDebrief(crashMistake);

  expect(crashMistake.decisionHistory).toHaveLength(1);
  expect(crashMistake.decisionHistory[0].outcome).toBe("incorrect");
  expect(crashMistake.failedObjectives).toContain("crash-hazard");
  expect(crashMistake.elapsedTime).toBe(20);
  expect(crashMistake.score).toBe(72);
  expect(crashDebrief.incorrectDecisions).toBe(1);
  expect(crashDebrief.decisionReview[0].choice).toBe("Run directly to the driver");
  expect(crashDebrief.priorityTakeaway).toContain("active roadway");

  const dogMistake = scenarioReducer(
    anaphylaxisFestivalScenario,
    createScenarioState(anaphylaxisFestivalScenario),
    {
      type: "RUN_ACTION",
      objectId: "dog",
      actionId: "ignore-dog",
    }
  );
  const dogDebrief = buildScenarioDebrief(dogMistake);

  expect(dogMistake.decisionHistory[0].outcome).toBe("incorrect");
  expect(dogMistake.failedObjectives).toContain("dog-hazard");
  expect(dogMistake.elapsedTime).toBe(25);
  expect(dogMistake.score).toBe(70);
  expect(dogDebrief.incorrectDecisions).toBe(1);
  expect(dogDebrief.priorityTakeaway).toContain("dog");

  const recoveredDogState = scenarioReducer(
    anaphylaxisFestivalScenario,
    dogMistake,
    {
      type: "RUN_ACTION",
      objectId: "dog",
      actionId: "inspect-dog",
    }
  );
  expect(recoveredDogState.currentObjectiveId).toBe("use-radio");
  expect(recoveredDogState.selectedObjectId).toBeUndefined();
  expect(recoveredDogState.environment.dogAgitated).toBe(true);
});

test("festival clickable actions treat anaphylaxis before monitor values", () => {
  const run = (
    state: ReturnType<typeof createScenarioState>,
    objectId: string,
    actionId: string
  ) =>
    scenarioReducer(anaphylaxisFestivalScenario, state, {
      type: "RUN_ACTION",
      objectId,
      actionId,
    });
  const event = (
    state: ReturnType<typeof createScenarioState>,
    sceneEvent: SceneEvent
  ) =>
    scenarioReducer(anaphylaxisFestivalScenario, state, {
      type: "APPLY_EVENT",
      event: sceneEvent,
    });

  let state = createScenarioState(anaphylaxisFestivalScenario);
  state = run(state, "dog", "inspect-dog");
  state = scenarioReducer(anaphylaxisFestivalScenario, state, {
    type: "SELECT_OBJECT",
    objectId: "ambulance-radio",
  });
  state = event(state, "DOG_SECURED");
  state = run(state, "medical-bag", "open-medical-bag");
  state = run(state, "medical-bag", "equip-gloves");
  state = run(state, "patient-approach", "approach-patient");
  state = run(state, "patient", "general-impression");
  state = run(state, "patient", "introduce-yourself");
  state = run(state, "airway-hotspot", "inspect-airway");
  state = run(state, "chest-hotspot", "count-respirations");
  state = run(state, "pulse-hotspot", "check-radial-pulse");

  expect(state.currentObjectiveId).toBe("working-impression");
  expect(state.triggeredEvents).not.toContain("BLOOD_PRESSURE_OBTAINED");
  expect(state.triggeredEvents).not.toContain("SPO2_OBTAINED");

  state = run(state, "working-impression", "suspect-severe-allergic-reaction");
  expect(state.currentObjectiveId).toBe("epinephrine-treatment");
  state = run(state, "epinephrine-treatment", "administer-im-epinephrine");
  expect(state.currentObjectiveId).toBe("oxygen-support");
  state = run(state, "oxygen-support", "apply-oxygen-anaphylaxis");
  expect(state.currentObjectiveId).toBe("transport-priority");
  state = run(state, "transport-decision", "urgent-transport");
  expect(state.currentObjectiveId).toBe("baseline-vitals");

  state = event(state, "BLOOD_PRESSURE_OBTAINED");
  state = event(state, "SPO2_OBTAINED");
  state = run(state, "focused-history", "obtain-focused-allergy-history");
  state = run(state, "focused-exam", "perform-focused-anaphylaxis-exam");
  state = run(state, "patient-reassessment", "repeat-abcs-and-vitals-anaphylaxis");

  expect(state.currentPhase).toBe("complete");
  expect(state.decisionHistory.every((decision) => decision.outcome === "correct")).toBe(true);
  expect(state.patient.medicationGiven).toEqual(["epinephrine"]);
  expect(state.patient.oxygenApplied).toBe(true);
});

test("crash clickable actions complete safety, breathing support, and extrication independently", () => {
  const run = (
    state: ReturnType<typeof createScenarioState>,
    objectId: string,
    actionId: string
  ) =>
    scenarioReducer(carAccidentScenario, state, {
      type: "RUN_ACTION",
      objectId,
      actionId,
    });
  const event = (
    state: ReturnType<typeof createScenarioState>,
    sceneEvent: SceneEvent
  ) =>
    scenarioReducer(carAccidentScenario, state, {
      type: "APPLY_EVENT",
      event: sceneEvent,
    });

  let state = createScenarioState(carAccidentScenario);
  state = run(state, "crash-vehicle", "inspect-crash-from-distance");
  state = scenarioReducer(carAccidentScenario, state, {
    type: "SELECT_OBJECT",
    objectId: "ambulance-radio",
  });
  state = event(state, "TRAFFIC_CONTROLLED");
  state = run(state, "medical-bag", "open-medical-bag");
  state = run(state, "medical-bag", "equip-gloves");
  state = run(state, "patient-approach", "approach-driver");
  state = run(state, "patient", "observe-trauma-impression");
  state = run(state, "patient", "verbal-responsiveness-trauma");
  state = run(state, "airway-hotspot", "assess-airway-with-stabilization");
  state = run(state, "chest-hotspot", "assess-trauma-breathing");

  expect(state.currentObjectiveId).toBe("oxygen-support");
  state = event(state, "OXYGEN_APPLIED");
  expect(state.currentObjectiveId).toBe("circulation");

  state = run(state, "pulse-hotspot", "assess-trauma-circulation");
  state = event(state, "BLOOD_PRESSURE_OBTAINED");
  state = event(state, "SPO2_OBTAINED");
  state = run(state, "working-impression", "multisystem-trauma");
  state = run(state, "transport-decision", "rapid-trauma-transport");
  state = run(state, "spinal-protection", "maintain-spinal-precautions");
  state = run(state, "extrication-plan", "coordinate-controlled-extrication");
  state = run(state, "rapid-trauma-exam", "perform-rapid-trauma-exam");
  state = run(state, "focused-history", "obtain-ample-and-neurologic-checks");
  state = run(state, "patient-reassessment", "repeat-trauma-primary-and-vitals");

  expect(state.currentPhase).toBe("complete");
  expect(state.decisionHistory.every((decision) => decision.outcome === "correct")).toBe(true);
  expect(state.patient.medicationGiven).toEqual([]);
  expect(state.patient.oxygenApplied).toBe(true);
  expect(buildScenarioDebrief(state).summary).toContain("trauma center");
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

test("keyboard users can reach the main content skip target", async ({ page }) => {
  await page.goto("/flashcards");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await expect(page.locator("#main-content")).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(
    page.locator('header a[href="/flashcards"]').first()
  ).toHaveAttribute("aria-current", "page");
});

test("flashcards reveal answers and advance cleanly", async ({ page }) => {
  await page.goto("/flashcards");

  await expect(
    page.getByRole("combobox", { name: "Filter flashcards by domain" })
  ).toBeVisible();
  const reveal = page.getByRole("button", { name: "Reveal the answer" });
  await expect(reveal).toBeVisible();
  await reveal.click();
  await expect(page.getByRole("button", { name: "Show the question" })).toBeVisible();

  await page.getByRole("button", { name: "Next flashcard" }).click();
  await expect(page.getByText("Card 2 of 52")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reveal the answer" })).toBeVisible();
});

test("scenario trainer recovers after its initial question request fails", async ({
  page,
}) => {
  let requestCount = 0;
  await page.route("**/api/test", async (route) => {
    requestCount += 1;
    if (requestCount === 1) {
      await route.fulfill({
        status: 503,
        json: { error: "Question service unavailable." },
      });
      return;
    }
    await route.fulfill({ status: 200, json: [practiceItem] });
  });

  await page.goto("/emtrainer");
  await expect(
    page.getByRole("heading", { name: "Practice questions did not load" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Retry questions" }).click();
  await expect(page.getByText(practiceItem.vignette)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("signed-out practice gives feedback without attempting a progress save", async ({
  page,
}) => {
  let practiceSaveRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/practice/answer")) {
      practiceSaveRequests += 1;
    }
  });

  await page.goto("/emtrainer");
  await page
    .getByRole("button", {
      name: /Open the airway with a jaw-thrust maneuver/,
    })
    .click();

  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "Answer checked. Sign in to save this result to your progress and streak."
    )
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in to save" })
  ).toHaveAttribute("href", "/login");
  await expect(
    page.getByText(
      "Your answer is shown, but it could not be added to your progress."
    )
  ).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Runtime Error" })).toHaveCount(
    0
  );
  expect(practiceSaveRequests).toBe(0);
  await expectNoHorizontalOverflow(page);
});

test("flashcards recover after the deck request fails", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("pathologix:theme", "dark");
  });
  let requestCount = 0;
  await page.route("**/rest/v1/flashcards*", async (route) => {
    requestCount += 1;
    if (requestCount === 1) {
      await route.fulfill({
        status: 503,
        json: { message: "Deck service unavailable." },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify([
        {
          id: "retry-card",
          domain: "Airway",
          topic: "Airway Assessment",
          front: "What finding suggests an upper-airway obstruction?",
          back: "Snoring respirations suggest soft-tissue obstruction.",
          tags: ["NREMT"],
          difficulty: "Moderate",
        },
      ]),
    });
  });

  await page.goto("/flashcards");
  await expect(
    page.getByRole("heading", { name: "Flashcards did not load" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Retry deck" }).click();
  const revealAnswer = page.getByRole("button", { name: "Reveal the answer" });
  await expect(revealAnswer).toBeVisible();
  await revealAnswer.click();

  const answer = page.getByText(
    "Snoring respirations suggest soft-tissue obstruction."
  );
  await expect(answer).toBeVisible();
  await page.waitForTimeout(300);
  const answerColors = await answer.evaluate((element) => {
    const card = element.closest("button");
    const parseRgb = (value: string) =>
      value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
    const luminance = (channels: number[]) =>
      channels
        .map((channel) => channel / 255)
        .map((channel) =>
          channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
        )
        .reduce(
          (total, channel, index) =>
            total + channel * [0.2126, 0.7152, 0.0722][index],
          0
        );
    const foreground = luminance(
      parseRgb(window.getComputedStyle(element).color)
    );
    const background = luminance(
      parseRgb(card ? window.getComputedStyle(card).backgroundColor : "")
    );

    return {
      background: card ? window.getComputedStyle(card).backgroundColor : "",
      contrast:
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05),
    };
  });
  expect(answerColors.background).toBe("rgb(13, 41, 47)");
  expect(answerColors.contrast).toBeGreaterThanOrEqual(4.5);
  await expectNoHorizontalOverflow(page);
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

  if (!testInfo.project.name.startsWith("mobile")) {
    const scenarioTimer = page.locator('[data-testid="scenario-timer"]:visible');
    const initialTimerValue = await scenarioTimer.textContent();
    await expect
      .poll(() => scenarioTimer.textContent(), {
        message: "scenario timer should advance in real time",
        timeout: 3_000,
      })
      .not.toBe(initialTimerValue);

    const endScenarioButton = page.getByRole("button", {
      name: "End Scenario",
      exact: true,
    });
    await endScenarioButton.click();
    const endScenarioDialog = page.getByRole("dialog", {
      name: "End this scenario?",
    });
    await expect(endScenarioDialog).toBeVisible();
    await expect(
      endScenarioDialog.getByRole("button", { name: "Continue scenario" })
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(endScenarioDialog).toHaveCount(0);
    await expect(endScenarioButton).toBeFocused();

    await canvas.evaluate((element) => {
      element.dataset.cameraResetSentinel = "before-reset";
    });
    await endScenarioButton.click();
    await endScenarioDialog
      .getByRole("button", { name: "End and reset" })
      .click();
    await expect(canvas).not.toHaveAttribute(
      "data-camera-reset-sentinel",
      "before-reset"
    );
  }

  const recommendedDog = page.getByRole("button", {
    name: "Recommended next object: Barking Dog",
  });
  await expect(recommendedDog).toBeVisible();
  await expect(page.getByText("Barking Dog", { exact: true }).first()).toBeVisible();
  await recommendedDog.focus();
  await expect(recommendedDog).toBeFocused();
  await recommendedDog.press("Enter");
  const decisionPrompt = page.getByTestId("scene-decision-prompt");
  await expect(decisionPrompt).toBeVisible();
  await expect(decisionPrompt).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Close action choices for Barking Dog" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ignore dog and approach patient" })
    .click();
  await expect(page.getByText("Barking Louder", { exact: true }).first()).toBeVisible();
  await expect(decisionPrompt).toBeVisible();
  await page.getByRole("button", { name: "Inspect from distance" }).click();
  await expect(decisionPrompt).toHaveCount(0);

  if (testInfo.project.name.startsWith("mobile")) {
    const hudToggle = page.getByRole("button", { name: "Show HUD" });
    await hudToggle.click();
    const mobileHud = page.getByTestId("mobile-hud-panel");
    const closeHud = page.getByRole("button", { name: "Close HUD" });
    await expect(mobileHud).toBeVisible();
    await expect(closeHud).toBeFocused();
    await mobileHud.getByRole("button", { name: "Dispatch" }).click();
    const scenarioTimer = page.locator('[data-testid="scenario-timer"]:visible');
    const initialTimerValue = await scenarioTimer.textContent();
    await expect
      .poll(() => scenarioTimer.textContent(), {
        message: "mobile scenario timer should advance in real time",
        timeout: 3_000,
      })
      .not.toBe(initialTimerValue);
    await page.keyboard.press("Shift+Tab");
    await expect
      .poll(() =>
        page.evaluate(() =>
          Boolean(
            document
              .getElementById("mobile-hud-panel")
              ?.contains(document.activeElement)
          )
        )
      )
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(mobileHud).toHaveCount(0);
    await expect(hudToggle).toBeFocused();

    await hudToggle.click();
    await page
      .getByTestId("mobile-hud-panel")
      .getByRole("button", { name: "Dispatch" })
      .click();
    await page
      .getByTestId("mobile-hud-panel")
      .getByRole("button", { name: "End scenario" })
      .click();
    const endScenarioDialog = page.getByRole("dialog", {
      name: "End this scenario?",
    });
    await expect(endScenarioDialog).toBeVisible();
    await expect(
      endScenarioDialog.getByRole("button", { name: "Continue scenario" })
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(endScenarioDialog).toHaveCount(0);
    await expect(hudToggle).toBeFocused();

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
    ).toBeVisible({ timeout: 30_000 });
  } else {
    await expect(page.getByText("Active Dispatch")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Teen With Shortness of Breath",
        exact: true,
      })
    ).toBeVisible();
    await page.getByRole("button", { name: "Objectives" }).click();
    await expect(page.getByTestId("scene-objective-prompt")).toBeFocused();
    await page
      .getByLabel("Select scenario")
      .selectOption({ label: "Driver Trapped After Collision" });
    await expect(
      page.getByRole("heading", {
        name: "Driver Trapped After Collision",
        exact: true,
      })
    ).toBeVisible({ timeout: 30_000 });
  }

  await expect(sceneLoader).toBeHidden({ timeout: 120_000 });
  await expect(page.getByText("Smoking Crash Vehicle", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.locator(
      'head link[rel="preload"][href="/models/emt-scene/custom/ambulance-optimized.glb"]'
    )
  ).toHaveCount(1);
  const canvasDimensions = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    const bounds = canvasElement.getBoundingClientRect();
    return {
      width: canvasElement.width,
      height: canvasElement.height,
      cssWidth: bounds.width,
      cssHeight: bounds.height,
    };
  });
  expect(canvasDimensions.width).toBeGreaterThan(0);
  expect(canvasDimensions.height).toBeGreaterThan(0);
  const renderScale = canvasDimensions.width / canvasDimensions.cssWidth;
  expect(renderScale).toBeLessThanOrEqual(
    testInfo.project.name.startsWith("mobile") ? 1.1 : 1.4
  );
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

  await page.goto("/login?reset=1");
  await expect(
    page.getByRole("heading", { name: "Choose a new password" })
  ).toBeVisible();
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Confirm new password", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Verifying your secure reset link...")
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update password" })
  ).toBeDisabled();
});

test("all learn articles remain readable in dark mode", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("pathologix:theme", "dark");
  });

  for (const article of learnArticles) {
    await page.goto(`/learn/${article.slug}`);

    const keyPoints = page.getByTestId("article-key-points");
    const firstKeyPoint = keyPoints.locator("li").first();
    const articleNotes = page.getByTestId("article-note");

    await expect(page.getByRole("heading", { name: article.title })).toBeVisible();
    await expect(keyPoints).toBeVisible();
    expect(await getContrastRatio(firstKeyPoint)).toBeGreaterThanOrEqual(4.5);

    for (let noteIndex = 0; noteIndex < (await articleNotes.count()); noteIndex += 1) {
      const articleNote = articleNotes.nth(noteIndex);
      await expect(articleNote).toBeVisible();
      expect(await getContrastRatio(articleNote)).toBeGreaterThanOrEqual(4.5);
    }

    await expectNoHorizontalOverflow(page);
  }
});

test("Exam Mode redirects signed-out learners to login", async ({ page }) => {
  await page.goto("/exam/nremt");
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("first-run onboarding preserves its destination while signed out", async ({
  page,
}) => {
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Sign in to PathoLogix" })
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("pathologix:redirect_after_login")
    )
  ).toBe("/welcome");
  await expectNoHorizontalOverflow(page);
});

test("progress sign-in gate preserves a useful browser back path", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "View progress" }).click();

  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Sign in to PathoLogix" })
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("pathologix:redirect_after_login")
    )
  ).toBe("/progress");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "PathoLogix", exact: true })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("mobile navigation exposes every primary destination", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/flashcards");

  const navigationToggle = page.getByRole("button", { name: "Open navigation" });
  await navigationToggle.click();
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
  await expect(
    mobileNavigation.getByRole("link", { name: "Flashcards", exact: true })
  ).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Escape");
  await expect(mobileNavigation).toHaveCount(0);
  await expect(navigationToggle).toBeFocused();
});
