"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  Gamepad,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import HeroScreenshot from "@/components/HeroScreenshot";

type IconComponent = LucideIcon;

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
    {children}
  </div>
);

const sectionIntroStyles = {
  light: {
    eyebrow: "text-teal-700",
    title: "text-slate-950",
    subtitle: "text-slate-600",
  },
  dark: {
    eyebrow: "text-cyan-200",
    title: "text-white",
    subtitle: "text-slate-300",
  },
};

function SectionIntro({
  eyebrow,
  title,
  subtitle,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: keyof typeof sectionIntroStyles;
}) {
  const styles = sectionIntroStyles[tone];

  return (
    <div className="max-w-3xl">
      <p className={`text-sm font-semibold ${styles.eyebrow}`}>{eyebrow}</p>
      <h2 className={`mt-2 text-3xl font-bold sm:text-4xl ${styles.title}`}>
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-4 max-w-2xl text-base leading-7 ${styles.subtitle}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function IconTile({
  icon: Icon,
  className,
}: {
  icon: IconComponent;
  className: string;
}) {
  return (
    <div className={`grid h-11 w-11 place-items-center rounded-lg ${className}`}>
      <Icon size={21} strokeWidth={2.2} />
    </div>
  );
}

const practicePaths = [
  {
    icon: Brain,
    title: "Scenario Trainer",
    description:
      "Work through realistic EMS calls, identify the high-value cues, and compare your reasoning against a guided breakdown.",
    href: "/emtrainer",
    cta: "Start a scenario",
    tileClass: "bg-teal-50 text-teal-700",
  },
  {
    icon: Timer,
    title: "NREMT Exam Mode",
    description:
      "Build test pacing with timed, one-question-at-a-time sets that mirror the pressure and distractors of exam day.",
    href: "/exam/nremt",
    cta: "Run exam mode",
    tileClass: "bg-slate-100 text-slate-800",
  },
  {
    icon: BookOpenCheck,
    title: "Flashcards",
    description:
      "Reinforce key assessments, pathophysiology, and treatment priorities with fast focused review sessions.",
    href: "/flashcards",
    cta: "Review cards",
    tileClass: "bg-amber-50 text-amber-700",
  },
];

const capabilities = [
  {
    icon: Stethoscope,
    title: "Clinical cue recognition",
    description:
      "Practice seeing vital signs, mechanism, red flags, and presentation details as a connected clinical picture.",
  },
  {
    icon: Brain,
    title: "Reasoning before recall",
    description:
      "Each scenario pushes you to choose, then explains the priority of care and why distractors are less appropriate.",
  },
  {
    icon: ShieldCheck,
    title: "NREMT-style discipline",
    description:
      "Question flow, tone, and answer structure are tuned for exam preparation without losing field relevance.",
  },
  {
    icon: BarChart3,
    title: "Progress you can act on",
    description:
      "Use performance history to spot weaker domains and decide what to practice next.",
  },
];

const workflow = [
  "Read the call and commit to the immediate priority.",
  "Surface critical cues and compare them against distractors.",
  "Review the step-by-step rationale behind the best answer.",
  "Loop weak domains back into targeted practice.",
];

const faqs = [
  {
    q: "Is PathoLogix aligned with the NREMT?",
    a: "Yes. The scenarios, distractors, and rationales are shaped around NREMT-style decision making while staying focused on real EMT reasoning.",
  },
  {
    q: "Can I practice specific EMT domains?",
    a: "Yes. You can move between scenario practice, timed exam sets, flashcards, and progress review depending on what needs the most reps.",
  },
  {
    q: "What is the difference between learning and exam practice?",
    a: "Learning practice makes the reasoning visible. Exam mode adds time pressure and hides feedback until you submit so you can build test discipline.",
  },
];

function PracticeCard({
  icon,
  title,
  description,
  href,
  cta,
  tileClass,
}: (typeof practicePaths)[number]) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="group flex h-full flex-col rounded-lg border border-[#c8dcd6] bg-white/88 p-5 shadow-[0_10px_28px_rgba(45,86,89,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-md"
    >
      <IconTile icon={icon} className={tileClass} />
      <h3 className="mt-5 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {description}
      </p>
      <Link
        href={href}
        className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {cta}
        <ArrowRight size={16} />
      </Link>
    </motion.article>
  );
}

export default function LandingPage() {
  return (
    <main className="relative isolate overflow-hidden text-slate-900">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <img
          src="/emt.png"
          alt="EMT assisting a patient beside an ambulance"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[58%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,18,26,0.94)_0%,rgba(8,18,26,0.83)_44%,rgba(8,18,26,0.28)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-[linear-gradient(0deg,rgba(15,23,42,0.80)_0%,rgba(15,23,42,0)_100%)]" />

        <Container>
          <div className="flex min-h-[62svh] max-w-2xl flex-col justify-center py-12 sm:py-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100 backdrop-blur"
            >
              <HeartPulse size={16} />
              NREMT-style EMT practice
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.04 }}
              className="mt-5 text-5xl font-black sm:text-6xl lg:text-7xl"
            >
              PathoLogix
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-5 max-w-xl text-lg leading-8 text-slate-100 sm:text-xl"
            >
              Train the judgment behind the answer with realistic EMS calls,
              cue-focused review, and timed exam practice built for EMT
              students.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/emtrainer"
                className="inline-flex items-center gap-2 rounded-md bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-950/20 transition hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Start practicing
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/exam/nremt"
                className="inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Try exam mode
                <Timer size={17} />
              </Link>

              <Link
                href="/emtscene"
                className="inline-flex items-center gap-2 rounded-md bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-950/20 transition hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Try our simulator
                <Gamepad size={17} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-8 grid max-w-xl grid-cols-3 gap-3 border-t border-white/25 pt-5 text-xs text-slate-200 sm:gap-4 sm:text-sm"
            >
              <div>
                <div className="text-xl font-bold text-white sm:text-2xl">3 modes</div>
                <p className="mt-1">Scenario, exam, and review practice.</p>
              </div>
              <div>
                <div className="text-xl font-bold text-white sm:text-2xl">Cue first</div>
                <p className="mt-1">Learn what details should change care.</p>
              </div>
              <div>
                <div className="text-xl font-bold text-white sm:text-2xl">Adaptive</div>
                <p className="mt-1">Return to the domains that need reps.</p>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      <section
        id="practice"
        className="bg-[linear-gradient(180deg,rgba(238,248,245,0.96),rgba(234,245,255,0.82))] py-16 sm:py-20"
      >
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro
              eyebrow="Practice paths"
              title="Pick the kind of pressure you need today."
              subtitle="Start with open reasoning, tighten pacing in exam mode, then reinforce the facts and patterns that keep showing up."
            />
            <Link
              href="/progress"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              View progress
              <BarChart3 size={16} />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {practicePaths.map((path) => (
              <PracticeCard key={path.title} {...path} />
            ))}
          </div>
        </Container>
      </section>

      <section id="features" className="border-y border-[#d5e6e1] bg-white/62 py-16 backdrop-blur sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionIntro
              eyebrow="Clinical reasoning"
              title="Built to make the hidden thinking visible."
              subtitle="PathoLogix is less about memorizing a single fact and more about practicing the chain of decisions that leads to better care."
            />

            <div className="grid overflow-hidden rounded-lg border border-[#c8dcd6] bg-[#c8dcd6] shadow-[0_12px_30px_rgba(45,86,89,0.08)] sm:grid-cols-2">
              {capabilities.map((item) => (
                <div key={item.title} className="bg-white/88 p-5 backdrop-blur">
                  <div className="flex items-start gap-4">
                    <IconTile
                      icon={item.icon}
                      className="shrink-0 bg-slate-100 text-slate-800"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section id="demo" className="bg-slate-950 py-16 text-white sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionIntro
                eyebrow="Scenario flow"
                title="Every rep ends with a clearer next decision."
                subtitle="The trainer keeps the patient story, answer choice, and rationale close together so students can connect field details to care priorities."
                tone="dark"
              />

              <div className="mt-8 space-y-4">
                {workflow.map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className="flex gap-4 border-l border-slate-700 pl-4"
                  >
                    <div className="font-mono text-sm text-cyan-200">
                      0{index + 1}
                    </div>
                    <p className="max-w-md text-sm leading-6 text-slate-300">
                      {step}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <HeroScreenshot />
            </motion.div>
          </div>
        </Container>
      </section>

      <section className="bg-white/58 py-16 backdrop-blur sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionIntro
              eyebrow="Why it sticks"
              title="Fast feedback without skipping the clinical why."
              subtitle="The best practice loop is simple: make a decision, see what mattered, then do another focused rep before the pattern fades."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "High-yield cues are called out after the decision.",
                "Rationales explain why the best answer beats close distractors.",
                "Timed mode keeps pacing honest under pressure.",
                "Progress review helps choose the next study target.",
              ].map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-lg border border-[#c8dcd6] bg-white/78 p-4 shadow-sm backdrop-blur"
                >
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-teal-600"
                    size={19}
                  />
                  <p className="text-sm leading-6 text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-teal-700 py-14 text-white">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-teal-100">
                <Sparkles size={16} />
                Ready for the next rep?
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Start with one scenario and let the weak spots reveal
                themselves.
              </h2>
            </div>
            <Link
              href="/emtrainer"
              className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-teal-800 shadow-lg shadow-teal-950/20 transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Practice now
              <Activity size={17} />
            </Link>
          </div>
        </Container>
      </section>

      <section id="faq" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionIntro
              eyebrow="FAQ"
              title="Quick answers before you jump in."
            />

            <div className="divide-y divide-[#d5e6e1] overflow-hidden rounded-lg border border-[#c8dcd6] bg-white/86 shadow-[0_12px_30px_rgba(45,86,89,0.08)] backdrop-blur">
              {faqs.map((faq) => (
                <details key={faq.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left text-sm font-semibold text-slate-950 transition hover:bg-teal-50/70">
                    {faq.q}
                    <ArrowRight
                      className="shrink-0 transition group-open:rotate-90"
                      size={17}
                    />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-6 text-slate-600">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-[#d5e6e1] bg-white/70 py-8 text-sm text-slate-600 backdrop-blur">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PathoLogix. EMT practice scenarios.</p>
            <div className="flex items-center gap-5">
              <a className="transition hover:text-slate-950" href="#">
                Privacy
              </a>
              <a className="transition hover:text-slate-950" href="#">
                Terms
              </a>
              <a className="transition hover:text-slate-950" href="#">
                Contact
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}
