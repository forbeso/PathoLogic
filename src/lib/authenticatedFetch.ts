import { supabase } from "@/lib/supabase";
import { reportClientIssue } from "@/lib/telemetry";

function endpointCode(input: RequestInfo | URL) {
  try {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const pathname = new URL(raw, window.location.origin).pathname;
    return pathname
      .replace(/^\/+/, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .slice(0, 40);
  } catch {
    return "unknown_endpoint";
  }
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  const endpoint = endpointCode(input);

  try {
    const response = await fetch(input, {
      ...init,
      headers,
    });
    if (response.status >= 500) {
      reportClientIssue(new Error("Authenticated API unavailable"), {
        context: "authenticated_api",
        code: `HTTP_${response.status}_${endpoint}`,
        recoverable: true,
      });
    }
    return response;
  } catch (error) {
    reportClientIssue(error, {
      context: "authenticated_api",
      code: `NETWORK_${endpoint}`,
      recoverable: true,
    });
    throw error;
  }
}
