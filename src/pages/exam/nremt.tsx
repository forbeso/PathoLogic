"use client";

import { useCallback, useState } from "react";
import ExamModeDialog, { ExamAnswerPayload } from "@/components/ExamModeDialog";

type SeededItem = {
  orderIndex: number;
  itemId: string;
  item: any; // shape matches Item from ExamModeDialog
};

export default function NremtExamPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<SeededItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(40); // default exam length

  const current = items[currentIndex] ?? null;

  const startExam = useCallback(async () => {
    setError(null);
    setStarting(true);
    setCompleted(false);
    setCorrectCount(0);
    setCurrentIndex(0);
    setItems([]);
    setSessionId(null);

    try {
      const res = await fetch("/api/exam/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemCount: questionCount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to start exam");
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setItems(data.items ?? []);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setStarting(false);
    }
  }, [questionCount]);

  const handleSubmitAnswer = useCallback(
    async (payload: ExamAnswerPayload) => {
      if (!sessionId || !current) return;

      setLoading(true);

      try {
        await fetch("/api/exam/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            itemId: payload.itemId,
            orderIndex: current.orderIndex,
            selectedChoiceId: payload.selectedChoiceId,
            timeSpentSeconds: payload.timeSpentSeconds,
          }),
        });

        if (payload.correct) {
          setCorrectCount((prev) => prev + 1);
        }
      } catch {
        // you can surface an error toast here if you want
      } finally {
        setLoading(false);
      }
    },
    [sessionId, current]
  );

 const handleAdvanceQuestion = () => {
  if (!current) return;

  const nextIndex = currentIndex + 1;
  if (nextIndex < items.length) {
    setCurrentIndex(nextIndex);
    return;
  }

  // Finished
  setCompleted(true);
  setItems([]);
  setSessionId(null);
};

const exitExamNow = () => {
  // X button: bail out immediately
  setCompleted(true);
  setItems([]);
  setSessionId(null);
};


  const handleCloseDialog = () => {
    // If no exam running, just ignore
    if (!current) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex < items.length) {
      setCurrentIndex(nextIndex);
      // dialog stays open; ExamModeDialog will reset itself on new item.id
      return;
    }

    // Finished
    setCompleted(true);
    setItems([]);
    setSessionId(null);
  };

  const totalQuestions = items.length || questionCount;
  const percent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          NREMT Exam Mode
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Simulated NREMT-style exam: timed, one question at a time, no going back.
        </p>

        {/* Config / start card */}
        {!current && !completed && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Exam settings
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Questions are pulled from your exam-eligible pool.
                </p>
                <label className="mt-3 block text-xs font-medium text-slate-700">
                  Number of questions
                </label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(
                      Math.min(
                        120,
                        Math.max(10, Number(e.target.value) || 10)
                      )
                    )
                  }
                  className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                />
              </div>

              <button
                onClick={startExam}
                disabled={starting}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow ${
                  starting
                    ? "cursor-wait bg-slate-300 text-slate-600"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {starting ? "Starting..." : "Start exam"}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-xs text-rose-600">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Summary after completion */}
        {completed && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Exam complete
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              You answered <span className="font-semibold">{correctCount}</span>{" "}
              out of{" "}
              <span className="font-semibold">{totalQuestions}</span> questions
              correctly ({percent}%).
            </p>
            <button
              onClick={() => {
                setCompleted(false);
                setCorrectCount(0);
              }}
              className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Start another exam
            </button>
          </div>
        )}
      </div>

      {/* Live question dialog */}
    {current && (
  <ExamModeDialog
    open={true}
    onClose={exitExamNow}                      // X exits
    onAdvance={handleAdvanceQuestion}          // Next/Finish advances or completes
    item={current.item}
    onSubmitAnswer={handleSubmitAnswer}
    hasNext={currentIndex + 1 < items.length}
  />
)}
    </div>
  );
}
