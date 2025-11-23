// pages/api/exam/answer.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // For now just accept the payload and say "ok"
  // You can later store this in exam_session_items if you want.
  // const { sessionId, itemId, orderIndex, selectedChoiceId, timeSpentSeconds } = req.body;

  return res.status(200).json({ ok: true });
}
