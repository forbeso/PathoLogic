// app/api/test/route.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  const { data, error } = await supabase
    .from("items")
    .select(
      "id, domain, topic, vignette, cues, question, choices, reasoning_steps, tags, difficulty"
    );
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}
