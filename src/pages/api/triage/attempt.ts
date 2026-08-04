import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyPatientIntervention,
  buildTriageDebrief,
  getAvailableInterventions,
} from "@/features/triage/engine";
import { highwayCollisionScenario } from "@/features/triage/scenario";
import type {
  PatientRuntimeState,
  SimulationMode,
  TriageCategory,
  TriageInterventionId,
} from "@/features/triage/types";
import { enforceRateLimit, requireApiUser } from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const RUN_ID_PATTERN = /^triage:\d{10,}:[a-z0-9]{5,20}$/;
const CATEGORIES = new Set<TriageCategory>([
  "immediate",
  "delayed",
  "minimal",
  "expectant",
  "dead",
]);
const MODES = new Set<SimulationMode>(["learn", "challenge"]);

type SubmittedPatient = {
  patientId: string;
  assignedCategory: TriageCategory | null;
  actionsTaken: TriageInterventionId[];
};

type ProgressRow = {
  awarded: boolean;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

function isMissingTriagePersistence(error: {
  code?: string;
  message?: string;
} | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("triage_attempts"))
  );
}

function sanitizePatients(value: unknown): SubmittedPatient[] | null {
  if (!Array.isArray(value) || value.length !== highwayCollisionScenario.patients.length) {
    return null;
  }

  const knownPatients = new Map(
    highwayCollisionScenario.patients.map((patient) => [patient.id, patient])
  );
  const seen = new Set<string>();
  const sanitized: SubmittedPatient[] = [];

  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return null;
    }
    const patientId = (candidate as { patientId?: unknown }).patientId;
    const assignedCategory = (candidate as { assignedCategory?: unknown })
      .assignedCategory;
    const actionsTaken = (candidate as { actionsTaken?: unknown }).actionsTaken;
    const patient = typeof patientId === "string" ? knownPatients.get(patientId) : null;

    if (
      !patient ||
      seen.has(patient.id) ||
      (assignedCategory !== null &&
        (typeof assignedCategory !== "string" ||
          !CATEGORIES.has(assignedCategory as TriageCategory))) ||
      !Array.isArray(actionsTaken)
    ) {
      return null;
    }

    const availableActions = new Set(
      getAvailableInterventions(patient, highwayCollisionScenario).map(
        (intervention) => intervention.id
      )
    );
    const safeActions = actionsTaken.filter(
      (action): action is TriageInterventionId =>
        typeof action === "string" &&
        availableActions.has(action as TriageInterventionId)
    );

    if (safeActions.length !== actionsTaken.length || new Set(safeActions).size !== safeActions.length) {
      return null;
    }

    seen.add(patient.id);
    sanitized.push({
      patientId: patient.id,
      assignedCategory: assignedCategory as TriageCategory | null,
      actionsTaken: safeActions,
    });
  }

  return sanitized;
}

function buildRuntimePatients(patients: SubmittedPatient[]) {
  return Object.fromEntries(
    patients.map((submitted) => {
      const patient = highwayCollisionScenario.patients.find(
        (candidate) => candidate.id === submitted.patientId
      )!;
      const findings = submitted.actionsTaken.reduce(
        (current, interventionId) =>
          applyPatientIntervention(patient, current, interventionId),
        { ...patient.initialFindings }
      );

      return [
        patient.id,
        {
          findings,
          actionsTaken: submitted.actionsTaken,
          assignedCategory: submitted.assignedCategory,
          locked: submitted.assignedCategory !== null,
        } satisfies PatientRuntimeState,
      ];
    })
  );
}

function getCompletionXp(
  mode: SimulationMode,
  status: "completed" | "timed-out",
  accuracy: number,
  correctInterventions: number
) {
  const completionXp = status === "completed" ? 35 : 15;
  const accuracyXp = Math.round(Math.max(0, Math.min(100, accuracy)) * 0.4);
  const interventionXp = Math.min(15, correctInterventions * 5);
  const challengeXp = mode === "challenge" && status === "completed" ? 10 : 0;
  return completionXp + accuracyXp + interventionXp + challengeXp;
}

function toClientProgress(row?: ProgressRow | null) {
  if (!row) return undefined;
  return {
    totalXp: row.total_xp,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveDate: row.last_active_date,
  };
}

async function awardCompletion(
  admin: SupabaseClient<any>,
  userId: string,
  runId: string,
  xp: number,
  metadata: Record<string, string | number>
) {
  return admin.rpc("award_learner_progress", {
    p_user_id: userId,
    p_award_id: `${runId}:complete`,
    p_event_type: "triage_complete",
    p_xp: xp,
    p_metadata: metadata,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;
  if (
    !enforceRateLimit(req, res, {
      name: "triage-attempt",
      limit: 30,
      windowMs: 10 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  const { runId, scenarioId, mode, status, elapsedSeconds, patients } = req.body ?? {};
  const safePatients = sanitizePatients(patients);
  if (
    typeof runId !== "string" ||
    !RUN_ID_PATTERN.test(runId) ||
    scenarioId !== highwayCollisionScenario.id ||
    typeof mode !== "string" ||
    !MODES.has(mode as SimulationMode) ||
    (status !== "completed" && status !== "timed-out") ||
    !Number.isInteger(elapsedSeconds) ||
    elapsedSeconds < 0 ||
    elapsedSeconds > 3600 ||
    !safePatients
  ) {
    return res.status(400).json({ error: "Invalid triage completion payload." });
  }

  if (
    status === "completed" &&
    safePatients.some((patient) => patient.assignedCategory === null)
  ) {
    return res.status(400).json({ error: "Every patient must be tagged before completion." });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: "Triage history is temporarily unavailable." });
  }

  const runtimePatients = buildRuntimePatients(safePatients);
  const debrief = buildTriageDebrief(
    highwayCollisionScenario,
    runtimePatients,
    elapsedSeconds
  );
  const xp = getCompletionXp(
    mode as SimulationMode,
    status,
    debrief.accuracy,
    debrief.correctInterventions
  );
  const patientResults = debrief.patients.map((result) => ({
    patientId: result.patient.id,
    assignedCategory: result.assignedCategory,
    correctCategory: result.correctCategory,
    actionsTaken: result.actionsTaken,
    difference: result.difference,
  }));
  const now = new Date().toISOString();

  const { error: attemptError } = await admin.from("triage_attempts").upsert(
    {
      user_id: user.id,
      run_id: runId,
      scenario_id: highwayCollisionScenario.id,
      simulation_mode: mode,
      outcome: status,
      score: debrief.score,
      accuracy: debrief.accuracy,
      correct_classifications: debrief.correctClassifications,
      correct_interventions: debrief.correctInterventions,
      over_triage: debrief.overTriage,
      under_triage: debrief.underTriage,
      untagged: debrief.untagged,
      elapsed_seconds: elapsedSeconds,
      patient_results: patientResults,
      completed_at: now,
    },
    { onConflict: "user_id,run_id", ignoreDuplicates: true }
  );

  if (attemptError) {
    if (isMissingTriagePersistence(attemptError)) {
      return res.status(503).json({ error: "Triage history needs the latest database update." });
    }
    console.error("Unable to save triage attempt:", attemptError.message);
    return res.status(500).json({ error: "Unable to save this triage attempt." });
  }

  const { data: progressData, error: progressError } = await awardCompletion(
    admin,
    user.id,
    runId,
    xp,
    {
      scenarioId: highwayCollisionScenario.id,
      mode,
      outcome: status,
      accuracy: debrief.accuracy,
      score: debrief.score,
    }
  );

  if (progressError) {
    console.error("Unable to award triage completion XP:", progressError.message);
    return res.status(503).json({ error: "Your triage result saved, but XP could not be updated." });
  }

  const progress = progressData?.[0] as ProgressRow | undefined;
  return res.status(200).json({
    ok: true,
    awarded: Boolean(progress?.awarded),
    xp,
    progress: toClientProgress(progress),
  });
}
