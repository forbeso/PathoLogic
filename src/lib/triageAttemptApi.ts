import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { supabase } from "@/lib/supabase";
import type {
  PatientRuntimeState,
  SimulationMode,
  SimulationStatus,
} from "@/features/triage/types";

type CompletionStatus = Extract<SimulationStatus, "completed" | "timed-out">;

export type TriageCompletionInput = {
  runId: string;
  scenarioId: string;
  mode: SimulationMode;
  status: CompletionStatus;
  elapsedSeconds: number;
  patients: Record<string, PatientRuntimeState>;
};

export type TriageCompletionResult =
  | { status: "signed-out" }
  | {
      status: "saved";
      awarded: boolean;
      xp: number;
      progress?: {
        totalXp: number;
        currentStreak: number;
        longestStreak: number;
        lastActiveDate: string | null;
      };
    };

export async function saveTriageCompletion(
  input: TriageCompletionInput
): Promise<TriageCompletionResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { status: "signed-out" };

  const patientResults = Object.entries(input.patients).map(
    ([patientId, runtime]) => ({
      patientId,
      assignedCategory: runtime.assignedCategory,
      actionsTaken: runtime.actionsTaken,
    })
  );
  const response = await authenticatedFetch("/api/triage/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      patients: patientResults,
    }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Unable to save this triage attempt.");
  }

  return {
    status: "saved",
    awarded: Boolean(data?.awarded),
    xp: Number(data?.xp) || 0,
    progress: data?.progress,
  };
}
