import { Activity, Clock3, GraduationCap, Radio, ShieldCheck, Trophy } from "lucide-react";
import { TRIAGE_CATEGORY_META } from "../engine";
import type { SimulationMode, TriageCategory, TriageScenario } from "../types";
import { TriageCategoryTag } from "./TriageCategoryTag";

const categories: TriageCategory[] = [
  "immediate",
  "delayed",
  "minimal",
  "expectant",
  "dead",
];

export function TriageBriefing({
  scenario,
  mode,
  onModeChange,
  onBegin,
}: {
  scenario: TriageScenario;
  mode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  onBegin: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 grid overflow-y-auto bg-[#031016]/[0.78] p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="triage-briefing-title"
        className="m-auto w-full max-w-4xl overflow-hidden rounded-lg border border-white/15 bg-[#071820] text-white shadow-2xl"
      >
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-teal-300">
              <Radio size={16} aria-hidden="true" />
              Incoming MCI assignment
            </div>
            <h1 id="triage-briefing-title" className="mt-3 text-2xl font-black sm:text-3xl">
              {scenario.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {scenario.description}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <Activity size={18} className="text-teal-300" aria-hidden="true" />
                <div className="mt-2 text-xs font-bold uppercase text-slate-400">Protocol</div>
                <div className="mt-0.5 text-sm font-black">SALT / MUCC</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <Clock3 size={18} className="text-amber-300" aria-hidden="true" />
                <div className="mt-2 text-xs font-bold uppercase text-slate-400">Challenge time</div>
                <div className="mt-0.5 text-sm font-black">4 minutes</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <ShieldCheck size={18} className="text-sky-300" aria-hidden="true" />
                <div className="mt-2 text-xs font-bold uppercase text-slate-400">Patients</div>
                <div className="mt-0.5 text-sm font-black">{scenario.patients.length} to triage</div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-black">Choose your mode</h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Simulation mode">
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "challenge"}
                  onClick={() => onModeChange("challenge")}
                  className={`min-h-20 rounded-md border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                    mode === "challenge"
                      ? "border-teal-300 bg-teal-300/15"
                      : "border-white/15 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2 font-black"><Trophy size={17} /> Challenge</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-300">Four-minute limit. Results and rationale appear at the end.</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "learn"}
                  onClick={() => onModeChange("learn")}
                  className={`min-h-20 rounded-md border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                    mode === "learn"
                      ? "border-teal-300 bg-teal-300/15"
                      : "border-white/15 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2 font-black"><GraduationCap size={17} /> Learn</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-300">No countdown. Get immediate explanations as you tag.</span>
                </button>
              </div>
            </div>
          </div>

          <aside className="rounded-md border border-white/10 bg-black/15 p-4">
            <h2 className="text-sm font-black">Triage tag legend</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <TriageCategoryTag key={category} category={category} compact />
              ))}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-slate-300">
              <p><strong className="text-white">Your task:</strong> select each patient, perform only rapid lifesaving interventions, then assign the best SALT/MUCC tag.</p>
              <p className="mt-2">Expectant means the patient is alive but unlikely to survive with the resources currently available. Dead requires absent breathing after the appropriate airway attempt.</p>
            </div>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-[11px] leading-4 text-slate-400">
            Educational simulation only. Follow your approved curriculum, local protocol, scope of practice, and medical direction.
          </p>
          <button
            type="button"
            data-testid="triage-begin"
            onClick={onBegin}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-teal-400 px-5 py-2 text-sm font-black text-slate-950 shadow-lg transition hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Begin triage
          </button>
        </div>
      </section>
    </div>
  );
}
