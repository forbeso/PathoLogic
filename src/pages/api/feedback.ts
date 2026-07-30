import type { NextApiRequest, NextApiResponse } from "next";
import {
  enforceRateLimit,
  requireApiUser,
} from "@/lib/server/apiSecurity";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const FEEDBACK_CATEGORIES = new Set([
  "friction",
  "idea",
  "content",
  "bug",
]);

function isValidRoute(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.includes("?") &&
    !value.includes("#") &&
    value.length <= 160
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;

  if (
    !enforceRateLimit(req, res, {
      name: "beta-feedback",
      limit: 10,
      windowMs: 24 * 60 * 60 * 1000,
      userId: user.id,
    })
  ) {
    return;
  }

  const { category, rating, message, route } = req.body ?? {};
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (
    typeof category !== "string" ||
    !FEEDBACK_CATEGORIES.has(category) ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    cleanMessage.length < 3 ||
    cleanMessage.length > 2000 ||
    !isValidRoute(route)
  ) {
    return res.status(400).json({ error: "Invalid feedback submission." });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      error: "Feedback is temporarily unavailable.",
    });
  }

  const { error } = await admin.from("beta_feedback").insert({
    user_id: user.id,
    category,
    rating,
    message: cleanMessage,
    route,
  });

  if (error) {
    console.error("Unable to save beta feedback:", error.message);
    return res.status(503).json({
      error: "Feedback is temporarily unavailable.",
    });
  }

  return res.status(201).json({ accepted: true });
}

