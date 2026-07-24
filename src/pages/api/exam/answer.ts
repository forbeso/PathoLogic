// pages/api/exam/answer.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

type StoredChoice = {
  id: string;
  text: string;
  correct: boolean;
  why_right?: string;
  why_wrong?: string;
};

function isStoredChoice(value: unknown): value is StoredChoice {
  if (typeof value !== "object" || value === null) return false;
  const choice = value as Partial<StoredChoice>;
  return (
    typeof choice.id === "string" &&
    typeof choice.text === "string" &&
    typeof choice.correct === "boolean"
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;
  if (
    !enforceRateLimit(req, res, {
      name: "exam-answer",
      limit: 100,
      windowMs: 10 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  const {
    itemId,
    orderIndex,
    selectedChoiceId,
    timeSpentSeconds,
    expired,
    sessionId,
  } =
    req.body ?? {};
  const validChoice =
    selectedChoiceId === null ||
    (typeof selectedChoiceId === "string" &&
      /^[A-D]$/.test(selectedChoiceId));
  const validSessionId =
    sessionId === null ||
    (typeof sessionId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sessionId
      ));

  if (
    typeof itemId !== "string" ||
    !itemId ||
    itemId.length > 100 ||
    !Number.isInteger(orderIndex) ||
    orderIndex < 0 ||
    !validChoice ||
    typeof timeSpentSeconds !== "number" ||
    !Number.isFinite(timeSpentSeconds) ||
    timeSpentSeconds < 0 ||
    timeSpentSeconds > 600 ||
    typeof expired !== "boolean" ||
    !validSessionId
  ) {
    return res.status(400).json({ error: "Invalid exam answer payload." });
  }

  const admin = getSupabaseAdmin();
  if (sessionId) {
    if (!admin) {
      return res.status(503).json({
        error: "Exam persistence is temporarily unavailable. Please start a new exam.",
      });
    }

    const { data: session, error: sessionError } = await admin
      .from("exam_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError || !session || session.status !== "active") {
      return res.status(409).json({
        error: "This exam session is no longer active. Please start a new exam.",
      });
    }

    const { data: sessionItem, error: sessionItemError } = await admin
      .from("exam_session_items")
      .select("id, answered_at")
      .eq("session_id", sessionId)
      .eq("order_index", orderIndex)
      .eq("item_id", itemId)
      .maybeSingle();

    if (sessionItemError || !sessionItem) {
      return res.status(409).json({
        error: "This question does not belong to the active exam session.",
      });
    }

    if (sessionItem.answered_at) {
      return res.status(409).json({
        error: "This exam question has already been answered.",
      });
    }
  }

  const { data: item, error } = await supabase
    .from("items")
    .select("choices")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    console.error("Unable to validate exam answer:", error?.message);
    return res.status(404).json({ error: "Exam question not found." });
  }

  const choices = Array.isArray(item.choices)
    ? item.choices.filter(isStoredChoice)
    : [];
  const correctChoice = choices.find((choice) => choice.correct);
  if (!correctChoice) {
    console.error(`Exam question ${itemId} has no valid correct choice.`);
    return res.status(500).json({ error: "Exam question is not configured correctly." });
  }

  const feedback = Object.fromEntries(
    choices.map((choice) => [
      choice.id,
      choice.correct ? choice.why_right ?? "" : choice.why_wrong ?? "",
    ])
  );

  const correct = selectedChoiceId === correctChoice.id;

  if (sessionId && admin) {
    const { error: saveError } = await admin
      .from("exam_session_items")
      .update({
        selected_choice_id: selectedChoiceId,
        is_correct: correct,
        time_spent_seconds: Math.round(timeSpentSeconds),
        expired,
        answered_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("order_index", orderIndex)
      .is("answered_at", null);

    if (saveError) {
      console.error("Unable to persist exam answer:", saveError.message);
      return res.status(500).json({
        error: "Your answer could not be saved. Please try again.",
      });
    }
  }

  return res.status(200).json({
    ok: true,
    correct,
    correctChoiceId: correctChoice.id,
    feedback,
  });
}
