import Header from "@/components/Header";
import EMTScenarioTrainer from "@/components/EmtScenarioTrainer";
import { AppShell, PageContainer } from "@/components/AppShell";
import { Timer } from "lucide-react";
import Seo from "@/components/Seo";
import Link from "next/link";

export default function EMTTrainerPage() {
  return (
    <AppShell>
      <Seo
        title="EMT Scenario Trainer"
        description="Practice realistic EMT calls, identify critical patient cues, choose the best next action, and review the clinical reasoning."
        path="/emtrainer"
      />
      <Header />
      <PageContainer size="wide" className="space-y-4 !py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scenario Trainer</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Read the call, choose an answer, then review the reasoning.
            </p>
          </div>
          <Link href="/exam/nremt" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
            <Timer size={16} /> Timed exam mode
          </Link>
        </div>
        <EMTScenarioTrainer />
      </PageContainer>
    </AppShell>
  );
}
