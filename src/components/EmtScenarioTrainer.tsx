import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Brain,
  Highlighter,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
} from "lucide-react";
import ExamModeDialog, { ExamAnswerPayload } from "./ExamModeDialog";
import { recordResult, getWeakestTopic, getCachedGeneratedScenario } from "@/lib/adaptive";
import { supabase } from "@/lib/supabase";
import {
  cardClass,
  mutedCardClass,
  darkButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  StatusPill,
} from "@/components/AppShell";

/* ---------- Types ---------- */
type Cue = { text: string; rationale: string };
type Choice = {
  id: string;
  text: string;
  correct: boolean;
  why_right?: string;
  why_wrong?: string;
};
type Step = { label: string; detail: string };
type Item = {
  id: string;
  domain: string;
  topic: string;
  vignette: string;
  cues: Cue[];
  question: string;
  choices: Choice[];
  reasoning_steps: Step[];
  tags: string[];
};

type SeededItem = {
  orderIndex: number;
  itemId: string;
  item: any; // same shape as Item in ExamModeDialog
};

/* ---------- UI Helpers ---------- */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

const Panel = ({
  title,
  icon: Icon,
  children,
  openByDefault = false,
}: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  openByDefault?: boolean;
}) => {
  const [open, setOpen] = useState(openByDefault);
  return (
    <div className={cardClass}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-2 font-medium text-slate-800">
          <Icon size={18} />
          {title}
        </div>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, cues: Cue[], show: boolean) {
  if (!show || !cues?.length) return [text];
  const pattern = new RegExp(`(${cues.map((c) => escapeRegExp(c.text)).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((chunk, idx) => {
    const cue = cues.find((c) => c.text.toLowerCase() === chunk.toLowerCase());
    if (cue) {
      return (
        <motion.mark
          key={idx}
          initial={false}
          animate={{ backgroundColor: show ? "#fde68a" : "transparent" }}
          className="rounded px-1"
          title={cue.rationale}
        >
          {chunk}
        </motion.mark>
      );
    }
    return <span key={idx}>{chunk}</span>;
  });
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-slate-200/60 overflow-hidden">
      <motion.div
        className="h-full bg-teal-500"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

/* ---------- Normalizers ---------- */
function topicToDomain(topic: string) {
  const t = (topic || "").toLowerCase();
  if (/(trauma|burn|spine|head|chest|abd|orth|bleed)/.test(t)) return "Trauma";
  return "Medical";
}

function normalizeItem(raw: any): Item {
  return {
    id: String(raw.id ?? `itm-${Date.now()}`),
    domain: raw.domain ?? topicToDomain(raw.topic ?? "General"),
    topic: raw.topic ?? "General",
    vignette: raw.vignette ?? "",
    cues: Array.isArray(raw.cues) ? raw.cues : [],
    question: raw.question ?? "",
    choices: Array.isArray(raw.choices) ? raw.choices : [],
    reasoning_steps: Array.isArray(raw.reasoning_steps) ? raw.reasoning_steps : [],
    tags:
      Array.isArray(raw.tags) && raw.tags.length
        ? raw.tags
        : [raw.topic ?? "General", "NREMT"],
  };
}

/* ---------- Main ---------- */
export default function EMTScenarioTrainer() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<null | string>(null);
  const [showCues, setShowCues] = useState(true);
  const [showRationale, setShowRationale] = useState(false);
  const [showElims, setShowElims] = useState(false);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);

  // Dialog exam state (NREMT-style inside EMTrainer)
  const [examOpen, setExamOpen] = useState(false);
  const [examSessionId, setExamSessionId] = useState<string | null>(null);
  const [examItems, setExamItems] = useState<SeededItem[]>([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examStarting, setExamStarting] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);
  const [examCorrectCount, setExamCorrectCount] = useState(0);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examTotalQuestions, setExamTotalQuestions] = useState(0);
  const [examDomainStats, setExamDomainStats] = useState<
    Record<string, { correct: number; total: number }>
  >({});

  const examCurrent = examItems[examIndex] ?? null;

  // Initial fetch + normalize
  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const res = await fetch("/api/test");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map(normalizeItem);
        setItems(normalized);
      } catch {
        setItems([]);
      }
      setLoading(false);
    }
    fetchItems();
  }, []);

  // After-login handoff: run startAdaptive once after initial load if flagged
  const handoffRanRef = useRef(false);
  useEffect(() => {
    if (loading || handoffRanRef.current) return;

    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const action = localStorage.getItem("pathologix:post_login_action");
      const to = localStorage.getItem("pathologix:redirect_after_login");

      if (action === "startAdaptive" && (!to || to === "/emtrainer")) {
        localStorage.removeItem("pathologix:post_login_action");
        localStorage.removeItem("pathologix:redirect_after_login");
        handoffRanRef.current = true;
        startAdaptive();
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function startAdaptive() {
    try {
      setAdaptiveLoading(true);

      // 1) Auth gate
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        localStorage.setItem("pathologix:redirect_after_login", "/emtrainer");
        localStorage.setItem("pathologix:post_login_action", "startAdaptive");
        window.location.href = "/login";
        return;
      }

      // 2) Find weakest topic
      const topic = await getWeakestTopic();

      // 3) Load from cache or generate
      let scenario = await getCachedGeneratedScenario(topic);
      if (!scenario) {
        const res = await fetch("/api/generateScenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) throw new Error("Generation failed");
        scenario = await res.json();

        // 4) Cache it for this user
        const ins = await supabase.from("generated_scenarios").insert({
          user_id: user.id,
          topic,
          vignette: scenario.vignette,
          cues: scenario.cues,
          question: scenario.question,
          choices: scenario.choices,
          reasoning_steps: scenario.reasoning_steps,
        });
        if (ins.error) console.error("Cache insert failed:", ins.error);
      }

      // 5) Normalize and show
      const normalized = normalizeItem({
        ...scenario,
        domain: topicToDomain(topic),
        topic,
        id: `gen-${Date.now()}`,
        tags:
          Array.isArray(scenario.tags) && scenario.tags.length
            ? scenario.tags
            : [topic, "Adaptive", "NREMT"],
      });

      setItems((prev: Item[]) => {
        const next = [...prev, normalized];
        setIndex(next.length - 1);
        return next;
      });
      setSelected(null);
      setShowCues(true);
      setShowRationale(false);
      setShowElims(false);
    } catch (e) {
      console.error("Adaptive load failed:", e);
    } finally {
      setAdaptiveLoading(false);
    }
  }

  const item = items[index];

  const correct = useMemo(() => item?.choices.find((c) => c.correct)?.id, [item]);
  const isCorrect = Boolean(selected && selected === correct);

  const safeTags = useMemo(() => {
    if (!item) return [];
    return (Array.isArray(item.tags) && item.tags.length ? item.tags : [item.topic])
      .filter(Boolean)
      .slice(0, 3);
  }, [item]);

  const goto = (i: number) => {
    setSelected(null);
    setShowCues(true);
    setShowRationale(false);
    setShowElims(false);
    if (items.length > 0) {
      setIndex(((i % items.length) + items.length) % items.length);
    }
  };

  const nextItem = () => goto(index + 1);
  const prevItem = () => goto(index - 1);
  const randomItem = () => {
    if (items.length <= 1) return;
    let n = index;
    while (n === index) n = Math.floor(Math.random() * items.length);
    goto(n);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center ">
        <div className={`${cardClass} flex items-center gap-2 px-4 py-2 text-slate-700`}>
          <motion.span
            className="inline-block h-2 w-2 rounded-full bg-teal-500"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          Checking vitals...
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">
          No scenarios found.
        </div>
      </div>
    );
  }

  /* ---------- NREMT dialog exam logic ---------- */

  const startDialogExam = async () => {
    setExamError(null);
    setExamStarting(true);
    setExamCorrectCount(0);
    setExamIndex(0);
    setExamItems([]);
    setExamSessionId(null);
    setExamCompleted(false);
    setExamTotalQuestions(0);
    setExamDomainStats({});

    try {
      const res = await fetch("/api/exam/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemCount: 40 }), // or whatever length you want
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to start exam");
      }

      const data = await res.json();
      setExamSessionId(data.sessionId); // currently null in stub, fine
      setExamItems(data.items ?? []);
      setExamTotalQuestions(data.items?.length ?? 0);
      setExamOpen(true); // open dialog AFTER items are loaded
    } catch (err: any) {
      setExamError(err.message ?? "Something went wrong");
    } finally {
      setExamStarting(false);
    }
  };

  const handleDialogSubmitAnswer = async (payload: ExamAnswerPayload) => {
    if (!examCurrent) return;

    // Update domain stats locally
    const domain = examCurrent.item?.domain ?? "Unknown";
    setExamDomainStats((prev) => {
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
          sessionId: examSessionId,
          itemId: payload.itemId,
          orderIndex: examCurrent.orderIndex,
          selectedChoiceId: payload.selectedChoiceId,
          timeSpentSeconds: payload.timeSpentSeconds,
        }),
      });

      if (payload.correct) {
        setExamCorrectCount((prev) => prev + 1);
      }
    } catch {
      // optional: toast/log
    }
  };

  const handleDialogAdvance = () => {
    if (!examCurrent) return;

    const nextIndex = examIndex + 1;
    if (nextIndex < examItems.length) {
      setExamIndex(nextIndex);
      return;
    }

    // Finished dialog exam
    setExamOpen(false);
    setExamSessionId(null);
    setExamCompleted(true);
  };

  const handleDialogExit = () => {
    // user hit X: bail out immediately, no summary
    setExamOpen(false);
    setExamItems([]);
    setExamSessionId(null);
    setExamCompleted(false);
    setExamCorrectCount(0);
    setExamDomainStats({});
    setExamTotalQuestions(0);
  };

  const totalExamQuestions = examTotalQuestions || examItems.length || 0;
  const examPercent =
    totalExamQuestions > 0
      ? Math.round((examCorrectCount / totalExamQuestions) * 100)
      : 0;

  let examPerformanceLabel = "Needs work";
  let examPerformanceDetail =
    "Focus on understanding core pathophysiology and algorithms, then re-test.";
  if (examPercent >= 85) {
    examPerformanceLabel = "Strong performance";
    examPerformanceDetail =
      "You are testing in a range consistent with a high chance of passing NREMT.";
  } else if (examPercent >= 75) {
    examPerformanceLabel = "On the edge";
    examPerformanceDetail =
      "You are close. Tighten up weak domains and do another full exam run.";
  } else if (examPercent >= 65) {
    examPerformanceLabel = "Improving";
    examPerformanceDetail =
      "You are building a base. Target weaker domains with focused practice scenarios.";
  }

  const examDomainEntries = Object.entries(examDomainStats).sort(
    (a, b) => (b[1].total || 0) - (a[1].total || 0)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-lg border border-[#c8dcd6] bg-white/58 p-4 shadow-[0_18px_42px_rgba(45,86,89,0.12)] backdrop-blur">
      {/* Scenario metadata + nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {safeTags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevItem}
            className={secondaryButtonClass}
            aria-label="Previous"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            type="button"
            onClick={randomItem}
            className={secondaryButtonClass}
            aria-label="Random"
          >
            <Shuffle size={16} /> Random
          </button>
          <button
            type="button"
            onClick={nextItem}
            className={secondaryButtonClass}
            aria-label="Next"
          >
            Next <ChevronRight size={16} />
          </button>
{/* 
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
            {index + 1}/{items.length}
          </span> */}
        </div>

        <ProgressBar value={index + 1} max={items.length} />
      </div>

      {/* Vignette */}
      <section className={`${cardClass} p-4`}>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-800">
          <Brain size={16} /> Scenario
        </div>
        <p className="text-lg leading-relaxed text-slate-950">
          {renderHighlighted(item.vignette, item.cues, showCues)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCues((s) => !s)}
            className={secondaryButtonClass}
          >
            {showCues ? "Hide" : "Show"} cues
          </button>
          <button
            type="button"
            onClick={() => setShowRationale((s) => !s)}
            className={secondaryButtonClass}
          >
            {showRationale ? "Hide" : "Show"} rationales
          </button>

          {/* Adaptive */}
          <button
            onClick={startAdaptive}
            disabled={adaptiveLoading}
            className={primaryButtonClass}
            title="Serve a scenario targeting your weakest topic"
          >
            <Sparkles size={16} />
            {adaptiveLoading ? "Finding scenario..." : "Train on similar questions"}
          </button>

          {/* NREMT Exam Mode (dialog) */}
          <button
            onClick={startDialogExam}
            disabled={examStarting}
            className={darkButtonClass}
          >
            {examStarting ? "Starting..." : "NREMT Exam Mode"}
          </button>

          {examError && (
            <p className="mt-2 text-xs text-rose-600">
              {examError}
            </p>
          )}
        </div>
      </section>

      {/* Exam dialog & summary */}
      {examOpen && examCurrent && (
        <ExamModeDialog
          open={examOpen}
          onClose={handleDialogExit} // X = exit exam immediately
          onAdvance={handleDialogAdvance} // "Next / Finish" = advance or finish
          item={examCurrent.item}
          onSubmitAnswer={handleDialogSubmitAnswer}
          hasNext={examIndex + 1 < examItems.length}
          currentQuestionNumber={examIndex + 1}
          totalQuestions={examItems.length}
        />
      )}

      {examCompleted && totalExamQuestions > 0 && (
        <section className={`${cardClass} space-y-3 p-4`}>
          <h3 className="text-sm font-semibold text-slate-900">
            NREMT Exam Mode Summary
          </h3>
          <p className="text-sm text-slate-700">
            You answered{" "}
            <span className="font-semibold">{examCorrectCount}</span> out of{" "}
            <span className="font-semibold">{totalExamQuestions}</span>{" "}
            questions correctly.
          </p>
          <p className="text-sm">
            <span className="font-semibold text-slate-900">
              Score: {examPercent}%
            </span>
          </p>
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Performance snapshot
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {examPerformanceLabel}
            </div>
            <p className="mt-1 text-xs text-slate-700">
              {examPerformanceDetail}
            </p>
          </div>

          {examDomainEntries.length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-semibold text-slate-800">
                Domain breakdown
              </h4>
              <p className="mt-1 text-xs text-slate-600">
                Strong domains should feel automatic. Weak domains are where you&apos;ll bleed points on NREMT.
              </p>
              <div className="mt-2 space-y-2">
                {examDomainEntries.map(([domain, stat]) => {
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
        </section>
      )}

      {/* Question & Choices */}
      <section className={`${mutedCardClass} space-y-3 p-4`}>
        <div className="text-sm font-semibold text-slate-600">Question</div>
        <h2 className="text-xl font-bold text-slate-950">{item.question}</h2>

        <div className="space-y-2">
          {item.choices.map((c: Choice) => {
            const chosen = selected === c.id;
            const correctChoice = c.correct;
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={async () => {
                  setSelected(c.id);
                  setShowRationale(true);
                  try {
                    await recordResult({
                      itemId: item.id,
                      topic: item.topic,
                      correct: c.correct,
                      selectedChoice: c.id,
                    });
                  } catch (e) {
                    console.error("Failed to record result", e);
                  }
                }}
                className={`flex w-full items-start gap-3 rounded-lg border border-[#b9cbc4] bg-[#fbfdfc] p-4 text-left shadow-sm transition hover:border-teal-600 hover:bg-white ${
                  chosen
                    ? correctChoice
                      ? "ring-2 ring-teal-400"
                      : "ring-2 ring-rose-300"
                    : ""
                }`}
              >
                <div className="mt-1 font-mono text-sm">{c.id}.</div>
                <div className="flex-1">
                  <div className="font-medium text-slate-950">{c.text}</div>

                  <AnimatePresence initial={false}>
                    {chosen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="mt-2 flex items-center gap-2 text-sm"
                      >
                        {correctChoice ? (
                          <StatusPill tone="teal">
                            <Check size={16} /> Correct
                          </StatusPill>
                        ) : (
                          <StatusPill tone="rose">
                            <X size={16} /> Not quite
                          </StatusPill>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showRationale && (
                    <div className="mt-2 text-sm text-slate-700">
                      {c.correct ? (
                        c.why_right ? (
                          <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                            <div className="mb-1 font-medium">Why this is right</div>
                            <p>{c.why_right}</p>
                          </div>
                        ) : null
                      ) : c.why_wrong ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                          <div className="mb-1 font-medium">Common trap</div>
                          <p>{c.why_wrong}</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {showElims && !c.correct && (
                    <div className="mt-2 text-xs text-slate-600">
                      Tip: Match distractor hallmarks to absent cues in the stem.
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg border p-4 shadow-sm ${
              isCorrect ? "bg-teal-50 border-teal-200" : "bg-rose-50 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <Lightbulb size={18} />
              {isCorrect
                ? "Nice! Your reasoning matches the key cues."
                : "Review the cues and try the elimination steps."}
            </div>
            <div className="mt-2 text-sm text-slate-700">
              {isCorrect
                ? "Correct reasoning applied."
                : "Compare the hallmark signs of your choice to the cues in the stem - what is missing?"}
            </div>
          </motion.div>
        )}
      </section>

      {/* Reasoning Panels */}
      <section className="space-y-3">
        <Panel title="Step-by-step breakdown" icon={ListChecks} openByDefault>
          <ol className="list-decimal space-y-2 pl-5">
            {item.reasoning_steps.map((s: Step, i: number) => (
              <li key={i} className="leading-relaxed">
                <span className="font-medium">{s.label}:</span> {s.detail}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Cue rationales" icon={Highlighter}>
          <ul className="space-y-2">
            {item.cues.map((c: Cue, i: number) => (
              <li key={i} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <div className="font-medium">{c.text}</div>
                <p className="text-sm text-gray-700">{c.rationale}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* Footer */}
      <footer className="pt-2 text-xs text-slate-400 mb-4">
        PathoLogix 2025 &copy; - Practice scenarios for EMTs. Not a substitute for formal training or protocols.
      </footer>
    </div>
  );
}
