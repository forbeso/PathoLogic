import { track } from "@vercel/analytics/react";

type TelemetryValue = string | number | boolean;

export type ProductEventName =
  | "client_issue"
  | "emt_scene_started"
  | "emt_scene_completed"
  | "emt_scene_mode_changed"
  | "exam_started"
  | "exam_completed"
  | "exam_abandoned"
  | "adaptive_practice_started"
  | "adaptive_practice_loaded"
  | "practice_answered"
  | "web_vital";

export type ClientIssueContext =
  | "app_render"
  | "route_navigation"
  | "authenticated_api"
  | "exam_start"
  | "exam_complete"
  | "exam_abandon"
  | "adaptive_practice"
  | "practice_load"
  | "practice_save"
  | "window_error"
  | "unhandled_rejection";

type ClientIssueOptions = {
  context: ClientIssueContext;
  code?: string;
  recoverable?: boolean;
};

const TELEMETRY_ENDPOINT = "/api/telemetry";
const TELEMETRY_DEDUPE_WINDOW_MS = 30_000;
const recentIssueFingerprints = new Map<string, number>();

function telemetryEnabled() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_TELEMETRY_IN_DEVELOPMENT === "true"
  );
}

function safeToken(value: unknown, fallback: string, maxLength = 64) {
  if (typeof value !== "string") return fallback;
  const token = value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, maxLength);
  return token || fallback;
}

function currentRoute() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname.slice(0, 160) || "/";
}

function createIssueId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `issue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toSafeProperties(
  properties: Record<string, TelemetryValue | null | undefined>
) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(
        ([key, value]) =>
          /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key) &&
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean")
      )
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 120) : value,
      ])
      .slice(0, 16)
  ) as Record<string, TelemetryValue>;
}

export function trackProductEvent(
  name: ProductEventName,
  properties: Record<string, TelemetryValue | null | undefined> = {}
) {
  if (!telemetryEnabled() || typeof window === "undefined") return;
  try {
    track(name, toSafeProperties(properties));
  } catch {
    // Analytics must never interrupt the learning experience.
  }
}

export function reportClientIssue(
  error: unknown,
  {
    context,
    code,
    recoverable = true,
  }: ClientIssueOptions
) {
  const issueId = createIssueId();
  if (!telemetryEnabled() || typeof window === "undefined") return issueId;

  const errorName = safeToken(
    error instanceof Error ? error.name : "UnknownError",
    "UnknownError"
  );
  const safeCode = safeToken(
    code ??
      (typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String((error as { code?: unknown }).code)
        : "unknown"),
    "unknown"
  );
  const route = currentRoute();
  const fingerprint = `${context}:${errorName}:${safeCode}:${route}`;
  const now = Date.now();
  const previousReport = recentIssueFingerprints.get(fingerprint) ?? 0;

  if (now - previousReport < TELEMETRY_DEDUPE_WINDOW_MS) return issueId;
  recentIssueFingerprints.set(fingerprint, now);

  for (const [key, timestamp] of recentIssueFingerprints) {
    if (now - timestamp > TELEMETRY_DEDUPE_WINDOW_MS) {
      recentIssueFingerprints.delete(key);
    }
  }

  const payload = {
    issueId,
    context,
    route,
    errorName,
    code: safeCode,
    recoverable,
    occurredAt: new Date(now).toISOString(),
  };

  trackProductEvent("client_issue", {
    context,
    route,
    errorName,
    code: safeCode,
    recoverable,
  });

  void fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Runtime logging is best effort and must not create another visible error.
  });

  return issueId;
}

export function trackWebVital(metric: {
  name: string;
  value: number;
  id: string;
  label?: string;
}) {
  if (
    !["CLS", "FCP", "INP", "LCP", "TTFB"].includes(metric.name) ||
    !Number.isFinite(metric.value)
  ) {
    return;
  }

  const normalizedValue =
    metric.name === "CLS"
      ? Math.round(metric.value * 1000)
      : Math.round(metric.value);

  trackProductEvent("web_vital", {
    metric: metric.name,
    value: normalizedValue,
    metricId: safeToken(metric.id, "unknown", 80),
    route: currentRoute(),
  });
}
