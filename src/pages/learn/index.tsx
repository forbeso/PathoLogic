import { AppShell } from "@/components/AppShell";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { learnArticles } from "@/lib/learnArticles";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

const categoryStyles = {
  Assessment: "border-teal-200 bg-teal-50 text-teal-800",
  Medical: "border-rose-200 bg-rose-50 text-rose-800",
  "Exam preparation": "border-amber-200 bg-amber-50 text-amber-800",
};

const categoryIcons = {
  Assessment: Stethoscope,
  Medical: HeartPulse,
  "Exam preparation": Brain,
};

export default function LearnIndexPage() {
  return (
    <AppShell>
      <Seo
        title="EMT Learning Center"
        description="Practical, source-backed EMT study guides covering patient assessment, medical emergencies, and NREMT clinical judgment."
        path="/learn"
      />
      <Header />

      <main>
        <section className="border-b border-slate-800 bg-slate-950 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_320px] lg:items-end lg:px-8">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-sm font-bold text-teal-300">
                <BookOpenCheck size={17} />
                PathoLogix Learning Center
              </p>
              <h1 className="mt-4 text-4xl font-black sm:text-5xl">Build the reasoning behind the response.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Focused EMT study guides that connect assessment findings to priorities, actions, and
                scenario decisions.
              </p>
            </div>
            <div className="border-l border-slate-700 pl-5 text-sm leading-6 text-slate-300">
              Every guide links to current authoritative sources and a related PathoLogix practice
              experience.
            </div>
          </div>
        </section>

        <section className="border-b border-[#d4e5df] bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-4 sm:px-6 lg:px-8">
            {Object.keys(categoryStyles).map((category) => (
              <span
                key={category}
                className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                  categoryStyles[category as keyof typeof categoryStyles]
                }`}
              >
                {category}
              </span>
            ))}
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-sm font-bold text-teal-700">Start here</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">EMT study guides</h2>
              </div>
              <p className="hidden max-w-sm text-right text-sm leading-6 text-slate-600 md:block">
                Read one concept, then practice the same decision pattern in a scenario.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {learnArticles.map((article) => {
                const Icon = categoryIcons[article.category];
                return (
                  <article
                    key={article.slug}
                    className="group flex min-h-[260px] flex-col rounded-lg border border-[#c8dcd6] bg-white/90 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-bold ${
                          categoryStyles[article.category]
                        }`}
                      >
                        <Icon size={14} />
                        {article.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{article.readTime}</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold leading-8 text-slate-950">
                      <Link href={`/learn/${article.slug}`} className="outline-none focus:text-teal-700">
                        {article.shortTitle}
                      </Link>
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{article.description}</p>
                    <Link
                      href={`/learn/${article.slug}`}
                      className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-teal-700 transition group-hover:text-teal-600"
                    >
                      Read guide
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-[#d4e5df] bg-[#eaf6f2] py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-bold text-teal-800">
                <ShieldCheck size={17} />
                Educational use
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                These guides support EMT study and scenario practice. They do not replace an approved
                EMS course, current local protocols, medical direction, or hands-on instruction.
              </p>
            </div>
            <Link
              href="/emtrainer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Practice a scenario
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
