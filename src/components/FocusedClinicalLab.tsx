import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Eye,
  Hand,
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
import FocusedLabSwitcher from "@/components/FocusedLabSwitcher";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import {
  getFocusedClinicalCase,
  getFocusedClinicalLab,
  getFocusedDecisionFeedback,
  getFocusedPhase,
  getPhaseFindings,
  scoreFocusedClinicalExam,
  type FocusedClinicalLabId,
} from "@/lib/focusedClinicalExams";

const ClinicalScene = dynamic(() => import("@/components/FocusedClinicalExamScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[340px] place-items-center bg-[#dceff0] text-slate-800" role="status">
      <div className="text-center">
        <LoaderCircle className="mx-auto animate-spin text-teal-700" size={28} />
        <p className="mt-3 text-sm font-bold">Preparing the exam model</p>
      </div>
    </div>
  ),
});

function getPhaseIcon(phaseId: string) {
  if (phaseId.includes("inspection") || phaseId.includes("face")) return Eye;
  if (phaseId.includes("neurovascular")) return HeartPulse;
  if (phaseId.includes("mental")) return Brain;
  if (phaseId.includes("motor") || phaseId.includes("function")) return Activity;
  if (phaseId.includes("context")) return ClipboardCheck;
  if (phaseId === "decision") return ClipboardCheck;
  return Hand;
}

export default function FocusedClinicalLab({ labId }: { labId: FocusedClinicalLabId }) {
  const config = getFocusedClinicalLab(labId);
  const sceneSectionRef = useRef<HTMLElement>(null);
  const debriefRef = useRef<HTMLElement>(null);
  const [caseId, setCaseId] = useState(config.cases[0].id);
  const [started, setStarted] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [examined, setExamined] = useState<string[]>([]);
  const [latestFinding, setLatestFinding] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);

  const examCase = getFocusedClinicalCase(config, caseId);
  const activePhaseIds = examCase.phaseIds;
  const phaseId = activePhaseIds[phaseIndex] ?? activePhaseIds[0];
  const phase = getFocusedPhase(config, phaseId);
  const requiredForPhase = getPhaseFindings(config, examCase, phaseId);
  const phaseComplete = requiredForPhase.every((findingId) => examined.includes(findingId));
  const availableFindings = phase.findingIds.filter((findingId) => examCase.requiredFindings.includes(findingId));
  const score = decision ? scoreFocusedClinicalExam(examCase, examined, decision) : null;
  const decisionFeedback = decision
    ? getFocusedDecisionFeedback(config, examCase, decision)
    : null;
  const progress = decision
    ? 100
    : Math.round(((phaseIndex + (phaseComplete ? 1 : 0)) / activePhaseIds.length) * 100);
  const remainingFindings = requiredForPhase.filter((findingId) => !examined.includes(findingId)).length;
  const nextPhaseId = activePhaseIds[phaseIndex + 1];
  const nextPhase = nextPhaseId ? getFocusedPhase(config, nextPhaseId) : null;
  const continueLabel = phaseComplete && nextPhase
    ? `Next: ${nextPhase.title}`
    : `Find ${remainingFindings} glowing point${remainingFindings === 1 ? "" : "s"}`;
  const findingLabels = Object.fromEntries(
    config.findings.map((finding) => [finding.id, finding.label])
  );
  const findingDetails = Object.fromEntries(
    config.findings.map((finding) => [finding.id, finding])
  );

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

  function examine(findingId: string) {
    if (!started || decision) return;
    setExamined((current) => (current.includes(findingId) ? current : [...current, findingId]));
    setLatestFinding(findingId);
  }

  function continueExam() {
    if (!phaseComplete || phaseIndex >= activePhaseIds.length - 1) return;
    setLatestFinding(null);
    setPhaseIndex((current) => current + 1);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => {
        sceneSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function chooseDecision(nextDecision: string) {
    setDecision(nextDecision);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          debriefRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }
  }

  const latestFindingDetail = latestFinding ? findingDetails[latestFinding] : null;
  const PhaseIcon = getPhaseIcon(phaseId);

  return (
    <div className="app-theme-surface min-h-screen bg-[#071a20] text-white">
      <Seo title={config.seoTitle} description={config.seoDescription} path={config.path} />
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
                <h1 className="truncate text-lg font-black sm:text-xl">{config.title}</h1>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor={`${labId}-case`} className="sr-only">Choose case</label>
              <select
                id={`${labId}-case`}
                value={caseId}
                onChange={(event) => reset(event.target.value)}
                className="min-h-10 max-w-[210px] rounded-md border border-white/15 bg-[#102b33] px-3 text-sm font-semibold text-white outline-none focus:border-teal-300 sm:max-w-none"
              >
                {config.cases.map((item) => (
                  <option key={item.id} value={item.id}>{item.shortTitle}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => reset()}
                aria-label={`Reset ${config.shortTitle} exam`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCcw size={17} />
              </button>
            </div>
          </div>
          <FocusedLabSwitcher activeLab={labId} />
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
            <ClinicalScene
              labId={labId}
              caseId={caseId}
              modelLabel={config.modelLabel}
              availableFindings={started ? availableFindings : []}
              examinedFindings={examined}
              findingLabels={findingLabels}
              onExamine={examine}
            />

            {!started ? (
              <div className="pointer-events-none absolute left-3 top-3 max-w-[min(350px,calc(100%-1.5rem))] rounded-lg border border-white/15 bg-slate-950/[0.9] p-4 shadow-2xl backdrop-blur-md sm:left-5 sm:top-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Active case</p>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                    examCase.statusTone === "urgent"
                      ? "border-rose-400/40 bg-rose-400/15 text-rose-200"
                      : "border-amber-400/40 bg-amber-400/15 text-amber-100"
                  }`}>
                    {examCase.statusLabel}
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
                  data-testid="clinical-exam-coach"
                  className="pointer-events-none absolute left-3 top-3 z-20 w-[min(365px,calc(100%-1.5rem))] rounded-xl border border-white/15 bg-[#071a20]/[0.94] p-3.5 shadow-2xl backdrop-blur-md sm:left-5 sm:top-5 sm:p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-300 text-slate-950">
                      <PhaseIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">
                          Step {phaseIndex + 1} of {activePhaseIds.length}
                        </p>
                        <span className="text-[10px] font-black tabular-nums text-teal-200">{progress}%</span>
                      </div>
                      <div className="mt-1 flex gap-1" aria-label={`${config.shortTitle} progress: step ${phaseIndex + 1} of ${activePhaseIds.length}`}>
                        {activePhaseIds.map((item, index) => (
                          <span key={item} className={`h-1 flex-1 rounded-full ${index <= phaseIndex ? "bg-teal-300" : "bg-white/15"}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">
                    {phaseId === "decision" ? "Put the exam together" : "Do this now"}
                  </p>
                  <h2 className="mt-1 text-base font-black leading-5 sm:text-lg">{phase.title}</h2>
                  <p className="mt-1.5 text-xs leading-4 text-slate-300 sm:leading-5">{phase.description}</p>
                  <div className="mt-2.5 flex items-start gap-2 border-t border-white/10 pt-2.5 text-[11px] leading-4 text-amber-50">
                    <Lightbulb className="mt-0.5 shrink-0 text-amber-300" size={13} />
                    <p>{phase.teaching}</p>
                  </div>

                  {phaseId !== "decision" ? (
                    <>
                      <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="clinical-phase-checklist">
                        {requiredForPhase.map((findingId) => {
                          const complete = examined.includes(findingId);
                          return (
                            <span
                              key={findingId}
                              className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold leading-3 ${
                                complete
                                  ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100"
                                  : "border-white/12 bg-white/[0.05] text-slate-200"
                              }`}
                            >
                              {complete ? <Check size={10} /> : <CircleDot size={9} />}
                              {findingLabels[findingId]}
                            </span>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        data-testid="continue-clinical-exam"
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

                {phaseId !== "decision" && latestFinding && latestFindingDetail ? (
                  <div
                    key={latestFinding}
                    role="status"
                    aria-live="polite"
                    data-testid="clinical-finding-message"
                    className="pointer-events-none absolute bottom-20 left-3 right-3 z-20 rounded-xl border border-teal-200/30 bg-[#082129]/[0.96] px-4 py-3 shadow-2xl backdrop-blur-md sm:left-auto sm:right-5 sm:w-[380px]"
                  >
                    <button
                      type="button"
                      aria-label="Dismiss finding"
                      onClick={() => setLatestFinding(null)}
                      className="pointer-events-auto absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-teal-200"
                    >
                      <X size={13} />
                    </button>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">How to check it</p>
                    <p className="mt-1 pr-6 text-[11px] leading-4 text-slate-200">{latestFindingDetail.technique}</p>
                    <div className="mt-2.5 border-t border-white/10 pt-2.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">Finding · {latestFindingDetail.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-white">{examCase.findings[latestFinding]}</p>
                    </div>
                  </div>
                ) : null}

                {phaseId === "decision" ? (
                  <div
                    className="absolute bottom-20 left-3 right-3 z-20 rounded-xl border border-white/15 bg-[#071a20]/[0.95] p-3 shadow-2xl backdrop-blur-md sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:w-[410px] sm:p-4"
                    data-testid="clinical-decisions"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">Choose one action</p>
                    <div className="mt-2 grid gap-1.5">
                      {config.decisions.map((option) => (
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
                data-testid={`begin-${labId}-exam`}
                onClick={() => setStarted(true)}
                className="absolute bottom-4 left-1/2 z-20 inline-flex min-h-11 -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-teal-300 px-5 py-2.5 text-sm font-black text-slate-950 shadow-2xl transition hover:bg-teal-200 focus:ring-4 focus:ring-white/80"
              >
                <Stethoscope size={17} /> Begin guided exam <ArrowRight size={16} />
              </button>
            ) : null}
          </section>

          {decision && score && decisionFeedback ? (
            <aside ref={debriefRef} data-testid="clinical-debrief" className="scroll-mt-24 overflow-y-auto bg-[#071a20] lg:max-h-[calc(100dvh-178px)]">
              <div className="p-5 sm:p-6">
                <span className={`grid h-12 w-12 place-items-center rounded-md ${score.decisionCorrect ? "bg-emerald-300 text-emerald-950" : "bg-rose-300 text-rose-950"}`}>
                  {score.decisionCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </span>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Case debrief</p>
                <h2 className="mt-1 text-2xl font-black">
                  {score.decisionCorrect ? "Good clinical decision" : "Reconsider the priority"}
                </h2>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-5xl font-black tabular-nums text-white">{score.score}</span>
                  <span className="pb-1 text-sm font-bold text-slate-400">/ 100</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{decisionFeedback}</p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Exam sequence</p>
                    <p className="mt-1 text-lg font-black text-white">{score.assessmentPoints} / 70</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Clinical decision</p>
                    <p className={`mt-1 text-lg font-black ${score.decisionCorrect ? "text-emerald-200" : "text-rose-200"}`}>
                      {score.decisionCorrect ? "30 / 30" : "0 / 30"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-md border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Your decision</p>
                  <p className="mt-2 text-sm font-bold text-white">{config.decisions.find((option) => option.id === decision)?.label}</p>
                  {!score.decisionCorrect ? (
                    <p className="mt-3 text-sm leading-5 text-emerald-200">
                      Best next step: {config.decisions.find((option) => option.id === examCase.correctDecision)?.label}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-300">Findings that drove the decision</p>
                  <div className="mt-2 space-y-2">
                    {examCase.decisionDrivers.map((findingId) => (
                      <div key={findingId} className="rounded-md border border-white/10 bg-white/[0.025] px-3 py-2.5">
                        <p className="text-xs font-bold text-white">{findingLabels[findingId]}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{examCase.findings[findingId]}</p>
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
