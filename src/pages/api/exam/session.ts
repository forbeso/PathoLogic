import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

type DomainStat = {
  correct: number;
  total: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function awardExamCompletion(
  admin: SupabaseClient<any>,
  userId: string,
  sessionId: string,
  correctCount: number,
  questionCount: number,
  scorePercent: number
) {
  const { error } = await admin.rpc("award_learner_progress", {
    p_user_id: userId,
    p_award_id: `exam:${sessionId}:complete`,
    p_event_type: "exam_complete",
    p_xp: 50 + correctCount,
    p_metadata: {
      sessionId,
      questionCount,
      scorePercent,
    },
  });

  if (
    error &&
    error.code !== "PGRST202" &&
    !error.message.includes("award_learner_progress")
  ) {
    console.error("Unable to award exam completion XP:", error.message);
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
      name: "exam-session",
      limit: 20,
      windowMs: 10 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  const { sessionId, action } = req.body ?? {};
  if (
    typeof sessionId !== "string" ||
    !UUID_PATTERN.test(sessionId) ||
    (action !== "complete" && action !== "abandon")
  ) {
    return res.status(400).json({ error: "Invalid exam session request." });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      error: "Exam persistence is temporarily unavailable.",
    });
  }

  const { data: session, error: sessionError } = await admin
    .from("exam_sessions")
    .select("id, status, question_count")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return res.status(404).json({ error: "Exam session not found." });
  }

  if (action === "abandon") {
    if (session.status === "active") {
      const { error } = await admin
        .from("exam_sessions")
        .update({
          status: "abandoned",
          abandoned_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        console.error("Unable to abandon exam session:", error.message);
        return res.status(500).json({ error: "Unable to end this exam." });
      }
    }

    return res.status(200).json({ ok: true });
  }

  if (session.status === "completed") {
    const { data: completed } = await admin
      .from("exam_sessions")
      .select("correct_count, question_count, score_percent, domain_stats")
      .eq("id", sessionId)
      .single();

    await awardExamCompletion(
      admin,
      user.id,
      sessionId,
      completed?.correct_count ?? 0,
      completed?.question_count ?? session.question_count,
      Number(completed?.score_percent ?? 0)
    );

    return res.status(200).json({
      ok: true,
      summary: {
        correctCount: completed?.correct_count ?? 0,
        totalQuestions: completed?.question_count ?? session.question_count,
        scorePercent: Number(completed?.score_percent ?? 0),
        domainStats: completed?.domain_stats ?? {},
      },
    });
  }

  if (session.status !== "active") {
    return res.status(409).json({ error: "This exam is no longer active." });
  }

  const { data: answers, error: answersError } = await admin
    .from("exam_session_items")
    .select("domain, is_correct, answered_at")
    .eq("session_id", sessionId);

  if (answersError || !answers) {
    console.error("Unable to load exam answers:", answersError?.message);
    return res.status(500).json({ error: "Unable to calculate exam results." });
  }

  const answered = answers.filter((answer) => answer.answered_at);
  if (answered.length !== session.question_count) {
    return res.status(409).json({
      error: "Answer every question before completing the exam.",
    });
  }

  const correctCount = answered.filter((answer) => answer.is_correct).length;
  const scorePercent = Math.round(
    (correctCount / session.question_count) * 100
  );
  const domainStats = answered.reduce<Record<string, DomainStat>>(
    (stats, answer) => {
      const domain = answer.domain || "Unknown";
      const current = stats[domain] ?? { correct: 0, total: 0 };
      stats[domain] = {
        correct: current.correct + (answer.is_correct ? 1 : 0),
        total: current.total + 1,
      };
      return stats;
    },
    {}
  );

  const { error: completeError } = await admin
    .from("exam_sessions")
    .update({
      status: "completed",
      correct_count: correctCount,
      score_percent: scorePercent,
      domain_stats: domainStats,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (completeError) {
    console.error("Unable to complete exam session:", completeError.message);
    return res.status(500).json({ error: "Unable to save exam results." });
  }

  await awardExamCompletion(
    admin,
    user.id,
    sessionId,
    correctCount,
    session.question_count,
    scorePercent
  );

  return res.status(200).json({
    ok: true,
    summary: {
      correctCount,
      totalQuestions: session.question_count,
      scorePercent,
      domainStats,
    },
  });
}
