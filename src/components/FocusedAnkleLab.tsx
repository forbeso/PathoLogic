import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
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
  Lightbulb,
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

const phasePrompts: Record<
  ExamPhaseId,
  { title: string; description: string; teaching: string }
> = {
  inspection: {
    title: "Look before you touch",
    description: "Check alignment, swelling, skin integrity, color, and any finding that changes the urgency of the exam.",
    teaching: "Inspection comes first because deformity, an open injury, pallor, or severe swelling can immediately change your priorities.",
  },
  palpation: {
    title: "Palpate the correct landmarks",
    description: "Use the pain zone and mechanism to choose the bony landmarks that matter for the Ottawa criteria.",
    teaching: "For the ankle rule, palpate the posterior edge and tip of each malleolus. Soft-tissue tenderness in front of the lateral malleolus is not the same as bony tenderness.",
  },
  neurovascular: {
    title: "Check the foot beyond the injury",
    description: "Document distal circulation, sensation, and motor function before making a disposition decision.",
    teaching: "A focused extremity exam is incomplete without circulation, sensation, and movement distal to the injury. Recheck these after splinting.",
  },
  function: {
    title: "Assess weight bearing safely",
    description: "Determine whether the patient could take four steps immediately after the injury and can do so now.",
    teaching: "Four steps count even with a limp. Never force weight bearing when there is gross deformity or a neurovascular threat.",
  },
  decision: {
    title: "Choose the best next step",
    description: "Apply the findings to the appropriate Ottawa ankle or foot pathway without treating the rule as a diagnosis.",
    teaching: "Match the pain zone to its qualifying landmarks, then include weight-bearing ability. A negative rule guides imaging decisions; it does not prove that no fracture exists.",
  },
};

function phasesForCase(immediateConcern: boolean) {
  return immediateConcern
    ? (["inspection", "neurovascular", "decision"] as ExamPhaseId[])
    : (["inspection", "palpation", "neurovascular", "function", "decision"] as ExamPhaseId[]);
}

export default function FocusedAnkleLab() {
  const sceneSectionRef = useRef<HTMLElement>(null);
  const debriefRef = useRef<HTMLElement>(null);
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

  function chooseDecision(nextDecision: ImagingDecision) {
    setDecision(nextDecision);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          debriefRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
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

        <div
          className={`grid min-h-0 flex-1 ${
            decision ? "lg:grid-cols-[minmax(0,1fr)_390px]" : ""
          }`}
        >
          <section
            ref={sceneSectionRef}
            className={`relative scroll-mt-24 overflow-hidden border-white/10 ${
              decision
                ? "min-h-[54dvh] border-b lg:min-h-0 lg:border-b-0 lg:border-r"
                : "min-h-[calc(100dvh-220px)] sm:min-h-[calc(100dvh-188px)]"
            }`}
          >
            <AnkleScene
              caseId={caseId}
              phase={phase}
              availableFindings={started ? availableFindings : []}
              examinedFindings={examined}
              onExamine={examine}
            />

            {!started ? (
              <div className="pointer-events-none absolute left-3 top-3 max-w-[min(330px,calc(100%-1.5rem))] rounded-lg border border-white/15 bg-slate-950/[0.88] p-4 shadow-2xl backdrop-blur-md sm:left-5 sm:top-5">
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
            ) : null}

            {started && !decision ? (
              <>
                <div
                  data-testid="guided-exam-coach"
                  className="absolute left-3 top-3 z-20 w-[min(350px,calc(100%-1.5rem))] rounded-xl border border-white/15 bg-[#071a20]/[0.93] p-3.5 shadow-2xl backdrop-blur-md sm:left-5 sm:top-5 sm:p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-300 text-slate-950">
                      {(() => {
                        const Icon = phaseIcons[phase];
                        return <Icon size={16} />;
                      })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">
                          Step {phaseIndex + 1} of {activePhases.length}
                        </p>
                        <span className="text-[10px] font-black tabular-nums text-teal-200">{progress}%</span>
                      </div>
                      <div className="mt-1 flex gap-1" aria-label={`Exam progress: step ${phaseIndex + 1} of ${activePhases.length}`}>
                        {activePhases.map((item, index) => (
                          <span
                            key={item}
                            className={`h-1 flex-1 rounded-full ${index <= phaseIndex ? "bg-teal-300" : "bg-white/15"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">
                    {phase === "decision" ? "Put the exam together" : "Do this now"}
                  </p>
                  <h2 className="mt-1 text-base font-black leading-5 sm:text-lg">{phasePrompts[phase].title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-4 text-slate-300 sm:leading-5">
                    {phasePrompts[phase].description}
                  </p>
                  <div className="mt-2.5 flex items-start gap-2 border-t border-white/10 pt-2.5 text-[11px] leading-4 text-amber-50">
                    <Lightbulb className="mt-0.5 shrink-0 text-amber-300" size={13} />
                    <p className="line-clamp-2">{phasePrompts[phase].teaching}</p>
                  </div>

                  {phase !== "decision" ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="phase-checklist">
                      {requiredForPhase.map((id) => {
                        const complete = examined.includes(id);
                        return (
                          <span
                            key={id}
                            className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold leading-3 ${
                              complete
                                ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100"
                                : "border-white/12 bg-white/[0.05] text-slate-200"
                            }`}
                          >
                            {complete ? <Check size={10} /> : <CircleDot size={9} />}
                            {findingLabels[id]}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {phase !== "decision" && latestFinding ? (
                  <div
                    key={latestFinding}
                    role="status"
                    aria-live="polite"
                    data-testid="exam-finding-message"
                    className="pointer-events-none absolute bottom-[4.75rem] right-3 z-20 w-[min(320px,calc(100%-1.5rem))] rounded-xl border border-teal-200/30 bg-[#082129]/[0.94] px-4 py-3 shadow-2xl backdrop-blur-md sm:bottom-20 sm:right-5"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">Finding · {findingLabels[latestFinding]}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white">{latestMessage}</p>
                  </div>
                ) : null}

                {phase !== "decision" ? (
                  <button
                    type="button"
                    data-testid="continue-exam"
                    disabled={!phaseComplete}
                    onClick={continueExam}
                    className="absolute bottom-4 left-1/2 z-20 inline-flex min-h-10 max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-[#071a20]/90 px-4 py-2 text-xs font-black text-white shadow-xl backdrop-blur-md transition hover:border-teal-200 hover:bg-[#0b2931] disabled:cursor-default disabled:text-slate-300"
                  >
                    {phaseComplete ? `Next: ${phasePrompts[activePhases[phaseIndex + 1]].title}` : `Find ${requiredForPhase.length - requiredForPhase.filter((id) => examined.includes(id)).length} glowing point${requiredForPhase.length - requiredForPhase.filter((id) => examined.includes(id)).length === 1 ? "" : "s"}`}
                    {phaseComplete ? <ArrowRight size={15} /> : null}
                  </button>
                ) : (
                  <div className="absolute bottom-3 left-3 right-3 z-20 rounded-xl border border-white/15 bg-[#071a20]/[0.94] p-3 shadow-2xl backdrop-blur-md sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:w-[390px] sm:p-4" data-testid="imaging-decisions">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">Choose one action</p>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {decisionOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => chooseDecision(option.id)}
                          className="flex min-h-10 items-center gap-2 rounded-md border border-white/12 bg-white/[0.045] px-3 py-2 text-left text-[10px] font-bold leading-4 text-white transition hover:border-teal-300 hover:bg-teal-300/10 focus:border-teal-300 sm:text-xs"
                        >
                          <CircleDot className="shrink-0 text-teal-300" size={14} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {!started ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/32 px-4 backdrop-blur-[2px]">
                <div className="w-full max-w-md rounded-lg border border-white/15 bg-[#071a20]/95 p-6 text-center shadow-2xl">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-teal-300 text-slate-950">
                    <Stethoscope size={24} />
                  </span>
                  <h2 className="mt-4 text-2xl font-black">Begin the focused exam</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    I’ll guide you through each part of the exam, explain why it matters, and help you connect the findings to the imaging decision.
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

          {decision && score ? (
            <aside ref={debriefRef} className="flex min-h-0 scroll-mt-4 flex-col bg-[#081a20] lg:max-h-[calc(100dvh-130px)]">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
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
              </div>
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}
