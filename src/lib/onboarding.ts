import { supabase } from "@/lib/supabase";
import { trackProductEvent } from "@/lib/telemetry";

export type LearningGoal =
  | "scene-practice"
  | "exam-prep"
  | "fundamentals"
  | "clinical-reasoning";

export type ActivationKind =
  | "practice_answer"
  | "emt_scene"
  | "exam"
  | "flashcard";

export const LEARNING_GOALS: Array<{
  id: LearningGoal;
  title: string;
  description: string;
  href: string;
}> = [
  {
    id: "scene-practice",
    title: "Practice a call",
    description:
      "Work through an interactive scene and make patient-care decisions.",
    href: "/emtscene",
  },
  {
    id: "exam-prep",
    title: "Prepare for the NREMT",
    description:
      "Take a timed exam and find the topics that need more attention.",
    href: "/exam/nremt",
  },
  {
    id: "fundamentals",
    title: "Review the fundamentals",
    description:
      "Use focused flashcards to strengthen assessments and treatment priorities.",
    href: "/flashcards",
  },
  {
    id: "clinical-reasoning",
    title: "Sharpen clinical decisions",
    description:
      "Practice scenario questions and review the reasoning behind each answer.",
    href: "/emtrainer",
  },
];

export function isLearningGoal(value: unknown): value is LearningGoal {
  return LEARNING_GOALS.some((goal) => goal.id === value);
}

export function hasCompletedOnboarding(
  metadata: Record<string, unknown> | null | undefined
) {
  return (
    typeof metadata?.onboarding_completed_at === "string" &&
    isLearningGoal(metadata.learning_goal)
  );
}

export function getLearningGoal(
  metadata: Record<string, unknown> | null | undefined
) {
  return isLearningGoal(metadata?.learning_goal)
    ? metadata.learning_goal
    : null;
}

const activationRequests = new Set<string>();

export async function markActivationCompleted(kind: ActivationKind) {
  if (typeof window === "undefined") return false;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) return false;

  const user = session.user;
  const storageKey = `pathologix:activation:${user.id}`;
  if (
    typeof user.user_metadata?.activation_completed_at === "string" ||
    localStorage.getItem(storageKey) ||
    activationRequests.has(user.id)
  ) {
    return false;
  }

  activationRequests.add(user.id);
  const completedAt = new Date().toISOString();

  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        activation_completed_at: completedAt,
        activation_kind: kind,
      },
    });
    if (error) throw error;

    localStorage.setItem(
      storageKey,
      JSON.stringify({ kind, completedAt })
    );
    trackProductEvent("activation_completed", {
      kind,
      route: window.location.pathname,
    });
    return true;
  } finally {
    activationRequests.delete(user.id);
  }
}
