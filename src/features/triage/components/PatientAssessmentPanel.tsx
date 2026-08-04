import { Activity, CheckCircle2, HeartPulse, RotateCcw, Stethoscope, X } from "lucide-react";
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

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-white">{value}</div>
    </div>
  );
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
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

  return (
    <aside
      data-testid="triage-assessment-panel"
      aria-label={`${patient.displayName} rapid assessment`}
      className="triage-assessment-panel pointer-events-auto absolute inset-x-2 bottom-2 z-40 max-h-[66dvh] overflow-y-auto rounded-lg border border-white/15 bg-[#071820] text-white shadow-2xl sm:inset-x-4 lg:inset-y-4 lg:left-auto lg:right-4 lg:top-28 lg:w-[390px] lg:max-h-none"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#071820] p-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-300">Rapid assessment</div>
          <h2 className="mt-1 text-lg font-black">{patient.displayName}</h2>
          <p className="mt-0.5 text-xs text-slate-400">{patient.ageGroup.replace("-", " ")} • {patient.position}</p>
        </div>
        <button
          type="button"
          aria-label="Close patient assessment"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5 p-4">
        <section>
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-sky-300">
            <Activity size={15} /> What you observe
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-5 text-slate-200">
            {patient.observableSummary.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                {item}
              </li>
            ))}
          </ul>
          {patient.patientStatement ? (
            <blockquote className="mt-3 border-l-2 border-teal-300 pl-3 text-sm italic text-white">
              “{patient.patientStatement}”
            </blockquote>
          ) : null}
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-sky-300">
            <Stethoscope size={15} /> Major criteria
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Value label="Breathing" value={yesNo(runtime.findings.breathing)} />
            <Value label="Resp. distress" value={yesNo(runtime.findings.respiratoryDistress)} />
            <Value label="Follows commands" value={yesNo(runtime.findings.followsCommands)} />
            <Value label="Purposeful movement" value={yesNo(runtime.findings.purposefulMovement)} />
            <Value label="Peripheral pulse" value={runtime.findings.peripheralPulse === null ? "Not yet checked" : yesNo(runtime.findings.peripheralPulse)} />
            <Value label="Hemorrhage" value={runtime.findings.hemorrhage} />
          </div>
        </section>

        {runtime.locked && assignedMeta ? (
          <section className="rounded-md border border-teal-300/30 bg-teal-300/10 p-3">
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
          </section>
        ) : (
          <>
            <section>
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-amber-300">
                <HeartPulse size={15} /> Rapid lifesaving interventions
              </h3>
              {interventions.length ? (
                <div className="mt-2 grid gap-2">
                  {interventions.map((intervention) => {
                    const used = runtime.actionsTaken.includes(intervention.id);
                    return (
                      <button
                        key={intervention.id}
                        type="button"
                        data-testid={`triage-intervention-${intervention.id}`}
                        disabled={used}
                        onClick={() => onIntervention(intervention.id)}
                        className="min-h-12 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-left transition hover:border-teal-300 hover:bg-teal-300/10 disabled:border-teal-300/25 disabled:bg-teal-300/10 disabled:text-teal-200"
                      >
                        <span className="block text-sm font-black">{used ? "Completed: " : ""}{intervention.label}</span>
                        <span className="mt-0.5 block text-xs leading-4 text-slate-400">{intervention.description}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 rounded-md border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
                  No rapid lifesaving intervention is indicated from the findings available.
                </p>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.12em] text-teal-300">Assign triage tag</h3>
                <span className="hidden text-[10px] text-slate-500 sm:block">Keyboard: 1–5</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {categoryShortcuts.map(([category, shortcut]) => (
                  <TriageCategoryTag
                    key={category}
                    category={category}
                    shortcut={shortcut}
                    onClick={() => onAssign(category)}
                  />
                ))}
              </div>
              {mode === "learn" ? (
                <div className="mt-3 rounded-md border border-sky-300/20 bg-sky-300/10 p-3 text-[11px] leading-4 text-sky-100">
                  <strong className="block text-xs text-white">Learning hint</strong>
                  {interventions.length > 0 && runtime.actionsTaken.length === 0
                    ? "A rapid lifesaving intervention is available. Consider whether it should happen before the tag is assigned."
                    : "Compare breathing, command or purposeful response, peripheral pulse, major hemorrhage, and whether the injuries are truly minor."}
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
