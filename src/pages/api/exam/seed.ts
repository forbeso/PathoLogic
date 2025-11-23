// pages/api/exam/seed.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const requestedCount = typeof body.itemCount === "number" ? body.itemCount : 40;
    const itemCount = Math.min(Math.max(requestedCount, 10), 120);

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

    // 2) Shuffle + slice on server
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(itemCount, shuffled.length));

    // For now we skip creating exam_sessions to keep things simple
    return res.status(200).json({
      sessionId: null, // you can wire this later
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
