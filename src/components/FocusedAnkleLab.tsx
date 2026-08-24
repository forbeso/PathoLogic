import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bone,
  Check,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Eye,
  Footprints,
  HeartPulse,
  LoaderCircle,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import {
  ankleExamCases,
  decisionOptions,
  examPhases,
  getCase,
  getPhaseRequiredFindings,
  getRelevantPalpationTargets,
  scoreAnkleExam,
  type AnkleCaseId,
  type ExamFindingId,
  type ExamPhaseId,
  type ImagingDecision,
} from "@/lib/focusedExamLabs";

const AnkleScene = dynamic(() => import("@/components/FocusedAnkleExamScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[340px] place-items-center bg-[#dceff0] text-slate-800" role="status">
      <div className="text-center">
        <LoaderCircle className="mx-auto animate-spin text-teal-700" size={28} />
        <p className="mt-3 text-sm font-bold">Preparing the ankle model</p>
      </div>
    </div>
  ),
});

const phaseIcons: Record<ExamPhaseId, typeof Eye> = {
  inspection: Eye,
  palpation: Bone,
  neurovascular: HeartPulse,
  function: Footprints,
  decision: ClipboardCheck,
};

const findingLabels: Record<ExamFindingId, string> = {
  appearance: "Alignment and swelling",
  skin: "Skin integrity and color",
  "lateral-malleolus": "Lateral malleolus",
  "medial-malleolus": "Medial malleolus",
  navicular: "Navicular",
  "fifth-metatarsal": "Base of fifth metatarsal",
  atfl: "Lateral soft tissue",
  "dorsalis-pedis": "Dorsalis pedis pulse",
  sensation: "Distal sensation",
  motor: "Toe movement",
  "weight-bearing": "Four-step weight bearing",
};

const phasePrompts: Record<ExamPhaseId, { title: string; description: string }> = {
  inspection: {
    title: "Look before you touch",
    description: "Check alignment, swelling, skin integrity, color, and any finding that changes the urgency of the exam.",
  },
  palpation: {
    title: "Palpate the correct landmarks",
    description: "Use the pain zone and mechanism to choose the bony landmarks that matter for the Ottawa criteria.",
  },
  neurovascular: {
    title: "Check the foot beyond the injury",
    description: "Document distal circulation, sensation, and motor function before making a disposition decision.",
  },
  function: {
    title: "Assess weight bearing safely",
    description: "Determine whether the patient could take four steps immediately after the injury and can do so now.",
  },
  decision: {
    title: "Choose the best next step",
    description: "Apply the findings to the appropriate Ottawa ankle or foot pathway without treating the rule as a diagnosis.",
  },
};

function phasesForCase(immediateConcern: boolean) {
  return immediateConcern
    ? (["inspection", "neurovascular", "decision"] as ExamPhaseId[])
    : (["inspection", "palpation", "neurovascular", "function", "decision"] as ExamPhaseId[]);
}

export default function FocusedAnkleLab() {
  const sceneSectionRef = useRef<HTMLElement>(null);
  const [caseId, setCaseId] = useState<AnkleCaseId>("lateral-sprain");
  const [started, setStarted] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [examined, setExamined] = useState<ExamFindingId[]>([]);
  const [latestFinding, setLatestFinding] = useState<ExamFindingId | null>(null);
  const [decision, setDecision] = useState<ImagingDecision | null>(null);

  const examCase = getCase(caseId);
  const activePhases = useMemo(() => phasesForCase(examCase.immediateConcern), [examCase.immediateConcern]);
  const phase = activePhases[phaseIndex] ?? activePhases[0];
  const requiredForPhase = useMemo(
    () => getPhaseRequiredFindings(examCase, phase),
    [examCase, phase]
  );
  const phaseComplete = requiredForPhase.every((id) => examined.includes(id));
  const availableFindings = useMemo(() => {
    if (phase === "palpation") return getRelevantPalpationTargets(examCase);
    return examPhases.find((item) => item.id === phase)?.findingIds ?? [];
  }, [examCase, phase]);
  const score = decision ? scoreAnkleExam(examCase, examined, decision) : null;
  const progress = decision
    ? 100
    : Math.round(((phaseIndex + (phaseComplete ? 1 : 0)) / activePhases.length) * 100);

  function reset(nextCaseId = caseId) {
    setCaseId(nextCaseId);
    setStarted(false);
    setPhaseIndex(0);
    setExamined([]);
    setLatestFinding(null);
    setDecision(null);
  }

  function examine(findingId: ExamFindingId) {
    if (!started || decision) return;
    setExamined((current) => (current.includes(findingId) ? current : [...current, findingId]));
    setLatestFinding(findingId);
  }

  function continueExam() {
    if (!phaseComplete || phaseIndex >= activePhases.length - 1) return;
    setLatestFinding(null);
    setPhaseIndex((current) => current + 1);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => {
        sceneSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  const latestMessage = latestFinding
    ? examCase.findings[latestFinding]
    : started
      ? examCase.patientLine
      : null;

  return (
    <div className="app-theme-surface min-h-screen bg-[#071a20] text-white">
      <Seo
        title="Focused Ankle Exam Lab"
        description="Practice ankle inspection, palpation, neurovascular assessment, weight-bearing evaluation, and Ottawa imaging decisions in an interactive focused exam lab."
        path="/focused-exams/ankle"
      />
      <Header compactOnLandscape />

      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[calc(100dvh-65px)] max-w-[1680px] flex-col">
        <section className="border-b border-white/10 bg-[#0a2027] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/focused-exams"
                aria-label="Back to Focused Exam Labs"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10"
              >
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">Focused Exam Lab</p>
                <h1 className="truncate text-lg font-black sm:text-xl">Ankle and foot assessment</h1>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor="ankle-case" className="sr-only">Choose ankle case</label>
              <select
                id="ankle-case"
                value={caseId}
                onChange={(event) => reset(event.target.value as AnkleCaseId)}
                className="min-h-10 max-w-[210px] rounded-md border border-white/15 bg-[#102b33] px-3 text-sm font-semibold text-white outline-none focus:border-teal-300 sm:max-w-none"
              >
                {ankleExamCases.map((item) => (
                  <option key={item.id} value={item.id}>{item.shortTitle}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => reset()}
                aria-label="Reset focused exam"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCcw size={17} />
              </button>
            </div>
          </div>
        </section>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section ref={sceneSectionRef} className="relative min-h-[46dvh] scroll-mt-24 overflow-hidden border-b border-white/10 lg:min-h-0 lg:border-b-0 lg:border-r">
            <AnkleScene
              caseId={caseId}
              phase={phase}
              availableFindings={started ? availableFindings : []}
              examinedFindings={examined}
              onExamine={examine}
            />

            <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-lg border border-white/15 bg-slate-950/[0.9] px-3 py-2.5 shadow-2xl backdrop-blur-md sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-black uppercase tracking-[0.17em] text-teal-300">
                  {latestFinding ? findingLabels[latestFinding] : "Active case"}
                </p>
                {!latestFinding ? (
                  <span className={`rounded border px-2 py-0.5 text-[9px] font-bold ${
                    examCase.immediateConcern
                      ? "border-rose-400/40 bg-rose-400/15 text-rose-200"
                      : "border-amber-400/40 bg-amber-400/15 text-amber-100"
                  }`}>
                    {examCase.immediateConcern ? "Limb threat" : "Stable"}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-white">
                {latestFinding ? examCase.findings[latestFinding] : examCase.title}
              </p>
            </div>

            <div className="pointer-events-none absolute left-5 top-5 hidden max-w-[330px] rounded-lg border border-white/15 bg-slate-950/[0.88] p-4 shadow-2xl backdrop-blur-md sm:block">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Active case</p>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                  examCase.immediateConcern
                    ? "border-rose-400/40 bg-rose-400/15 text-rose-200"
                    : "border-amber-400/40 bg-amber-400/15 text-amber-100"
                }`}>
                  {examCase.immediateConcern ? "Limb threat" : "Stable"}
                </span>
              </div>
              <h2 className="mt-2 text-base font-bold sm:text-lg">{examCase.title}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-300 sm:text-sm">{examCase.dispatch}</p>
              <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-5 text-slate-400">{examCase.mechanism}</p>
            </div>

            {latestMessage ? (
              <div
                role="status"
                aria-live="polite"
                data-testid="exam-finding-message"
                className="pointer-events-none absolute bottom-5 right-5 hidden max-w-[360px] rounded-lg border border-teal-200/25 bg-[#082129]/[0.92] px-4 py-3 shadow-2xl backdrop-blur-md sm:block"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                  {latestFinding ? findingLabels[latestFinding] : "Patient"}
                </p>
                <p className="mt-1 text-sm font-medium leading-5 text-white">{latestMessage}</p>
              </div>
            ) : null}

            {!started ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/32 px-4 backdrop-blur-[2px]">
                <div className="w-full max-w-md rounded-lg border border-white/15 bg-[#071a20]/95 p-6 text-center shadow-2xl">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-teal-300 text-slate-950">
                    <Stethoscope size={24} />
                  </span>
                  <h2 className="mt-4 text-2xl font-black">Begin the focused exam</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Work from inspection to a defensible imaging decision. Findings appear only after you examine the patient.
                  </p>
                  <button
                    type="button"
                    data-testid="begin-ankle-exam"
                    onClick={() => setStarted(true)}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal-300 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-teal-200"
                  >
                    Begin exam
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="flex min-h-0 flex-col bg-[#081a20] lg:max-h-[calc(100dvh-130px)]">
            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Exam progress</span>
                <span className="tabular-nums text-teal-300">{progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-teal-300 transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-5 gap-1">
                {examPhases.map((item) => {
                  const Icon = phaseIcons[item.id];
                  const activeIndex = activePhases.indexOf(item.id);
                  const skipped = activeIndex === -1;
                  const complete = activeIndex >= 0 && activeIndex < phaseIndex;
                  const active = item.id === phase;
                  return (
                    <div
                      key={item.id}
                      title={skipped ? `${item.label} is not appropriate in this case` : item.label}
                      className={`grid min-h-[54px] place-items-center rounded-md border px-1 py-1.5 text-center ${
                        active
                          ? "border-teal-300 bg-teal-300/15 text-teal-200"
                          : complete
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                            : "border-white/10 bg-white/[0.03] text-slate-500"
                      } ${skipped ? "opacity-35" : ""}`}
                    >
                      {complete ? <Check size={15} /> : <Icon size={15} />}
                      <span className="mt-1 text-[9px] font-bold leading-3">{item.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              {!decision ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal-300/12 text-teal-300">
                      {(() => {
                        const Icon = phaseIcons[phase];
                        return <Icon size={19} />;
                      })()}
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Current step</p>
                      <h2 className="mt-1 text-xl font-black">{phasePrompts[phase].title}</h2>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{phasePrompts[phase].description}</p>

                  {phase !== "decision" ? (
                    <div className="mt-5 space-y-2" data-testid="phase-checklist">
                      {requiredForPhase.map((id) => {
                        const complete = examined.includes(id);
                        return (
                          <div key={id} className="flex min-h-11 items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2.5">
                            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                              complete ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-slate-500 text-transparent"
                            }`}>
                              <Check size={13} />
                            </span>
                            <span className={`text-sm font-semibold ${complete ? "text-slate-300" : "text-white"}`}>{findingLabels[id]}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-2" data-testid="imaging-decisions">
                      {decisionOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setDecision(option.id)}
                          className="flex min-h-12 w-full items-center gap-3 rounded-md border border-white/12 bg-white/[0.045] px-3 py-3 text-left text-sm font-bold text-white transition hover:border-teal-300 hover:bg-teal-300/10 focus:border-teal-300"
                        >
                          <CircleDot className="shrink-0 text-teal-300" size={17} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {phase !== "decision" ? (
                    <button
                      type="button"
                      data-testid="continue-exam"
                      disabled={!phaseComplete}
                      onClick={continueExam}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                    >
                      {phaseComplete ? `Continue to ${phasePrompts[activePhases[phaseIndex + 1]].title}` : "Complete the checks on the model"}
                      {phaseComplete ? <ArrowRight size={17} /> : null}
                    </button>
                  ) : null}

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
                      <Activity size={14} /> Exam findings
                    </p>
                    {examined.length ? (
                      <div className="mt-3 space-y-2">
                        {examined.slice().reverse().map((id) => (
                          <button
                            type="button"
                            key={id}
                            onClick={() => setLatestFinding(id)}
                            className="w-full rounded-md border border-white/8 bg-white/[0.025] px-3 py-2 text-left text-xs leading-5 text-slate-300 transition hover:bg-white/[0.06]"
                          >
                            <span className="font-bold text-white">{findingLabels[id]}:</span> {examCase.findings[id]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No findings documented yet.</p>
                    )}
                  </div>
                </>
              ) : score ? (
                <div data-testid="exam-debrief">
                  <div className={`grid h-12 w-12 place-items-center rounded-md ${
                    score.decisionCorrect ? "bg-emerald-300 text-slate-950" : "bg-rose-400 text-white"
                  }`}>
                    {score.decisionCorrect ? <CheckCircle2 size={25} /> : <XCircle size={25} />}
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Case debrief</p>
                  <h2 className="mt-1 text-2xl font-black">
                    {score.decisionCorrect ? "Good clinical decision" : "Reconsider the imaging pathway"}
                  </h2>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-black tabular-nums text-white">{score.score}</span>
                    <span className="pb-1 text-sm font-bold text-slate-400">/ 100</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{examCase.rationale}</p>

                  <div className="mt-5 rounded-md border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Your decision</p>
                    <p className="mt-2 text-sm font-bold text-white">{decisionOptions.find((item) => item.id === decision)?.label}</p>
                    {!score.decisionCorrect ? (
                      <p className="mt-3 text-sm leading-5 text-emerald-200">
                        Best next step: {decisionOptions.find((item) => item.id === examCase.correctDecision)?.label}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={() => reset()}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-teal-300 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-teal-200"
                    >
                      <RotateCcw size={16} /> Repeat this case
                    </button>
                    <Link
                      href="/focused-exams"
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
                    >
                      View exam labs <ArrowRight size={16} />
                    </Link>
                  </div>

                  <p className="mt-6 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
                    <ShieldAlert className="mt-0.5 shrink-0" size={15} />
                    Educational practice only. Follow your approved curriculum, local protocols, scope of practice, and medical direction.
                  </p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
