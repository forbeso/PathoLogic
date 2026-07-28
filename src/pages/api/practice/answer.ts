import type { NextApiRequest, NextApiResponse } from "next";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

type StoredChoice = {
  id: string;
  correct: boolean;
};

type PracticePerformance = {
  accuracy: number;
  attempts: number;
};

function isStoredChoice(value: unknown): value is StoredChoice {
  if (!value || typeof value !== "object") return false;
  const choice = value as Partial<StoredChoice>;
  return (
    typeof choice.id === "string" &&
    typeof choice.correct === "boolean"
  );
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function updatePracticePerformance(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  userId: string,
  topic: string,
  correct: boolean
): Promise<PracticePerformance> {
  const readPerformance = () =>
    admin
      .from("performance")
      .select("accuracy, attempts")
      .eq("user_id", userId)
      .eq("topic", topic)
      .maybeSingle();

  const writeExistingPerformance = async (existing: {
    accuracy?: number | null;
    attempts?: number | null;
  }) => {
    const previousAccuracy = Number(existing.accuracy) || 0;
    const previousAttempts = Math.max(0, Number(existing.attempts) || 0);
    const attempts = previousAttempts + 1;
    const accuracy =
      (previousAccuracy * previousAttempts + (correct ? 1 : 0)) / attempts;
    const { error } = await admin
      .from("performance")
      .update({
        accuracy,
        attempts,
        last_practiced: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("topic", topic);

    if (error) throw error;
    return { accuracy, attempts };
  };

  const { data: existing, error: readError } = await readPerformance();
  if (readError) throw readError;
  if (existing) return writeExistingPerformance(existing);

  const initial: PracticePerformance = {
    accuracy: correct ? 1 : 0,
    attempts: 1,
  };
  const { error: insertError } = await admin.from("performance").insert({
    user_id: userId,
    topic,
    ...initial,
    last_practiced: new Date().toISOString(),
  });

  if (!insertError) return initial;
  if (insertError.code !== "23505") throw insertError;

  // A simultaneous answer may have created the topic aggregate after our read.
  const { data: concurrent, error: concurrentReadError } =
    await readPerformance();
  if (concurrentReadError || !concurrent) {
    throw concurrentReadError ?? insertError;
  }
  return writeExistingPerformance(concurrent);
}

async function recordPracticeAttemptFallback({
  admin,
  userId,
  attemptId,
  source,
  itemId,
  generatedScenarioId,
  domain,
  topic,
  selectedChoiceId,
  correct,
}: {
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>;
  userId: string;
  attemptId: string;
  source: "static" | "generated";
  itemId: string | null;
  generatedScenarioId: number | null;
  domain: string;
  topic: string;
  selectedChoiceId: string;
  correct: boolean;
}) {
  const { data: insertedRows, error: insertError } = await admin
    .from("practice_attempts")
    .upsert(
      {
        user_id: userId,
        attempt_id: attemptId,
        source,
        item_id: itemId,
        generated_scenario_id: generatedScenarioId,
        domain,
        topic,
        selected_choice_id: selectedChoiceId,
        is_correct: correct,
      },
      {
        onConflict: "user_id,attempt_id",
        ignoreDuplicates: true,
      }
    )
    .select("id");

  if (insertError) throw insertError;
  const recorded = Array.isArray(insertedRows) && insertedRows.length > 0;

  if (!recorded) {
    const { data: existingPerformance, error: existingPerformanceError } =
      await admin
        .from("performance")
        .select("accuracy, attempts")
        .eq("user_id", userId)
        .eq("topic", topic)
        .maybeSingle();
    if (existingPerformanceError) throw existingPerformanceError;
    return {
      recorded: false,
      performance: existingPerformance
        ? {
            accuracy: Number(existingPerformance.accuracy) || 0,
            attempts: Number(existingPerformance.attempts) || 0,
          }
        : null,
    };
  }

  try {
    const performance = await updatePracticePerformance(
      admin,
      userId,
      topic,
      correct
    );
    return { recorded: true, performance };
  } catch (error) {
    // Keep retries idempotent if the aggregate update fails after insertion.
    await admin
      .from("practice_attempts")
      .delete()
      .eq("user_id", userId)
      .eq("attempt_id", attemptId);
    throw error;
  }
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
      name: "practice-answer",
      limit: 120,
      windowMs: 10 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  const {
    attemptId,
    source,
    itemId,
    generatedScenarioId,
    selectedChoiceId,
  } = req.body ?? {};

  if (
    typeof attemptId !== "string" ||
    !UUID_PATTERN.test(attemptId) ||
    (source !== "static" && source !== "generated") ||
    typeof selectedChoiceId !== "string" ||
    !/^[A-D]$/.test(selectedChoiceId) ||
    (source === "static" &&
      (typeof itemId !== "string" || !UUID_PATTERN.test(itemId))) ||
    (source === "generated" &&
      (!Number.isInteger(generatedScenarioId) || generatedScenarioId < 1))
  ) {
    return res.status(400).json({ error: "Invalid practice answer payload." });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      error: "Practice history is temporarily unavailable.",
    });
  }

  let stored:
    | {
        id: string | number;
        domain?: string | null;
        topic?: string | null;
        choices: unknown;
      }
    | null = null;

  if (source === "static") {
    const { data, error } = await admin
      .from("items")
      .select("id, domain, topic, choices")
      .eq("id", itemId)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: "Practice question not found." });
    }
    stored = data;
  } else {
    const { data, error } = await admin
      .from("generated_scenarios")
      .select("id, topic, choices")
      .eq("id", generatedScenarioId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: "Generated practice question not found." });
    }
    stored = data;
  }

  const choices = Array.isArray(stored.choices)
    ? stored.choices.filter(isStoredChoice)
    : [];
  const correctChoice = choices.find((choice) => choice.correct);
  const selectedChoice = choices.find(
    (choice) => choice.id === selectedChoiceId
  );
  if (!correctChoice || !selectedChoice) {
    return res.status(500).json({
      error: "Practice question choices are not configured correctly.",
    });
  }

  const topic = stored.topic || "General";
  const domain =
    stored.domain ||
    (/trauma|burn|spine|head|chest|abd|orth|bleed/i.test(topic)
      ? "Trauma"
      : "Medical");
  const correct = selectedChoice.id === correctChoice.id;

  const { data, error } = await admin.rpc("record_practice_attempt", {
    p_user_id: user.id,
    p_attempt_id: attemptId,
    p_source: source,
    p_item_id: source === "static" ? itemId : null,
    p_generated_scenario_id:
      source === "generated" ? generatedScenarioId : null,
    p_domain: domain,
    p_topic: topic,
    p_selected_choice_id: selectedChoiceId,
    p_is_correct: correct,
  });

  if (error) {
    console.warn(
      "Atomic practice persistence unavailable; using server fallback:",
      error.message
    );
    try {
      const fallback = await recordPracticeAttemptFallback({
        admin,
        userId: user.id,
        attemptId,
        source,
        itemId: source === "static" ? itemId : null,
        generatedScenarioId:
          source === "generated" ? generatedScenarioId : null,
        domain,
        topic,
        selectedChoiceId,
        correct,
      });
      return res.status(200).json({
        correct,
        recorded: fallback.recorded,
        performance: fallback.performance,
        persistence: "fallback",
      });
    } catch (fallbackError) {
      console.error(
        "Unable to record practice answer with server fallback:",
        fallbackError
      );
      return res.status(503).json({
        error: "Unable to save this practice answer.",
      });
    }
  }

  return res.status(200).json({
    correct,
    recorded: Boolean(data?.[0]?.recorded),
    performance: data?.[0]
      ? {
          accuracy: data[0].accuracy,
          attempts: data[0].attempts,
        }
      : null,
  });
}
