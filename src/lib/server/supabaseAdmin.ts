import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalSupabaseAdmin = globalThis as typeof globalThis & {
  pathologixSupabaseAdmin?: SupabaseClient<any>;
};

export function getSupabaseAdmin() {
  if (globalSupabaseAdmin.pathologixSupabaseAdmin) {
    return globalSupabaseAdmin.pathologixSupabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  globalSupabaseAdmin.pathologixSupabaseAdmin = createClient<any>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return globalSupabaseAdmin.pathologixSupabaseAdmin;
}

export function isMissingExamPersistence(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("exam_sessions") === true ||
    error.message?.includes("exam_session_items") === true
  );
}
