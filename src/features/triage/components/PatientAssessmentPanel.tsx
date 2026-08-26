import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  HeartPulse,
  RotateCcw,
  Stethoscope,
  X,
} from "lucide-react";
import { getAvailableInterventions, TRIAGE_CATEGORY_META } from "../engine";
import type {
  PatientRuntimeState,
  TriageCategory,
  TriageInterventionId,
  TriagePatient,
  TriageScenario,
} from "../types";
import { TriageCategoryTag } from "./TriageCategoryTag";

const categoryShortcuts: Array<[TriageCategory, number]> = [
  ["immediate", 1],
  ["delayed", 2],
  ["minimal", 3],
  ["expectant", 4],
  ["dead", 5],
];

function Criterion({
  label,
  value,
  concern = false,
  unknown = false,
}: {
  label: string;
  value: string;
  concern?: boolean;
  unknown?: boolean;
}) {
  return (
    <div className={`flex min-h-11 items-center gap-2 rounded-md border px-2.5 py-2 ${
      concern
        ? "border-rose-300/30 bg-rose-300/10"
        : unknown
          ? "border-amber-300/25 bg-amber-300/10"
          : "border-emerald-300/20 bg-emerald-300/[0.07]"
    }`}>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
        concern
          ? "bg-rose-400/20 text-rose-200"
          : unknown
            ? "bg-amber-300/15 text-amber-200"
            : "bg-emerald-300/15 text-emerald-200"
      }`}>
        {concern ? <AlertTriangle size={12} /> : <Check size={12} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</span>
        <span className="block truncate text-[11px] font-bold text-white">{value}</span>
      </span>
    </div>
  );
}

export function PatientAssessmentPanel({
  scenario,
  patient,
  runtime,
  mode,
  onClose,
  onIntervention,
  onAssign,
  onReassess,
}: {
  scenario: TriageScenario;
  patient: TriagePatient;
  runtime: PatientRuntimeState;
  mode: "learn" | "challenge";
  onClose: () => void;
  onIntervention: (interventionId: TriageInterventionId) => void;
  onAssign: (category: TriageCategory) => void;
  onReassess: () => void;
}) {
  const interventions = getAvailableInterventions(patient, scenario);
  const assignedMeta = runtime.assignedCategory
    ? TRIAGE_CATEGORY_META[runtime.assignedCategory]
    : null;
  const pulseUnknown = runtime.findings.peripheralPulse === null;

  return (
    <section
      data-testid="triage-assessment-panel"
      aria-label={`${patient.displayName} rapid assessment`}
      className="triage-assessment-panel pointer-events-auto absolute inset-x-2 bottom-2 z-40 max-h-[72dvh] overflow-y-auto rounded-lg border border-white/15 bg-[#071820]/[0.97] text-white shadow-2xl backdrop-blur-md sm:inset-x-4 lg:bottom-4 lg:left-1/2 lg:right-auto lg:w-[min(1120px,calc(100%-2rem))] lg:max-h-[430px] lg:-translate-x-1/2"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#071820]/95 px-3 py-2.5 backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal-300 text-slate-950">
            <Stethoscope size={17} />
          </span>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">Rapid assessment</div>
            <div className="flex min-w-0 items-baseline gap-2">
              <h2 className="shrink-0 text-base font-black">{patient.displayName}</h2>
              <span className="truncate text-xs text-slate-400">{patient.visibleInjury}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close patient assessment"
          onClick={onClose}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>

      <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[1fr_1fr_1.35fr]">
        <section>
          <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-sky-300">
            <Eye size={14} /> Scene clues
          </h3>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {patient.observableSummary.map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-xs leading-4 text-slate-200">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                {item}
              </div>
            ))}
          </div>
          {patient.patientStatement ? (
            <blockquote className="mt-2 border-l-2 border-teal-300 pl-2.5 text-xs italic leading-4 text-white">
              “{patient.patientStatement}”
            </blockquote>
          ) : null}
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-sky-300">
            <Activity size={14} /> Rapid check
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <Criterion label="Breathing" value={runtime.findings.breathing ? "Present" : "Absent"} concern={!runtime.findings.breathing} />
            <Criterion label="Respiratory" value={runtime.findings.respiratoryDistress ? "Distress" : "No distress"} concern={runtime.findings.respiratoryDistress} />
            <Criterion label="Commands" value={runtime.findings.followsCommands ? "Follows" : "Does not follow"} concern={!runtime.findings.followsCommands} />
            <Criterion label="Movement" value={runtime.findings.purposefulMovement ? "Purposeful" : "Not purposeful"} concern={!runtime.findings.purposefulMovement} />
            <Criterion
              label="Pulse"
              value={pulseUnknown ? "Not checked" : runtime.findings.peripheralPulse ? "Present" : "Absent"}
              concern={runtime.findings.peripheralPulse === false}
              unknown={pulseUnknown}
            />
            <Criterion
              label="Hemorrhage"
              value={runtime.findings.hemorrhage === "none" ? "None" : runtime.findings.hemorrhage}
              concern={runtime.findings.hemorrhage === "uncontrolled"}
            />
          </div>
        </section>

        <section>
          {runtime.locked && assignedMeta ? (
            <div className="rounded-md border border-teal-300/30 bg-teal-300/10 p-3">
              <div className="flex items-center gap-2 font-black text-teal-200">
                <CheckCircle2 size={17} /> Tag assigned
              </div>
              <p className="mt-1 text-sm text-white">{assignedMeta.name} / {assignedMeta.colorName}</p>
              <button
                type="button"
                onClick={onReassess}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-bold hover:bg-white/10"
              >
                <RotateCcw size={14} /> Reassess patient
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300">
                  <HeartPulse size={14} /> Act, then tag
                </h3>
                <span className="hidden text-[9px] text-slate-500 sm:block">Keys 1–5</span>
              </div>

              {interventions.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {interventions.map((intervention) => {
                    const used = runtime.actionsTaken.includes(intervention.id);
                    return (
                      <button
                        key={intervention.id}
                        type="button"
                        data-testid={`triage-intervention-${intervention.id}`}
                        disabled={used}
                        onClick={() => onIntervention(intervention.id)}
                        title={intervention.description}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-amber-200/25 bg-amber-200/10 px-2.5 text-[11px] font-bold text-amber-50 transition hover:border-amber-200/60 disabled:border-emerald-300/30 disabled:bg-emerald-300/10 disabled:text-emerald-200"
                      >
                        {used ? <Check size={13} /> : <HeartPulse size={13} />}
                        {used ? "Done: " : ""}{intervention.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400">No rapid intervention indicated.</p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5 lg:grid-cols-5">
                {categoryShortcuts.map(([category, shortcut]) => (
                  <TriageCategoryTag
                    key={category}
                    category={category}
                    selected={runtime.assignedCategory === category}
                    shortcut={shortcut}
                    compact
                    onClick={() => onAssign(category)}
                  />
                ))}
              </div>

              {runtime.assignedCategory && !runtime.locked ? (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold leading-4 text-rose-200">
                  <RotateCcw className="shrink-0" size={12} />
                  That tag is not final. Choose another option above.
                </p>
              ) : null}

              {mode === "learn" ? (
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-sky-100">
                  <Eye className="mt-0.5 shrink-0 text-sky-300" size={12} />
                  Use breathing, response, pulse, hemorrhage, and injury severity to choose the tag.
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </section>
  );
}
