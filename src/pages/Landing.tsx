"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Stethoscope,
  Brain,
  Activity,
  Timer,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpenCheck,
  BarChart3,
  MessageSquareQuote,
} from "lucide-react";
import HeroScreenshot from "@/components/HeroScreenshot";

// Reusable UI bits
const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
    {children}
  </span>
);

const SectionTitle = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="mx-auto max-w-3xl text-center">
    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
      {eyebrow}
    </div>
    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
      {title}
    </h2>
    {subtitle ? (
      <p className="mt-3 ">{subtitle}</p>
    ) : null}
  </div>
);

const Feature = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) => (
  <div className="group rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 ">
    <div className="mb-3 inline-flex rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
      <Icon size={20} />
    </div>
    <h3 className="text-base font-semibold">{title}</h3>
    <p className="mt-1 text-sm ">{desc}</p>
  </div>
);

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(16,185,129,0.18),transparent),radial-gradient(800px_500px_at_100%_0,rgba(59,130,246,0.15),transparent)]">
      {/* Nav */}
      {/* <nav className="sticky top-0 z-20 border-b border-white/10 bg-white/50 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/50">
        <Container>
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-sm">
                <Sparkles size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                PathoLogic
              </span>
              <Badge>Beta</Badge>
            </div>
            <div className="hidden gap-6 text-sm text-slate-700 dark:text-slate-300 md:flex">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Features</a>
              <a href="#how" className="hover:text-slate-900 dark:hover:text-white">How it works</a>
              <a href="#proof" className="hover:text-slate-900 dark:hover:text-white">Proof</a>
              <a href="#faq" className="hover:text-slate-900 dark:hover:text-white">FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Try Scenarios <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Container>
      </nav> */}

      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-extrabold tracking-tight sm:text-5xl"
              >
                Train your EMT reasoning — not just your memory.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-4 max-w-xl text-lg "
              >
                PathoLogix generates NREMT‑style scenarios, highlights critical cues, and walks you through step‑by‑step differentials so you master the <em>why</em> behind each answer.
              </motion.p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/emtrainer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  Start practicing <ArrowRight size={16} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur  hover:text-dark dark:border-slate-700 dark:bg-slate-900/60"
                >
                  See features
                </a>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 text-xs ">
                <Badge>Evidence‑based cues</Badge>
                <Badge>Step‑wise breakdowns</Badge>
                <Badge>Exam & Learn modes</Badge>
              </div>
            </div>

            {/* Screenshot mock */}
            {/* Screenshot mock (keeps your design) */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
  className="relative"
>
  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
    {/* Image in the same frame */}
    <HeroScreenshot/>

    {/* Your floating mini-card stays */}
    <div className="-mt-10 ml-6 w-2/3 rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-xl dark:border-slate-700/70 dark:bg-slate-900/80 relative z-10">
      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Cue Highlighter</div>
      <div className="mt-1 h-2 w-2/3 rounded bg-emerald-200" />
      <div className="mt-2 h-2 w-1/2 rounded bg-amber-200" />
    </div>
  </div>
</motion.div>

          </div>
        </Container>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <Container>
          <SectionTitle
            eyebrow="Features"
            title="Everything you need to think like an EMT"
            subtitle="Built for EMTs in training with adaptive practice, explanations, and analytics."
           
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={Brain} title="Cue Highlighting" desc="Surface critical words in the stem so you learn to spot high‑value clues fast." />
            <Feature icon={BookOpenCheck} title="Step‑by‑Step Reasoning" desc="Guided breakdowns train your differential diagnosis and priorities of care." />
            <Feature icon={Timer} title="Exam & Learn Modes" desc="Timed exam mode or exploratory learn mode with just‑in‑time hints." />
            <Feature icon={BarChart3} title="Adaptive Practice" desc="Biases questions toward weaker domains to close gaps quickly." />
            <Feature icon={ShieldCheck} title="NREMT‑Aligned" desc="Style, tone, and distractors mirror the real test experience." />
            <Feature icon={Activity} title="Progress Analytics" desc="Accuracy by domain, time‑on‑task, confidence calibration, and more." />
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how" className="py-16">
        <Container>
          <SectionTitle
            eyebrow="How it works"
            title="From scenario to mastery in four steps"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {["Read the stem & spot cues","Select the best answer","Reveal step‑wise reasoning","Review & reinforce"].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-slate-200/70 bg-white/70 p-5  shadow-sm backdrop-blur dark:border-slate-700/70 "
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400">
                  {i + 1}
                </div>
                <div className="text-sm font-semibold">{step}</div>
                <p className="mt-1 text-xs">
                  {[
                    "Focus on vital signs, keywords, and red flags.",
                    "Commit, don’t over‑toggle cues. Build test discipline.",
                    "Compare against distractors and see why B ≠ D.",
                    "Auto‑reinforce weak areas with adaptive sets.",
                  ][i]}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Social proof */}
      {/* <section id="proof" className="py-16">
        <Container>
          <SectionTitle eyebrow="What users say" title="Built with EMT learners in mind" />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "The cue highlighting taught me to actually read stems like a clinician. My practice scores jumped in a week.",
                name: "Alex R.",
                role: "EMT Student",
              },
              {
                quote:
                  "Feels like the NREMT—down to the distractors. The step‑by‑step breakdowns make the ‘why’ click.",
                name: "Morgan T.",
                role: "Paramedic Candidate",
              },
              {
                quote:
                  "Exam mode is brutal—but my pacing and accuracy improved fast.",
                name: "Jamie L.",
                role: "EMT-B",
              },
            ].map((t, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-700/70"
              >
                <MessageSquareQuote className="mb-3 text-emerald-600 dark:text-emerald-400" />
                <blockquote className="text-sm">{t.quote}</blockquote>
                <figcaption className="mt-3 text-xs">
                  <span className="font-semibold">{t.name}</span> · {t.role}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </Container>
      </section> */}

      {/* CTA */}
      <section className="py-16">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-emerald-600 to-sky-600 p-8 text-white shadow-lg">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 grid items-center gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Ready to level up your clinical reasoning?</h3>
                <p className="mt-2 text-white/80">
                  Jump into adaptive practice or run a timed exam set. Your future patients will thank you.
                </p>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow hover:bg-white/90"
                >
                  Try it free <ArrowRight size={16} />
                </Link>
                <a
                  href="#faq"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-20">
        <Container>
          <SectionTitle eyebrow="FAQ" title="Quick answers" />

          <div className="mx-auto mt-8 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:divide-slate-800">
            {[
              {
                q: "Is PathoLogix aligned with the NREMT?",
                a: "Yes. Scenarios, distractors, and rationale style are designed to reflect NREMT conventions while focusing on clinical reasoning.",
              },
              {
                q: "Can I practice specific domains?",
                a: "Absolutely. Create decks by domain (Trauma, Cardiology, Airway, etc.), or run adaptive sets targeting your weak areas.",
              },
              {
                q: "Exam mode vs Learn mode?",
                a: "Exam mode hides cues until you submit and adds a timer. Learn mode reveals just‑in‑time hints and step‑by‑step reasoning.",
              },
            ].map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-medium  hover:bg-white/60 ">
                  {f.q}
                  <ArrowRight className="transition group-open:rotate-90" size={16} />
                </summary>
                <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">{f.a}</div>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-8 text-center text-xs  dark:border-slate-800 ">
        <Container>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div>© {new Date().getFullYear()} PathoLogix — Practice scenarios for EMTs.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-700 dark:hover:text-emerald-400">Privacy</a>
              <a href="#" className="hover:text-slate-700 dark:hover:text-emerald-400">Terms</a>
              <a href="#" className="hover:text-slate-700 dark:hover:text-emerald-400">Contact</a>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}
