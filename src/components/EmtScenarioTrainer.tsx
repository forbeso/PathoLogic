import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  LoaderCircle,
} from "lucide-react";
import {
  ADAPTIVE_TARGET_STORAGE_KEY,
  recordResult,
  getWeakestTopic,
  getCachedGeneratedScenario,
  type PracticeResultInput,
} from "@/lib/adaptive";
import { supabase } from "@/lib/supabase";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import {
  cardClass,
  mutedCardClass,
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
  source: "static" | "generated";
  sourceId?: number;
  domain: string;
  topic: string;
  vignette: string;
  cues: Cue[];
  question: string;
  choices: Choice[];
  reasoning_steps: Step[];
  tags: string[];
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
    source: raw.source === "generated" ? "generated" : "static",
    sourceId:
      raw.source === "generated" &&
      Number.isInteger(Number(raw.sourceId)) &&
      Number(raw.sourceId) > 0
        ? Number(raw.sourceId)
        : undefined,
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
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<null | string>(null);
  const [showCues, setShowCues] = useState(true);
  const [showRationale, setShowRationale] = useState(false);
  const [showElims, setShowElims] = useState(false);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);
  const [adaptiveTarget, setAdaptiveTarget] = useState<string | null>(null);
  const [adaptiveLoadError, setAdaptiveLoadError] = useState<string | null>(
    null
  );
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [answerSaveError, setAnswerSaveError] = useState<string | null>(null);
  const [pendingAnswer, setPendingAnswer] =
    useState<PracticeResultInput | null>(null);

  // Initial fetch + normalize
  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const res = await fetch("/api/test");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((item) =>
          normalizeItem({ ...item, source: "static" })
        );
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
      const queuedTopic = localStorage
        .getItem(ADAPTIVE_TARGET_STORAGE_KEY)
        ?.trim();

      if (
        queuedTopic ||
        (action === "startAdaptive" && (!to || to === "/emtrainer"))
      ) {
        localStorage.removeItem("pathologix:post_login_action");
        localStorage.removeItem("pathologix:redirect_after_login");
        handoffRanRef.current = true;
        await startAdaptive(queuedTopic);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function startAdaptive(preferredTopic?: string) {
    try {
      setAdaptiveLoading(true);
      setAdaptiveLoadError(null);
      const queuedTopic = localStorage
        .getItem(ADAPTIVE_TARGET_STORAGE_KEY)
        ?.trim();
      setAdaptiveTarget(preferredTopic?.trim() || queuedTopic || null);

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

      // 2) Honor a specific handoff before falling back to account history.
      const topic =
        preferredTopic?.trim() || queuedTopic || (await getWeakestTopic());
      setAdaptiveTarget(topic);

      // 3) Load from cache or generate
      let scenario = await getCachedGeneratedScenario(topic);
      if (!scenario) {
        const res = await authenticatedFetch("/api/generateScenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) throw new Error("Generation failed");
        scenario = await res.json();
      }

      // 4) Normalize and show
      const normalized = normalizeItem({
        ...scenario,
        domain: topicToDomain(topic),
        topic,
        id: `gen-${Date.now()}`,
        source: "generated",
        sourceId: scenario.sourceId ?? scenario.id,
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
      setSavingAnswer(false);
      setAnswerSaveError(null);
      setPendingAnswer(null);
      localStorage.removeItem(ADAPTIVE_TARGET_STORAGE_KEY);
    } catch (e) {
      console.error("Adaptive load failed:", e);
      setAdaptiveLoadError(
        "We could not prepare that targeted scenario. Your current question is still available."
      );
    } finally {
      setAdaptiveLoading(false);
      setAdaptiveTarget(null);
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
    setSavingAnswer(false);
    setAnswerSaveError(null);
    setPendingAnswer(null);
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

  const savePracticeAnswer = async (answer: PracticeResultInput) => {
    setSavingAnswer(true);
    setAnswerSaveError(null);
    setPendingAnswer(answer);

    try {
      await recordResult(answer);
      setPendingAnswer(null);
    } catch (error) {
      console.error("Failed to record result", error);
      setAnswerSaveError(
        "Your answer is shown, but it could not be added to your progress."
      );
    } finally {
      setSavingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`${cardClass} mx-auto flex max-w-3xl items-center gap-3 p-5 text-slate-700`}
        role="status"
        aria-live="polite"
      >
        <LoaderCircle
          className="shrink-0 animate-spin text-teal-600 motion-reduce:animate-none"
          size={24}
          aria-hidden="true"
        />
        <div>
          <div className="font-semibold text-slate-950">
            Loading scenario trainer
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            Preparing the question set and clinical cues.
          </p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">
          No scenarios found.
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto max-w-3xl rounded-lg border border-[#c8dcd6] bg-white/58 p-4 shadow-[0_18px_42px_rgba(45,86,89,0.12)] backdrop-blur"
      aria-busy={adaptiveLoading}
    >
      <AnimatePresence>
        {adaptiveLoading ? (
          <motion.div
            className="absolute inset-0 z-20 flex items-start justify-center rounded-lg bg-white/55 px-4 pt-24 backdrop-blur-[2px] sm:pt-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className={`${cardClass} w-full max-w-sm p-5 text-center shadow-lg`}>
              <LoaderCircle
                className="mx-auto animate-spin text-teal-600 motion-reduce:animate-none"
                size={28}
                aria-hidden="true"
              />
              <div className="mt-3 text-base font-semibold text-slate-950">
                Preparing{" "}
                {adaptiveTarget ? `${adaptiveTarget} scenario` : "your scenario"}
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Finding a focused question and its clinical rationale. This may
                take a few seconds.
              </p>
              <div className="mx-auto mt-4 h-1.5 max-w-52 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full w-2/5 rounded-full bg-teal-500"
                  animate={
                    reduceMotion
                      ? { x: "75%" }
                      : { x: ["-100%", "250%"] }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 1.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {adaptiveLoadError ? (
        <div
          className="mb-4 flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{adaptiveLoadError}</span>
          <button
            type="button"
            onClick={() => void startAdaptive(item.topic)}
            className={secondaryButtonClass}
          >
            Try again
          </button>
        </div>
      ) : null}

      <motion.fieldset
        disabled={adaptiveLoading}
        className="min-w-0 space-y-6 border-0 p-0"
        animate={
          adaptiveLoading
            ? { opacity: reduceMotion ? 0.45 : [0.38, 0.55, 0.38] }
            : { opacity: 1 }
        }
        transition={
          adaptiveLoading && !reduceMotion
            ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
      >
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
            disabled={savingAnswer}
            className={secondaryButtonClass}
            aria-label="Previous"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            type="button"
            onClick={randomItem}
            disabled={savingAnswer}
            className={secondaryButtonClass}
            aria-label="Random"
          >
            <Shuffle size={16} /> Random
          </button>
          <button
            type="button"
            onClick={nextItem}
            disabled={savingAnswer}
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
            onClick={() => void startAdaptive(item.topic)}
            disabled={adaptiveLoading}
            className={primaryButtonClass}
            title="Serve a scenario targeting your weakest topic"
          >
            <Sparkles size={16} />
            {adaptiveLoading ? "Finding scenario..." : "Train on similar questions"}
          </button>
        </div>
      </section>

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
                disabled={selected !== null || savingAnswer}
                onClick={async () => {
                  if (selected !== null || savingAnswer) return;
                  setSelected(c.id);
                  setShowRationale(true);
                  await savePracticeAnswer({
                    attemptId: crypto.randomUUID(),
                    source: item.source,
                    itemId: item.source === "static" ? item.id : undefined,
                    generatedScenarioId:
                      item.source === "generated" ? item.sourceId : undefined,
                    topic: item.topic,
                    correct: c.correct,
                    selectedChoice: c.id,
                  });
                }}
                className={`flex w-full items-start gap-3 rounded-lg border border-[#b9cbc4] bg-[#fbfdfc] p-4 text-left shadow-sm transition enabled:hover:border-teal-600 enabled:hover:bg-white disabled:cursor-default ${
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

        {savingAnswer ? (
          <p className="text-xs font-medium text-slate-500" role="status">
            Saving this attempt...
          </p>
        ) : null}
        {answerSaveError ? (
          <div className="flex flex-wrap items-center gap-2" role="alert">
            <p className="text-xs font-medium text-rose-700">
              {answerSaveError}
            </p>
            {pendingAnswer ? (
              <button
                type="button"
                onClick={() => void savePracticeAnswer(pendingAnswer)}
                disabled={savingAnswer}
                className={secondaryButtonClass}
              >
                Retry save
              </button>
            ) : null}
          </div>
        ) : null}

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
      </motion.fieldset>
    </div>
  );
}
