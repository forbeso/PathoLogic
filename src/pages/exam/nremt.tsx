"use client";

import { useCallback, useState } from "react";
import ExamModeDialog, { ExamAnswerPayload } from "@/components/ExamModeDialog";
import Header from "@/components/Header";

type SeededItem = {
  orderIndex: number;
  itemId: string;
  item: any; // shape matches Item from ExamModeDialog
};

type DomainStat = {
  correct: number;
  total: number;
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

  // For summary after exam
  const [summaryItems, setSummaryItems] = useState<SeededItem[]>([]);
  const [domainStats, setDomainStats] = useState<Record<string, DomainStat>>({});

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
    setSummaryItems([]);
    setDomainStats({});

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
      if (!sessionId && sessionId !== null) return; // sessionId null is okay w/ current API
      if (!current) return;

      setLoading(true);

      // Update domain stats locally
      const domain = current.item?.domain ?? "Unknown";
      setDomainStats((prev) => {
        const prevStat = prev[domain] ?? { correct: 0, total: 0 };
        return {
          ...prev,
          [domain]: {
            total: prevStat.total + 1,
            correct: prevStat.correct + (payload.correct ? 1 : 0),
          },
        };
      });

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
        // swallow for now; you can surface a toast later
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

    // Finished exam
    setCompleted(true);
    setSummaryItems(items); // keep what they saw for summary
    setItems([]);
    setSessionId(null);
  };

  const exitExamNow = () => {
    // X button: bail out
    setCompleted(true);
    setSummaryItems(items);
    setItems([]);
    setSessionId(null);
  };

  const totalQuestions =
    summaryItems.length || items.length || questionCount;
  const percent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  let performanceLabel = "Needs work";
  let performanceDetail = "Focus on understanding core pathophysiology and algorithms, then re-test.";
  if (percent >= 85) {
    performanceLabel = "Strong performance";
    performanceDetail = "You’re testing in a range consistent with a high chance of passing NREMT.";
  } else if (percent >= 75) {
    performanceLabel = "On the edge";
    performanceDetail = "You’re close. Tighten up weak domains and do another full exam run.";
  } else if (percent >= 65) {
    performanceLabel = "Improving";
    performanceDetail = "You’re building a base. Target weaker domains with focused practice scenarios.";
  }

  const domainEntries = Object.entries(domainStats).sort(
    (a, b) => (b[1].total || 0) - (a[1].total || 0)
  );

  return (
    <div className="min-h-screen bg-slate-50 w-full">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
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
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Exam complete
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                You answered{" "}
                <span className="font-semibold">{correctCount}</span> out of{" "}
                <span className="font-semibold">{totalQuestions}</span>{" "}
                questions correctly.
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold text-slate-900">
                  Score: {percent}%
                </span>
              </p>
              <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Performance snapshot
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {performanceLabel}
                </div>
                <p className="mt-1 text-xs text-slate-700">
                  {performanceDetail}
                </p>
              </div>

              <button
                onClick={() => {
                  setCompleted(false);
                  setCorrectCount(0);
                  setSummaryItems([]);
                  setDomainStats({});
                }}
                className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Start another exam
              </button>
            </div>

            {/* Domain breakdown */}
            {domainEntries.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Domain breakdown
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Strong domains should feel automatic. Weak domains are where you&apos;ll bleed points on NREMT.
                </p>
                <div className="mt-3 space-y-2">
                  {domainEntries.map(([domain, stat]) => {
                    const pct =
                      stat.total > 0
                        ? Math.round((stat.correct / stat.total) * 100)
                        : 0;
                    return (
                      <div
                        key={domain}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {domain}
                          </div>
                          <div className="text-xs text-slate-600">
                            {stat.correct}/{stat.total} correct ({pct}%)
                          </div>
                        </div>
                        <div className="w-32 rounded-full bg-slate-200/70">
                          <div
                            className={`h-2 rounded-full ${
                              pct >= 80
                                ? "bg-emerald-500"
                                : pct >= 60
                                ? "bg-amber-400"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live question dialog */}
      {current && (
        <ExamModeDialog
          open={true}
          onClose={exitExamNow} // X = bail
          onAdvance={handleAdvanceQuestion} // Next / Finish
          item={current.item}
          onSubmitAnswer={handleSubmitAnswer}
          hasNext={currentIndex + 1 < items.length}
        />
      )}
    </div>
  );
}
