import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Stethoscope,
  Target,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { TRIAGE_CATEGORY_META } from "../engine";
import type {
  PatientDebrief,
  TriageCategory,
  TriageDebrief as Debrief,
  TriageInterventionId,
} from "../types";

const actionLabels: Record<TriageInterventionId, string> = {
  "open-airway": "Airway opened",
  "direct-pressure": "Direct pressure",
  tourniquet: "Tourniquet",
  "recovery-position": "Recovery position",
  "pediatric-rescue-breaths": "Rescue breaths",
};

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function TagSwatch({ category, label }: { category: TriageCategory | null; label: string }) {
  const meta = category ? TRIAGE_CATEGORY_META[category] : null;
  return (
    <div className="min-w-0 flex-1">
      <div className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div
        className="mt-1 flex min-h-9 items-center gap-2 rounded-md border-2 px-2 text-white shadow-sm"
        style={{
          backgroundColor: meta?.color ?? "#334155",
          borderColor: category === "delayed" ? "#713f12" : "rgba(255,255,255,.6)",
          color: category === "delayed" ? "#1c1917" : "#fff",
        }}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-current text-[9px] font-black">
          {meta?.icon ?? "?"}
        </span>
        <span className="truncate text-[10px] font-black uppercase">{meta?.name ?? "Untagged"}</span>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: PatientDebrief }) {
  const correct = result.difference === "correct";
  const under = result.difference === "under-triage";
  const statusLabel = correct
    ? "Correct"
    : under
      ? "Under-triaged"
      : result.difference === "over-triage"
        ? "Over-triaged"
        : "Not tagged";
  const StatusIcon = correct ? CheckCircle2 : XCircle;
  const keyCues = result.patient.decisionPath.slice(0, 2);

  return (
    <article
      className={`rounded-lg border p-3 ${
        correct
          ? "border-emerald-300/25 bg-emerald-300/[0.055]"
          : under
            ? "border-rose-300/30 bg-rose-300/[0.06]"
            : "border-amber-300/30 bg-amber-300/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-black text-white">{result.patient.displayName}</h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{result.patient.visibleInjury}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black uppercase ${
          correct
            ? "bg-emerald-300/15 text-emerald-200"
            : under
              ? "bg-rose-300/15 text-rose-200"
              : "bg-amber-300/15 text-amber-100"
        }`}>
          <StatusIcon size={11} /> {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <TagSwatch category={result.assignedCategory} label="Your tag" />
        <ArrowRight className="mb-2.5 shrink-0 text-slate-500" size={13} />
        <TagSwatch category={result.correctCategory} label="Best tag" />
      </div>

      {!correct ? (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Key decision cues">
          {keyCues.map((cue) => (
            <span key={cue} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-slate-200">
              {cue}
            </span>
          ))}
        </div>
      ) : null}

      {result.actionsTaken.length || result.missedInterventions.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-2.5">
          {result.actionsTaken.map((action) => (
            <span key={action} className="inline-flex items-center gap-1 rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-bold text-emerald-200">
              <Check size={10} /> {actionLabels[action]}
            </span>
          ))}
          {result.missedInterventions.map((action) => (
            <span key={action} className="inline-flex items-center gap-1 rounded-full bg-rose-300/10 px-2 py-1 text-[9px] font-bold text-rose-200">
              <AlertTriangle size={10} /> Missed {actionLabels[action]}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
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
  const scorePercent = Math.max(0, Math.min(100, Math.round(debrief.score / 10)));
  const totalPatients = debrief.patients.length;
  const incorrect = totalPatients - debrief.correctClassifications - debrief.untagged;

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-[#06171d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
              timedOut
                ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                : "border-teal-300/40 bg-teal-300/10 text-teal-200"
            }`}>
              {timedOut ? <Clock3 size={13} /> : <CheckCircle2 size={13} />}
              {timedOut ? "Time expired" : "Incident complete"}
            </div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">MCI triage debrief</h1>
          </div>
          <div className="grid gap-2 sm:flex">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-bold hover:bg-white/10"
            >
              <RotateCcw size={16} /> Triage again
            </button>
            <Link
              href="/emtscene?scenario=car-accident"
              data-testid="triage-debrief-simulator-link"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal-400 px-4 text-sm font-black text-slate-950 hover:bg-teal-300"
            >
              <Stethoscope size={16} /> Patient simulator <ArrowRight size={15} />
            </Link>
          </div>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]" aria-label="Simulation results">
          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 lg:flex-col lg:justify-center">
            <div
              className="grid h-32 w-32 shrink-0 place-items-center rounded-full p-3"
              style={{ background: `conic-gradient(#2dd4bf ${scorePercent}%, rgba(255,255,255,.09) ${scorePercent}% 100%)` }}
              aria-label={`Incident score ${debrief.score} points`}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-[#071820] text-center">
                <span>
                  <strong className="block text-3xl font-black tabular-nums">{debrief.score}</strong>
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">points</span>
                </span>
              </div>
            </div>
            <div className="min-w-0 text-left lg:text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-teal-300">Incident score</p>
              <p className="mt-1 text-xs text-slate-400">Best: <strong className="text-white">{bestScore}</strong></p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-black/15 p-3">
                <Users size={16} className="text-teal-300" />
                <div className="mt-2 text-xl font-black tabular-nums">{debrief.correctClassifications}/{totalPatients}</div>
                <div className="text-[9px] font-black uppercase text-slate-400">Correct tags</div>
              </div>
              <div className="rounded-md bg-black/15 p-3">
                <Target size={16} className="text-sky-300" />
                <div className="mt-2 text-xl font-black tabular-nums">{debrief.accuracy}%</div>
                <div className="text-[9px] font-black uppercase text-slate-400">Accuracy</div>
              </div>
              <div className="rounded-md bg-black/15 p-3">
                <Clock3 size={16} className="text-amber-300" />
                <div className="mt-2 text-xl font-black tabular-nums">{formatTime(debrief.completionSeconds)}</div>
                <div className="text-[9px] font-black uppercase text-slate-400">Time</div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-full bg-white/10" aria-label="Classification result distribution">
              <div className="flex h-3 w-full">
                <span className="bg-emerald-400" style={{ width: `${(debrief.correctClassifications / totalPatients) * 100}%` }} />
                <span className="bg-amber-400" style={{ width: `${(debrief.overTriage / totalPatients) * 100}%` }} />
                <span className="bg-rose-500" style={{ width: `${(debrief.underTriage / totalPatients) * 100}%` }} />
                <span className="bg-slate-500" style={{ width: `${(debrief.untagged / totalPatients) * 100}%` }} />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-300">
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />{debrief.correctClassifications} correct</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />{debrief.overTriage} over</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />{debrief.underTriage} under</span>
              {debrief.untagged ? <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-500" />{debrief.untagged} untagged</span> : null}
            </div>
            {incorrect === 0 && debrief.untagged === 0 ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-emerald-200"><CheckCircle2 size={14} /> Every patient received the best tag.</p>
            ) : null}
          </div>
        </section>

        <div className="mt-4 min-h-8" role="status" aria-live="polite">
          {saveState.status === "idle" || saveState.status === "saving" ? (
            <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
              <LoaderCircle className="animate-spin motion-reduce:animate-none" size={14} /> Saving result
            </span>
          ) : null}
          {saveState.status === "saved" ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
              <Zap size={14} /> {saveState.awarded ? `Saved · +${saveState.xp} XP` : "Saved"}
            </span>
          ) : null}
          {saveState.status === "signed-out" ? (
            <span className="text-xs font-bold text-slate-300">Saved on this device · <Link href="/login" className="text-teal-300 underline underline-offset-4">Sign in for XP</Link></span>
          ) : null}
          {saveState.status === "error" ? (
            <button type="button" onClick={onRetrySave} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-rose-200/30 px-3 text-xs font-bold text-rose-200 hover:bg-rose-200/10">
              <RefreshCw size={13} /> Retry save
            </button>
          ) : null}
        </div>

        <section className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-teal-300">Patient map</p>
              <h2 className="mt-1 text-xl font-black">See every tag at a glance</h2>
            </div>
            <span className="hidden text-xs text-slate-400 sm:block">Color comparison shows your tag versus the best tag.</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {debrief.patients.map((result) => <ResultCard key={result.patient.id} result={result} />)}
          </div>
        </section>

        <section
          className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2"
          aria-label="Expectant and dead distinction"
          data-testid="triage-expectant-dead-key"
        >
          <div className="flex items-center gap-3 rounded-md border border-slate-300/20 bg-slate-300/[0.06] p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-500 font-black">E</span>
            <span><strong className="block text-sm">Expectant</strong><span className="text-xs text-slate-400">Alive; survival is unlikely with current resources.</span></span>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-950 font-black">D</span>
            <span><strong className="block text-sm">Dead</strong><span className="text-xs text-slate-400">No breathing after the appropriate airway attempt.</span></span>
          </div>
        </section>
      </div>
    </div>
  );
}
