import type { NextApiRequest, NextApiResponse } from "next";
import { enforceRateLimit } from "@/lib/server/apiSecurity";

const VALID_CONTEXTS = new Set([
  "app_render",
  "route_navigation",
  "authenticated_api",
  "exam_start",
  "exam_complete",
  "exam_abandon",
  "adaptive_practice",
  "practice_save",
  "window_error",
  "unhandled_rejection",
]);

function safeToken(value: unknown, maxLength: number) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    /^[a-zA-Z0-9_.:-]+$/.test(value)
  );
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (
    !enforceRateLimit(req, res, {
      name: "client-telemetry",
      limit: 30,
      windowMs: 10 * 60 * 1000,
    })
  ) {
    return;
  }

  const {
    issueId,
    context,
    route,
    errorName,
    code,
    recoverable,
    occurredAt,
    ...unknownFields
  } = req.body ?? {};

  const valid =
    Object.keys(unknownFields).length === 0 &&
    safeToken(issueId, 80) &&
    typeof context === "string" &&
    VALID_CONTEXTS.has(context) &&
    typeof route === "string" &&
    route.startsWith("/") &&
    !route.includes("?") &&
    !route.includes("#") &&
    route.length <= 160 &&
    safeToken(errorName, 64) &&
    safeToken(code, 64) &&
    typeof recoverable === "boolean" &&
    typeof occurredAt === "string" &&
    Number.isFinite(Date.parse(occurredAt));

  if (!valid) {
    return res.status(400).json({ error: "Invalid telemetry payload." });
  }

  console.error(
    "[pathologix-client-issue]",
    JSON.stringify({
      issueId,
      context,
      route,
      errorName,
      code,
      recoverable,
      occurredAt,
    })
  );

  return res.status(202).json({ accepted: true, issueId });
}
