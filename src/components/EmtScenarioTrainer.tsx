import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  Highlighter,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
  Ambulance
} from "lucide-react";
import AssessmentSidebar from "./AssessmentSidebar";

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

/* ---------- UI Helpers ---------- */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2 py-0.5 text-xs text-slate-700 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-1 text-sm text-slate-700 shadow-sm backdrop-blur">
      <Icon size={16} />
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
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
  openByDefault?: boolean;
}) => {
  const [open, setOpen] = useState(openByDefault);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/60"
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
  const pattern = new RegExp(
    `(${cues.map((c) => escapeRegExp(c.text)).join("|")})`,
    "gi"
  );
  const parts = text.split(pattern);
  return parts.map((chunk, idx) => {
    const cue = cues.find(
      (c) => c.text.toLowerCase() === chunk.toLowerCase()
    );
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
        className="h-full bg-emerald-500"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

/* ---------- Main ---------- */
export default function EMTScenarioTrainer() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<null | string>(null);
  const [showCues, setShowCues] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const [showElims, setShowElims] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);


  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const res = await fetch("/api/test");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      }
      setLoading(false);
    }
    fetchItems();
  }, []);

  // Keyboard shortcuts: ← prev, → next, R random
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextItem();
      if (e.key === "ArrowLeft") prevItem();
      //if (e.key.toLowerCase() === "r") randomItem();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length]);

  const item = items[index];
  const correct = useMemo(
    () => item?.choices.find((c) => c.correct)?.id,
    [item]
  );
  const isCorrect = selected && selected === correct;

  const goto = (i: number) => {
    setSelected(null);
    setShowCues(false);
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
      <div className="min-h-screen grid place-items-center bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(16,185,129,0.10),transparent)]">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2 text-slate-700 shadow-sm backdrop-blur">
          <motion.span
            className="inline-block h-2 w-2 rounded-full bg-emerald-500"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          Checking Vitals...
        </div>
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">
          No scenarios found.
        </div>
      </div>
    );
  }

  return (

      <div className="mx-auto max-w-3xl space-y-6 mt-4">
        {/* Header */}
        <AssessmentSidebar
    item={item}
    open={assessmentOpen}
    onClose={() => setAssessmentOpen(false)}
/>
        {/* Scenario metadata + nav */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((t: string) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevItem}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50 backdrop-blur"
              aria-label="Previous"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              type="button"
              onClick={randomItem}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50 backdrop-blur"
              aria-label="Random"
            >
              <Shuffle size={16} /> Random
            </button>
            <button
              type="button"
              onClick={nextItem}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50 backdrop-blur"
              aria-label="Next"
            >
              Next <ChevronRight size={16} />
            </button>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                {index + 1}/{items.length}
              </span>
          </div>
           <ProgressBar value={index + 1} max={items.length} />

        </div>

        {/* Vignette */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
            <Brain size={16} /> Scenario
          </div>
          <p className="leading-relaxed text-gray-900">
            {renderHighlighted(item.vignette, item.cues, showCues)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCues((s) => !s)}
              className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50 backdrop-blur"
            >
              {showCues ? "Hide" : "Show"} cues
            </button>
            <button
              type="button"
              onClick={() => setShowRationale((s) => !s)}
              className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50 backdrop-blur"
            >
              {showRationale ? "Hide" : "Show"} rationales
            </button>
            <button
              type="button"
              onClick={() => setShowElims((s) => !s)}
              className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50 backdrop-blur"
            >
              {showElims ? "Hide" : "Show"} elimination tips
            </button>
            <button
                onClick={() => setAssessmentOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-1 text-xs font-medium shadow-sm hover:bg-slate-50"
              >
                  Open Assessment Mode
            </button>
          </div>
 
        </section>

        {/* Question & Choices */}
        <section className="space-y-3">
          <div className="text-sm text-gray-600">Question</div>
          <h2 className="text-lg font-medium text-gray-900">{item.question}</h2>

          <div className="space-y-2">
            {item.choices.map((c: Choice) => {
              const chosen = selected === c.id;
              const correctChoice = c.correct;
              return (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-sm hover:bg-slate-50 backdrop-blur ${
                    chosen
                      ? correctChoice
                        ? "ring-2 ring-emerald-400"
                        : "ring-2 ring-rose-300"
                      : ""
                  }`}
                >
                  <div className="mt-1 font-mono text-sm">{c.id}.</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{c.text}</div>

                    <AnimatePresence initial={false}>
                      {chosen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mt-2 flex items-center gap-2 text-sm"
                        >
                          {correctChoice ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                              <Check size={16} /> Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                              <X size={16} /> Not quite
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {showRationale && (
                      <div className="mt-2 text-sm text-gray-700">
                        {c.correct ? (
                          c.why_right ? (
                            <div className="rounded-lg border bg-emerald-50 p-3">
                              <div className="mb-1 font-medium">Why this is right</div>
                              <p>{c.why_right}</p>
                            </div>
                          ) : null
                        ) : c.why_wrong ? (
                          <div className="rounded-lg border bg-amber-50 p-3">
                            <div className="mb-1 font-medium">Common trap</div>
                            <p>{c.why_wrong}</p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {showElims && !c.correct && (
                      <div className="mt-2 text-xs text-gray-600">
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
              className={`rounded-2xl border p-4 shadow-sm ${
                isCorrect
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-rose-50 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <Lightbulb size={18} />
                {isCorrect
                  ? "Nice! Your reasoning matches the key cues."
                  : "Review the cues and try the elimination steps."}
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {isCorrect
                  ? "Correct reasoning applied."
                  : "Compare the hallmark signs of your choice to the cues in the stem—what’s missing?"}
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
                <li
                  key={i}
                  className="rounded-lg border bg-white/90 p-3 shadow-sm"
                >
                  <div className="font-medium">{c.text}</div>
                  <p className="text-sm text-gray-700">{c.rationale}</p>
                </li>
              ))}
            </ul>
          </Panel>

          {/* <Panel title="What to do next (protocol-agnostic)" icon={HelpCircle}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Control life-threatening bleeding; splint/traction per local protocol when indicated.</li>
              <li>High-flow O<sub>2</sub>; assist ventilations as needed; continuous monitoring.</li>
              <li>Rapid transport; consider permissive hypotension in significant hemorrhage (per local guidelines).</li>
              <li>Consider TXA timing per medical control/protocols where applicable.</li>
            </ul>
          </Panel> */}
        </section>

        {/* Footer */}
        <footer className="pt-2 text-xs text-gray-500">
          PathoLogic 2025 &copy; — Practice scenarios for EMTs. Not a substitute for formal training or protocols.
        </footer>
      </div>
   
  );
}
