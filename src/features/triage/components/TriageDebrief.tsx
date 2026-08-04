import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { TRIAGE_CATEGORY_META } from "../engine";
import type { TriageDebrief as Debrief, TriageInterventionId } from "../types";

const actionLabels: Record<TriageInterventionId, string> = {
  "open-airway": "Opened airway",
  "direct-pressure": "Applied direct pressure",
  tourniquet: "Applied tourniquet",
  "recovery-position": "Used recovery position",
  "pediatric-rescue-breaths": "Gave pediatric rescue breaths",
};

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function TriageDebrief({
  debrief,
  bestScore,
  timedOut,
  saveState,
  onRetrySave,
  onRestart,
}: {
  debrief: Debrief;
  bestScore: number;
  timedOut: boolean;
  saveState:
    | { status: "idle" | "saving"; xp: 0 }
    | { status: "saved"; xp: number; awarded: boolean }
    | { status: "signed-out" | "error"; xp: 0 };
  onRetrySave: () => void;
  onRestart: () => void;
}) {
  const metrics: Array<{ label: string; value: string | number; icon: LucideIcon }> = [
    { label: "Score", value: debrief.score, icon: Trophy },
    { label: "Best", value: bestScore, icon: Target },
    { label: "Accuracy", value: `${debrief.accuracy}%`, icon: CheckCircle2 },
    { label: "Time", value: formatTime(debrief.completionSeconds), icon: Clock3 },
    { label: "Over-triage", value: debrief.overTriage, icon: AlertTriangle },
    { label: "Under-triage", value: debrief.underTriage, icon: AlertTriangle },
  ];

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-[#06171d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-black ${timedOut ? "border-amber-400/40 bg-amber-400/10 text-amber-200" : "border-teal-300/40 bg-teal-300/10 text-teal-200"}`}>
              {timedOut ? <Clock3 size={15} /> : <CheckCircle2 size={15} />}
              {timedOut ? "Time expired" : "Initial triage complete"}
            </div>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">MCI triage debrief</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Review every tag against the patient’s major assessment findings and the rapid interventions available at this incident.
            </p>
            <div className="mt-3 min-h-8" role="status" aria-live="polite">
              {saveState.status === "idle" || saveState.status === "saving" ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" size={15} />
                  Saving this run to your progress
                </span>
              ) : null}
              {saveState.status === "saved" ? (
                <span className="inline-flex items-center gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
                  <Zap size={15} />
                  {saveState.awarded
                    ? `Saved to Progress · +${saveState.xp} XP`
                    : "Already saved · XP was not awarded twice"}
                </span>
              ) : null}
              {saveState.status === "signed-out" ? (
                <span className="text-xs font-bold text-slate-300">
                  This run is saved on this device. <Link href="/login" className="text-teal-300 underline decoration-teal-300/50 underline-offset-4 hover:text-teal-200">Sign in</Link> to save future results and earn XP.
                </span>
              ) : null}
              {saveState.status === "error" ? (
                <span className="inline-flex flex-wrap items-center gap-2 text-xs font-bold text-rose-200">
                  Your local result is safe, but account progress did not update.
                  <button type="button" onClick={onRetrySave} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-rose-200/30 px-3 hover:bg-rose-200/10">
                    <RefreshCw size={13} /> Retry save
                  </button>
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal-400 px-5 py-2 text-sm font-black text-slate-950 hover:bg-teal-300"
          >
            <RotateCcw size={17} /> Triage again
          </button>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6" aria-label="Simulation results">
          {metrics.map(({ label, value, icon: MetricIcon }) => {
            return (
              <div key={label} className="rounded-md border border-white/10 bg-white/5 p-3">
                <MetricIcon size={17} className="text-teal-300" aria-hidden="true" />
                <div className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
                <div className="mt-1 text-xl font-black tabular-nums">{value}</div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 rounded-md border border-slate-400/20 bg-slate-400/10 p-4 text-sm leading-6 text-slate-200">
          <strong className="text-white">Expectant is not Dead.</strong> Expectant patients are alive, but their predicted survival is poor with the personnel and resources available during this MCI. Dead is assigned only when breathing remains absent after the protocol-appropriate airway attempt. A different resource environment can change an Expectant decision.
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black">Patient review</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {debrief.patients.map((result) => {
              const correct = TRIAGE_CATEGORY_META[result.correctCategory];
              const assigned = result.assignedCategory
                ? TRIAGE_CATEGORY_META[result.assignedCategory]
                : null;
              return (
                <article key={result.patient.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{result.patient.displayName}</h3>
                      <p className="mt-0.5 text-xs text-slate-400">{result.patient.visibleInjury}</p>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${result.difference === "correct" ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>
                      {result.difference.replace("-", " ")}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-white/10 bg-black/15 p-2">
                      <span className="block text-slate-400">Your tag</span>
                      <span className="mt-1 block font-black">{assigned ? `${assigned.name} / ${assigned.colorName}` : "Not tagged"}</span>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/15 p-2">
                      <span className="block text-slate-400">Best tag</span>
                      <span className="mt-1 block font-black">{correct.name} / {correct.colorName}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-200">{result.patient.explanation}</p>

                  <div className="mt-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-teal-300">Decision path</div>
                    <ol className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {result.patient.decisionPath.map((step, index) => (
                        <li key={step} className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                          {index + 1}. {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-300">
                    <strong className="text-white">Actions:</strong>{" "}
                    {result.actionsTaken.length
                      ? result.actionsTaken.map((action) => actionLabels[action]).join(", ")
                      : "No rapid intervention performed"}
                    {result.missedInterventions.length ? (
                      <span className="mt-1 block text-rose-200">Missed: {result.missedInterventions.map((action) => actionLabels[action]).join(", ")}</span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
