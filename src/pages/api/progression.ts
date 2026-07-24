import type { NextApiRequest, NextApiResponse } from "next";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

type ProgressRow = {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  legacy_imported_at?: string | null;
};

const XP_BY_EVENT = {
  scenario_objective: 10,
  scenario_complete: 40,
} as const;

function toClientProgress(row?: ProgressRow | null) {
  return {
    totalXp: row?.total_xp ?? 0,
    currentStreak: row?.current_streak ?? 0,
    longestStreak: row?.longest_streak ?? 0,
    lastActiveDate: row?.last_active_date ?? null,
  };
}

function isProgressionTableMissing(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("learner_progress") === true
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;
  if (
    !enforceRateLimit(req, res, {
      name: `progression-${req.method.toLowerCase()}`,
      limit: req.method === "GET" ? 60 : 120,
      windowMs: 10 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      error: "Account progression is temporarily unavailable.",
    });
  }

  if (req.method === "GET") {
    const { data, error } = await admin
      .from("learner_progress")
      .select(
        "total_xp, current_streak, longest_streak, last_active_date, legacy_imported_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      if (isProgressionTableMissing(error)) {
        return res.status(200).json({
          persistenceAvailable: false,
          progress: toClientProgress(),
          legacyImported: false,
        });
      }

      console.error("Unable to load learner progress:", error.message);
      return res.status(500).json({ error: "Unable to load your progress." });
    }

    return res.status(200).json({
      persistenceAvailable: true,
      progress: toClientProgress(data),
      legacyImported: Boolean(data?.legacy_imported_at),
    });
  }

  const { action } = req.body ?? {};
  if (action === "import") {
    const {
      totalXp,
      currentStreak,
      longestStreak,
      lastActiveDate,
    } = req.body ?? {};

    if (
      !Number.isInteger(totalXp) ||
      totalXp < 0 ||
      totalXp > 50000 ||
      !Number.isInteger(currentStreak) ||
      currentStreak < 0 ||
      currentStreak > 3650 ||
      !Number.isInteger(longestStreak) ||
      longestStreak < currentStreak ||
      longestStreak > 3650 ||
      (lastActiveDate !== null &&
        (typeof lastActiveDate !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(lastActiveDate)))
    ) {
      return res.status(400).json({ error: "Invalid legacy progress payload." });
    }

    const { data, error } = await admin.rpc(
      "import_legacy_learner_progress",
      {
        p_user_id: user.id,
        p_total_xp: totalXp,
        p_current_streak: currentStreak,
        p_longest_streak: longestStreak,
        p_last_active_date: lastActiveDate,
      }
    );

    if (error) {
      console.error("Unable to import learner progress:", error.message);
      return res.status(500).json({ error: "Unable to sync your existing progress." });
    }

    return res.status(200).json({
      persistenceAvailable: true,
      progress: toClientProgress(data?.[0]),
    });
  }

  if (action === "award") {
    const { awardId, eventType, metadata } = req.body ?? {};
    const xp =
      typeof eventType === "string" &&
      eventType in XP_BY_EVENT
        ? XP_BY_EVENT[eventType as keyof typeof XP_BY_EVENT]
        : null;

    if (
      typeof awardId !== "string" ||
      awardId.length < 3 ||
      awardId.length > 180 ||
      !awardId.startsWith("emt-scene:") ||
      xp === null
    ) {
      return res.status(400).json({ error: "Invalid progression award." });
    }

    const safeMetadata =
      metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? {
            scenarioId:
              typeof metadata.scenarioId === "string"
                ? metadata.scenarioId.slice(0, 80)
                : undefined,
            objectiveId:
              typeof metadata.objectiveId === "string"
                ? metadata.objectiveId.slice(0, 100)
                : undefined,
          }
        : {};

    const { data, error } = await admin.rpc("award_learner_progress", {
      p_user_id: user.id,
      p_award_id: awardId,
      p_event_type: eventType,
      p_xp: xp,
      p_metadata: safeMetadata,
    });

    if (error) {
      console.error("Unable to save learner XP:", error.message);
      return res.status(500).json({ error: "Unable to save this XP award." });
    }

    const row = data?.[0];
    return res.status(200).json({
      awarded: Boolean(row?.awarded),
      persistenceAvailable: true,
      progress: toClientProgress(row),
    });
  }

  return res.status(400).json({ error: "Invalid progression action." });
}
