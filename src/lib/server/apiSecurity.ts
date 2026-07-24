import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, type User } from "@supabase/supabase-js";

type RateLimitOptions = {
  name: string;
  limit: number;
  windowMs: number;
  userId?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalRateLimits = globalThis as typeof globalThis & {
  pathologixRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimits =
  globalRateLimits.pathologixRateLimits ??
  (globalRateLimits.pathologixRateLimits = new Map<string, RateLimitEntry>());

function getRequestIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0] ?? "unknown";
  return req.socket.remoteAddress ?? "unknown";
}

function getBearerToken(req: NextApiRequest) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export async function requireApiUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | null> {
  res.setHeader("Cache-Control", "no-store");

  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase server authentication is not configured.");
    res.status(500).json({ error: "Authentication service is unavailable." });
    return null;
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Your session is invalid or has expired." });
    return null;
  }

  return user;
}

export function enforceRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  { name, limit, windowMs, userId }: RateLimitOptions
) {
  const now = Date.now();
  const key = `${name}:${userId ?? "anonymous"}:${getRequestIp(req)}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - 1)));
    return true;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", "0");
    res.status(429).json({
      error: "Too many requests. Please wait a moment and try again.",
    });
    return false;
  }

  current.count += 1;
  rateLimits.set(key, current);
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader(
    "X-RateLimit-Remaining",
    String(Math.max(0, limit - current.count))
  );

  if (rateLimits.size > 5000) {
    for (const [entryKey, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(entryKey);
    }
  }

  return true;
}
