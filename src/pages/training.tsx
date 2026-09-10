import Link from "next/link";
import { ArrowRight, Ambulance, ClipboardCheck, BookOpen, Layers, Stethoscope, Siren, Activity } from "lucide-react";
import { AppShell, PageContainer } from "@/components/AppShell";
import Header from "@/components/Header";
import Seo from "@/components/Seo";

const paths = [
  { title: "Scenario Trainer", href: "/emtrainer", icon: ClipboardCheck, purpose: "Practice one clinical decision, then explore the cues and answer explanations.", access: "Try without an account", saving: "Sign in to save answers and study history." },
  { title: "SickCity", href: "/sickcity", icon: Ambulance, purpose: "Accept a dispatch, drive from the hospital garage, and continue into a full interactive clinical call.", access: "Keyboard or touch · 3D", saving: "Full clinical calls save simulation history when signed in. XP is kept on this device and syncs when signed in. Active shifts reset on reload." },
  { title: "EMT Scene", href: "/emtscene", icon: Activity, purpose: "Work through scene safety, assessment, interventions, and reassessment in an interactive call.", access: "Guided, scenario, or exam · 3D", saving: "Sign in to save completed simulation history." },
  { title: "MCI Triage", href: "/triage", icon: Siren, purpose: "Prioritize eight patients using rapid lifesaving actions and triage tags.", access: "Untimed learning or timed challenge · 3D", saving: "Sign in to save incident results." },
  { title: "Focused Exam Labs", href: "/focused-exams", icon: Stethoscope, purpose: "Explore ankle, knee, wrist and hand, and neurologic examinations with guided findings.", access: "Try without an account · 3D", saving: "Results are available for the current session." },
  { title: "NREMT Exam Mode", href: "/exam/nremt", icon: ClipboardCheck, purpose: "Practice pacing with timed question sets and review your results by domain.", access: "Sign-in required", saving: "Completed exams appear in your account history." },
  { title: "Flashcards", href: "/flashcards", icon: Layers, purpose: "Review key concepts by domain, reveal each answer, and move at your own pace.", access: "Try without an account", saving: "A quick recall activity, without a scored attempt history." },
  { title: "Learning Center", href: "/learn", icon: BookOpen, purpose: "Read source-backed guides, then put the concepts into practice.", access: "Read without an account", saving: "Open a guide whenever you need a refresher." },
];

export default function TrainingPage() {
  return <AppShell>
    <Seo title="Choose Your EMT Training" description="Find the right PathoLogix activity: clinical scenarios, SickCity, triage, exam labs, flashcards, and timed exam practice." path="/training" />
    <Header />
      <PageContainer>
        <div className="py-10 sm:py-14">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">Training paths</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950 dark:text-white">Choose your next practice.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">Start with a scenario for a quick decision, or take an interactive call into the field. Each activity below explains what you’ll practice and how results are saved.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {paths.map(({ icon: Icon, ...item }) => <article key={item.href} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#102329]">
              <Icon className="text-teal-700 dark:text-teal-300" size={26} aria-hidden />
              <h2 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h2>
              <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">{item.purpose}</p>
              <p className="mt-5 text-sm font-semibold text-teal-800 dark:text-teal-200">{item.access}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.saving}</p>
              <Link href={item.href} className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-teal-700 px-4 py-2 font-bold text-white hover:bg-teal-600">Open {item.title}<ArrowRight size={16} aria-hidden /></Link>
            </article>)}
          </div>
        </div>
      </PageContainer>
  </AppShell>;
}
