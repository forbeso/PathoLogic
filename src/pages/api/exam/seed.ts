// pages/api/exam/seed.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

const MAX_EXAM_QUESTIONS = 25;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

    // For now we skip creating exam_sessions to keep things simple
    return res.status(200).json({
      sessionId: null, // you can wire this later
      availableCount: items.length,
      items: selected.map((item, index) => ({
        orderIndex: index,
        itemId: item.id,
        item,
      })),
    });
  } catch (err: any) {
    console.error("seed: unexpected error", err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
