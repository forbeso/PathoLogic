"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import ExamModeDialog, { ExamAnswerPayload } from "@/components/ExamModeDialog";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { supabase } from "@/lib/supabase";
import {
  AppShell,
  PageContainer,
  PageIntro,
  MetricCard,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/AppShell";
import { BarChart3, Clock3, FileQuestion, LoaderCircle, ShieldCheck, Target } from "lucide-react";

type SeededItem = {
  orderIndex: number;
  itemId: string;
  item: any; // shape matches Item from ExamModeDialog
};

type DomainStat = {
  correct: number;
  total: number;
};

const MAX_EXAM_QUESTIONS = 25;

export default function NremtExamPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "signed-out">("checking");
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

  const [availableQuestionCount, setAvailableQuestionCount] = useState<number | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  const current = items[currentIndex] ?? null;
  const examQuestionCount = Math.min(
    MAX_EXAM_QUESTIONS,
    availableQuestionCount ?? 0
  );

  useEffect(() => {
    let active = true;

    const redirectToLogin = () => {
      localStorage.setItem("pathologix:redirect_after_login", "/exam/nremt");
      setAuthStatus("signed-out");
      void router.replace("/login");
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setAuthStatus("authenticated");
        return;
      }
      redirectToLogin();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        setAuthStatus("authenticated");
      } else if (event === "SIGNED_OUT") {
        redirectToLogin();
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    let cancelled = false;

    const loadQuestionAvailability = async () => {
      try {
        const res = await fetch("/api/exam/seed");
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error ?? "Unable to load the exam question pool.");
        }

        if (cancelled) return;

        const available = Math.max(0, Number(data?.availableCount) || 0);
        setAvailableQuestionCount(available);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Unable to load the exam question pool.");
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    };

    void loadQuestionAvailability();

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

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
        body: JSON.stringify({ itemCount: examQuestionCount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to start exam");
      }

      const data = await res.json();
      const seededItems = data.items ?? [];
      if (seededItems.length !== examQuestionCount) {
        throw new Error("The generated exam did not match the expected question count. Please try again.");
      }

      setSessionId(data.sessionId);
      setItems(seededItems);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setStarting(false);
    }
  }, [examQuestionCount]);

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
    // X button: abandon the current run without scoring unanswered questions.
    setCompleted(false);
    setCorrectCount(0);
    setCurrentIndex(0);
    setSummaryItems([]);
    setDomainStats({});
    setItems([]);
    setSessionId(null);
  };

  const totalQuestions =
    summaryItems.length || items.length || examQuestionCount;
  const percent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  let performanceLabel = "Needs work";
  let performanceDetail = "Focus on understanding core pathophysiology and algorithms, then re-test.";
  if (percent >= 85) {
    performanceLabel = "Strong performance";
    performanceDetail = "You are testing in a range consistent with a high chance of passing NREMT.";
  } else if (percent >= 75) {
    performanceLabel = "On the edge";
    performanceDetail = "You are close. Tighten up weak domains and do another full exam run.";
  } else if (percent >= 65) {
    performanceLabel = "Improving";
    performanceDetail = "You are building a base. Target weaker domains with focused practice scenarios.";
  }

  const domainEntries = Object.entries(domainStats).sort(
    (a, b) => (b[1].total || 0) - (a[1].total || 0)
  );

  if (authStatus !== "authenticated") {
    return (
      <AppShell>
        <Seo
          title="NREMT-Style EMT Exam Practice"
          description="Build EMT exam pacing and clinical judgment with timed, one-question-at-a-time NREMT-style practice sets."
          path="/exam/nremt"
        />
        <Header />
        <PageContainer size="normal" className="grid min-h-[calc(100svh-90px)] place-items-center">
          <div className={`${cardClass} flex items-center gap-3 px-5 py-4 text-sm text-slate-700`} role="status">
            <LoaderCircle className="animate-spin text-teal-600" size={20} />
            {authStatus === "checking" ? "Checking your account..." : "Redirecting to sign in..."}
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Seo
        title="NREMT-Style EMT Exam Practice"
        description="Build EMT exam pacing and clinical judgment with timed, one-question-at-a-time NREMT-style practice sets."
        path="/exam/nremt"
      />
      <Header />
      <PageContainer size="normal" className="space-y-6">
        <PageIntro
          eyebrow="Timed exam"
          title="NREMT Exam Mode"
          description="Simulated NREMT-style practice: timed, one question at a time, no going back."
          icon={ShieldCheck}
        />

        {/* Config / start card */}
        {!current && !completed && (
          <div className={`${cardClass} p-5`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Exam details
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Each exam includes up to 25 questions from the current exam-eligible pool.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {loadingAvailability
                    ? "Checking available questions..."
                    : examQuestionCount > 0
                      ? `This exam will contain ${examQuestionCount} ${
                          examQuestionCount === 1 ? "question" : "questions"
                        }.`
                      : "No exam-eligible questions are currently available."}
                </p>
              </div>

              <button
                onClick={startExam}
                disabled={starting || loadingAvailability || examQuestionCount === 0}
                className={primaryButtonClass}
              >
                {starting
                  ? "Starting..."
                  : loadingAvailability
                    ? "Loading questions..."
                    : "Start exam"}
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
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard icon={Target} label="Score" value={`${percent}%`} detail={`${correctCount}/${totalQuestions} correct`} tone={percent >= 75 ? "teal" : percent >= 60 ? "amber" : "rose"} />
              <MetricCard icon={FileQuestion} label="Questions" value={totalQuestions} detail="Completed in this set" />
              <MetricCard icon={BarChart3} label="Domains" value={domainEntries.length || "0"} detail="Areas represented" />
            </div>

            <div className={`${cardClass} p-5`}>
              <h2 className="text-lg font-semibold text-slate-950">Exam complete</h2>
              <p className="mt-2 text-sm text-slate-700">
                You answered <span className="font-semibold">{correctCount}</span> out of{" "}
                <span className="font-semibold">{totalQuestions}</span> questions correctly.
              </p>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
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
                className={`${secondaryButtonClass} mt-4`}
              >
                Start another exam
              </button>
            </div>

            {/* Domain breakdown */}
            {domainEntries.length > 0 && (
              <div className={`${cardClass} p-5`}>
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
                        className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
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
      </PageContainer>

      {/* Live question dialog */}
      {current && (
        <ExamModeDialog
          open={true}
          onClose={exitExamNow} // X = bail
          onAdvance={handleAdvanceQuestion} // Next / Finish
          item={current.item}
          onSubmitAnswer={handleSubmitAnswer}
          hasNext={currentIndex + 1 < items.length}
          currentQuestionNumber={currentIndex + 1}
          totalQuestions={items.length}
        />
      )}
    </AppShell>
  );
}
