import { authenticatedFetch } from "@/lib/authenticatedFetch";

export type ExamAnswerPayload = {
  itemId: string;
  selectedChoiceId: string | null;
  timeSpentSeconds: number;
  expired: boolean;
};

export type ExamAnswerResult = {
  correct: boolean;
  correctChoiceId: string;
  feedback: Record<string, string>;
};

export type ExamSummary = {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  domainStats: Record<string, { correct: number; total: number }>;
};

type SubmitExamAnswerOptions = ExamAnswerPayload & {
  orderIndex: number;
  sessionId: string | null;
};

export async function submitExamAnswer({
  orderIndex,
  sessionId,
  ...answer
}: SubmitExamAnswerOptions): Promise<ExamAnswerResult> {
  const response = await authenticatedFetch("/api/exam/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...answer,
      orderIndex,
      sessionId,
    }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Unable to check your answer.");
  }

  if (
    typeof data?.correct !== "boolean" ||
    typeof data?.correctChoiceId !== "string" ||
    typeof data?.feedback !== "object" ||
    data.feedback === null
  ) {
    throw new Error("The exam returned an invalid answer result.");
  }

  return {
    correct: data.correct,
    correctChoiceId: data.correctChoiceId,
    feedback: data.feedback,
  };
}

async function updateExamSession(
  sessionId: string,
  action: "complete" | "abandon"
) {
  const response = await authenticatedFetch("/api/exam/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, action }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ??
        (action === "complete"
          ? "Unable to save your exam results."
          : "Unable to end this exam.")
    );
  }

  return data;
}

export async function completeExam(
  sessionId: string
): Promise<ExamSummary> {
  const data = await updateExamSession(sessionId, "complete");
  const summary = data?.summary;
  if (
    !summary ||
    typeof summary.correctCount !== "number" ||
    typeof summary.totalQuestions !== "number" ||
    typeof summary.scorePercent !== "number" ||
    typeof summary.domainStats !== "object" ||
    summary.domainStats === null
  ) {
    throw new Error("The exam returned an invalid summary.");
  }

  return summary as ExamSummary;
}

export async function abandonExam(sessionId: string): Promise<void> {
  await updateExamSession(sessionId, "abandon");
}
