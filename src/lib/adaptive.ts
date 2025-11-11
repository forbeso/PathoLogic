// src/lib/adaptive.ts
import { supabase } from "@/lib/supabase";

/** Convenience: returns current user id or throws */
export async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

/** Upsert performance row for a topic with running accuracy */
export async function upsertPerformance(topic: string, correct: boolean) {
  const user_id = await getUserId();

  // 1) Fetch existing row (if any)
  const { data: rows, error: selErr } = await supabase
    .from("performance")
    .select("accuracy, attempts")
    .eq("user_id", user_id)
    .eq("topic", topic)
    .limit(1);

  if (selErr) throw selErr;

  const prev = rows?.[0] as { accuracy: number; attempts: number } | undefined;
  const prevAcc = prev?.accuracy ?? 0;
  const prevN = prev?.attempts ?? 0;

  // 2) Online mean: new_acc = (prevAcc*prevN + (correct?1:0)) / (prevN+1)
  const x = correct ? 1 : 0;
  const newN = prevN + 1;
  const newAcc = (prevAcc * prevN + x) / newN;

  // 3) Upsert
  const payload = {
    user_id,
    topic,
    accuracy: newAcc,
    attempts: newN,
    // last_practiced is auto-updated by trigger on UPDATE; send an UPDATE when row exists
  };

  if (prev) {
    const { error: upErr } = await supabase
      .from("performance")
      .update(payload)
      .eq("user_id", user_id)
      .eq("topic", topic);
    if (upErr) throw upErr;
  } else {
    const { error: insErr } = await supabase.from("performance").insert(payload);
    if (insErr) throw insErr;
  }
}

/** Record a finished question attempt (and keep lightweight result history if you want later) */
export async function recordResult(opts: {
  itemId: string;      // your items.id (uuid)
  topic: string;       // e.g., "Airway", "Trauma"
  correct: boolean;
  selectedChoice?: string; // optional
}) {
  // if you created a user_responses table earlier, you can save here (optional)
  // await supabase.from("user_responses").insert({
  //   user_id: await getUserId(),
  //   question_id: opts.itemId,
  //   selected_choice: opts.selectedChoice ?? null,
  //   correct: opts.correct,
  // });

  // Always update per-topic performance
  await upsertPerformance(opts.topic, opts.correct);
}

/** Get the single weakest topic (lowest accuracy). Falls back to a default list if empty */
export async function getWeakestTopic(fallbacks: string[] = ["Airway","Trauma","Cardiology","Respiratory"]) {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("performance")
    .select("topic, accuracy")
    .eq("user_id", user_id)
    .order("accuracy", { ascending: true })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) return data[0].topic;
  // No history yet → pick a deterministic fallback so UX is stable
  return fallbacks[0];
}

/** Get top-k weak topics (useful for heatmaps or a “train my weak spots” carousel) */
export async function getWeakTopics(limit = 3) {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("performance")
    .select("topic, accuracy, attempts")
    .eq("user_id", user_id)
    .order("accuracy", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Cache lookup for last generated scenario by topic (Step 3 will generate if none) */
export async function getCachedGeneratedScenario(topic: string) {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("generated_scenarios")
    .select("*")
    .eq("user_id", user_id)
    .eq("topic", topic)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}
