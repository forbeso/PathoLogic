import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { ADAPTIVE_TARGET_STORAGE_KEY } from "@/lib/adaptive";
import {
  ArrowRight,
  Award,
  BarChart2,
  Target,
  Flame,
  Clock,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useLearnerProgress } from "@/hooks/useLearnerProgress";
import Seo from "@/components/Seo";
import {
  AppShell,
  PageContainer,
  PageIntro,
  MetricCard,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/AppShell";

type PerfRow = {
  user_id: string;
  topic: string;
  accuracy: number;      // 0..1
  attempts: number;
  last_practiced: string;
};

type ExamSessionRow = {
  id: string;
  correct_count: number;
  question_count: number;
  score_percent: number | string;
  domain_stats: Record<string, { correct: number; total: number }>;
  completed_at: string;
};

type ScenarioAttemptRow = {
  id: string;
  scenario_id: "anaphylaxis" | "car-accident";
  simulation_mode: "guided" | "scenario" | "exam";
  score_percent: number;
  completed_objectives: number;
  total_objectives: number;
  elapsed_seconds: number;
  hints_used: number;
  completed_at: string;
};

type StudyRecommendation = {
  title: string;
  description: string;
  actionLabel: string;
  href: "/emtrainer" | "/exam/nremt" | "/emtscene";
  topic?: string;
};

const SCENARIO_TITLES: Record<ScenarioAttemptRow["scenario_id"], string> = {
  anaphylaxis: "Teen With Shortness of Breath",
  "car-accident": "Driver Trapped After Collision",
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function PercentBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className={`h-2 rounded-full transition-all ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ProgressPage() {
  const { progress: learnerProgress, level: learnerLevel } =
    useLearnerProgress();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PerfRow[]>([]);
  const [examRows, setExamRows] = useState<ExamSessionRow[]>([]);
  const [examHistoryAvailable, setExamHistoryAvailable] = useState(true);
  const [scenarioRows, setScenarioRows] = useState<ScenarioAttemptRow[]>([]);
  const [scenarioHistoryAvailable, setScenarioHistoryAvailable] =
    useState(true);
  const [sortKey, setSortKey] = useState<"topic" | "accuracy" | "attempts" | "last_practiced">("accuracy");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      if (!s) {
        window.location.href = "/login";
        return;
      }
      await loadPerf();
      setLoading(false);
    });
  }, []);

  async function loadPerf() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);

    const [performanceResult, examResult, scenarioResult] = await Promise.all([
      supabase
        .from("performance")
        .select("user_id, topic, accuracy, attempts, last_practiced")
        .eq("user_id", user.id),
      supabase
        .from("exam_sessions")
        .select("id, correct_count, question_count, score_percent, domain_stats, completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10),
      supabase
        .from("scenario_attempts")
        .select(
          "id, scenario_id, simulation_mode, score_percent, completed_objectives, total_objectives, elapsed_seconds, hints_used, completed_at"
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10),
    ]);

    if (!performanceResult.error && performanceResult.data) {
      setRows(performanceResult.data as PerfRow[]);
    }

    if (!examResult.error && examResult.data) {
      setExamRows(examResult.data as ExamSessionRow[]);
      setExamHistoryAvailable(true);
    } else {
      setExamRows([]);
      setExamHistoryAvailable(false);
    }

    if (!scenarioResult.error && scenarioResult.data) {
      setScenarioRows(scenarioResult.data as ScenarioAttemptRow[]);
      setScenarioHistoryAvailable(true);
    } else {
      setScenarioRows([]);
      setScenarioHistoryAvailable(false);
    }

    setLoading(false);
  }

  function toggleSort(key: typeof sortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let A: any = a[sortKey];
      let B: any = b[sortKey];
      if (sortKey === "last_practiced") {
        A = new Date(a.last_practiced).getTime();
        B = new Date(b.last_practiced).getTime();
      }
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(() => {
    if (!rows.length) return { attempts: 0, overallAcc: 0, topics: 0, last: null as string | null };
    const attempts = rows.reduce((s, r) => s + r.attempts, 0);
    const weighted = rows.reduce((s, r) => s + r.accuracy * r.attempts, 0);
    const overallAcc = attempts ? weighted / attempts : 0;
    const last = rows.map((r) => r.last_practiced).sort().slice(-1)[0] ?? null;
    return { attempts, overallAcc, topics: rows.length, last };
  }, [rows]);

  const examTotals = useMemo(() => {
    const scores = examRows.map((row) => Number(row.score_percent) || 0);
    const average = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
    const best = scores.length ? Math.max(...scores) : 0;
    return { attempts: examRows.length, average, best };
  }, [examRows]);

  const scenarioTotals = useMemo(() => {
    const scores = scenarioRows.map((row) => Number(row.score_percent) || 0);
    const average = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
    return { attempts: scenarioRows.length, average };
  }, [scenarioRows]);

  const recommendation = useMemo<StudyRecommendation>(() => {
    if (!rows.length) {
      return {
        title: "Establish your practice baseline",
        description:
          "Answer a few scenario questions so PathoLogix can identify the domains that deserve your attention.",
        actionLabel: "Start practice",
        href: "/emtrainer",
      };
    }

    const weakestTopic = [...rows].sort(
      (a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts
    )[0];
    const establishedWeakTopic = [...rows]
      .filter((row) => row.attempts >= 2 && row.accuracy < 0.7)
      .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)[0];

    if (establishedWeakTopic) {
      return {
        title: `Strengthen ${establishedWeakTopic.topic}`,
        description: `Your current accuracy is ${Math.round(
          establishedWeakTopic.accuracy * 100
        )}% across ${establishedWeakTopic.attempts} attempts. A focused practice question is the highest-value next step.`,
        actionLabel: `Practice ${establishedWeakTopic.topic}`,
        href: "/emtrainer",
        topic: establishedWeakTopic.topic,
      };
    }

    if (!examRows.length && totals.attempts >= 5) {
      return {
        title: "Check your exam readiness",
        description:
          "You have enough practice history for a meaningful 25-question baseline. Use the result to guide your next study block.",
        actionLabel: "Take a readiness exam",
        href: "/exam/nremt",
      };
    }

    const latestExam = examRows[0];
    if (latestExam && Number(latestExam.score_percent) < 75) {
      const weakestExamDomain = Object.entries(latestExam.domain_stats ?? {})
        .filter(([, stat]) => stat.total > 0)
        .sort(
          ([, a], [, b]) =>
            a.correct / a.total - b.correct / b.total
        )[0]?.[0];

      return {
        title: `Review ${weakestExamDomain ?? weakestTopic.topic}`,
        description: `Your latest exam score was ${Math.round(
          Number(latestExam.score_percent)
        )}%. Focused remediation will be more useful than immediately repeating the full exam.`,
        actionLabel: "Start focused practice",
        href: "/emtrainer",
        topic: weakestExamDomain ?? weakestTopic.topic,
      };
    }

    if (!scenarioRows.length) {
      return {
        title: "Apply your knowledge in EMT Scene",
        description:
          "Your question practice is established. Complete a guided simulation next to rehearse scene size-up and patient assessment in context.",
        actionLabel: "Start guided simulation",
        href: "/emtscene",
      };
    }

    if (scenarioTotals.average < 75) {
      return {
        title: "Repeat a simulation with less guidance",
        description: `Your simulation average is ${scenarioTotals.average}%. Another run will help turn the assessment sequence into a reliable habit.`,
        actionLabel: "Open EMT Scene",
        href: "/emtscene",
      };
    }

    return {
      title: `Keep ${weakestTopic.topic} sharp`,
      description:
        "Your recent work is on track. Use a focused scenario to maintain recall in your lowest-performing topic.",
      actionLabel: `Practice ${weakestTopic.topic}`,
      href: "/emtrainer",
      topic: weakestTopic.topic,
    };
  }, [examRows, rows, scenarioRows.length, scenarioTotals.average, totals.attempts]);

  function openRecommendation(next: StudyRecommendation) {
    if (next.topic) {
      localStorage.setItem(ADAPTIVE_TARGET_STORAGE_KEY, next.topic);
    } else {
      localStorage.removeItem(ADAPTIVE_TARGET_STORAGE_KEY);
    }
    window.location.href = next.href;
  }

  return (
    <AppShell>
      <Seo
        title="My EMT Training Progress"
        description="Review your private PathoLogix practice history, accuracy, and weaker EMT domains."
        path="/progress"
        noIndex
      />
      <Header />

      <PageContainer className="space-y-6">
        <PageIntro
          eyebrow="Progress dashboard"
          title="My Progress"
          description="Track accuracy, attempts, and weak domains so your next study session has a clear target."
          icon={BarChart2}
          actions={
            <button
              onClick={loadPerf}
              className={secondaryButtonClass}
            >
              Refresh
            </button>
          }
        />

        <section
          className={`${cardClass} flex flex-col gap-4 border-l-4 border-l-teal-500 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}
          aria-labelledby="next-session-title"
        >
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
              <Sparkles size={16} aria-hidden="true" />
              Recommended next session
            </div>
            <h2
              id="next-session-title"
              className="mt-2 text-xl font-semibold text-slate-950"
            >
              {recommendation.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {recommendation.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openRecommendation(recommendation)}
            className={`${primaryButtonClass} w-full shrink-0 justify-center sm:w-auto`}
          >
            {recommendation.actionLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Trophy}
            label="Current Level"
            value={learnerLevel.level}
            detail={`${learnerLevel.xpIntoLevel}/${learnerLevel.xpForNextLevel} XP to advance`}
            tone="amber"
          />
          <MetricCard
            icon={Zap}
            label="Total XP"
            value={learnerProgress.totalXp}
            detail={
              <div className="mt-3">
                <PercentBar value={learnerLevel.percent / 100} />
              </div>
            }
            tone="teal"
          />
          <MetricCard
            icon={Flame}
            label="Current Streak"
            value={`${learnerProgress.currentStreak} ${
              learnerProgress.currentStreak === 1 ? "day" : "days"
            }`}
            detail="Earn XP on consecutive days"
            tone="rose"
          />
          <MetricCard
            icon={Award}
            label="Longest Streak"
            value={`${learnerProgress.longestStreak} ${
              learnerProgress.longestStreak === 1 ? "day" : "days"
            }`}
            detail="Your personal best"
          />
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={BarChart2}
            label="Overall Accuracy"
            value={`${(totals.overallAcc * 100).toFixed(0)}%`}
            tone={totals.overallAcc >= 0.7 ? "teal" : totals.overallAcc >= 0.4 ? "amber" : "rose"}
            detail={
            <div className="mt-3">
              <PercentBar value={totals.overallAcc} />
            </div>
            }
          />

          <MetricCard icon={Flame} label="Total Attempts" value={totals.attempts} detail="Across all topics" tone="amber" />

          <MetricCard icon={Target} label="Topics Trained" value={totals.topics} detail="Unique topics with history" tone="teal" />

          <MetricCard
            icon={Clock}
            label="Last Practiced"
            value={
              <span className="text-base font-semibold">
              {totals.last ? new Date(totals.last).toLocaleString() : "-"}
              </span>
            }
            detail="Most recent update"
          />
        </section>

        {examHistoryAvailable && (
          <section className={`${cardClass} p-4 sm:p-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-teal-700">
                  <Award size={18} aria-hidden="true" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    Exam history
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Completed NREMT-style attempts saved to your account.
                </p>
              </div>
              <Link href="/exam/nremt" className={secondaryButtonClass}>
                Take an exam
              </Link>
            </div>

            {examRows.length > 0 ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Completed</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">{examTotals.attempts}</div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Average score</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">{examTotals.average}%</div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Best score</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">{examTotals.best}%</div>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {examRows.slice(0, 5).map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {new Date(exam.completed_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {exam.correct_count}/{exam.question_count} correct
                        </div>
                      </div>
                      <div
                        className={`text-lg font-semibold tabular-nums ${
                          Number(exam.score_percent) >= 75
                            ? "text-emerald-700"
                            : Number(exam.score_percent) >= 60
                              ? "text-amber-700"
                              : "text-rose-700"
                        }`}
                      >
                        {Math.round(Number(exam.score_percent))}%
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-900">No completed exams yet</p>
                <p className="mt-1 text-xs text-slate-600">
                  Finish an exam to see your score trend here.
                </p>
              </div>
            )}
          </section>
        )}

        {scenarioHistoryAvailable && (
          <section className={`${cardClass} p-4 sm:p-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-teal-700">
                  <Target size={18} aria-hidden="true" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    Simulation history
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Completed EMT Scene runs, scores, and training time.
                </p>
              </div>
              <Link href="/emtscene" className={secondaryButtonClass}>
                Open EMT Scene
              </Link>
            </div>

            {scenarioRows.length > 0 ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Completed runs
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">
                      {scenarioTotals.attempts}
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Average score
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">
                      {scenarioTotals.average}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {scenarioRows.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">
                          {SCENARIO_TITLES[attempt.scenario_id]}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {attempt.simulation_mode === "guided"
                            ? "Guided"
                            : attempt.simulation_mode === "exam"
                              ? "Exam"
                              : "Scenario"}{" "}
                          · {formatDuration(attempt.elapsed_seconds)} ·{" "}
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 text-lg font-semibold tabular-nums ${
                          attempt.score_percent >= 75
                            ? "text-emerald-700"
                            : attempt.score_percent >= 60
                              ? "text-amber-700"
                              : "text-rose-700"
                        }`}
                      >
                        {attempt.score_percent}%
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No completed simulations yet
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Finish every objective in an EMT Scene run to save it here.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Table */}
        <section className={`${cardClass} p-4`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("topic")} className="inline-flex items-center gap-1">
                      Topic {sortKey === "topic" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("accuracy")} className="inline-flex items-center gap-1">
                      Accuracy {sortKey === "accuracy" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("attempts")} className="inline-flex items-center gap-1">
                      Attempts {sortKey === "attempts" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">
                    <button onClick={() => toggleSort("last_practiced")} className="inline-flex items-center gap-1">
                      Last practiced {sortKey === "last_practiced" ? (sortDir === "asc" ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
                    </button>
                  </th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-600">Loading...</td></tr>
                )}

                {!loading && sorted.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-600">No data yet. Answer a few questions in the trainer to see progress.</td></tr>
                )}

                {!loading && sorted.map((r) => {
                  const pct = r.accuracy * 100;
                  return (
                    <tr key={r.topic} className="border-t border-slate-100">
                      <td className="px-2 py-3 font-medium text-slate-900">{r.topic}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-40"><PercentBar value={r.accuracy} /></div>
                          <div className="tabular-nums">{pct.toFixed(0)}%</div>
                        </div>
                      </td>
                      <td className="px-2 py-3 tabular-nums">{r.attempts}</td>
                      <td className="px-2 py-3 text-slate-600">{new Date(r.last_practiced).toLocaleString()}</td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => {
                            localStorage.setItem(ADAPTIVE_TARGET_STORAGE_KEY, r.topic);
                            window.location.href = "/emtrainer";
                          }}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1 shadow-sm hover:bg-slate-50"
                        >
                          Train this topic
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer hint */}
        <p className="text-xs text-slate-500">
          Tip: accuracy is a running average. It updates each time you answer in the trainer.
        </p>
      </PageContainer>
    </AppShell>
  );
}
