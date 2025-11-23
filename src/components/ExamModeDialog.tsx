import React, { useEffect, useState } from "react";
import { X, ExternalLink, Clock3, CheckCircle2 } from "lucide-react";

type Cue = { text: string; rationale: string };
type Choice = { id: string; text: string; correct: boolean; why_right?: string; why_wrong?: string };
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

export type ExamAnswerPayload = {
  itemId: string;
  selectedChoiceId: string | null;
  correct: boolean;
  timeSpentSeconds: number;
  expired: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;             // X button / escape = EXIT exam
  onAdvance?: () => void;          // "Next question" / "Finish exam"
  item: Item;
  onSubmitAnswer?: (payload: ExamAnswerPayload) => void;
  hasNext?: boolean;
};

// seconds per question
const QUESTION_DURATION_SECONDS = 90;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ExamModeDialog({ open, onClose, item, onSubmitAnswer, hasNext, onAdvance }: Props) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [expired, setExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(QUESTION_DURATION_SECONDS);
  const [hasReported, setHasReported] = useState(false);

  // Reset every time you open or the item changes
  useEffect(() => {
    if (!open) return;
    setSelectedChoiceId(null);
    setSubmitted(false);
    setExpired(false);
    setTimeRemaining(QUESTION_DURATION_SECONDS);
    setHasReported(false);
  }, [open, item.id]);

  // Timer
  useEffect(() => {
    if (!open) return;
    if (submitted || expired) return;

    const id = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setExpired(true);
          setSubmitted(true);
          // auto-report on timeout
          if (!hasReported) {
            const selected = item.choices.find((c) => c.id === selectedChoiceId) || null;
            const correct = !!selected && selected.correct;
            setHasReported(true);
            onSubmitAnswer?.({
              itemId: item.id,
              selectedChoiceId,
              correct,
              timeSpentSeconds: QUESTION_DURATION_SECONDS,
              expired: true,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [open, submitted, expired, selectedChoiceId, hasReported, item, onSubmitAnswer]);

  const fireReportIfNeeded = (expiredFlag: boolean) => {
    if (hasReported) return;
    const selected = item.choices.find((c) => c.id === selectedChoiceId) || null;
    const correct = !!selected && selected.correct;
    const timeSpentSeconds = expiredFlag
      ? QUESTION_DURATION_SECONDS
      : Math.max(0, QUESTION_DURATION_SECONDS - timeRemaining);

    setHasReported(true);
    onSubmitAnswer?.({
      itemId: item.id,
      selectedChoiceId,
      correct,
      timeSpentSeconds,
      expired: expiredFlag,
    });
  };

const handleAdvance = () => {
  if (onAdvance) onAdvance();
  else onClose();
};


  const handleSubmit = () => {
    if (!selectedChoiceId || submitted) return;
    setSubmitted(true);
    fireReportIfNeeded(false);
  };

  const closeOnEsc = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
  };

  const openInNewTab = () => {
  window.open("/exam/nremt", "_blank", "noopener,noreferrer");
};

  if (!open) return null;

  const selectedChoice = item.choices.find((c) => c.id === selectedChoiceId) || null;
  const isCorrect = submitted && !!selectedChoice && selectedChoice.correct;

  const renderChoice = (choice: Choice, index: number) => {
    const isSelected = selectedChoiceId === choice.id;
    const isChoiceCorrect = choice.correct;

    let borderClasses = "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm";
    if (submitted) {
      if (isChoiceCorrect) {
        borderClasses = "border-emerald-500 bg-emerald-50";
      } else if (isSelected && !isChoiceCorrect) {
        borderClasses = "border-rose-500 bg-rose-50";
      } else {
        borderClasses = "border-slate-200 bg-slate-50";
      }
    } else if (isSelected) {
      borderClasses = "border-emerald-500 bg-emerald-50 shadow-sm";
    }

    const letter = String.fromCharCode(65 + index); // A/B/C/D

    return (
      <button
        key={choice.id}
        type="button"
        onClick={() => !submitted && setSelectedChoiceId(choice.id)}
        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${borderClasses} ${
          submitted ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold text-slate-700">
            {letter}
          </div>
          <div className="flex-1">
            <div className="text-[15px] text-slate-900">{choice.text}</div>
            {submitted && (
              <>
                {isChoiceCorrect && choice.why_right && (
                  <p className="mt-1 text-xs text-emerald-700">{choice.why_right}</p>
                )}
                {!isChoiceCorrect && isSelected && choice.why_wrong && (
                  <p className="mt-1 text-xs text-rose-700">{choice.why_wrong}</p>
                )}
              </>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      onKeyDown={closeOnEsc}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex w-full max-w-5xl flex-col rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {item.domain} • {item.topic}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">NREMT-style Exam Mode</h2>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                timeRemaining <= 10 || expired
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Clock3 size={14} />
              <span>{formatTime(timeRemaining)}</span>
              {expired && <span className="ml-1">Time&apos;s up</span>}
            </div>

            <button
              onClick={openInNewTab}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <ExternalLink size={16} /> Open in new tab
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 gap-4 p-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {/* Left: scenario, question, choices */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scenario
              </h3>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-900">
                {item.vignette}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Question
              </h3>
              <p className="text-[15px] font-medium text-slate-900">{item.question}</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Select one answer
              </h3>
              <div className="space-y-2">
                {item.choices.map((choice, idx) => renderChoice(choice, idx))}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-600">
                  {!submitted && !expired && <span>Question will auto-submit when timer hits 0.</span>}
                  {submitted && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        <span>
                          {expired && !selectedChoice
                            ? "Time expired — review the correct answer above."
                            : isCorrect
                            ? "Correct"
                            : "Incorrect"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {!submitted && (
                    <button
                      type="button"
                      disabled={!selectedChoiceId || expired}
                      onClick={handleSubmit}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow ${
                        !selectedChoiceId || expired
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      Lock in answer
                    </button>
                  )}
                {submitted && (
  <button
    type="button"
    onClick={handleAdvance}
    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
  >
    {hasNext ? "Next question" : "Finish exam"}
  </button>
)}

                </div>
              </div>
            </div>
          </div>

          {/* Right: exam meta */}
          <aside className="space-y-3">
            <div className="rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Exam rules (NREMT-style)
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li>• One best answer, no partial credit.</li>
                <li>• No going back to change answers.</li>
                <li>• Timer is strict — simulates NREMT pacing.</li>
                <li>• Feedback and rationale only after you answer.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/95 p-4 text-xs text-slate-600">
              Use this mode for <strong>exam conditioning</strong> — fast reps under pressure.
              Use your other Pathologix modes for cue highlighting and step-by-step practice.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
