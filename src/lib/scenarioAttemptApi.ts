import { authenticatedFetch } from "@/lib/authenticatedFetch";

type SimulationMode = "guided" | "scenario" | "exam";

type StartScenarioAttempt = {
  runId: string;
  scenarioId: string;
  simulationMode: SimulationMode;
  totalObjectives: number;
};

type SaveScenarioProgress = {
  runId: string;
  completedObjectives: number;
  scoreBreakdown: Record<string, number>;
  elapsedSeconds: number;
  hintsUsed: number;
};

async function sendScenarioAttempt(body: Record<string, unknown>) {
  const response = await authenticatedFetch("/api/scenario/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Unable to save scenario history.");
  }
  return data;
}

export function startScenarioAttempt(input: StartScenarioAttempt) {
  return sendScenarioAttempt({ action: "start", ...input });
}

export function saveScenarioProgress(input: SaveScenarioProgress) {
  return sendScenarioAttempt({ action: "progress", ...input });
}

export function abandonScenarioAttempt(runId: string) {
  return sendScenarioAttempt({ action: "abandon", runId });
}
