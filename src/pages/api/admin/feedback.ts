import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminUser } from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const FEEDBACK_STATUSES = new Set(["new", "reviewing", "resolved"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const user = await requireAdminUser(req, res);
  if (!user) return;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      error: "Feedback administration is temporarily unavailable.",
    });
  }

  if (req.method === "GET") {
    const { data, error } = await admin
      .from("beta_feedback")
      .select(
        "id,user_id,category,rating,message,route,status,created_at,updated_at,resolved_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Unable to load beta feedback:", error.message);
      return res.status(503).json({
        error: "Feedback could not be loaded right now.",
      });
    }

    return res.status(200).json({ feedback: data ?? [] });
  }

  const { id, status } = req.body ?? {};
  if (
    typeof id !== "string" ||
    !UUID_PATTERN.test(id) ||
    typeof status !== "string" ||
    !FEEDBACK_STATUSES.has(status)
  ) {
    return res.status(400).json({ error: "Invalid feedback update." });
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("beta_feedback")
    .update({
      status,
      updated_at: now,
      resolved_at: status === "resolved" ? now : null,
    })
    .eq("id", id)
    .select(
      "id,user_id,category,rating,message,route,status,created_at,updated_at,resolved_at"
    )
    .single();

  if (error) {
    console.error("Unable to update beta feedback:", error.message);
    return res.status(503).json({
      error: "Feedback could not be updated right now.",
    });
  }

  return res.status(200).json({ feedback: data });
}
