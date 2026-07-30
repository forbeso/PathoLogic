import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  MessageSquareText,
  Send,
  X,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { trackProductEvent } from "@/lib/telemetry";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/AppShell";

type FeedbackCategory = "friction" | "idea" | "content" | "bug";

const categories: Array<{
  value: FeedbackCategory;
  label: string;
}> = [
  { value: "friction", label: "Something felt awkward" },
  { value: "bug", label: "Something did not work" },
  { value: "content", label: "Clinical content" },
  { value: "idea", label: "I have an idea" },
];

export default function FeedbackDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [category, setCategory] =
    useState<FeedbackCategory>("friction");
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), a[href]'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (cleanMessage.length < 3) {
      setError("Tell us a little more before sending.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await authenticatedFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          rating,
          message: cleanMessage,
          route: window.location.pathname,
        }),
      });
      if (!response.ok) throw new Error("Feedback could not be saved");

      setSubmitted(true);
      trackProductEvent("feedback_submitted", {
        category,
        rating,
        route: window.location.pathname,
      });
    } catch {
      setError(
        "We could not send that right now. Email support@pathologix.io instead."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function closeAndReset() {
    onClose();
    window.setTimeout(() => {
      setCategory("friction");
      setRating(4);
      setMessage("");
      setError("");
      setSubmitted(false);
    }, 150);
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAndReset();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        aria-describedby="feedback-description"
        className="max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-[#b7ccc5] bg-white p-5 text-slate-950 shadow-2xl dark:border-slate-600 dark:bg-[#102329] dark:text-slate-50 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-teal-700 dark:text-teal-300">
              <MessageSquareText size={15} aria-hidden="true" />
              Beta feedback
            </span>
            <h2 id="feedback-title" className="mt-2 text-2xl font-black">
              Tell us what you noticed
            </h2>
            <p
              id="feedback-description"
              className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300"
            >
              A quick, honest note helps us improve the next learner&apos;s
              session.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeAndReset}
            aria-label="Close feedback"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-6">
            <div
              role="status"
              className="rounded-lg border border-teal-200 bg-teal-50 p-5 text-teal-950 dark:border-teal-500/40 dark:bg-teal-400/10 dark:text-teal-100"
            >
              <CheckCircle2 size={24} aria-hidden="true" />
              <h3 className="mt-3 text-lg font-black">Thank you.</h3>
              <p className="mt-1 text-sm leading-6">
                Your note was sent to the PathoLogix team.
              </p>
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              className={`${primaryButtonClass} mt-5 w-full`}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <fieldset>
              <legend className="text-sm font-bold">What is this about?</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={category === option.value}
                    onClick={() => setCategory(option.value)}
                    className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                      category === option.value
                        ? "border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-400/15 dark:text-teal-100"
                        : "border-slate-200 text-slate-700 hover:border-teal-400 dark:border-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-bold">
                How useful was this session?
              </legend>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    aria-label={`${score} out of 5`}
                    aria-pressed={rating === score}
                    onClick={() => setRating(score)}
                    className={`h-11 rounded-md border text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                      rating === score
                        ? "border-teal-600 bg-teal-700 text-white"
                        : "border-slate-200 text-slate-600 hover:border-teal-400 dark:border-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm font-bold">Your note</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="What happened, and what did you expect?"
                className={`${inputClass} mt-2 w-full resize-y`}
              />
              <span className="mt-1 block text-right text-xs text-slate-500 dark:text-slate-400">
                {message.length}/2000
              </span>
            </label>

            {error ? (
              <div
                role="alert"
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-400/10 dark:text-rose-200"
              >
                {error}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAndReset}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={primaryButtonClass}
              >
                <Send size={16} aria-hidden="true" />
                {submitting ? "Sending..." : "Send feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
