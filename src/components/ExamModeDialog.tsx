import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, X, Clock3, CheckCircle2, XCircle } from "lucide-react";
import {
  cardClass,
  iconButtonClass,
  secondaryButtonClass,
} from "@/components/AppShell";
import type {
  ExamAnswerPayload,
  ExamAnswerResult,
} from "@/lib/examApi";

type Cue = { text: string; rationale: string };
type Choice = { id: string; text: string };
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

type Props = {
  open: boolean;
  onClose: () => void;             // X button / escape = EXIT exam
  onAdvance?: () => void | Promise<void>; // "Next question" / "Finish exam"
  item: Item;
  onSubmitAnswer?: (payload: ExamAnswerPayload) => Promise<ExamAnswerResult>;
  hasNext?: boolean;
  currentQuestionNumber?: number;
  totalQuestions?: number;
};

// seconds per question
const QUESTION_DURATION_SECONDS = 90;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ExamModeDialog({
  open,
  onClose,
  item,
  onSubmitAnswer,
  hasNext,
  onAdvance,
  currentQuestionNumber,
  totalQuestions,
}: Props) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [expired, setExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(QUESTION_DURATION_SECONDS);
  const [hasReported, setHasReported] = useState(false);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const [answerResult, setAnswerResult] = useState<ExamAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const reportedRef = useRef(false);

  // Reset every time you open or the item changes
  useEffect(() => {
    if (!open) return;
    setSelectedChoiceId(null);
    setSubmitted(false);
    setExpired(false);
    setTimeRemaining(QUESTION_DURATION_SECONDS);
    setHasReported(false);
    setExitConfirmationOpen(false);
    setAnswerResult(null);
    setSubmitting(false);
    setSubmitError(null);
    setAdvancing(false);
    setAdvanceError(null);
    reportedRef.current = false;
  }, [open, item.id]);

  const reportAnswer = useCallback(
    async (
      choiceId: string | null,
      expiredFlag: boolean,
      timeSpentSeconds: number
    ) => {
      if (reportedRef.current || !onSubmitAnswer) return;

      reportedRef.current = true;
      setHasReported(true);
      setSubmitting(true);
      setSubmitError(null);

      try {
        const result = await onSubmitAnswer({
          itemId: item.id,
          selectedChoiceId: choiceId,
          timeSpentSeconds,
          expired: expiredFlag,
        });
        setAnswerResult(result);
      } catch (error: unknown) {
        reportedRef.current = false;
        setHasReported(false);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Unable to check your answer. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [item.id, onSubmitAnswer]
  );

  // Timer
  useEffect(() => {
    if (!open) return;
    if (submitted || expired || exitConfirmationOpen) return;

    const id = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setExpired(true);
          setSubmitted(true);
          // auto-report on timeout
          if (!hasReported) {
            void reportAnswer(
              selectedChoiceId,
              true,
              QUESTION_DURATION_SECONDS
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [
    open,
    submitted,
    expired,
    exitConfirmationOpen,
    selectedChoiceId,
    hasReported,
    reportAnswer,
  ]);

  const fireReportIfNeeded = (expiredFlag: boolean) => {
    if (reportedRef.current) return;
    const timeSpentSeconds = expiredFlag
      ? QUESTION_DURATION_SECONDS
      : Math.max(0, QUESTION_DURATION_SECONDS - timeRemaining);

    void reportAnswer(selectedChoiceId, expiredFlag, timeSpentSeconds);
  };

  const handleAdvance = async () => {
    if (advancing) return;
    setAdvancing(true);
    setAdvanceError(null);

    try {
      if (onAdvance) await onAdvance();
      else onClose();
    } catch (error: unknown) {
      setAdvanceError(
        error instanceof Error
          ? error.message
          : "Unable to continue. Please try again."
      );
    } finally {
      setAdvancing(false);
    }
  };


  const handleSubmit = () => {
    if (!selectedChoiceId || submitted || submitting) return;
    setSubmitted(true);
    fireReportIfNeeded(false);
  };

  const retrySubmission = () => {
    if (submitting || answerResult) return;
    fireReportIfNeeded(expired);
  };

  const requestExit = () => {
    setExitConfirmationOpen(true);
  };

  const confirmExit = () => {
    setExitConfirmationOpen(false);
    onClose();
  };

  const closeOnEsc = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    if (exitConfirmationOpen) {
      setExitConfirmationOpen(false);
      return;
    }
    requestExit();
  };

  if (!open) return null;

  const selectedChoice = item.choices.find((c) => c.id === selectedChoiceId) || null;
  const isCorrect = Boolean(answerResult?.correct);

  const renderChoice = (choice: Choice, index: number) => {
    const isSelected = selectedChoiceId === choice.id;
    const isChoiceCorrect = answerResult?.correctChoiceId === choice.id;

    let borderClasses = "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm";
    if (answerResult) {
      if (isChoiceCorrect) {
        borderClasses = "border-teal-500 bg-teal-50";
      } else if (isSelected && !isChoiceCorrect) {
        borderClasses = "border-rose-500 bg-rose-50";
      } else {
        borderClasses = "border-slate-200 bg-slate-50";
      }
    } else if (isSelected) {
        borderClasses = "border-teal-500 bg-teal-50 shadow-sm";
    }

    const letter = String.fromCharCode(65 + index); // A/B/C/D

    return (
      <button
        key={choice.id}
        type="button"
        onClick={() => !submitted && !submitting && setSelectedChoiceId(choice.id)}
        aria-label={`${letter}. ${choice.text}`}
        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${borderClasses} ${
          submitted ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border text-xs font-semibold text-slate-700">
            {letter}
          </div>
          <div className="flex-1">
            <div className="text-[15px] text-slate-900">{choice.text}</div>
            {answerResult && (
              <>
                {isChoiceCorrect && answerResult.feedback[choice.id] && (
                  <p className="mt-1 text-xs text-teal-700">
                    {answerResult.feedback[choice.id]}
                  </p>
                )}
                {!isChoiceCorrect && isSelected && answerResult.feedback[choice.id] && (
                  <p className="mt-1 text-xs text-rose-700">
                    {answerResult.feedback[choice.id]}
                  </p>
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
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-700/28 p-4 backdrop-blur-sm"
      onKeyDown={closeOnEsc}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-200/70 px-4 py-3 sm:gap-3 sm:px-5">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase text-slate-500">
              {item.domain} / {item.topic}
            </div>
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              NREMT-style Exam Mode
            </h2>
            {currentQuestionNumber && totalQuestions ? (
              <div className="mt-1 text-xs font-medium text-slate-500">
                Question {currentQuestionNumber} of {totalQuestions}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                timeRemaining <= 10 || expired
                  ? "bg-rose-100 text-rose-700"
                  : "bg-teal-50 text-teal-700"
              }`}
            >
              <Clock3 size={14} />
              <span>{formatTime(timeRemaining)}</span>
              {expired && <span className="ml-1">Time&apos;s up</span>}
            </div>

            <button
              onClick={requestExit}
              className={iconButtonClass}
              aria-label="Exit exam"
              title="Exit exam"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {/* Left: scenario, question, choices */}
          <div className="space-y-4">
            <div className={`${cardClass} p-4`}>
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Scenario
              </h3>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-900">
                {item.vignette}
              </p>
            </div>

            <div className={`${cardClass} p-4`}>
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Question
              </h3>
              <p className="text-[15px] font-medium text-slate-900">{item.question}</p>
            </div>

            <div className={`${cardClass} p-4`}>
              <h3 className="mb-3 text-xs font-semibold uppercase text-slate-500">
                Select one answer
              </h3>
              <div className="space-y-2">
                {item.choices.map((choice, idx) => renderChoice(choice, idx))}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-600">
                  {!submitted && !expired && <span>Question will auto-submit when timer hits 0.</span>}
                  {submitting ? (
                    <span>Checking your answer...</span>
                  ) : null}
                  {submitError ? (
                    <span className="text-rose-700">{submitError}</span>
                  ) : null}
                  {answerResult && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                          isCorrect ? "bg-teal-50 text-teal-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        <span>
                          {expired && !selectedChoice
                            ? "Time expired - review the correct answer above."
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
                      disabled={!selectedChoiceId || expired || submitting}
                      onClick={handleSubmit}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold shadow ${
                        !selectedChoiceId || expired || submitting
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-teal-600 text-white hover:bg-teal-500"
                      }`}
                    >
                      Lock in answer
                    </button>
                  )}
                  {submitError && !submitting ? (
                    <button
                      type="button"
                      onClick={retrySubmission}
                      className={secondaryButtonClass}
                    >
                      Try again
                    </button>
                  ) : null}
                  {advanceError ? (
                    <p className="mr-auto text-xs font-medium text-rose-600" role="alert">
                      {advanceError}
                    </p>
                  ) : null}
                  {answerResult ? (
                    <button
                      type="button"
                      onClick={handleAdvance}
                      disabled={advancing}
                      className={secondaryButtonClass}
                    >
                      {advancing
                        ? hasNext
                          ? "Loading..."
                          : "Saving results..."
                        : hasNext
                          ? "Next question"
                          : "Finish exam"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Right: exam meta */}
          <aside className="space-y-3">
            <div className={`${cardClass} p-4`}>
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Exam rules (NREMT-style)
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li>One best answer, no partial credit.</li>
                <li>No going back to change answers.</li>
                <li>Timer is strict - simulates NREMT pacing.</li>
                <li>Feedback and rationale only after you answer.</li>
              </ul>
            </div>

            <div className={`${cardClass} p-4 text-xs text-slate-600`}>
              Use this mode for <strong>exam conditioning</strong> - fast reps under pressure.
              Use your other Pathologix modes for cue highlighting and step-by-step practice.
            </div>
          </aside>
        </div>
      </div>

      {exitConfirmationOpen && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="end-exam-title"
          aria-describedby="end-exam-description"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="end-exam-title" className="text-lg font-semibold text-slate-950">
                  End this exam?
                </h2>
                <p id="end-exam-description" className="mt-1 text-sm leading-6 text-slate-600">
                  Your current exam progress will be discarded. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setExitConfirmationOpen(false)}
                className={secondaryButtonClass}
              >
                Continue exam
              </button>
              <button
                type="button"
                onClick={confirmExit}
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                End exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
