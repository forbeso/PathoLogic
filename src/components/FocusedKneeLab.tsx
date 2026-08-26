import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Lightbulb,
  LoaderCircle,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
  X,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import FocusedLabSwitcher from "@/components/FocusedLabSwitcher";
import Seo from "@/components/Seo";
import {
  getKneeCase,
  getKneeDecisionFeedback,
  getKneePhaseFindings,
  kneeDecisionOptions,
  kneeExamCases,
  kneeExamPhases,
  kneeExamTechniques,
  kneeFindingLabels,
  kneePhasesForCase,
  scoreKneeExam,
  type KneeCaseId,
  type KneeDecision,
  type KneeExamPhaseId,
  type KneeFindingId,
} from "@/lib/focusedKneeExam";

const KneeScene = dynamic(() => import("@/components/FocusedKneeExamScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[340px] place-items-center bg-[#dceff0] text-slate-800" role="status">
      <div className="text-center">
        <LoaderCircle className="mx-auto animate-spin text-teal-700" size={28} />
        <p className="mt-3 text-sm font-bold">Preparing the knee model</p>
      </div>
    </div>
  ),
});

const phaseIcons: Record<KneeExamPhaseId, typeof Eye> = {
  inspection: Eye,
  palpation: Bone,
  neurovascular: HeartPulse,
  stability: Activity,
  function: Footprints,
  decision: ClipboardCheck,
};

const phasePrompts: Record<
  KneeExamPhaseId,
  { title: string; description: string; teaching: string }
> = {
  inspection: {
    title: "Look before you touch",
    description: "Compare alignment, patellar position, swelling, skin, and any sign that makes further testing unsafe.",
    teaching: "Gross deformity, skin tenting, pallor, or a cool limb changes the priority from a routine knee screen to immediate limb assessment.",
  },
  palpation: {
    title: "Find the Ottawa landmarks",
    description: "Palpate the patella and fibular head, then localize any additional soft-tissue pain.",
    teaching: "The Ottawa Knee Rule specifically includes isolated patellar tenderness and fibular-head tenderness. Joint-line pain alone is not one of its five criteria.",
  },
  neurovascular: {
    title: "Check beyond the knee",
    description: "Assess distal circulation, sensation, and motor function before stress testing or disposition.",
    teaching: "Knee trauma can threaten the popliteal artery or peroneal nerve. An abnormal distal exam requires urgent action and reassessment.",
  },
  stability: {
    title: "Screen stability gently",
    description: "Only after excluding fracture concern and limb threat, compare gentle collateral and anterior stability checks.",
    teaching: "Provocative maneuvers should never be forced in an acutely painful or unstable knee. Stop if there is severe pain, marked laxity, or guarding.",
  },
  function: {
    title: "Assess motion and gait",
    description: "Check active flexion toward 90 degrees and determine whether four weight-bearing steps are possible.",
    teaching: "Inability to flex to 90 degrees or take four steps are Ottawa Knee Rule criteria. Do not test either when gross deformity or neurovascular compromise is present.",
  },
  decision: {
    title: "Choose the best next step",
    description: "Apply age, bony landmarks, flexion, and four-step weight bearing without using the rule as a diagnosis.",
    teaching: "Any one of the five Ottawa Knee Rule criteria supports radiographs. A negative rule guides imaging decisions but does not exclude every significant injury.",
  },
};

export default function FocusedKneeLab() {
  const sceneSectionRef = useRef<HTMLElement>(null);
  const debriefRef = useRef<HTMLElement>(null);
  const [caseId, setCaseId] = useState<KneeCaseId>("medial-sprain");
  const [started, setStarted] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [examined, setExamined] = useState<KneeFindingId[]>([]);
  const [latestFinding, setLatestFinding] = useState<KneeFindingId | null>(null);
  const [decision, setDecision] = useState<KneeDecision | null>(null);

  const examCase = getKneeCase(caseId);
  const activePhases = useMemo(() => kneePhasesForCase(examCase), [examCase]);
  const phase = activePhases[phaseIndex] ?? activePhases[0];
  const requiredForPhase = useMemo(
    () => getKneePhaseFindings(examCase, phase),
    [examCase, phase]
  );
  const phaseComplete = requiredForPhase.every((id) => examined.includes(id));
  const availableFindings = useMemo(
    () => kneeExamPhases.find((item) => item.id === phase)?.findingIds ?? [],
    [phase]
  );
  const score = decision ? scoreKneeExam(examCase, examined, decision) : null;
  const decisionFeedback = decision ? getKneeDecisionFeedback(examCase, decision) : null;
  const progress = decision
    ? 100
    : Math.round(((phaseIndex + (phaseComplete ? 1 : 0)) / activePhases.length) * 100);
  const remainingFindings = requiredForPhase.filter((id) => !examined.includes(id)).length;
  const nextPhase = activePhases[phaseIndex + 1];
  const continueLabel = phaseComplete && nextPhase
    ? `Next: ${phasePrompts[nextPhase].title}`
    : `Find ${remainingFindings} glowing point${remainingFindings === 1 ? "" : "s"}`;

  useEffect(() => {
    if (!latestFinding) return;
    const timeout = window.setTimeout(() => setLatestFinding(null), 14000);
    return () => window.clearTimeout(timeout);
  }, [latestFinding]);

  function reset(nextCaseId = caseId) {
    setCaseId(nextCaseId);
    setStarted(false);
    setPhaseIndex(0);
    setExamined([]);
    setLatestFinding(null);
    setDecision(null);
  }

  function examine(findingId: KneeFindingId) {
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

  function chooseDecision(nextDecision: KneeDecision) {
    setDecision(nextDecision);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          debriefRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }
  }

  return (
    <div className="app-theme-surface min-h-screen bg-[#071a20] text-white">
      <Seo
        title="Focused Knee Exam Lab"
        description="Practice knee inspection, Ottawa Knee Rule landmarks, neurovascular assessment, stability checks, motion, and imaging decisions."
        path="/focused-exams/knee"
      />
      <Header compactOnLandscape darkSurface />

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
                <h1 className="truncate text-lg font-black sm:text-xl">Knee assessment</h1>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor="knee-case" className="sr-only">Choose knee case</label>
              <select
                id="knee-case"
                value={caseId}
                onChange={(event) => reset(event.target.value as KneeCaseId)}
                className="min-h-10 max-w-[210px] rounded-md border border-white/15 bg-[#102b33] px-3 text-sm font-semibold text-white outline-none focus:border-teal-300 sm:max-w-none"
              >
                {kneeExamCases.map((item) => (
                  <option key={item.id} value={item.id}>{item.shortTitle}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => reset()}
                aria-label="Reset knee exam"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCcw size={17} />
              </button>
            </div>
          </div>
          <FocusedLabSwitcher activeLab="knee" />
        </section>

        <div className={`grid min-h-0 flex-1 ${decision ? "lg:grid-cols-[minmax(0,1fr)_390px]" : ""}`}>
          <section
            ref={sceneSectionRef}
            className={`relative scroll-mt-24 overflow-hidden border-white/10 ${
              decision
                ? "min-h-[54dvh] border-b lg:min-h-0 lg:border-b-0 lg:border-r"
                : "min-h-[650px] sm:min-h-[calc(100dvh-236px)]"
            }`}
          >
            <KneeScene
              caseId={caseId}
              phase={phase}
              availableFindings={started ? availableFindings : []}
              examinedFindings={examined}
              onExamine={examine}
            />

            {!started ? (
              <div className="pointer-events-none absolute left-3 top-3 max-w-[min(340px,calc(100%-1.5rem))] rounded-lg border border-white/15 bg-slate-950/[0.88] p-4 shadow-2xl backdrop-blur-md sm:left-5 sm:top-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Active case</p>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                    examCase.immediateConcern
                      ? "border-rose-400/40 bg-rose-400/15 text-rose-200"
                      : "border-amber-400/40 bg-amber-400/15 text-amber-100"
                  }`}>
                    {examCase.immediateConcern ? "Limb threat" : `Age ${examCase.age}`}
                  </span>
                </div>
                <h2 className="mt-2 text-base font-bold sm:text-lg">{examCase.title}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-300 sm:text-sm">{examCase.dispatch}</p>
                <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-5 text-slate-400">{examCase.mechanism}</p>
                <p className="mt-3 rounded-lg border border-teal-200/20 bg-teal-300/10 px-3 py-2 text-xs font-semibold leading-5 text-teal-50">
                  “{examCase.patientLine}”
                </p>
              </div>
            ) : null}

            {started && !decision ? (
              <>
                <div
                  data-testid="knee-exam-coach"
                  className="pointer-events-none absolute left-3 top-3 z-20 w-[min(360px,calc(100%-1.5rem))] rounded-xl border border-white/15 bg-[#071a20]/[0.93] p-3.5 shadow-2xl backdrop-blur-md sm:left-5 sm:top-5 sm:p-4"
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
                      <div className="mt-1 flex gap-1" aria-label={`Knee exam progress: step ${phaseIndex + 1} of ${activePhases.length}`}>
                        {activePhases.map((item, index) => (
                          <span key={item} className={`h-1 flex-1 rounded-full ${index <= phaseIndex ? "bg-teal-300" : "bg-white/15"}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">
                    {phase === "decision" ? "Put the exam together" : "Do this now"}
                  </p>
                  <h2 className="mt-1 text-base font-black leading-5 sm:text-lg">{phasePrompts[phase].title}</h2>
                  <p className="mt-1.5 text-xs leading-4 text-slate-300 sm:leading-5">{phasePrompts[phase].description}</p>
                  <div className="mt-2.5 flex items-start gap-2 border-t border-white/10 pt-2.5 text-[11px] leading-4 text-amber-50">
                    <Lightbulb className="mt-0.5 shrink-0 text-amber-300" size={13} />
                    <p>{phasePrompts[phase].teaching}</p>
                  </div>

                  {phase !== "decision" ? (
                    <>
                      <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="knee-phase-checklist">
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
                              {kneeFindingLabels[id]}
                            </span>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        data-testid="continue-knee-exam"
                        disabled={!phaseComplete}
                        onClick={continueExam}
                        className="pointer-events-auto mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[11px] font-black text-white transition hover:border-teal-200 hover:bg-white/10 disabled:pointer-events-none disabled:cursor-default disabled:text-slate-400"
                      >
                        {continueLabel}
                        {phaseComplete ? <ArrowRight size={14} /> : null}
                      </button>
                    </>
                  ) : null}
                </div>

                {phase !== "decision" && latestFinding ? (
                  <div
                    key={latestFinding}
                    role="status"
                    aria-live="polite"
                    data-testid="knee-finding-message"
                    className="pointer-events-none absolute bottom-20 left-3 right-3 z-20 rounded-xl border border-teal-200/30 bg-[#082129]/[0.95] px-4 py-3 shadow-2xl backdrop-blur-md sm:left-auto sm:right-5 sm:w-[370px]"
                  >
                    <button
                      type="button"
                      aria-label="Dismiss knee finding"
                      title="Dismiss knee finding"
                      onClick={() => setLatestFinding(null)}
                      className="pointer-events-auto absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-teal-200"
                    >
                      <X size={13} />
                    </button>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">How to check it</p>
                    <p className="mt-1 pr-6 text-[11px] leading-4 text-slate-200">{kneeExamTechniques[latestFinding]}</p>
                    <div className="mt-2.5 border-t border-white/10 pt-2.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">Finding · {kneeFindingLabels[latestFinding]}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-white">{examCase.findings[latestFinding]}</p>
                    </div>
                  </div>
                ) : null}

                {phase === "decision" ? (
                  <div
                    className="absolute bottom-20 left-3 right-3 z-20 rounded-xl border border-white/15 bg-[#071a20]/[0.94] p-3 shadow-2xl backdrop-blur-md sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:w-[400px] sm:p-4"
                    data-testid="knee-decisions"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">Choose one action</p>
                    <div className="mt-2 grid gap-1.5">
                      {kneeDecisionOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => chooseDecision(option.id)}
                          className="flex min-h-11 items-center gap-2 rounded-md border border-white/12 bg-white/[0.045] px-3 py-2 text-left text-[11px] font-bold leading-4 text-white transition hover:border-teal-300 hover:bg-teal-300/10 focus:border-teal-300 sm:text-xs"
                        >
                          <CircleDot className="shrink-0 text-teal-300" size={14} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {!started ? (
              <button
                type="button"
                data-testid="begin-knee-exam"
                onClick={() => setStarted(true)}
                className="absolute bottom-4 left-1/2 z-20 inline-flex min-h-11 -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-teal-300 px-5 py-2.5 text-sm font-black text-slate-950 shadow-2xl transition hover:bg-teal-200 focus:ring-4 focus:ring-white/80"
              >
                <Stethoscope size={17} /> Begin guided exam <ArrowRight size={16} />
              </button>
            ) : null}
          </section>

          {decision && score && decisionFeedback ? (
            <aside ref={debriefRef} data-testid="knee-debrief" className="scroll-mt-24 overflow-y-auto bg-[#071a20] lg:max-h-[calc(100dvh-130px)]">
              <div className="p-5 sm:p-6">
                <span className={`grid h-12 w-12 place-items-center rounded-md ${score.decisionCorrect ? "bg-emerald-300 text-emerald-950" : "bg-rose-300 text-rose-950"}`}>
                  {score.decisionCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </span>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Case debrief</p>
                <h2 className="mt-2 text-2xl font-black">{score.decisionCorrect ? "Good clinical decision" : "Revisit the decision"}</h2>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-5xl font-black tabular-nums">{score.score}</span>
                  <span className="pb-1 text-sm font-bold text-slate-400">/ 100</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{decisionFeedback}</p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Exam sequence</p>
                    <p className="mt-1 text-lg font-black">{score.assessmentPoints} / 70</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Clinical decision</p>
                    <p className={`mt-1 text-lg font-black ${score.decisionCorrect ? "text-emerald-300" : "text-rose-300"}`}>
                      {score.decisionCorrect ? "30 / 30" : "0 / 30"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-md border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Your decision</p>
                  <p className="mt-2 text-sm font-bold text-white">
                    {kneeDecisionOptions.find((option) => option.id === decision)?.label}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-teal-300">Findings that drove the decision</p>
                  <div className="mt-3 space-y-2">
                    {examCase.decisionDrivers.map((id) => (
                      <div key={id} className="rounded-md border border-white/10 bg-white/[0.025] px-3 py-2.5">
                        <p className="text-xs font-bold text-white">{kneeFindingLabels[id]}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{examCase.findings[id]}</p>
                      </div>
                    ))}
                  </div>
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
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}
