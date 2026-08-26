import Link from "next/link";
import {
  ArrowRight,
  Bone,
  Brain,
  CheckCircle2,
  Hand,
  PersonStanding,
  Stethoscope,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import Header from "@/components/Header";
import Seo from "@/components/Seo";

const plannedLabs = [
  { title: "Knee exam", detail: "Ottawa Knee Rule and focused stability checks", icon: PersonStanding, href: "/focused-exams/knee", actionLabel: "Start knee lab" },
  { title: "Wrist and hand", detail: "Scaphoid landmarks, circulation, sensation, and function", icon: Hand, href: "/focused-exams/wrist-hand", actionLabel: "Start wrist and hand lab" },
  { title: "Focused neuro", detail: "Stroke findings, pupils, strength, glucose, and timing", icon: Brain, href: "/focused-exams/neuro", actionLabel: "Start focused neuro lab" },
];

export default function FocusedExamLabsPage() {
  return (
    <AppShell>
      <Seo
        title="Focused Exam Labs"
        description="Practice focused EMT physical examinations with interactive anatomy, patient findings, clinical decisions, and concise debriefs."
        path="/focused-exams"
      />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-slate-800 bg-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <p className="flex items-center gap-2 text-sm font-bold text-teal-300">
              <Stethoscope size={17} /> Focused Exam Labs
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">Practice the exam, not just the answer.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Work through body-region assessments, reveal findings on the patient, and make the decision those findings support.
                </p>
              </div>
              <div className="border-l border-slate-700 pl-5 text-sm leading-6 text-slate-300">
                Each lab is short enough to repeat and specific enough to expose missed landmarks or unsafe shortcuts.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <article className="relative overflow-hidden rounded-lg border border-teal-300 bg-[#09252c] p-6 text-white shadow-[0_22px_60px_rgba(15,118,110,0.18)] sm:p-8">
              <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.22),transparent_65%)]" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-teal-300 text-slate-950">
                    <Bone size={24} />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-200">
                    <CheckCircle2 size={14} /> Available
                  </span>
                </div>
                <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-teal-300">Lower extremity</p>
                <h2 className="mt-2 text-3xl font-black">Ankle and foot exam</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Inspect the injury, palpate the correct Ottawa landmarks, check distal neurovascular status, assess weight bearing, and choose the right imaging pathway.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
                  {['4 case variants', 'Interactive anatomy', 'Scored debrief'].map((item) => (
                    <span key={item} className="rounded-md border border-white/12 bg-white/5 px-2.5 py-1.5">{item}</span>
                  ))}
                </div>
                <Link
                  href="/focused-exams/ankle"
                  className="mt-8 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md bg-teal-300 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-teal-200"
                >
                  Start ankle lab <ArrowRight size={17} />
                </Link>
              </div>
            </article>

            <section className="rounded-lg border border-[#c8dcd6] bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-[#102329]">
              <p className="text-xs font-black uppercase tracking-[0.17em] text-teal-700 dark:text-teal-300">Next in the lab</p>
              <div className="mt-4 divide-y divide-[#dce9e5] dark:divide-slate-700">
                {plannedLabs.map((lab) => {
                  const Icon = lab.icon;
                  const content = (
                    <>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-950 dark:text-white">{lab.title}</h3>
                        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{lab.detail}</p>
                      </div>
                      {lab.href ? <ArrowRight className="mt-2 shrink-0 text-teal-600 dark:text-teal-300" size={17} /> : null}
                    </>
                  );
                  return (
                    <Link
                      key={lab.title}
                      href={lab.href}
                      aria-label={lab.actionLabel}
                      className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 transition hover:translate-x-0.5"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          <p className="mt-7 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Focused Exam Labs support EMT education and do not replace an approved course, hands-on skills verification, local protocols, or medical direction.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
