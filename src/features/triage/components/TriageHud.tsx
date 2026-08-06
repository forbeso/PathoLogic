import {
  Clock3,
  Pause,
  Play,
  RotateCcw,
  Stethoscope,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import type { SimulationMode, SimulationStatus } from "../types";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function TriageHud({
  title,
  status,
  mode,
  elapsedSeconds,
  remainingSeconds,
  triaged,
  total,
  score,
  accuracy,
  soundEnabled,
  onPause,
  onResume,
  onRestart,
  onToggleSound,
}: {
  title: string;
  status: SimulationStatus;
  mode: SimulationMode;
  elapsedSeconds: number;
  remainingSeconds: number;
  triaged: number;
  total: number;
  score: number;
  accuracy: number;
  soundEnabled: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
}) {
  const displayedTime = mode === "challenge" ? remainingSeconds : elapsedSeconds;
  const urgent = mode === "challenge" && remainingSeconds <= 30 && status === "active";

  return (
    <header className="triage-hud pointer-events-auto absolute inset-x-2 top-2 z-30 rounded-lg border border-white/15 bg-[#071820] p-2 text-white shadow-2xl sm:inset-x-4 sm:top-4 sm:p-3 lg:flex lg:items-center lg:justify-between lg:gap-4">
      <div className="triage-hud-title min-w-0 pr-12 lg:pr-0">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-teal-300">
          <span>SALT/MUCC</span>
          <span aria-hidden="true" className="text-slate-600">•</span>
          <span>{mode === "challenge" ? "Challenge Mode" : "Learn Mode"}</span>
        </div>
        <h1 className="mt-0.5 truncate text-sm font-black sm:mt-1 sm:text-base">{title}</h1>
      </div>

      <Link
        href="/emtscene?scenario=car-accident"
        data-testid="triage-to-simulator-mobile"
        aria-label="Open EMT patient care simulator"
        title="Open EMT patient care simulator"
        style={{ right: "0.5rem", top: "0.5rem" }}
        className="absolute right-2 top-2 flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-md border border-white/15 bg-white/5 text-teal-200 transition hover:border-teal-300/60 hover:bg-teal-300/10 lg:hidden"
      >
        <Stethoscope size={14} aria-hidden="true" />
        <span className="text-[8px] font-black uppercase leading-none tracking-[0.08em]">Care</span>
      </Link>

      <div className="triage-hud-controls mt-2 grid grid-cols-[minmax(84px,1.2fr)_minmax(56px,.8fr)_minmax(52px,.7fr)_44px_44px] items-center gap-1.5 sm:mt-3 sm:flex sm:gap-2 lg:mt-0">
        <Link
          href="/emtscene?scenario=car-accident"
          data-testid="triage-to-simulator-desktop"
          className="hidden min-h-11 shrink-0 items-center gap-2 rounded-md border border-teal-300/35 bg-teal-300/10 px-3 text-xs font-black text-teal-100 transition hover:border-teal-300/70 hover:bg-teal-300/20 lg:inline-flex"
        >
          <Stethoscope size={16} aria-hidden="true" />
          Patient Simulator
        </Link>
        <div
          data-testid="triage-timer"
          role="timer"
          aria-label={`${mode === "challenge" ? "Time remaining" : "Time elapsed"}: ${formatTime(displayedTime)}`}
          className={`triage-hud-metric flex min-h-11 min-w-0 items-center gap-1.5 rounded-md border px-2 sm:shrink-0 sm:gap-2 sm:px-3 ${
            urgent
              ? "border-rose-400 bg-rose-950/70 text-rose-200"
              : "border-white/10 bg-white/5 text-white"
          }`}
        >
          <Clock3 size={16} className={urgent ? "animate-pulse motion-reduce:animate-none" : "text-teal-300"} />
          <div>
            <div className="text-[9px] font-bold uppercase text-slate-400">
              {mode === "challenge" ? "Remaining" : "Elapsed"}
            </div>
            <div className="font-mono text-sm font-black tabular-nums">{formatTime(displayedTime)}</div>
          </div>
        </div>
        <div className="triage-hud-metric flex min-h-11 min-w-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 sm:shrink-0 sm:gap-2 sm:px-3">
          <Users size={16} className="text-sky-300" />
          <span className="text-sm font-bold tabular-nums">{triaged} / {total}</span>
        </div>
        <div className="triage-hud-metric flex min-h-11 min-w-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 sm:shrink-0 sm:gap-2 sm:px-3">
          <Trophy size={16} className="text-amber-300" />
          <span className="text-sm font-bold tabular-nums">{score}</span>
        </div>
        {mode === "learn" ? (
          <div className="triage-hud-accuracy hidden min-h-11 shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 sm:block">
            <div className="text-[9px] font-bold uppercase text-slate-400">Accuracy</div>
            <div className="text-sm font-black text-teal-300 tabular-nums">{accuracy}%</div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={status === "paused" ? onResume : onPause}
          disabled={status !== "active" && status !== "paused"}
          aria-label={status === "paused" ? "Resume simulation" : "Pause simulation"}
          className="triage-hud-action grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-slate-100 transition hover:bg-white/10 disabled:opacity-40"
        >
          {status === "paused" ? <Play size={18} /> : <Pause size={18} />}
        </button>
        <button
          type="button"
          onClick={onRestart}
          aria-label="Restart simulation"
          className="triage-hud-action grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-slate-100 transition hover:bg-white/10"
        >
          <RotateCcw size={18} />
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? "Mute tag sounds" : "Enable tag sounds"}
          className="triage-hud-action triage-hud-sound hidden h-11 w-11 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-slate-100 transition hover:bg-white/10 sm:grid"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
    </header>
  );
}
