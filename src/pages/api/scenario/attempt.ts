import type { NextApiRequest, NextApiResponse } from "next";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const SCENARIO_IDS = new Set(["anaphylaxis", "car-accident"]);
const SIMULATION_MODES = new Set(["guided", "scenario", "exam"]);
const RUN_ID_PATTERN = /^emt-scene:\d{10,}:[a-z0-9]{5,20}$/;
const SCORE_KEYS = new Set([
  "safety",
  "assessment",
  "clinicalDecisions",
  "treatment",
  "reassessment",
  "communication",
  "efficiency",
]);

function sanitizeScoreBreakdown(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, score]) =>
          SCORE_KEYS.has(key) &&
          typeof score === "number" &&
          Number.isFinite(score)
      )
      .map(([key, score]) => [
        key,
        Math.max(0, Math.min(100, Math.round(score as number))),
      ])
  );
}

function getScorePercent(
  scoreBreakdown: Record<string, number>,
  completedObjectives: number,
  totalObjectives: number
) {
  const scores = Object.values(scoreBreakdown);
  if (scores.length) {
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
  }
  return Math.round((completedObjectives / totalObjectives) * 100);
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
      name: "scenario-attempt",
      limit: 180,
      windowMs: 10 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  const {
    action,
    runId,
    scenarioId,
    simulationMode,
    completedObjectives,
    totalObjectives,
    scoreBreakdown,
    elapsedSeconds,
    hintsUsed,
  } = req.body ?? {};

  if (
    (action !== "start" &&
      action !== "progress" &&
      action !== "abandon") ||
    typeof runId !== "string" ||
    !RUN_ID_PATTERN.test(runId)
  ) {
    return res.status(400).json({ error: "Invalid scenario attempt request." });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      error: "Scenario history is temporarily unavailable.",
    });
  }

  if (action === "start") {
    if (
      typeof scenarioId !== "string" ||
      !SCENARIO_IDS.has(scenarioId) ||
      typeof simulationMode !== "string" ||
      !SIMULATION_MODES.has(simulationMode) ||
      !Number.isInteger(totalObjectives) ||
      totalObjectives < 1 ||
      totalObjectives > 100
    ) {
      return res.status(400).json({ error: "Invalid scenario start payload." });
    }

    const { data: existing } = await admin
      .from("scenario_attempts")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("run_id", runId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        ok: true,
        status: existing.status,
      });
    }

    const { error } = await admin.from("scenario_attempts").insert({
      user_id: user.id,
      run_id: runId,
      scenario_id: scenarioId,
      simulation_mode: simulationMode,
      total_objectives: totalObjectives,
    });

    if (error) {
      if (error.code === "23505") {
        const { data: racedAttempt } = await admin
          .from("scenario_attempts")
          .select("status")
          .eq("user_id", user.id)
          .eq("run_id", runId)
          .maybeSingle();

        if (racedAttempt) {
          return res.status(200).json({
            ok: true,
            status: racedAttempt.status,
          });
        }
      }

      console.error("Unable to start scenario attempt:", error.message);
      return res.status(503).json({ error: "Unable to start scenario history." });
    }

    return res.status(200).json({ ok: true, status: "active" });
  }

  const { data: attempt, error: attemptError } = await admin
    .from("scenario_attempts")
    .select(
      "id, status, completed_objectives, total_objectives, elapsed_seconds, hints_used"
    )
    .eq("user_id", user.id)
    .eq("run_id", runId)
    .maybeSingle();

  if (attemptError || !attempt) {
    return res.status(404).json({ error: "Scenario attempt not found." });
  }

  if (action === "abandon") {
    if (attempt.status === "active") {
      const { error } = await admin
        .from("scenario_attempts")
        .update({
          status: "abandoned",
          abandoned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", attempt.id)
        .eq("status", "active");

      if (error) {
        return res.status(500).json({ error: "Unable to end scenario attempt." });
      }
    }

    return res.status(200).json({ ok: true, status: "abandoned" });
  }

  if (
    !Number.isInteger(completedObjectives) ||
    completedObjectives < 0 ||
    completedObjectives > attempt.total_objectives ||
    !Number.isInteger(elapsedSeconds) ||
    elapsedSeconds < 0 ||
    elapsedSeconds > 86400 ||
    !Number.isInteger(hintsUsed) ||
    hintsUsed < 0 ||
    hintsUsed > 100
  ) {
    return res.status(400).json({ error: "Invalid scenario progress payload." });
  }

  if (attempt.status !== "active") {
    return res.status(200).json({ ok: true, status: attempt.status });
  }

  const nextCompletedObjectives = Math.max(
    attempt.completed_objectives,
    completedObjectives
  );
  const nextElapsedSeconds = Math.max(attempt.elapsed_seconds, elapsedSeconds);
  const nextHintsUsed = Math.max(attempt.hints_used, hintsUsed);
  const safeScoreBreakdown = sanitizeScoreBreakdown(
    scoreBreakdown
  ) as Record<string, number>;
  const complete =
    nextCompletedObjectives === attempt.total_objectives;
  const now = new Date().toISOString();
  const scorePercent = getScorePercent(
    safeScoreBreakdown,
    nextCompletedObjectives,
    attempt.total_objectives
  );

  const { error: updateError } = await admin
    .from("scenario_attempts")
    .update({
      completed_objectives: nextCompletedObjectives,
      elapsed_seconds: nextElapsedSeconds,
      hints_used: nextHintsUsed,
      score_breakdown: safeScoreBreakdown,
      score_percent: scorePercent,
      status: complete ? "completed" : "active",
      completed_at: complete ? now : null,
      updated_at: now,
    })
    .eq("id", attempt.id)
    .eq("status", "active");

  if (updateError) {
    console.error("Unable to save scenario progress:", updateError.message);
    return res.status(500).json({ error: "Unable to save scenario progress." });
  }

  return res.status(200).json({
    ok: true,
    status: complete ? "completed" : "active",
    scorePercent,
  });
}
