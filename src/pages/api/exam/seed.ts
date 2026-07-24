// pages/api/exam/seed.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import {
  getSupabaseAdmin,
  isMissingExamPersistence,
} from "@/lib/server/supabaseAdmin";

const MAX_EXAM_QUESTIONS = 25;

function sanitizeChoices(choices: unknown) {
  if (!Array.isArray(choices)) return [];

  return choices
    .filter(
      (choice): choice is { id: string; text: string } =>
        typeof choice === "object" &&
        choice !== null &&
        typeof (choice as { id?: unknown }).id === "string" &&
        typeof (choice as { text?: unknown }).text === "string"
    )
    .map((choice) => ({
      id: choice.id,
      text: choice.text,
    }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;
  if (
    !enforceRateLimit(req, res, {
      name: req.method === "GET" ? "exam-availability" : "exam-seed",
      limit: req.method === "GET" ? 30 : 10,
      windowMs: 10 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  if (req.method === "GET") {
    const { count, error } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("is_exam_eligible", true);

    if (error) {
      console.error("seed: count error", error);
      return res.status(500).json({ error: error.message });
    }

    const availableCount = count ?? 0;
    return res.status(200).json({
      availableCount,
      maxQuestionCount: Math.min(MAX_EXAM_QUESTIONS, availableCount),
    });
  }

  try {
    const body = req.body || {};
    const requestedCount =
      typeof body.itemCount === "number"
        ? Math.floor(body.itemCount)
        : MAX_EXAM_QUESTIONS;

    if (
      !Number.isFinite(requestedCount) ||
      requestedCount < 1 ||
      requestedCount > MAX_EXAM_QUESTIONS
    ) {
      return res.status(400).json({
        error: `Choose between 1 and ${MAX_EXAM_QUESTIONS} questions.`,
      });
    }

    // 1) Get exam-eligible items from your items table
    const { data: items, error } = await supabase
      .from("items")
      .select("id, domain, topic, vignette, question, choices, tags, difficulty")
      .eq("is_exam_eligible", true);

    if (error) {
      console.error("seed: items error", error);
      return res.status(500).json({ error: error.message });
    }

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "No exam-eligible items found. Set is_exam_eligible = true on some questions." });
    }

    if (requestedCount > items.length) {
      return res.status(400).json({
        error: `Only ${items.length} exam-eligible ${
          items.length === 1 ? "question is" : "questions are"
        } currently available.`,
        availableCount: items.length,
      });
    }

    // 2) Shuffle + slice on server
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, requestedCount);

    let sessionId: string | null = null;
    let persistenceAvailable = false;
    const admin = getSupabaseAdmin();

    if (admin) {
      const { data: session, error: sessionError } = await admin
        .from("exam_sessions")
        .insert({
          user_id: user.id,
          question_count: selected.length,
        })
        .select("id")
        .single();

      if (!sessionError && session) {
        const { error: sessionItemsError } = await admin
          .from("exam_session_items")
          .insert(
            selected.map((item, index) => ({
              session_id: session.id,
              item_id: item.id,
              order_index: index,
              domain: item.domain || "Unknown",
            }))
          );

        if (!sessionItemsError) {
          sessionId = session.id;
          persistenceAvailable = true;
        } else {
          await admin.from("exam_sessions").delete().eq("id", session.id);
          if (!isMissingExamPersistence(sessionItemsError)) {
            console.error(
              "seed: unable to persist session questions",
              sessionItemsError.message
            );
          }
        }
      } else if (!isMissingExamPersistence(sessionError)) {
        console.error(
          "seed: unable to persist exam session",
          sessionError?.message
        );
      }
    }

    return res.status(200).json({
      sessionId,
      persistenceAvailable,
      availableCount: items.length,
      items: selected.map((item, index) => ({
        orderIndex: index,
        itemId: item.id,
        item: {
          ...item,
          choices: sanitizeChoices(item.choices),
        },
      })),
    });
  } catch (err: any) {
    console.error("seed: unexpected error", err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
